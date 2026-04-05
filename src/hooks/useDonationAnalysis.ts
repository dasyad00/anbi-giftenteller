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
  const [isAnbiModalOpen, setIsAnbiModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupedDonation | null>(
    null,
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

  const totalDonations = useMemo(
    () =>
      mode === 'ai'
        ? results.reduce((sum, r) => sum + r.amount, 0)
        : groupedResults.reduce((sum, r) => sum + r.totalAmount, 0),
    [mode, results, groupedResults],
  );

  return {
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
  };
}
