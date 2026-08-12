import React, { useState } from "react";
import { Sparkles, Pill, Heart, FileText, CheckCircle2, ShieldAlert, Activity } from "lucide-react";
import { Resident, Therapy, VitalSign, DailyLog, PAI } from "../types";

interface PaiAssistantViewProps {
  residents: Resident[];
  therapies: Therapy[];
  vitals: VitalSign[];
  logs: DailyLog[];
  pais: PAI[];
  onSavePai: (pai: PAI) => void;
  activeOperator: string;
}

export const PaiAssistantView: React.FC<PaiAssistantViewProps> = ({
  residents,
  therapies,
  vitals,
  logs,
  pais,
  onSavePai,
  activeOperator
}) => {
  const [selectedResidentId, setSelectedResidentId] = useState<string>(residents[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPai, setGeneratedPai] = useState<any>(null);

  const selectedResident = residents.find(r => r.id === selectedResidentId);

  const handleGeneratePai = async () => {
    if (!selectedResident) return;
    setIsLoading(true);

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
        setGeneratedPai(data.pai);
      }
    } catch (e) {
      console.error("Errore generazione PAI AI", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSavePai = () => {
    if (!selectedResident || !generatedPai) return;

    const paiObj: PAI = {
      id: `pai-${Date.now()}`,
      ospiteId: selectedResident.id,
      dataCompilazione: new Date().toISOString().split("T")[0],
      dataProssimaRevisione: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      obiettiviAutonomia: generatedPai.obiettiviAutonomia,
      obiettiviSanitari: generatedPai.obiettiviSanitari,
      attivitaCognitive: generatedPai.attivitaCognitive,
      indicazioniCaregiver: generatedPai.indicazioniCaregiver,
      frequenzaMonitoraggio: generatedPai.frequenzaMonitoraggio,
      raccomandazioniMiglioramento: generatedPai.raccomandazioniMiglioramento || [],
      compilatore: activeOperator,
      generatoConAI: true
    };

    onSavePai(paiObj);
    alert("Piano Assistenziale Individualizzato (PAI) salvato ufficialmente nella cartella dell'ospite!");
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white rounded-2xl p-6 border border-indigo-800 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligenza Artificiale Generativa per Strutture Anziani</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">Assistente PAI & Consulenza Socio-Sanitaria</h2>
        <p className="text-xs text-indigo-200 max-w-2xl">
          Sintesi automatica delle cartelle, generazione Piano Assistenziale Individualizzato (PAI) e verifica raccomandazioni operative per il personale.
        </p>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        
        {/* Resident Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Seleziona Ospite:</label>
            <select
              value={selectedResidentId}
              onChange={(e) => {
                setSelectedResidentId(e.target.value);
                setGeneratedPai(null);
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {residents.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nome} {r.cognome} (Stanza {r.stanzaId.replace("room-", "")})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGeneratePai}
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? "Elaborazione in corso..." : "Genera PAI con AI"}</span>
          </button>
        </div>

        {/* Selected Resident Profile Summary */}
        {selectedResident && (
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 text-xs space-y-2">
            <h3 className="font-bold text-indigo-900 text-sm">
              Inquadramento: {selectedResident.nome} {selectedResident.cognome} ({selectedResident.dataNascita})
            </h3>
            <p className="text-slate-700"><strong>Patologie:</strong> {selectedResident.patologie || "Nessuna"}</p>
            <p className="text-slate-700"><strong>Allergie:</strong> {selectedResident.allergie || "Nessuna"}</p>
            <p className="text-slate-700"><strong>Livello Autonomia:</strong> {selectedResident.livelloAutonomia}</p>
          </div>
        )}

        {/* AI Result Card */}
        {generatedPai && (
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Bozza PAI Generata dall'AI</span>
              </h3>

              <button
                onClick={handleConfirmSavePai}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                Conferma & Salva in Cartella
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-indigo-900 font-bold block text-sm">Obiettivi Autonomia:</strong>
                <p className="text-slate-700">{generatedPai.obiettiviAutonomia}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-indigo-900 font-bold block text-sm">Obiettivi Sanitari:</strong>
                <p className="text-slate-700">{generatedPai.obiettiviSanitari}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-indigo-900 font-bold block text-sm">Attività Cognitive:</strong>
                <p className="text-slate-700">{generatedPai.attivitaCognitive}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-indigo-900 font-bold block text-sm">Indicazioni Operatori (OSS):</strong>
                <p className="text-slate-700">{generatedPai.indicazioniCaregiver}</p>
              </div>
            </div>

            {generatedPai.raccomandazioniMiglioramento && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <strong className="font-bold block mb-1">Raccomandazioni di Miglioramento:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  {generatedPai.raccomandazioniMiglioramento.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
