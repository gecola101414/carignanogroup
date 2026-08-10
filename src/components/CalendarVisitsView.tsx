import React, { useState } from 'react';
import { 
  CalendarClock, 
  Stethoscope, 
  Building, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  CalendarDays,
  FileCheck2
} from 'lucide-react';
import { SpecialistVisit, GlobalCalendarEvent, Resident, StaffMember } from '../types';

interface CalendarVisitsViewProps {
  specialistVisits: SpecialistVisit[];
  calendarEvents: GlobalCalendarEvent[];
  residents: Resident[];
  staff: StaffMember[];
  onAddSpecialistVisit: (visit: Omit<SpecialistVisit, 'id' | 'completata'>) => void;
}

export const CalendarVisitsView: React.FC<CalendarVisitsViewProps> = ({
  specialistVisits,
  calendarEvents,
  residents,
  staff,
  onAddSpecialistVisit,
}) => {
  const [activeTab, setActiveTab] = useState<'visite' | 'calendario'>('visite');
  const [showForm, setShowForm] = useState(false);

  // Form State for Specialist Visit
  const [ospiteId, setOspiteId] = useState(residents[0]?.id || '');
  const [tipoSpecialista, setTipoSpecialista] = useState('Cardiologia');
  const [nomeStrutturaClinica, setNomeStrutturaClinica] = useState('Centro Cardiologico Monzino');
  const [indirizzoClinica, setIndirizzoClinica] = useState('Via Parea 4, Milano');
  const [telefonoClinica, setTelefonoClinica] = useState('02 580021');
  const [emailClinica, setEmailClinica] = useState('prenotazioni@monzino.it');
  const [dataOra, setDataOra] = useState('2026-08-18 10:30');
  const [operatoreAccompanying, setOperatoreAccompanying] = useState('Matteo Rossi (OSS)');
  const [noteFollowUp, setNoteFollowUp] = useState('Controllo pressione ed ECG');

  const handleSubmitVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ospiteId || !nomeStrutturaClinica) return;

    onAddSpecialistVisit({
      ospiteId,
      tipoSpecialista,
      nomeStrutturaClinica,
      indirizzoClinica,
      telefonoClinica,
      emailClinica,
      dataOra,
      operatoreAccompanying,
      noteFollowUp,
    });

    setShowForm(false);
    alert('Visita specialistica esterna programmata e registrata!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            Calendario RSA & Tracciamento Visite Specialistiche Esterne
          </h2>
          <p className="text-xs text-slate-500">
            Pianificazione appuntamenti, trasporti sanitari, recapiti cliniche ospitanti e referti di ritorno
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('visite')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'visite' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Visite Specialistiche ({specialistVisits.length})
            </button>

            <button
              onClick={() => setActiveTab('calendario')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'calendario' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendario Struttura
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Programma Visita
          </button>
        </div>
      </div>

      {/* New Specialist Visit Form */}
      {showForm && (
        <form onSubmit={handleSubmitVisit} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            Nuova Programmazione Visita Specialistica Esterna
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seleziona Ospite</label>
              <select
                value={ospiteId}
                onChange={(e) => setOspiteId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome} {r.cognome} ({r.areaAssegnata})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branca Specialistica</label>
              <input
                type="text"
                placeholder="Es. Cardiologia, Neurologia, Fisiatria..."
                value={tipoSpecialista}
                onChange={(e) => setTipoSpecialista(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Data e Ora Appuntamento</label>
              <input
                type="text"
                value={dataOra}
                onChange={(e) => setDataOra(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nome Struttura / Clinica Ospitante</label>
              <input
                type="text"
                placeholder="Es. Ospedale San Raffaele"
                value={nomeStrutturaClinica}
                onChange={(e) => setNomeStrutturaClinica(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Indirizzo Clinica</label>
              <input
                type="text"
                placeholder="Via Olgettina 60, Milano"
                value={indirizzoClinica}
                onChange={(e) => setIndirizzoClinica(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telefono Clinica / Referente</label>
              <input
                type="text"
                placeholder="02 26431"
                value={telefonoClinica}
                onChange={(e) => setTelefonoClinica(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operatore Accompagnatore Designato</label>
              <input
                type="text"
                value={operatoreAccompanying}
                onChange={(e) => setOperatoreAccompanying(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Note e Preparazione Richiesta</label>
              <input
                type="text"
                value={noteFollowUp}
                onChange={(e) => setNoteFollowUp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-sm"
            >
              Salva e Programma
            </button>
          </div>
        </form>
      )}

      {/* Visite Specialistiche List */}
      {activeTab === 'visite' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            Registro Visite Specialistiche Programmata ed Esiti Clinici
          </h3>

          <div className="space-y-4">
            {specialistVisits.map((v) => {
              const resident = residents.find(r => r.id === v.ospiteId);
              return (
                <div key={v.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 text-sm">{resident?.nome} {resident?.cognome}</strong>
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[11px]">
                        {v.tipoSpecialista}
                      </span>
                      <span className="text-slate-500">({resident?.areaAssegnata})</span>
                    </div>

                    <span className="font-mono font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-300 text-[11px]">
                      {v.dataOra}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        {v.nomeStrutturaClinica}
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {v.indirizzoClinica}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        Tel: {v.telefonoClinica}
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Accompagnatore: {v.operatoreAccompanying}
                      </p>
                    </div>
                  </div>

                  {v.esitoVisita && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950">
                      <strong>Esito Visita & Referto:</strong> {v.esitoVisita}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendario Struttura List */}
      {activeTab === 'calendario' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            Eventi Generali, Riunioni PAI e Visite Parenti
          </h3>

          <div className="space-y-3 text-xs">
            {calendarEvents.map((ev) => (
              <div key={ev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                  <span>{ev.titolo}</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-[11px]">
                    {ev.dataInizio}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{ev.descrizione}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
