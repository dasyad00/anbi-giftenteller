import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { type Party, type Transaction } from '../lib/types';

interface UseCsvUploadProps {
  onSuccess: (transactions: Transaction[]) => void;
  onError: (error: string) => void;
}

export function useCsvUpload({ onSuccess, onError }: UseCsvUploadProps) {
  const { t } = useTranslation();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mapped: Transaction[] = results.data
            .map((row: any) => {
              const date = row.Datum || row.Date || row['Boekdatum'] || '';
              const amountStr =
                row.Bedrag || row.Amount || row['Bedrag (EUR)'] || '0';
              const description =
                row.Naam ||
                row.Omschrijving ||
                row.Description ||
                row['Description-1'] ||
                row['Mededelingen'] ||
                '';
              const counterparty: Party = {
                name: row['Name Counterpty'] || '',
                iban:
                  row['Tegenrekening'] ||
                  row['Counterparty'] ||
                  row['Counterpty IBAN/BBAN'] ||
                  '',
              };
              const amount = parseFloat(amountStr.toString().replace(',', '.'));
              return { date, description, amount, counterparty };
            })
            .filter((t) => t.date && t.amount);

          if (mapped.length === 0) {
            onError(t('csv_error_valid'));
          } else {
            onSuccess(mapped);
          }
        },
        error: () => {
          onError(t('csv_error_parse'));
        },
      });
    },
    [t, onSuccess, onError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  } as any);

  return {
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
