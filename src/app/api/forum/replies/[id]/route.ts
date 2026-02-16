import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// PUT: Update een forum reply (alleen eigenaar)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { id } = await params;
    const { content } = await req.json();

    if (!content || content.length < 3) {
      return NextResponse.json({ error: 'Inhoud moet minimaal 3 tekens zijn' }, { status: 400 });
    }

    // Check of reply bestaat en gebruiker is eigenaar
    const reply = await prisma.forumReply.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!reply) {
      return NextResponse.json({ error: 'Reactie niet gevonden' }, { status: 404 });
    }

    if (reply.userId !== session.user.id) {
      return NextResponse.json({ error: 'Je kunt alleen je eigen reacties bewerken' }, { status: 403 });
    }

    // Update reply
    const updatedReply = await prisma.forumReply.update({
      where: { id },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    return NextResponse.json({ reply: updatedReply });
  } catch (error: any) {
    console.error('Error updating reply:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken reactie' }, { status: 500 });
  }
}

// DELETE: Verwijder een forum reply (alleen eigenaar)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { id } = await params;

    // Check of reply bestaat en gebruiker is eigenaar of moderator/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const reply = await prisma.forumReply.findUnique({
      where: { id },
      include: { 
        user: { select: { id: true } },
        topic: { select: { id: true } }
      }
    });

    if (!reply) {
      return NextResponse.json({ error: 'Reactie niet gevonden' }, { status: 404 });
    }

    // Check rechten: eigenaar OF moderator/admin
    const isOwner = reply.userId === session.user.id;
    const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
    
    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: 'Je hebt geen rechten om deze reactie te verwijderen' }, { status: 403 });
    }

    const isTopLevel = !reply.parentReplyId;

    // Transactie: Verwijder reply + Update topic count (als top-level)
    await prisma.$transaction(async (tx) => {
      await tx.forumReply.delete({
        where: { id }
      });

      // Alleen topic count updaten als het een top-level reply was
      if (isTopLevel) {
        await tx.forumTopic.update({
          where: { id: reply.topicId },
          data: {
            replyCount: { decrement: 1 }
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting reply:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen reactie' }, { status: 500 });
  }
}
