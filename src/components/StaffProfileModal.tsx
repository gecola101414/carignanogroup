import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  Award, 
  Briefcase, 
  Phone, 
  Mail, 
  UserCheck, 
  UserX,
  CheckCircle2,
  Clock,
  CalendarDays,
  FileCheck,
  AlertTriangle,
  Mic,
  MicOff,
  Video,
  Image as ImageIcon,
  Volume2
} from "lucide-react";
import { StaffMember, Shift, StaffNote, StaffRole } from "../types";
import { isItalianFestivo, isItalianPrefestivo, formatItalianDateString } from "./StaffShiftsView";

interface StaffProfileModalProps {
  staffMember: StaffMember;
  allShifts: Shift[];
  onClose: () => void;
  onUpdateStaff: (updated: StaffMember) => void;
  isAdmin: boolean;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  staffMember,
  allShifts,
  onClose,
  onUpdateStaff,
  isAdmin
}) => {
  // Default date range: current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);

  // New Note state
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteDate, setNoteDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteTipo, setNoteTipo] = useState<"Richiamo" | "Merito" | "Generale" | "Formazione">("Generale");
  const [noteText, setNoteText] = useState("");
  const [noteFileName, setNoteFileName] = useState<string | undefined>();
  const [noteFileUrl, setNoteFileUrl] = useState<string | undefined>();

  // Edit basic staff info state (if admin)
  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState(staffMember.nome);
  const [editCognome, setEditCognome] = useState(staffMember.cognome);
  const [editRuolo, setEditRuolo] = useState<StaffRole>(staffMember.ruolo);
  const [editTelefono, setEditTelefono] = useState(staffMember.telefono);
  const [editEmail, setEditEmail] = useState(staffMember.email);
  const [editCodiceFiscale, setEditCodiceFiscale] = useState(staffMember.codiceFiscale);
  const [editContratto, setEditContratto] = useState(staffMember.tipoContratto || "");

  // Filter shifts for this staff member within date range
  const staffShifts = allShifts.filter(s => {
    if (s.staffId !== staffMember.id) return false;
    return s.data >= startDate && s.data <= endDate;
  });

  // Calculate statistics
  let daysWorked = 0;
  let permessiCount = 0;
  let malattieCount = 0;
  let weekendFestiviCount = 0;
  let totalHours = 0;
  const shiftTypesCount: Record<string, number> = {};

  staffShifts.forEach(s => {
    const tipo = s.tipoTurno || "Altro";
    shiftTypesCount[tipo] = (shiftTypesCount[tipo] || 0) + 1;

    if (tipo === "Permesso") {
      permessiCount++;
    } else if (tipo === "Malattia") {
      malattieCount++;
    } else if (tipo !== "Riposo" && tipo !== "Ferie") {
      daysWorked++;
      // Check weekend or festivo
      const festivo = isItalianFestivo(s.data);
      const prefestivo = isItalianPrefestivo(s.data);
      if (festivo.isFestivo || prefestivo.label === "Sabato") {
        weekendFestiviCount++;
      }

      // Estimate hours if start and end are present
      if (s.orarioInizio && s.orarioFine) {
        const [h1, m1] = s.orarioInizio.split(":").map(Number);
        const [h2, m2] = s.orarioFine.split(":").map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60; // night shift
        totalHours += diff / 60;
      }
    }
  });

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);

  const startVoiceRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => {
          setNoteFileUrl(reader.result as string);
          setNoteFileName(`NotaVocale_${new Date().toISOString().slice(0, 10)}.webm`);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("Impossibile accedere al microfono. Controlla i permessi del browser.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNoteFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setNoteFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteText.trim()) {
      alert("Inserisci titolo e testo della nota.");
      return;
    }
    const newNote: StaffNote = {
      id: `note-${Date.now()}`,
      data: noteDate,
      titolo: noteTitle.trim(),
      testo: noteText.trim(),
      tipo: noteTipo,
      allegatoNome: noteFileName,
      allegatoUrl: noteFileUrl
    };

    const updatedNotes = [newNote, ...(staffMember.notePersonali || [])];
    onUpdateStaff({
      ...staffMember,
      notePersonali: updatedNotes
    });

    setNoteTitle("");
    setNoteText("");
    setNoteFileName(undefined);
    setNoteFileUrl(undefined);
    setShowAddNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa nota?")) return;
    const updatedNotes = (staffMember.notePersonali || []).filter(n => n.id !== noteId);
    onUpdateStaff({
      ...staffMember,
      notePersonali: updatedNotes
    });
  };

  const handleSaveProfileInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStaff({
      ...staffMember,
      nome: editNome.trim(),
      cognome: editCognome.trim(),
      ruolo: editRuolo,
      telefono: editTelefono.trim(),
      email: editEmail.trim(),
      codiceFiscale: editCodiceFiscale.trim().toUpperCase(),
      tipoContratto: editContratto.trim() || undefined
    });
    setIsEditing(false);
  };

  const toggleActiveStatus = () => {
    onUpdateStaff({
      ...staffMember,
      attivo: !staffMember.attivo
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md"
              style={{ backgroundColor: staffMember.coloreBadge || "#4f46e5" }}
            >
              {staffMember.nome.charAt(0)}{staffMember.cognome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold">{staffMember.nome} {staffMember.cognome}</h2>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${staffMember.attivo !== false ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                  {staffMember.attivo !== false ? "🟢 Attivo in Turno" : "📁 In Archivio (Storico)"}
                </span>
              </div>
              <p className="text-xs text-slate-400">{staffMember.ruolo} {staffMember.tipoContratto ? `• ${staffMember.tipoContratto}` : ""}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={toggleActiveStatus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  staffMember.attivo !== false 
                    ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40" 
                    : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
                }`}
                title={staffMember.attivo !== false ? "Sposta in archivio (non visibile nei turni)" : "Riattiva per i turni"}
              >
                {staffMember.attivo !== false ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>{staffMember.attivo !== false ? "Archivia" : "Riattiva"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Info & Edit Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Anagrafica & Contatti
              </h3>
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
                >
                  Modifica dati
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfileInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editNome}
                      onChange={e => setEditNome(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Cognome</label>
                    <input
                      type="text"
                      value={editCognome}
                      onChange={e => setEditCognome(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Ruolo</label>
                    <select
                      value={editRuolo}
                      onChange={e => setEditRuolo(e.target.value as StaffRole)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="Coordinatore / Direttore">Coordinatore / Direttore</option>
                      <option value="Infermiera / Infermiere">Infermiera / Infermiere</option>
                      <option value="OSS (Operatore Socio-Sanitario)">OSS (Operatore Socio-Sanitario)</option>
                      <option value="Educatore">Educatore</option>
                      <option value="Fisioterapista">Fisioterapista</option>
                      <option value="Cuoco / Addetto Cucina">Cuoco / Addetto Cucina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Telefono</label>
                    <input
                      type="text"
                      value={editTelefono}
                      onChange={e => setEditTelefono(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Codice Fiscale</label>
                    <input
                      type="text"
                      value={editCodiceFiscale}
                      onChange={e => setEditCodiceFiscale(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Contratto</label>
                    <input
                      type="text"
                      value={editContratto}
                      onChange={e => setEditContratto(e.target.value)}
                      placeholder="es. Tempo Indeterminato 36h / Part-time"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-slate-400 font-medium">Telefono</span>
                    <span className="font-bold text-slate-800">{staffMember.telefono || "Non specificato"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <span className="block text-slate-400 font-medium">Email</span>
                    <span className="font-bold text-slate-800">{staffMember.email || "Non specificata"}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Codice Fiscale</span>
                  <span className="font-bold text-slate-800 uppercase">{staffMember.codiceFiscale || "Non specificato"}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Contratto</span>
                  <span className="font-bold text-slate-800">{staffMember.tipoContratto || "Standard"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Statistics Section with Date Range Filter */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                Statistiche Presenze e Turni nel Periodo
              </h3>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-600 ml-1">Da:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-slate-300 font-semibold text-xs focus:outline-none"
                />
                <span className="font-bold text-slate-600">A:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-slate-300 font-semibold text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-extrabold uppercase text-emerald-700">Giorni Lavorati</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-900">{daysWorked}</span>
                  <span className="text-xs font-bold text-emerald-700">giorni</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-extrabold uppercase text-amber-700">Permessi</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-900">{permessiCount}</span>
                  <span className="text-xs font-bold text-amber-700">volte</span>
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-extrabold uppercase text-rose-700">Malattie</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-rose-900">{malattieCount}</span>
                  <span className="text-xs font-bold text-rose-700">giorni</span>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 flex flex-col justify-between">
                <span className="text-[11px] font-extrabold uppercase text-indigo-700">Sabato, Dom & Festivi</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-900">{weekendFestiviCount}</span>
                  <span className="text-xs font-bold text-indigo-700">turni</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center justify-between pt-1">
              <span>Totale ore stimate nel periodo: <strong className="text-slate-800">{Math.round(totalHours)} ore</strong></span>
              <span>Turni totali registrati: <strong className="text-slate-800">{staffShifts.length}</strong></span>
            </div>
          </div>

          {/* Personal Notes & Attachments Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Note Personali, Richiami & Meriti
              </h3>
              <button
                onClick={() => setShowAddNote(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Aggiungi Nota / Allegato</span>
              </button>
            </div>

            {/* Add Note Modal / Form */}
            {showAddNote && (
              <form onSubmit={handleSaveNote} className="bg-slate-50 border border-emerald-300 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-800">Nuova Nota o Evento Disciplinare / Merito</h4>
                  <button type="button" onClick={() => setShowAddNote(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Data Evento</label>
                    <input
                      type="date"
                      value={noteDate}
                      onChange={e => setNoteDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipologia</label>
                    <select
                      value={noteTipo}
                      onChange={e => setNoteTipo(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                    >
                      <option value="Generale">Nota Generale</option>
                      <option value="Richiamo">Lettera di Richiamo / Sanzione</option>
                      <option value="Merito">Attestato di Merito / Encomio</option>
                      <option value="Formazione">Formazione / Certificazione</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Titolo Evento</label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={e => setNoteTitle(e.target.value)}
                      placeholder="es. Lettera di richiamo ritardo"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Testo / Dettagli Nota</label>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={3}
                    placeholder="Descrivi l'evento, la motivazione del richiamo o del riconoscimento..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{noteFileName ? "Cambia File" : "Allega Foto, Video o Documento"}</span>
                      <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" />
                    </label>

                    {/* Voice Recording Button */}
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Registra nota vocale con il microfono"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        <span>🎙️ Registra Vocale</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce shadow"
                        title="Ferma registrazione"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>⏹️ Ferma Registrazione</span>
                      </button>
                    )}

                    {noteFileName && (
                      <span className="text-xs font-semibold text-emerald-700 truncate max-w-xs">📎 {noteFileName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNote(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      Salva Nota
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Notes List */}
            {(!staffMember.notePersonali || staffMember.notePersonali.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Nessuna nota personale, richiamo o riconoscimento registrato per questo collaboratore.
              </div>
            ) : (
              <div className="space-y-3">
                {staffMember.notePersonali.map(note => {
                  const isRichiamo = note.tipo === "Richiamo";
                  const isMerito = note.tipo === "Merito";
                  const isImage = note.allegatoUrl?.startsWith("data:image/") || note.allegatoNome?.match(/\.(png|jpg|jpeg|gif|webp)$/i);
                  const isVideo = note.allegatoUrl?.startsWith("data:video/") || note.allegatoNome?.match(/\.(mp4|webm|mov)$/i);
                  const isAudio = note.allegatoUrl?.startsWith("data:audio/") || note.allegatoNome?.match(/\.(webm|mp3|wav|ogg|m4a)$/i);

                  return (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        isRichiamo 
                          ? "bg-rose-50/60 border-rose-200 text-rose-950" 
                          : isMerito 
                            ? "bg-amber-50/60 border-amber-200 text-amber-950" 
                            : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 w-full">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isRichiamo 
                                ? "bg-rose-100 text-rose-800 border border-rose-300" 
                                : isMerito 
                                  ? "bg-amber-100 text-amber-800 border border-amber-300" 
                                  : "bg-slate-200 text-slate-700"
                            }`}>
                              {note.tipo}
                            </span>
                            <span className="text-xs font-bold text-slate-500">📅 {formatItalianDateString(note.data)}</span>
                          </div>
                          <h4 className="text-sm font-extrabold">{note.titolo}</h4>
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{note.testo}</p>

                          {note.allegatoUrl && (
                            <div className="pt-2">
                              {isImage && (
                                <div className="space-y-1">
                                  <img 
                                    src={note.allegatoUrl} 
                                    alt={note.allegatoNome || "Foto allegata"} 
                                    className="max-h-60 rounded-xl object-contain border border-slate-300 bg-black/5 shadow-xs" 
                                  />
                                  <div className="text-[10px] font-semibold text-slate-500">📷 {note.allegatoNome || "Immagine"}</div>
                                </div>
                              )}

                              {isVideo && (
                                <div className="space-y-1">
                                  <video 
                                    src={note.allegatoUrl} 
                                    controls 
                                    className="max-h-60 rounded-xl w-full border border-slate-300 bg-black shadow-xs" 
                                  />
                                  <div className="text-[10px] font-semibold text-slate-500">🎬 {note.allegatoNome || "Video"}</div>
                                </div>
                              )}

                              {isAudio && (
                                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 space-y-1">
                                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                    <Volume2 className="w-4 h-4 text-rose-600" />
                                    <span>Nota Vocale / Audio: {note.allegatoNome || "Registrazione"}</span>
                                  </div>
                                  <audio src={note.allegatoUrl} controls className="w-full h-9" />
                                </div>
                              )}

                              {!isImage && !isVideo && !isAudio && (
                                <a
                                  href={note.allegatoUrl}
                                  download={note.allegatoNome || "documento.pdf"}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-all"
                                >
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span>Scarica Documento: {note.allegatoNome || "Allegato PDF"}</span>
                                  <Download className="w-3.5 h-3.5 text-slate-500 ml-1" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white/80 transition-all cursor-pointer shrink-0"
                            title="Elimina nota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            ID Collaboratore: <strong className="text-slate-700">{staffMember.id}</strong> • Tutti i dati e lo storico rimangono conservati nell'archivio.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
