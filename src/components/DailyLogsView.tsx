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
  FileText,
  Pin,
  CheckCheck,
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { DailyLog, Resident, LogCategory, LogPriority, UserCredential, StaffMember, Shift, BachecaNotice } from "../types";

interface DailyLogsViewProps {
  logs: DailyLog[];
  residents: Resident[];
  onAddLog: (log: DailyLog) => void;
  onUpdateLog: (log: DailyLog) => void;
  activeOperator: string;
  currentUser?: UserCredential | null;
  staff?: StaffMember[];
  shifts?: Shift[];
  bacheca?: BachecaNotice[];
  onAddBacheca?: (notice: BachecaNotice) => void;
  onUpdateBacheca?: (notice: BachecaNotice) => void;
}

export const DailyLogsView: React.FC<DailyLogsViewProps> = ({
  logs,
  residents,
  onAddLog,
  onUpdateLog,
  activeOperator,
  currentUser,
  staff = [],
  shifts = [],
  bacheca = [],
  onAddBacheca,
  onUpdateBacheca
}) => {
  const [activeTab, setActiveTab] = useState<"diario" | "bacheca">("diario");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddBachecaModal, setShowAddBachecaModal] = useState(false);
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

  // New Bacheca Form state
  const [newBachecaNotice, setNewBachecaNotice] = useState({
    titolo: "",
    testo: ""
  });

  // Check if staff is on shift today
  const todayYMD = new Date().toISOString().split("T")[0];
  const staffMemberObj = currentUser?.role === 'staff'
    ? staff.find(s => s.nome.toLowerCase() === currentUser.username.toLowerCase())
    : null;

  const isOnShiftToday = currentUser?.role === 'admin' || (staffMemberObj ? shifts.some(s => s.staffId === staffMemberObj.id && s.data === todayYMD && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie") : false);

  const currentUsername = currentUser ? (currentUser.role === 'admin' ? `Admin ${currentUser.username}` : currentUser.username) : activeOperator;

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
    if (!isOnShiftToday) {
      alert("⚠️ Accesso limitato: Il diario è una chat qualificata. Puoi scrivere messaggi e consegne solo se ti trovi in turno attivo oggi.");
      return;
    }
    if (!newLog.titolo || !newLog.descrizione) {
      alert("Inserire titolo e descrizione per la consegna.");
      return;
    }

    const created: DailyLog = {
      id: `log-${Date.now()}`,
      ospiteId: newLog.ospiteId || residents[0]?.id || "",
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      turno: newLog.turno,
      operatore: currentUsername,
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

  const handleCreateBachecaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      alert("Solo l'amministratore può scrivere sulla bacheca.");
      return;
    }
    if (!newBachecaNotice.titolo || !newBachecaNotice.testo) {
      alert("Inserisci titolo e testo dell'avviso.");
      return;
    }

    const notice: BachecaNotice = {
      id: `bach-${Date.now()}`,
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      autore: currentUsername,
      titolo: newBachecaNotice.titolo,
      testo: newBachecaNotice.testo,
      visti: [currentUsername]
    };

    if (onAddBacheca) {
      onAddBacheca(notice);
    }
    setShowAddBachecaModal(false);
    setNewBachecaNotice({ titolo: "", testo: "" });
  };

  const handleToggleVisto = (notice: BachecaNotice) => {
    if (!onUpdateBacheca) return;
    const alreadyVisto = notice.visti.includes(currentUsername);
    const updatedVisti = alreadyVisto 
      ? notice.visti.filter(v => v !== currentUsername)
      : [...notice.visti, currentUsername];

    onUpdateBacheca({
      ...notice,
      visti: updatedVisti
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
      
      {/* Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-600" />
            <span>Diario di Bordo & Bacheca Avvisi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Chat qualificata per consegne turno (scrivibile solo se in turno) e bacheca comunicazioni con visto obbligatorio</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setActiveTab("diario")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "diario" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>Diario Consegne (Chat)</span>
            </button>
            <button
              onClick={() => setActiveTab("bacheca")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === "bacheca" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Pin className="w-4 h-4 text-indigo-600" />
              <span>Bacheca Avvisi</span>
              {bacheca.some(b => !b.visti.includes(currentUsername)) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1"></span>
              )}
            </button>
          </div>

          {activeTab === "diario" && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAiSummary}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGeneratingAiSummary ? "Sintesi AI..." : "Sintesi AI"}</span>
              </button>

              <button
                onClick={() => {
                  if (!isOnShiftToday) {
                    alert("⚠️ Accesso limitato: Il Diario Consegne è una chat qualificata. Puoi scrivere solo se ti trovi in turno attivo oggi.");
                    return;
                  }
                  setShowAddModal(true);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all ${
                  isOnShiftToday ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer" : "bg-slate-300 text-slate-600 cursor-not-allowed"
                }`}
                title={isOnShiftToday ? "Aggiungi nuova consegna" : "Non sei in turno oggi: scrittura non consentita"}
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Consegna</span>
              </button>
            </div>
          )}

          {activeTab === "bacheca" && currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAddBachecaModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Avviso Bacheca</span>
            </button>
          )}
        </div>
      </div>

      {/* Shift status banner for staff */}
      {currentUser?.role === 'staff' && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
          isOnShiftToday 
            ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          {isOnShiftToday ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Sei in servizio attivo oggi:</strong> Hai i permessi di scrittura completi sul Diario Consegne.
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Modalità Sola Lettura (Fuori Turno):</strong> Oggi non risulti in servizio attivo. Puoi consultare liberamente il diario e la bacheca, ma la scrittura di nuove consegne è riservata al personale in turno.
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= TAB 1: DIARIO CONSEGNE (CHAT) ================= */}
      {activeTab === "diario" && (
        <>
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
                <option value="Generale">Generale</option>
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

          {/* Logs Feed (Chat format) */}
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{log.titolo}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.priorita === "Urgente" ? "bg-rose-100 text-rose-700" :
                            log.priorita === "Alta" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-700"
                          }`}>
                            {log.priorita}
                          </span>
                        </div>
                        {res && (
                          <p className="text-xs text-slate-500 font-medium">Ospite: {res.nome} {res.cognome} (Stanza {res.stanzaId.replace("room-", "")})</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {log.dataOra}
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-lg">
                        {log.turno}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-1">
                    {log.descrizione}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Operatore: {log.operatore}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-2">{log.categoria}</span>
                    </div>

                    <button
                      onClick={() => handleToggleLogRead(log)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        log.lettoDaSuccessivo
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{log.lettoDaSuccessivo ? "Letto dal Turno Successivo" : "Segna come Letto"}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">Nessuna consegna trovata</h3>
                <p className="text-xs text-slate-400 mt-1">Non ci sono eventi registrati con i filtri selezionati.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: BACHECA AVVISI (ADMIN + VISTO) ================= */}
      {activeTab === "bacheca" && (
        <div className="space-y-4">
          <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pin className="w-6 h-6 text-amber-300 shrink-0" />
              <div>
                <h3 className="font-bold text-sm sm:text-base">Bacheca Ufficiale Direzione & Coordinamento</h3>
                <p className="text-xs text-indigo-200">Ogni collaboratore è tenuto a prendere visione degli avvisi e cliccare sul tasto "Ho Letto / Visto".</p>
              </div>
            </div>
            <div className="text-xs bg-indigo-950 px-3 py-1.5 rounded-xl border border-indigo-700 font-bold">
              {bacheca.length} Avvisi Attivi
            </div>
          </div>

          <div className="space-y-4">
            {bacheca.map(notice => {
              const hasVisto = notice.visti.includes(currentUsername);

              return (
                <div key={notice.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                        <Pin className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900">{notice.titolo}</h4>
                        <p className="text-xs text-slate-500">Pubblicato da <strong className="text-slate-700">{notice.autore}</strong> il {notice.dataOra}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleVisto(notice)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        hasVisto 
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                          : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                      }`}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{hasVisto ? "✓ Visto Confermato (Hai Letto)" : "Segna come Letto (Visto)"}</span>
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {notice.testo}
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">Conferme Visto ({notice.visti.length}):</span>
                      <span className="text-slate-500 truncate max-w-md">{notice.visti.join(", ")}</span>
                    </div>

                    {!hasVisto && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        Azione richiesta: Conferma lettura
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {bacheca.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Pin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">Nessun avviso in bacheca</h3>
                <p className="text-xs text-slate-400 mt-1">Non ci sono comunicazioni ufficiali della direzione.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: NUOVA CONSEGNA (DIARIO) ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-emerald-600" />
                <span>Nuova Consegna / Nota Diario</span>
              </h3>
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
                  placeholder="es. Ottimo appetito a pranzo / Evento notturno"
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
                  Pubblica Consegna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUOVO AVVISO BACHECA (ADMIN) ================= */}
      {showAddBachecaModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Pin className="w-5 h-5 text-indigo-600" />
                <span>Pubblica Avviso in Bacheca (Direzione)</span>
              </h3>
              <button onClick={() => setShowAddBachecaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBachecaSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Titolo Avviso *</label>
                <input
                  type="text"
                  required
                  value={newBachecaNotice.titolo}
                  onChange={e => setNewBachecaNotice({...newBachecaNotice, titolo: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="es. Riunione di coordinamento o cambio protocollo"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Testo della Comunicazione *</label>
                <textarea
                  required
                  rows={5}
                  value={newBachecaNotice.testo}
                  onChange={e => setNewBachecaNotice({...newBachecaNotice, testo: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="Scrivi il testo dell'avviso visibile a tutto il personale..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddBachecaModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
                >
                  Pubblica in Bacheca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
