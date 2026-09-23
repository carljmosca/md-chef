import React from 'react';
import { BookOpen, Sparkles, ShoppingBag, Heart, Settings } from 'lucide-react';
import { useShopping } from '../../context/ShoppingContext';

interface BottomNavProps {
  currentTab: 'recipes' | 'meals' | 'shopping' | 'favorites' | 'settings';
  setCurrentTab: (tab: 'recipes' | 'meals' | 'shopping' | 'favorites' | 'settings') => void;
}

interface TabItem {
  id: 'recipes' | 'meals' | 'shopping' | 'favorites' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { totalCount, checkedCount } = useShopping();
  const uncompletedCount = totalCount - checkedCount;

  const tabs: TabItem[] = [
    { id: 'recipes', label: 'Recipes', icon: BookOpen },
    { id: 'meals', label: 'Meal Ideas', icon: Sparkles },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBag, badge: uncompletedCount > 0 ? uncompletedCount : undefined },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg border-t border-stone-200 dark:border-stone-800 pb-safe shadow-lg">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-brand-600 text-white text-[10px] font-bold rounded-full px-1 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
