import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="max-w-5xl mx-auto px-4 py-8 border-t border-slate-200 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <p>© 2026 ANBI Donation Tracker. {t('built_with')}</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600">
            {t('privacy')}
          </a>
          <a href="#" className="hover:text-slate-600">
            {t('terms')}
          </a>
          <a href="#" className="hover:text-slate-600">
            {t('security')}
          </a>
        </div>
      </div>
    </footer>
  );
}
