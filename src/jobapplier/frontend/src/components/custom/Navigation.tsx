import { useApp } from '@/context/AppContext';
import type { Page } from '@/types';

interface NavItem {
  id: Page;
  label: string;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home' },
  { id: 'profile', label: 'Profile' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'jobs', label: 'Jobs' }
];

export function Navigation() {
  const { currentPage, setCurrentPage } = useApp();

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#1a1a1a] border-b border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-14">
          {/* Logo */}
          <div className="absolute left-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg 
                viewBox="0 0 24 24" 
                className="w-6 h-6 text-[#f5c518]"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                  ${currentPage === item.id 
                    ? 'text-white bg-[#2a2a2a]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#252525]'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
