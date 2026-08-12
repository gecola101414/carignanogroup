import React, { useState } from "react";
import { 
  HeartHandshake, 
  Search, 
  Bell, 
  Plus, 
  Pill, 
  Activity, 
  FileText, 
  RotateCcw, 
  PhoneCall, 
  UserCheck, 
  Calendar,
  Sparkles,
  Printer
} from "lucide-react";
import { Resident } from "../types";

interface NavbarProps {
  residents: Resident[];
  onSelectResident: (res: Resident) => void;
  onOpenNewResidentModal: () => void;
  onOpenMedCart: () => void;
  onOpenVitalModal: () => void;
  onOpenLogModal: () => void;
  onResetData: () => void;
  activeOperator: string;
  onChangeOperator: (operator: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  residents,
  onSelectResident,
  onOpenNewResidentModal,
  onOpenMedCart,
  onOpenVitalModal,
  onOpenLogModal,
  onResetData,
  activeOperator,
  onChangeOperator
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const filteredResidents = residents.filter(r => 
    `${r.nome} ${r.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.stanzaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.codiceFiscale.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayFormatted = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white leading-none">RESIDENZA VANNUCCI</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-500/30">
                  Casa Famiglia
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>Gestionale Anziani & RSA</span>
                <span>•</span>
                <span className="capitalize">{todayFormatted}</span>
              </p>
            </div>
          </div>

          {/* Search Bar for Residents */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Cerca ospite (es. Maria, Stanza 101, CF)..."
                className="w-full bg-slate-800/80 text-sm text-slate-100 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Dropdown Search Results */}
            {showSearchResults && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-slate-700/60 text-xs text-slate-400 font-medium">
                  Risultati per "{searchQuery}" ({filteredResidents.length})
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/40">
                  {filteredResidents.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">Nessun ospite trovato</div>
                  ) : (
                    filteredResidents.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onSelectResident(r);
                          setSearchQuery("");
                          setShowSearchResults(false);
                        }}
                        className="w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-700/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={r.fotoUrl} 
                            alt={r.nome} 
                            className="w-9 h-9 rounded-full object-cover border border-slate-600" 
                          />
                          <div>
                            <div className="text-sm font-semibold text-slate-100">{r.nome} {r.cognome}</div>
                            <div className="text-xs text-slate-400">
                              Stanza {r.stanzaId.replace("room-", "")} ({r.letto}) • Autonomia: {r.livelloAutonomia}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          r.stato === "Presente" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {r.stato}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions & Operator Status */}
          <div className="flex items-center gap-2">
            
            {/* Quick Action Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={onOpenMedCart}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                title="Carrello Somministrazione Farmaci"
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Carrello Farmaci</span>
              </button>

              <button
                onClick={onOpenVitalModal}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Registra Parametri Vitali"
              >
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Parametri</span>
              </button>

              <button
                onClick={onOpenLogModal}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                title="Aggiungi Consegna Diario"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Diario</span>
              </button>

              <button
                onClick={onOpenNewResidentModal}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo Ospite</span>
              </button>
            </div>

            {/* Operator Switcher */}
            <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="hidden sm:block">
                <span className="text-[10px] text-slate-400 block leading-none">In Turno:</span>
                <span className="font-medium text-slate-200">{activeOperator}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                sessionStorage.removeItem("current_user");
                window.location.reload();
              }}
              title="Disconnetti"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
            >
              <span>Esci</span>
            </button>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              title="Ripristina Dati Iniziali Demo"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
