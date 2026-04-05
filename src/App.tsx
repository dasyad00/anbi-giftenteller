import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe,
  TrendingUp,
  Download,
  Smartphone,
  Info,
  ChevronRight,
  Loader2,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { analyzeTransactions } from './services/gemini';
import { getAnbiData } from './services/anbi';
import { Party, type DonationResult, type Transaction } from './lib/types';
import {
  groupTransactionsByCounterparty,
  type GroupedDonation,
} from './lib/analysis';

type AnalysisMode = 'ai' | 'manual';

export default function App() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [results, setResults] = useState<DonationResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<GroupedDonation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('manual');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isRefreshingAnbi, setIsRefreshingAnbi] = useState(false);

  useEffect(() => {
    document.title = t('title');
  }, [t]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mapped: Transaction[] = results.data
          .map((row: any) => {
            const date = row.Datum || row.Date || row['Boekdatum'] || '';
            const amountStr =
              row.Bedrag || row.Amount || row['Bedrag (EUR)'] || '0';
            const description =
              row.Naam ||
              row.Omschrijving ||
              row.Description ||
              row['Description-1'] ||
              row['Mededelingen'] ||
              '';
            const counterparty: Party = {
              name: row['Name Counterpty'] || '',
              iban:
                row['Tegenrekening'] ||
                row['Counterparty'] ||
                row['Counterpty IBAN/BBAN'] ||
                '',
            };
            const amount = parseFloat(amountStr.toString().replace(',', '.'));
            return { date, description, amount, counterparty };
          })
          .filter((t) => t.date && t.amount);

        if (mapped.length === 0) {
          setError(
            'Could not find valid transactions in the CSV. Please check the format.',
          );
        } else {
          setTransactions(mapped);
          setResults([]);
          setGroupedResults([]);
        }
      },
      error: () => {
        setError('Error parsing CSV file.');
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  } as any);

  const handleAnalyze = async () => {
    if (transactions.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      if (mode === 'ai') {
        const donationResults = await analyzeTransactions(
          transactions,
          fiscalYear,
        );
        setResults(donationResults);
        setGroupedResults([]);
      } else {
        const grouped = await groupTransactionsByCounterparty(
          transactions,
          fiscalYear,
        );
        setGroupedResults(grouped);
        setResults([]);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshAnbi = async () => {
    setIsRefreshingAnbi(true);
    try {
      await getAnbiData(true);
    } catch (error) {
      console.error('Failed to refresh ANBI data:', error);
      setError('Failed to refresh ANBI data.');
    } finally {
      setIsRefreshingAnbi(false);
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalDonations =
    mode === 'ai'
      ? results.reduce((sum, r) => sum + r.amount, 0)
      : groupedResults.reduce((sum, r) => sum + r.totalAmount, 0);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'nl' ? 'en' : 'nl';
    i18n.changeLanguage(nextLng);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800">
              {t('title')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
            >
              <Globe className="w-4 h-4" />
              {i18n.language === 'nl' ? t('dutch') : t('english')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls & Upload */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {t('upload_title')}
                  </h2>
                  <p className="text-sm text-slate-500">{t('subtitle')}</p>
                </div>
              </div>

              {/* Mode Selector */}
              {/*<div className="flex p-1 bg-slate-100 rounded-xl">
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
              </div>*/}

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
                  transactions.length > 0
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : '',
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {transactions.length > 0 ? (
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
                      {transactions.length > 0
                        ? `${transactions.length} transactions loaded`
                        : t('upload_desc')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      CSV format from ING, ABN, Rabo, etc.
                    </p>
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
                disabled={transactions.length === 0 || isAnalyzing}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200',
                  transactions.length === 0 || isAnalyzing
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

            {/* Info Card */}
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-indigo-900 text-sm">
                    ANBI?
                  </h3>
                  <p className="text-sm text-indigo-800/80 leading-relaxed">
                    {t('anbi_explanation')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    ANBI Database
                  </p>
                  <p className="text-xs text-slate-500">{t('anbi_source')}</p>
                </div>
              </div>
              <button
                onClick={handleRefreshAnbi}
                disabled={isRefreshingAnbi}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshingAnbi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </button>
            </div>

            {/* Future Integration Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between group cursor-help">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <Smartphone className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {t('future_banking')}
                  </p>
                  <p className="text-xs text-slate-500">
                    Open Banking (PSD2) API
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {results.length > 0 || groupedResults.length > 0 ? (
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
                            Export PDF
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
                            <div
                              key={idx}
                              className="border border-slate-100 rounded-xl overflow-hidden"
                            >
                              <div
                                onClick={() => toggleGroup(group.id)}
                                className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <div className="space-y-1">
                                  <p className="font-bold text-slate-800">
                                    {group.counterparty.name}
                                  </p>
                                  <p className="text-sm text-slate-800">
                                    {group.counterparty.iban}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {group.transactions.length} transactions
                                  </p>
                                  {group.counterparty.rsin && (
                                    <p className="text-xs text-emerald-600 font-medium">
                                      ANBI Found (RSIN:
                                      {group.counterparty.rsin})
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="font-bold text-indigo-600">
                                    €{group.totalAmount.toFixed(2)}
                                  </p>
                                  {expandedGroups[group.id] ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              <AnimatePresence>
                                {expandedGroups[group.id] && (
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                                  >
                                    <div className="p-4 space-y-3">
                                      {group.transactions.map((t, tIdx) => (
                                        <div
                                          key={tIdx}
                                          className="flex justify-between text-xs"
                                        >
                                          <div className="text-slate-600">
                                            <span className="font-medium mr-2">
                                              {t.date}
                                            </span>
                                            <span className="italic">
                                              {t.description}
                                            </span>
                                          </div>
                                          <span className="font-medium text-slate-700">
                                            €{t.amount.toFixed(2)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
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
              ) : !isAnalyzing && transactions.length > 0 ? (
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
                      Click the analyze button to process your statement using{' '}
                      {mode === 'ai' ? 'AI' : 'manual grouping'}.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-40 grayscale">
                  <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center rotate-3">
                    <TrendingUp className="text-slate-300 w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-xl">Ready to calculate</h3>
                    <p className="text-slate-500 max-w-xs">
                      Upload your bank statement to start tracking your
                      donations.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <p>© 2026 ANBI Donation Tracker. Built with Google AI Studio.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-600">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-600">
              Terms
            </a>
            <a href="#" className="hover:text-slate-600">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
