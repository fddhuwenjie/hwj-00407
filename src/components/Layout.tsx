import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  User,
  Award,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const navItems = [
  { path: '/', label: '首页', icon: Home, roles: ['student', 'instructor'] },
  { path: '/my-courses', label: '我的课程', icon: BookOpen, roles: ['student', 'instructor'] },
  { path: '/profile', label: '个人中心', icon: User, roles: ['student', 'instructor'] },
  { path: '/verify', label: '证书验证', icon: Award, roles: ['student', 'instructor'] },
  { path: '/dashboard', label: '讲师后台', icon: BarChart3, roles: ['instructor'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, users, login, logout } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => currentUser && item.roles.includes(currentUser.role)
  );

  const handleUserSwitch = async (userId: number) => {
    await login(userId);
    setUserMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-800">学习平台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-blue-800 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 h-16 bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="relative">
              {currentUser ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-semibold text-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-900">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">
                      {currentUser.role === 'instructor' ? '讲师' : '学员'}
                    </div>
                  </div>
                  <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', userMenuOpen && 'rotate-180')} />
                </button>
              ) : (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="px-4 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  选择账号
                </button>
              )}

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">切换账号</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSwitch(user.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                          currentUser?.id === user.id && 'bg-blue-50'
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">
                            {user.role === 'instructor' ? '讲师' : '学员'} · {user.email}
                          </div>
                        </div>
                        {currentUser?.id === user.id && (
                          <div className="w-2 h-2 rounded-full bg-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                  {currentUser && (
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
}
