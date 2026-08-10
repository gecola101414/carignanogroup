import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Apple, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck, 
  Search, 
  Calendar, 
  ChefHat, 
  Filter,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { DailyMenu, GuestDietProfile, CateringAuditLog, Resident, FoodTexture } from '../types';

interface CateringViewProps {
  menus: DailyMenu[];
  diets: GuestDietProfile[];
  audits: CateringAuditLog[];
  residents: Resident[];
}

export const CateringView: React.FC<CateringViewProps> = ({
  menus,
  diets,
  audits,
  residents,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'diete' | 'audit'>('menu');
  const [textureFilter, setTextureFilter] = useState<FoodTexture | 'Tutte'>('Tutte');
  const [cateringSearch, setCateringSearch] = useState('');

  // Combine residents with diet profiles
  const guestDietList = residents.map((r) => {
    const profile = diets.find(d => d.ospiteId === r.id);
    return {
      resident: r,
      tipoDieta: profile?.tipoDieta || r.dieteSpeciali.join(', ') || 'Dieta Libera',
      consistenza: profile?.consistenza || (r.noteDisfagia?.includes('Frullata') ? 'Frullata' : r.noteDisfagia?.includes('Tritata') ? 'Tritata' : r.noteDisfagia?.includes('Omogeneizzata') ? 'Omogeneizzata' : 'Solida') as FoodTexture,
      addensanteLiquidi: profile?.addensanteLiquidi || (r.noteDisfagia?.includes('addensante') ?? false),
      noteCucina: profile?.noteCucina || r.noteDisfagia || 'Nessuna specifica.',
    };
  });

  const filteredDiets = guestDietList.filter(item => {
    const matchesTexture = textureFilter === 'Tutte' || item.consistenza === textureFilter;
    const q = cateringSearch.toLowerCase();
    const matchesQ = 
      item.resident.nome.toLowerCase().includes(q) ||
      item.resident.cognome.toLowerCase().includes(q) ||
      item.resident.areaAssegnata.toLowerCase().includes(q) ||
      item.tipoDieta.toLowerCase().includes(q);
    return matchesTexture && matchesQ;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            Modulo Ristorazione, Diete Personalizzate & Audit ASL/NAS
          </h2>
          <p className="text-xs text-slate-500">
            Pianificazione pasti giornalieri, gestione integrata disfagia per 35 ospiti e archivio di conformità igienico-sanitaria HACCP
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('menu')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'menu' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Menu del Giorno
          </button>

          <button
            onClick={() => setActiveSubTab('diete')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'diete' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            Diete & Disfagia ({guestDietList.length})
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'audit' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Archivio NAS / ASL
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Menu del Giorno */}
      {activeSubTab === 'menu' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menus.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                      {m.pasto[0]}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{m.pasto}</h3>
                      <span className="text-[11px] text-slate-400 font-mono">Data: {m.data}</span>
                    </div>
                  </div>
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold border border-slate-200">
                    Menu Approvato Nutrizionista
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] block">Primo Piatto</span>
                    <strong className="text-slate-800 text-xs">{m.primo}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] block">Secondo Piatto</span>
                    <strong className="text-slate-800 text-xs">{m.secondo}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] block">Contorno</span>
                    <strong className="text-slate-800 text-xs">{m.contorno}</strong>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-medium text-[10px] block">Frutta / Dessert</span>
                    <strong className="text-slate-800 text-xs">{m.fruttaDolce}</strong>
                  </div>

                  {m.noteAllergeni && (
                    <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Allergeni e Varianti:</strong> {m.noteAllergeni}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Diete & Disfagia per singolo ospite */}
      {activeSubTab === 'diete' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-500 font-semibold">Filtra Consistenza Cibo:</span>
              {(['Tutte', 'Solida', 'Tritata', 'Frullata', 'Omogeneizzata'] as const).map((tex) => (
                <button
                  key={tex}
                  onClick={() => setTextureFilter(tex)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    textureFilter === tex ? 'bg-amber-600 text-white font-bold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tex}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cerca ospite o dieta..."
                value={cateringSearch}
                onChange={(e) => setCateringSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3">Ospite</th>
                  <th className="p-3">Ubicazione</th>
                  <th className="p-3">Tipo Dieta</th>
                  <th className="p-3">Consistenza</th>
                  <th className="p-3">Addensante Liquidi</th>
                  <th className="p-3">Note Cucina / Disfagia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDiets.map((item) => (
                  <tr key={item.resident.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      {item.resident.nome} {item.resident.cognome}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.resident.areaAssegnata} (St. {item.resident.stanza})
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-800">
                      {item.tipoDieta}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.consistenza === 'Omogeneizzata' || item.consistenza === 'Frullata'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : item.consistenza === 'Tritata'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {item.consistenza}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.addensanteLiquidi ? (
                        <span className="text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                          SÌ (Addensante)
                        </span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs text-[11px]">
                      {item.noteCucina}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Audit NAS / ASL */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Archivio Storico Verbali ed Ispezioni ASL / NAS
              </h3>
              <p className="text-xs text-slate-500">
                Registro dei controlli igienico-sanitari e conformità con il piano HACCP della struttura
              </p>
            </div>
            <button 
              onClick={() => alert('Download archivio verbali in formato PDF/ZIP avviato.')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Esporta Registro Audit
            </button>
          </div>

          <div className="space-y-3">
            {audits.map((a) => (
              <div key={a.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{a.tipoIspezione}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded text-[11px] border border-emerald-300">
                      {a.esito}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500">{a.data}</span>
                </div>

                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {a.noteConformita}
                </p>

                <p className="text-slate-500 text-[11px]">
                  Verificatore responsabile: <strong>{a.ispettoreOVerificatore}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
