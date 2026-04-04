import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          title: "ANBI Donation Tracker",
          subtitle: "Calculate your total donations for tax deductions",
          upload_title: "Upload Bank Statement",
          upload_desc: "Drag & drop your CSV bank statement here, or click to select",
          fiscal_year: "Fiscal Year",
          analyze: "Analyze Statement",
          analyzing: "Analyzing...",
          results: "Donation Results",
          total: "Total Donations",
          organization: "Organization",
          amount: "Amount",
          date: "Date",
          description: "Description",
          no_donations: "No ANBI donations found in this statement.",
          future_banking: "Future: Connect your bank app directly",
          language: "Language",
          dutch: "Dutch",
          english: "English",
          anbi_explanation: "ANBI stands for 'Algemeen Nut Beogende Instelling' (Public Benefit Organization). Donations to these are often tax-deductible in the Netherlands.",
          disclaimer: "Note: This tool uses AI to identify potential donations. Always verify the results with your official records."
        }
      },
      nl: {
        translation: {
          title: "ANBI Giftenteller",
          subtitle: "Bereken je totale giften voor belastingaftrek",
          upload_title: "Upload Bankafschrift",
          upload_desc: "Sleep je CSV-bankafschrift hiernaartoe, of klik om te selecteren",
          fiscal_year: "Fiscaal Jaar",
          analyze: "Analyseer Afschrift",
          analyzing: "Analyseren...",
          results: "Resultaten Giften",
          total: "Totale Giften",
          organization: "Organisatie",
          amount: "Bedrag",
          date: "Datum",
          description: "Omschrijving",
          no_donations: "Geen ANBI-giften gevonden in dit afschrift.",
          future_banking: "Toekomst: Koppel direct je bank-app",
          language: "Taal",
          dutch: "Nederlands",
          english: "Engels",
          anbi_explanation: "ANBI staat voor 'Algemeen Nut Beogende Instelling'. Giften aan deze instellingen zijn vaak aftrekbaar van de belasting.",
          disclaimer: "Let op: Deze tool gebruikt AI om mogelijke giften te identificeren. Controleer de resultaten altijd met je officiële administratie."
        }
      }
    },
    lng: 'nl',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18next;
