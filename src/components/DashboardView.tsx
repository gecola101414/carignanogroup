import React from 'react';
import { 
  Users, 
  BedDouble, 
  Stethoscope, 
  Pill, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  UserCheck, 
  PhoneCall, 
  Building,
  ArrowUpRight,
  ShieldAlert,
  Globe,
  MapPin,
  Building2,
  Phone
} from 'lucide-react';
import { Resident, Shift, SpecialistVisit, DrugAdministration, RSAArea } from '../types';
import { COMPANY_INFO } from '../data/companyInfo';

interface DashboardViewProps {
  residents: Resident[];
  shifts: Shift[];
  specialistVisits: SpecialistVisit[];
  administrations: DrugAdministration[];
  selectedAreaFilter: RSAArea | 'Tutte';
  onNavigateTab: (tab: string) => void;
  onOpenNewDiaryModal: () => void;
  onOpenNewVisitModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  residents,
  shifts,
  specialistVisits,
  administrations,
  selectedAreaFilter,
  onNavigateTab,
  onOpenNewDiaryModal,
  onOpenNewVisitModal,
}) => {
  const filteredResidents = selectedAreaFilter === 'Tutte' 
    ? residents 
    : residents.filter(r => r.areaAssegnata === selectedAreaFilter);

  const activeCount = filteredResidents.filter(r => r.stato === 'Attivo').length;
  const hospitalCount = filteredResidents.filter(r => r.stato === 'In Ospedale').length;

  const areaCounts = {
    'Piano 1': residents.filter(r => r.areaAssegnata === 'Piano 1' && r.stato === 'Attivo').length,
    'Piano 2': residents.filter(r => r.areaAssegnata === 'Piano 2' && r.stato === 'Attivo').length,
    'Ala Protetta': residents.filter(r => r.areaAssegnata === 'Ala Protetta' && r.stato === 'Attivo').length,
  };

  const dysphagiaCount = filteredResidents.filter(r => r.noteDisfagia && r.noteDisfagia.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Residenza Vannucci Branding Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl overflow-hidden shadow-lg border border-amber-400/40 text-white relative">
        <div className="grid grid-cols-1 md:grid-cols-12 items-center">
          <div className="md:col-span-7 p-6 space-y-3 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-amber-100" />
                {COMPANY_INFO.ragioneSociale}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-100 border border-amber-800/40">
                P.IVA {COMPANY_INFO.partitaIva}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Residenza VANNUCCI
            </h1>

            <p className="text-amber-100 font-medium text-sm sm:text-base tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-200 shrink-0" />
              RESIDENZA PER ANZIANI &bull; GENOVA CARIGNANO
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-amber-950">
              <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl shadow-sm">
                <Phone className="w-3.5 h-3.5 text-amber-700" />
                <span>Tel: <strong>{COMPANY_INFO.telefonoStruttura}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl shadow-sm">
                <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                <span>Cell: <strong>{COMPANY_INFO.cellulareStruttura}</strong></span>
              </div>

              <a 
                href={`https://${COMPANY_INFO.sitoWeb}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>{COMPANY_INFO.sitoWeb}</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-5 h-48 md:h-full relative min-h-[180px] overflow-hidden">
            <img 
              src={COMPANY_INFO.bannerImage} 
              alt="Residenza Vannucci Sign" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-orange-500 via-transparent to-transparent opacity-80 md:opacity-60"></div>
          </div>
        </div>
      </div>

      {/* Top Banner Alert / Status */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/60 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistema Operativo
            </span>
            <span className="text-xs text-slate-400">Lun 10 Agosto 2026</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Quadro Generale Struttura Sociosanitaria
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Gestione integrata per 35 ospiti su 3 aree logistiche. Copertura turni e somministrazione terapie in regola con gli standard regionali ed ispettivi ASL/NAS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenNewDiaryModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4" />
            + Nuovo Diario
          </button>
          <button
            onClick={onOpenNewVisitModal}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            + Programma Visita
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Occupancy */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Presenza Ospiti</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeCount}</span>
            <span className="text-xs font-semibold text-slate-500">/ 35 Totali</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>In Struttura: <strong className="text-slate-900">{activeCount}</strong></span>
            {hospitalCount > 0 && (
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                {hospitalCount} in Ospedale
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Shift Coverage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Copertura Turni Oggi</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">100%</span>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              Garantita
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Operatori in turno: <strong className="text-slate-900">{shifts.length}</strong></span>
            <button 
              onClick={() => onNavigateTab('staff')}
              className="text-blue-600 hover:underline text-[11px] font-medium"
            >
              Vedi orari
            </button>
          </div>
        </div>

        {/* Card 3: Therapies Administrations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Somministrazioni Farmaci</span>
            <Pill className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{administrations.length}</span>
            <span className="text-xs text-slate-500 font-medium">completate oggi</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Nessuna omissione
            </span>
            <button 
              onClick={() => onNavigateTab('residents')}
              className="text-blue-600 hover:underline text-[11px] font-medium"
            >
              Registro
            </button>
          </div>
        </div>

        {/* Card 4: Dysphagia & Special Diets */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-2">
            <span>Diete Speciali & Disfagia</span>
            <Utensils className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{dysphagiaCount}</span>
            <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Profili Disfagici
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Audit ASL/NAS: <strong className="text-emerald-700 font-medium">Conforme</strong></span>
            <button 
              onClick={() => onNavigateTab('catering')}
              className="text-blue-600 hover:underline text-[11px] font-medium"
            >
              Menu Cucina
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Area Distribution & Active Shift Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Areas Breakdown & Specialist Visits */}
        <div className="lg:col-span-2 space-y-6">
          {/* Areas Occupancy Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  Ripartizione Ospiti per Area Logistica
                </h3>
                <p className="text-xs text-slate-500">
                  Capienza massima e presenze effettive nei 3 reparti della struttura
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('residents')}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                Vedi Elenco Anagrafico
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Piano 1 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Piano 1</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                    12 / 12 Ospiti
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-600 h-full w-full"></div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Assistenza generale, autosufficienti e parziali.
                </p>
              </div>

              {/* Piano 2 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Piano 2</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                    15 / 15 Ospiti
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-blue-600 h-full w-full"></div>
                </div>
                <p className="text-[11px] text-slate-600">
                  Assistenza ad alto bisogno sociosanitario.
                </p>
              </div>

              {/* Ala Protetta */}
              <div className="bg-purple-50/60 rounded-xl p-4 border border-purple-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-950">Ala Protetta</span>
                  <span className="text-[10px] font-mono bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-semibold">
                    8 / 8 Ospiti
                  </span>
                </div>
                <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-purple-700 h-full w-full"></div>
                </div>
                <p className="text-[11px] text-purple-900">
                  Nucleo Alzheimer & Demenze con wandering controllato.
                </p>
              </div>
            </div>
          </div>

          {/* Specialist Visits Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Prossime Visite Specialistiche Esterne
                </h3>
                <p className="text-xs text-slate-500">
                  Trasferimenti sanitari verso ospedali e cliniche convenzionate
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('visits')}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                Calendario Completo
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {specialistVisits.slice(0, 3).map((v) => {
                const resident = residents.find(r => r.id === v.ospiteId);
                return (
                  <div 
                    key={v.id} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {resident?.nome} {resident?.cognome}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                          {v.tipoSpecialista}
                        </span>
                        <span className="text-slate-500">
                          ({resident?.areaAssegnata})
                        </span>
                      </div>
                      <div className="text-slate-600 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.nomeStrutturaClinica} &bull; {v.indirizzoClinica}</span>
                      </div>
                      <div className="text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 text-slate-400" />
                          {v.telefonoClinica}
                        </span>
                        <span>Accompagnatore: {v.operatoreAccompanying || 'In fase di assegnazione'}</span>
                      </div>
                    </div>

                    <div className="text-right sm:self-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-semibold font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {v.dataOra}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Shift Coverage Today & Clinical Warnings */}
        <div className="space-y-6">
          {/* Active Shift List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Presenze Personale in Turno Oggi
              </h3>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                Attivi
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {shifts.map((s) => (
                <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>Turno {s.tipoTurno}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({s.oraInizio} - {s.oraFine})</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">
                      Area: <strong className="text-slate-800">{s.areaAssegnata}</strong>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.mansioni.map((m, idx) => (
                        <span key={idx} className="bg-slate-200/70 text-slate-700 text-[10px] px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ASL / Clinical Audit Compliance Box */}
          <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 border border-emerald-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Conformità ASL / NAS
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Tutti i registri di somministrazione farmaci, le diete speciali per disfagia ed i verbali di manutenzione HACCP sono aggiornati e pronti per eventuali controlli ispettivi della commissione di vigilanza.
            </p>
            <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs">
              <span className="text-emerald-400">Ultimo Audit Interno:</span>
              <span className="font-mono font-semibold text-white">25/07/2026 - Conforme</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
