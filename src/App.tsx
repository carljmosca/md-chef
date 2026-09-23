import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { RecipeProvider, useRecipes } from './context/RecipeContext';
import { ShoppingProvider } from './context/ShoppingContext';
import { MealPlanProvider } from './context/MealPlanContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { RecipeGrid } from './components/recipes/RecipeGrid';
import { RecipeDetail } from './components/recipes/RecipeDetail';
import { CookingMode } from './components/cooking/CookingMode';
import { MealPlannerView } from './components/meals/MealPlannerView';
import { ShoppingListView } from './components/shopping/ShoppingListView';
import { SettingsView } from './components/settings/SettingsView';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { InstallPrompt } from './components/common/InstallPrompt';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'recipes' | 'meals' | 'shopping' | 'favorites' | 'settings'>('recipes');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const {
    activeRecipe,
    setActiveRecipe,
    activeCookingRecipe,
    setActiveCookingRecipe,
    toggleFavorite,
    setShowFavoritesOnly
  } = useRecipes();

  // Tab switch handler
  const handleTabChange = (tab: 'recipes' | 'meals' | 'shopping' | 'favorites' | 'settings') => {
    setActiveRecipe(null); // Return to list view
    if (tab === 'favorites') {
      setShowFavoritesOnly(true);
      setCurrentTab('recipes');
    } else {
      setShowFavoritesOnly(false);
      setCurrentTab(tab);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors pb-20 md:pb-8">
      {/* Top Header Navbar */}
      <Navbar
        currentTab={currentTab === 'favorites' ? 'recipes' : currentTab}
        setCurrentTab={(t) => handleTabChange(t)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeRecipe ? (
          <RecipeDetail
            recipe={activeRecipe}
            onBack={() => {
              setActiveRecipe(null);
              window.location.hash = '';
            }}
            onStartCooking={(r) => setActiveCookingRecipe(r)}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <>
            {currentTab === 'recipes' && (
              <RecipeGrid
                onSelectRecipe={(r) => {
                  setActiveRecipe(r);
                  window.location.hash = `#/recipe/${encodeURIComponent(r.path)}`;
                }}
                onCookRecipe={(r) => setActiveCookingRecipe(r)}
              />
            )}

            {currentTab === 'meals' && (
              <MealPlannerView
                onSelectRecipe={(r) => {
                  setActiveRecipe(r);
                  window.location.hash = `#/recipe/${encodeURIComponent(r.path)}`;
                }}
                onCookRecipe={(r) => setActiveCookingRecipe(r)}
              />
            )}

            {currentTab === 'shopping' && <ShoppingListView />}

            {currentTab === 'settings' && <SettingsView />}
          </>
        )}
      </main>

      {/* Cooking Mode (Fullscreen Modal Overlay) */}
      {activeCookingRecipe && (
        <CookingMode
          recipe={activeCookingRecipe}
          onExit={() => {
            setActiveCookingRecipe(null);
            if (window.location.hash.startsWith('#/cook/')) {
              window.location.hash = '';
            }
          }}
        />
      )}

      {/* Global Quick Search Modal (Cmd+K) */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectRecipe={(r) => {
          setActiveRecipe(r);
          window.location.hash = `#/recipe/${encodeURIComponent(r.path)}`;
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
      />

      {/* PWA Install Prompt Banner (iOS & Android) */}
      <InstallPrompt />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <RecipeProvider>
        <ShoppingProvider>
          <MealPlanProvider>
            <AppContent />
          </MealPlanProvider>
        </ShoppingProvider>
      </RecipeProvider>
    </SettingsProvider>
  );
};

export default App;

