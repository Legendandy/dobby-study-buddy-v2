'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  User, 
  Settings, 
  History, 
  Trophy, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { StorageManager } from '@/lib/storage';
import type { User as UserType } from '@/lib/types';

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setUser(StorageManager.getUser());
  }, []);

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/settings', label: 'Settings', icon: Settings },
    { href: '/history', label: 'Quiz History', icon: History },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
        ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        w-64
      `}>
        <div className="flex flex-col h-full">
          {/* User info and XP */}
          <div className="p-6 border-b border-gray-200">
            {isCollapsed ? (
              /* Collapsed state - just the expand button */
              <div className="flex justify-center">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen size={18} />
                </button>
              </div>
            ) : (
              /* Expanded state - user info with collapse button */
              <>
                <div className="flex items-center justify-between mb-4">
                  <Link 
                    href="/dashboard"
                    className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer flex-1"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.xp} XP</p>
                    </div>
                  </Link>
                  
                  {/* Collapse Button (Desktop only) */}
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ml-2"
                    title="Collapse sidebar"
                  >
                    <PanelLeftClose size={18} />
                  </button>
                </div>
                
                {/* XP Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((user.xp % 100) / 100 * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Level {Math.floor(user.xp / 100) + 1}
                </p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                        ${pathname === item.href 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      onClick={() => setIsMobileOpen(false)}
                      title={isCollapsed ? item.label : ''}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                StorageManager.clearAllData();
                window.location.href = '/';
              }}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? 'Logout' : ''}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}