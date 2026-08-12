import React, { useState } from "react";
import { 
  Pill, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  Printer, 
  Filter, 
  User, 
  ShieldAlert,
  Info
} from "lucide-react";
import { Resident, Therapy } from "../types";

interface MedicationCartViewProps {
  residents: Resident[];
  therapies: Therapy[];
  onUpdateTherapy: (updatedTherapies: Therapy[]) => void;
  activeOperator: string;
}

export const MedicationCartView: React.FC<MedicationCartViewProps> = ({
  residents,
  therapies,
  onUpdateTherapy,
  activeOperator
}) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("08:00");
  const [selectedResidentFilter, setSelectedResidentFilter] = useState<string>("ALL");
  const [analyzingResidentId, setAnalyzingResidentId] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const timeSlots = [
    { time: "08:00", label: "08:00 - Mattina / Colazione" },
    { time: "12:00", label: "12:00 - Pranzo" },
    { time: "13:00", label: "13:00 - Primo Pomeriggio" },
    { time: "17:00", label: "17:00 - Merenda / Pomeriggio" },
    { time: "20:00", label: "20:00 - Cena / Notte" }
  ];

  // Filter therapies for selected time slot or matching slot
  const dueTherapies = therapies.filter(t => {
    const timeMatch = t.orari.some(o => o.startsWith(selectedTimeSlot.substring(0, 2)));
    if (selectedResidentFilter !== "ALL") {
      return timeMatch && t.ospiteId === selectedResidentFilter;
    }
    return timeMatch;
  });

  // Toggle administration status
  const handleToggleAdmin = (therapyId: string, timeSlot: string, somministrato: boolean, nota?: string) => {
    const updated = therapies.map(t => {
      if (t.id !== therapyId) return t;

      const currentDayMap = t.somministrazioni?.[todayStr] || {};
      const newAdmin = {
        somministrato,
        orarioEffettivo: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        operatore: activeOperator,
        nota: nota || (somministrato ? "Somministrazione regolare" : "Non somministrato")
      };

      return {
        ...t,
        somministrazioni: {
          ...(t.somministrazioni || {}),
          [todayStr]: {
            ...currentDayMap,
            [timeSlot]: newAdmin
          }
        }
      };
    });

    onUpdateTherapy(updated);
  };

  // AI Drug Safety Check Call
  const handleRunAiMedCheck = async (resident: Resident) => {
    setAnalyzingResidentId(resident.id);
    setAiAnalysisResult(null);

    const residentTherapies = therapies.filter(t => t.ospiteId === resident.id);

    try {
      const res = await fetch("/api/ai/med-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resident,
          therapies: residentTherapies
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysisResult({ residentName: `${resident.nome} ${resident.cognome}`, ...data.analysis });
      }
    } catch (e) {
      console.error("Errore verifica farmaci AI", e);
    } finally {
      setAnalyzingResidentId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Carrello Somministrazione Farmaci</h2>
              <p className="text-xs text-slate-500">
                Spunta in tempo reale per gli operatori in turno ({activeOperator})
              </p>
            </div>
          </div>
        </div>

        {/* Time Slot Picker */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {timeSlots.map(slot => {
            const isActive = selectedTimeSlot === slot.time;
            return (
              <button
                key={slot.time}
                onClick={() => setSelectedTimeSlot(slot.time)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {slot.time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Filtra per Ospite:</span>
          <select
            value={selectedResidentFilter}
            onChange={(e) => setSelectedResidentFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Tutti gli Ospiti ({residents.length})</option>
            {residents.map(r => (
              <option key={r.id} value={r.id}>
                {r.nome} {r.cognome} (Stanza {r.stanzaId.replace("room-", "")})
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 font-medium">
          Terapie previste per le <strong className="text-slate-900">{selectedTimeSlot}</strong>: <span className="text-emerald-700 font-bold">{dueTherapies.length}</span>
        </div>
      </div>

      {/* AI Analysis Result Callout */}
      {aiAnalysisResult && (
        <div className="bg-indigo-900 text-white rounded-2xl p-5 border border-indigo-700 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <h3 className="font-bold text-base">
                Verifica AI Farmaci: {aiAnalysisResult.residentName}
              </h3>
            </div>
            <button 
              onClick={() => setAiAnalysisResult(null)}
              className="text-xs text-indigo-300 hover:text-white"
            >
              Chiudi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-indigo-950/80 p-3 rounded-xl border border-indigo-800">
            <div>
              <span className="font-bold text-indigo-300 block">Valutazione:</span>
              <p className="text-slate-200 mt-1">{aiAnalysisResult.valutazioneSicurezza}</p>
              <p className="text-slate-300 mt-1">{aiAnalysisResult.sintesiInterazioni}</p>
            </div>
            <div>
              <span className="font-bold text-indigo-300 block">Precauzioni:</span>
              <ul className="list-disc pl-4 text-slate-200 mt-1 space-y-0.5">
                {aiAnalysisResult.precauzioniSomministrazione?.map((p: string, idx: number) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-bold text-amber-300 block">Segnali da Monitorare:</span>
              <ul className="list-disc pl-4 text-slate-200 mt-1 space-y-0.5">
                {aiAnalysisResult.segnaliDaMonitorare?.map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Residents Therapy List */}
      <div className="space-y-4">
        {residents
          .filter(r => selectedResidentFilter === "ALL" || r.id === selectedResidentFilter)
          .map(resident => {
            const residentTherapies = dueTherapies.filter(t => t.ospiteId === resident.id);
            if (residentTherapies.length === 0 && selectedResidentFilter !== "ALL") return null;

            return (
              <div 
                key={resident.id} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                {/* Resident Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img 
                      src={resident.fotoUrl} 
                      alt={resident.nome} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-300" 
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {resident.nome} {resident.cognome}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Stanza {resident.stanzaId.replace("room-", "")} ({resident.letto}) • Allergie: <span className="text-rose-600 font-semibold">{resident.allergie || "Nessuna"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunAiMedCheck(resident)}
                      disabled={analyzingResidentId === resident.id}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{analyzingResidentId === resident.id ? "Analisi AI..." : "Verifica Interazioni AI"}</span>
                    </button>
                  </div>
                </div>

                {/* Therapies Cards */}
                <div className="p-4 space-y-3">
                  {residentTherapies.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      Nessun farmaco in programma per le {selectedTimeSlot} per questo ospite.
                    </div>
                  ) : (
                    residentTherapies.map(therapy => {
                      const matchedSlot = therapy.orari.find(o => o.startsWith(selectedTimeSlot.substring(0, 2))) || selectedTimeSlot;
                      const adminState = therapy.somministrazioni?.[todayStr]?.[matchedSlot];
                      const isDone = adminState?.somministrato;

                      return (
                        <div 
                          key={therapy.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isDone 
                              ? "bg-emerald-50/40 border-emerald-200" 
                              : therapy.isPrimaNecessita 
                              ? "bg-amber-50/40 border-amber-300" 
                              : "bg-white border-slate-200"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 text-base">
                                {therapy.nomeFarmaco}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {therapy.dosaggio}
                              </span>
                              {therapy.isPrimaNecessita && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  Prioritario / Salvavita
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600">
                              Via: <strong>{therapy.viaSomministrazione}</strong> • Orari prescritti: {therapy.orari.join(", ")}
                            </p>

                            {therapy.note && (
                              <p className="text-xs text-amber-800 bg-amber-100/60 px-2 py-1 rounded italic font-medium inline-block">
                                Note: {therapy.note}
                              </p>
                            )}

                            {isDone && adminState && (
                              <div className="text-xs text-emerald-800 font-medium flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  Somministrato alle {adminState.orarioEffettivo} da {adminState.operatore} ({adminState.nota})
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isDone ? (
                              <button
                                onClick={() => handleToggleAdmin(therapy.id, matchedSlot, false, "Annullato da operatore")}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                              >
                                Annulla Spunta
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleAdmin(therapy.id, matchedSlot, true)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Segna Somministrato</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const motivo = prompt("Motivo della mancata somministrazione (es. Rifiuto, Nausea, Sospeso):", "Rifiuto dall'ospite");
                                    if (motivo) {
                                      handleToggleAdmin(therapy.id, matchedSlot, false, motivo);
                                    }
                                  }}
                                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Non Dato</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
      </div>

    </div>
  );
};
