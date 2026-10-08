import { createPostAction } from './actions';
import TextEditor from '../components/TextEditor';
import Link from 'next/link';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function CreatePostPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    redirect('/');
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Quay lại trang chủ
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tạo bài viết mới</h1>

      <form action={createPostAction} className="space-y-6 bg-white p-6 rounded-xl border">
        {/* Nhập tiêu đề */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề bài viết
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            placeholder="Ví dụ: Hướng dẫn sử dụng TextEditor trong Next.js"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
          />
        </div>

        {/* Nhập nội dung - Đã thay bằng TextEditor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung bài viết
          </label>
          <TextEditor />
        </div>

        {/* Tùy chọn Xuất bản */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            name="published"
            defaultChecked
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="published" className="text-sm text-gray-700 select-none">
            Xuất bản ngay (Hiển thị ra trang chủ)
          </label>
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Đăng bài viết
        </button>
      </form>
    </main>
  );
}