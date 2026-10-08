import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'tanfatese@admin.com';
  const adminPassword = 'Ph@t15052006';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    // Cập nhật role và password nếu cần
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'admin',
        passwordHash: await bcrypt.hash(adminPassword, 12),
        name: 'Phát (Admin)',
      },
    });
    console.log('✅ Đã cập nhật tài khoản admin:', adminEmail);
  } else {
    await prisma.user.create({
      data: {
        name: 'Phát (Admin)',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'admin',
      },
    });
    console.log('✅ Đã tạo tài khoản admin:', adminEmail);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });