import React from 'react';
import { Home, Music2, Search, Library, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type NavTabId = 'home' | 'music' | 'search' | 'library' | 'profile';

interface BottomNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { isDark } = useTheme();

  const getActiveTab = (): NavTabId => {
    if (currentPath === '/' || currentPath === '/home') return 'home';
    if (currentPath.startsWith('/music') || currentPath.startsWith('/song/')) return 'music';
    if (currentPath.startsWith('/search')) return 'search';
    if (currentPath.startsWith('/library') || currentPath.startsWith('/purchases')) return 'library';
    if (
      currentPath.startsWith('/profile') ||
      currentPath.startsWith('/account') ||
      currentPath.startsWith('/pricing') ||
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/artist')
    ) {
      return 'profile';
    }
    return 'home';
  };

  const activeTab = getActiveTab();

  const navItems = [
    {
      id: 'home' as NavTabId,
      label: 'Home',
      path: '/',
      icon: Home,
    },
    {
      id: 'music' as NavTabId,
      label: 'Music',
      path: '/music',
      icon: Music2,
    },
    {
      id: 'search' as NavTabId,
      label: 'Search',
      path: '/search',
      icon: Search,
    },
    {
      id: 'library' as NavTabId,
      label: 'Library',
      path: '/library',
      icon: Library,
    },
    {
      id: 'profile' as NavTabId,
      label: 'Profile',
      path: '/profile',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 transition-colors backdrop-blur-lg border-t ${
        isDark
          ? 'bg-[#11151F]/95 border-slate-800 text-[#9CA3AF]'
          : 'bg-white/95 border-[#E5E7EB] text-[#667085]'
      } pb-safe`}
    >
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-2">
        <div className="grid grid-cols-5 items-center h-16">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={`relative flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-all select-none active:scale-95 ${
                  isActive
                    ? 'text-[#1455D9] font-bold'
                    : isDark
                    ? 'hover:text-white'
                    : 'hover:text-[#111827]'
                }`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1455D9]" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-tight transition-colors ${
                    isActive ? 'text-[#1455D9] font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
