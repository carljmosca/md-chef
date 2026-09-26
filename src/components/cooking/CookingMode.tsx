import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Check,
  CheckSquare,
  Eye,
  ListFilter,
  RotateCcw,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, DetectedTimer } from '../../types/recipe';
import { CookingTimer } from './CookingTimer';
import { speakText, stopSpeaking, isSpeechSupported } from '../../services/speech';
import { playStepCompleteSound } from '../../services/sound';
import { useSettings } from '../../context/SettingsContext';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({ recipe, onExit }) => {
  const { settings } = useSettings();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeTimers, setActiveTimers] = useState<DetectedTimer[]>([]);
  const [showIngredientsDrawer, setShowIngredientsDrawer] = useState(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState(false);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinishedCooking, setIsFinishedCooking] = useState(false);

  const steps = recipe.instructions;
  const currentStep = steps[currentStepIndex];

  const groupedIngredients = useMemo(() => {
    const groups: { section?: string; items: typeof recipe.ingredients }[] = [];
    let currentGroup: { section?: string; items: typeof recipe.ingredients } | null = null;

    for (const ing of recipe.ingredients) {
      if (!currentGroup || currentGroup.section !== ing.section) {
        currentGroup = { section: ing.section, items: [ing] };
        groups.push(currentGroup);
      } else {
        currentGroup.items.push(ing);
      }
    }
    return groups;
  }, [recipe.ingredients]);

  // Screen Wake Lock API
  useEffect(() => {
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      if (settings.keepAwakeInCookingMode && 'wakeLock' in navigator) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);

          wakeLockSentinel.addEventListener('release', () => {
            setIsWakeLockActive(false);
          });
        } catch (err) {
          console.warn('Screen WakeLock error:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isWakeLockActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopSpeaking();
    };
  }, [settings.keepAwakeInCookingMode]);

  // Sync timers detected in current step
  useEffect(() => {
    if (currentStep && currentStep.timers.length > 0) {
      setActiveTimers(currentStep.timers);
    }
  }, [currentStepIndex, currentStep]);

  // Read aloud helper
  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (currentStep) {
      setIsSpeaking(true);
      speakText(
        `Step ${currentStepIndex + 1}. ${currentStep.text}`,
        settings.speechVoiceRate || 1.0,
        () => setIsSpeaking(false)
      );
    }
  };

  const handleStepCompleteToggle = (idx: number) => {
    const next = new Set(completedSteps);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
      playStepCompleteSound();
      if (idx === steps.length - 1 && next.size === steps.length) {
        triggerFinishCelebration();
      }
    }
    setCompletedSteps(next);
  };

  const triggerFinishCelebration = () => {
    setIsFinishedCooking(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const goToNextStep = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else if (currentStepIndex === steps.length - 1) {
      triggerFinishCelebration();
    }
  }, [currentStepIndex, steps.length]);

  const goToPrevStep = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Keyboard navigation: ArrowRight / ArrowLeft / Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNextStep();
      } else if (e.key === 'ArrowLeft') {
        goToPrevStep();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextStep, goToPrevStep, onExit]);

  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col select-none overflow-hidden">
      {/* Top Status & Controls Bar */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="Exit Cooking Mode (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-white truncate max-w-[200px] sm:max-w-md">
              {recipe.frontmatter.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              {isWakeLockActive && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                  <Eye className="w-3 h-3" />
                  Screen Awake
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons right */}
        <div className="flex items-center gap-2">
          {/* Steps Checklist Toggle */}
          <button
            onClick={() => {
              setShowStepsDrawer(!showStepsDrawer);
              setShowIngredientsDrawer(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showStepsDrawer
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
            title="View all steps checklist"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden sm:inline">
              Steps ({completedSteps.size}/{steps.length})
            </span>
          </button>

          {/* Ingredients Quick Sheet Toggle */}
          <button
            onClick={() => {
              setShowIngredientsDrawer(!showIngredientsDrawer);
              setShowStepsDrawer(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showIngredientsDrawer
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span className="hidden sm:inline">Ingredients</span>
          </button>

          {/* Text-To-Speech Read Step */}
          {isSpeechSupported() && (
            <button
              onClick={handleToggleSpeak}
              className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                isSpeaking
                  ? 'bg-amber-600 border-amber-500 text-white animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
              }`}
              title={isSpeaking ? 'Stop Reading' : 'Read Step Aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-stone-900 h-1.5">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-amber-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Cooking Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Step Content Area */}
        <main className="flex-1 flex flex-col justify-between p-6 sm:p-12 max-w-4xl mx-auto overflow-y-auto">
          {isFinishedCooking ? (
            /* Cooking Completed Celebration Card */
            <div className="my-auto text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-brand-500/40">
                <Trophy className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-3xl sm:text-5xl text-white">
                  Bon Appétit!
                </h3>
                <p className="text-stone-400 text-base sm:text-lg max-w-md mx-auto">
                  You’ve completed all steps for{' '}
                  <strong className="text-white">{recipe.frontmatter.title}</strong>. Time to
                  serve and enjoy!
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    setIsFinishedCooking(false);
                    setCurrentStepIndex(0);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start Over</span>
                </button>
                <button
                  onClick={onExit}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg"
                >
                  Finish & Exit
                </button>
              </div>
            </div>
          ) : (
            /* Active Step Display */
            <>
              <div className="space-y-6 my-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-brand-500">
                      Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    {currentStep?.section && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20">
                        {currentStep.section}
                      </span>
                    )}
                    <span className="text-xs text-stone-500 font-medium">
                      ({completedSteps.size} of {steps.length} completed)
                    </span>
                  </div>

                  <button
                    onClick={() => handleStepCompleteToggle(currentStepIndex)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      completedSteps.has(currentStepIndex)
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {completedSteps.has(currentStepIndex) ? 'Completed' : 'Mark Done'}
                    </span>
                  </button>
                </div>

                {/* Big Step Instruction Card with Interactive Checkbox */}
                <div
                  onClick={() => handleStepCompleteToggle(currentStepIndex)}
                  className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer group flex items-start gap-4 sm:gap-6 ${
                    completedSteps.has(currentStepIndex)
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-stone-200 shadow-sm'
                      : 'bg-stone-900/70 border-stone-800 text-stone-100 hover:border-stone-700'
                  }`}
                >
                  {/* Large tactile Checkbox */}
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                      completedSteps.has(currentStepIndex)
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : 'border-stone-500 bg-stone-800/80 group-hover:border-brand-500 text-transparent'
                    }`}
                    title={completedSteps.has(currentStepIndex) ? 'Mark step incomplete' : 'Mark step complete'}
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                  </div>

                  <div className="space-y-3 flex-1">
                    <p className={`font-serif text-2xl sm:text-4xl leading-relaxed sm:leading-relaxed font-medium transition-colors ${
                      completedSteps.has(currentStepIndex)
                        ? 'text-stone-300'
                        : 'text-stone-100'
                    }`}>
                      {currentStep?.text}
                    </p>

                    {completedSteps.has(currentStepIndex) ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Step completed!</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-500 block">
                        Tap here or the checkbox to mark this step completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Timers in this Step */}
                {activeTimers.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {activeTimers.map((timer, i) => (
                      <CookingTimer
                        key={`${currentStepIndex}-${i}`}
                        initialSeconds={timer.totalSeconds}
                        label={timer.label}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Step Navigation Footer Controls */}
              <div className="pt-8 border-t border-stone-800/80 flex items-center justify-between gap-4">
                <button
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    currentStepIndex === 0
                      ? 'opacity-30 cursor-not-allowed bg-stone-900 text-stone-600'
                      : 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800'
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStepIndex(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        i === currentStepIndex
                          ? 'w-8 bg-brand-500'
                          : completedSteps.has(i)
                          ? 'bg-emerald-500'
                          : 'bg-stone-800 hover:bg-stone-700'
                      }`}
                      title={`Jump to Step ${i + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNextStep}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-500 hover:to-amber-400 text-white text-sm font-bold shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
                >
                  <span>
                    {currentStepIndex === steps.length - 1 ? 'Finish Dish' : 'Next Step'}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </main>

        {/* Slide-out Ingredients Drawer */}
        {showIngredientsDrawer && (
          <aside className="w-80 sm:w-96 bg-stone-900 border-l border-stone-800 flex flex-col h-full shadow-2xl z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-white">Ingredients Reference</h3>
              <button
                onClick={() => setShowIngredientsDrawer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {groupedIngredients.map((group, gIdx) => (
                <div key={group.section || gIdx} className="space-y-2">
                  {group.section && (
                    <div className="text-xs font-bold uppercase tracking-wider text-brand-400 font-sans border-b border-stone-800 pb-1">
                      {group.section}
                    </div>
                  )}
                  <div className="space-y-2 divide-y divide-stone-800/60">
                    {group.items.map((ing) => (
                      <div key={ing.id} className="pt-2 text-sm text-stone-300 leading-snug">
                        • {ing.raw}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Slide-out All Steps Checklist Drawer */}
        {showStepsDrawer && (
          <aside className="w-80 sm:w-96 bg-stone-900 border-l border-stone-800 flex flex-col h-full shadow-2xl z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-white">All Steps Checklist</h3>
                <span className="text-xs text-stone-400">
                  {completedSteps.size} of {steps.length} completed
                </span>
              </div>
              <button
                onClick={() => setShowStepsDrawer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-stone-800/60">
              {steps.map((step, idx) => {
                const isDone = completedSteps.has(idx);
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setCurrentStepIndex(idx);
                    }}
                    className={`pt-3 pb-2 px-3 rounded-2xl cursor-pointer transition-colors flex items-start gap-3.5 ${
                      isCurrent
                        ? 'bg-stone-800/90 border border-brand-500/60'
                        : 'hover:bg-stone-800/50'
                    }`}
                  >
                    {/* Interactive Step Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepCompleteToggle(idx);
                      }}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'border-stone-500 bg-stone-950 hover:border-brand-500'
                      }`}
                      title={isDone ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold ${
                            isCurrent
                              ? 'text-brand-400'
                              : isDone
                              ? 'text-emerald-400'
                              : 'text-stone-400'
                          }`}
                        >
                          Step {idx + 1} {step.section ? `• ${step.section}` : ''} {isCurrent && '• Current'}
                        </span>
                        {isDone && (
                          <span className="text-[10px] text-emerald-400 font-semibold">Done</span>
                        )}
                      </div>
                      <p
                        className={`text-xs sm:text-sm leading-snug line-clamp-3 transition-colors ${
                          isDone ? 'text-stone-500 line-through' : 'text-stone-200'
                        }`}
                      >
                        {step.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
