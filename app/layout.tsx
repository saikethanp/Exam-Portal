import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import ToastProvider from '@/components/ToastProvider';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'ExamSphere | Production Ready Online Examination Portal',
  description: 'A premium SaaS online examination portal featuring intelligent anti-cheat mechanisms, detailed analytics, and seamless exam management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <ToastProvider>
          <Navbar />
          <main className="flex-grow page-enter">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
