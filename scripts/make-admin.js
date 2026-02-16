const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin() {
  try {
    const email = 'johnfreda93@gmail.com';
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      console.error(`❌ User met email ${email} niet gevonden!`);
      process.exit(1);
    }

    console.log(`📧 User gevonden: ${user.name || 'Geen naam'} (${user.email})`);
    console.log(`🔐 Huidige role: ${user.role}`);

    // Update to ADMIN
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ User is nu ADMIN!`);
    console.log(`   - ID: ${updated.id}`);
    console.log(`   - Email: ${updated.email}`);
    console.log(`   - Role: ${updated.role}`);
    
  } catch (error) {
    console.error('❌ Fout:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();
