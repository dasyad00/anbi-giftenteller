import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InfoCard() {
  const { t } = useTranslation();

  return (
    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
      <div className="flex gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0" />
        <div className="space-y-2">
          <h3 className="font-semibold text-indigo-900 text-sm">
            {t('anbi_question')}
          </h3>
          <p className="text-sm text-indigo-800/80 leading-relaxed">
            {t('anbi_explanation')}
          </p>
        </div>
      </div>
    </div>
  );
}
