'use server';

import { prisma } from '@/lib/prisma';
import { signIn, signOut, auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

// ── Đăng ký tài khoản người dùng ──────────────────────────────────
export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'Vui lòng điền đầy đủ thông tin.' };
  }
  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email này đã được đăng ký.' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash, role: 'user' },
  });

  // Tự đăng nhập ngay sau khi đăng ký
  await signIn('credentials', { email, password, redirectTo: '/' });
}

// ── Đăng nhập ─────────────────────────────────────────────────────
export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', { email, password, redirectTo: '/' });
  } catch {
    return { error: 'Email hoặc mật khẩu không đúng.' };
  }
}

// ── Đăng xuất ─────────────────────────────────────────────────────
export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}

export async function addCommentAction(postId: string, userId: string, formData: FormData) {
  const content = (formData.get('content') as string)?.trim();

  if (!content) return; // Must return void when passed directly to form action

  await prisma.comment.create({
    data: { content, postId, userId },
  });

  revalidatePath(`/`, 'layout');
}

// ── Xóa bình luận (chỉ admin) ─────────────────────────────────────
export async function deleteCommentAction(commentId: string) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    throw new Error('Unauthorized');
  }
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/`, 'layout');
}
