'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Hàm kiểm tra quyền admin — dùng ở mọi action
async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized: Bạn không có quyền thực hiện thao tác này.');
  }
  return session;
}

// Hàm hỗ trợ tạo Slug từ tiêu đề
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Action Tạo bài viết
export async function createPostAction(formData: FormData) {
  const session = await requireAdmin();

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'on';

  if (!title || !content) {
    throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung.');
  }

  let slug = slugify(title);
  const existingPost = await prisma.post.findUnique({ where: { slug } });
  if (existingPost) {
    slug = `${slug}-${Date.now()}`;
  }

  await prisma.post.create({
    data: {
      title,
      slug,
      content,
      published,
      authorId: session.user!.id!,
    },
  });

  revalidatePath('/');
  redirect('/');
}

// 2. Action Cập nhật bài viết
export async function updatePostAction(postId: string, formData: FormData) {
  await requireAdmin();

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'on';

  if (!title || !content) {
    throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung.');
  }

  await prisma.post.update({
    where: { id: postId },
    data: { title, content, published },
  });

  revalidatePath('/');
  revalidatePath(`/blog/${postId}`);
  redirect('/');
}

// 3. Action Xóa bài viết
export async function deletePostAction(postId: string) {
  await requireAdmin();

  await prisma.comment.deleteMany({ where: { postId } });
  await prisma.post.delete({ where: { id: postId } });

  revalidatePath('/');
  redirect('/');
}