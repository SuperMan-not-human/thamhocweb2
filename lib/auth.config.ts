import { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');

      if (isAdminRoute) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as { role?: string })?.role;
        return role === 'admin';
      }
      return true;
    },
  },
  providers: [], // Được điền trong lib/auth.ts
};
