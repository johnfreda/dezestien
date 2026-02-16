import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// PUT: Ban/unban een user (alleen ADMIN)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check of gebruiker ADMIN is
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang. Alleen admins kunnen users bannen.' }, { status: 403 });
    }

    const { id } = await params;
    const { action, reason } = await req.json(); // action: 'ban' of 'unban'

    if (!action || !['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'Ongeldige actie. Gebruik "ban" of "unban"' }, { status: 400 });
    }

    // Check of user bestaat
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User niet gevonden' }, { status: 404 });
    }

    if (action === 'ban') {
      // Ban user en voeg email toe aan banned list
      await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            bannedBy: session.user.id
          }
        }),
        prisma.bannedEmail.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            reason: reason || null,
            bannedBy: session.user.id
          },
          update: {
            reason: reason || null,
            bannedBy: session.user.id
          }
        })
      ]);
    } else {
      // Unban user en verwijder van banned list
      await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: {
            isBanned: false,
            bannedAt: null,
            bannedBy: null
          }
        }),
        prisma.bannedEmail.deleteMany({
          where: { email: user.email }
        })
      ]);
    }

    // Haal updated user op
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        mana: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            forumTopics: true,
            forumReplies: true,
            ratings: true,
          }
        }
      }
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error banning/unbanning user:', error);
    return NextResponse.json({ error: 'Fout bij ban/unban user' }, { status: 500 });
  }
}

// DELETE: Verwijder een user volledig (alleen ADMIN)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check of gebruiker ADMIN is
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang. Alleen admins kunnen users verwijderen.' }, { status: 403 });
    }

    const { id } = await params;

    // Check of user bestaat
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User niet gevonden' }, { status: 404 });
    }

    // Voorkom dat admin zichzelf verwijdert
    if (user.id === session.user.id) {
      return NextResponse.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 });
    }

    // Verwijder user (cascade verwijdert ook alle gerelateerde data)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Fout bij verwijderen user' }, { status: 500 });
  }
}
