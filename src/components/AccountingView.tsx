import React, { useState } from 'react';
import { 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Building2, 
  User, 
  Search, 
  Filter, 
  Wallet, 
  CreditCard,
  DollarSign
} from 'lucide-react';
import { AccountingEntry, Resident } from '../types';

interface AccountingViewProps {
  entries: AccountingEntry[];
  residents: Resident[];
  onAddEntry: (entry: Omit<AccountingEntry, 'id'>) => void;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  entries,
  residents,
  onAddEntry,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<'Tutti' | 'Entrata' | 'Uscita'>('Tutti');
  const [search, setSearch] = useState('');

  // Form State
  const [data, setData] = useState('2026-08-10');
  const [tipo, setTipo] = useState<'Entrata' | 'Uscita'>('Entrata');
  const [importo, setImporto] = useState('2850.00');
  const [categoria, setCategoria] = useState<AccountingEntry['categoria']>('Rette Ospiti');
  const [descrizione, setDescrizione] = useState('');
  const [metodo, setMetodo] = useState<AccountingEntry['metodoPagamento']>('Bonifico');
  const [ospiteId, setOspiteId] = useState('');
  const [ricevuta, setRicevuta] = useState('');

  const totalEntrate = entries
    .filter(e => e.tipo === 'Entrata')
    .reduce((sum, e) => sum + e.importo, 0);

  const totalUscite = entries
    .filter(e => e.tipo === 'Uscita')
    .reduce((sum, e) => sum + e.importo, 0);

  const saldoNetto = totalEntrate - totalUscite;

  const filteredEntries = entries.filter((e) => {
    const matchesType = filterType === 'Tutti' || e.tipo === filterType;
    const q = search.toLowerCase();
    const matchesSearch = 
      e.descrizione.toLowerCase().includes(q) ||
      e.categoria.toLowerCase().includes(q) ||
      (e.numeroRicevutaFattura && e.numeroRicevutaFattura.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || !descrizione) return;

    onAddEntry({
      data,
      tipo,
      importo: Number(importo),
      categoria,
      descrizione,
      metodoPagamento: metodo,
      ospiteId: ospiteId || undefined,
      numeroRicevutaFattura: ricevuta || undefined,
    });

    setDescrizione('');
    setRicevuta('');
    setShowForm(false);
    alert('Movimento di Prima Nota registrato con successo!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Gestione Contabile & Registro Prima Nota
          </h2>
          <p className="text-xs text-slate-500">
            Tracciamento entrate (rette ospiti), uscite di gestione (farmaci, alimentari, utenze, personale) ed addebiti personali
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          + Registra Movimento
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Totale Entrate (Rette)</span>
          <div className="text-2xl font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            € {totalEntrate.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Totale Uscite Gestione</span>
          <div className="text-2xl font-bold text-rose-700 font-mono mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-5 h-5 text-rose-600" />
            € {totalUscite.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-xs text-slate-400 font-medium">Saldo Netto Cassa / Banca</span>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">
            € {saldoNetto.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Form New Transaction */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
            Nuovo Movimento Contabile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo Operazione</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
              >
                <option value="Entrata">Entrata (+)</option>
                <option value="Uscita">Uscita (-)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data Registrazione</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoria Contabile</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              >
                <option value="Rette Ospiti">Rette Ospiti</option>
                <option value="Farmaci e Presidi">Farmaci e Presidi</option>
                <option value="Alimentari e Ristorazione">Alimentari e Ristorazione</option>
                <option value="Utenze">Utenze (Luce/Gas/Acqua)</option>
                <option value="Stipendi Personale">Stipendi Personale</option>
                <option value="Manutenzione Struttura">Manutenzione Struttura</option>
                <option value="Servizi Personali Ospiti">Servizi Personali Ospiti</option>
                <option value="Varie">Varie</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Metodo Pagamento</label>
              <select
                value={metodo}
                onChange={(e) => setMetodo(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              >
                <option value="Bonifico">Bonifico Bancario</option>
                <option value="RID/SDD">RID / SDD</option>
                <option value="Cassa">Cassa Contanti</option>
                <option value="POS">POS / Carta</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associa Ospite Specifico (Opzionale)</label>
              <select
                value={ospiteId}
                onChange={(e) => setOspiteId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              >
                <option value="">-- Nessun Ospite (Spesa Struttura) --</option>
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} {r.cognome} ({r.areaAssegnata})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Causale / Descrizione</label>
              <input
                type="text"
                placeholder="Es. Pagamento rette, acquisto farmaci..."
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">N. Fattura / Ricevuta</label>
              <input
                type="text"
                placeholder="Es. FT-2026/0012"
                value={ricevuta}
                onChange={(e) => setRicevuta(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-sm"
            >
              Salva Movimento
            </button>
          </div>
        </form>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Filtra Tipo:</span>
            {(['Tutti', 'Entrata', 'Uscita'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  filterType === t ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cerca causale o categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-3">Data</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Categoria</th>
                <th className="p-3">Descrizione</th>
                <th className="p-3">Ospite Associato</th>
                <th className="p-3">Metodo</th>
                <th className="p-3 text-right">Importo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntries.map((e) => {
                const resident = residents.find(r => r.id === e.ospiteId);
                return (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-600">{e.data}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.tipo === 'Entrata'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}>
                        {e.tipo}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{e.categoria}</td>
                    <td className="p-3 text-slate-700">{e.descrizione}</td>
                    <td className="p-3">
                      {resident ? (
                        <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {resident.nome} {resident.cognome}
                        </span>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{e.metodoPagamento}</td>
                    <td className={`p-3 text-right font-mono font-bold ${
                      e.tipo === 'Entrata' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {e.tipo === 'Entrata' ? '+' : '-'} € {e.importo.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
