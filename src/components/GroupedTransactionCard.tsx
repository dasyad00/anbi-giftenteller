import { AnimatePresence, motion } from 'motion/react';
import { TransactionGroup } from '../lib/analysis';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GroupedTransactionCardProps {
  group: TransactionGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onAssociateAnbi: () => void;
  onDissociateAnbi: () => void;
}

export function GroupedTransactionCard({
  group,
  isExpanded,
  onToggle,
  onAssociateAnbi,
  onDissociateAnbi,
}: GroupedTransactionCardProps) {
  const { t } = useTranslation();
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div
        onClick={() => onToggle()}
        className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      >
        <div className="space-y-1">
          <p className="font-bold text-slate-800">{group.counterparty.name}</p>
          <p className="text-sm text-slate-800">{group.counterparty.iban}</p>
          <p className="text-xs text-slate-500">
            {t('transaction_count', {
              count: group.transactions.length,
            })}
          </p>
          {group.counterparty.rsin && (
            <p className="text-xs text-emerald-600 font-medium">
              ANBI: {group.counterparty.anbiName} (RSIN:
              {group.counterparty.rsin})
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="font-bold text-indigo-600">
            €{group.totalAmount.toFixed(2)}
          </p>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
          >
            <div className="p-4 space-y-3">
              {group.transactions.map((t, tIdx) => (
                <div key={tIdx} className="flex justify-between text-xs">
                  <div className="text-slate-600">
                    <span className="font-medium mr-2">{t.date}</span>
                    <span className="italic">{t.description}</span>
                  </div>
                  <span className="font-medium text-slate-700">
                    €{t.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-2 flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssociateAnbi();
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {group.counterparty.rsin ? t('change') : t('associate_anbi')}
                </button>
                {group.counterparty.rsin && (
                  <>
                    <div className="h-4 w-px bg-slate-200 mx-3"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDissociateAnbi();
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      {t('dissociate')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
