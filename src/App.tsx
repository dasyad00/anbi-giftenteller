import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { AnimatePresence } from 'motion/react';
import { analyzeTransactions } from './services/gemini';
import {
  AnbiOrganisation,
  getAnbiData,
  getLastAnbiRefreshTime,
  AnbiMetadata,
} from './services/anbi';
import { AnbiModal } from './components/AnbiModal';
import {
  AnalysisMode,
  Party,
  type DonationResult,
  type Transaction,
} from './lib/types';
import {
  groupTransactionsByCounterparty,
  type GroupedDonation,
} from './lib/analysis';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadSection } from './components/UploadSection';
import { InfoCard } from './components/InfoCard';
import { AnbiDatabaseStatus } from './components/AnbiDatabaseStatus';
import { FutureIntegrationCard } from './components/FutureIntegrationCard';
import { ResultsDisplay } from './components/ResultsDisplay';

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
  const [mode] = useState<AnalysisMode>('manual');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isRefreshingAnbi, setIsRefreshingAnbi] = useState(false);
  const [isAnbiModalOpen, setIsAnbiModalOpen] = useState(false);
  const [anbiOrganisations, setAnbiOrganisations] = useState<
    AnbiOrganisation[]
  >([]);
  const [anbiMetadata, setAnbiMetadata] = useState<AnbiMetadata | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedGroup, setSelectedGroup] = useState<GroupedDonation | null>(
    null,
  );

  useEffect(() => {
    document.title = t('title');
    getAnbiData().then((data) => {
      setAnbiOrganisations(data?.beschikking ?? []);
      setAnbiMetadata(data?.header ?? null);
    });
    getLastAnbiRefreshTime().then(setLastRefreshTime);
  }, [t]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
          setError(t('csv_error_valid'));
        } else {
          setTransactions(mapped);
          setResults([]);
          setGroupedResults([]);
        }
      },
      error: () => {
        setError(t('csv_error_parse'));
      },
    });
  }, [t]);

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
      setError(t('analysis_failed'));
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshAnbi = async () => {
    setIsRefreshingAnbi(true);
    try {
      const data = await getAnbiData(true);
      setAnbiOrganisations(data?.beschikking ?? []);
      setAnbiMetadata(data?.header ?? null);
      setLastRefreshTime(Date.now());
    } catch (error) {
      console.error('Failed to refresh ANBI data:', error);
      setError(t('anbi_refresh_failed'));
    } finally {
      setIsRefreshingAnbi(false);
    }
  };

  const handleAssociateAnbi = (group: GroupedDonation) => {
    setSelectedGroup(group);
    setIsAnbiModalOpen(true);
  };

  const handleDissociateAnbi = (groupId: string) => {
    const updatedGroupedResults = groupedResults.map((g) =>
      g.id === groupId
        ? {
            ...g,
            counterparty: {
              ...g.counterparty,
              rsin: undefined,
              anbiName: undefined,
            },
          }
        : g,
    );
    setGroupedResults(updatedGroupedResults);
  };

  const handleAnbiSelection = (anbi: AnbiOrganisation) => {
    if (!selectedGroup) return;

    const updatedGroupedResults = groupedResults.map((g) =>
      g.id === selectedGroup.id
        ? {
            ...g,
            counterparty: {
              ...g.counterparty,
              rsin: anbi.fiscaalNummer,
              anbiName: anbi.naam,
            },
          }
        : g,
    );

    setGroupedResults(updatedGroupedResults);
    setIsAnbiModalOpen(false);
    setSelectedGroup(null);
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
