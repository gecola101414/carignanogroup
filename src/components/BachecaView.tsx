import React, { useState } from "react";
import { Pin, Plus, CheckCheck, ShieldCheck, X } from "lucide-react";
import { BachecaNotice, UserCredential } from "../types";

interface BachecaViewProps {
  bacheca: BachecaNotice[];
  currentUser?: UserCredential | null;
  onAddBacheca: (notice: BachecaNotice) => void;
  onUpdateBacheca: (notice: BachecaNotice) => void;
}

export const BachecaView: React.FC<BachecaViewProps> = ({
  bacheca,
  currentUser,
  onAddBacheca,
  onUpdateBacheca
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ titolo: "", testo: "" });

  const currentUsername = currentUser ? (currentUser.role === 'admin' ? `Admin ${currentUser.username}` : currentUser.username) : "Utente";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== 'admin') {
      alert("Solo l'amministratore può pubblicare avvisi sulla bacheca ufficiale.");
      return;
    }
    if (!newNotice.titolo || !newNotice.testo) {
      alert("Inserisci titolo e testo dell'avviso.");
      return;
    }

    const notice: BachecaNotice = {
      id: `bach-${Date.now()}`,
      dataOra: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      autore: currentUsername,
      titolo: newNotice.titolo,
      testo: newNotice.testo,
      visti: [currentUsername]
    };

    onAddBacheca(notice);
    setShowAddModal(false);
    setNewNotice({ titolo: "", testo: "" });
  };

  const handleToggleVisto = (notice: BachecaNotice) => {
    const alreadyVisto = notice.visti.includes(currentUsername);
    const updatedVisti = alreadyVisto 
      ? notice.visti.filter(v => v !== currentUsername)
      : [...notice.visti, currentUsername];

    onUpdateBacheca({
      ...notice,
      visti: updatedVisti
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Pin className="w-6 h-6 text-indigo-600" />
            <span>Bacheca Ufficiale Direzione</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Comunicazioni ufficiali della direzione con obbligo di conferma presa visione (Visto)</p>
        </div>

        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Avviso Bacheca</span>
          </button>
        )}
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Pin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">Nessun avviso in bacheca</h3>
            <p className="text-xs text-slate-400 mt-1">Non ci sono comunicazioni ufficiali della direzione al momento.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Pin className="w-5 h-5 text-indigo-600" />
                <span>Pubblica Avviso in Bacheca</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Titolo Avviso *</label>
                <input
                  type="text"
                  required
                  value={newNotice.titolo}
                  onChange={e => setNewNotice({...newNotice, titolo: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="es. Riunione di coordinamento o cambio protocollo"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Testo della Comunicazione *</label>
                <textarea
                  required
                  rows={5}
                  value={newNotice.testo}
                  onChange={e => setNewNotice({...newNotice, testo: e.target.value})}
                  className="w-full border p-2 rounded-lg"
                  placeholder="Scrivi il testo dell'avviso visibile a tutto il personale..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow cursor-pointer"
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
