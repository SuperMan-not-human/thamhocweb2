import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { deletePostAction } from '@/app/admin/create/actions';
import { addCommentAction } from '@/app/auth/actions';
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
      comments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!post) notFound();

  const session = await auth();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === 'admin';
  const isLoggedIn = !!session?.user;

  const deletePostWithId = deletePostAction.bind(null, post.id);
  const addCommentWithPost = session?.user?.id
    ? addCommentAction.bind(null, post.id, session.user.id)
    : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      {/* Thanh điều hướng */}
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Quay lại trang chủ
        </Link>

        {/* Cụm nút Quản lý — chỉ hiện với admin */}
        {isAdmin && (
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/edit/${post.id}`}
              className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              ✏️ Sửa bài
            </Link>
            <form action={deletePostWithId}>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                onClick={(e) => {
                  if (!confirm('Bạn có chắc muốn xóa bài viết này không?')) e.preventDefault();
                }}
              >
                🗑 Xóa bài
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Nội dung bài viết */}
      <article>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-4 border-b">
          <span>Tác giả: <strong>{post.author.name || 'Ẩn danh'}</strong></span>
          <span>•</span>
          <span>Ngày đăng: {new Date(post.createdAt).toLocaleDateString('vi-VN')}</span>
        </div>

        <div
          className="prose max-w-none text-gray-800 leading-relaxed mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {/* Khu vực Bình luận */}
      <section className="border-t pt-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Bình luận ({post.comments.length})
        </h2>

        {/* Form thêm bình luận */}
        {isLoggedIn && addCommentWithPost ? (
          <form action={addCommentWithPost} className="mb-8">
            <textarea
              name="content"
              required
              rows={3}
              placeholder="Viết bình luận của bạn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
            <button
              type="submit"
              className="mt-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Gửi bình luận
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Đăng nhập
            </Link>{' '}
            hoặc{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
              tạo tài khoản
            </Link>{' '}
            để bình luận.
          </div>
        )}

        {/* Danh sách bình luận */}
        {post.comments.length === 0 ? (
          <p className="text-gray-400 text-sm">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        ) : (
          <div className="space-y-4">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0">
                  {comment.user.name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">
                      {comment.user.name || 'Ẩn danh'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}