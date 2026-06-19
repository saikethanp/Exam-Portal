import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

import ToastProvider from '@/components/ToastProvider';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'ETHNOTECH | Intelligent Assessment Infrastructure',
  description: 'Enterprise-grade assessment infrastructure designed for universities, institutions, training organizations, and modern education ecosystems. Powered by ETHNOTECH.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <ToastProvider>

          <main className="flex-grow page-enter">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
