import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ShoppingBag,
  Flame,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { webMCPRegistry } from '../../services/webmcp/registry.ts';
import { useRecipes } from '../../context/RecipeContext.tsx';
import type { Recipe } from '../../types/recipe.ts';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCall?: {
    name: string;
    input: any;
    result: any;
  };
  recipes?: Recipe[];
  actionType?: 'nutrition' | 'shopping' | 'mealplan' | 'search';
  timestamp: string;
}

interface AIChefViewProps {
  onSelectRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
  onNavigateToTab: (tab: 'recipes' | 'meals' | 'shopping' | 'settings') => void;
}

export const AIChefView: React.FC<AIChefViewProps> = ({
  onSelectRecipe,
  onCookRecipe,
  onNavigateToTab
}) => {
  const { recipes } = useRecipes();

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome! I am your **AI Chef**.\n\nI can help you search your recipe collection, analyze nutritional facts and calories, scale ingredients and add them directly to your grocery shopping list, or plan your weekly dinners.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Handle sample prompt chips
  const handleQuickPrompt = (prompt: string) => {
    setInputQuery(prompt);
    handleSend(prompt);
  };

  // Agentic handler executing WebMCP culinary tools
  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isProcessing) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    const lower = text.toLowerCase();

    try {
      // 1. Random recipe roulette
      if (lower.includes('random') || lower.includes('surprise') || lower.includes('what should i cook') || lower.includes('roulette')) {
        const toolResult = await webMCPRegistry.executeTool('get_random_recipe', {});
        const data = toolResult.content[0]?.data;
        const matched = recipes.find((r) => r.id === data.id);

        const msg: Message = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: `🎲 How about **${data.title}**? It's a flavorful **${data.difficulty}** ${data.category} dish that takes about **${data.cookTime}** to cook.`,
          toolCall: { name: 'get_random_recipe', input: {}, result: data },
          recipes: matched ? [matched] : undefined,
          actionType: 'search',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, msg]);
        setIsProcessing(false);
        return;
      }

      // 2. Nutrition analysis for a recipe
      if (lower.includes('nutrition') || lower.includes('calories') || lower.includes('healthy') || lower.includes('protein')) {
        const matchedRecipe = recipes.find(
          (r) => lower.includes(r.frontmatter.title.toLowerCase()) || lower.includes(r.id.toLowerCase())
        );
        if (matchedRecipe) {
          const toolResult = await webMCPRegistry.executeTool('analyze_recipe_nutrition', {
            recipeIdOrTitle: matchedRecipe.frontmatter.title,
            servings: matchedRecipe.frontmatter.servings || 4
          });
          const data = toolResult.content[0]?.data;

          const msg: Message = {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Here is the nutritional breakdown for **${matchedRecipe.frontmatter.title}** (${data.servings} servings):`,
            toolCall: {
              name: 'analyze_recipe_nutrition',
              input: { recipeIdOrTitle: matchedRecipe.frontmatter.title },
              result: data
            },
            recipes: [matchedRecipe],
            actionType: 'nutrition',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, msg]);
          setIsProcessing(false);
          return;
        }
      }

      // 3. Add to shopping list
      if (lower.includes('shopping') || lower.includes('grocery') || lower.includes('buy') || lower.includes('ingredients for')) {
        const matchedRecipe = recipes.find(
          (r) => lower.includes(r.frontmatter.title.toLowerCase()) || lower.includes(r.id.toLowerCase())
        );
        if (matchedRecipe) {
          const toolResult = await webMCPRegistry.executeTool('add_to_shopping_list', {
            recipeTitleOrId: matchedRecipe.frontmatter.title
          });
          const data = toolResult.content[0]?.data;

          const msg: Message = {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `🛒 Added **${data.addedCount} ingredients** for **${matchedRecipe.frontmatter.title}** to your shopping list, automatically sorted into grocery store aisles.`,
            toolCall: {
              name: 'add_to_shopping_list',
              input: { recipeTitleOrId: matchedRecipe.frontmatter.title },
              result: data
            },
            recipes: [matchedRecipe],
            actionType: 'shopping',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, msg]);
          setIsProcessing(false);
          return;
        }
      }

      // 4. Meal Planning / Scheduling
      if (lower.includes('plan') || lower.includes('schedule') || lower.includes('monday') || lower.includes('friday') || lower.includes('dinner')) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const matchedDay = days.find((d) => lower.includes(d.toLowerCase()));
        const matchedRecipe = recipes.find(
          (r) => lower.includes(r.frontmatter.title.toLowerCase()) || lower.includes(r.id.toLowerCase())
        );

        if (matchedDay && matchedRecipe) {
          const toolResult = await webMCPRegistry.executeTool('schedule_meal', {
            day: matchedDay,
            recipeTitleOrId: matchedRecipe.frontmatter.title
          });
          const data = toolResult.content[0]?.data;

          const msg: Message = {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `📅 Scheduled **${matchedRecipe.frontmatter.title}** for **${matchedDay}** dinner in your weekly meal calendar!`,
            toolCall: {
              name: 'schedule_meal',
              input: { day: matchedDay, recipeTitleOrId: matchedRecipe.frontmatter.title },
              result: data
            },
            recipes: [matchedRecipe],
            actionType: 'mealplan',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, msg]);
          setIsProcessing(false);
          return;
        }

        if (lower.includes('view') || lower.includes('show') || lower.includes('week')) {
          const toolResult = await webMCPRegistry.executeTool('get_meal_plan', {});
          const data = toolResult.content[0]?.data;

          const scheduled = data.days.filter((d: any) => d.recipes.length > 0);
          const summary =
            scheduled.length > 0
              ? scheduled.map((d: any) => `• **${d.day}**: ${d.recipes.map((r: any) => r.title).join(', ')}`).join('\n')
              : 'No meals scheduled yet for this week.';

          const msg: Message = {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `📅 **Current Weekly Dinner Schedule**:\n\n${summary}`,
            toolCall: { name: 'get_meal_plan', input: {}, result: data },
            actionType: 'mealplan',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, msg]);
          setIsProcessing(false);
          return;
        }
      }

      // 5. Default / Fallback: Keyword Recipe Search
      const cleanQuery = text
        .replace(/find|search|show me|recipes? with|recipes? for|how to make/gi, '')
        .trim();

      const toolResult = await webMCPRegistry.executeTool('search_recipes', {
        query: cleanQuery || text
      });
      const data = toolResult.content[0]?.data;

      const matchedIds = (data.matches || []).map((m: any) => m.id);
      const matchedRecipes = recipes.filter((r) => matchedIds.includes(r.id));

      const msg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content:
          data.totalMatches > 0
            ? `🔍 Found **${data.totalMatches} recipe${data.totalMatches === 1 ? '' : 's'}** matching "${cleanQuery || text}":`
            : `I couldn't find any recipes matching "${cleanQuery || text}". Try searching by cuisine (e.g. Italian, Asian, Mexican) or key ingredients (e.g. chicken, mushrooms, garlic).`,
        toolCall: {
          name: 'search_recipes',
          input: { query: cleanQuery || text },
          result: data
        },
        recipes: matchedRecipes,
        actionType: 'search',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, msg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error executing request: ${err?.message || String(err)}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Friendly Header Banner */}
      <div className="bg-gradient-to-br from-brand-600 via-amber-600 to-amber-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              AI Culinary Assistant
            </span>
          </div>

          <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight">
            AI Chef
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm max-w-xl leading-relaxed">
            Search your cookbook, analyze nutritional facts, build grocery shopping lists, and schedule meals hands-free.
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[650px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-stone-800 text-white dark:bg-stone-700'
                    : 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <span className="text-xs font-bold">You</span>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>

              {/* Message Body */}
              <div className="space-y-3 max-w-[85%]">
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {/* Nutrition Card Result */}
                {msg.actionType === 'nutrition' && msg.toolCall?.result && (
                  <div className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-700 pb-2">
                      <span className="font-bold text-xs text-stone-800 dark:text-stone-200">
                        Nutrition Facts per Serving
                      </span>
                      <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">
                        {msg.toolCall.result.perServing?.calories} kcal
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                        <span className="text-stone-400 text-[10px] block">Protein</span>
                        <span className="font-bold text-emerald-600">
                          {msg.toolCall.result.perServing?.protein}g
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                        <span className="text-stone-400 text-[10px] block">Carbs</span>
                        <span className="font-bold text-amber-600">
                          {msg.toolCall.result.perServing?.carbohydrates}g
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800">
                        <span className="text-stone-400 text-[10px] block">Fat</span>
                        <span className="font-bold text-rose-600">
                          {msg.toolCall.result.perServing?.fat}g
                        </span>
                      </div>
                    </div>

                    {msg.toolCall.result.dietaryHighlights?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.toolCall.result.dietaryHighlights.map((badge: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recipe Suggestion Cards */}
                {msg.recipes && msg.recipes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {msg.recipes.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700/80 rounded-2xl p-3 flex flex-col justify-between hover:border-brand-500 transition-all shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
                            <span className="font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider text-[10px]">
                              {r.category}
                            </span>
                            <span>{r.frontmatter.cook_time || '20m'}</span>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 mt-1 line-clamp-1">
                            {r.frontmatter.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-stone-100 dark:border-stone-700/60">
                          <button
                            onClick={() => onSelectRecipe(r)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 hover:bg-brand-500 hover:text-white transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onCookRecipe(r)}
                            className="p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                            title="Start Cooking"
                          >
                            <Flame className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Action Navigation Buttons */}
                {msg.actionType === 'shopping' && (
                  <button
                    onClick={() => onNavigateToTab('shopping')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Open Shopping List</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {msg.actionType === 'mealplan' && (
                  <button
                    onClick={() => onNavigateToTab('meals')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-3 py-1.5 rounded-xl border border-brand-200 dark:border-brand-800/60 hover:bg-brand-100 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>View Meal Calendar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 max-w-xl animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-stone-100 dark:bg-stone-800/80 rounded-2xl rounded-tl-none p-3.5 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                <span>Checking recipes and computing details...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompt Chips */}
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 border-t border-stone-100 dark:border-stone-800 overflow-x-auto flex items-center gap-2 no-scrollbar">
          <span className="text-[11px] uppercase tracking-wider text-stone-400 font-bold shrink-0 ml-1">
            Try:
          </span>
          {[
            '🥗 Analyze nutrition for Margherita Pizza',
            '🛒 Add ingredients for Chicken Marsala to shopping list',
            '⚡ Find high-protein, quick recipes',
            '📅 Plan dinner for Friday',
            '🎲 Surprise me with a random dinner recipe'
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(chip)}
              className="px-3 py-1 bg-white dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-brand-950/60 border border-stone-200 dark:border-stone-700/80 rounded-full text-xs text-stone-700 dark:text-stone-300 font-medium shrink-0 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Chef to find recipes, calculate nutrition, plan meals, or shop..."
            className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isProcessing}
            className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold transition-all shadow-sm"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
