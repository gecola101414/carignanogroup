import React, { useState } from 'react';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  BarChart3, 
  UserCheck, 
  Building,
  Briefcase
} from 'lucide-react';
import { StaffMember, Shift, StaffRole, RSAArea, ShiftType } from '../types';

interface StaffShiftsViewProps {
  staff: StaffMember[];
  shifts: Shift[];
  onAddShift: (newShift: Omit<Shift, 'id'>) => { success: boolean; error?: string };
}

export const StaffShiftsView: React.FC<StaffShiftsViewProps> = ({
  staff,
  shifts,
  onAddShift,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'turni' | 'personale' | 'rendiconto'>('turni');

  // Form for New Shift
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || '');
  const [shiftDate, setShiftDate] = useState('2026-08-10');
  const [shiftType, setShiftType] = useState<ShiftType>('Mattina');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('14:00');
  const [shiftArea, setShiftArea] = useState<RSAArea | 'Tutta la Struttura'>('Piano 1');
  const [tasks, setTasks] = useState('Igiene Mattutina, Assistenza Colazione');
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = onAddShift({
      staffId: selectedStaffId,
      data: shiftDate,
      tipoTurno: shiftType,
      oraInizio: startTime,
      oraFine: endTime,
      areaAssegnata: shiftArea,
      mansioni: tasks.split(',').map(t => t.trim()),
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Errore durante la creazione del turno');
    } else {
      alert('Turno creato con successo! Prevenzione sovrapposizioni superata.');
    }
  };

  // Monthly stats calculations
  const monthlyStats = staff.map((s) => {
    const staffShifts = shifts.filter(sh => sh.staffId === s.id);
    let totalMinutes = 0;
    let nightCount = 0;

    staffShifts.forEach((sh) => {
      const [startH, startM] = sh.oraInizio.split(':').map(Number);
      const [endH, endM] = sh.oraFine.split(':').map(Number);
      let diff = (endH * 60 + endM) - (startH * 60 + startM);
      if (diff < 0) diff += 24 * 60; // Overnight shift
      totalMinutes += diff;
      if (sh.tipoTurno === 'Notte') nightCount++;
    });

    const workedHours = Math.round(totalMinutes / 60);
    const monthlyContractHours = Math.round(s.oreContrattualiSettimanali * 4.33);
    const overtime = Math.max(0, workedHours - monthlyContractHours);

    return {
      staffMember: s,
      workedHours,
      monthlyContractHours,
      overtime,
      nightCount,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            Pianificazione Turni, Ruoli & Rendicontazione Ore
          </h2>
          <p className="text-xs text-slate-500">
            Programmazione della forza lavoro H24, verifica automatica sovrapposizioni e consuntivo ore mensili
          </p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('turni')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'turni' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Turnistica & Planner
          </button>

          <button
            onClick={() => setActiveSubTab('personale')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'personale' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Organigramma ({staff.length})
          </button>

          <button
            onClick={() => setActiveSubTab('rendiconto')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'rendiconto' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Rendiconto Ore & Copertura
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Turnistica & Form Inserimento */}
      {activeSubTab === 'turni' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Planner Table (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Tabellone Turni di Oggi (10 Agosto 2026)
                </h3>
                <span className="text-xs text-slate-500">35 Ospiti su 3 Aree</span>
              </div>

              <div className="space-y-3">
                {shifts.map((sh) => {
                  const s = staff.find(st => st.id === sh.staffId);
                  return (
                    <div key={sh.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm">{s?.nome} {s?.cognome}</strong>
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                            {s?.ruolo}
                          </span>
                          <span className="text-slate-500 font-medium">({sh.areaAssegnata})</span>
                        </div>
                        <div className="text-slate-600 flex flex-wrap gap-1 pt-1">
                          {sh.mansioni.map((m, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-right sm:self-center font-mono font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                        {sh.tipoTurno} ({sh.oraInizio} - {sh.oraFine})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Assegnazione Turni con Prevenzione Sovrapposizione (Right 1 col) */}
          <div className="space-y-4">
            <form onSubmit={handleCreateShift} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                Pianifica Nuovo Turno
              </h3>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operatore Dipendente</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nome} {st.cognome} ({st.ruolo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data Turno</label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipologia Turno</label>
                  <select
                    value={shiftType}
                    onChange={(e) => {
                      const t = e.target.value as ShiftType;
                      setShiftType(t);
                      if (t === 'Mattina') { setStartTime('07:00'); setEndTime('14:00'); }
                      else if (t === 'Pomeriggio') { setStartTime('14:00'); setEndTime('21:00'); }
                      else if (t === 'Notte') { setStartTime('21:00'); setEndTime('07:00'); }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Mattina">Mattina (07-14)</option>
                    <option value="Pomeriggio">Pomeriggio (14-21)</option>
                    <option value="Notte">Notte (21-07)</option>
                    <option value="Reperibilità">Reperibilità</option>
                    <option value="Spezzato">Spezzato</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Ora Inizio</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-sans">Ora Fine</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Area Assegnata</label>
                <select
                  value={shiftArea}
                  onChange={(e) => setShiftArea(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Piano 1">Piano 1</option>
                  <option value="Piano 2">Piano 2</option>
                  <option value="Ala Protetta">Ala Protetta</option>
                  <option value="Tutta la Struttura">Tutta la Struttura</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mansioni Specifiche (separate da virgola)</label>
                <input
                  type="text"
                  value={tasks}
                  onChange={(e) => setTasks(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-sm transition-all text-xs"
              >
                Convalida ed Assegna Turno
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Organigramma Personale */}
      {activeSubTab === 'personale' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-blue-600" />
            Registro Figure Professionali e Contratti Dipendenti
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {staff.map((st) => (
              <div key={st.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <strong className="text-slate-900 text-sm">{st.nome} {st.cognome}</strong>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded text-[10px]">
                    {st.ruolo}
                  </span>
                </div>

                <p className="text-slate-600">CF: <strong className="font-mono">{st.codiceFiscale}</strong></p>
                <p className="text-slate-600">Email: {st.email}</p>
                <p className="text-slate-600">Telefono: {st.telefono}</p>
                <p className="text-slate-800 font-semibold">
                  Ore Contrattuali: {st.oreContrattualiSettimanali}h / settimana
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Rendiconto Ore & Copertura */}
      {activeSubTab === 'rendiconto' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Rendicontazione Ore Lavorate e Consuntivo Straordinari
              </h3>
              <p className="text-xs text-slate-500">
                Calcolo delle ore effettuate su base contrattuale mensile ed annuale
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="p-3">Dipendente</th>
                  <th className="p-3">Ruolo</th>
                  <th className="p-3">Ore Contratto Mensili</th>
                  <th className="p-3">Ore Effettuate Oggi/Mese</th>
                  <th className="p-3">Straordinari</th>
                  <th className="p-3">Turni Notturni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthlyStats.map((st) => (
                  <tr key={st.staffMember.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      {st.staffMember.nome} {st.staffMember.cognome}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {st.staffMember.ruolo}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{st.monthlyContractHours} h</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{st.workedHours} h</td>
                    <td className="p-3 font-mono font-bold text-amber-700">+{st.overtime} h</td>
                    <td className="p-3 font-mono">{st.nightCount} turni N</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
