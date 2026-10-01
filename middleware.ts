import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Chỉ áp dụng bảo vệ cho các route bắt đầu bằng /admin
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get('authorization');
  
  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Kiểm tra tài khoản và mật khẩu
    if (user === 'tanfatese' && pwd === 'Ph@t15052006') {
      return NextResponse.next();
    }
  }

  // Yêu cầu xác thực nếu chưa đăng nhập hoặc sai thông tin
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
