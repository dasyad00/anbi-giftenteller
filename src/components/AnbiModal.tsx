import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, AlertCircle } from 'lucide-react';
import { AnbiOrganisation } from '../services/anbi';

interface AnbiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (anbi: AnbiOrganisation) => void;
  anbiOrganisations: AnbiOrganisation[];
}

export function AnbiModal({
  isOpen,
  onClose,
  onSelect,
  anbiOrganisations,
}: AnbiModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrganisations = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return anbiOrganisations
      .filter(
        (anbi) =>
          anbi.naam?.toLowerCase().includes(query) ||
          String(anbi.fiscaalNummer ?? '').includes(query),
      )
      .slice(0, 100);
  }, [anbiOrganisations, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (anbi: AnbiOrganisation) => {
    setSearchQuery('');
    onSelect(anbi);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 id="modal-title" className="font-semibold text-lg">
                Associate with ANBI
              </h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for an ANBI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  aria-label="Search for an ANBI"
                />
              </div>
              <div
                className="max-h-96 overflow-y-auto space-y-2"
                role="listbox"
              >
                {searchQuery.length < 2 ? (
                  <div className="text-center py-12 px-4">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      Search for an ANBI
                    </p>
                    <p className="text-slate-400 text-sm">
                      Type at least 2 characters to see results
                    </p>
                  </div>
                ) : filteredOrganisations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertCircle className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No organizations found
                    </p>
                    <p className="text-slate-400 text-sm">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  filteredOrganisations.map((anbi) => (
                    <div
                      key={anbi.dossierNummer}
                      onClick={() => handleSelect(anbi)}
                      className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      role="option"
                    >
                      <p className="font-semibold text-slate-800 line-clamp-1">
                        {anbi.naam}
                      </p>
                      <p className="text-xs text-slate-600 font-medium mb-1">
                        RSIN: {anbi.fiscaalNummer ?? '-'}
                      </p>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {anbi.vestigingsPlaats}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
