import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Đang dọn dẹp dữ liệu cũ...');
  // Xóa theo đúng thứ tự phụ phụ thuộc: Comment -> Post -> User
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🌱 Đang tạo dữ liệu mẫu mới...');

  // 1. Tạo User trước
  const user = await prisma.user.create({
    data: {
      email: 'duongtanphat@example.com',
      name: 'Dương Tấn Phát',
    },
  });

  // 2. Tạo Posts liên kết với User
  const post1 = await prisma.post.create({
    data: {
      title: 'Bài viết đầu tiên về Next.js và Prisma',
      slug: 'bai-viet-dau-tien-ve-nextjs-va-prisma',
      content: 'Đây là nội dung bài viết thử nghiệm. Chúng ta đang học cách thao tác với PostgreSQL thông qua Prisma ORM!',
      published: true,
      authorId: user.id,
    },
  });

  await prisma.post.create({
    data: {
      title: 'Hướng dẫn thiết kế Database cho Blog',
      slug: 'huong-dan-thiet-ke-database-cho-blog',
      content: 'Mô hình CSDL quan hệ giúp chúng ta dễ dàng quản lý tác giả, bài viết và bình luận...',
      published: true,
      authorId: user.id,
    },
  });

  // 3. Tạo Comment liên kết với Post và User
  await prisma.comment.create({
    data: {
      content: 'Bài viết rất hay và dễ hiểu!',
      postId: post1.id,
      userId: user.id,
    },
  });

  console.log('✅ Đã nạp dữ liệu mẫu thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });