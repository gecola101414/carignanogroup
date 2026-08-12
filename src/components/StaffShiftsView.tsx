import React, { useState, useRef } from "react";
import { 
  CalendarDays, 
  Users, 
  Plus, 
  Clock, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Info, 
  Phone, 
  Mail, 
  X, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Sunset, 
  Calendar as CalendarIcon,
  HelpCircle,
  Copy,
  CopyCheck,
  Move,
  GripVertical,
  Layers,
  Edit3,
  Undo2,
  ArrowRightLeft,
  Settings,
  UserCheck,
  Share2,
  Printer,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Check,
  RefreshCw,
  UserPlus,
  UserX,
  Palmtree
} from "lucide-react";
import { StaffMember, Shift, UserCredential } from "../types";
import { firestoreSync } from "../lib/firebase";
import { apiSync } from "../utils/storage";

// Full Italian day and month name helpers to avoid mobile auto-translation glitches (e.g. Ago -> years ago)
const ITALIAN_WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ITALIAN_MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

export const getFullWeekdayName = (d: Date | string): string => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T12:00:00`) : d;
  return ITALIAN_WEEKDAYS[date.getDay()] || "";
};

export const getFullMonthName = (d: Date | string): string => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T12:00:00`) : d;
  return ITALIAN_MONTHS[date.getMonth()] || "";
};

interface StaffShiftsViewProps {
  staff: StaffMember[];
  shifts: Shift[];
  onAddShift: (shift: Shift) => void;
  onDeleteShift?: (shiftId: string) => void;
  onUpdateShifts?: (shifts: Shift[]) => void;
  onUpdateStaff?: (staff: StaffMember[]) => void;
  isPublicView?: boolean;
  onTogglePublicView?: () => void;
  onRefreshShifts?: () => void;
  currentUser?: UserCredential;
}

export const StaffShiftsView: React.FC<StaffShiftsViewProps> = ({
  staff,
  shifts,
  onAddShift,
  onDeleteShift,
  onUpdateShifts,
  onUpdateStaff,
  isPublicView = false,
  onTogglePublicView,
  onRefreshShifts,
  currentUser
}) => {
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"mobile" | "week" | "month" | "roster">(isPublicView ? "mobile" : "week");
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [dragActionMode, setDragActionMode] = useState<"move" | "copy">("move");
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [confirmDeleteStaff, setConfirmDeleteStaff] = useState<StaffMember | null>(null);
  const [confirmDeleteDayDate, setConfirmDeleteDayDate] = useState<string | null>(null);

  // New Staff Member Form State
  const [newStaffNome, setNewStaffNome] = useState<string>("");
  const [newStaffCognome, setNewStaffCognome] = useState<string>("");
  const [newStaffRuolo, setNewStaffRuolo] = useState<string>("OSS");
  const [newStaffTelefono, setNewStaffTelefono] = useState<string>("");
  const [newStaffEmail, setNewStaffEmail] = useState<string>("");
  const [newStaffColoreBadge, setNewStaffColoreBadge] = useState<string>("#4f46e5");
  const [newStaffOrarioMattina, setNewStaffOrarioMattina] = useState<string>("07:00 - 14:00");
  const [newStaffOrarioPomeriggio, setNewStaffOrarioPomeriggio] = useState<string>("14:00 - 21:00");
  const [newStaffOrarioNotte, setNewStaffOrarioNotte] = useState<string>("21:00 - 07:00");

  // Undo State
  const [lastDeletedShifts, setLastDeletedShifts] = useState<Shift[] | null>(null);

  // Drag & Drop State
  const [holdingDayDate, setHoldingDayDate] = useState<string | null>(null);
  const [dragOverTargetDate, setDragOverTargetDate] = useState<string | null>(null);
  const [dragOverCellKey, setDragOverCellKey] = useState<string | null>(null);
  const [isHoveringPrevZone, setIsHoveringPrevZone] = useState<boolean>(false);
  const [isHoveringNextZone, setIsHoveringNextZone] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; showUndo?: boolean } | null>(null);

  // Long press timer ref & auto-week drag timer ref
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoWeekTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAutoWeekTurnTimeRef = useRef<number>(0);

  // New Shift Form State
  const [newStaffId, setNewStaffId] = useState<string>(staff[0]?.id || "");
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newTipoTurno, setNewTipoTurno] = useState<"Mattina" | "Pomeriggio" | "Notte" | "Reperibilità" | "Riposo" | "Ferie">("Mattina");
  const [newOrarioInizio, setNewOrarioInizio] = useState<string>("07:00");
  const [newOrarioFine, setNewOrarioFine] = useState<string>("14:00");
  const [newNote, setNewNote] = useState<string>("");

  // Vacation / Ferie Form State
  const [showVacationModal, setShowVacationModal] = useState<boolean>(false);
  const [vacationStaffId, setVacationStaffId] = useState<string>(staff[0]?.id || "");
  const [vacationStartDate, setVacationStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vacationEndDate, setVacationEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vacationNotes, setVacationNotes] = useState<string>("Ferie desiderate");

  const handleOpenVacationModal = () => {
    if (currentUser?.role === 'staff') {
      const myStaff = staff.find(s => s.nome.toLowerCase() === currentUser.username.toLowerCase());
      if (myStaff) {
        setVacationStaffId(myStaff.id);
      } else if (staff.length > 0) {
        setVacationStaffId(staff[0].id);
      }
    } else {
      if (staff.length > 0 && !vacationStaffId) {
        setVacationStaffId(staff[0].id);
      }
    }
    setShowVacationModal(true);
  };

  const handleVacationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationStaffId || !vacationStartDate || !vacationEndDate) {
      alert("Seleziona il dipendente e le date di inizio/fine ferie.");
      return;
    }

    if (vacationStartDate > vacationEndDate) {
      alert("La data di inizio ferie non può essere successiva alla data di fine.");
      return;
    }

    const start = new Date(vacationStartDate);
    const end = new Date(vacationEndDate);
    const selectedStaffObj = staff.find(s => s.id === vacationStaffId);

    const datesToInsert: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, "0");
      const day = String(cur.getDate()).padStart(2, "0");
      datesToInsert.push(`${year}-${month}-${day}`);
      cur.setDate(cur.getDate() + 1);
    }

    if (!onUpdateShifts) {
      datesToInsert.forEach(dStr => {
        onAddShift({
          id: `shift-ferie-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          staffId: vacationStaffId,
          data: dStr,
          tipoTurno: "Ferie",
          orarioInizio: "00:00",
          orarioFine: "00:00",
          note: vacationNotes || "Ferie desiderate"
        });
      });
    } else {
      const existingFiltered = shifts.filter(s => !(s.staffId === vacationStaffId && datesToInsert.includes(s.data)));
      const ferieShifts: Shift[] = datesToInsert.map((dStr, idx) => ({
        id: `shift-ferie-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        staffId: vacationStaffId,
        data: dStr,
        tipoTurno: "Ferie",
        orarioInizio: "00:00",
        orarioFine: "00:00",
        note: vacationNotes || "Ferie desiderate"
      }));

      onUpdateShifts([...existingFiltered, ...ferieShifts]);
    }

    setShowVacationModal(false);
    const staffName = selectedStaffObj ? `${selectedStaffObj.nome} ${selectedStaffObj.cognome}` : "Dipendente";
    showToast(`🌴 Inserite ${datesToInsert.length} giornate di Ferie per ${staffName}!`);
  };

  // Edit Shift Modal State (when editing inside detail modal)
  const [editShiftStaffId, setEditShiftStaffId] = useState<string>("");
  const [editShiftDate, setEditShiftDate] = useState<string>("");
  const [editShiftInizio, setEditShiftInizio] = useState<string>("");
  const [editShiftFine, setEditShiftFine] = useState<string>("");

  // Helper: Get start of current week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Get array of 7 dates for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const formatDateYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatDateYMD(new Date());

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handlePrevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper for Monthly Staff Matrix
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthDays: Date[] = [];
  for (let dayNum = 1; dayNum <= daysInMonthCount; dayNum++) {
    monthDays.push(new Date(currentYear, currentMonth, dayNum));
  }

  const showToast = (text: string, showUndo: boolean = false) => {
    setToastMessage({ text, showUndo });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  // Helper to extract personalized default shift hours from staff member card
  const getStaffHoursForShiftType = (
    targetStaff: StaffMember | undefined,
    tipoTurno: string,
    fallbackInizio: string,
    fallbackFine: string
  ): { orarioInizio: string; orarioFine: string } => {
    if (!targetStaff) return { orarioInizio: fallbackInizio, orarioFine: fallbackFine };

    let rawOrario: string | undefined = undefined;
    if (tipoTurno === "Mattina") {
      rawOrario = targetStaff.orarioMattina;
    } else if (tipoTurno === "Pomeriggio") {
      rawOrario = targetStaff.orarioPomeriggio;
    } else if (tipoTurno === "Notte") {
      rawOrario = targetStaff.orarioNotte;
    }

    if (rawOrario && rawOrario.includes("-")) {
      const parts = rawOrario.split("-").map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return { orarioInizio: parts[0], orarioFine: parts[1] };
      }
    }

    // Default shift hours if not customized in staff profile
    if (tipoTurno === "Mattina") return { orarioInizio: "07:00", orarioFine: "14:00" };
    if (tipoTurno === "Pomeriggio") return { orarioInizio: "14:00", orarioFine: "21:00" };
    if (tipoTurno === "Notte") return { orarioInizio: "21:00", orarioFine: "07:00" };
    if (tipoTurno === "Reperibilità") return { orarioInizio: "00:00", orarioFine: "23:59" };
    if (tipoTurno === "Riposo" || tipoTurno === "Ferie") return { orarioInizio: "00:00", orarioFine: "00:00" };

    return { orarioInizio: fallbackInizio, orarioFine: fallbackFine };
  };

  // Turno Preset Selection (Adopts custom hours from staff member card if available)
  const handleSelectPreset = (tipo: "Mattina" | "Pomeriggio" | "Notte" | "Reperibilità" | "Riposo" | "Ferie", customStaffId?: string) => {
    setNewTipoTurno(tipo);
    const selectedStaff = staff.find(s => s.id === (customStaffId || newStaffId));

    if (tipo === "Mattina") {
      if (selectedStaff?.orarioMattina) {
        const parts = selectedStaff.orarioMattina.split("-").map(s => s.trim());
        setNewOrarioInizio(parts[0] || "07:00");
        setNewOrarioFine(parts[1] || "14:00");
      } else {
        setNewOrarioInizio("07:00");
        setNewOrarioFine("14:00");
      }
    } else if (tipo === "Pomeriggio") {
      if (selectedStaff?.orarioPomeriggio) {
        const parts = selectedStaff.orarioPomeriggio.split("-").map(s => s.trim());
        setNewOrarioInizio(parts[0] || "14:00");
        setNewOrarioFine(parts[1] || "21:00");
      } else {
        setNewOrarioInizio("14:00");
        setNewOrarioFine("21:00");
      }
    } else if (tipo === "Notte") {
      if (selectedStaff?.orarioNotte) {
        const parts = selectedStaff.orarioNotte.split("-").map(s => s.trim());
        setNewOrarioInizio(parts[0] || "21:00");
        setNewOrarioFine(parts[1] || "07:00");
      } else {
        setNewOrarioInizio("21:00");
        setNewOrarioFine("07:00");
      }
    } else if (tipo === "Reperibilità") {
      setNewOrarioInizio("00:00");
      setNewOrarioFine("23:59");
    } else if (tipo === "Ferie") {
      setNewOrarioInizio("00:00");
      setNewOrarioFine("00:00");
    } else {
      setNewOrarioInizio("00:00");
      setNewOrarioFine("00:00");
    }
  };

  // Open modal prefilled with person and date
  const handleOpenAddModal = (staffId?: string, dateStr?: string) => {
    if (isPublicView) return;
    if (staffId) setNewStaffId(staffId);
    if (dateStr) setNewDate(dateStr);
    
    // Auto preset times for staff
    const selectedStaff = staff.find(s => s.id === (staffId || newStaffId));
    if (selectedStaff?.orarioMattina) {
      const parts = selectedStaff.orarioMattina.split("-").map(s => s.trim());
      setNewOrarioInizio(parts[0] || "07:00");
      setNewOrarioFine(parts[1] || "14:00");
    }

    setShowAddModal(true);
  };

  // Handle Submit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffId || !newDate) {
      alert("Seleziona operatore e data.");
      return;
    }

    const shiftObj: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      staffId: newStaffId,
      data: newDate,
      tipoTurno: newTipoTurno,
      orarioInizio: newOrarioInizio,
      orarioFine: newOrarioFine,
      note: newNote
    };

    onAddShift(shiftObj);
    setShowAddModal(false);
    setNewNote("");
    showToast(`Turno ${newTipoTurno} inserito per il ${newDate}!`);
  };

  // Delete Single Shift with Undo
  const handleDeleteSingleShift = (shiftId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetShift = shifts.find(s => s.id === shiftId);
    if (!targetShift) return;

    setLastDeletedShifts([targetShift]);
    if (onDeleteShift) {
      onDeleteShift(shiftId);
    } else if (onUpdateShifts) {
      onUpdateShifts(shifts.filter(s => s.id !== shiftId));
    }
    setSelectedShiftForDetail(null);
    showToast(`🗑️ Turno ${targetShift.tipoTurno} cancellato.`, true);
  };

  // Trigger Delete Day Confirmation Modal
  const handleRequestDeleteDay = (dateYMD: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const dayShifts = shifts.filter(s => s.data === dateYMD);
    if (dayShifts.length === 0) {
      showToast("Nessun turno presente da cancellare in questo giorno.");
      return;
    }
    setConfirmDeleteDayDate(dateYMD);
  };

  // Execute Delete ALL Shifts for a Day
  const handleExecuteDeleteDayShifts = () => {
    if (!confirmDeleteDayDate) return;
    const dayShifts = shifts.filter(s => s.data === confirmDeleteDayDate);
    setLastDeletedShifts(dayShifts);

    if (onUpdateShifts) {
      onUpdateShifts(shifts.filter(s => s.data !== confirmDeleteDayDate));
    }

    const formattedDate = new Date(confirmDeleteDayDate).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    setConfirmDeleteDayDate(null);
    showToast(`🗑️ Cancellati tutti i ${dayShifts.length} turni del ${formattedDate}!`, true);
  };

  // Handle Undo Last Deletion
  const handleUndoDelete = () => {
    if (!lastDeletedShifts || !onUpdateShifts) return;
    // Restore deleted shifts avoiding duplicates
    const existingIds = new Set(shifts.map(s => s.id));
    const toRestore = lastDeletedShifts.filter(s => !existingIds.has(s.id));
    onUpdateShifts([...shifts, ...toRestore]);
    setLastDeletedShifts(null);
    showToast("✅ Turni ripristinati con successo!");
  };

  // LONG PRESS HANDLERS FOR FULL DAY DUPLICATION/MOVE
  const handleMouseDownDay = (dateYMD: string, e: React.MouseEvent | React.TouchEvent) => {
    // If click was on trash icon, ignore long press
    if ((e.target as HTMLElement).closest("button")) return;

    setHoldingDayDate(dateYMD);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    holdTimerRef.current = setTimeout(() => {
      const dayShifts = shifts.filter(s => s.data === dateYMD);
      if (dayShifts.length > 0) {
        const formattedDate = new Date(dateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
        showToast(`✨ Giorno ${formattedDate} afferrato! Trascinalo su un altro giorno per ${dragActionMode === "move" ? "spostarlo" : "duplicarlo"}.`);
      }
      setHoldingDayDate(null);
    }, 1500); // 1.5s hold
  };

  const handleMouseUpDay = () => {
    setHoldingDayDate(null);
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // 1-CLICK COPY SINGLE SHIFT (Copies shift to next day by default)
  const handleCopySingleShift = (shift: Shift, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onUpdateShifts) return;

    const curDate = new Date(shift.data);
    curDate.setDate(curDate.getDate() + 1);
    const nextDateStr = formatDateYMD(curDate);

    const staffMember = staff.find(st => st.id === shift.staffId);
    const times = getStaffHoursForShiftType(staffMember, shift.tipoTurno, shift.orarioInizio, shift.orarioFine);

    const copiedShift: Shift = {
      ...shift,
      id: `shift-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      data: nextDateStr,
      orarioInizio: times.orarioInizio,
      orarioFine: times.orarioFine
    };

    // Erase existing shift on target date for this staff member before copying (SOVRASCRITTURA)
    const shiftsWithoutTargetCell = shifts.filter(s => !(s.staffId === shift.staffId && s.data === nextDateStr));

    onUpdateShifts([...shiftsWithoutTargetCell, copiedShift]);
    showToast(`📋 Turno ${shift.tipoTurno} per ${staffMember ? staffMember.nome : ""} COPIATO (${times.orarioInizio}-${times.orarioFine}) [sovrascritto]!`);
  };

  // 1-CLICK COPY ENTIRE DAY TO NEXT WEEK (+7 Days)
  const handleCopyDayToNextWeek = (sourceDateYMD: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onUpdateShifts) return;

    if (isPublicView || currentUser?.role === 'staff') {
      showToast("⚠️ Solo l'amministratore può copiare interi giorni di turni.");
      return;
    }

    const dayShifts = shifts.filter(s => s.data === sourceDateYMD);
    if (dayShifts.length === 0) {
      showToast("Nessun turno presente da copiare in questo giorno.");
      return;
    }

    const d = new Date(sourceDateYMD);
    d.setDate(d.getDate() + 7);
    const targetDateYMD = formatDateYMD(d);

    // Erase old shifts on target date before adding copied ones
    const existingShiftsWithoutTarget = shifts.filter(s => s.data !== targetDateYMD);

    const newDuplicatedShifts: Shift[] = dayShifts.map((s, idx) => {
      const staffMember = staff.find(st => st.id === s.staffId);
      const times = getStaffHoursForShiftType(staffMember, s.tipoTurno, s.orarioInizio, s.orarioFine);
      return {
        ...s,
        id: `shift-day-copy-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        data: targetDateYMD,
        orarioInizio: times.orarioInizio,
        orarioFine: times.orarioFine
      };
    });

    onUpdateShifts([...existingShiftsWithoutTarget, ...newDuplicatedShifts]);
    const sourceFormatted = new Date(sourceDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    const targetFormatted = new Date(targetDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
    showToast(`🎉 COPIATI tutti i turni del ${sourceFormatted} nel ${targetFormatted} (con orari personalizzati dell'operatore)!`);
  };

  // AUTO WEEK NAVIGATION WHEN DRAGGING TOWARDS LEFT/RIGHT EDGES
  const handleDragOverNextWeekZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHoveringNextZone(true);

    const now = Date.now();
    if (now - lastAutoWeekTurnTimeRef.current >= 1800) {
      lastAutoWeekTurnTimeRef.current = now;
      if (viewMode === "month") {
        handleNextMonth();
        showToast("➡️ Mese Successivo (+1 mese)");
      } else {
        handleNextWeek();
        showToast("➡️ Settimana Successiva (+1 sett)");
      }
    }
  };

  const handleDragOverPrevWeekZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHoveringPrevZone(true);

    const now = Date.now();
    if (now - lastAutoWeekTurnTimeRef.current >= 1800) {
      lastAutoWeekTurnTimeRef.current = now;
      if (viewMode === "month") {
        handlePrevMonth();
        showToast("⬅️ Mese Precedente (-1 mese)");
      } else {
        handlePrevWeek();
        showToast("⬅️ Settimana Precedente (-1 sett)");
      }
    }
  };

  const handleDragLeaveWeekZone = () => {
    setIsHoveringNextZone(false);
    setIsHoveringPrevZone(false);
    lastAutoWeekTurnTimeRef.current = 0;
  };

  // DRAG & DROP FOR FULL DAY
  const handleDragStartDay = (e: React.DragEvent, sourceDateYMD: string) => {
    const payload = JSON.stringify({
      type: "day",
      sourceDateYMD
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
  };

  // DRAG & DROP FOR SINGLE SHIFT
  const handleDragStartSingleShift = (e: React.DragEvent, shift: Shift) => {
    e.stopPropagation();
    const payload = JSON.stringify({
      type: "single_shift",
      shiftId: shift.id,
      sourceStaffId: shift.staffId,
      sourceDate: shift.data
    });
    e.dataTransfer.setData("application/json", payload);
    e.dataTransfer.setData("text/plain", payload);
  };

  const handleDragOverCell = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    if (dragOverCellKey !== cellKey) {
      setDragOverCellKey(cellKey);
    }
  };

  const handleDragLeaveCell = () => {
    setDragOverCellKey(null);
  };

  // DROP HANDLER ON CELL OR DAY
  const handleDropOnCell = (e: React.DragEvent, targetStaffId: string, targetDateYMD: string) => {
    e.preventDefault();
    setDragOverCellKey(null);
    setDragOverTargetDate(null);

    const rawData = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      // Check if any modifier key (Shift, Ctrl, Alt, Meta, Fn, CapsLock, NumLock) was held
      const isModifierHeld = e.shiftKey || e.ctrlKey || e.altKey || e.metaKey ||
        (typeof e.getModifierState === "function" && (
          e.getModifierState("Fn") ||
          e.getModifierState("FnLock") ||
          e.getModifierState("Alt") ||
          e.getModifierState("Control") ||
          e.getModifierState("Shift") ||
          e.getModifierState("CapsLock") ||
          e.getModifierState("NumLock") ||
          e.getModifierState("Meta")
        ));

      // Determine action: COPIA if "copy" mode is selected OR if a modifier key (Fn, Shift, Ctrl, Alt, CapsLock) is held!
      const isCopy = dragActionMode === "copy" || isModifierHeld;

      if (data.type === "single_shift") {
        const draggedShift = shifts.find(s => s.id === data.shiftId);
        if (!draggedShift) return;

        const finalStaffId = targetStaffId || draggedShift.staffId;
        const targetStaffObj = staff.find(st => st.id === finalStaffId);
        const times = getStaffHoursForShiftType(targetStaffObj, draggedShift.tipoTurno, draggedShift.orarioInizio, draggedShift.orarioFine);

        // ERASE EXISTING SHIFT(S) ON TARGET CELL BEFORE MOVING OR COPYING
        const shiftsWithoutTargetCell = shifts.filter(s =>
          !(s.staffId === finalStaffId && s.data === targetDateYMD && s.id !== draggedShift.id)
        );

        if (!isCopy) {
          // MOVE SHIFT (SPOSTA CON SOVRASCRITTURA)
          if (onUpdateShifts) {
            const updated = shiftsWithoutTargetCell.map(s => {
              if (s.id === draggedShift.id) {
                return {
                  ...s,
                  staffId: finalStaffId,
                  data: targetDateYMD,
                  orarioInizio: times.orarioInizio,
                  orarioFine: times.orarioFine
                };
              }
              return s;
            });
            onUpdateShifts(updated);
            showToast(`↔️ Turno ${draggedShift.tipoTurno} SPOSTATO a ${targetStaffObj ? targetStaffObj.nome : ""} (${times.orarioInizio}-${times.orarioFine}) [sovrascritto]!`);
          }
        } else {
          // COPY SHIFT (COPIA / DUPLICA CON SOVRASCRITTURA)
          if (onUpdateShifts) {
            const newCopyShift: Shift = {
              ...draggedShift,
              id: `shift-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              staffId: finalStaffId,
              data: targetDateYMD,
              orarioInizio: times.orarioInizio,
              orarioFine: times.orarioFine
            };
            onUpdateShifts([...shiftsWithoutTargetCell, newCopyShift]);
            showToast(`📋 Turno ${draggedShift.tipoTurno} COPIATO a ${targetStaffObj ? targetStaffObj.nome : ""} (${times.orarioInizio}-${times.orarioFine}) [sovrascritto]!`);
          }
        }
      } else if (data.type === "day") {
        // ENTIRE DAY DRAG (MOVE OR COPY)
        const sourceDateYMD = data.sourceDateYMD;
        if (!sourceDateYMD || sourceDateYMD === targetDateYMD) return;

        const dayShifts = shifts.filter(s => s.data === sourceDateYMD);
        if (dayShifts.length === 0) {
          showToast("Nessun turno presente sul giorno trascinato.");
          return;
        }

        if (onUpdateShifts) {
          // IMPORTANT: Erase old/existing shifts on target date before adding moved or copied shifts
          const shiftsWithoutTarget = shifts.filter(s => s.data !== targetDateYMD);

          if (!isCopy) {
            // MOVE ALL SHIFTS FROM SOURCE DATE TO TARGET DATE (SPOSTA INTERO GIORNO)
            const updated = shiftsWithoutTarget.map(s => {
              if (s.data === sourceDateYMD) {
                const staffMember = staff.find(st => st.id === s.staffId);
                const times = getStaffHoursForShiftType(staffMember, s.tipoTurno, s.orarioInizio, s.orarioFine);
                return {
                  ...s,
                  data: targetDateYMD,
                  orarioInizio: times.orarioInizio,
                  orarioFine: times.orarioFine
                };
              }
              return s;
            });
            onUpdateShifts(updated);

            const sourceFormatted = new Date(sourceDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
            const targetFormatted = new Date(targetDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
            showToast(`↔️ SPOSTATI i turni del ${sourceFormatted} sovrascrivendo i vecchi del ${targetFormatted}!`);
          } else {
            // DUPLICATE/COPY ALL SHIFTS TO TARGET DATE (COPIA INTERO GIORNO CON SOVRASCRITTURA)
            const newDuplicatedShifts: Shift[] = dayShifts.map((s, idx) => {
              const staffMember = staff.find(st => st.id === s.staffId);
              const times = getStaffHoursForShiftType(staffMember, s.tipoTurno, s.orarioInizio, s.orarioFine);
              return {
                ...s,
                id: `shift-day-copy-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                data: targetDateYMD,
                orarioInizio: times.orarioInizio,
                orarioFine: times.orarioFine
              };
            });

            onUpdateShifts([...shiftsWithoutTarget, ...newDuplicatedShifts]);

            const sourceFormatted = new Date(sourceDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
            const targetFormatted = new Date(targetDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
            showToast(`🎉 COPIATI i turni del ${sourceFormatted} nel ${targetFormatted} (con orari personalizzati degli operatori)!`);
          }
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  // Save Shift Details from Modal (Edit Shift Date/Staff/Times)
  const handleSaveShiftEdit = () => {
    if (!selectedShiftForDetail || !onUpdateShifts) return;

    const updatedShifts = shifts.map(s => {
      if (s.id === selectedShiftForDetail.id) {
        return {
          ...s,
          staffId: editShiftStaffId || s.staffId,
          data: editShiftDate || s.data,
          orarioInizio: editShiftInizio || s.orarioInizio,
          orarioFine: editShiftFine || s.orarioFine
        };
      }
      return s;
    });

    onUpdateShifts(updatedShifts);
    setSelectedShiftForDetail(null);
    showToast("✅ Turno aggiornato con successo!");
  };

  // Open Edit Shift Modal
  const handleOpenDetailModal = (s: Shift) => {
    setSelectedShiftForDetail(s);
    setEditShiftStaffId(s.staffId);
    setEditShiftDate(s.data);
    setEditShiftInizio(s.orarioInizio);
    setEditShiftFine(s.orarioFine);
  };

  // Save Staff Member Custom Profile & Hours
  const handleSaveStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember || !onUpdateStaff) return;

    const updatedList = staff.map(st => st.id === editingStaffMember.id ? editingStaffMember : st);
    onUpdateStaff(updatedList);

    // Save directly to Firestore and REST API for real-time live sync on public links
    firestoreSync.saveStaff(updatedList);
    apiSync.saveStaff(updatedList);

    setEditingStaffMember(null);
    showToast(`✅ Scheda di ${editingStaffMember.nome} ${editingStaffMember.cognome} aggiornata live!`);
  };

  // Add Brand New Staff Member / Employee
  const handleAddStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffNome.trim() || !newStaffCognome.trim()) {
      alert("Nome e cognome sono obbligatori.");
      return;
    }

    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      nome: newStaffNome.trim(),
      cognome: newStaffCognome.trim(),
      ruolo: (newStaffRuolo.trim() || "OSS (Operatore Socio-Sanitario)") as any,
      telefono: newStaffTelefono.trim() || "Non specificato",
      email: newStaffEmail.trim() || "",
      codiceFiscale: "",
      attivo: true,
      coloreBadge: newStaffColoreBadge || "#4f46e5",
      orarioMattina: newStaffOrarioMattina || "07:00 - 14:00",
      orarioPomeriggio: newStaffOrarioPomeriggio || "14:00 - 21:00",
      orarioNotte: newStaffOrarioNotte || "21:00 - 07:00"
    };

    const updatedList = [...staff, newMember];
    if (onUpdateStaff) {
      onUpdateStaff(updatedList);
    }

    // Direct real-time sync
    firestoreSync.saveStaff(updatedList);
    apiSync.saveStaff(updatedList);

    setShowAddStaffModal(false);
    // Reset form
    setNewStaffNome("");
    setNewStaffCognome("");
    setNewStaffTelefono("");
    setNewStaffEmail("");

    showToast(`✅ Nuovo dipendente ${newMember.nome} ${newMember.cognome} aggiunto all'organico!`);
  };

  // Delete Staff Member from Roster
  const handleDeleteStaffMember = (staffId: string) => {
    const memberToDelete = staff.find(s => s.id === staffId);
    if (!memberToDelete) return;

    const updatedList = staff.filter(s => s.id !== staffId);
    if (onUpdateStaff) {
      onUpdateStaff(updatedList);
    }

    // Save updated staff list directly to Firestore and REST API
    firestoreSync.saveStaff(updatedList);
    apiSync.saveStaff(updatedList);

    setConfirmDeleteStaff(null);
    if (editingStaffMember?.id === staffId) {
      setEditingStaffMember(null);
    }

    showToast(`🗑️ Operatore ${memberToDelete.nome} ${memberToDelete.cognome} rimosso dall'organico.`);
  };

  // Auto-generate Week Rotation Schedule
  const handleGenerateStandardWeek = () => {
    if (!onUpdateShifts) return;
    if (!confirm("Vuoi caricare automaticamente la rotazione turni standard (Mattina/Pomeriggio/Notte/Riposo) per tutti gli operatori per questa settimana?")) return;

    const newGeneratedShifts: Shift[] = [...shifts];
    const shiftTypes: ("Mattina" | "Pomeriggio" | "Notte" | "Riposo")[] = ["Mattina", "Pomeriggio", "Notte", "Riposo"];

    weekDays.forEach((day, dayIndex) => {
      const dateStr = formatDateYMD(day);
      staff.forEach((member, staffIndex) => {
        const exists = newGeneratedShifts.some(s => s.staffId === member.id && s.data === dateStr);
        if (!exists) {
          const shiftType = shiftTypes[(staffIndex + dayIndex) % 4];
          
          // Use member custom default hours if available
          let start = "07:00", end = "14:00";
          if (shiftType === "Mattina") {
            if (member.orarioMattina) {
              const p = member.orarioMattina.split("-");
              start = p[0]?.trim() || "07:00"; end = p[1]?.trim() || "14:00";
            }
          } else if (shiftType === "Pomeriggio") {
            if (member.orarioPomeriggio) {
              const p = member.orarioPomeriggio.split("-");
              start = p[0]?.trim() || "14:00"; end = p[1]?.trim() || "21:00";
            } else { start = "14:00"; end = "21:00"; }
          } else if (shiftType === "Notte") {
            if (member.orarioNotte) {
              const p = member.orarioNotte.split("-");
              start = p[0]?.trim() || "21:00"; end = p[1]?.trim() || "07:00";
            } else { start = "21:00"; end = "07:00"; }
          } else if (shiftType === "Riposo") { start = "00:00"; end = "00:00"; }

          newGeneratedShifts.push({
            id: `gen-${Date.now()}-${member.id}-${dayIndex}`,
            staffId: member.id,
            data: dateStr,
            tipoTurno: shiftType,
            orarioInizio: start,
            orarioFine: end,
            note: "Programmazione automatica"
          });
        }
      });
    });

    onUpdateShifts(newGeneratedShifts);
    showToast("Programmazione settimanale generata con orari memorizzati!");
  };

  // Badge Color Styles for Turno Types (Varies color dynamically if shift hours are customized!)
  const getShiftBadgeStyle = (tipo: string, start?: string, end?: string) => {
    const isStandardMattina = tipo === "Mattina" && (start === "07:00" || !start) && (end === "14:00" || !end);
    const isStandardPomeriggio = tipo === "Pomeriggio" && (start === "14:00" || !start) && (end === "21:00" || !end);
    const isStandardNotte = tipo === "Notte" && (start === "21:00" || !start) && (end === "07:00" || !end);
    const isStandardReperibilita = tipo === "Reperibilità" && (start === "00:00" || !start) && (end === "23:59" || !end);
    const isStandardRiposo = tipo === "Riposo" && (start === "00:00" || !start) && (end === "00:00" || !end);
    const isStandardFerie = tipo === "Ferie";

    const isStandard = isStandardMattina || isStandardPomeriggio || isStandardNotte || isStandardReperibilita || isStandardRiposo || isStandardFerie;

    if (isStandard) {
      switch (tipo) {
        case "Mattina":
          return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200";
        case "Pomeriggio":
          return "bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200";
        case "Notte":
          return "bg-slate-800 text-purple-200 border-slate-700 hover:bg-slate-900";
        case "Reperibilità":
          return "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200";
        case "Riposo":
          return "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200";
        case "Ferie":
          return "bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-300 font-black shadow-xs ring-2 ring-amber-500/50";
        default:
          return "bg-blue-100 text-blue-900 border-blue-200";
      }
    } else {
      // CUSTOM NON-STANDARD HOURS -> Vibrant distinct colors with custom hour badge ring!
      if (tipo === "Ferie") {
        return "bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-300 font-black shadow-xs ring-2 ring-amber-500/50";
      } else if (tipo === "Mattina") {
        if (start && start < "07:00") {
          return "bg-yellow-200 text-amber-950 border-yellow-400 hover:bg-yellow-300 ring-2 ring-yellow-500/80 shadow-xs font-black";
        } else if (start && start > "07:30") {
          return "bg-orange-100 text-orange-950 border-orange-400 hover:bg-orange-200 ring-2 ring-orange-500/80 shadow-xs font-black";
        }
        return "bg-amber-200 text-amber-950 border-amber-400 hover:bg-amber-300 ring-2 ring-amber-500/80 shadow-xs font-black";
      } else if (tipo === "Pomeriggio") {
        if (start && start > "14:30") {
          return "bg-cyan-100 text-cyan-950 border-cyan-400 hover:bg-cyan-200 ring-2 ring-cyan-500/80 shadow-xs font-black";
        }
        return "bg-violet-100 text-violet-950 border-violet-400 hover:bg-violet-200 ring-2 ring-violet-500/80 shadow-xs font-black";
      } else if (tipo === "Notte") {
        return "bg-indigo-950 text-amber-300 border-amber-400 hover:bg-indigo-900 ring-2 ring-amber-400/80 shadow-xs font-black";
      } else if (tipo === "Reperibilità") {
        return "bg-teal-100 text-teal-950 border-teal-400 hover:bg-teal-200 ring-2 ring-teal-500/80 shadow-xs font-black";
      } else {
        return "bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200 ring-2 ring-rose-400/80 shadow-xs font-black";
      }
    }
  };

  // EXPORT CSV FOR GOOGLE SHEETS / EXCEL
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header Row: Operatore, Ruolo, Date1, Date2...
    const dateHeaders = weekDays.map(d => `${getFullWeekdayName(d)} ${d.getDate()} ${getFullMonthName(d)}`).join(",");
    csvContent += `Operatore,Ruolo,${dateHeaders}\n`;

    // Data rows
    staff.forEach(member => {
      const rowShifts = weekDays.map(d => {
        const dateStr = formatDateYMD(d);
        const sList = shifts.filter(s => s.staffId === member.id && s.data === dateStr);
        if (sList.length === 0) return "Riposo";
        return sList.map(s => `"${s.tipoTurno} (${s.orarioInizio}-${s.orarioFine})"`).join(" | ");
      }).join(",");

      csvContent += `"${member.nome} ${member.cognome}","${member.ruolo}",${rowShifts}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tabellone_Turni_${getFullMonthName(weekDays[0])}_${weekDays[0].getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📊 File CSV per Google Sheets / Excel scaricato con successo!");
  };

  // PRINT / EXPORT PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // HELPER TO GENERATE PUBLIC ACCESSIBLE SHARE URL FOR EMPLOYEES (PREVENT 403)
  const getPublicShareUrl = () => {
    let origin = window.location.origin;
    // Replace dev container URL prefix (ais-dev-) with public shared URL prefix (ais-pre-) so employees don't get 403 Forbidden
    if (origin.includes("ais-dev-")) {
      origin = origin.replace("ais-dev-", "ais-pre-");
    }
    return `${origin}${window.location.pathname}?view=public-turni`;
  };

  // COPY PUBLIC LIVE SHARE LINK FOR EMPLOYEES ONLY
  const handleCopyPublicShareLink = () => {
    const publicUrl = getPublicShareUrl();
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
    showToast("🔗 Link PUBBLICO DIPENDENTI (solo calendario turni) copiato negli appunti!");
  };

  // COPY GOOGLE APPS SCRIPT CODE FOR GOOGLE SHEETS SYNC
  const handleCopyGoogleAppsScript = () => {
    const scriptCode = `// GOOGLE APPS SCRIPT PER IMPORTARE AUTOMATICAMENTE I TURNI DI RESIDENZA VANNUCCI
// Incolla questo codice in: Google Foglio -> Estensioni -> Apps Script -> Esegui

function importaTurniResidenzaVannucci() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var csvData = \`${weekDays.map(d => `${getFullWeekdayName(d)} ${d.getDate()} ${getFullMonthName(d)}`).join(",")}\\n\`;
  
  sheet.clear();
  sheet.getRange(1, 1).setValue("RESIDENZA VANNUCCI - Tabellone Turni Settimana");
  sheet.getRange(1, 1).setFontWeight("bold").setFontSize(14);
  
  // Tabella Turni
  var data = [
    ["Operatore", "Ruolo", ${weekDays.map(d => `"${getFullWeekdayName(d)} ${d.getDate()} ${getFullMonthName(d)}"`).join(",")}]
  ];
  
  ${JSON.stringify(staff)}.forEach(function(member) {
    var row = [member.nome + " " + member.cognome, member.ruolo];
    ${JSON.stringify(weekDays.map(d => formatDateYMD(d)))}.forEach(function(dateStr) {
      var userShifts = ${JSON.stringify(shifts)}.filter(function(s) {
        return s.staffId === member.id && s.data === dateStr;
      });
      if (userShifts.length === 0) {
        row.push("Riposo");
      } else {
        row.push(userShifts.map(function(s) { return s.tipoTurno + " (" + s.orarioInizio + "-" + s.orarioFine + ")"; }).join(" | "));
      }
    });
    data.push(row);
  });
  
  sheet.getRange(3, 1, data.length, data[0].length).setValues(data);
  sheet.getRange(3, 1, 1, data[0].length).setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold");
}
`;
    navigator.clipboard.writeText(scriptCode);
    showToast("📋 Codice Google Apps Script COPIATO negli appunti! Seguilo nelle istruzioni.");
  };

  return (
    <div className="space-y-6 pb-12 relative">

      {/* Floating Toast Message with UNDO Button */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastMessage.text}</span>
          {toastMessage.showUndo && lastDeletedShifts && (
            <button
              onClick={handleUndoDelete}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all ml-2"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
          )}
        </div>
      )}
      
      {/* PUBLIC READ ONLY NOTICE BANNER */}
      {isPublicView && (
        <div className="bg-indigo-950 text-white p-4 rounded-2xl border border-indigo-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3 font-bold">
            <span className="px-2.5 py-1 bg-indigo-500/30 border border-indigo-400 text-indigo-200 rounded-lg text-[10px] font-mono tracking-wider uppercase shrink-0">
              SOLA LETTURA
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-indigo-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                🔒 <strong>Vista Dipendenti in Tempo Reale:</strong> I turni si aggiornano automaticamente appena il direttore li modifica.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onRefreshShifts) {
                onRefreshShifts();
              } else {
                window.location.reload();
              }
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            title="Ricarica i turni dal server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Aggiorna ora</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            <span>{isPublicView ? "Calendario Turni Dipendenti — Consultazione Live" : "Gestione & Calendario Turni Personale"}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isPublicView
              ? "Tabellone consultabile in tempo reale. Seleziona il giorno o passa alla vista mensile per verificare i tuoi turni e le reperibilità."
              : "Doppio clic sulle caselle per aggiungere turni, trascina per spostare o duplicare, e salva le schede orario per ogni operatore"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* DRAG ACTION MODE TOGGLE (SPOSTA vs DUPLICA) - ADMIN ONLY */}
          {!isPublicView && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDragActionMode("move")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  dragActionMode === "move" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Modalità Trascina: Sposta il turno"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Sposta</span>
              </button>

              <button
                onClick={() => setDragActionMode("copy")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                  dragActionMode === "copy" 
                    ? "bg-amber-500 text-slate-950 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Modalità Trascina: Duplica il turno"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplica</span>
              </button>
            </div>
          )}

          {/* VACATION / FERIE BUTTON FOR EMPLOYEES & ADMIN */}
          <button
            onClick={handleOpenVacationModal}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            title="Richiedi o inserisci giornate di ferie desiderate"
          >
            <Palmtree className="w-4 h-4 text-slate-950" />
            <span>Richiedi / Inserisci Ferie</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            title="Esporta per Google Sheets / Excel, Stampa PDF o Condividi con i dipendenti"
          >
            <Share2 className="w-4 h-4" />
            <span>Condividi / Esporta</span>
          </button>

          {!isPublicView && (
            <button
              onClick={() => setShowHelpGuide(!showHelpGuide)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>{showHelpGuide ? "Nascondi Guida" : "Istruzioni"}</span>
            </button>
          )}

          {!isPublicView && onUpdateShifts && (
            <button
              onClick={handleGenerateStandardWeek}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Carica automaticamente i turni di rotazione per la settimana corrente"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Auto-Compila</span>
            </button>
          )}

          {!isPublicView && (
            <>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                title="Aggiungi un nuovo operatore o dipendente all'organico della struttura"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuovo Dipendente</span>
              </button>

              <button
                onClick={() => handleOpenAddModal()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuovo Turno</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Guide Box */}
      {showHelpGuide && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
              <span>Come Utilizzare il Calendario Turni Avanzato</span>
            </h3>
            <button onClick={() => setShowHelpGuide(false)} className="text-xs text-slate-400 hover:text-white">
              Chiudi guida
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-indigo-300 block flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-indigo-300" />
                <span>1. Clicca 2 Volte (Doppio Clic)</span>
              </span>
              <p className="text-slate-300 text-[11px]">
                Fai <strong>doppio clic su qualsiasi casella</strong> del calendario per aggiungere al volo un nuovo turno per quell'operatore e quella data!
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 block flex items-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                <span>2. Modalità Sposta / Duplica</span>
              </span>
              <p className="text-slate-300 text-[11px]">
                Usa il selettore in alto tra <strong>"Sposta"</strong> e <strong>"Duplica"</strong>. Trascina un turno con il mouse per muoverlo o copiarlo all'istante!
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 block flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>3. Cestino Giorno & Turno</span>
              </span>
              <p className="text-slate-300 text-[11px]">
                Clicca l'icona <strong>Cestino</strong> nell'intestazione di un giorno per cancellare tutti i turni del giorno. Passando il mouse su un singolo turno compare il cestino dedicato!
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-300 block flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>4. Scheda Orari Personalizzati</span>
              </span>
              <p className="text-slate-300 text-[11px]">
                Clicca il nome di un operatore per personalizzare i suoi orari predefiniti (es. Mattina 07:30 - 14:30) e il sistema li memorizzerà per sempre!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls & View Mode Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Date Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={viewMode === "month" ? handlePrevMonth : handlePrevWeek}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer"
            title={viewMode === "month" ? "Mese precedente" : "Settimana precedente"}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Oggi
          </button>

          <button
            onClick={viewMode === "month" ? handleNextMonth : handleNextWeek}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-all cursor-pointer"
            title={viewMode === "month" ? "Mese successivo" : "Settimana successiva"}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <span className="text-sm font-extrabold text-slate-800 ml-2">
            {viewMode === "month"
              ? `Mese di ${getFullMonthName(currentDate).toUpperCase()} ${currentDate.getFullYear()}`
              : `Settimana dal ${weekDays[0].getDate()} ${getFullMonthName(weekDays[0])} al ${weekDays[6].getDate()} ${getFullMonthName(weekDays[6])} ${weekDays[6].getFullYear()}`
            }
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setViewMode("mobile")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              viewMode === "mobile" ? "bg-indigo-600 text-white shadow font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📱 Vista Smartphone
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "week" ? "bg-white text-indigo-700 shadow font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Calendario Settimanale
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "month" ? "bg-white text-indigo-700 shadow font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Calendario Mensile
          </button>
          <button
            onClick={() => setViewMode("roster")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              viewMode === "roster" ? "bg-white text-indigo-700 shadow font-extrabold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Schede Operatori ({staff.length})
          </button>
        </div>
      </div>

      {/* MOBILE SMARTPHONE DAY CARDS VIEW */}
      {viewMode === "mobile" && (
        <div className="space-y-5">
          {/* Mobile Day Selector Bar (Horizontally scrollable) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 px-1">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Seleziona Giorno da Consultare:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Scorri orizzontalmente →</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1">
              {weekDays.map((d) => {
                const dYMD = formatDateYMD(d);
                const isSelected = dYMD === selectedMobileDate;
                const isToday = dYMD === todayStr;
                const shiftsCount = shifts.filter(s => s.data === dYMD).length;

                return (
                  <button
                    key={dYMD}
                    type="button"
                    onClick={() => setSelectedMobileDate(dYMD)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer shrink-0 min-w-[110px] ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-md scale-105"
                        : isToday
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-bold"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-black tracking-wider opacity-85">
                      {getFullWeekdayName(d)}
                    </span>
                    <span className="text-base font-black my-0.5">
                      {d.getDate()} {getFullMonthName(d)}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                      isSelected ? "bg-indigo-500/50 text-white" : "bg-slate-200/80 text-slate-700"
                    }`}>
                      {shiftsCount} turni
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Header & Shift List */}
          {(() => {
            const activeDateObj = new Date(selectedMobileDate.includes("T") ? selectedMobileDate : `${selectedMobileDate}T12:00:00`);
            const activeDayName = getFullWeekdayName(activeDateObj);
            const activeMonthName = getFullMonthName(activeDateObj);
            const activeDayShifts = shifts.filter(s => s.data === selectedMobileDate);

            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider">
                        {activeDateObj.getDay() === 0 || activeDateObj.getDay() === 6 ? "Festivo / Weekend" : "Giorno Feriale"}
                      </span>
                      {selectedMobileDate === todayStr && (
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-bold text-[10px] rounded-full uppercase">
                          Oggi
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black mt-1 capitalize text-white">
                      {activeDayName} {activeDateObj.getDate()} {activeMonthName} {activeDateObj.getFullYear()}
                    </h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      {activeDayShifts.length === 0
                        ? "Nessun turno programmato per questo giorno"
                        : `In totale ci sono ${activeDayShifts.length} turni assegnati`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(activeDateObj);
                        prev.setDate(prev.getDate() - 1);
                        setSelectedMobileDate(formatDateYMD(prev));
                      }}
                      className="px-3 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-indigo-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Giorno Prec.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(activeDateObj);
                        next.setDate(next.getDate() + 1);
                        setSelectedMobileDate(formatDateYMD(next));
                      }}
                      className="px-3 py-2 bg-indigo-800/80 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-indigo-600"
                    >
                      <span>Giorno Succ.</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* List of Staff Members and their Shift on this day */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {staff.map((member) => {
                    const memberShifts = activeDayShifts.filter(s => s.staffId === member.id);

                    return (
                      <div
                        key={member.id}
                        className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3"
                      >
                        {/* Staff Info Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-sm shadow-xs shrink-0"
                              style={{ backgroundColor: member.coloreBadge }}
                            >
                              {member.nome[0]}{member.cognome[0]}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm">{member.nome} {member.cognome}</h4>
                              <p className="text-xs text-slate-500 font-medium">{member.ruolo}</p>
                            </div>
                          </div>

                          {!isPublicView && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddModal(member.id, selectedMobileDate)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                              title="Aggiungi turno per questo operatore"
                            >
                              <Plus className="w-4 h-4" />
                              <span className="hidden sm:inline">Turno</span>
                            </button>
                          )}
                        </div>

                        {/* Shift Cards for this member on this day */}
                        {memberShifts.length === 0 ? (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-500 text-xs font-medium flex items-center gap-2">
                            <span className="text-base">🌴</span>
                            <span>Riposo / Nessun turno assegnato</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {memberShifts.map((s) => (
                              <div
                                key={s.id}
                                onClick={() => handleOpenDetailModal(s)}
                                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all shadow-2xs ${getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine)}`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 text-sm font-extrabold">
                                    {s.tipoTurno === "Mattina" && <span>🌅 Turno Mattina</span>}
                                    {s.tipoTurno === "Pomeriggio" && <span>🌆 Turno Pomeriggio</span>}
                                    {s.tipoTurno === "Notte" && <span>🌙 Turno Notte</span>}
                                    {s.tipoTurno === "Reperibilità" && <span>📞 Reperibilità</span>}
                                    {s.tipoTurno === "Riposo" && <span>🌴 Riposo / Ferie</span>}
                                  </div>
                                  <div className="font-mono text-xs opacity-90 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Orario: {s.orarioInizio} — {s.orarioFine}</span>
                                  </div>
                                  {s.note && (
                                    <p className="text-[11px] font-normal italic text-slate-700 pt-1">
                                      Note: {s.note}
                                    </p>
                                  )}
                                </div>

                                <span className="text-[10px] px-2.5 py-1 bg-white/80 rounded-lg text-slate-900 border border-slate-200/80 shrink-0 font-bold">
                                  Dettagli →
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* WEEKLY CALENDAR MATRIX VIEW */}
      {viewMode === "week" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative group/calendar">
          
          {/* FLOATING DRAG & CLICK EDGE ZONES FOR PREV/NEXT WEEK (0px LAYOUT IMPACT) */}
          <div
            onDragOver={handleDragOverPrevWeekZone}
            onDragLeave={handleDragLeaveWeekZone}
            onDrop={(e) => {
              handleDragLeaveWeekZone();
              e.preventDefault();
            }}
            onClick={handlePrevWeek}
            className={`absolute left-0 top-0 bottom-0 z-30 w-7 hover:w-12 bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-r-xl ${
              isHoveringPrevZone
                ? "opacity-100 w-14 bg-indigo-950/95 border-r-4 border-amber-400 shadow-2xl"
                : "opacity-0 hover:opacity-100"
            }`}
            title="Trascina qui o Clicca per andare alla settimana precedente"
          >
            <div className="p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-lg animate-pulse flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 font-black stroke-[3.5]" />
            </div>
          </div>

          <div
            onDragOver={handleDragOverNextWeekZone}
            onDragLeave={handleDragLeaveWeekZone}
            onDrop={(e) => {
              handleDragLeaveWeekZone();
              e.preventDefault();
            }}
            onClick={handleNextWeek}
            className={`absolute right-0 top-0 bottom-0 z-30 w-7 hover:w-12 bg-gradient-to-l from-slate-900/90 via-indigo-950/70 to-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-l-xl ${
              isHoveringNextZone
                ? "opacity-100 w-14 bg-indigo-950/95 border-l-4 border-amber-400 shadow-2xl"
                : "opacity-0 hover:opacity-100"
            }`}
            title="Trascina qui o Clicca per andare alla settimana successiva"
          >
            <div className="p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-lg animate-pulse flex items-center justify-center">
              <ChevronRight className="w-5 h-5 font-black stroke-[3.5]" />
            </div>
          </div>

          {/* TABLE CONTAINER - EXPANDED WIDTH TO ENSURE ALL 7 DAYS FIT PERFECTLY WITHOUT CLIPPING */}
          <div className="overflow-auto max-h-[calc(100vh-250px)] w-full">
            <table className="w-full text-left border-collapse min-w-[1150px] sm:min-w-[1300px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <th className="p-4 w-48 min-w-[190px] border-r border-slate-200 sticky top-0 left-0 z-40 bg-slate-100 shadow-xs">Operatore / Ruolo</th>
                  {weekDays.map((day, idx) => {
                    const dateYMD = formatDateYMD(day);
                    const isToday = dateYMD === todayStr;
                    const isDragOver = dragOverTargetDate === dateYMD;
                    const isHolding = holdingDayDate === dateYMD;
                    const dayShiftsCount = shifts.filter(s => s.data === dateYMD).length;

                    return (
                      <th
                        key={idx}
                        draggable={!isPublicView}
                        onDragStart={(e) => {
                          if (!isPublicView) handleDragStartDay(e, dateYMD);
                        }}
                        onDragOver={(e) => {
                          if (!isPublicView) {
                            e.preventDefault();
                            setDragOverTargetDate(dateYMD);
                          }
                        }}
                        onDragLeave={() => setDragOverTargetDate(null)}
                        onDrop={(e) => {
                          if (!isPublicView) handleDropOnCell(e, "", dateYMD);
                        }}
                        onMouseDown={(e) => {
                          if (!isPublicView) handleMouseDownDay(dateYMD, e);
                        }}
                        onMouseUp={handleMouseUpDay}
                        onTouchStart={(e) => {
                          if (!isPublicView) handleMouseDownDay(dateYMD, e);
                        }}
                        onTouchEnd={handleMouseUpDay}
                        className={`p-3 text-center border-r border-slate-200 last:border-r-0 transition-all select-none relative group min-w-[135px] sm:min-w-[155px] sticky top-0 z-30 bg-slate-50 ${
                          isPublicView ? "" : "cursor-grab active:cursor-grabbing"
                        } ${
                          isDragOver
                            ? "bg-indigo-100 text-indigo-900 border-indigo-400 ring-2 ring-indigo-400"
                            : isHolding
                            ? "bg-amber-200 text-amber-950 animate-pulse"
                            : isToday
                            ? "bg-indigo-50/80 text-indigo-900"
                            : "hover:bg-slate-100/80"
                        }`}
                      >
                        {/* Long Press Visual Indicator */}
                        {isHolding && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
                        )}

                        <div className="flex items-center justify-between mb-1">
                          <span className="uppercase text-[9px] font-black tracking-wider text-slate-500 group-hover:text-indigo-600">
                            {getFullWeekdayName(day)}
                          </span>

                          {!isPublicView && (
                            <div className="flex items-center gap-1">
                              {/* COPY DAY TO NEXT WEEK BUTTON */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyDayToNextWeek(dateYMD, e)}
                                className="p-1 rounded bg-amber-100 hover:bg-amber-500 text-amber-800 hover:text-white transition-all text-[9px] font-bold flex items-center gap-0.5 shadow-2xs cursor-pointer z-10"
                                title="Copia intero giorno nella settimana successiva (+7 gg)"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              {/* TRASH ICON FOR ENTIRE DAY */}
                              <button
                                type="button"
                                onClick={(e) => handleRequestDeleteDay(dateYMD, e)}
                                className="p-1 rounded bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white transition-all text-[9px] font-semibold flex items-center gap-0.5 shadow-2xs cursor-pointer z-10"
                                title="Cancella tutti i turni di questo giorno"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className={`text-base font-black ${isToday ? "text-indigo-600" : "text-slate-800"}`}>
                          {day.getDate()} {getFullMonthName(day)}
                        </div>

                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium flex items-center justify-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{dayShiftsCount} turni</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Member Details Cell - Click to edit staff card */}
                    <td 
                      className={`p-3 border-r border-slate-200 sticky left-0 z-10 bg-white/95 backdrop-blur-xs shadow-xs transition-colors group/staff ${
                        isPublicView ? "" : "cursor-pointer hover:bg-slate-100"
                      }`}
                      onClick={() => {
                        if (!isPublicView) setEditingStaffMember(member);
                      }}
                      title={isPublicView ? `${member.nome} ${member.cognome} - ${member.ruolo}` : "Clicca per modificare la scheda e gli orari predefiniti"}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-white text-xs shadow-xs shrink-0"
                          style={{ backgroundColor: member.coloreBadge }}
                        >
                          {member.nome[0]}{member.cognome[0]}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <span>{member.nome} {member.cognome}</span>
                            {!isPublicView && <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover/staff:opacity-100 transition-opacity" />}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{member.ruolo}</div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Days Cells */}
                    {weekDays.map((day, dIdx) => {
                      const dateYMD = formatDateYMD(day);
                      const cellKey = `${member.id}_${dateYMD}`;
                      const isToday = dateYMD === todayStr;
                      const isDragOverCell = dragOverCellKey === cellKey;
                      const dayShifts = shifts.filter(s => s.staffId === member.id && s.data === dateYMD);

                      return (
                        <td
                          key={dIdx}
                          onDoubleClick={() => {
                            if (!isPublicView) handleOpenAddModal(member.id, dateYMD);
                          }}
                          onDragOver={(e) => {
                            if (!isPublicView) handleDragOverCell(e, cellKey);
                          }}
                          onDragLeave={handleDragLeaveCell}
                          onDrop={(e) => {
                            if (!isPublicView) handleDropOnCell(e, member.id, dateYMD);
                          }}
                          className={`p-2 border-r border-slate-200 last:border-r-0 align-top h-24 transition-all relative group/cell ${
                            isPublicView ? "" : "cursor-pointer"
                          } ${
                            isDragOverCell
                              ? "bg-indigo-100/70 border-2 border-indigo-500 shadow-inner"
                              : isToday
                              ? "bg-indigo-50/20"
                              : ""
                          }`}
                          title={isPublicView ? `${member.nome} — Turni del giorno` : "Doppio clic per aggiungere un turno in questo giorno"}
                        >
                          <div className="flex flex-col h-full justify-between space-y-1">
                            <div className="space-y-1.5">
                              {dayShifts.map(s => (
                                <div
                                  key={s.id}
                                  draggable={!isPublicView && s.tipoTurno !== "Ferie"}
                                  onDragStart={(e) => {
                                    if (!isPublicView && s.tipoTurno !== "Ferie") handleDragStartSingleShift(e, s);
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetailModal(s);
                                  }}
                                  className={`group/shift p-1.5 rounded-lg border text-[11px] font-bold transition-all shadow-2xs relative flex flex-col ${
                                    isPublicView || s.tipoTurno === "Ferie" ? "cursor-pointer hover:shadow-md" : "cursor-grab active:cursor-grabbing"
                                  } ${getShiftBadgeStyle(s.tipoTurno)} ${
                                    s.tipoTurno === "Ferie" ? "animate-pulse ring-2 ring-amber-500 ring-offset-1 border-amber-500 border-2" : ""
                                  }`}
                                  title={isPublicView ? `${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine}) - Clicca per dettagli` : s.tipoTurno === "Ferie" ? "Ferie inamovibili - Clicca per dettagli" : "Trascina per spostare o duplicare, oppure clicca per dettagli"}
                                >
                                  {/* Shift Header & Trash Hover Button */}
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1">
                                      {!isPublicView && <GripVertical className="w-3 h-3 text-slate-400 group-hover/shift:text-indigo-600 transition-colors" />}
                                      <span>{s.tipoTurno}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {s.tipoTurno === "Mattina" && <Sun className="w-3 h-3 text-amber-600" />}
                                      {s.tipoTurno === "Pomeriggio" && <Sunset className="w-3 h-3 text-indigo-600" />}
                                      {s.tipoTurno === "Notte" && <Moon className="w-3 h-3 text-purple-300" />}

                                      {!isPublicView && (
                                        <>
                                          {/* HOVER COPY BUTTON FOR SINGLE SHIFT */}
                                          <button
                                            type="button"
                                            onClick={(e) => handleCopySingleShift(s, e)}
                                            className="p-1 rounded bg-amber-500 hover:bg-amber-600 text-white opacity-0 group-hover/shift:opacity-100 transition-opacity shadow-xs z-10"
                                            title="Copia questo singolo turno nel giorno successivo"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>

                                          {/* HOVER TRASH ICON FOR SINGLE SHIFT */}
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteSingleShift(s.id, e)}
                                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover/shift:opacity-100 transition-opacity shadow-xs z-10"
                                            title="Elimina questo singolo turno"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[9px] font-mono opacity-80 mt-0.5">
                                    <span>{s.orarioInizio} - {s.orarioFine}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* SUBTLE HOVER ADD ICON FOR CELL (DOUBLE-CLICK PRIMARY) */}
                            {!isPublicView && dayShifts.length === 0 && (
                              <div className="h-full min-h-[50px] flex items-center justify-center text-slate-300 group-hover/cell:text-indigo-500 transition-colors">
                                <Plus className="w-4 h-4 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONTHLY CALENDAR MATRIX VIEW (Staff × Days of Month) */}
      {viewMode === "month" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative group/calendar">
          
          {/* FLOATING DRAG & CLICK EDGE ZONES FOR PREV/NEXT MONTH (0px LAYOUT IMPACT) */}
          <div
            onDragOver={handleDragOverPrevWeekZone}
            onDragLeave={handleDragLeaveWeekZone}
            onDrop={(e) => {
              handleDragLeaveWeekZone();
              e.preventDefault();
            }}
            onClick={handlePrevMonth}
            className={`absolute left-0 top-0 bottom-0 z-30 w-7 hover:w-12 bg-gradient-to-r from-slate-900/90 via-indigo-950/70 to-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-r-xl ${
              isHoveringPrevZone
                ? "opacity-100 w-14 bg-indigo-950/95 border-r-4 border-amber-400 shadow-2xl"
                : "opacity-0 hover:opacity-100"
            }`}
            title="Trascina qui o Clicca per andare al mese precedente"
          >
            <div className="p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-lg animate-pulse flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 font-black stroke-[3.5]" />
            </div>
          </div>

          <div
            onDragOver={handleDragOverNextWeekZone}
            onDragLeave={handleDragLeaveWeekZone}
            onDrop={(e) => {
              handleDragLeaveWeekZone();
              e.preventDefault();
            }}
            onClick={handleNextMonth}
            className={`absolute right-0 top-0 bottom-0 z-30 w-7 hover:w-12 bg-gradient-to-l from-slate-900/90 via-indigo-950/70 to-transparent flex flex-col items-center justify-center cursor-pointer transition-all duration-300 rounded-l-xl ${
              isHoveringNextZone
                ? "opacity-100 w-14 bg-indigo-950/95 border-l-4 border-amber-400 shadow-2xl"
                : "opacity-0 hover:opacity-100"
            }`}
            title="Trascina qui o Clicca per andare al mese successivo"
          >
            <div className="p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-lg animate-pulse flex items-center justify-center">
              <ChevronRight className="w-5 h-5 font-black stroke-[3.5]" />
            </div>
          </div>

          {/* TABLE CONTAINER - FITS ALL 31 DAYS IN 100% WIDTH */}
          <div className="overflow-auto max-h-[calc(100vh-250px)] w-full">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <th className="p-2 w-28 sm:w-32 sticky top-0 left-0 z-40 bg-slate-100 border-r border-slate-200 shadow-2xs">
                    Operatore ({staff.length})
                  </th>
                  {monthDays.map((day, idx) => {
                    const dateYMD = formatDateYMD(day);
                    const isToday = dateYMD === todayStr;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    const isDragOver = dragOverTargetDate === dateYMD;
                    const isHolding = holdingDayDate === dateYMD;
                    const dayShiftsCount = shifts.filter(s => s.data === dateYMD).length;

                    return (
                      <th
                        key={idx}
                        draggable={true}
                        onDragStart={(e) => handleDragStartDay(e, dateYMD)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverTargetDate(dateYMD);
                        }}
                        onDragLeave={() => setDragOverTargetDate(null)}
                        onDrop={(e) => handleDropOnCell(e, "", dateYMD)}
                        onMouseDown={(e) => handleMouseDownDay(dateYMD, e)}
                        onMouseUp={handleMouseUpDay}
                        onTouchStart={(e) => handleMouseDownDay(dateYMD, e)}
                        onTouchEnd={handleMouseUpDay}
                        className={`p-0.5 text-center border-r border-slate-200 last:border-r-0 cursor-grab active:cursor-grabbing transition-all select-none relative group/mhead sticky top-0 z-30 bg-slate-50 ${
                          isDragOver
                            ? "bg-indigo-100 text-indigo-900 border-indigo-400 ring-2 ring-indigo-400 z-10"
                            : isHolding
                            ? "bg-amber-200 text-amber-950 animate-pulse"
                            : isToday
                            ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                            : isWeekend
                            ? "bg-amber-50/80 text-amber-950"
                            : "hover:bg-slate-100/80"
                        }`}
                        title={`Giorno ${day.getDate()} ${getFullMonthName(day)} (${dayShiftsCount} turni). Trascina per spostare o duplicare l'intero giorno.`}
                      >
                        {/* Long Press Visual Indicator */}
                        {isHolding && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
                        )}

                        <div className="text-[8px] font-black uppercase text-slate-400 group-hover/mhead:text-indigo-600">
                          {day.toLocaleDateString("it-IT", { weekday: "narrow" })}
                        </div>

                        <div className={`text-[10px] sm:text-xs font-black my-0.5 ${isToday ? "text-white bg-indigo-600 rounded-full w-4 h-4 sm:w-5 sm:h-5 mx-auto flex items-center justify-center shadow-2xs" : "text-slate-800"}`}>
                          {day.getDate()}
                        </div>

                        {/* Action buttons on hover */}
                        {!isPublicView && (
                          <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover/mhead:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleCopyDayToNextWeek(dateYMD, e)}
                              className="p-0.5 rounded bg-amber-100 hover:bg-amber-500 text-amber-800 hover:text-white transition-all text-[8px] font-bold shadow-2xs cursor-pointer z-10"
                              title="Copia intero giorno (+7 gg)"
                            >
                              <Copy className="w-2 h-2" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRequestDeleteDay(dateYMD, e)}
                              className="p-0.5 rounded bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white transition-all text-[8px] font-semibold shadow-2xs cursor-pointer z-10"
                              title="Cancella turni del giorno"
                            >
                              <Trash2 className="w-2 h-2" />
                            </button>
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    
                    {/* Member Details Sticky Cell */}
                    <td
                      className={`p-1.5 border-r border-slate-200 sticky left-0 z-10 bg-white/95 backdrop-blur-xs transition-colors group/staff shadow-2xs overflow-hidden ${
                        isPublicView ? "" : "cursor-pointer hover:bg-slate-100"
                      }`}
                      onClick={() => {
                        if (!isPublicView) setEditingStaffMember(member);
                      }}
                      title={isPublicView ? `${member.nome} ${member.cognome}` : "Clicca per modificare scheda e orari"}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-extrabold text-white text-[9px] shadow-xs shrink-0"
                          style={{ backgroundColor: member.coloreBadge }}
                        >
                          {member.nome[0]}{member.cognome[0]}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="font-bold text-slate-900 text-[10px] sm:text-xs truncate">
                            {member.nome} {member.cognome[0]}.
                          </div>
                          <div className="text-[8px] text-slate-400 truncate hidden sm:block">{member.ruolo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Month Days Cells for Member */}
                    {monthDays.map((day, dIdx) => {
                      const dateYMD = formatDateYMD(day);
                      const cellKey = `${member.id}_${dateYMD}`;
                      const isToday = dateYMD === todayStr;
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isDragOverCell = dragOverCellKey === cellKey;
                      const dayShifts = shifts.filter(s => s.staffId === member.id && s.data === dateYMD);

                      return (
                        <td
                          key={dIdx}
                          onDoubleClick={() => {
                            if (!isPublicView) handleOpenAddModal(member.id, dateYMD);
                          }}
                          onDragOver={(e) => {
                            if (!isPublicView) handleDragOverCell(e, cellKey);
                          }}
                          onDragLeave={handleDragLeaveCell}
                          onDrop={(e) => {
                            if (!isPublicView) handleDropOnCell(e, member.id, dateYMD);
                          }}
                          className={`p-0.5 border-r border-slate-200 last:border-r-0 align-middle h-10 text-center transition-all relative group/cell ${
                            isPublicView ? "" : "cursor-pointer"
                          } ${
                            isDragOverCell
                              ? "bg-indigo-100 border-2 border-indigo-500 shadow-inner"
                              : isToday
                              ? "bg-indigo-50/40"
                              : isWeekend
                              ? "bg-amber-50/20"
                              : ""
                          }`}
                          title={`${member.nome}: ${dayShifts.length ? dayShifts.map(s => `${s.tipoTurno} (${s.orarioInizio}-${s.orarioFine})`).join(", ") : "Nessun turno"}.`}
                        >
                          <div className="flex flex-wrap items-center justify-center gap-0.5 h-full">
                            {dayShifts.length > 0 ? (
                              dayShifts.map(s => {
                                let badgeText = s.tipoTurno.substring(0, 1).toUpperCase();
                                if (s.tipoTurno === "Mattina") badgeText = "M";
                                else if (s.tipoTurno === "Pomeriggio") badgeText = "P";
                                else if (s.tipoTurno === "Notte") badgeText = "N";
                                else if (s.tipoTurno === "Reperibilità") badgeText = "R";
                                else if (s.tipoTurno === "Riposo") badgeText = "💤";

                                const badgeStyle = getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine);

                                return (
                                  <div
                                    key={s.id}
                                    draggable={!isPublicView && s.tipoTurno !== "Ferie"}
                                    onDragStart={(e) => {
                                      if (!isPublicView && s.tipoTurno !== "Ferie") handleDragStartSingleShift(e, s);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetailModal(s);
                                    }}
                                    className={`px-0.5 py-0.5 rounded text-[9px] font-black border shadow-2xs hover:scale-110 transition-transform flex items-center justify-center min-w-[16px] ${
                                      isPublicView || s.tipoTurno === "Ferie" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                                    } ${badgeStyle} ${
                                      s.tipoTurno === "Ferie" ? "animate-pulse ring-1 ring-amber-500 border-amber-500 border-2" : ""
                                    }`}
                                    title={s.tipoTurno === "Ferie" ? `Ferie inamovibili - Clicca per dettagli` : `${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine}) - Clicca per dettagli`}
                                  >
                                    {badgeText}
                                  </div>
                                );
                              })
                            ) : (
                              !isPublicView && (
                                <span className="text-[9px] text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity font-bold">
                                  +
                                </span>
                              )
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ROSTER / OPERATOR CARDS VIEW */}
      {viewMode === "roster" && (
        <div className="space-y-5">
          {!isPublicView && (
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-indigo-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <span>Organico Dipendenti & Operatori ({staff.length})</span>
                </h3>
                <p className="text-xs text-indigo-200">
                  Gestisci la lista dei dipendenti della struttura. Puoi aggiungere nuovi operatori, modificare le loro schede o rimuoverli. Tutti gli aggiornamenti si sincronizzano in tempo reale anche sul link pubblico!
                </p>
              </div>

              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Aggiungi Nuovo Dipendente</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => {
              const memberShifts = shifts.filter(s => s.staffId === member.id);

              return (
                <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 relative group">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm"
                        style={{ backgroundColor: member.coloreBadge }}
                      >
                        {member.nome[0]}{member.cognome[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{member.nome} {member.cognome}</h3>
                        <p className="text-xs text-slate-500 font-medium">{member.ruolo}</p>
                      </div>
                    </div>

                    {!isPublicView && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingStaffMember(member)}
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                          title="Modifica anagrafica e orari operatore"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenAddModal(member.id)}
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all"
                          title="Assegna nuovo turno"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setConfirmDeleteStaff(member)}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                          title="Elimina operatore dall'organico"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                {/* Custom Hours Summary */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Orari Predefiniti Salvati:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 font-mono">
                    <div>🌅 M: {member.orarioMattina || "07:00-14:00"}</div>
                    <div>🌆 P: {member.orarioPomeriggio || "14:00-21:00"}</div>
                    <div>🌙 N: {member.orarioNotte || "21:00-07:00"}</div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.telefono}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Turni Assegnati nei prossimi giorni:
                  </span>
                  
                  {memberShifts.length === 0 ? (
                    <span className="text-xs text-slate-400 italic block">Nessun turno in programma</span>
                  ) : (
                    memberShifts.slice(0, 5).map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleOpenDetailModal(s)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${getShiftBadgeStyle(s.tipoTurno)}`}
                      >
                        <div>
                          <span>{s.tipoTurno} • {s.data}</span>
                          <div className="text-[10px] font-mono opacity-80">{s.orarioInizio} - {s.orarioFine}</div>
                        </div>
                        <Trash2
                          className="w-4 h-4 text-rose-500 hover:text-rose-700 transition-colors"
                          onClick={(e) => handleDeleteSingleShift(s.id, e)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* MODAL: ADD SHIFT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>Aggiungi Turno nel Calendario</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              
              {/* Select Staff Member */}
              <div>
                <label className="block font-semibold mb-1">Operatore *</label>
                <select
                  value={newStaffId}
                  onChange={e => {
                    setNewStaffId(e.target.value);
                    handleSelectPreset(newTipoTurno, e.target.value);
                  }}
                  className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} {s.cognome} ({s.ruolo})</option>
                  ))}
                </select>
              </div>

              {/* Select Date */}
              <div>
                <label className="block font-semibold mb-1">Data Turno *</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Shift Presets */}
              <div>
                <label className="block font-semibold mb-1.5">Tipo Turno (Seleziona Preset)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Mattina")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Mattina" ? "bg-amber-100 border-amber-400 text-amber-900 ring-2 ring-amber-400" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🌅 Mattina
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Pomeriggio")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Pomeriggio" ? "bg-indigo-100 border-indigo-400 text-indigo-900 ring-2 ring-indigo-400" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🌆 Pomeriggio
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Notte")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Notte" ? "bg-slate-800 border-slate-900 text-purple-200 ring-2 ring-purple-500" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🌙 Notte
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Reperibilità")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Reperibilità" ? "bg-emerald-100 border-emerald-400 text-emerald-900 ring-2 ring-emerald-400" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    📞 Reperibilità
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Riposo")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-2 ring-slate-400" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    🏖️ Riposo
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset("Ferie")}
                    className={`p-2 rounded-xl border text-center font-bold transition-all ${
                      newTipoTurno === "Ferie" ? "bg-amber-400 border-amber-500 text-amber-950 ring-2 ring-amber-500" : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                    }`}
                  >
                    🌴 Ferie
                  </button>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ora Inizio</label>
                  <input
                    type="text"
                    value={newOrarioInizio}
                    onChange={e => setNewOrarioInizio(e.target.value)}
                    className="w-full border p-2 rounded-xl font-mono text-center"
                    placeholder="07:00"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Ora Fine</label>
                  <input
                    type="text"
                    value={newOrarioFine}
                    onChange={e => setNewOrarioFine(e.target.value)}
                    className="w-full border p-2 rounded-xl font-mono text-center"
                    placeholder="14:00"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-1">Note o Mansioni Specifiche</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full border p-2 rounded-xl"
                  placeholder="es. Responsabile carrello medicinali / Sostituzione turno"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Salva Turno in Calendario
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STAFF MEMBER CARD & CUSTOM DEFAULT HOURS */}
      {editingStaffMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>Modifica Scheda Operatore & Orari Salvati</span>
              </h3>
              <button onClick={() => setEditingStaffMember(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffMember} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={editingStaffMember.nome}
                    onChange={e => setEditingStaffMember({ ...editingStaffMember, nome: e.target.value })}
                    className="w-full border p-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cognome *</label>
                  <input
                    type="text"
                    required
                    value={editingStaffMember.cognome}
                    onChange={e => setEditingStaffMember({ ...editingStaffMember, cognome: e.target.value })}
                    className="w-full border p-2 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ruolo / Mansione *</label>
                  <select
                    value={editingStaffMember.ruolo}
                    onChange={e => setEditingStaffMember({ ...editingStaffMember, ruolo: e.target.value as any })}
                    className="w-full border p-2 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  >
                    <option value="OSS (Operatore Socio-Sanitario)">OSS (Operatore Socio-Sanitario)</option>
                    <option value="Infermiera / Infermiere">Infermiera / Infermiere</option>
                    <option value="Educatore">Educatore / Animatore</option>
                    <option value="Fisioterapista">Fisioterapista</option>
                    <option value="Coordinatore / Direttore">Coordinatore / Direttore</option>
                    <option value="Cuoco / Addetto Cucina">Cuoco / Addetto Cucina</option>
                    <option value="ASA">ASA (Ausiliario Socio-Assistenziale)</option>
                    <option value="Ausiliario">Ausiliario / Pulizie</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStaffMember.email || ""}
                    onChange={e => setEditingStaffMember({ ...editingStaffMember, email: e.target.value })}
                    className="w-full border p-2 rounded-xl"
                    placeholder="es. maria.rossi@villaserena.it"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Telefono</label>
                  <input
                    type="text"
                    value={editingStaffMember.telefono}
                    onChange={e => setEditingStaffMember({ ...editingStaffMember, telefono: e.target.value })}
                    className="w-full border p-2 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Colore Distintivo Badge</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingStaffMember.coloreBadge}
                      onChange={e => setEditingStaffMember({ ...editingStaffMember, coloreBadge: e.target.value })}
                      className="w-10 h-10 rounded-xl border cursor-pointer p-1"
                    />
                    <span className="font-mono text-slate-500">{editingStaffMember.coloreBadge}</span>
                  </div>
                </div>
              </div>

              {/* CUSTOM DEFAULT SHIFT HOURS FOR THIS OPERATOR */}
              <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Personalizza e Memorizza Orari della Scheda</span>
                </h4>
                <p className="text-[11px] text-indigo-800">
                  Imposta qui gli orari di lavoro personalizzati per questo operatore. Verranno memorizzati e proposti ogni volta che crei un suo turno!
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌅 Mattina</label>
                    <input
                      type="text"
                      placeholder="07:00 - 14:00"
                      value={editingStaffMember.orarioMattina || "07:00 - 14:00"}
                      onChange={e => setEditingStaffMember({ ...editingStaffMember, orarioMattina: e.target.value })}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌆 Pomeriggio</label>
                    <input
                      type="text"
                      placeholder="14:00 - 21:00"
                      value={editingStaffMember.orarioPomeriggio || "14:00 - 21:00"}
                      onChange={e => setEditingStaffMember({ ...editingStaffMember, orarioPomeriggio: e.target.value })}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌙 Notte</label>
                    <input
                      type="text"
                      placeholder="21:00 - 07:00"
                      value={editingStaffMember.orarioNotte || "21:00 - 07:00"}
                      onChange={e => setEditingStaffMember({ ...editingStaffMember, orarioNotte: e.target.value })}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingStaffMember;
                    setEditingStaffMember(null);
                    setConfirmDeleteStaff(target);
                  }}
                  className="px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina Dipendente</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStaffMember(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow"
                  >
                    Salva & Memorizza Scheda
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRAND NEW STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Aggiungi Nuovo Dipendente / Operatore</span>
              </h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffMember} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Maria"
                    value={newStaffNome}
                    onChange={e => setNewStaffNome(e.target.value)}
                    className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cognome *</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Rossi"
                    value={newStaffCognome}
                    onChange={e => setNewStaffCognome(e.target.value)}
                    className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Ruolo / Mansione *</label>
                  <select
                    value={newStaffRuolo}
                    onChange={e => setNewStaffRuolo(e.target.value)}
                    className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  >
                    <option value="OSS">OSS (Operatore Socio-Sanitario)</option>
                    <option value="Infermiera">Infermiera / Infermiere</option>
                    <option value="Educatore">Educatore / Animatore</option>
                    <option value="Fisioterapista">Fisioterapista</option>
                    <option value="ASA">ASA (Ausiliario Socio-Assistenziale)</option>
                    <option value="Ausiliario">Ausiliario / Cucina</option>
                    <option value="Coordinatore">Coordinatore Struttura</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Colore Badge Distintivo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStaffColoreBadge}
                      onChange={e => setNewStaffColoreBadge(e.target.value)}
                      className="w-10 h-10 rounded-xl border cursor-pointer p-1"
                    />
                    <span className="font-mono text-slate-500">{newStaffColoreBadge}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Telefono</label>
                  <input
                    type="text"
                    placeholder="es. 333 1234567"
                    value={newStaffTelefono}
                    onChange={e => setNewStaffTelefono(e.target.value)}
                    className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="es. maria.rossi@villaserena.it"
                    value={newStaffEmail}
                    onChange={e => setNewStaffEmail(e.target.value)}
                    className="w-full border p-2.5 rounded-xl font-medium bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* CUSTOM DEFAULT SHIFT HOURS FOR THIS OPERATOR */}
              <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 space-y-3">
                <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Orari Predefiniti Preferiti per il Dipendente</span>
                </h4>
                <p className="text-[11px] text-indigo-800">
                  Gli orari impostati qui verranno proposti in automatico quando assegnerai un turno a questo dipendente.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌅 Mattina</label>
                    <input
                      type="text"
                      placeholder="07:00 - 14:00"
                      value={newStaffOrarioMattina}
                      onChange={e => setNewStaffOrarioMattina(e.target.value)}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌆 Pomeriggio</label>
                    <input
                      type="text"
                      placeholder="14:00 - 21:00"
                      value={newStaffOrarioPomeriggio}
                      onChange={e => setNewStaffOrarioPomeriggio(e.target.value)}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 text-[10px] mb-1">🌙 Notte</label>
                    <input
                      type="text"
                      placeholder="21:00 - 07:00"
                      value={newStaffOrarioNotte}
                      onChange={e => setNewStaffOrarioNotte(e.target.value)}
                      className="w-full border p-2 rounded-xl bg-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Inserisci Dipendente nell'Organico</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE STAFF MEMBER */}
      {confirmDeleteStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <div className="p-2.5 bg-rose-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Conferma Rimozione Dipendente</h3>
                <p className="text-xs text-slate-500">Azione sull'organico della struttura</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Sei sicuro di voler rimuovere <strong>{confirmDeleteStaff.nome} {confirmDeleteStaff.cognome}</strong> ({confirmDeleteStaff.ruolo}) dall'organico?
            </p>
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              ⚡ L'organico si aggiornerà in tempo reale anche sul link pubblico per i dipendenti.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setConfirmDeleteStaff(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStaffMember(confirmDeleteStaff.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow cursor-pointer"
              >
                Sì, Rimuovi Operatore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHIFT DETAIL / EDIT / DELETE */}
      {selectedShiftForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>{isPublicView ? "Scheda Dettaglio Turno" : "Gestione & Modifica Turno"}</span>
              </h3>
              <button onClick={() => setSelectedShiftForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const mem = staff.find(s => s.id === selectedShiftForDetail.staffId);
              
              if (isPublicView) {
                return (
                  <div className="space-y-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-white text-xs shadow-xs shrink-0"
                          style={{ backgroundColor: mem?.coloreBadge || "#4f46e5" }}
                        >
                          {mem ? `${mem.nome[0]}${mem.cognome[0]}` : "OP"}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{mem ? `${mem.nome} ${mem.cognome}` : "Operatore"}</p>
                          <p className="text-slate-500 text-xs font-medium">{mem?.ruolo}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-xl font-black text-xs shadow-2xs ${getShiftBadgeStyle(selectedShiftForDetail.tipoTurno, selectedShiftForDetail.orarioInizio, selectedShiftForDetail.orarioFine)}`}>
                        {selectedShiftForDetail.tipoTurno}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-semibold">Data Turno:</span>
                        <span className="font-extrabold text-slate-900">
                          {new Date(selectedShiftForDetail.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-semibold">Orario Previsto:</span>
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200/80 text-xs shadow-2xs">
                          {selectedShiftForDetail.orarioInizio} — {selectedShiftForDetail.orarioFine}
                        </span>
                      </div>

                      {selectedShiftForDetail.note && (
                        <div className="pt-1">
                          <span className="text-slate-500 font-semibold block mb-1">Note e Mansioni:</span>
                          <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 italic">
                            {selectedShiftForDetail.note}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 flex justify-end border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSelectedShiftForDetail(null)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-all shadow-sm"
                      >
                        Chiudi Scheda
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4 text-xs">
                  
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{mem ? `${mem.nome} ${mem.cognome}` : "Operatore"}</p>
                      <p className="text-slate-500">{mem?.ruolo}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg font-bold ${getShiftBadgeStyle(selectedShiftForDetail.tipoTurno, selectedShiftForDetail.orarioInizio, selectedShiftForDetail.orarioFine)}`}>
                      {selectedShiftForDetail.tipoTurno}
                    </span>
                  </div>

                  <div className="space-y-3">
                    
                    {/* Change Staff Member */}
                    <div>
                      <label className="block font-semibold mb-1">Riassegna Operatore:</label>
                      <select
                        value={editShiftStaffId}
                        onChange={e => setEditShiftStaffId(e.target.value)}
                        className="w-full border p-2 rounded-xl bg-slate-50"
                      >
                        {staff.map(st => (
                          <option key={st.id} value={st.id}>{st.nome} {st.cognome} ({st.ruolo})</option>
                        ))}
                      </select>
                    </div>

                    {/* Change Shift Date */}
                    <div>
                      <label className="block font-semibold mb-1">Sposta in Data:</label>
                      <input
                        type="date"
                        value={editShiftDate}
                        onChange={e => setEditShiftDate(e.target.value)}
                        className="w-full border p-2 rounded-xl bg-slate-50"
                      />
                    </div>

                    {/* Change Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Ora Inizio:</label>
                        <input
                          type="text"
                          value={editShiftInizio}
                          onChange={e => setEditShiftInizio(e.target.value)}
                          className="w-full border p-2 rounded-xl font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Ora Fine:</label>
                        <input
                          type="text"
                          value={editShiftFine}
                          onChange={e => setEditShiftFine(e.target.value)}
                          className="w-full border p-2 rounded-xl font-mono text-center"
                        />
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 flex justify-between items-center border-t gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingleShift(selectedShiftForDetail.id, e)}
                      className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>Elimina Turno</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedShiftForDetail(null)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs"
                      >
                        Annulla
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleSaveShiftEdit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-md"
                      >
                        Salva Modifiche
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE DAY SHIFTS */}
      {confirmDeleteDayDate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 border-b pb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Cancella Turni del Giorno</h3>
                <p className="text-xs text-slate-500">Conferma Operazione</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Sei sicuro di voler <strong>cancellare TUTTI i turni</strong> del giorno{" "}
              <strong>{getFullWeekdayName(confirmDeleteDayDate)} {new Date(confirmDeleteDayDate.includes("T") ? confirmDeleteDayDate : `${confirmDeleteDayDate}T12:00:00`).getDate()} {getFullMonthName(confirmDeleteDayDate)} {new Date(confirmDeleteDayDate.includes("T") ? confirmDeleteDayDate : `${confirmDeleteDayDate}T12:00:00`).getFullYear()}</strong>?
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                onClick={() => setConfirmDeleteDayDate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Annulla
              </button>

              <button
                onClick={handleExecuteDeleteDayShifts}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Sì, Cancella Tutti i Turni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT & SHARE MODAL (Google Sheets, PDF, Live Link) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Esporta & Condividi Turni</h3>
                  <p className="text-xs text-slate-500">Link Dipendenti (Solo Turni), Google Sheets e PDF</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-4 text-xs">
              
              {/* Option 1: Dedicated Public Link for Employees (Shifts ONLY) */}
              <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-indigo-950 text-sm">
                    <ExternalLink className="w-5 h-5 text-indigo-600" />
                    <span>Link PUBBLICO Dipendenti (Solo Turni)</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-200 text-indigo-900 font-bold text-[10px] rounded-full uppercase tracking-wider">
                    Sicuro & Riservato
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Condividi questo link con il personale: permetterà di visualizzare <strong>ESCLUSIVAMENTE IL TABELLONE DEI TURNI</strong> in sola lettura.
                </p>
                
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-medium flex items-center gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <span>
                    <strong>Nota per l'accesso da Edge/Smartphone:</strong> Se aprendo il link ricevi <em>"403 Errore"</em>, assicurati di aver attivato la condivisione dal pulsante <strong>"Share"</strong> in alto a destra nella barra di Google AI Studio.
                  </span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={getPublicShareUrl()}
                    className="flex-1 bg-white border border-indigo-300 p-2.5 rounded-xl text-[11px] font-mono text-slate-800 truncate select-all"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyPublicShareLink}
                      className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                        copiedLink
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? "Copiato!" : "Copia Link"}</span>
                    </button>

                    {onTogglePublicView && (
                      <button
                        onClick={() => {
                          setShowExportModal(false);
                          onTogglePublicView();
                        }}
                        className="px-3 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap"
                        title="Simula e prova come i dipendenti vedono il calendario"
                      >
                        👁️ Prova Vista
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Option 2: Google Sheets Integration & CSV */}
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-emerald-950 text-sm">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Esporta & Sincronizza su Google Sheets</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-full">
                    Excel / Sheets
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Scarica il file `.CSV` pronto da aprire su Google Foglio, oppure copia lo script automatico per sincronizzare la tabella turni direttamente dentro Google Sheets!
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportCSV}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Scarica File CSV per Foglio</span>
                  </button>

                  <button
                    onClick={handleCopyGoogleAppsScript}
                    className="py-2.5 px-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copia Script Google Sheets</span>
                  </button>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-emerald-200/80">
                  <span className="text-[10px] text-emerald-800 font-semibold">Vuoi creare subito un nuovo foglio su Google Drive?</span>
                  <button
                    onClick={() => window.open('https://sheets.new', '_blank')}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Apri Google Sheets (sheets.new)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Option 3: PDF / Print */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                    <Printer className="w-5 h-5 text-slate-700" />
                    <span>Stampa / Salva Tabellone in PDF</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold text-[10px] rounded-full">
                    Formato A4
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Apre la schermata di stampa integrata. Seleziona <strong>"Salva come PDF"</strong> nelle opzioni della stampante per generare il PDF da inviare o affiggere.
                </p>
                <button
                  onClick={handlePrintPDF}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Stampa o Genera PDF Tabellone</span>
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end border-t">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Chiudi Schermata
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: VACATION / FERIE REQUEST FOR EMPLOYEES */}
      {showVacationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-amber-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-md">
                  <Palmtree className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Richiesta & Inserimento Ferie Dipendente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleziona il tuo nome e le date per registrare le ferie nel tabellone
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowVacationModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVacationSubmit} className="space-y-4 text-xs">
              
              {/* Select Staff Member */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Operatore / Dipendente *
                </label>
                <select
                  value={vacationStaffId}
                  onChange={e => {
                    if (currentUser?.role === 'staff') return;
                    setVacationStaffId(e.target.value);
                  }}
                  disabled={currentUser?.role === 'staff'}
                  className="w-full border border-slate-300 p-3 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 disabled:opacity-80 disabled:cursor-not-allowed"
                  required
                >
                  {currentUser?.role === 'staff' ? (
                    staff.filter(s => s.nome.toLowerCase() === currentUser.username.toLowerCase()).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome} {s.cognome} ({s.ruolo}) — Il tuo account
                      </option>
                    ))
                  ) : (
                    staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nome} {s.cognome} ({s.ruolo})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Start & End Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">
                    Data Inizio Ferie *
                  </label>
                  <input
                    type="date"
                    required
                    value={vacationStartDate}
                    onChange={e => setVacationStartDate(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">
                    Data Fine Ferie (Inclusa) *
                  </label>
                  <input
                    type="date"
                    required
                    value={vacationEndDate}
                    onChange={e => setVacationEndDate(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5">
                  Note / Motivo Richiesta (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Ferie estive, permesso studio, ecc..."
                  value={vacationNotes}
                  onChange={e => setVacationNotes(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-2xl font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-xs text-slate-900"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2.5">
                <span className="text-base shrink-0">ℹ️</span>
                <span>
                  L'inserimento assegnerà il tipo turno <strong>"Ferie"</strong> per ogni giorno del periodo selezionato, aggiornando istantaneamente il calendario in tempo reale.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowVacationModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Palmtree className="w-4 h-4" />
                  <span>Conferma & Salva Ferie</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
