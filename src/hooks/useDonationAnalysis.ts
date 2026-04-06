import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeTransactions } from '../services/gemini';
import {
  groupTransactionsByCounterparty,
  type GroupedDonation,
} from '../lib/analysis';
import {
  type AnalysisMode,
  type DonationResult,
  type Transaction,
} from '../lib/types';
import { AnbiOrganisation } from '../services/anbi';

export function useDonationAnalysis() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [results, setResults] = useState<DonationResult[]>([]);
  const [allGroupedResults, setAllGroupedResults] = useState<GroupedDonation[]>(
    [],
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [error, setError] = useState<string | null>(null);
  const [mode] = useState<AnalysisMode>('manual');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isAnbiModalOpen, setIsAnbiModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedDonation | null>(
    null,
  );

  // By default we hide non-associated groups. UI can toggle this via exposed setter.
  const [showHiddenGroups, setShowHiddenGroups] = useState(false);

  const visibleGroupedResults = useMemo(
    () =>
      showHiddenGroups
        ? allGroupedResults
        : allGroupedResults.filter((g) => !!g.counterparty.rsin),
    [allGroupedResults, showHiddenGroups],
  );

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
        setAllGroupedResults([]);
      } else {
        const grouped = await groupTransactionsByCounterparty(
          transactions,
          fiscalYear,
        );
        // store the full set, but the UI will only see associated ones by default
        setAllGroupedResults(grouped);
        setResults([]);
      }
    } catch (err) {
      setError(t('analysis_failed'));
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAssociateAnbi = (group: GroupedDonation) => {
    setSelectedGroup(group);
    setIsAnbiModalOpen(true);
  };

  const handleDissociateAnbi = (groupId: string) => {
    const updated = allGroupedResults.map((g) =>
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
    setAllGroupedResults(updated);
  };

  const handleAnbiSelection = (anbi: AnbiOrganisation) => {
    if (!selectedGroup) return;

    const updated = allGroupedResults.map((g) =>
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

    setAllGroupedResults(updated);
    setIsAnbiModalOpen(false);
    setSelectedGroup(null);
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Total donations should only include ANBI-associated transactions when in manual mode.
  const totalDonations = useMemo(
    () =>
      mode === 'ai'
        ? results.reduce((sum, r) => sum + r.amount, 0)
        : allGroupedResults
            .filter((g) => !!g.counterparty.rsin)
            .reduce((sum, r) => sum + r.totalAmount, 0),
    [mode, results, allGroupedResults],
  );

  return {
    transactions,
    setTransactions,
    results,
    setResults,
    groupedResults: visibleGroupedResults,
    setGroupedResults: setAllGroupedResults,
    allGroupedResults,
    showHiddenGroups,
    setShowHiddenGroups,
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
  };
}
