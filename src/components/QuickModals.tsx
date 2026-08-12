import React, { useState } from "react";
import { X, Activity, FileText, Plus } from "lucide-react";
import { Resident, VitalSign, DailyLog, LogCategory, LogPriority } from "../types";

interface QuickVitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: Resident[];
  onAddVital: (v: VitalSign) => void;
  activeOperator: string;
}

export const QuickVitalModal: React.FC<QuickVitalModalProps> = ({
  isOpen,
  onClose,
  residents,
  onAddVital,
  activeOperator
}) => {
  const [selectedResidentId, setSelectedResidentId] = useState<string>(residents[0]?.id || "");
  const [pressioneSistolica, setPressioneSistolica] = useState(125);
  const [pressioneDiastolica, setPressioneDiastolica] = useState(80);
  const [frequenzaCardiaca, setFrequenzaCardiaca] = useState(72);
  const [glicemia, setGlicemia] = useState(110);
  const [saturazioneO2, setSaturazioneO2] = useState(98);
  const [temperatura, setTemperatura] = useState(36.5);
  const [peso, setPeso] = useState(65);
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vitalObj: VitalSign = {
      id: `vit-${Date.now()}`,
      ospiteId: selectedResidentId,
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      pressioneSistolica: Number(pressioneSistolica),
      pressioneDiastolica: Number(pressioneDiastolica),
      frequenzaCardiaca: Number(frequenzaCardiaca),
      glicemia: Number(glicemia),
      saturazioneO2: Number(saturazioneO2),
      temperatura: Number(temperatura),
      peso: Number(peso),
      operatore: activeOperator,
      note
    };

    onAddVital(vitalObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-600" />
            <span>Registrazione Parametri Vitali</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Seleziona Ospite *</label>
            <select
              value={selectedResidentId}
              onChange={e => setSelectedResidentId(e.target.value)}
              className="w-full border p-2 rounded-lg font-medium"
            >
              {residents.map(r => (
                <option key={r.id} value={r.id}>{r.nome} {r.cognome} (Stanza {r.stanzaId.replace("room-", "")})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">PAS Sistolica (mmHg)</label>
              <input
                type="number"
                value={pressioneSistolica}
                onChange={e => setPressioneSistolica(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">PAD Diastolica (mmHg)</label>
              <input
                type="number"
                value={pressioneDiastolica}
                onChange={e => setPressioneDiastolica(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">FC (bpm)</label>
              <input
                type="number"
                value={frequenzaCardiaca}
                onChange={e => setFrequenzaCardiaca(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Glicemia (mg/dL)</label>
              <input
                type="number"
                value={glicemia}
                onChange={e => setGlicemia(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Sat O2 (%)</label>
              <input
                type="number"
                value={saturazioneO2}
                onChange={e => setSaturazioneO2(Number(e.target.value))}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Note Rilevazione</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border p-2 rounded-lg"
              placeholder="es. Rilevata a riposo prima della colazione"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
            >
              Salva Misurazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
