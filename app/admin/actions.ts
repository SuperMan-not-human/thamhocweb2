'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

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

// 1. Action Tạo bài viết (Hàm cũ của bạn)
export async function createPostAction(formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get('isAdmin')?.value !== 'true') throw new Error('Unauthorized');

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

  const defaultAuthor = await prisma.user.findFirst();
  if (!defaultAuthor) {
    throw new Error('Chưa có User nào trong Database.');
  }

  await prisma.post.create({
    data: {
      title,
      slug,
      content,
      published,
      authorId: defaultAuthor.id,
    },
  });

  revalidatePath('/');
  redirect('/');
}

// 2. Action Cập nhật bài viết (Thêm mới)
export async function updatePostAction(postId: string, formData: FormData) {
  const cookieStore = await cookies();
  if (cookieStore.get('isAdmin')?.value !== 'true') throw new Error('Unauthorized');

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'on';

  if (!title || !content) {
    throw new Error('Vui lòng điền đầy đủ tiêu đề và nội dung.');
  }

  await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      content,
      published,
    },
  });

  revalidatePath('/');
  revalidatePath(`/blog/${postId}`);
  redirect('/');
}

// 3. Action Xóa bài viết (Thêm mới)
export async function deletePostAction(postId: string) {
  const cookieStore = await cookies();
  if (cookieStore.get('isAdmin')?.value !== 'true') throw new Error('Unauthorized');

  // Xóa các bình luận liên quan trước để tránh vướng khóa ngoại
  await prisma.comment.deleteMany({
    where: { postId },
  });

  // Xóa bài viết
  await prisma.post.delete({
    where: { id: postId },
  });

  revalidatePath('/');
  redirect('/');
}