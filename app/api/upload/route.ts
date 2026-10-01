import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Các loại file ảnh được phép upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { error: 'Không tìm thấy file ảnh.' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: 'Chỉ cho phép upload ảnh (JPG, PNG, GIF, WebP).' },
        { status: 400 }
      );
    }

    // Kiểm tra kích thước
    if (file.size > MAX_SIZE) {
      return Response.json(
        { error: 'Kích thước ảnh không được vượt quá 5MB.' },
        { status: 400 }
      );
    }

    // Tạo tên file unique
    const ext = path.extname(file.name) || '.jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Đảm bảo thư mục uploads tồn tại
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Ghi file vào thư mục public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // Trả về URL của ảnh
    const imageUrl = `/uploads/${uniqueName}`;
    return Response.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Đã xảy ra lỗi khi upload ảnh.' },
      { status: 500 }
    );
  }
}
