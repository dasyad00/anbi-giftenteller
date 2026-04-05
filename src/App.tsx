import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadSection } from './components/UploadSection';
import { InfoCard } from './components/InfoCard';
import { AnbiDatabaseStatus } from './components/AnbiDatabaseStatus';
import { FutureIntegrationCard } from './components/FutureIntegrationCard';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AnbiModal } from './components/AnbiModal';

import { useAnbiData } from './hooks/useAnbiData';
import { useDonationAnalysis } from './hooks/useDonationAnalysis';
import { useCsvUpload } from './hooks/useCsvUpload';

export default function App() {
  const { t, i18n } = useTranslation();

  const {
    anbiOrganisations,
    anbiMetadata,
    lastRefreshTime,
    currentTime,
    isRefreshingAnbi,
    handleRefreshAnbi,
  } = useAnbiData();

  const {
    transactions,
    setTransactions,
    results,
    setResults,
    groupedResults,
    setGroupedResults,
    isAnalyzing,
    fiscalYear,
    setFiscalYear,
    error,
    setError,
    mode,
    expandedGroups,
    isAnbiModalOpen,
    setIsAnbiModalOpen,
    handleAnalyze,
    handleAssociateAnbi,
    handleDissociateAnbi,
    handleAnbiSelection,
    toggleGroup,
    totalDonations,
  } = useDonationAnalysis();

  const { getRootProps, getInputProps, isDragActive } = useCsvUpload({
    onSuccess: (mapped) => {
      setTransactions(mapped);
      setResults([]);
      setGroupedResults([]);
      setError(null);
    },
    onError: (err) => {
      setError(err);
    },
  });

  useEffect(() => {
    document.title = t('title');
  }, [t]);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'nl' ? 'en' : 'nl';
    i18n.changeLanguage(nextLng);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header onToggleLanguage={toggleLanguage} />

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Controls & Upload */}
          <div className="lg:col-span-5 space-y-6">
            <UploadSection
              fiscalYear={fiscalYear}
              setFiscalYear={setFiscalYear}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              transactionsCount={transactions.length}
              error={error}
              isAnalyzing={isAnalyzing}
              handleAnalyze={handleAnalyze}
            />

            <InfoCard />

            <AnbiDatabaseStatus
              anbiMetadata={anbiMetadata}
              lastRefreshTime={lastRefreshTime}
              currentTime={currentTime}
              isRefreshingAnbi={isRefreshingAnbi}
              onRefresh={handleRefreshAnbi}
            />

            <FutureIntegrationCard />
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <ResultsDisplay
                mode={mode}
                results={results}
                groupedResults={groupedResults}
                isAnalyzing={isAnalyzing}
                transactionsCount={transactions.length}
                totalDonations={totalDonations}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                onAssociateAnbi={handleAssociateAnbi}
                onDissociateAnbi={handleDissociateAnbi}
              />
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnbiModal
        isOpen={isAnbiModalOpen}
        onClose={() => setIsAnbiModalOpen(false)}
        onSelect={handleAnbiSelection}
        anbiOrganisations={anbiOrganisations}
      />

      <Footer />
    </div>
  );
}
