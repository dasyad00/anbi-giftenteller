import { Globe, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onToggleLanguage: () => void;
}

export function Header({ onToggleLanguage }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
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
            onClick={onToggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600"
          >
            <Globe className="w-4 h-4" />
            {i18n.language === 'nl' ? t('dutch') : t('english')}
          </button>
        </div>
      </div>
    </header>
  );
}
