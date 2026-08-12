import React, { useState } from "react";
import { 
  BookOpenCheck, 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter, 
  User, 
  Calendar,
  X,
  FileText
} from "lucide-react";
import { DailyLog, Resident, LogCategory, LogPriority } from "../types";

interface DailyLogsViewProps {
  logs: DailyLog[];
  residents: Resident[];
  onAddLog: (log: DailyLog) => void;
  onUpdateLog: (log: DailyLog) => void;
  activeOperator: string;
}

export const DailyLogsView: React.FC<DailyLogsViewProps> = ({
  logs,
  residents,
  onAddLog,
  onUpdateLog,
  activeOperator
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);

  // New Log Form state
  const [newLog, setNewLog] = useState({
    ospiteId: residents[0]?.id || "",
    turno: "Mattina (07:00-14:00)" as any,
    categoria: "Generale" as LogCategory,
    priorita: "Normale" as LogPriority,
    titolo: "",
    descrizione: ""
  });

  const filteredLogs = logs.filter(l => {
    const res = residents.find(r => r.id === l.ospiteId);
    const resName = res ? `${res.nome} ${res.cognome}`.toLowerCase() : "";
    const matchesSearch = l.titolo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.descrizione.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resName.includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "ALL" || l.categoria === categoryFilter;
    const matchesPriority = priorityFilter === "ALL" || l.priorita === priorityFilter;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleCreateLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.titolo || !newLog.descrizione) {
      alert("Inserire titolo e descrizione per la consegna.");
      return;
    }

    const created: DailyLog = {
      id: `log-${Date.now()}`,
      ospiteId: newLog.ospiteId || residents[0]?.id || "",
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      turno: newLog.turno,
      operatore: activeOperator,
      categoria: newLog.categoria,
      priorita: newLog.priorita,
      titolo: newLog.titolo,
      descrizione: newLog.descrizione,
      lettoDaSuccessivo: false
    };

    onAddLog(created);
    setShowAddModal(false);
    setNewLog({
      ospiteId: residents[0]?.id || "",
      turno: "Mattina (07:00-14:00)",
      categoria: "Generale",
      priorita: "Normale",
      titolo: "",
      descrizione: ""
    });
  };

  const handleToggleLogRead = (log: DailyLog) => {
    onUpdateLog({
      ...log,
      lettoDaSuccessivo: !log.lettoDaSuccessivo
    });
  };

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    try {
      const res = await fetch("/api/ai/shift-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logs.slice(0, 10),
          shiftName: "Cambio Turno / Giornaliero",
          date: new Date().toISOString().split("T")[0]
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiSummary(data.summary);
      }
    } catch (e) {
      console.error("Errore AI Sintesi Turno", e);
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-600" />
            <span>Diario di Bordo & Consegne Turno</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Registro eventi, igiene, nutrizione, umore e cambio turno tra operatori OSS</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAiSummary}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAiSummary ? "Sintesi AI..." : "Sintesi Turno AI"}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Consegna</span>
          </button>
        </div>
      </div>

      {/* AI Summary Banner */}
      {aiSummary && (
        <div className="bg-gradient-to-r from-indigo-900 to-purple-950 text-white rounded-2xl p-5 border border-indigo-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <span>Sintesi AI Cambio Turno</span>
            </h3>
            <button onClick={() => setAiSummary(null)} className="text-xs text-indigo-300 hover:text-white">
              Chiudi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-800">
              <strong className="text-indigo-300 block mb-1">Quadro Generale Struttura:</strong>
              <p className="text-slate-200 leading-relaxed">{aiSummary.quadroGenerale}</p>
            </div>

            <div className="bg-indigo-950/80 p-3 rounded-xl border border-indigo-800">
              <strong className="text-amber-300 block mb-1">Raccomandazioni Prossimo Turno:</strong>
              <ul className="list-disc pl-4 text-slate-200 space-y-1">
                {aiSummary.raccomandazioniTurnoSuccessivo?.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per titolo, contenuto o nome dell'ospite..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Tutte le Categorie</option>
            <option value="Nutrizione">Nutrizione</option>
            <option value="Igiene e Cura">Igiene e Cura</option>
            <option value="Umore e Comportamento">Umore e Comportamento</option>
            <option value="Attività e Socializzazione">Attività e Socializzazione</option>
            <option value="Evento / Caduta">Evento / Caduta</option>
            <option value="Visita Medica">Visita Medica</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Tutte le Priorità</option>
            <option value="Normale">Normale</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="space-y-3">
        {filteredLogs.map(log => {
          const res = residents.find(r => r.id === log.ospiteId);

          return (
            <div
              key={log.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${
                log.priorita === "Urgente" 
                  ? "border-rose-400 bg-rose-50/20" 
                  : log.priorita === "Alta"
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-slate-200/80"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {res && (
                    <img src={res.fotoUrl} alt={res.nome} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  )}
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{log.titolo}</h3>
                    <p className="text-xs text-slate-500">
                      Ospite: <strong className="text-slate-800">{res ? `${res.nome} ${res.cognome}` : "Generale"}</strong> • Turno: {log.turno}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    log.priorita === "Urgente" ? "bg-rose-100 text-rose-800" : log.priorita === "Alta" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                  }`}>
                    {log.priorita}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    {log.dataOra} ({log.operatore})
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {log.descrizione}
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Categoria: {log.categoria}</span>

                <button
                  onClick={() => handleToggleLogRead(log)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    log.lettoDaSuccessivo
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{log.lettoDaSuccessivo ? "Consegna Letta" : "Segna come Lento"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Nuova Consegna */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Aggiungi Consegna al Diario</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLogSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Ospite Riferimento *</label>
                <select
                  value={newLog.ospiteId}
                  onChange={e => setNewLog({...newLog, ospiteId: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                >
                  {residents.map(r => (
                    <option key={r.id} value={r.id}>{r.nome} {r.cognome} (Stanza {r.stanzaId.replace("room-", "")})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoria</label>
                  <select
                    value={newLog.categoria}
                    onChange={e => setNewLog({...newLog, categoria: e.target.value as any})}
                    className="w-full border p-2 rounded-lg"
                  >
                    <option value="Nutrizione">Nutrizione</option>
                    <option value="Igiene e Cura">Igiene e Cura</option>
                    <option value="Umore e Comportamento">Umore e Comportamento</option>
                    <option value="Attività e Socializzazione">Attività e Socializzazione</option>
                    <option value="Evento / Caduta">Evento / Caduta</option>
                    <option value="Visita Medica">Visita Medica</option>
                    <option value="Generale">Generale</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Priorità</label>
                  <select
                    value={newLog.priorita}
                    onChange={e => setNewLog({...newLog, priorita: e.target.value as any})}
                    className="w-full border p-2 rounded-lg"
                  >
                    <option value="Normale">Normale</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Titolo Consegna *</label>
                <input
                  type="text"
                  required
                  value={newLog.titolo}
                  onChange={e => setNewLog({...newLog, titolo: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="es. Ottimo appetito a pranzo / Caduta senza traumi"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descrizione Dettagliata *</label>
                <textarea
                  required
                  rows={4}
                  value={newLog.descrizione}
                  onChange={e => setNewLog({...newLog, descrizione: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="Scrivi le osservazioni del turno..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Salva Consegna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
