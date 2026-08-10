import React, { useState } from 'react';
import { 
  FolderArchive, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Download, 
  Calendar, 
  Clock, 
  Building2, 
  UserCheck
} from 'lucide-react';
import { DocumentItem, Resident } from '../types';

interface DocumentsViewProps {
  documents: DocumentItem[];
  residents: Resident[];
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  residents,
}) => {
  const [activeTab, setActiveTab] = useState<'Ospite' | 'Aziendale'>('Ospite');
  const [docSearch, setDocSearch] = useState('');

  const filteredDocs = documents.filter((d) => {
    const matchesTab = d.categoria === activeTab;
    const q = docSearch.toLowerCase();
    const matchesQ = 
      d.titolo.toLowerCase().includes(q) ||
      d.subCategoria.toLowerCase().includes(q);
    return matchesTab && matchesQ;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600" />
            Archivio Documentale Digitale & Scadenziario
          </h2>
          <p className="text-xs text-slate-500">
            Conservazione e monitoraggio scadenze di documenti d'identità ospiti, contratti e protocolli aziendali
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('Ospite')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'Ospite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Documenti Ospiti
          </button>

          <button
            onClick={() => setActiveTab('Aziendale')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'Aziendale' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Documenti Aziendali RSA
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-600 font-semibold">
            Elementi nell'archivio {activeTab}: <strong>{filteredDocs.length}</strong>
          </span>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cerca titolo o tipologia..."
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const resident = residents.find(r => r.id === doc.ospiteId);
            return (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.titolo}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-800 font-semibold">
                        {doc.subCategoria}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => alert(`Download simulato di ${doc.titolo}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {resident && (
                  <p className="text-slate-700 text-[11px] bg-white p-2 rounded border border-slate-200">
                    Ospite: <strong>{resident.nome} {resident.cognome}</strong> ({resident.areaAssegnata})
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Caricato il: {doc.dataCaricamento}</span>
                  {doc.dataScadenza ? (
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Scadenza: {doc.dataScadenza}
                    </span>
                  ) : (
                    <span className="text-slate-400">Nessuna scadenza</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
