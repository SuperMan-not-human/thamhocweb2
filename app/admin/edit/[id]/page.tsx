import { prisma } from '@/lib/prisma';
import { updatePostAction } from '@/app/admin/create/actions';
import TextEditor from '@/app/admin/components/TextEditor';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) notFound();

  // Bind sẵn ID bài viết vào Server Action
  const updatePostWithId = updatePostAction.bind(null, post.id);

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
        &larr; Quay lại trang chủ
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Chỉnh sửa bài viết</h1>

      <form action={updatePostWithId} className="space-y-6 bg-white p-6 rounded-xl border">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tiêu đề bài viết
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={post.title}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung bài viết</label>
          <TextEditor defaultValue={post.content} />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            name="published"
            defaultChecked={post.published}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label htmlFor="published" className="text-sm text-gray-700 select-none">
            Xuất bản
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Lưu thay đổi
        </button>
      </form>
    </main>
  );
}