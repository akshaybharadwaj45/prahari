import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, TestTube, Activity, Settings, Sun, Moon, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'OVERVIEW', href: '/', icon: LayoutDashboard },
  { name: 'EVENT ARCHIVE', href: '/events', icon: List },
  { name: 'EVENT LAB', href: '/events/0', icon: TestTube },
  { name: 'LEO GLOBE', href: '/globe', icon: Globe },
  { name: 'MODEL LAB', href: '/model-lab', icon: Activity },
  { name: 'SETTINGS', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  const handleToggleTheme = () => {
    const isNowLight = document.documentElement.classList.toggle('light');
    setIsLight(isNowLight);
    localStorage.setItem('prahari_theme', isNowLight ? 'light' : 'dark');
  };

  return (
    <div className="w-64 bg-surface border-r border-border h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-accent font-mono font-bold tracking-wider text-sm flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          PRAHARI
        </h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          // Special case for event lab active state
          const isActive = item.href === '/events/0' 
            ? location.pathname.startsWith('/events/') && location.pathname !== '/events'
            : location.pathname === item.href;
            
          return (
            <Link
              key={item.name}
              to={item.href}
              className={twMerge(
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive 
                    ? 'bg-accent/10 text-accent' 
                    : 'text-textSecondary hover:bg-surfaceHover hover:text-textPrimary'
                )
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border bg-surfaceHover/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-textPrimary">{user?.username || 'Mission Operator'}</p>
            <p className="text-xs text-textSecondary capitalize">{user?.role || 'Flight Dynamics'}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleToggleTheme}
              className="p-1.5 text-textSecondary hover:text-accent hover:bg-accent/10 rounded-md transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="text-xs text-textSecondary font-mono flex justify-between pt-2 border-t border-border/50">
          <span>v2.0.0</span>
          <span className="text-accent font-bold">ONLINE</span>
        </div>
      </div>
    </div>
  );
}
