import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Truy vấn danh sách bài viết từ Supabase qua Prisma
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      {/* Header trang web kèm nút Viết bài mới */}
      <header className="mb-10 pb-6 border-b flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tham Học Web Blog</h1>
          <p className="text-gray-600">Góc chia sẻ của Phát</p>
        </div>

        <Link
          href="/admin/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + Viết bài mới
        </Link>
      </header>

      {/* Danh sách bài viết */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bài viết mới nhất</h2>

        {posts.length === 0 ? (
          <p className="text-gray-500">Chưa có bài viết nào.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="p-6 border rounded-xl hover:shadow-md transition bg-white">
              <h3 className="text-xl font-bold text-blue-600 hover:underline mb-2">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="text-gray-600 line-clamp-2 mb-4">{post.content}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Tác giả: <strong>{post.author.name || 'Ẩn danh'}</strong></span>
                <span>💬 {post._count.comments} bình luận</span>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}