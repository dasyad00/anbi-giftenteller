import { cn } from '@/src/lib/utils';
import {
  CheckCircle2,
  Upload,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UploadSectionProps {
  fiscalYear: string;
  setFiscalYear: (year: string) => void;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  transactionsCount: number;
  error: string | null;
  isAnalyzing: boolean;
  handleAnalyze: () => void;
}

export function UploadSection({
  fiscalYear,
  setFiscalYear,
  getRootProps,
  getInputProps,
  isDragActive,
  transactionsCount,
  error,
  isAnalyzing,
  handleAnalyze,
}: UploadSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">{t('upload_title')}</h2>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Year Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          {t('fiscal_year')}
        </label>
        <select
          value={fiscalYear}
          onChange={(e) => setFiscalYear(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
        >
          {[2026, 2025, 2024, 2023].map((year) => (
            <option key={year} value={year.toString()}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
          transactionsCount > 0 ? 'border-emerald-200 bg-emerald-50/30' : '',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {transactionsCount > 0 ? (
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600 w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
              <Upload className="text-indigo-600 w-6 h-6" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-800">
              {transactionsCount > 0
                ? t('transactions_loaded', {
                    count: transactionsCount,
                  })
                : t('upload_desc')}
            </p>
            <p className="text-xs text-slate-500 mt-1">{t('csv_banks_info')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={transactionsCount === 0 || isAnalyzing}
        className={cn(
          'w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200',
          transactionsCount === 0 || isAnalyzing
            ? 'bg-slate-300 cursor-not-allowed shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]',
        )}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t('analyzing')}
          </>
        ) : (
          <>
            <TrendingUp className="w-5 h-5" />
            {t('analyze')}
          </>
        )}
      </button>
    </div>
  );
}
