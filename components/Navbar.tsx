import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/actions';
import { GraduationCap } from 'lucide-react';

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 text-blue-600 font-bold text-xl tracking-tight">
            <GraduationCap className="w-8 h-8" />
            <span>ExamSphere</span>
          </Link>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  href={user.role === 'STUDENT' ? '/dashboard/student' : '/dashboard/admin'}
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                <form action={logout}>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium">Log in</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
