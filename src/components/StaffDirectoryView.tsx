import React, { useState } from "react";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  FileText, 
  Briefcase, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  X,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";
import { StaffMember, StaffRole, Shift } from "../types";
import { StaffProfileModal } from "./StaffProfileModal";

interface StaffDirectoryViewProps {
  staff: StaffMember[];
  shifts: Shift[];
  onUpdateStaff: (updated: StaffMember[] | ((prev: StaffMember[]) => StaffMember[])) => void;
  isAdmin: boolean;
}

export const StaffDirectoryView: React.FC<StaffDirectoryViewProps> = ({
  staff,
  shifts,
  onUpdateStaff,
  isAdmin
}) => {
  const [filterStatus, setFilterStatus] = useState<"tutti" | "attivi" | "archivio">("attivi");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffMember | null>(null);
  
  // Add new staff modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newCognome, setNewCognome] = useState("");
  const [newRuolo, setNewRuolo] = useState<StaffRole>("OSS (Operatore Socio-Sanitario)");
  const [newTelefono, setNewTelefono] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCodiceFiscale, setNewCodiceFiscale] = useState("");
  const [newContratto, setNewContratto] = useState("Tempo Indeterminato 36h");
  const [newColoreBadge, setNewColoreBadge] = useState("#0d9488");

  const filteredStaff = staff.filter(s => {
    if (filterStatus === "attivi" && s.attivo === false) return false;
    if (filterStatus === "archivio" && s.attivo !== false) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${s.nome} ${s.cognome}`.toLowerCase();
      const role = s.ruolo.toLowerCase();
      const cf = (s.codiceFiscale || "").toLowerCase();
      return fullName.includes(q) || role.includes(q) || cf.includes(q);
    }
    return true;
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newCognome.trim()) {
      alert("Inserisci nome e cognome del collaboratore.");
      return;
    }

    const newMember: StaffMember = {
      id: `st-${Date.now()}`,
      nome: newNome.trim(),
      cognome: newCognome.trim(),
      ruolo: newRuolo,
      telefono: newTelefono.trim(),
      email: newEmail.trim(),
      codiceFiscale: newCodiceFiscale.trim().toUpperCase(),
      attivo: true,
      coloreBadge: newColoreBadge,
      tipoContratto: newContratto.trim() || "Standard",
      notePersonali: []
    };

    onUpdateStaff(prev => [...prev, newMember]);
    setNewNome("");
    setNewCognome("");
    setNewTelefono("");
    setNewEmail("");
    setNewCodiceFiscale("");
    setShowAddModal(false);
  };

  const handleToggleArchive = (memberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStaff(prev => prev.map(s => {
      if (s.id === memberId) {
        const nextAttivo = s.attivo === false ? true : false;
        return { ...s, attivo: nextAttivo };
      }
      return s;
    }));
  };

  const handleUpdateSingleStaff = (updated: StaffMember) => {
    onUpdateStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
    setSelectedStaffForModal(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Anagrafica & Archivio Personale</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">Gestione Collaboratori & Storico</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Gestisci tutto il personale attivo e storico. L'archiviazione rimuove il collaboratore dai turni attivi ma conserva inalterati tutti i dati e le note per sempre.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Collaboratore</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus("attivi")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "attivi"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            🟢 Attivi in Turno ({staff.filter(s => s.attivo !== false).length})
          </button>
          <button
            onClick={() => setFilterStatus("archivio")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "archivio"
                ? "bg-slate-800 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            📁 In Archivio ({staff.filter(s => s.attivo === false).length})
          </button>
          <button
            onClick={() => setFilterStatus("tutti")}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === "tutti"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tutti ({staff.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca per nome, ruolo, codice fiscale..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Nessun collaboratore trovato</h3>
          <p className="text-xs text-slate-500 mt-1">Prova a modificare i filtri di ricerca o ad aggiungere un nuovo collaboratore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map(member => {
            const isAttivo = member.attivo !== false;
            const memberShiftsCount = shifts.filter(s => s.staffId === member.id).length;
            const notesCount = (member.notePersonali || []).length;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedStaffForModal(member)}
                className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative ${
                  isAttivo ? "border-slate-200 hover:border-emerald-500/50" : "border-slate-300 bg-slate-50/70"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: member.coloreBadge || "#4f46e5" }}
                      >
                        {member.nome.charAt(0)}{member.cognome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {member.nome} {member.cognome}
                        </h3>
                        <p className="text-xs font-bold text-emerald-600">{member.ruolo}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isAttivo ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-200 text-slate-700"
                    }`}>
                      {isAttivo ? "Attivo" : "Archiviato"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 py-2 border-t border-b border-slate-100 my-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">{member.telefono || "Nessun telefono"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold truncate">{member.email || "Nessuna email"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <span>📅 {memberShiftsCount} turni</span>
                    {notesCount > 0 && <span className="text-emerald-700 font-bold">📝 {notesCount} note</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={(e) => handleToggleArchive(member.id, e)}
                        className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isAttivo 
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200" 
                            : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        }`}
                        title={isAttivo ? "Archivia collaboratore (nascondi dai turni)" : "Riattiva collaboratore"}
                      >
                        {isAttivo ? <Archive className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                    <span className="text-emerald-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Scheda <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Registra Nuovo Collaboratore
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome *</label>
                  <input
                    type="text"
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    placeholder="es. Marco"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cognome *</label>
                  <input
                    type="text"
                    value={newCognome}
                    onChange={e => setNewCognome(e.target.value)}
                    placeholder="es. Rossi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ruolo Professionale</label>
                <select
                  value={newRuolo}
                  onChange={e => setNewRuolo(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="OSS (Operatore Socio-Sanitario)">OSS (Operatore Socio-Sanitario)</option>
                  <option value="Infermiera / Infermiere">Infermiera / Infermiere</option>
                  <option value="Coordinatore / Direttore">Coordinatore / Direttore</option>
                  <option value="Educatore">Educatore</option>
                  <option value="Fisioterapista">Fisioterapista</option>
                  <option value="Cuoco / Addetto Cucina">Cuoco / Addetto Cucina</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Telefono</label>
                  <input
                    type="text"
                    value={newTelefono}
                    onChange={e => setNewTelefono(e.target.value)}
                    placeholder="+39 333 ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="email@villaserena.it"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Codice Fiscale</label>
                <input
                  type="text"
                  value={newCodiceFiscale}
                  onChange={e => setNewCodiceFiscale(e.target.value)}
                  placeholder="RSSMRC..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tipo Contratto</label>
                  <input
                    type="text"
                    value={newContratto}
                    onChange={e => setNewContratto(e.target.value)}
                    placeholder="Tempo Indeterminato 36h"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Colore Badge</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColoreBadge}
                      onChange={e => setNewColoreBadge(e.target.value)}
                      className="w-9 h-9 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                    />
                    <span className="text-xs font-bold text-slate-600">{newColoreBadge}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Salva e Aggiungi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Profile Modal */}
      {selectedStaffForModal && (
        <StaffProfileModal
          staffMember={selectedStaffForModal}
          allShifts={shifts}
          onClose={() => setSelectedStaffForModal(null)}
          onUpdateStaff={handleUpdateSingleStaff}
          isAdmin={isAdmin}
        />
      )}

    </div>
  );
};
