import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth-provider';
import { RequireAuth } from '@/components/require-auth';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '商业综合体消防智能监控平台',
    template: '%s | 智慧消防监控平台',
  },
  description: '商业综合体可燃气体探测器+火灾自动报警一体化智能监控平台',
  keywords: ['消防监控', '智慧消防', '可燃气体报警', '火灾报警', '商业综合体'],
};

// 应用根布局
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0A0A0A] antialiased">
        <AuthProvider>
          <RequireAuth>
            {children}
          </RequireAuth>
        </AuthProvider>
      </body>
    </html>
  );
}
