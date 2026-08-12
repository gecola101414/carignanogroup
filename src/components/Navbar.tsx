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
  userRole?: "admin" | "staff";
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
  onChangeOperator,
  userRole = "admin"
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

          {/* Quick Actions & Operator Status */}
          <div className="flex items-center gap-2">
            
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
