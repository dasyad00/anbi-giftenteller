import { Smartphone, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FutureIntegrationCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 flex items-center justify-between group cursor-help">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
          <Smartphone className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">
            {t('future_banking')}
          </p>
          <p className="text-xs text-slate-500">{t('psd2_api')}</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
    </div>
  );
}
