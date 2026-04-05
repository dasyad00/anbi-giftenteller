import { Sparkles, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from 'i18next';
import { AnalysisMode } from '../lib/types';

interface AnalysisModeSelectorProps {
  mode: AnalysisMode;
  setMode: (mode: AnalysisMode) => void;
}

export function AnalysisModeSelector({
  mode,
  setMode,
}: AnalysisModeSelectorProps) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-xl">
      <button
        onClick={() => setMode('ai')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
          mode === 'ai'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        )}
      >
        <Sparkles className="w-4 h-4" />
        {t('mode_ai')}
      </button>
      <button
        onClick={() => setMode('manual')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
          mode === 'manual'
            ? 'bg-white text-indigo-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        )}
      >
        <Users className="w-4 h-4" />
        {t('mode_manual')}
      </button>
    </div>
  );
}
