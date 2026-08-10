import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Stethoscope, 
  UtensilsCrossed, 
  CalendarDays, 
  Receipt, 
  FolderArchive, 
  CalendarClock, 
  Code2, 
  ShieldCheck,
  Search,
  Building,
  Info,
  X
} from 'lucide-react';
import { RSAArea } from '../types';
import { COMPANY_INFO } from '../data/companyInfo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedAreaFilter: RSAArea | 'Tutte';
  setSelectedAreaFilter: (area: RSAArea | 'Tutte') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedAreaFilter,
  setSelectedAreaFilter,
  searchQuery,
  setSearchQuery,
}) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'residents', label: 'Ospiti & Clinica', icon: Users, badge: '35' },
    { id: 'catering', label: 'Ristorazione & ASL', icon: UtensilsCrossed },
    { id: 'staff', label: 'Turni & Personale', icon: CalendarDays },
    { id: 'accounting', label: 'Prima Nota', icon: Receipt },
    { id: 'documents', label: 'Documentale', icon: FolderArchive },
    { id: 'visits', label: 'Visite & Calendario', icon: CalendarClock },
    { id: 'architecture', label: 'Architettura & SQL', icon: Code2, highlight: true },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Corporate Legal Notice Strip */}
      <div className="bg-slate-950 text-slate-300 text-[11px] border-b border-slate-800/80 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-400">{COMPANY_INFO.strutturaNome}</span>
            <span className="text-slate-500">&bull;</span>
            <span>Tel: <strong className="text-slate-100 font-mono">{COMPANY_INFO.telefonoStruttura}</strong> - <strong className="text-slate-100 font-mono">{COMPANY_INFO.cellulareStruttura}</strong></span>
            <span className="text-slate-500 hidden md:inline">&bull;</span>
            <a href={`https://${COMPANY_INFO.sitoWeb}`} target="_blank" rel="noreferrer" className="hidden md:inline text-blue-400 hover:underline font-mono">
              {COMPANY_INFO.sitoWeb}
            </a>
          </div>

          <button
            onClick={() => setShowCompanyModal(true)}
            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium text-[10px] underline"
          >
            <Info className="w-3 h-3" />
            Dati Societari ({COMPANY_INFO.ragioneSociale})
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between py-3 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={COMPANY_INFO.logoImage} 
              alt="Residenza Vannucci Logo" 
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover border border-amber-500/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  Residenza Vannucci
                  <span className="text-xs font-normal text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-700/50">
                    Genova Carignano
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Residenza per Anziani &bull; Gestione Clinica, Turni & Ristorazione &bull; {COMPANY_INFO.ragioneSociale}
              </p>
            </div>
          </div>

          {/* Quick Filters & Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Area Filter Pill */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 font-medium">Area:</span>
              {(['Tutte', 'Piano 1', 'Piano 2', 'Ala Protetta'] as const).map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedAreaFilter(area)}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    selectedAreaFilter === area
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Global Search Input */}
            <div className="relative flex-1 md:w-48">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cerca ospite, farmaco..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : item.highlight
                    ? 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modal Corporate Details */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-slate-800">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-600" />
                Scheda Legale & Registri Societari
              </h3>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 font-medium block text-[10px]">Ragione Sociale</span>
                <strong className="text-slate-900 font-bold text-sm">{COMPANY_INFO.ragioneSociale}</strong>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block text-[10px]">Partita IVA</span>
                  <strong className="text-slate-900 font-mono">{COMPANY_INFO.partitaIva}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block text-[10px]">Codice Fiscale</span>
                  <strong className="text-slate-900 font-mono">{COMPANY_INFO.codiceFiscale}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block text-[10px]">VAT Europeo</span>
                  <strong className="text-slate-900 font-mono">{COMPANY_INFO.vatEuropeo}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium block text-[10px]">Numero REA</span>
                  <strong className="text-slate-900 font-mono">{COMPANY_INFO.rea}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px]">Sede Legale & Operativa</span>
                <strong className="text-slate-900">{COMPANY_INFO.indirizzo} - {COMPANY_INFO.cap} - {COMPANY_INFO.citta} ({COMPANY_INFO.provincia})</strong>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-medium block text-[10px]">Posta Elettronica Certificata (PEC)</span>
                <strong className="text-blue-700 font-mono">{COMPANY_INFO.pec}</strong>
              </div>
            </div>

            <button
              onClick={() => setShowCompanyModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
