import { Download, FileText, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { type GroupedDonation } from '../lib/analysis';
import { AnalysisMode, type DonationResult } from '../lib/types';
import { GroupedTransactionCard } from './GroupedTransactionCard';

interface ResultsDisplayProps {
  mode: AnalysisMode;
  results: DonationResult[];
  groupedResults: GroupedDonation[];
  isAnalyzing: boolean;
  transactionsCount: number;
  totalDonations: number;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  onAssociateAnbi: (group: GroupedDonation) => void;
  onDissociateAnbi: (id: string) => void;
}

export function ResultsDisplay({
  mode,
  results,
  groupedResults,
  isAnalyzing,
  transactionsCount,
  totalDonations,
  expandedGroups,
  onToggleGroup,
  onAssociateAnbi,
  onDissociateAnbi,
}: ResultsDisplayProps) {
  const { t } = useTranslation();

  if (results.length > 0 || groupedResults.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">
              {t('total')}
            </p>
            <h2 className="text-4xl font-bold">
              €
              {totalDonations.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </h2>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">{t('results')}</h3>
              <div className="flex gap-2">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                  <Download className="w-4 h-4" />
                  {t('export_pdf')}
                </button>
              </div>
            </div>

            {/* AI Results */}
            {mode === 'ai' && (
              <div className="space-y-4">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">
                        {result.organization}
                      </p>
                      <p className="text-xs text-slate-500">
                        {result.date} • {result.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">
                        €{result.amount.toFixed(2)}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700">
                        ANBI
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Grouped Results */}
            {mode === 'manual' && (
              <div className="space-y-4">
                {groupedResults.map((group, idx) => (
                  <GroupedTransactionCard
                    key={idx}
                    group={group}
                    isExpanded={expandedGroups[group.id]}
                    onToggle={() => onToggleGroup(group.id)}
                    onAssociateAnbi={() => onAssociateAnbi(group)}
                    onDissociateAnbi={() => onDissociateAnbi(group.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 text-center italic">
              {mode === 'ai' ? t('disclaimer') : t('group_by_desc')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!isAnalyzing && transactionsCount > 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4"
      >
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <FileText className="text-slate-300 w-8 h-8" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{t('analyze')}</h3>
          <p className="text-slate-500 max-w-xs mx-auto">
            {t('upload_prompt')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-40 grayscale">
      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center rotate-3">
        <TrendingUp className="text-slate-300 w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-xl">{t('ready_to_calculate')}</h3>
        <p className="text-slate-500 max-w-xs">{t('upload_prompt')}</p>
      </div>
    </div>
  );
}
