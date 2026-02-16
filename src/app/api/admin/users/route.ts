import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET: Haal alle users op (alleen ADMIN)
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check of gebruiker ADMIN is
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang. Alleen admins kunnen users bekijken.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Fout bij ophalen users' }, { status: 500 });
  }
}

// PUT: Update user role (alleen ADMIN)
export async function PUT(req: Request) {
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
      return NextResponse.json({ error: 'Geen toegang. Alleen admins kunnen rollen wijzigen.' }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID en role zijn verplicht' }, { status: 400 });
    }

    const validRoles = ['USER', 'MODERATOR', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Ongeldige role. Geldige rollen: USER, MODERATOR, ADMIN' }, { status: 400 });
    }

    // Check of user bestaat
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User niet gevonden' }, { status: 404 });
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        mana: true,
        role: true,
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
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Fout bij bijwerken user role' }, { status: 500 });
  }
}
