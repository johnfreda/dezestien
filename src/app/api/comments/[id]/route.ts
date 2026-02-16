import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// PUT: Update een comment (alleen eigenaar)
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

    // Check of comment bestaat en gebruiker is eigenaar
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment niet gevonden' }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Je kunt alleen je eigen reacties bewerken' }, { status: 403 });
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: { user: { select: { name: true, image: true } } }
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken reactie' }, { status: 500 });
  }
}

// DELETE: Verwijder een comment (alleen eigenaar)
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

    // Check of comment bestaat en gebruiker is eigenaar of moderator/admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment niet gevonden' }, { status: 404 });
    }

    // Check rechten: eigenaar OF moderator/admin
    const isOwner = comment.userId === session.user.id;
    const isModerator = user?.role === 'MODERATOR' || user?.role === 'ADMIN';
    
    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: 'Je hebt geen rechten om deze reactie te verwijderen' }, { status: 403 });
    }

    // Verwijder comment (cascade verwijdert ook replies)
    await prisma.comment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen reactie' }, { status: 500 });
  }
}
