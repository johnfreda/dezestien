import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createMentionNotifications, createReplyNotification } from '@/lib/notifications';

// GET: Haal replies op voor een topic (iedereen kan lezen)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get('topicId');

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID vereist' }, { status: 400 });
    }

    // Haal alle replies op (zowel top-level als nested)
    const allReplies = await prisma.forumReply.findMany({
      where: { topicId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  }
                },
                replies: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      }
                    }
                  },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    // Filter alleen top-level replies (geen parent)
    const topLevelReplies = allReplies.filter(r => !r.parentReplyId);

    return NextResponse.json({ replies: topLevelReplies }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error('Error fetching replies:', error);
    return NextResponse.json({ error: 'Fout bij ophalen replies' }, { status: 500 });
  }
}

// POST: Maak een nieuwe reply (alleen ingelogd)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Je moet ingelogd zijn om te reageren' }, { status: 401 });
    }

    const { topicId, content, parentReplyId } = await req.json();

    if (!topicId || !content) {
      return NextResponse.json({ error: 'Topic ID en inhoud zijn verplicht' }, { status: 400 });
    }

    if (content.length < 3) {
      return NextResponse.json({ error: 'Reactie moet minimaal 3 tekens zijn' }, { status: 400 });
    }

    // Als het een reply op een reply is, check of de parent bestaat
    if (parentReplyId) {
      const parentReply = await prisma.forumReply.findUnique({
        where: { id: parentReplyId }
      });
      if (!parentReply) {
        return NextResponse.json({ error: 'Parent reactie niet gevonden' }, { status: 404 });
      }
    }

    // Check of topic bestaat en niet gelocked is
    const topic = await prisma.forumTopic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic niet gevonden' }, { status: 404 });
    }

    if (topic.isLocked) {
      return NextResponse.json({ error: 'Dit topic is gesloten' }, { status: 403 });
    }

    // Haal user data op voor notificaties
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    });

    // Transactie: Reply maken + Topic updaten (alleen als top-level) + Mana geven + Loggen
    const isTopLevel = !parentReplyId;
    const transactionOps: any[] = [
      prisma.forumReply.create({
        data: {
          content,
          topicId,
          userId: session.user.id,
          parentReplyId: parentReplyId || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          },
          parentReply: parentReplyId ? {
            select: {
              id: true,
              user: { select: { id: true, name: true } }
            }
          } : undefined
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { mana: { increment: 50 } }
      }),
      prisma.manaLog.create({
        data: {
          userId: session.user.id,
          amount: 50,
          reason: 'Forum reactie geplaatst'
        }
      })
    ];

    // Alleen topic updaten als het een top-level reply is
    if (isTopLevel) {
      transactionOps.push(
        prisma.forumTopic.update({
          where: { id: topicId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
          }
        })
      );
    }

    const results = await prisma.$transaction(transactionOps);
    const reply = results[0];

    // Maak notificaties aan (async, niet blokkerend)
    const actorId = session.user.id;
    (async () => {
      try {
        // Notificatie voor mentions
        await createMentionNotifications(
          content,
          actorId,
          user?.name || null,
          'forum_reply',
          reply.id,
          undefined,
          topicId,
          undefined,
          parentReplyId || undefined
        );

        // Notificatie voor reply (als het een reply is)
        if (parentReplyId) {
          const parentReply = await prisma.forumReply.findUnique({
            where: { id: parentReplyId },
            select: { userId: true }
          });
          
          if (parentReply && parentReply.userId !== actorId) {
            await createReplyNotification(
              parentReply.userId,
              actorId,
              user?.name || null,
              'forum_reply',
              reply.id,
              undefined,
              topicId,
              undefined,
              parentReplyId
            );
          }
        }
      } catch (err) {
        console.error('Error creating notifications:', err);
        // Don't fail the request if notifications fail
      }
    })();

    return NextResponse.json({ reply, manaEarned: 50 });
  } catch (error: any) {
    console.error('Error creating reply:', error);
    return NextResponse.json({ error: 'Fout bij aanmaken reactie' }, { status: 500 });
  }
}
