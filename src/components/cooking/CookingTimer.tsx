import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Bell, Plus } from 'lucide-react';
import { playTimerChime } from '../../services/sound';

interface CookingTimerProps {
  initialSeconds: number;
  label: string;
  onDismiss?: () => void;
}

export const CookingTimer: React.FC<CookingTimerProps> = ({
  initialSeconds,
  label,
  onDismiss
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            setIsFinished(true);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const toggleRun = () => {
    if (isFinished) {
      setSecondsRemaining(initialSeconds);
      setIsFinished(false);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setIsFinished(false);
    setSecondsRemaining(initialSeconds);
  };

  const addOneMinute = () => {
    setSecondsRemaining((prev) => prev + 60);
    if (isFinished) {
      setIsFinished(false);
      setIsRunning(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const percentLeft = Math.round((secondsRemaining / initialSeconds) * 100);

  return (
    <div
      className={`border rounded-2xl p-4 transition-all duration-300 ${
        isFinished
          ? 'bg-rose-50 border-rose-400 dark:bg-rose-950/60 dark:border-rose-700 animate-pulse'
          : isRunning
          ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700 shadow-md'
          : 'bg-stone-50 border-stone-200 dark:bg-stone-800/60 dark:border-stone-700'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Bell
            className={`w-4 h-4 ${
              isFinished
                ? 'text-rose-600 animate-bounce'
                : isRunning
                ? 'text-amber-600'
                : 'text-stone-400'
            }`}
          />
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
            {label}
          </span>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[11px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Digits Display */}
      <div className="flex items-baseline justify-between">
        <span
          className={`font-mono font-bold text-3xl tracking-tight ${
            isFinished
              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
              : isRunning
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-stone-800 dark:text-stone-100'
          }`}
        >
          {formatTime(secondsRemaining)}
        </span>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleRun}
            className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all ${
              isRunning
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : isFinished
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
            title={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={reset}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={addOneMinute}
            className="px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-bold transition-colors flex items-center gap-0.5"
            title="Add 1 minute"
          >
            <Plus className="w-3 h-3" />
            <span>1m</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isFinished
              ? 'bg-rose-500'
              : isRunning
              ? 'bg-amber-500'
              : 'bg-brand-500'
          }`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </div>
  );
};
