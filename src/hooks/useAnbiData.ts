import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AnbiOrganisation,
  AnbiMetadata,
  getAnbiData,
  getLastAnbiRefreshTime,
} from '../services/anbi';

export function useAnbiData() {
  const { t } = useTranslation();
  const [anbiOrganisations, setAnbiOrganisations] = useState<
    AnbiOrganisation[]
  >([]);
  const [anbiMetadata, setAnbiMetadata] = useState<AnbiMetadata | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isRefreshingAnbi, setIsRefreshingAnbi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnbiData().then((data) => {
      setAnbiOrganisations(data?.beschikking ?? []);
      setAnbiMetadata(data?.header ?? null);
    });
    getLastAnbiRefreshTime().then(setLastRefreshTime);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefreshAnbi = async () => {
    setIsRefreshingAnbi(true);
    setError(null);
    try {
      const data = await getAnbiData(true);
      setAnbiOrganisations(data?.beschikking ?? []);
      setAnbiMetadata(data?.header ?? null);
      setLastRefreshTime(Date.now());
    } catch (err) {
      console.error('Failed to refresh ANBI data:', err);
      setError(t('anbi_refresh_failed'));
    } finally {
      setIsRefreshingAnbi(false);
    }
  };

  return {
    anbiOrganisations,
    anbiMetadata,
    lastRefreshTime,
    currentTime,
    isRefreshingAnbi,
    handleRefreshAnbi,
    anbiError: error,
    setAnbiOrganisations,
  };
}
