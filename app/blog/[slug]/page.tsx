import { prisma } from '@/lib/prisma';
import { deletePostAction } from '@/app/admin/create/actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      comments: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!post) notFound();

  const deletePostWithId = deletePostAction.bind(null, post.id);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Quay lại trang chủ
        </Link>

        {/* Cụm nút Quản lý bài viết */}
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/edit/${post.id}`}
            className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
          >
            Sửa bài
          </Link>

          <form action={deletePostWithId}>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Xóa bài
            </button>
          </form>
        </div>
      </div>

      <article>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b">
          <span>Tác giả: <strong>{post.author.name || 'Ẩn danh'}</strong></span>
          <span>•</span>
          <span>Ngày đăng: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>

        {/* Hiển thị nội dung hỗ trợ thẻ HTML định dạng */}
        <div
          className="prose max-w-none text-gray-800 leading-relaxed mb-12 whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Khu vực Bình luận */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Bình luận ({post.comments.length})
        </h2>
        {/* ... giữ nguyên phần hiển thị comment cũ ... */}
      </section>
    </main>
  );
}