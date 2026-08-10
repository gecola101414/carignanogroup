import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Stethoscope, 
  Pill, 
  Utensils, 
  FileText, 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  Phone, 
  Mail, 
  HeartPulse, 
  Building2,
  Calendar,
  X,
  FilePlus,
  ShieldAlert
} from 'lucide-react';
import { 
  Resident, 
  RSAArea, 
  HealthDiaryEntry, 
  Therapy, 
  DrugAdministration, 
  AreaTransferLog,
  StaffRole
} from '../types';

interface ResidentsViewProps {
  residents: Resident[];
  transfers: AreaTransferLog[];
  healthDiary: HealthDiaryEntry[];
  therapies: Therapy[];
  administrations: DrugAdministration[];
  selectedAreaFilter: RSAArea | 'Tutte';
  searchQuery: string;
  onAddResident: (newR: Partial<Resident>) => void;
  onTransferResident: (ospiteId: string, destArea: RSAArea, motivo: string, operatore: string) => void;
  onAddDiaryEntry: (entry: Partial<HealthDiaryEntry>) => void;
  onAddAdministration: (admin: Partial<DrugAdministration>) => void;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  residents,
  transfers,
  healthDiary,
  therapies,
  administrations,
  selectedAreaFilter,
  searchQuery,
  onAddResident,
  onTransferResident,
  onAddDiaryEntry,
  onAddAdministration,
}) => {
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [activeResidentTab, setActiveResidentTab] = useState<'anagrafica' | 'diario' | 'terapie' | 'diete'>('anagrafica');

  // Modal States
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferArea, setTransferArea] = useState<RSAArea>('Piano 2');
  const [transferReason, setTransferReason] = useState('');

  // New Diary Entry Form State
  const [diaryCategory, setDiaryCategory] = useState<HealthDiaryEntry['categoria']>('Parametri Vitali');
  const [diaryNote, setDiaryNote] = useState('');
  const [pa, setPa] = useState('120/80');
  const [spo2, setSpo2] = useState('98');
  const [temp, setTemp] = useState('36.6');
  const [glicemia, setGlicemia] = useState('105');
  const [operatorName, setOperatorName] = useState('Giulia Neri');
  const [operatorRole, setOperatorRole] = useState<StaffRole>('Infermiere');

  // Filter logic
  const filtered = residents.filter(r => {
    const matchesArea = selectedAreaFilter === 'Tutte' || r.areaAssegnata === selectedAreaFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      r.nome.toLowerCase().includes(q) || 
      r.cognome.toLowerCase().includes(q) || 
      r.codiceFiscale.toLowerCase().includes(q) ||
      r.stanza.toLowerCase().includes(q);
    return matchesArea && matchesQuery;
  });

  const handleCreateDiary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !diaryNote) return;

    onAddDiaryEntry({
      ospiteId: selectedResident.id,
      operatoreId: 'op-cur',
      operatoreNome: operatorName,
      operatoreRuolo: operatorRole,
      categoria: diaryCategory,
      note: diaryNote,
      parametriVitali: diaryCategory === 'Parametri Vitali' ? {
        pressioneArteriosa: pa,
        saturazione: Number(spo2),
        temperatura: Number(temp),
        glicemia: Number(glicemia),
      } : undefined
    });

    setDiaryNote('');
    alert('Voce registrata con successo nel Diario Sanitario!');
  };

  const handleAdministerDrug = (terapia: Therapy, orarioPrevisto: string) => {
    if (!selectedResident) return;
    onAddAdministration({
      terapiaId: terapia.id,
      ospiteId: selectedResident.id,
      orarioPrevisto,
      stato: 'Somministrato',
      infermiereNome: 'Giulia Neri (Infermiere)',
      note: 'Somministrazione verificata e siglata',
    });
    alert(`Somministrazione registrata per ${terapia.nomeFarmaco}!`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !transferReason) return;
    onTransferResident(selectedResident.id, transferArea, transferReason, operatorName);
    setShowTransferModal(false);
    setTransferReason('');
    alert('Trasferimento interno completato con successo!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Anagrafica Ospiti e Cartella Clinica Elettronica
          </h2>
          <p className="text-xs text-slate-500">
            Gestione di 35 cartelle personali, storico dei trasferimenti interni, diari sanitari e registro terapie
          </p>
        </div>

        <button
          onClick={() => setShowAddResidentModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuovo Inserimento Ospite
        </button>
      </div>

      {/* Main Grid: Residents Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          const resDiary = healthDiary.filter(d => d.ospiteId === r.id);
          const resTherapies = therapies.filter(t => t.ospiteId === r.id);
          const isSelected = selectedResident?.id === r.id;

          return (
            <div
              key={r.id}
              onClick={() => setSelectedResident(r)}
              className={`bg-white rounded-2xl border p-4 transition-all cursor-pointer relative hover:shadow-md ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {r.nome[0]}{r.cognome[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {r.nome} {r.cognome}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">
                      CF: {r.codiceFiscale}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  r.areaAssegnata === 'Ala Protetta'
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {r.areaAssegnata}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Stanza & Letto</span>
                  <strong className="text-slate-800">Stanza {r.stanza} - L. {r.letto}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Stato Ospite</span>
                  <span className={`font-semibold ${r.stato === 'Attivo' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {r.stato}
                  </span>
                </div>
              </div>

              {/* Tags for Diets & Allergies */}
              <div className="space-y-1.5 text-[11px]">
                {r.dieteSpeciali.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-3 h-3 text-amber-600 shrink-0" />
                    <span className="text-slate-600 truncate">
                      {r.dieteSpeciali.join(', ')}
                    </span>
                  </div>
                )}

                {r.noteDisfagia && (
                  <div className="flex items-center gap-1.5 text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-medium text-[10px]">
                    <AlertCircle className="w-3 h-3 text-purple-700 shrink-0" />
                    <span className="truncate">{r.noteDisfagia}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                <span>Visualizza Cartella Clinica</span>
                <span className="text-slate-400 font-normal">Terapie attive: {resTherapies.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resident Detail Drawer / Modal */}
      {selectedResident && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                  {selectedResident.nome[0]}{selectedResident.cognome[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      {selectedResident.nome} {selectedResident.cognome}
                    </h2>
                    <span className="px-2 py-0.5 bg-blue-900/80 text-blue-200 border border-blue-700 rounded text-xs font-mono">
                      Stanza {selectedResident.stanza} ({selectedResident.areaAssegnata})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    CF: {selectedResident.codiceFiscale} &bull; Data Nascita: {selectedResident.dataNascita} &bull; Ingresso: {selectedResident.dataIngresso}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 font-medium flex items-center gap-1.5 transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                  Trasferisci Area
                </button>

                <button
                  onClick={() => setSelectedResident(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="bg-slate-100 border-b border-slate-200 px-5 flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={() => setActiveResidentTab('anagrafica')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activeResidentTab === 'anagrafica'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Anagrafica & Referenti
              </button>

              <button
                onClick={() => setActiveResidentTab('diario')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activeResidentTab === 'diario'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Diario Sanitario ({healthDiary.filter(d => d.ospiteId === selectedResident.id).length})
              </button>

              <button
                onClick={() => setActiveResidentTab('terapie')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activeResidentTab === 'terapie'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pill className="w-4 h-4" />
                Scheda Terapeutica & Somministrazioni
              </button>

              <button
                onClick={() => setActiveResidentTab('diete')}
                className={`py-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
                  activeResidentTab === 'diete'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Utensils className="w-4 h-4" />
                Diete & Disfagia
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: Anagrafica & Referente */}
              {activeResidentTab === 'anagrafica' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1">
                        Dettagli Personali
                      </h4>
                      <p><strong>Nome e Cognome:</strong> {selectedResident.nome} {selectedResident.cognome}</p>
                      <p><strong>Codice Fiscale:</strong> {selectedResident.codiceFiscale}</p>
                      <p><strong>Data di Nascita:</strong> {selectedResident.dataNascita} (Sesso: {selectedResident.sesso})</p>
                      <p><strong>Area Assegnata:</strong> {selectedResident.areaAssegnata}</p>
                      <p><strong>Ubicazione:</strong> Stanza {selectedResident.stanza}, Letto {selectedResident.letto}</p>
                      <p><strong>Data Ingresso RSA:</strong> {selectedResident.dataIngresso}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1">
                        Contatto Referente Familiare
                      </h4>
                      <p className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        <strong>{selectedResident.referenteNome}</strong> ({selectedResident.referenteParentela})
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {selectedResident.referenteTelefono}
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        {selectedResident.referenteEmail || 'Email non registrata'}
                      </p>
                      {selectedResident.tutoreNote && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px]">
                          <strong>Tutore/Amministratore:</strong> {selectedResident.tutoreNote}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transfer History Log */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                      Storico Trasferimenti Interni
                    </h4>

                    {transfers.filter(t => t.ospiteId === selectedResident.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        Nessun trasferimento interno registrato per questo ospite.
                      </p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {transfers.filter(t => t.ospiteId === selectedResident.id).map((t) => (
                          <div key={t.id} className="p-3 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between font-semibold text-slate-800 mb-1">
                              <span>Da {t.areaOrigine} &rarr; A {t.areaDestinazione}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{t.dataTrasferimento}</span>
                            </div>
                            <p className="text-slate-600 text-[11px]"><strong>Motivo:</strong> {t.motivo}</p>
                            <p className="text-slate-400 text-[10px] mt-1">Autorizzato da: {t.operatoreNome}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Diario Sanitario */}
              {activeResidentTab === 'diario' && (
                <div className="space-y-6">
                  {/* Form to Append New Health Diary Entry */}
                  <form onSubmit={handleCreateDiary} className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-4">
                    <h4 className="font-bold text-blue-950 text-sm flex items-center gap-2">
                      <FilePlus className="w-4 h-4 text-blue-700" />
                      Registra Nuova Nota in Diario Sanitario
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Categoria Evento</label>
                        <select
                          value={diaryCategory}
                          onChange={(e) => setDiaryCategory(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                        >
                          <option value="Parametri Vitali">Parametri Vitali</option>
                          <option value="Nota Clinica">Nota Clinica</option>
                          <option value="Evento/Caduta">Evento / Caduta</option>
                          <option value="Igiene/Cura">Igiene / Cura Personale</option>
                          <option value="Visita Medico">Visita Medico Curante</option>
                          <option value="Fisioterapia">Fisioterapia e Riabilitazione</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Operatore Siglatore</label>
                        <input
                          type="text"
                          value={operatorName}
                          onChange={(e) => setOperatorName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Ruolo Operatore</label>
                        <select
                          value={operatorRole}
                          onChange={(e) => setOperatorRole(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                        >
                          <option value="Infermiere">Infermiere</option>
                          <option value="OSS">OSS</option>
                          <option value="Medico">Medico</option>
                          <option value="Educatore">Educatore</option>
                          <option value="Fisioterapista">Fisioterapista</option>
                        </select>
                      </div>
                    </div>

                    {/* Vital Parameters inputs */}
                    {diaryCategory === 'Parametri Vitali' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-blue-200 text-xs">
                        <div>
                          <label className="block text-slate-500 font-medium text-[10px]">Pressione (PA)</label>
                          <input
                            type="text"
                            placeholder="120/80"
                            value={pa}
                            onChange={(e) => setPa(e.target.value)}
                            className="w-full border border-slate-300 rounded p-1"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium text-[10px]">Saturazione (SpO2 %)</label>
                          <input
                            type="number"
                            value={spo2}
                            onChange={(e) => setSpo2(e.target.value)}
                            className="w-full border border-slate-300 rounded p-1"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium text-[10px]">Temperatura (°C)</label>
                          <input
                            type="text"
                            value={temp}
                            onChange={(e) => setTemp(e.target.value)}
                            className="w-full border border-slate-300 rounded p-1"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-medium text-[10px]">Glicemia (mg/dL)</label>
                          <input
                            type="number"
                            value={glicemia}
                            onChange={(e) => setGlicemia(e.target.value)}
                            className="w-full border border-slate-300 rounded p-1"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-xs">Note Descrittive Osservazioni</label>
                      <textarea
                        rows={2}
                        value={diaryNote}
                        onChange={(e) => setDiaryNote(e.target.value)}
                        placeholder="Inserisci osservazioni cliniche, parametri o dettagli sulla deambulazione..."
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all"
                    >
                      Aggiungi in Diario Sanitario
                    </button>
                  </form>

                  {/* List of Previous Entries */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs">Storico Annotazioni Cliniche</h4>
                    {healthDiary.filter(d => d.ospiteId === selectedResident.id).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Nessuna nota ancora inserita.</p>
                    ) : (
                      healthDiary.filter(d => d.ospiteId === selectedResident.id).map((entry) => (
                        <div key={entry.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{entry.categoria}</span>
                              <span className="text-slate-500">&bull; {entry.operatoreNome} ({entry.operatoreRuolo})</span>
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">{entry.dataOra}</span>
                          </div>

                          <p className="text-slate-700 leading-relaxed">{entry.note}</p>

                          {entry.parametriVitali && (
                            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                              {entry.parametriVitali.pressioneArteriosa && (
                                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-semibold">
                                  PA: {entry.parametriVitali.pressioneArteriosa}
                                </span>
                              )}
                              {entry.parametriVitali.saturazione && (
                                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-semibold">
                                  SpO2: {entry.parametriVitali.saturazione}%
                                </span>
                              )}
                              {entry.parametriVitali.temperatura && (
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                                  T: {entry.parametriVitali.temperatura}°C
                                </span>
                              )}
                              {entry.parametriVitali.glicemia && (
                                <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-semibold">
                                  Glicemia: {entry.parametriVitali.glicemia} mg/dL
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Scheda Terapeutica */}
              {activeResidentTab === 'terapie' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Pill className="w-4 h-4 text-indigo-600" />
                      Prescrizioni Terapeutiche Attive
                    </h4>
                    <span className="text-xs text-slate-500">
                      Iscritta dal Medico Coordinatore
                    </span>
                  </div>

                  {therapies.filter(t => t.ospiteId === selectedResident.id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nessuna terapia attiva al momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {therapies.filter(t => t.ospiteId === selectedResident.id).map((t) => (
                        <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-bold text-slate-900 text-sm">
                                {t.nomeFarmaco}
                              </h5>
                              <p className="text-slate-500">
                                Principio Attivo: <strong>{t.principioAttivo}</strong> &bull; Dosaggio: <strong>{t.dosaggio}</strong> ({t.viaSomministrazione})
                              </p>
                            </div>
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-900 font-semibold rounded text-[11px]">
                              {t.medicoPrescrittore}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                            <span className="text-slate-500 font-semibold text-[11px]">Orari previsti:</span>
                            {t.orari.map((ora) => (
                              <button
                                key={ora}
                                onClick={() => handleAdministerDrug(t, ora)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] rounded font-bold transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                {ora} - Somministra Ora
                              </button>
                            ))}
                          </div>

                          {t.note && (
                            <p className="text-slate-600 italic text-[11px] bg-white p-2 rounded border border-slate-200">
                              Note: {t.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Somministrazioni Eseguite */}
                  <div className="space-y-2 pt-4 border-t border-slate-200">
                    <h5 className="font-bold text-slate-900 text-xs">
                      Registro Somministrazioni Odierne Firmate dagli Infermieri
                    </h5>
                    <div className="space-y-1 text-xs">
                      {administrations.filter(a => a.ospiteId === selectedResident.id).map((a) => (
                        <div key={a.id} className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-950">
                              Orario {a.orarioPrevisto} - {a.stato}
                            </span>
                            <span className="text-emerald-800 text-[11px]">da {a.infermiereNome}</span>
                          </div>
                          <span className="font-mono text-emerald-700 text-[11px]">{a.dataOra}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Diete & Disfagia */}
              {activeResidentTab === 'diete' && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-700" />
                      Profilo Ristorativo e Valutazione Disfagia
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-amber-800 block font-semibold text-[11px]">Tipo Dieta Assegnata</span>
                        <strong className="text-slate-900 text-sm">{selectedResident.dieteSpeciali.join(', ') || 'Dieta Libera'}</strong>
                      </div>

                      <div>
                        <span className="text-amber-800 block font-semibold text-[11px]">Allergeni & Intolleranze</span>
                        <span className="text-rose-700 font-bold">
                          {selectedResident.allergeni.length > 0 ? selectedResident.allergeni.join(', ') : 'Nessuno segnalato'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-amber-200 space-y-1">
                      <span className="font-bold text-slate-800 block">Istruzioni Disfagia Cucina / OSS</span>
                      <p className="text-slate-700 leading-relaxed">
                        {selectedResident.noteDisfagia || 'Ospite senza problemi di deglutizione rilevati. Consistenza solida normale.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedResident(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all"
              >
                Chiudi Cartella
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal Transfer Modal */}
      {showTransferModal && selectedResident && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Trasferimento Interno Ospite
            </h3>
            <p className="text-xs text-slate-500">
              Spostamento dell'ospite {selectedResident.nome} {selectedResident.cognome} da <strong>{selectedResident.areaAssegnata}</strong>.
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nuova Area Destinazione</label>
                <select
                  value={transferArea}
                  onChange={(e) => setTransferArea(e.target.value as RSAArea)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium"
                >
                  <option value="Piano 1">Piano 1</option>
                  <option value="Piano 2">Piano 2</option>
                  <option value="Ala Protetta">Ala Protetta (Alzheimer)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivazione Clinica / Logistica</label>
                <textarea
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Es. Aggravamento quadro cognitivo, richiesta parenti, affinità di stanza..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-sm"
                >
                  Conferma Trasferimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
