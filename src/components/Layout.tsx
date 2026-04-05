import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'nl' ? 'en' : 'nl';
    i18n.changeLanguage(nextLng);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header onToggleLanguage={toggleLanguage} />
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
