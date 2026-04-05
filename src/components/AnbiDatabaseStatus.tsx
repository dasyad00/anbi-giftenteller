import { RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnbiMetadata } from '../services/anbi';

interface AnbiDatabaseStatusProps {
  anbiMetadata: AnbiMetadata | null;
  lastRefreshTime: number | null;
  currentTime: number;
  isRefreshingAnbi: boolean;
  onRefresh: () => void;
}

export function AnbiDatabaseStatus({
  anbiMetadata,
  lastRefreshTime,
  currentTime,
  isRefreshingAnbi,
  onRefresh,
}: AnbiDatabaseStatusProps) {
  const { t, i18n } = useTranslation();

  const COOLDOWN_MS = 15 * 60 * 1000;
  const remaining = lastRefreshTime
    ? lastRefreshTime + COOLDOWN_MS - currentTime
    : 0;
  const isOnCooldown = remaining > 0;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">ANBI Database</p>
          <p className="text-xs text-slate-500">
            {anbiMetadata
              ? t('anbi_version', {
                  version: anbiMetadata.versie,
                  date: new Date(anbiMetadata.aanmaakDatum).toLocaleDateString(
                    i18n.language,
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                  ),
                })
              : t('anbi_source')}
          </p>
        </div>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshingAnbi || isOnCooldown}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-right"
      >
        {isRefreshingAnbi ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('refreshing')}</span>
          </div>
        ) : isOnCooldown ? (
          t('refresh_cooldown', {
            minutes: Math.floor(remaining / 60000),
            seconds: Math.floor((remaining % 60000) / 1000),
          })
        ) : (
          t('refresh_btn')
        )}
      </button>
    </div>
  );
}
