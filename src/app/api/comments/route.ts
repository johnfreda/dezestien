import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createMentionNotifications, createReplyNotification } from '@/lib/notifications';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });

  // Haal alle comments op (zowel top-level als replies)
  const allComments = await prisma.comment.findMany({
    where: { articleSlug: slug },
    include: { 
      user: { select: { id: true, name: true, image: true } },
      replies: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            include: {
              user: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter alleen top-level comments (geen parent)
  const topLevelComments = allComments.filter(c => !c.parentCommentId);

  return NextResponse.json({ comments: topLevelComments }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { slug, content, parentCommentId } = await req.json();

  if (!slug || !content) {
    return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 });
  }

  // Haal user data op voor notificaties
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true }
  });

  // Transactie: Comment maken + Mana geven + Loggen
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        content,
        articleSlug: slug,
        userId: session.user.id,
        parentCommentId: parentCommentId || null,
      },
      include: { 
        user: { select: { name: true, image: true } },
        parentComment: parentCommentId ? {
          select: {
            id: true,
            user: { select: { id: true, name: true } }
          }
        } : undefined
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { mana: { increment: 50 } }
    }),
    prisma.manaLog.create({
      data: {
        userId: session.user.id,
        amount: 50,
        reason: 'Comment geplaatst'
      }
    })
  ]);

  // Maak notificaties aan (async, niet blokkerend)
  const actorId = session.user.id;
  (async () => {
    try {
      // Notificatie voor mentions
      await createMentionNotifications(
        content,
        actorId,
        user?.name || null,
        'comment',
        comment.id,
        slug,
        undefined,
        parentCommentId || undefined,
        undefined
      );

      // Notificatie voor reply (als het een reply is)
      if (parentCommentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentCommentId },
          select: { userId: true }
        });
        
        if (parentComment && parentComment.userId !== actorId) {
          await createReplyNotification(
            parentComment.userId,
            actorId,
            user?.name || null,
            'comment',
            comment.id,
            slug,
            undefined,
            parentCommentId,
            undefined
          );
        }
      }
    } catch (err) {
      console.error('Error creating notifications:', err);
      // Don't fail the request if notifications fail
    }
  })();

  return NextResponse.json({ comment, manaEarned: 50 });
}
