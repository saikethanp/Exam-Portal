import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/actions';

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group" id="navbar-logo">
            <div className="w-8 h-8 flex-shrink-0">
              <img src="/ethnotech.png" alt="Ethnotech Academy Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">
              ETHNOTECH
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href={user.role === 'STUDENT' ? '/dashboard/student' : '/dashboard/admin'}
                  className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors"
                >
                  Dashboard
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #6366F1 100%)',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                  }}
                >
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
