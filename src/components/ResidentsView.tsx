import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  Bed, 
  Heart, 
  Activity, 
  Pill, 
  BookOpenCheck, 
  Sparkles, 
  Printer, 
  Edit3, 
  X, 
  FileText,
  UserCheck,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ChevronDown
} from "lucide-react";

import { Resident, Therapy, VitalSign, DailyLog, PAI, Room } from "../types";
import { VitalSignsChart } from "./VitalSignsChart";

interface ResidentsViewProps {
  residents: Resident[];
  rooms: Room[];
  therapies: Therapy[];
  vitals: VitalSign[];
  logs: DailyLog[];
  pais: PAI[];
  selectedResident: Resident | null;
  onSelectResident: (res: Resident | null) => void;
  onAddResident: (res: Resident) => void;
  onUpdateResident: (res: Resident) => void;
  onAddTherapy: (therapy: Therapy) => void;
  onAddVital: (vital: VitalSign) => void;
  onAddLog: (log: DailyLog) => void;
  onSavePai: (pai: PAI) => void;
  activeOperator: string;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  residents,
  rooms,
  therapies,
  vitals,
  logs,
  pais,
  selectedResident,
  onSelectResident,
  onAddResident,
  onUpdateResident,
  onAddTherapy,
  onAddVital,
  onAddLog,
  onSavePai,
  activeOperator
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [autonomyFilter, setAutonomyFilter] = useState<string>("ALL");
  const [activeDetailTab, setActiveDetailTab] = useState<"info" | "therapies" | "vitals" | "logs" | "pai">("info");

  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingPaiAi, setIsGeneratingPaiAi] = useState(false);

  // New Resident Form State
  const [newResForm, setNewResForm] = useState<Partial<Resident>>({
    nome: "",
    cognome: "",
    dataNascita: "1940-01-01",
    codiceFiscale: "",
    stanzaId: rooms[0]?.id || "room-101",
    letto: "Letto A",
    medicoCurante: "Dr. Marco Bellini",
    telefonoMedico: "+39 06 88776611",
    contattoFamiglia: { nome: "", parentela: "Figlio/a", telefono: "", email: "" },
    allergie: "Nessuna",
    patologie: "",
    stato: "Presente",
    dataIngresso: new Date().toISOString().split("T")[0],
    dieta: "Standard",
    livelloAutonomia: "Parzialmente Autonomo",
    deambulazione: "Libera",
    fotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"
  });

  // New Vital Sign Form State for Detail View
  const [newVital, setNewVital] = useState({
    pressioneSistolica: 120,
    pressioneDiastolica: 80,
    frequenzaCardiaca: 72,
    glicemia: 110,
    temperatura: 36.5,
    saturazioneO2: 98,
    peso: 65,
    note: ""
  });

  // Filtered residents list
  const filteredResidents = residents.filter(r => {
    const matchesSearch = `${r.nome} ${r.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.codiceFiscale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.stanzaId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.stato === statusFilter;
    const matchesAutonomy = autonomyFilter === "ALL" || r.livelloAutonomia === autonomyFilter;
    return matchesSearch && matchesStatus && matchesAutonomy;
  });

  const handleCreateResidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResForm.nome || !newResForm.cognome) {
      alert("Inserire nome e cognome dell'ospite.");
      return;
    }

    const created: Resident = {
      id: `res-${Date.now()}`,
      nome: newResForm.nome!,
      cognome: newResForm.cognome!,
      fotoUrl: newResForm.fotoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
      dataNascita: newResForm.dataNascita || "1940-01-01",
      codiceFiscale: newResForm.codiceFiscale || `CF${Date.now()}`,
      stanzaId: newResForm.stanzaId || rooms[0]?.id || "room-101",
      letto: newResForm.letto || "Letto A",
      medicoCurante: newResForm.medicoCurante || "Dr. Marco Bellini",
      telefonoMedico: newResForm.telefonoMedico,
      contattoFamiglia: newResForm.contattoFamiglia || { nome: "", parentela: "Figlio", telefono: "", email: "" },
      allergie: newResForm.allergie || "Nessuna",
      patologie: newResForm.patologie || "",
      stato: (newResForm.stato as any) || "Presente",
      dataIngresso: newResForm.dataIngresso || new Date().toISOString().split("T")[0],
      dieta: newResForm.dieta || "Standard",
      noteComportamentali: newResForm.noteComportamentali || "",
      livelloAutonomia: (newResForm.livelloAutonomia as any) || "Parzialmente Autonomo",
      deambulazione: (newResForm.deambulazione as any) || "Libera"
    };

    onAddResident(created);
    setShowAddModal(false);
    onSelectResident(created);
  };

  const handleAddVitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) return;

    const vitalObj: VitalSign = {
      id: `vit-${Date.now()}`,
      ospiteId: selectedResident.id,
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      pressioneSistolica: Number(newVital.pressioneSistolica),
      pressioneDiastolica: Number(newVital.pressioneDiastolica),
      frequenzaCardiaca: Number(newVital.frequenzaCardiaca),
      glicemia: Number(newVital.glicemia),
      temperatura: Number(newVital.temperatura),
      saturazioneO2: Number(newVital.saturazioneO2),
      peso: Number(newVital.peso),
      operatore: activeOperator,
      note: newVital.note
    };

    onAddVital(vitalObj);
    alert("Parametro vitali salvato con successo!");
  };

  // AI PAI Generation
  const handleGeneratePaiWithAi = async () => {
    if (!selectedResident) return;
    setIsGeneratingPaiAi(true);

    const residentLogs = logs.filter(l => l.ospiteId === selectedResident.id);
    const residentVitals = vitals.filter(v => v.ospiteId === selectedResident.id);
    const existingPai = pais.find(p => p.ospiteId === selectedResident.id);

    try {
      const res = await fetch("/api/ai/generate-pai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident: selectedResident,
          dailyLogs: residentLogs,
          vitalSigns: residentVitals,
          existingPai
        })
      });

      const data = await res.json();
      if (data.success && data.pai) {
        const newPai: PAI = {
          id: `pai-${Date.now()}`,
          ospiteId: selectedResident.id,
          dataCompilazione: new Date().toISOString().split("T")[0],
          dataProssimaRevisione: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          obiettiviAutonomia: data.pai.obiettiviAutonomia,
          obiettiviSanitari: data.pai.obiettiviSanitari,
          attivitaCognitive: data.pai.attivitaCognitive,
          indicazioniCaregiver: data.pai.indicazioniCaregiver,
          frequenzaMonitoraggio: data.pai.frequenzaMonitoraggio,
          raccomandazioniMiglioramento: data.pai.raccomandazioniMiglioramento || [],
          compilatore: activeOperator,
          generatoConAI: true
        };

        onSavePai(newPai);
        alert("Piano Assistenziale Individualizzato (PAI) elaborato con successo dall'AI!");
      }
    } catch (e) {
      console.error("Errore PAI AI:", e);
      alert("Errore nella generazione del PAI con AI.");
    } finally {
      setIsGeneratingPaiAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Ospiti & Cartelle Socio-Sanitarie</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Anagrafica completa, PAI, terapie, parametri vitali e contatti familiari</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Accoglimento Ospite</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome, cognome, codice fiscale o stanza..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Tutti gli Stati</option>
            <option value="Presente">Presente</option>
            <option value="Uscita Temporanea">Uscita Temporanea</option>
            <option value="Ospedalizzato">Ospedalizzato</option>
          </select>

          <select
            value={autonomyFilter}
            onChange={(e) => setAutonomyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="ALL">Tutte le Autonomie</option>
            <option value="Autonomo">Autonomo</option>
            <option value="Parzialmente Autonomo">Parzialmente Autonomo</option>
            <option value="Non Autonomo">Non Autonomo</option>
          </select>
        </div>
      </div>

      {/* Residents Grid & Drawer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Residents List Column (1 Col if detailed, 3 cols if none selected) */}
        <div className={selectedResident ? "lg:col-span-1 space-y-3" : "lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
          {filteredResidents.map(resident => {
            const isSelected = selectedResident?.id === resident.id;
            const resRoom = rooms.find(r => r.id === resident.stanzaId);

            return (
              <div
                key={resident.id}
                onClick={() => onSelectResident(resident)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white hover:shadow-md ${
                  isSelected 
                    ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-lg" 
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={resident.fotoUrl}
                    alt={resident.nome}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-100 shrink-0 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {resident.nome} {resident.cognome}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        resident.stato === "Presente" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {resident.stato}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      Stanza {resRoom?.numero || resident.stanzaId.replace("room-", "")} ({resident.letto})
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {resident.livelloAutonomia}
                      </span>
                      <span className="text-slate-400 font-mono">
                        CF: {resident.codiceFiscale.slice(0, 6)}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Resident File Detail View (2 Cols when selected) */}
        {selectedResident && (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden space-y-6 p-6">
            
            {/* Header / Banner of Selected Resident */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 text-white p-5 rounded-2xl">
              <div className="flex items-center gap-4">
                <img
                  src={selectedResident.fotoUrl}
                  alt={selectedResident.nome}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shrink-0 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white">
                      {selectedResident.nome} {selectedResident.cognome}
                    </h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      Stanza {selectedResident.stanzaId.replace("room-", "")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Nato/a il {selectedResident.dataNascita} • CF: {selectedResident.codiceFiscale} • Inizio accoglimento: {selectedResident.dataIngresso}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Stampa Scheda 118</span>
                </button>
                <button
                  onClick={() => onSelectResident(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tab Navigation in Resident File */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveDetailTab("info")}
                className={`px-3 py-2 rounded-xl transition-all ${
                  activeDetailTab === "info" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Anagrafica & Sanità
              </button>

              <button
                onClick={() => setActiveDetailTab("therapies")}
                className={`px-3 py-2 rounded-xl transition-all ${
                  activeDetailTab === "therapies" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Terapie ({therapies.filter(t => t.ospiteId === selectedResident.id).length})
              </button>

              <button
                onClick={() => setActiveDetailTab("vitals")}
                className={`px-3 py-2 rounded-xl transition-all ${
                  activeDetailTab === "vitals" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Parametri Vitali & Grafico
              </button>

              <button
                onClick={() => setActiveDetailTab("logs")}
                className={`px-3 py-2 rounded-xl transition-all ${
                  activeDetailTab === "logs" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Diario ({logs.filter(l => l.ospiteId === selectedResident.id).length})
              </button>

              <button
                onClick={() => setActiveDetailTab("pai")}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1 ${
                  activeDetailTab === "pai" ? "bg-indigo-600 text-white" : "text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>PAI (Piano Assistenziale)</span>
              </button>
            </div>

            {/* Tab Content 1: Anagrafica & Sanità */}
            {activeDetailTab === "info" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-600" />
                      <span>Quadro Quadro Clinico & Dieta</span>
                    </h4>
                    <p><strong>Patologie:</strong> {selectedResident.patologie || "Nessuna patologia rilevante"}</p>
                    <p><strong>Allergie:</strong> <span className="text-rose-600 font-bold">{selectedResident.allergie || "Nessuna"}</span></p>
                    <p><strong>Dieta prescritta:</strong> {selectedResident.dieta}</p>
                    <p><strong>Deambulazione:</strong> {selectedResident.deambulazione}</p>
                    <p><strong>Medico Curante:</strong> {selectedResident.medicoCurante} ({selectedResident.telefonoMedico})</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-indigo-600" />
                      <span>Contatto Familiare di Riferimento</span>
                    </h4>
                    <p><strong>Nome:</strong> {selectedResident.contattoFamiglia.nome}</p>
                    <p><strong>Parentela:</strong> {selectedResident.contattoFamiglia.parentela}</p>
                    <p><strong>Telefono:</strong> {selectedResident.contattoFamiglia.telefono}</p>
                    <p><strong>Email:</strong> {selectedResident.contattoFamiglia.email}</p>
                    {selectedResident.contattoFamiglia.indirizzo && (
                      <p><strong>Indirizzo:</strong> {selectedResident.contattoFamiglia.indirizzo}</p>
                    )}
                  </div>
                </div>

                {selectedResident.noteComportamentali && (
                  <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
                    <h4 className="font-bold text-sm mb-1">Note Comportamentali e Preferenze:</h4>
                    <p>{selectedResident.noteComportamentali}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 2: Terapie */}
            {activeDetailTab === "therapies" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Farmaci in Somministrazione</h4>
                </div>

                <div className="space-y-2 text-xs">
                  {therapies.filter(t => t.ospiteId === selectedResident.id).map(therapy => (
                    <div key={therapy.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{therapy.nomeFarmaco} ({therapy.dosaggio})</div>
                        <div className="text-slate-500">Via: {therapy.viaSomministrazione} • Orari: {therapy.orari.join(", ")}</div>
                        {therapy.note && <div className="text-amber-800 italic mt-0.5">Note: {therapy.note}</div>}
                      </div>
                      <span className="font-mono text-slate-500">{therapy.prescrittore}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content 3: Parametri & Grafico */}
            {activeDetailTab === "vitals" && (
              <div className="space-y-6">
                <VitalSignsChart vitals={vitals.filter(v => v.ospiteId === selectedResident.id)} />

                {/* Form per nuova misurazione veloce */}
                <form onSubmit={handleAddVitalSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Registra Nuova Rilevazione Parametri</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">PAS (Sistolica)</label>
                      <input 
                        type="number" 
                        value={newVital.pressioneSistolica} 
                        onChange={e => setNewVital({...newVital, pressioneSistolica: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-300 p-2 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">PAD (Diastolica)</label>
                      <input 
                        type="number" 
                        value={newVital.pressioneDiastolica} 
                        onChange={e => setNewVital({...newVital, pressioneDiastolica: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-300 p-2 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Glicemia (mg/dL)</label>
                      <input 
                        type="number" 
                        value={newVital.glicemia} 
                        onChange={e => setNewVital({...newVital, glicemia: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-300 p-2 rounded-lg" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Sat O2 (%)</label>
                      <input 
                        type="number" 
                        value={newVital.saturazioneO2} 
                        onChange={e => setNewVital({...newVital, saturazioneO2: Number(e.target.value)})}
                        className="w-full bg-white border border-slate-300 p-2 rounded-lg" 
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                  >
                    Salva Misurazione
                  </button>
                </form>
              </div>
            )}

            {/* Tab Content 4: Diario */}
            {activeDetailTab === "logs" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Cronologia Annotazioni Diario</h4>
                <div className="space-y-2 text-xs">
                  {logs.filter(l => l.ospiteId === selectedResident.id).map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{log.titolo}</span>
                        <span className="text-slate-400 font-mono">{log.dataOra} ({log.operatore})</span>
                      </div>
                      <p className="text-slate-700">{log.descrizione}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content 5: PAI (Piano Assistenziale Individualizzato AI) */}
            {activeDetailTab === "pai" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-900 text-white p-4 rounded-xl">
                  <div>
                    <h4 className="font-bold text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-300" />
                      <span>Piano Assistenziale Individualizzato (PAI)</span>
                    </h4>
                    <p className="text-xs text-indigo-200">Elaborazione socio-sanitaria periodica formalizzata</p>
                  </div>

                  <button
                    onClick={handleGeneratePaiWithAi}
                    disabled={isGeneratingPaiAi}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isGeneratingPaiAi ? "Elaborazione AI..." : "Rigenera PAI con AI"}
                  </button>
                </div>

                {pais.find(p => p.ospiteId === selectedResident.id) ? (
                  (() => {
                    const paiData = pais.find(p => p.ospiteId === selectedResident.id)!;
                    return (
                      <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <strong className="text-indigo-900 block font-bold text-sm">Obiettivi Autonomia:</strong>
                          <p className="text-slate-700 mt-0.5">{paiData.obiettiviAutonomia}</p>
                        </div>
                        <div>
                          <strong className="text-indigo-900 block font-bold text-sm">Obiettivi Sanitari & Monitoraggio:</strong>
                          <p className="text-slate-700 mt-0.5">{paiData.obiettiviSanitari}</p>
                        </div>
                        <div>
                          <strong className="text-indigo-900 block font-bold text-sm">Attività Cognitive & Socializzazione:</strong>
                          <p className="text-slate-700 mt-0.5">{paiData.attivitaCognitive}</p>
                        </div>
                        <div>
                          <strong className="text-indigo-900 block font-bold text-sm">Indicazioni Operative per Operatori (OSS):</strong>
                          <p className="text-slate-700 mt-0.5">{paiData.indicazioniCaregiver}</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Nessun PAI ancora compilato. Clicca su <strong>"Rigenera PAI con AI"</strong> per sintetizzarlo automaticamente!
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Modal Accoglimento Nuovo Ospite */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">Nuovo Accoglimento Ospite</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResidentSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={newResForm.nome}
                    onChange={e => setNewResForm({...newResForm, nome: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                    placeholder="es. Giovanni"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cognome *</label>
                  <input
                    type="text"
                    required
                    value={newResForm.cognome}
                    onChange={e => setNewResForm({...newResForm, cognome: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                    placeholder="es. Verdi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Data Nascita</label>
                  <input
                    type="date"
                    value={newResForm.dataNascita}
                    onChange={e => setNewResForm({...newResForm, dataNascita: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Codice Fiscale</label>
                  <input
                    type="text"
                    value={newResForm.codiceFiscale}
                    onChange={e => setNewResForm({...newResForm, codiceFiscale: e.target.value.toUpperCase()})}
                    className="w-full border p-2 rounded-lg"
                    placeholder="es. VRDGVN38A01H501Z"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Stanza Assegnata</label>
                  <select
                    value={newResForm.stanzaId}
                    onChange={e => setNewResForm({...newResForm, stanzaId: e.target.value})}
                    className="w-full border p-2 rounded-lg"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>Stanza {r.numero} (Piano {r.piano})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Livello Autonomia</label>
                  <select
                    value={newResForm.livelloAutonomia}
                    onChange={e => setNewResForm({...newResForm, livelloAutonomia: e.target.value as any})}
                    className="w-full border p-2 rounded-lg"
                  >
                    <option value="Autonomo">Autonomo</option>
                    <option value="Parzialmente Autonomo">Parzialmente Autonomo</option>
                    <option value="Non Autonomo">Non Autonomo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Patologie e Diagnosi</label>
                <textarea
                  value={newResForm.patologie}
                  onChange={e => setNewResForm({...newResForm, patologie: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  rows={2}
                  placeholder="es. Ipertensione, Diabete, Artrosi"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Allergie e Intolleranze</label>
                <input
                  type="text"
                  value={newResForm.allergie}
                  onChange={e => setNewResForm({...newResForm, allergie: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="es. Penicillina, Lattosio"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Conferma Accoglimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
