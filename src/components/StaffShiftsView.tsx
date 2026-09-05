import React, { useState, useEffect, useRef } from "react";
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
  Moon, 
  Coffee,
  Utensils,
  PhoneCall,
  Calendar,
  Calendar as CalendarIcon,
  Building2,
  HelpCircle,
  Copy,
  CopyCheck,
  Move,
  GripVertical,
  Layers,
  Edit3,
  Undo2,
  Redo2,
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
  Archive,
  Palmtree,
  Lock,
  Unlock,
  Save,
  AlertTriangle,
  AlertCircle,
  PanelLeft,
  PanelLeftClose
} from "lucide-react";
import { StaffMember, Shift, UserCredential } from "../types";
import { StaffProfileModal } from "./StaffProfileModal";
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

export const formatItalianDateString = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

export const formatItalianVerbalDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
  return `${getFullWeekdayName(date)}, ${date.getDate()} ${getFullMonthName(date)} ${date.getFullYear()}`;
};

// Helper to calculate Easter date (Pasqua) for a given year using Meeus/Gauss algorithm
export function getEasterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed month
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

// Italian National Holidays & Sunday check (Festivi)
export function isItalianFestivo(d: Date | string): { isFestivo: boolean; label?: string } {
  if (!d) return { isFestivo: false };
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T12:00:00`) : d;
  if (isNaN(date.getTime())) return { isFestivo: false };

  const dayOfWeek = date.getDay(); // 0 = Sunday
  const month = date.getMonth(); // 0 - 11
  const dayOfMonth = date.getDate();
  const year = date.getFullYear();

  // Fixed Italian Holidays
  if (month === 0 && dayOfMonth === 1) return { isFestivo: true, label: "Capodanno" };
  if (month === 0 && dayOfMonth === 6) return { isFestivo: true, label: "Epifania" };
  if (month === 3 && dayOfMonth === 25) return { isFestivo: true, label: "Liberazione" };
  if (month === 4 && dayOfMonth === 1) return { isFestivo: true, label: "Festa del Lavoro" };
  if (month === 5 && dayOfMonth === 2) return { isFestivo: true, label: "Festa della Repubblica" };
  if (month === 7 && dayOfMonth === 15) return { isFestivo: true, label: "Ferragosto" };
  if (month === 10 && dayOfMonth === 1) return { isFestivo: true, label: "Ognissanti" };
  if (month === 11 && dayOfMonth === 8) return { isFestivo: true, label: "Immacolata" };
  if (month === 11 && dayOfMonth === 25) return { isFestivo: true, label: "Natale" };
  if (month === 11 && dayOfMonth === 26) return { isFestivo: true, label: "Santo Stefano" };

  // Easter & Easter Monday
  const easter = getEasterDate(year);
  if (month === easter.month && dayOfMonth === easter.day) {
    return { isFestivo: true, label: "Pasqua" };
  }
  const pasquettaDate = new Date(year, easter.month, easter.day + 1);
  if (month === pasquettaDate.getMonth() && dayOfMonth === pasquettaDate.getDate()) {
    return { isFestivo: true, label: "Pasquetta" };
  }

  // Sunday (Domenica)
  if (dayOfWeek === 0) {
    return { isFestivo: true, label: "Domenica" };
  }

  return { isFestivo: false };
}

// Saturday / Prefestivo check
export function isItalianPrefestivo(d: Date | string): { isPrefestivo: boolean; label?: string } {
  if (!d) return { isPrefestivo: false };
  const date = typeof d === "string" ? new Date(d.includes("T") ? d : `${d}T12:00:00`) : d;
  if (isNaN(date.getTime())) return { isPrefestivo: false };

  const dayOfWeek = date.getDay(); // 6 = Saturday

  if (dayOfWeek === 6) {
    return { isPrefestivo: true, label: "Sabato" };
  }

  // Vigilia (day before a fixed national holiday or Easter)
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFestivo = isItalianFestivo(tomorrow);
  if (tomorrowFestivo.isFestivo && tomorrowFestivo.label !== "Domenica") {
    return { isPrefestivo: true, label: `Vigilia (${tomorrowFestivo.label})` };
  }

  return { isPrefestivo: false };
}

export interface CustomShiftPreset {
  id: string;
  label: string;
  tipoTurno: string;
  orarioInizio: string;
  orarioFine: string;
  subtitle?: string;
  isDefault?: boolean;
  struttura?: string;
}

export const GenovaLandscapeIcon = ({ isMorning }: { isMorning: boolean }) => (
  <svg viewBox="0 0 32 24" className="w-6 h-6 overflow-visible" aria-label={isMorning ? "Mattina" : "Pomeriggio"}>
    {/* Sun */}
    <circle
      cx={isMorning ? 7 : 25}
      cy={isMorning ? 11 : 9}
      r="4.5"
      fill={isMorning ? "#f59e0b" : "#ea580c"}
      className={isMorning ? "animate-spin-slow" : ""}
    />
    {/* Sea (Left) */}
    <path
      d="M 0 14 Q 4 12 8 14 T 16 14 L 16 24 L 0 24 Z"
      fill="#0ea5e9"
      opacity="0.9"
    />
    <path
      d="M 0 18 Q 4 16 8 18 T 16 18 L 16 24 L 0 24 Z"
      fill="#0284c7"
    />
    {/* Mountains (Right) */}
    <path
      d="M 12 24 L 18 10 L 23 16 L 28 8 L 32 13 L 32 24 Z"
      fill="#64748b"
    />
    <path
      d="M 15 24 L 21 15 L 25 19 L 29 14 L 32 17 L 32 24 Z"
      fill="#475569"
    />
  </svg>
);

export const INITIAL_SHIFT_PRESETS: CustomShiftPreset[] = [
  // VANNUCCI 1
  {
    id: "preset-v1-7-15",
    label: "🌅 07:00-15:00",
    tipoTurno: "Mattina",
    orarioInizio: "07:00",
    orarioFine: "15:00",
    struttura: "Vannucci 1",
    isDefault: true
  },
  {
    id: "preset-pulizie-7-11",
    label: "🪣🧹 07:00-11:00 (Pulizie)",
    tipoTurno: "Pulizie",
    orarioInizio: "07:00",
    orarioFine: "11:00",
    subtitle: "Pulizie / Aiuto Alzate V1",
    isDefault: true
  },
  {
    id: "preset-v1-15-23",
    label: "🌆 15:00-23:00",
    tipoTurno: "Pomeriggio",
    orarioInizio: "15:00",
    orarioFine: "23:00",
    struttura: "Vannucci 1",
    isDefault: true
  },
  {
    id: "preset-v1-23-07",
    label: "🌙 23:00-07:00 (Notte)",
    tipoTurno: "Notte",
    orarioInizio: "23:00",
    orarioFine: "07:00",
    struttura: "Vannucci 1",
    isDefault: true
  },
  
  // VANNUCCI 2
  {
    id: "preset-v2-7-14",
    label: "🌅 07:00-14:00",
    tipoTurno: "Mattina",
    orarioInizio: "07:00",
    orarioFine: "14:00",
    struttura: "Vannucci 2",
    subtitle: "07:00 - 14:00 (Aiuto Alzate V1)",
    isDefault: true
  },
  {
    id: "preset-v2-8-14",
    label: "🌅 08:00-14:00",
    tipoTurno: "Mattina",
    orarioInizio: "08:00",
    orarioFine: "14:00",
    struttura: "Vannucci 2",
    isDefault: true
  },
  {
    id: "preset-v2-8-15",
    label: "🌅 08:00-15:00",
    tipoTurno: "Mattina",
    orarioInizio: "08:00",
    orarioFine: "15:00",
    struttura: "Vannucci 2",
    isDefault: true
  },
  {
    id: "preset-v2-14-21",
    label: "🌆 14:00-21:00",
    tipoTurno: "Pomeriggio",
    orarioInizio: "14:00",
    orarioFine: "21:00",
    struttura: "Vannucci 2",
    isDefault: true
  },
  {
    id: "preset-v2-15-21",
    label: "🌆 15:00-21:00",
    tipoTurno: "Pomeriggio",
    orarioInizio: "15:00",
    orarioFine: "21:00",
    struttura: "Vannucci 2",
    isDefault: true
  },
  
  {
    id: "preset-cucina-1030-1530",
    label: "🍲 10:30-15:30 (Cucina)",
    tipoTurno: "Cucina",
    orarioInizio: "10:30",
    orarioFine: "15:30",
    isDefault: true
  },
  // VANNUCCI 4
  {
    id: "preset-v4-8-15",
    label: "🌅 08:00-15:00",
    tipoTurno: "Mattina",
    orarioInizio: "08:00",
    orarioFine: "15:00",
    struttura: "Vannucci 4",
    isDefault: true
  },
  {
    id: "preset-v4-15-20",
    label: "🌆 15:00-20:00",
    tipoTurno: "Pomeriggio",
    orarioInizio: "15:00",
    orarioFine: "20:00",
    struttura: "Vannucci 4",
    isDefault: true
  }
];

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
  const [viewMode, setViewMode] = useState<"week" | "month" | "roster">("week");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(true);
  const [turniSidebarCollapsed, setTurniSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("turni_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleTurniSidebar = () => {
    setTurniSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("turni_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [dragActionMode, setDragActionMode] = useState<"move" | "copy">("move");
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  // Match current user with staff member list if role is staff or in public mode
  const loggedInStaffMember = React.useMemo(() => {
    if (!currentUser) return null;
    const uName = currentUser.username.trim().toLowerCase();
    return staff.find(s => 
      s.id.toLowerCase() === uName ||
      s.nome.toLowerCase() === uName ||
      s.cognome.toLowerCase() === uName ||
      `${s.nome} ${s.cognome}`.toLowerCase() === uName ||
      uName.includes(s.nome.toLowerCase()) ||
      s.nome.toLowerCase().includes(uName)
    ) || null;
  }, [staff, currentUser]);

  const isStaffRole = currentUser?.role === "staff" || isPublicView;

  const [selectedStaffFilterId, setSelectedStaffFilterId] = useState<string>(() => {
    if (isStaffRole && loggedInStaffMember) {
      return loggedInStaffMember.id;
    }
    return "ALL";
  });

  // -------------------------------------------------------------------------
  // HELPERS & DATE LOGIC (Moved up for availability in early memos)
  // -------------------------------------------------------------------------
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const formatDateYMD = React.useCallback((d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const startOfWeek = getStartOfWeek(currentDate);

  const weekDays = React.useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + (i - 1));
      return d;
    });
  }, [startOfWeek]);

  const todayStr = formatDateYMD(new Date());

  // Keep selectedStaffFilterId in sync when loggedInStaffMember resolves
  React.useEffect(() => {
    if (isStaffRole && loggedInStaffMember) {
      setSelectedStaffFilterId(loggedInStaffMember.id);
    }
  }, [isStaffRole, loggedInStaffMember]);

  // Global weekly filters (Multi-structure and independent time slot support)
  const [activeStrutturaFilters, setActiveStrutturaFilters] = useState<('v1' | 'v2' | 'v4')[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState<'alzate' | 'notte' | 'mattino' | 'pomeriggio' | null>(null);

  // Compute displayedStaff (strictly filtered to personal staff member when staff role or filter active, excluding archived)
  const displayedStaff = React.useMemo(() => {
    let baseList = staff.filter(s => s.attivo !== false || (loggedInStaffMember && s.id === loggedInStaffMember.id));
    if (isStaffRole) {
      if (loggedInStaffMember) {
        baseList = staff.filter(s => s.id === loggedInStaffMember.id);
      } else if (selectedStaffFilterId !== "ALL") {
        baseList = staff.filter(s => s.id === selectedStaffFilterId);
      } else {
        baseList = staff.length > 0 ? [staff[0]] : staff;
      }
    } else if (selectedStaffFilterId !== "ALL") {
      baseList = staff.filter(s => s.id === selectedStaffFilterId);
    }

    // Apply interactive global week filters (Location + Time)
    if (activeStrutturaFilters.length > 0 || activeTimeFilter) {
      const weekDates = weekDays.map(d => formatDateYMD(d));
      const weekShifts = shifts.filter(s => weekDates.includes(s.data));
      
      // Staff with at least one matching shift in the week for ACTIVE filters
      const matchingStaffIds = new Set(weekShifts.filter(s => {
        let matchesStruttura = true;
        let matchesTime = true;
        const isNightShift = s.tipoTurno === "Notte" || s.orarioInizio === "23:00";

        if (activeStrutturaFilters.length > 0) {
          const targetStructures = activeStrutturaFilters.map(f => 
            f === "v1" ? "Vannucci 1" : f === "v2" ? "Vannucci 2" : "Vannucci 4"
          );
          if (activeTimeFilter === "notte" && isNightShift) {
            matchesStruttura = true;
          } else {
            matchesStruttura = targetStructures.includes(s.struttura || "");
          }
        }

        if (activeTimeFilter) {
          const type = activeTimeFilter;
          if (type === "alzate") matchesTime = s.orarioInizio === "07:00";
          else if (type === "notte") {
            matchesTime = isNightShift;
            if (activeStrutturaFilters.length === 0) {
              matchesStruttura = true;
            }
          }
          else if (type === "mattino") {
            const hour = parseInt(s.orarioInizio?.split(":")[0] || "99");
            matchesTime = hour >= 5 && hour < 12;
          }
          else if (type === "pomeriggio") {
            const hour = parseInt(s.orarioInizio?.split(":")[0] || "99");
            matchesTime = hour >= 12 && hour < 22;
          }
        }

        return matchesStruttura && matchesTime;
      }).map(s => s.staffId));

      // Staff that are "free" (have at least one day without any shift in the week)
      const freeStaffIds = new Set(baseList.filter(m => {
        const memberShiftsInWeek = weekShifts.filter(s => s.staffId === m.id);
        return memberShiftsInWeek.length < weekDates.length;
      }).map(m => m.id));

      return baseList.filter(m => matchingStaffIds.has(m.id) || freeStaffIds.has(m.id));
    }

    return baseList;
  }, [staff, isStaffRole, loggedInStaffMember, selectedStaffFilterId, activeStrutturaFilters, activeTimeFilter, shifts, weekDays]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [selectedShiftForDetail, setSelectedShiftForDetail] = useState<Shift | null>(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<StaffMember | null>(null);
  const [confirmDeleteDayDate, setConfirmDeleteDayDate] = useState<string | null>(null);

  // New Staff Member Form State
  const [newStaffNome, setNewStaffNome] = useState<string>("");
  const [newStaffCognome, setNewStaffCognome] = useState<string>("");
  const [newStaffRuolo, setNewStaffRuolo] = useState<string>("OSS");
  const [newStaffTelefono, setNewStaffTelefono] = useState<string>("");
  const [newStaffEmail, setNewStaffEmail] = useState<string>("");
  const [newStaffTipoContratto, setNewStaffTipoContratto] = useState<string>("");
  const [newStaffColoreBadge, setNewStaffColoreBadge] = useState<string>("#4f46e5");
  const [newStaffOrarioMattina, setNewStaffOrarioMattina] = useState<string>("07:00 - 14:00");
  const [newStaffOrarioPomeriggio, setNewStaffOrarioPomeriggio] = useState<string>("14:00 - 21:00");
  const [newStaffOrarioNotte, setNewStaffOrarioNotte] = useState<string>("21:00 - 07:00");

  // Undo State & Full Action History Stack (Annulla / Ripristina)
  const [lastDeletedShifts, setLastDeletedShifts] = useState<Shift[] | null>(null);
  const [historyStack, setHistoryStack] = useState<Shift[][]>(() => [shifts]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Sync initial history stack when shifts prop loads or updates initially
  useEffect(() => {
    if (historyStack.length <= 1) {
      setHistoryStack([shifts]);
      setHistoryIndex(0);
    }
  }, [shifts]);

  const applyShiftsUpdate = (newShifts: Shift[]) => {
    if (!onUpdateShifts) return;
    setHistoryStack(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newShifts];
    });
    setHistoryIndex(prev => prev + 1);
    onUpdateShifts(newShifts);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      const targetShifts = historyStack[targetIndex];
      if (onUpdateShifts && targetShifts) {
        onUpdateShifts(targetShifts);
        showToast("↩️ Azione Annullata (Undo)");
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      const targetShifts = historyStack[targetIndex];
      if (onUpdateShifts && targetShifts) {
        onUpdateShifts(targetShifts);
        showToast("↪️ Azione Ripristinata (Redo)");
      }
    }
  };

  // Keyboard Shortcuts (Ctrl+Z for Undo, Ctrl+Y or Ctrl+Shift+Z for Redo)
  React.useEffect(() => {
    if (isPublicView) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, historyStack, isPublicView]);

  // Locked Days State
  const [lockedDays, setLockedDays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("lockedDays");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleLockDay = (dateStr: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setLockedDays(prev => {
      const isCurrentlyLocked = prev.includes(dateStr);
      const next = isCurrentlyLocked
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr];
      localStorage.setItem("lockedDays", JSON.stringify(next));
      showToast(
        isCurrentlyLocked 
          ? `🔓 Giorno sbloccato con successo!` 
          : `🔒 Giorno completato e bloccato contro modifiche accidentali!`
      );
      return next;
    });
  };

  // Real-time helper: monthly stats for shift & hour count in current month
  const getMemberMonthlyStats = (memberId: string) => {
    const currentMonth = currentDate.getMonth(); // 0-11
    const currentYear = currentDate.getFullYear();
    
    // Filter shifts of this member that fall into the current month
    const memberShifts = shifts.filter(s => {
      if (s.staffId !== memberId) return false;
      const parts = s.data.split("-");
      if (parts.length !== 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed month
      return y === currentYear && m === currentMonth;
    });

    let shiftCount = 0;
    let totalHours = 0;
    let festiviCount = 0;
    let prefestiviCount = 0;

    memberShifts.forEach(s => {
      if (s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
        return;
      }
      
      shiftCount++;
      
      const dateObj = new Date(s.data);
      if (isItalianFestivo(dateObj).isFestivo) {
        festiviCount++;
      } else if (isItalianPrefestivo(dateObj).isPrefestivo) {
        prefestiviCount++;
      }

      // Calculate hours between orarioInizio and orarioFine
      const startParts = s.orarioInizio.split(":");
      const endParts = s.orarioFine.split(":");
      if (startParts.length === 2 && endParts.length === 2) {
        const sh = parseInt(startParts[0], 10);
        const sm = parseInt(startParts[1], 10);
        const eh = parseInt(endParts[0], 10);
        const em = parseInt(endParts[1], 10);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        let diffMinutes = endMinutes - startMinutes;
        if (diffMinutes < 0) {
          // Night shift crossing midnight (e.g. 21:00 to 07:00)
          diffMinutes += 24 * 60;
        }
        
        totalHours += diffMinutes / 60;
      }
    });

    return { shiftCount, totalHours: Math.round(totalHours * 10) / 10, festiviCount, prefestiviCount };
  };

  // Real-time helper: weekly stats for shift & hour count in current displayed week
  const getMemberWeeklyStats = (memberId: string) => {
    const weekDayStrings = weekDays.map(d => formatDateYMD(d));
    
    // Filter shifts of this member that fall into the current week
    const memberShifts = shifts.filter(s => s.staffId === memberId && weekDayStrings.includes(s.data));

    let shiftCount = 0;
    let totalHours = 0;

    memberShifts.forEach(s => {
      if (s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
        return;
      }
      
      shiftCount++;

      // Calculate hours between orarioInizio and orarioFine
      const startParts = s.orarioInizio.split(":");
      const endParts = s.orarioFine.split(":");
      if (startParts.length === 2 && endParts.length === 2) {
        const sh = parseInt(startParts[0], 10);
        const sm = parseInt(startParts[1], 10);
        const eh = parseInt(endParts[0], 10);
        const em = parseInt(endParts[1], 10);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        let diffMinutes = endMinutes - startMinutes;
        if (diffMinutes < 0) {
          // Night shift crossing midnight (e.g. 21:00 to 07:00)
          diffMinutes += 24 * 60;
        }
        
        totalHours += diffMinutes / 60;
      }
    });

    return { shiftCount, totalHours: Math.round(totalHours * 10) / 10 };
  };

  // Real-time helper: check if member has at least one rest day in the current week (weekDays)
  const hasRestDayInCurrentWeek = (memberId: string) => {
    return weekDays.some(day => {
      const dayStr = formatDateYMD(day);
      return shifts.some(s => s.staffId === memberId && s.data === dayStr && s.tipoTurno === "Riposo");
    });
  };

  // Helper to check if a day is complete: Mattina + Pomeriggio for each structure + at least 1 Notte + Cucina + Alzate ore 07:00 (almeno 2 turni che partono alle 07:00)
  const getMissingShiftsForDay = (dateStr: string): string[] => {
    const dayShifts = shifts.filter(s => s.data === dateStr && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");
    const missing: string[] = [];

    // 1. Vannucci 1 (Mattina & Pomeriggio)
    const hasMattina1 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasPomeriggio1 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    if (!hasMattina1) missing.push("Vannucci 1: Mattina (07:00 / 08:00)");
    if (!hasPomeriggio1) missing.push("Vannucci 1: Pomeriggio (14:00 / 15:00)");

    // 2. Vannucci 2 (Mattina & Pomeriggio)
    const hasMattina2 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    const hasPomeriggio2 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    if (!hasMattina2) missing.push("Vannucci 2: Mattina (07:00 / 08:00)");
    if (!hasPomeriggio2) missing.push("Vannucci 2: Pomeriggio (14:00 / 15:00)");

    // 3. Vannucci 4 (Mattina & Pomeriggio)
    const hasMattina4 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    const hasPomeriggio4 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    if (!hasMattina4) missing.push("Vannucci 4: Mattina (08:00 - 15:00)");
    if (!hasPomeriggio4) missing.push("Vannucci 4: Pomeriggio (15:00 - 22:00)");

    // 4. Notte (Generale - turno che parte alle 23:00)
    const hasNotte = dayShifts.some(s => s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00")));
    if (!hasNotte) missing.push("Turno di Notte (23:00 - 24:00)");

    // 5. Cucina (Generale - Obbligatoria per completare la giornata)
    const hasCucina = dayShifts.some(s => s.tipoTurno === "Cucina");
    if (!hasCucina) missing.push("Servizio Cucina (10:30 - 15:30)");

    // 6. Alzate (Almeno 2 turni che partono alle 07:00 tra V1, V2 e Pulizie 07:00-11:00)
    const shiftsAt7 = dayShifts.filter(s => 
      s.orarioInizio === "07:00" || 
      s.tipoTurno === "Pulizie" ||
      (s.note && s.note.toLowerCase().includes("alzat"))
    );
    if (shiftsAt7.length < 2) {
      if (shiftsAt7.length === 0) {
        missing.push("Alzate ore 07:00: Mancano 2 turni alle 07:00 (V1, V2 o Pulizie 🪣)");
      } else {
        missing.push("Alzate ore 07:00: Manca 2° turno alle 07:00 (V1, V2 o Pulizie 🪣)");
      }
    }

    return missing;
  };

  const isDayComplete = (dateStr: string): boolean => {
    return getMissingShiftsForDay(dateStr).length === 0;
  };

  // Structured breakdown for Day Hover Tooltip/Window
  const getDayCoverageDetails = (dateStr: string) => {
    const dayShifts = shifts.filter(s => s.data === dateStr && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");

    const findAssigned = (tipo: string, struct?: string) => {
      return dayShifts
        .filter(s => {
          if (s.tipoTurno !== tipo) return false;
          if (struct) {
            if (struct === "Vannucci 1") return s.struttura === "Vannucci 1" || s.struttura === "Struttura 1";
            if (struct === "Vannucci 2") return s.struttura === "Vannucci 2" || s.struttura === "Struttura 2";
            if (struct === "Vannucci 4") return s.struttura === "Vannucci 4" || s.struttura === "Struttura 4";
            return s.struttura === struct;
          }
          return true;
        })
        .map(s => {
          const st = staff.find(m => m.id === s.staffId);
          return {
            id: s.staffId,
            nome: st ? st.nome : "Operatore",
            cognome: st ? st.cognome : "",
            orarioInizio: s.orarioInizio,
            orarioFine: s.orarioFine,
            note: s.note
          };
        });
    };

    // Shifts starting at 07:00 for Alzate
    const shiftsAt7 = dayShifts.filter(s => 
      s.orarioInizio === "07:00" || 
      s.tipoTurno === "Pulizie" ||
      (s.note && s.note.toLowerCase().includes("alzat"))
    );
    const isAlzateCovered = shiftsAt7.length >= 2;
    const alzateAssigned = shiftsAt7.map(s => {
      const st = staff.find(m => m.id === s.staffId);
      const loc = s.struttura || (s.tipoTurno === "Pulizie" ? "Pulizie" : s.tipoTurno);
      return {
        id: s.staffId,
        nome: st ? st.nome : "Operatore",
        cognome: st ? st.cognome : "",
        orarioInizio: s.orarioInizio,
        orarioFine: s.orarioFine,
        struttura: loc
      };
    });

    const mandatorySlots = [
      {
        id: "v1_m",
        label: "Vannucci 1 — Mattina",
        struttura: "Vannucci 1",
        tipoTurno: "Mattina",
        orarioStandard: "07:00 / 08:00",
        icon: "🌅",
        isCovered: findAssigned("Mattina", "Vannucci 1").length > 0,
        assignedStaff: findAssigned("Mattina", "Vannucci 1")
      },
      {
        id: "v1_p",
        label: "Vannucci 1 — Pomeriggio",
        struttura: "Vannucci 1",
        tipoTurno: "Pomeriggio",
        orarioStandard: "14:00 / 15:00",
        icon: "🌆",
        isCovered: findAssigned("Pomeriggio", "Vannucci 1").length > 0,
        assignedStaff: findAssigned("Pomeriggio", "Vannucci 1")
      },
      {
        id: "v2_m",
        label: "Vannucci 2 — Mattina",
        struttura: "Vannucci 2",
        tipoTurno: "Mattina",
        orarioStandard: "07:00 / 08:00",
        icon: "🌅",
        isCovered: findAssigned("Mattina", "Vannucci 2").length > 0,
        assignedStaff: findAssigned("Mattina", "Vannucci 2")
      },
      {
        id: "v2_p",
        label: "Vannucci 2 — Pomeriggio",
        struttura: "Vannucci 2",
        tipoTurno: "Pomeriggio",
        orarioStandard: "14:00 / 15:00",
        icon: "🌆",
        isCovered: findAssigned("Pomeriggio", "Vannucci 2").length > 0,
        assignedStaff: findAssigned("Pomeriggio", "Vannucci 2")
      },
      {
        id: "v4_m",
        label: "Vannucci 4 — Mattina",
        struttura: "Vannucci 4",
        tipoTurno: "Mattina",
        orarioStandard: "08:00 - 15:00",
        icon: "🌅",
        isCovered: findAssigned("Mattina", "Vannucci 4").length > 0,
        assignedStaff: findAssigned("Mattina", "Vannucci 4")
      },
      {
        id: "v4_p",
        label: "Vannucci 4 — Pomeriggio",
        struttura: "Vannucci 4",
        tipoTurno: "Pomeriggio",
        orarioStandard: "15:00 - 22:00",
        icon: "🌆",
        isCovered: findAssigned("Pomeriggio", "Vannucci 4").length > 0,
        assignedStaff: findAssigned("Pomeriggio", "Vannucci 4")
      },
      {
        id: "notte",
        label: "Turno di Notte (23:00)",
        struttura: "Casa Famiglia",
        tipoTurno: "Notte",
        orarioStandard: "23:00 - 24:00",
        icon: "🌙",
        isCovered: dayShifts.some(s => s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00"))),
        assignedStaff: dayShifts.filter(s => s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00"))).map(s => {
          const st = staff.find(m => m.id === s.staffId);
          return {
            id: s.staffId,
            nome: st ? st.nome : "Operatore",
            cognome: st ? st.cognome : "",
            orarioInizio: s.orarioInizio,
            orarioFine: s.orarioFine,
            note: s.note
          };
        })
      },
      {
        id: "cucina",
        label: "Servizio Cucina",
        struttura: "Mensa / Cucina",
        tipoTurno: "Cucina",
        orarioStandard: "10:30 - 15:30",
        icon: "🍲",
        isCovered: findAssigned("Cucina").length > 0,
        assignedStaff: findAssigned("Cucina")
      },
      {
        id: "alzate",
        label: "Alzate (ore 07:00)",
        struttura: "Supporto Alzate",
        tipoTurno: "Alzate",
        orarioStandard: "Almeno 2 turni dalle 07:00",
        icon: "⏰",
        isCovered: isAlzateCovered,
        assignedStaff: alzateAssigned,
        requirementNote: shiftsAt7.length === 0 
          ? "Mancano 2 operatori alle 07:00 (V1, V2 o Pulizie 🪣)" 
          : shiftsAt7.length === 1 
          ? `Presente solo 1 op. (${alzateAssigned[0].nome}) - Manca 2° turno alle 07:00`
          : "Almeno 2 turni attivi alle 07:00"
      }
    ];

    const extraSlots = [
      {
        id: "pulizie",
        label: "Servizio Pulizie",
        struttura: "Pulizie & Supporto Alzate V1",
        tipoTurno: "Pulizie",
        orarioStandard: "07:00 - 11:00",
        icon: "🪣🧹",
        isCovered: findAssigned("Pulizie").length > 0,
        assignedStaff: findAssigned("Pulizie"),
        note: "Turno extra: concorre anche alle alzate ore 07:00."
      }
    ];

    const smontoShifts = dayShifts.filter(s => s.tipoTurno === "Notte" && s.orarioInizio === "00:00");
    if (smontoShifts.length > 0) {
      extraSlots.push({
        id: "smonto_notte",
        label: "Smonto Notte (00:00 - 07:00)",
        struttura: "Casa Famiglia",
        tipoTurno: "Notte",
        orarioStandard: "00:00 - 07:00",
        icon: "🌙🌅",
        isCovered: true,
        assignedStaff: smontoShifts.map(s => {
          const st = staff.find(m => m.id === s.staffId);
          return {
            id: s.staffId,
            nome: st ? st.nome : "Operatore",
            cognome: st ? st.cognome : "",
            orarioInizio: s.orarioInizio,
            orarioFine: s.orarioFine,
            note: s.note
          };
        }),
        note: "Smonto notte (grafica a metà). Permette l'inserimento di una nuova notte (23:00) per questo giorno."
      });
    }

    const missingMandatory = mandatorySlots.filter(s => !s.isCovered);
    const coveredMandatory = mandatorySlots.filter(s => s.isCovered);
    const isComplete = missingMandatory.length === 0;

    const ferieStaff = shifts.filter(s => s.data === dateStr && s.tipoTurno === "Ferie").map(s => {
      const st = staff.find(m => m.id === s.staffId);
      return st ? `${st.nome} ${st.cognome}` : "Operatore";
    });

    const riposoStaff = shifts.filter(s => s.data === dateStr && s.tipoTurno === "Riposo").map(s => {
      const st = staff.find(m => m.id === s.staffId);
      return st ? `${st.nome} ${st.cognome}` : "Operatore";
    });

    return {
      dateStr,
      isComplete,
      missingMandatory,
      coveredMandatory,
      mandatorySlots,
      extraSlots,
      ferieStaff,
      riposoStaff,
      shiftsAt7Count: shiftsAt7.length,
      totalRequired: mandatorySlots.length,
      totalCovered: coveredMandatory.length
    };
  };

  // Hovered Day Coverage State for automatic tooltip/popover
  const [hoveredDayCoverageDate, setHoveredDayCoverageDate] = useState<string | null>(null);
  const [hoveredDayCoveragePos, setHoveredDayCoveragePos] = useState<{ x: number; y: number } | null>(null);

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
  const coverageHoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New Shift Form State
  const [newStaffId, setNewStaffId] = useState<string>(staff[0]?.id || "");
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newTipoTurno, setNewTipoTurno] = useState<string>("Mattina");
  const [newOrarioInizio, setNewOrarioInizio] = useState<string>("07:00");
  const [newOrarioFine, setNewOrarioFine] = useState<string>("14:00");
  const [newNote, setNewNote] = useState<string>("");
  const [newStruttura, setNewStruttura] = useState<string>("Vannucci 1");

  // Custom Shift Presets State & Storage Management
  const [savedPresets, setSavedPresets] = useState<CustomShiftPreset[]>(() => {
    try {
      const saved = localStorage.getItem("casafamiglia_saved_shift_presets_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SHIFT_PRESETS;
  });

  const [showAddPresetForm, setShowAddPresetForm] = useState<boolean>(false);
  const [customPresetName, setCustomPresetName] = useState<string>("");
  const [customPresetInizio, setCustomPresetInizio] = useState<string>("10:30");
  const [customPresetFine, setCustomPresetFine] = useState<string>("15:30");
  const [customPresetTipo, setCustomPresetTipo] = useState<string>("Cucina");

  const savePresetsToStorage = (presets: CustomShiftPreset[]) => {
    setSavedPresets(presets);
    try {
      localStorage.setItem("casafamiglia_saved_shift_presets_v2", JSON.stringify(presets));
    } catch (e) {
      console.error("Error saving shift presets", e);
    }
  };

  const handleAddNewPreset = (
    e?: React.FormEvent, 
    overrideInizio?: string, 
    overrideFine?: string, 
    overrideTipo?: string
  ) => {
    if (e) e.preventDefault();
    
    const finalInizio = overrideInizio || customPresetInizio || "09:00";
    const finalFine = overrideFine || customPresetFine || "17:00";
    const finalTipo = overrideTipo || customPresetTipo || "Personalizzato";

    const rawLabel = customPresetName.trim() || `${finalInizio}-${finalFine}`;
    const icon = finalTipo === "Cucina" ? "🍳" : finalTipo === "Notte" ? "🌙" : finalTipo === "Pomeriggio" ? "🌆" : finalTipo === "Mattina" ? "🌅" : "⏱️";
    const label = rawLabel.includes("🍳") || rawLabel.includes("🌅") || rawLabel.includes("🌆") || rawLabel.includes("🌙") || rawLabel.includes("⏱️")
      ? rawLabel
      : `${icon} ${rawLabel}`;

    const newPreset: CustomShiftPreset = {
      id: `preset-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label,
      tipoTurno: finalTipo,
      orarioInizio: finalInizio,
      orarioFine: finalFine,
      subtitle: `Preset ${finalTipo} (${finalInizio} - ${finalFine})`,
      struttura: newStruttura,
      isDefault: false
    };

    const nextPresets = [...savedPresets, newPreset];
    savePresetsToStorage(nextPresets);
    setNewTipoTurno(newPreset.tipoTurno);
    setNewOrarioInizio(newPreset.orarioInizio);
    setNewOrarioFine(newPreset.orarioFine);
    setCustomPresetName("");
    setShowAddPresetForm(false);
    showToast(`💾 Nuovo orario "${label}" salvato e memorizzato nei preset!`);
  };

  const handleRemovePreset = (presetId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetPreset = savedPresets.find(p => p.id === presetId);
    const nextPresets = savedPresets.filter(p => p.id !== presetId);
    savePresetsToStorage(nextPresets);
    showToast(`🗑️ Preset orario "${targetPreset?.label || 'Selezionato'}" rimosso!`);
  };

  const handleResetDefaultPresets = () => {
    savePresetsToStorage(INITIAL_SHIFT_PRESETS);
    showToast("🔄 Preset orari ripristinati a quelli di default!");
  };

  // Hover states for shift & operator cross-highlighting
  const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);
  const [hoveredStaffId, setHoveredStaffId] = useState<string | null>(null);

  // Vacation / Ferie Form State
  const [showVacationModal, setShowVacationModal] = useState<boolean>(false);
  const [vacationStaffId, setVacationStaffId] = useState<string>(staff[0]?.id || "");
  const [vacationStartDate, setVacationStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vacationEndDate, setVacationEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [vacationNotes, setVacationNotes] = useState<string>("Ferie desiderate");
  const [vacationMode, setVacationMode] = useState<"single" | "range">("range");
  const [vacationCalendarMonth, setVacationCalendarMonth] = useState<Date>(new Date());

  const handleOpenVacationModal = (staffId?: string, dateStr?: string) => {
    if (staffId) {
      setVacationStaffId(staffId);
    } else if (currentUser?.role === 'staff') {
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

    const initialDate = dateStr || new Date().toISOString().split("T")[0];
    setVacationStartDate(initialDate);
    setVacationEndDate(initialDate);
    const d = new Date(initialDate);
    if (!isNaN(d.getTime())) {
      setVacationCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setShowAddModal(false);
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

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const timestampNote = `Ferie inserite il ${dateFormatted} alle ${timeFormatted}`;
    const finalNote = vacationNotes && vacationNotes.trim() && vacationNotes.trim() !== "Ferie desiderate"
      ? `${timestampNote} - ${vacationNotes.trim()}`
      : timestampNote;

    if (!onUpdateShifts) {
      datesToInsert.forEach(dStr => {
        onAddShift({
          id: `shift-ferie-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          staffId: vacationStaffId,
          data: dStr,
          tipoTurno: "Ferie",
          orarioInizio: "00:00",
          orarioFine: "00:00",
          note: finalNote
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
        note: finalNote
      }));

      applyShiftsUpdate([...existingFiltered, ...ferieShifts]);
    }

    setShowVacationModal(false);
    const staffName = selectedStaffObj ? `${selectedStaffObj.nome} ${selectedStaffObj.cognome}` : "Dipendente";
    showToast(`🌴 Inserite ${datesToInsert.length} giornate di Ferie per ${staffName}!`);
  };

  // Sick Leave / Malattia / Riposo Medico Form State
  const [showSickModal, setShowSickModal] = useState<boolean>(false);
  const [sickStaffId, setSickStaffId] = useState<string>(staff[0]?.id || "");
  const [sickStartDate, setSickStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sickEndDate, setSickEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [sickNotes, setSickNotes] = useState<string>("Certificato medico / Malattia");
  const [sickCalendarMonth, setSickCalendarMonth] = useState<Date>(new Date());

  const handleOpenSickModal = (staffId?: string, dateStr?: string) => {
    if (staffId) {
      setSickStaffId(staffId);
    } else if (currentUser?.role === 'staff') {
      const myStaff = staff.find(s => s.nome.toLowerCase() === currentUser.username.toLowerCase());
      if (myStaff) {
        setSickStaffId(myStaff.id);
      } else if (staff.length > 0) {
        setSickStaffId(staff[0].id);
      }
    } else {
      if (staff.length > 0 && !sickStaffId) {
        setSickStaffId(staff[0].id);
      }
    }

    const initialDate = dateStr || new Date().toISOString().split("T")[0];
    setSickStartDate(initialDate);
    setSickEndDate(initialDate);
    const d = new Date(initialDate);
    if (!isNaN(d.getTime())) {
      setSickCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    setShowAddModal(false);
    setShowSickModal(true);
  };

  const handleSickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sickStaffId || !sickStartDate || !sickEndDate) {
      alert("Seleziona il dipendente e le date di inizio/fine malattia.");
      return;
    }

    if (sickStartDate > sickEndDate) {
      alert("La data di inizio malattia non può essere successiva alla data di fine.");
      return;
    }

    const start = new Date(sickStartDate);
    const end = new Date(sickEndDate);
    const selectedStaffObj = staff.find(s => s.id === sickStaffId);

    const datesToInsert: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, "0");
      const day = String(cur.getDate()).padStart(2, "0");
      datesToInsert.push(`${year}-${month}-${day}`);
      cur.setDate(cur.getDate() + 1);
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const timestampNote = `Malattia inserita il ${dateFormatted} alle ${timeFormatted}`;
    const finalNote = sickNotes && sickNotes.trim() && sickNotes.trim() !== "Certificato medico / Malattia"
      ? `${timestampNote} - ${sickNotes.trim()}`
      : timestampNote;

    if (!onUpdateShifts) {
      datesToInsert.forEach(dStr => {
        onAddShift({
          id: `shift-malattia-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          staffId: sickStaffId,
          data: dStr,
          tipoTurno: "Malattia",
          orarioInizio: "00:00",
          orarioFine: "00:00",
          note: finalNote
        });
      });
    } else {
      const existingFiltered = shifts.filter(s => !(s.staffId === sickStaffId && datesToInsert.includes(s.data)));
      const sickShifts: Shift[] = datesToInsert.map((dStr, idx) => ({
        id: `shift-malattia-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        staffId: sickStaffId,
        data: dStr,
        tipoTurno: "Malattia",
        orarioInizio: "00:00",
        orarioFine: "00:00",
        note: finalNote
      }));

      applyShiftsUpdate([...existingFiltered, ...sickShifts]);
    }

    setShowSickModal(false);
    const staffName = selectedStaffObj ? `${selectedStaffObj.nome} ${selectedStaffObj.cognome}` : "Dipendente";
    showToast(`🤒 Registrate ${datesToInsert.length} giornate di Malattia / Riposo Medico per ${staffName}!`);
  };

  // Edit Shift Modal State (when editing inside detail modal)
  const [editShiftStaffId, setEditShiftStaffId] = useState<string>("");
  const [editShiftDate, setEditShiftDate] = useState<string>("");
  const [editShiftInizio, setEditShiftInizio] = useState<string>("");
  const [editShiftFine, setEditShiftFine] = useState<string>("");
  const [editShiftStruttura, setEditShiftStruttura] = useState<string>("Vannucci 1");
  const [editShiftNote, setEditShiftNote] = useState<string>("");

  const formatDateIT = (d: Date) => {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const STRUTTURE = [{ nome: "Vannucci 1" }, { nome: "Vannucci 2" }, { nome: "Vannucci 4" }];

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

  // Global Keyboard Shortcuts (Escape to close any open modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAddModal(false);
        setShowAddStaffModal(false);
        setShowExportModal(false);
        setSelectedShiftForDetail(null);
        setShowVacationModal(false);
        setSelectedStaffProfile(null);
        setConfirmDeleteDayDate(null);
        setShowHelpGuide(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Right-click hold to show day coverage details popup anywhere in the day column
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        const target = (e.target as HTMLElement).closest("[data-date]");
        if (target) {
          const dateYMD = target.getAttribute("data-date");
          if (dateYMD) {
            e.preventDefault();
            setHoveredDayCoverageDate(dateYMD);
            setHoveredDayCoveragePos({ x: e.clientX, y: e.clientY });
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        setHoveredDayCoverageDate(null);
        setHoveredDayCoveragePos(null);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-date]");
      if (target) {
        e.preventDefault();
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
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
    return { orarioInizio: fallbackInizio, orarioFine: fallbackFine };
  };

  // Automatic Shift Suggestion
  const suggestNextShift = (targetStaffId: string, targetDateStr: string, currentStruttura: string) => {
    // 1. Read existing shifts on this day for the structure to find what's missing
    const dayShifts = shifts.filter(s => s.data === targetDateStr && s.struttura === currentStruttura);
    const hasMattina = dayShifts.some(s => s.tipoTurno === "Mattina");
    const hasPomeriggio = dayShifts.some(s => s.tipoTurno === "Pomeriggio");
    const hasNotte = shifts.some(s => s.data === targetDateStr && s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00")));

    let proposedType: "Mattina" | "Pomeriggio" | "Notte" | "Riposo" = "Mattina";
    if (!hasMattina) proposedType = "Mattina";
    else if (!hasPomeriggio) proposedType = "Pomeriggio";
    else if (!hasNotte) proposedType = "Notte";
    else proposedType = "Riposo";

    // 2. Count operators starting at 07:00 today (alzate support: Pulizie, V1, V2)
    const staffStartingAt07Today = shifts.filter(s =>
      s.data === targetDateStr &&
      s.staffId !== targetStaffId &&
      s.tipoTurno !== "Riposo" &&
      s.tipoTurno !== "Ferie" &&
      s.tipoTurno !== "Notte" &&
      s.orarioInizio === "07:00"
    ).length;

    // 3. Read staff member's PREVIOUS shift to respect 11-hour rule
    const targetDateObj = new Date(targetDateStr);
    targetDateObj.setDate(targetDateObj.getDate() - 1);
    const prevDateStr = formatDateYMD(targetDateObj);
    
    // Check if staff worked yesterday
    const prevShifts = shifts.filter(s => s.staffId === targetStaffId && s.data === prevDateStr);
    let lastEndTimeMin = 0; // End time of last shift in minutes from 00:00 of prevDateStr
    
    prevShifts.forEach(s => {
       const endParts = s.orarioFine.split(":");
       if (endParts.length === 2) {
          const sStartHour = parseInt(s.orarioInizio.split(":")[0], 10);
          const sEndHour = parseInt(endParts[0], 10);
          const sEndMinute = parseInt(endParts[1] || "0", 10);
          let mins = sEndHour * 60 + sEndMinute;

          if (s.orarioFine === "24:00" || (s.orarioFine === "00:00" && sStartHour >= 12)) {
            mins = 24 * 60;
          } else if (sEndHour < sStartHour) {
            mins += 24 * 60; // Crosses into next day (e.g. 23:00 - 07:00)
          }

          if (mins > lastEndTimeMin) {
            lastEndTimeMin = mins;
          }
       }
    });

    let startProposed = "07:00";
    let endProposed = "14:00";
    
    if (proposedType === "Mattina") {
      // Ensure at least 2 people start at 07:00 for alzata support (V1, V2, or Pulizie)
      if (staffStartingAt07Today < 2 && (currentStruttura === "Vannucci 1" || currentStruttura === "Vannucci 2")) {
        startProposed = "07:00";
        endProposed = "14:00";
      } else if (currentStruttura === "Vannucci 1") {
        startProposed = "07:00";
        endProposed = "14:00";
      } else {
        startProposed = "08:00";
        endProposed = "15:00";
      }
    } else if (proposedType === "Pomeriggio") {
      startProposed = "15:00";
      endProposed = "22:00";
    } else if (proposedType === "Notte") {
      startProposed = "23:00";
      endProposed = "07:00";
    }

    // Convert startProposed to minutes from 00:00 of targetDateStr
    const startParts = startProposed.split(":");
    const startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);

    // Absolute minutes for next shift start (relative to prevDateStr 00:00)
    const nextStartAbsoluteMin = startMin + 24 * 60; 
    const restMins = nextStartAbsoluteMin - lastEndTimeMin;
    
    if (lastEndTimeMin > 0 && restMins < 11 * 60) {
        // Less than 11 hours rest! 
        if (proposedType === "Mattina" && restMins >= 10 * 60) {
            // E.g. ended at 21:00 yesterday -> 10h rest until 07:00. Switch to 08:00
            startProposed = "08:00";
            endProposed = "15:00";
        } else if (proposedType === "Mattina" || proposedType === "Notte") {
            // If we can't do Mattina, push to Pomeriggio
            proposedType = "Pomeriggio";
            startProposed = "15:00";
            endProposed = "22:00";
        }
    }
    
    return {
        tipo: proposedType as "Mattina" | "Pomeriggio" | "Notte" | "Riposo",
        inizio: startProposed,
        fine: endProposed
    };
  };

  // Open modal prefilled with person and date
  const handleOpenAddModal = (staffId?: string, dateStr?: string, defaultTipo?: string, defaultInizio?: string, defaultFine?: string) => {
    if (isPublicView) return;
    if (dateStr && lockedDays.includes(dateStr)) {
      showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
      return;
    }
    
    const targetStaffId = staffId || newStaffId;
    const targetDate = dateStr || newDate;
    
    setNewStaffId(targetStaffId);
    setNewDate(targetDate);
    
    if (defaultTipo) {
      setNewTipoTurno(defaultTipo);
      setNewOrarioInizio(defaultInizio || "07:00");
      setNewOrarioFine(defaultFine || "14:00");
      if (defaultTipo === "Notte") setNewNote("Turno di Notte");
      else if (defaultTipo === "Cucina") setNewNote("Servizio Cucina e Mensa");
      else if (defaultTipo === "Pulizie") setNewNote("Servizio Pulizie & Supporto Alzate");
      else setNewNote("");
    } else {
      // Auto preset times smartly based on structure and previous shifts
      const suggested = suggestNextShift(targetStaffId, targetDate, newStruttura);
      setNewTipoTurno(suggested.tipo);
      setNewOrarioInizio(suggested.inizio);
      setNewOrarioFine(suggested.fine);
      setNewNote("");
    }

    setShowAddModal(true);
  };

  const handleAddNightShift = (staffId: string, dateStr: string, struttura: string = "", customNote: string = "") => {
    const dObj = new Date(dateStr);
    dObj.setDate(dObj.getDate() + 1);
    const nextDateStr = dObj.toISOString().split("T")[0];

    const shiftDay1: Shift = {
      id: `shift-${Date.now()}-notte-1-${Math.random().toString(36).substr(2, 4)}`,
      staffId,
      data: dateStr,
      tipoTurno: "Notte",
      orarioInizio: "23:00",
      orarioFine: "24:00",
      note: customNote || "Turno di Notte (23:00 - 24:00)",
      struttura: ""
    };

    const shiftDay2: Shift = {
      id: `shift-${Date.now()}-notte-2-${Math.random().toString(36).substr(2, 4)}`,
      staffId,
      data: nextDateStr,
      tipoTurno: "Notte",
      orarioInizio: "00:00",
      orarioFine: "07:00",
      note: customNote ? `${customNote} (Continuazione)` : "Turno di Notte (00:00 - 07:00)",
      struttura: ""
    };

    return { shiftDay1, shiftDay2, nextDateStr };
  };

  // Scorciatoia rapida diretta: inserisce il turno Notte (23:00 - 07:00) con 1 clic senza passare dalla scheda
  const handleQuickAddNightShift = (staffId: string, dateStr: string) => {
    if (isStaffRole) return;
    if (lockedDays.includes(dateStr)) {
      showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
      return;
    }
    const dObj = new Date(dateStr);
    dObj.setDate(dObj.getDate() + 1);
    const nextDateStr = dObj.toISOString().split("T")[0];

    if (lockedDays.includes(nextDateStr)) {
      showToast("🔒 Il giorno successivo è bloccato! Impossibile completare il turno notturno.");
      return;
    }

    const memberObj = staff.find(s => s.id === staffId);
    const memberName = memberObj ? `${memberObj.nome} ${memberObj.cognome}` : "Operatore";

    const { shiftDay1, shiftDay2 } = handleAddNightShift(staffId, dateStr, "", "Turno Notte rapido");
    const existingFiltered = shifts.filter(s => {
      if (s.staffId === staffId) {
        if (s.data === dateStr) {
          if (s.orarioInizio === "23:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
            return false;
          }
        }
        if (s.data === nextDateStr) {
          if (s.orarioInizio === "00:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
            return false;
          }
        }
      }
      return true;
    });
    const updatedShiftsList = [...existingFiltered, shiftDay1, shiftDay2];
    applyShiftsUpdate(updatedShiftsList);
    showToast(`⚡ Turno di Notte inserito direttamente per ${memberName} (23:00 oggi + 00:00-07:00 domani)!`);
  };

  // Handle Submit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffId || !newDate) {
      alert("Seleziona operatore e data.");
      return;
    }

    if (lockedDays.includes(newDate)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di aggiungere un turno.");
      return;
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    let constructedNote = newNote.trim();
    if (newTipoTurno === "Ferie" || newTipoTurno === "Riposo") {
      const labelTipo = newTipoTurno === "Ferie" ? "Ferie inserite" : "Riposo inserito";
      const timestampStamp = `${labelTipo} il ${dateFormatted} alle ${timeFormatted}`;
      if (!constructedNote.includes("inserite il") && !constructedNote.includes("inserito il")) {
        constructedNote = constructedNote ? `${timestampStamp} - ${constructedNote}` : timestampStamp;
      }
    }

    // Special Night Shift Rule: 23:00-24:00 today & 00:00-07:00 tomorrow
    if (newTipoTurno === "Notte" || (newOrarioInizio === "23:00" && (newOrarioFine === "07:00" || newOrarioFine === "24:00"))) {
      const dObj = new Date(newDate);
      dObj.setDate(dObj.getDate() + 1);
      const nextDateStr = dObj.toISOString().split("T")[0];

      if (lockedDays.includes(nextDateStr)) {
        showToast("🔒 Il giorno successivo è bloccato! Impossibile completare il turno notturno.");
        return;
      }

      const { shiftDay1, shiftDay2 } = handleAddNightShift(newStaffId, newDate, newStruttura, constructedNote);
      const existingFiltered = shifts.filter(s => {
        if (s.staffId === newStaffId) {
          if (s.data === newDate) {
            if (s.orarioInizio === "23:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
              return false;
            }
          }
          if (s.data === nextDateStr) {
            if (s.orarioInizio === "00:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
              return false;
            }
          }
        }
        return true;
      });
      const updatedShiftsList = [...existingFiltered, shiftDay1, shiftDay2];
      applyShiftsUpdate(updatedShiftsList);
      setShowAddModal(false);
      setNewNote("");
      showToast(`⚡ Turno di Notte caricato (23:00-24:00 oggi + 00:00-07:00 domani)!`);
      return;
    }

    const shiftObj: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      staffId: newStaffId,
      data: newDate,
      tipoTurno: newTipoTurno,
      orarioInizio: newOrarioInizio,
      orarioFine: newOrarioFine,
      note: constructedNote,
      struttura: newTipoTurno === "Notte" || newTipoTurno === "Riposo" || newTipoTurno === "Ferie" || newTipoTurno === "Cucina" || newTipoTurno === "Pulizie" ? "" : newStruttura
    };

    let updatedShiftsList: Shift[];
    if (newTipoTurno === "Riposo" || newTipoTurno === "Ferie") {
      const existingFiltered = shifts.filter(s => !(s.staffId === newStaffId && s.data === newDate));
      updatedShiftsList = [...existingFiltered, shiftObj];
    } else {
      const isPastMidnight = (start: string, end: string) => parseInt(end.split(":")[0], 10) < parseInt(start.split(":")[0], 10) || end === "07:00";
      const toMin = (t: string, pastMidnight: boolean) => {
        const parts = t.split(":");
        let min = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (pastMidnight) min += 24 * 60;
        return min;
      };

      const newStartMin = toMin(newOrarioInizio, false);
      const newEndMin = toMin(newOrarioFine, newTipoTurno === "Notte" || isPastMidnight(newOrarioInizio, newOrarioFine));

      const memberDayShifts = shifts.filter(s => s.staffId === newStaffId && s.data === newDate && s.tipoTurno !== "Riposo");
      const nonOverlappingMemberDayShifts = memberDayShifts.filter(s => {
        const sStartMin = toMin(s.orarioInizio, false);
        const sEndMin = toMin(s.orarioFine, s.tipoTurno === "Notte" || isPastMidnight(s.orarioInizio, s.orarioFine));
        const overlaps = Math.max(newStartMin, sStartMin) < Math.min(newEndMin, sEndMin);
        return !overlaps;
      });

      const otherStaffShifts = shifts.filter(s => !(s.staffId === newStaffId && s.data === newDate));
      updatedShiftsList = [...otherStaffShifts, ...nonOverlappingMemberDayShifts, shiftObj];
    }

    applyShiftsUpdate(updatedShiftsList);
    setShowAddModal(false);
    setNewNote("");
    showToast(`Turno ${newTipoTurno} inserito per il ${newDate}!`);
  };

  const handleFastSubmit = (preset: { tipoTurno: string; orarioInizio: string; orarioFine: string }) => {
    if (!newStaffId || !newDate) return;

    if (lockedDays.includes(newDate)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di aggiungere un turno.");
      return;
    }

    let constructedNote = newNote.trim();
    if (preset.tipoTurno === "Pulizie" && !constructedNote) {
      constructedNote = "Servizio Pulizie & Supporto Alzate";
    }
    if (preset.tipoTurno === "Cucina" && !constructedNote) {
      constructedNote = "Servizio Cucina e Mensa";
    }
    if (preset.tipoTurno === "Notte" && !constructedNote) {
      constructedNote = "Turno di Notte";
    }

    // Special Night Shift Rule: 23:00-24:00 today & 00:00-07:00 tomorrow
    if (preset.tipoTurno === "Notte" || preset.orarioInizio === "23:00") {
      const dObj = new Date(newDate);
      dObj.setDate(dObj.getDate() + 1);
      const nextDateStr = dObj.toISOString().split("T")[0];

      if (lockedDays.includes(nextDateStr)) {
        showToast("🔒 Il giorno successivo è bloccato! Impossibile completare il turno notturno.");
        return;
      }

      const { shiftDay1, shiftDay2 } = handleAddNightShift(newStaffId, newDate, newStruttura, constructedNote);
      const existingFiltered = shifts.filter(s => {
        if (s.staffId === newStaffId) {
          if (s.data === newDate) {
            if (s.orarioInizio === "23:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
              return false;
            }
          }
          if (s.data === nextDateStr) {
            if (s.orarioInizio === "00:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
              return false;
            }
          }
        }
        return true;
      });
      const updatedShiftsList = [...existingFiltered, shiftDay1, shiftDay2];
      applyShiftsUpdate(updatedShiftsList);
      setShowAddModal(false);
      setNewNote("");
      showToast(`⚡ Turno di Notte caricato (23:00-24:00 oggi + 00:00-07:00 domani)!`);
      return;
    }

    const structureForCheck = ["Notte", "Cucina", "Pulizie", "Riposo", "Ferie"].includes(preset.tipoTurno) ? "" : newStruttura;
    const validity = checkPotentialShiftValidity(newStaffId, newDate, preset.tipoTurno, structureForCheck, preset.orarioInizio, preset.orarioFine);
    if (!validity.valid) {
      showToast(validity.reason || "Errore di validazione del turno");
      return;
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const timeFormatted = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    if (preset.tipoTurno === "Ferie" || preset.tipoTurno === "Riposo") {
      const labelTipo = preset.tipoTurno === "Ferie" ? "Ferie inserite" : "Riposo inserito";
      const timestampStamp = `${labelTipo} il ${dateFormatted} alle ${timeFormatted}`;
      if (!constructedNote.includes("inserite il") && !constructedNote.includes("inserito il")) {
        constructedNote = constructedNote ? `${timestampStamp} - ${constructedNote}` : timestampStamp;
      }
    }

    const shiftObj: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      staffId: newStaffId,
      data: newDate,
      tipoTurno: preset.tipoTurno,
      orarioInizio: preset.orarioInizio,
      orarioFine: preset.orarioFine,
      note: constructedNote,
      struttura: ["Notte", "Riposo", "Ferie", "Cucina", "Pulizie"].includes(preset.tipoTurno) ? "" : newStruttura
    };

    let updatedShiftsList: Shift[];
    if (preset.tipoTurno === "Riposo" || preset.tipoTurno === "Ferie" || preset.tipoTurno === "Cucina") {
      const existingFiltered = shifts.filter(s => !(s.staffId === newStaffId && s.data === newDate));
      updatedShiftsList = [...existingFiltered, shiftObj];
    } else {
      const isPastMidnight = (start: string, end: string) => parseInt(end.split(":")[0], 10) < parseInt(start.split(":")[0], 10) || end === "07:00";
      const toMin = (t: string, pastMidnight: boolean) => {
        const parts = t.split(":");
        let min = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (pastMidnight) min += 24 * 60;
        return min;
      };

      const newStartMin = toMin(preset.orarioInizio, false);
      const newEndMin = toMin(preset.orarioFine, preset.tipoTurno === "Notte" || isPastMidnight(preset.orarioInizio, preset.orarioFine));

      const memberDayShifts = shifts.filter(s => s.staffId === newStaffId && s.data === newDate && s.tipoTurno !== "Riposo");
      const nonOverlappingMemberDayShifts = memberDayShifts.filter(s => {
        const sStartMin = toMin(s.orarioInizio, false);
        const sEndMin = toMin(s.orarioFine, s.tipoTurno === "Notte" || isPastMidnight(s.orarioInizio, s.orarioFine));
        const overlaps = Math.max(newStartMin, sStartMin) < Math.min(newEndMin, sEndMin);
        return !overlaps;
      });

      const otherStaffShifts = shifts.filter(s => !(s.staffId === newStaffId && s.data === newDate));
      updatedShiftsList = [...otherStaffShifts, ...nonOverlappingMemberDayShifts, shiftObj];
    }

    applyShiftsUpdate(updatedShiftsList);
    setShowAddModal(false);
    setNewNote("");
    showToast(`⚡ Turno ${preset.tipoTurno} (${preset.orarioInizio}-${preset.orarioFine}) caricato automaticamente!`);
  };

  // Special Rule: Add both Pulizie (07:00-11:00) + Notte (23:00-24:00 today & 00:00-07:00 tomorrow) on the same day for the staff member
  const handleAddComboPulizieNotte = (staffId: string, dateStr: string, struttura: string = "") => {
    if (!staffId || !dateStr) return;
    if (lockedDays.includes(dateStr)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di aggiungere turni.");
      return;
    }

    const pulizieValidity = checkPotentialShiftValidity(staffId, dateStr, "Pulizie", struttura, "07:00", "11:00");
    if (!pulizieValidity.valid) {
      showToast(`⚠️ Turno Pulizie: ${pulizieValidity.reason}`);
      return;
    }

    const dObj = new Date(dateStr);
    dObj.setDate(dObj.getDate() + 1);
    const nextDateStr = dObj.toISOString().split("T")[0];

    if (lockedDays.includes(nextDateStr)) {
      showToast("🔒 Il giorno successivo è bloccato! Impossibile inserire la seconda parte della notte.");
      return;
    }

    const pulizieShift: Shift = {
      id: `shift-${Date.now()}-pulizie-${Math.random().toString(36).substr(2, 4)}`,
      staffId: staffId,
      data: dateStr,
      tipoTurno: "Pulizie",
      orarioInizio: "07:00",
      orarioFine: "11:00",
      note: "Servizio Pulizie & Supporto Alzate (Combo Regola Speciale Notte)",
      struttura: struttura
    };

    const { shiftDay1, shiftDay2 } = handleAddNightShift(staffId, dateStr, struttura, "Turno di Notte (Combo Pulizie)");

    const existingFiltered = shifts.filter(s => {
      if (s.staffId === staffId) {
        if (s.data === dateStr) {
          if (s.orarioInizio === "23:00" || s.tipoTurno === "Pulizie" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
            return false;
          }
        }
        if (s.data === nextDateStr) {
          if (s.orarioInizio === "00:00" || s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie") {
            return false;
          }
        }
      }
      return true;
    });
    const updatedShiftsList = [...existingFiltered, pulizieShift, shiftDay1, shiftDay2];

    applyShiftsUpdate(updatedShiftsList);
    setShowAddModal(false);
    setNewNote("");
    const staffName = staff.find(st => st.id === staffId)?.nome || "Operatore";
    showToast(`⚡ Caricata Combo per ${staffName}: Pulizie (07:00-11:00) + Notte (23:00-24:00 oggi & 00:00-07:00 domani)!`);
  };

  // Delete Single Shift with Undo
  const handleDeleteSingleShift = (shiftId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isStaffRole) {
      showToast("⛔ Gli operatori non possono eliminare i turni assegnati.");
      return;
    }
    const targetShift = shifts.find(s => s.id === shiftId);
    if (!targetShift) return;

    if (lockedDays.includes(targetShift.data)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di cancellare.");
      return;
    }

    setLastDeletedShifts([targetShift]);
    const updatedShifts = shifts.filter(s => s.id !== shiftId);
    applyShiftsUpdate(updatedShifts);
    setSelectedShiftForDetail(null);
    showToast(`🗑️ Turno ${targetShift.tipoTurno} cancellato.`, true);
  };


    const handleDateContextMenu = (e: React.MouseEvent, dateYMD: string) => {
    e.preventDefault();
    if (hoveredDayCoverageDate === dateYMD) {
      setHoveredDayCoverageDate(null);
      setHoveredDayCoveragePos(null);
    } else {
      setHoveredDayCoverageDate(dateYMD);
      setHoveredDayCoveragePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleStrutturaFilterClick = (type: 'v1' | 'v2' | 'v4') => {
    setActiveStrutturaFilters(prev => {
      const exists = prev.includes(type);
      if (exists) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
    // Clicking V1/V2/V4 clears Alzate (exclusive)
    if (activeTimeFilter === 'alzate') {
      setActiveTimeFilter(null);
    }
  };

  const handleTimeFilterClick = (type: 'alzate' | 'notte' | 'mattino' | 'pomeriggio') => {
    if (activeTimeFilter === type) {
      setActiveTimeFilter(null);
    } else {
      if (type === 'alzate') {
        setActiveStrutturaFilters([]);
      }
      // Notte is independent: does NOT clear structure filters
      setActiveTimeFilter(type);
    }
  };

  const handleDeleteWeekShifts = () => {
    if (isStaffRole) {
      showToast("⛔ Gli operatori non possono eliminare i turni.");
      return;
    }

    if (!window.confirm("Sei sicuro di voler cancellare TUTTI i turni non bloccati di questa settimana? Questa azione è irreversibile.")) {
      return;
    }
    
    // Explicitly calculate target dates for the current week being viewed (Monday to Sunday)
    const start = getStartOfWeek(currentDate);
    const targetDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return formatDateYMD(d);
    });

    const targetShifts = shifts.filter(s => 
      targetDates.includes(s.data) && 
      !lockedDays.includes(s.data) &&
      !s.id.startsWith("auto-sunday-ref")
    );

    if (targetShifts.length === 0) {
      showToast("Nessun turno da cancellare in questa settimana (o giorni bloccati).");
      return;
    }

    setLastDeletedShifts(targetShifts);
    const updatedShifts = shifts.filter(s => !targetShifts.some(ts => ts.id === s.id));
    applyShiftsUpdate(updatedShifts);
    showToast(`🗑️ Cancellati ${targetShifts.length} turni della settimana.`, true);
  };

  // Trigger Delete Day Confirmation Modal
  const handleRequestDeleteDay = (dateYMD: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isStaffRole) {
      showToast("⛔ Gli operatori non possono eliminare i turni.");
      return;
    }
    if (lockedDays.includes(dateYMD)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di procedere.");
      return;
    }
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
    if (isStaffRole) {
      showToast("⛔ Gli operatori non possono eliminare i turni.");
      setConfirmDeleteDayDate(null);
      return;
    }
    if (lockedDays.includes(confirmDeleteDayDate)) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di procedere.");
      setConfirmDeleteDayDate(null);
      return;
    }
    const dayShifts = shifts.filter(s => s.data === confirmDeleteDayDate);
    setLastDeletedShifts(dayShifts);

    if (onUpdateShifts) {
      applyShiftsUpdate(shifts.filter(s => s.data !== confirmDeleteDayDate));
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
    applyShiftsUpdate([...shifts, ...toRestore]);
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

    if (lockedDays.includes(nextDateStr)) {
      showToast("🔒 Impossibile copiare: il giorno di destinazione è bloccato!");
      return;
    }

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

    applyShiftsUpdate([...shiftsWithoutTargetCell, copiedShift]);
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

    if (lockedDays.includes(targetDateYMD)) {
      showToast("🔒 Impossibile copiare: il giorno di destinazione (+7 giorni) è bloccato!");
      return;
    }

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

    applyShiftsUpdate([...existingShiftsWithoutTarget, ...newDuplicatedShifts]);
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

      const refSundayYMD = formatDateYMD(weekDays[0]);

      if (targetDateYMD === refSundayYMD) {
        showToast("🔒 La domenica della settimana precedente (riferimento) è in sola lettura!");
        return;
      }

      if (lockedDays.includes(targetDateYMD)) {
        showToast("🔒 Impossibile rilasciare: questo giorno è bloccato!");
        return;
      }

      // Check if source day or single shift is from a locked day or reference Sunday
      const isSourceLocked = (data.type === "single_shift" && data.sourceDate && (lockedDays.includes(data.sourceDate) || data.sourceDate === refSundayYMD)) ||
                             (data.type === "day" && data.sourceDateYMD && (lockedDays.includes(data.sourceDateYMD) || data.sourceDateYMD === refSundayYMD));

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

      // Determine action: COPIA if "copy" mode selected, modifier key held, OR if source is locked/reference day
      const isCopy = dragActionMode === "copy" || isModifierHeld || isSourceLocked;

      if (data.type === "single_shift") {
        const draggedShift = shifts.find(s => s.id === data.shiftId);
        if (!draggedShift) return;

        const finalStaffId = targetStaffId || draggedShift.staffId;
        const sourceStaffId = draggedShift.staffId;
        const sourceDateYMD = draggedShift.data;

        // Ignore drop if dragged onto exact same cell
        if (sourceStaffId === finalStaffId && sourceDateYMD === targetDateYMD) return;

        const targetStaffObj = staff.find(st => st.id === finalStaffId);
        const sourceStaffObj = staff.find(st => st.id === sourceStaffId);

        // Find existing non-Riposo or work shift on target cell (if any)
        const existingTargetShift = shifts.find(s =>
          s.staffId === finalStaffId && s.data === targetDateYMD && s.id !== draggedShift.id
        );

        const isPulizieNotteCombo = existingTargetShift && (
          (draggedShift.tipoTurno === "Pulizie" && existingTargetShift.tipoTurno === "Notte") ||
          (draggedShift.tipoTurno === "Notte" && existingTargetShift.tipoTurno === "Pulizie")
        );

        if (!isCopy) {
          if (existingTargetShift && !isPulizieNotteCombo) {
            // SWAP SHIFTS BETWEEN DRAGGED CELL AND TARGET CELL (SCAMBIO TURNI)
            const timesForDragged = getStaffHoursForShiftType(targetStaffObj, draggedShift.tipoTurno, draggedShift.orarioInizio, draggedShift.orarioFine);
            const timesForExisting = getStaffHoursForShiftType(sourceStaffObj, existingTargetShift.tipoTurno, existingTargetShift.orarioInizio, existingTargetShift.orarioFine);

            const updated = shifts.map(s => {
              if (s.id === draggedShift.id) {
                return {
                  ...s,
                  staffId: finalStaffId,
                  data: targetDateYMD,
                  orarioInizio: timesForDragged.orarioInizio,
                  orarioFine: timesForDragged.orarioFine
                };
              }
              if (s.id === existingTargetShift.id) {
                return {
                  ...s,
                  staffId: sourceStaffId,
                  data: sourceDateYMD,
                  orarioInizio: timesForExisting.orarioInizio,
                  orarioFine: timesForExisting.orarioFine
                };
              }
              return s;
            });

            applyShiftsUpdate(updated);

            const targetName = targetStaffObj ? targetStaffObj.nome : "Operatore";
            const sourceName = sourceStaffObj ? sourceStaffObj.nome : "Operatore";
            showToast(`🔄 Turni SCAMBIATI di posto tra ${sourceName} e ${targetName}!`);
          } else {
            // MOVE SHIFT TO TARGET CELL (EITHER EMPTY OR FORMING A PULIZIE+NOTTE COMBO)
            const times = getStaffHoursForShiftType(targetStaffObj, draggedShift.tipoTurno, draggedShift.orarioInizio, draggedShift.orarioFine);
            const updated = shifts.map(s => {
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

            applyShiftsUpdate(updated);
            if (isPulizieNotteCombo) {
              showToast(`⚡ Combo Creata! Turno ${draggedShift.tipoTurno} unito a ${existingTargetShift?.tipoTurno} per ${targetStaffObj ? targetStaffObj.nome : ""}!`);
            } else {
              showToast(`↔️ Turno ${draggedShift.tipoTurno} SPOSTATO a ${targetStaffObj ? targetStaffObj.nome : ""} (${times.orarioInizio}-${times.orarioFine})!`);
            }
          }
        } else {
          // DUPLICATE / COPY SHIFT TO TARGET CELL
          const times = getStaffHoursForShiftType(targetStaffObj, draggedShift.tipoTurno, draggedShift.orarioInizio, draggedShift.orarioFine);
          const shiftsWithoutTargetCell = isPulizieNotteCombo 
            ? shifts 
            : shifts.filter(s => !(s.staffId === finalStaffId && s.data === targetDateYMD && s.id !== draggedShift.id));
          
          const newCopyShift: Shift = {
            ...draggedShift,
            id: `shift-copy-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            staffId: finalStaffId,
            data: targetDateYMD,
            orarioInizio: times.orarioInizio,
            orarioFine: times.orarioFine
          };

          applyShiftsUpdate([...shiftsWithoutTargetCell, newCopyShift]);
          if (isPulizieNotteCombo) {
            showToast(`⚡ Combo Creata! Turno ${draggedShift.tipoTurno} duplicato e unito a ${existingTargetShift?.tipoTurno} per ${targetStaffObj ? targetStaffObj.nome : ""}!`);
          } else {
            showToast(`📋 Turno ${draggedShift.tipoTurno} COPIATO a ${targetStaffObj ? targetStaffObj.nome : ""} (${times.orarioInizio}-${times.orarioFine})!`);
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

        const shiftsWithoutTarget = shifts.filter(s => s.data !== targetDateYMD);

        if (!isCopy) {
          // MOVE ALL SHIFTS FROM SOURCE DATE TO TARGET DATE
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

          applyShiftsUpdate(updated);

          const sourceFormatted = new Date(sourceDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
          const targetFormatted = new Date(targetDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
          showToast(`↔️ SPOSTATI i turni del ${sourceFormatted} nel ${targetFormatted}!`);
        } else {
          // DUPLICATE/COPY ALL SHIFTS TO TARGET DATE
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

          applyShiftsUpdate([...shiftsWithoutTarget, ...newDuplicatedShifts]);

          const sourceFormatted = new Date(sourceDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
          const targetFormatted = new Date(targetDateYMD).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
          showToast(`🎉 COPIATI i turni del ${sourceFormatted} nel ${targetFormatted}!`);
        }
      }
    } catch (err) {
      console.error("Drop error", err);
    }
  };

  // Save Shift Details from Modal (Edit Shift Date/Staff/Times)
  const handleSaveShiftEdit = () => {
    if (!selectedShiftForDetail || !onUpdateShifts) return;

    if (lockedDays.includes(selectedShiftForDetail.data) || (editShiftDate && lockedDays.includes(editShiftDate))) {
      showToast("🔒 Questo giorno è bloccato! Sbloccalo prima di modificare il turno.");
      return;
    }

    const updatedShifts = shifts.map(s => {
      if (s.id === selectedShiftForDetail.id) {
        return {
          ...s,
          id: s.id.startsWith("auto-") ? `shift-edited-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` : s.id,
          staffId: editShiftStaffId || s.staffId,
          data: editShiftDate || s.data,
          orarioInizio: editShiftInizio || s.orarioInizio,
          orarioFine: editShiftFine || s.orarioFine,
          struttura: editShiftStruttura || s.struttura,
          note: editShiftNote
        };
      }
      return s;
    });

    applyShiftsUpdate(updatedShifts);
    setSelectedShiftForDetail(null);
    setEditShiftNote("");
    showToast("✅ Turno aggiornato con successo!");
  };

  // Open Edit Shift Modal
  const handleOpenDetailModal = (s: Shift) => {
    if (lockedDays.includes(s.data)) {
      showToast("🔒 Questo giorno è bloccato! Non è possibile modificare i turni in questo giorno.");
      return;
    }
    setSelectedShiftForDetail(s);
    setEditShiftStaffId(s.staffId);
    setEditShiftDate(s.data);
    setEditShiftInizio(s.orarioInizio);
    setEditShiftFine(s.orarioFine);
    setEditShiftStruttura(s.struttura || "Vannucci 1");
    setEditShiftNote(s.note || "");
  };

  // Save Staff Member Profile update
  const handleUpdateSingleStaffFromShifts = (updated: StaffMember) => {
    const updatedList = staff.map(st => st.id === updated.id ? updated : st);
    if (onUpdateStaff) {
      onUpdateStaff(updatedList);
    }

    // Save directly to Firestore and REST API for real-time live sync on public links
    firestoreSync.saveStaff(updatedList);
    apiSync.saveStaff(updatedList);

    setSelectedStaffProfile(updated);
    showToast(`✅ Scheda di ${updated.nome} ${updated.cognome} aggiornata live!`);
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
      tipoContratto: newStaffTipoContratto.trim() || "",
      coloreBadge: newStaffColoreBadge || "#4f46e5",
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



  // Helper to validate shift candidate for automatic generation (strictly enforces 11-hour rest and prevents same-day double bookings)
  const checkCandidateShiftValidityForAuto = (
    staffId: string,
    dateStr: string,
    tipoTurno: string,
    struttura: string,
    inizio: string,
    fine: string,
    currentShiftsList: Shift[]
  ): boolean => {
    if (tipoTurno === "Riposo" || tipoTurno === "Ferie") return true;

    // 1. Strict single-shift rule for automatic scheduler: Staff cannot have ANY other shift (Work, Ferie, Notte, Riposo) on the same date
    const hasAnyShiftThisDay = currentShiftsList.some(
      s => s.staffId === staffId && s.data === dateStr
    );
    if (hasAnyShiftThisDay) return false;

    // 2. Check duplicate structure & tipoTurno on this date
    const sameStructureShift = currentShiftsList.some(
      s => s.data === dateStr && s.struttura === struttura && s.tipoTurno === tipoTurno && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie"
    );
    if (sameStructureShift) return false;

    // 3. Check strict 11-hour rest rule with PREVIOUS day's shifts (e.g., Afternoon -> Morning is forbidden if <11h)
    const targetDateObj = new Date(dateStr);
    targetDateObj.setDate(targetDateObj.getDate() - 1);
    const prevDateStr = formatDateYMD(targetDateObj);

    const prevShifts = currentShiftsList.filter(
      s => s.staffId === staffId && s.data === prevDateStr && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie"
    );

    let lastEndTimeMin = 0;
    prevShifts.forEach(s => {
      const endParts = s.orarioFine.split(":");
      if (endParts.length === 2) {
        const sStartHour = parseInt(s.orarioInizio.split(":")[0], 10);
        const sEndHour = parseInt(endParts[0], 10);
        const sEndMinute = parseInt(endParts[1] || "0", 10);
        let mins = sEndHour * 60 + sEndMinute;

        if (s.orarioFine === "24:00" || (s.orarioFine === "00:00" && sStartHour >= 12)) {
          mins = 24 * 60;
        } else if (sEndHour < sStartHour) {
          mins += 24 * 60;
        }

        if (mins > lastEndTimeMin) lastEndTimeMin = mins;
      }
    });

    const startParts = inizio.split(":");
    if (startParts.length === 2) {
      const startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
      const nextStartAbsoluteMin = startMin + 24 * 60;

      // Exemption: night continuation (00:00 starts right after yesterday's 23:00-24:00)
      const isNightContinuation = (tipoTurno === "Notte" && inizio === "00:00" && prevShifts.some(s => s.tipoTurno === "Notte" && (s.orarioFine === "24:00" || s.orarioFine === "00:00" || s.orarioInizio === "23:00")));

      if (!isNightContinuation && lastEndTimeMin > 0 && (nextStartAbsoluteMin - lastEndTimeMin) < 11 * 60) {
        return false;
      }
    }

    // 4. Check strict 11-hour rest rule with NEXT day's existing shifts (e.g. Afternoon -> next Morning)
    const nextDateObj = new Date(dateStr);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateStr = formatDateYMD(nextDateObj);

    const nextShifts = currentShiftsList.filter(
      s => s.staffId === staffId && s.data === nextDateStr && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie"
    );

    const endParts = fine.split(":");
    if (endParts.length === 2) {
      const myStartHour = parseInt(inizio.split(":")[0], 10);
      const myEndHour = parseInt(endParts[0], 10);
      const myEndMinute = parseInt(endParts[1] || "0", 10);
      let myEndMin = myEndHour * 60 + myEndMinute;
      if (fine === "24:00" || (fine === "00:00" && myStartHour >= 12)) {
        myEndMin = 24 * 60;
      } else if (myEndHour < myStartHour) {
        myEndMin += 24 * 60;
      }

      const isThisShiftNightConnectingToNext = (tipoTurno === "Notte" && (fine === "24:00" || fine === "00:00" || fine === "07:00" || fine === "23:59"));
      const relevantNextShifts = nextShifts.filter(s => {
        if (isThisShiftNightConnectingToNext && s.tipoTurno === "Notte" && (s.orarioInizio === "00:00" || s.orarioInizio === "24:00")) {
          return false;
        }
        return true;
      });

      let earliestNextStartMin = 48 * 60;
      relevantNextShifts.forEach(s => {
        const nStartParts = s.orarioInizio.split(":");
        if (nStartParts.length === 2) {
          let mins = parseInt(nStartParts[0], 10) * 60 + parseInt(nStartParts[1], 10) + 24 * 60;
          if (mins < earliestNextStartMin) earliestNextStartMin = mins;
        }
      });

      if (earliestNextStartMin < 48 * 60 && (earliestNextStartMin - myEndMin) < 11 * 60) {
        return false;
      }
    }

    return true;
  };

  // Auto-generate Week Rotation Schedule for all structures
  const handleGenerateAutomaticShifts = () => {
    if (!onUpdateShifts) return;

    const targetDays = weekDays.slice(1); // Lun-Dom di questa settimana (esclusa domenica di riferimento)
    const activeStaff = staff.filter(m => m.attivo !== false);

    if (activeStaff.length === 0) {
      showToast("⚠️ Nessun operatore attivo in organico.");
      return;
    }

    // Keep ALL non-automatic shifts (manual work shifts, manual Riposo, Ferie, Notte, locked days, Sunday reference).
    // Only strip previous auto-generated placeholder shifts (`auto-`) on unlocked target days so they can be regenerated cleanly.
    let updatedShifts = shifts.filter(s => {
      const isTarget = targetDays.some(d => formatDateYMD(d) === s.data);
      if (!isTarget) return true; // Preserve non-target days & Sunday reference
      if (lockedDays.includes(s.data)) return true; // Preserve locked days
      // Preserve all manual/non-auto shifts (e.g. shift-..., shift-ferie-...)
      return !s.id.startsWith("auto-");
    });

    // 1. REGOLE NOTTE AUTOMATICA (5 notti consecutive dopo la prima notte manuale + riposo post 5 notti)
    // Se un operatore ha una notte manuale (o combo Pulizie + Notte), genera le successive notti per completare il blocco di 5 notti, poi assegna il riposo.
    activeStaff.forEach(m => {
      // Find manual night shifts in the target week
      const manualNights = updatedShifts.filter(s =>
        s.staffId === m.id &&
        (s.tipoTurno === "Notte" || (s.orarioInizio === "23:00" && s.orarioFine === "07:00")) &&
        !s.id.startsWith("auto-") &&
        targetDays.some(d => formatDateYMD(d) === s.data)
      );

      if (manualNights.length > 0) {
        // Sort by date to find the first night
        manualNights.sort((a, b) => a.data.localeCompare(b.data));
        const firstNight = manualNights[0];
        const firstNightDate = new Date(firstNight.data);

        // Generate next 4 nights (days 1 to 4 after first night)
        for (let i = 1; i <= 4; i++) {
          const nextNightDate = new Date(firstNightDate);
          nextNightDate.setDate(nextNightDate.getDate() + i);
          const nextNightDateStr = formatDateYMD(nextNightDate);

          const isTarget = targetDays.some(d => formatDateYMD(d) === nextNightDateStr);
          if (isTarget && !lockedDays.includes(nextNightDateStr)) {
            const hasExisting = updatedShifts.some(s => s.staffId === m.id && s.data === nextNightDateStr);
            if (!hasExisting) {
              updatedShifts.push({
                id: `auto-night-${Date.now()}-${m.id}-${i}-${Math.random().toString(36).substr(2, 4)}`,
                staffId: m.id,
                data: nextNightDateStr,
                tipoTurno: "Notte",
                orarioInizio: "23:00",
                orarioFine: "07:00",
                note: `Programmazione automatica (Notte ${i + 1}/5)`
              });
            }
          }
        }

        // Generate 2 rest days after 5 nights (days 5 and 6 after first night)
        for (let r = 5; r <= 6; r++) {
          const restDate = new Date(firstNightDate);
          restDate.setDate(restDate.getDate() + r);
          const restDateStr = formatDateYMD(restDate);

          const isTarget = targetDays.some(d => formatDateYMD(d) === restDateStr);
          if (isTarget && !lockedDays.includes(restDateStr)) {
            const hasExisting = updatedShifts.some(s => s.staffId === m.id && s.data === restDateStr);
            if (!hasExisting) {
              updatedShifts.push({
                id: `auto-rip-${Date.now()}-${m.id}-${r}-${Math.random().toString(36).substr(2, 4)}`,
                staffId: m.id,
                data: restDateStr,
                tipoTurno: "Riposo",
                orarioInizio: "00:00",
                orarioFine: "00:00",
                note: "Riposo programmatico post 5 notti"
              });
            }
          }
        }
      }
    });

    // Required structure slots per day
    const structureSlots: { struttura: string; tipoTurno: string; defaultStart: string; defaultEnd: string }[] = [
      { struttura: "Vannucci 1", tipoTurno: "Mattina", defaultStart: "07:00", defaultEnd: "14:00" },
      { struttura: "Vannucci 2", tipoTurno: "Mattina", defaultStart: "07:00", defaultEnd: "14:00" },
      { struttura: "Vannucci 4", tipoTurno: "Mattina", defaultStart: "08:00", defaultEnd: "15:00" },
      { struttura: "Vannucci 1", tipoTurno: "Pomeriggio", defaultStart: "14:00", defaultEnd: "21:00" },
      { struttura: "Vannucci 2", tipoTurno: "Pomeriggio", defaultStart: "15:00", defaultEnd: "22:00" },
      { struttura: "Vannucci 4", tipoTurno: "Pomeriggio", defaultStart: "15:00", defaultEnd: "22:00" },
    ];

    // Track total assigned work shifts per member across the week to balance workload
    const shiftCountMap: Record<string, number> = {};
    activeStaff.forEach(m => {
      const count = updatedShifts.filter(s =>
        s.staffId === m.id &&
        targetDays.some(d => formatDateYMD(d) === s.data) &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie"
      ).length;
      shiftCountMap[m.id] = count;
    });

    let rotationIndex = 0;

    targetDays.forEach((day, dayIndex) => {
      const dateYMD = formatDateYMD(day);

      // Skip locked days (preserved as-is)
      if (lockedDays.includes(dateYMD)) return;

      const assignedInDay = new Set<string>();

      // Mark staff who ALREADY have a shift (Work, Ferie, Notte, or manual Riposo) on this day as assigned
      updatedShifts.forEach(s => {
        if (s.data === dateYMD) {
          assignedInDay.add(s.staffId);
        }
      });

      // COUNT ALZATE (07:00 shifts in V1, V2, Pulizie)
      const countAlzate = () => {
        return updatedShifts.filter(s => 
          s.data === dateYMD && 
          s.orarioInizio === "07:00" && 
          (s.struttura === "Vannucci 1" || s.struttura === "Vannucci 2" || s.tipoTurno === "Pulizie")
        ).length;
      };

      structureSlots.forEach((slot, slotIndex) => {
        // Check if this structure slot (struttura + tipoTurno) is ALREADY satisfied by an existing shift on dateYMD
        const isSlotAlreadyCovered = updatedShifts.some(s =>
          s.data === dateYMD &&
          s.struttura === slot.struttura &&
          s.tipoTurno === slot.tipoTurno
        );

        if (isSlotAlreadyCovered) {
          // Slot is already satisfied by a manual or existing shift!
          return;
        }

        // DYNAMIC START TIME ADJUSTMENT FOR ALZATE RULE (Max 2 at 07:00)
        let start = slot.defaultStart;
        let end = slot.defaultEnd;

        // If assigning V1 or V2 Mattina and we already have 2 alzate (including Pulizie manual), push to 08:00
        if ((slot.struttura === "Vannucci 1" || slot.struttura === "Vannucci 2") && slot.tipoTurno === "Mattina" && start === "07:00") {
          // If we already have 2 shifts at 07:00 (e.g. Pulizie and one Vannucci), the next one goes to 08:00
          if (countAlzate() >= 2) {
            start = "08:00";
            end = "15:00";
          }
        }

        // Find valid candidate staff members who pass all rest rules and are not assigned yet today
        const candidates = activeStaff.filter(m => {
          if (assignedInDay.has(m.id)) return false;
          return checkCandidateShiftValidityForAuto(m.id, dateYMD, slot.tipoTurno, slot.struttura, start, end, updatedShifts);
        });

        // Sort candidates:
        // 1. Staff with fewer assigned work shifts this week first (workload balance)
        // 2. Tie-break using rotation offset
        candidates.sort((a, b) => {
          const countA = shiftCountMap[a.id] || 0;
          const countB = shiftCountMap[b.id] || 0;
          if (countA !== countB) return countA - countB;
          const idxA = (activeStaff.indexOf(a) + rotationIndex) % activeStaff.length;
          const idxB = (activeStaff.indexOf(b) + rotationIndex) % activeStaff.length;
          return idxA - idxB;
        });

        let chosenMember = candidates[0];

        // Safe Fallback: only pick staff members who are NOT assigned today and STILL pass the 11-hour rest constraint
        if (!chosenMember) {
          const fallbackCandidates = activeStaff.filter(m => {
            if (assignedInDay.has(m.id)) return false;
            return checkCandidateShiftValidityForAuto(m.id, dateYMD, slot.tipoTurno, slot.struttura, slot.defaultStart, slot.defaultEnd, updatedShifts);
          });

          fallbackCandidates.sort((a, b) => {
            const countA = shiftCountMap[a.id] || 0;
            const countB = shiftCountMap[b.id] || 0;
            return countA - countB;
          });

          chosenMember = fallbackCandidates[0];
        }

        if (chosenMember) {
          assignedInDay.add(chosenMember.id);
          shiftCountMap[chosenMember.id] = (shiftCountMap[chosenMember.id] || 0) + 1;

          updatedShifts.push({
            id: `auto-${Date.now()}-${dayIndex}-${slotIndex}-${Math.random().toString(36).substr(2, 4)}`,
            staffId: chosenMember.id,
            data: dateYMD,
            tipoTurno: slot.tipoTurno,
            orarioInizio: start,
            orarioFine: end,
            struttura: slot.struttura,
            note: "Programmazione automatica"
          });
        }
      });

      // Staff members not assigned a work shift today receive "Riposo"
      activeStaff.forEach(m => {
        if (!assignedInDay.has(m.id)) {
          updatedShifts.push({
            id: `auto-rip-${Date.now()}-${dayIndex}-${m.id}-${Math.random().toString(36).substr(2, 4)}`,
            staffId: m.id,
            data: dateYMD,
            tipoTurno: "Riposo",
            orarioInizio: "00:00",
            orarioFine: "00:00",
            note: "Riposo programmatico"
          });
        }
      });

      rotationIndex = (rotationIndex + 1) % activeStaff.length;
    });

    applyShiftsUpdate(updatedShifts);
    showToast("✨ Turni generati! Blocco di 5 notti e riposi rispettati secondo le regole.");
  };

  const checkPotentialShiftValidity = (
    staffId: string,
    dateStr: string,
    tipoTurno: string,
    struttura: string,
    inizio: string,
    fine: string,
    shiftIdToIgnore?: string
  ): { valid: boolean; reason?: string } => {
    if (tipoTurno === "Riposo" || tipoTurno === "Ferie") return { valid: true };

    // 0. New rule: Only one global night shift starting at 23:00, Cucina, or Pulizie per day
    if (tipoTurno === "Notte" && inizio === "23:00") {
      const nightStartingExists = shifts.some(s => 
        s.data === dateStr && 
        s.tipoTurno === "Notte" && 
        s.orarioInizio === "23:00" && 
        s.id !== shiftIdToIgnore
      );
      if (nightStartingExists) {
        return { 
          valid: false, 
          reason: `Il turno di Notte è già stato avviato per questo giorno (esiste già una notte che parte alle 23:00).` 
        };
      }
    } else if (["Cucina", "Pulizie"].includes(tipoTurno)) {
      const globalShiftExists = shifts.some(s => 
        s.data === dateStr && 
        s.tipoTurno === tipoTurno && 
        s.id !== shiftIdToIgnore
      );
      if (globalShiftExists) {
        return { 
          valid: false, 
          reason: `Il turno ${tipoTurno} è già presente in organico per questo giorno (assegnato ad un altro operatore).` 
        };
      }
    }

    // 0.5 Check max 2 operators starting at 07:00 on the same day (Alzate support: Vannucci 1 + Pulizie o V2)
    if (inizio === "07:00" && tipoTurno !== "Pulizie") {
      const staffStartingAt07 = shifts.filter(s =>
        s.data === dateStr &&
        s.id !== shiftIdToIgnore &&
        s.staffId !== staffId &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie" &&
        s.tipoTurno !== "Notte" &&
        s.orarioInizio === "07:00"
      ).length;

      if (staffStartingAt07 >= 2) {
        return {
          valid: false,
          reason: "Massimo 2 operatori alle 07:00 già assegnati (Alzate). Questo turno deve iniziare alle 08:00 (es. 08:00 - 15:00)."
        };
      }
    }

    // 1. Structure Coverage & Duplicate Rules
    const isV1 = (struttura === "Vannucci 1" || struttura === "Struttura 1");
    const isMorning = (tipoTurno === "Mattina");

    if (isV1 && isMorning) {
      // Check if on this day there is support for Vannucci 1 alzate 07:00-08:00:
      // 1. Pulizie (🪣🧹)
      // 2. Vannucci 2 morning shift starting at 07:00 (same floor connecting passage)
      const hasPulizie = shifts.some(s => 
        s.data === dateStr && 
        s.id !== shiftIdToIgnore && 
        s.tipoTurno !== "Riposo" && 
        s.tipoTurno !== "Ferie" &&
        (s.tipoTurno === "Pulizie" || ((s.orarioInizio === "07:00" && s.orarioFine === "11:00") || (s.note && s.note.toLowerCase().includes("puliz"))))
      );
      const hasV2MorningAt7 = shifts.some(s =>
        s.data === dateStr &&
        s.id !== shiftIdToIgnore &&
        (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2") &&
        s.tipoTurno === "Mattina" &&
        s.orarioInizio === "07:00" &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie"
      );
      const hasV1Support = hasPulizie || hasV2MorningAt7;

      const existingV1Morning = shifts.filter(s => 
        s.data === dateStr && 
        (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1") && 
        s.tipoTurno === "Mattina" && 
        s.id !== shiftIdToIgnore &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie"
      );

      const maxAllowed = hasV1Support ? 1 : 2;
      if (existingV1Morning.length >= maxAllowed) {
        if (hasPulizie) {
          return { valid: false, reason: "Vannucci 1: Turno Mattina già coperto (con supporto Pulizie 🪣🧹 per le alzate)" };
        } else if (hasV2MorningAt7) {
          return { valid: false, reason: "Vannucci 1: Turno Mattina già coperto (con supporto Vannucci 2 ore 07:00 per le alzate)" };
        } else {
          return { valid: false, reason: "Vannucci 1: Turno Mattina (alzate ore 07:00) già completo con 2 operatori" };
        }
      }
    } else if (struttura && !["Notte", "Cucina", "Pulizie", "Riposo", "Ferie"].includes(tipoTurno)) {
      const sameShifts = shifts.filter(s => 
        s.data === dateStr && 
        s.struttura === struttura && 
        s.tipoTurno === tipoTurno && 
        s.id !== shiftIdToIgnore &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie"
      );
      if (sameShifts.length > 0) {
        return { valid: false, reason: `Turno ${tipoTurno} già coperto in ${struttura}` };
      }
    }

    // Helper to calculate exact end time of a shift relative to 00:00 of its calendar day (in minutes)
    const getShiftEndInDayMins = (sInizio: string, sFine: string): number => {
      const startParts = sInizio.split(":");
      const startHour = parseInt(startParts[0], 10);
      
      const endParts = sFine.split(":");
      const endHour = parseInt(endParts[0], 10);
      const endMinute = parseInt(endParts[1] || "0", 10);
      const rawEndMins = endHour * 60 + endMinute;

      // "24:00" or ("00:00" if starting in afternoon/night) marks midnight of this day (1440 mins)
      if (sFine === "24:00" || (sFine === "00:00" && startHour >= 12)) {
        return 24 * 60;
      }
      // If end hour < start hour (e.g. 23:00 - 07:00), it crosses into the next day (+24h)
      if (endHour < startHour) {
        return 24 * 60 + rawEndMins;
      }
      // Normal shift ending on the same day (e.g. 07:00 - 14:00 -> 840, 00:00 - 07:00 -> 420, 14:00 - 21:00 -> 1260)
      return rawEndMins;
    };

    // 2. Check 11-hour rule with PREVIOUS day's shifts
    const targetDateObj = new Date(dateStr);
    targetDateObj.setDate(targetDateObj.getDate() - 1);
    const prevDateStr = formatDateYMD(targetDateObj);
    
    const prevShifts = shifts.filter(s => s.staffId === staffId && s.data === prevDateStr && s.id !== shiftIdToIgnore && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");
    
    let lastEndTimeMin = 0; 
    prevShifts.forEach(s => {
      const endMins = getShiftEndInDayMins(s.orarioInizio, s.orarioFine);
      if (endMins > lastEndTimeMin) {
        lastEndTimeMin = endMins;
      }
    });

    const startParts = inizio.split(":");
    const startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1] || "0", 10);
    const nextStartAbsoluteMin = startMin + 24 * 60; // relative to 00:00 of prevDateStr
    
    // Exemption: continuous night shift (e.g. 23:00-24:00 on prev day and 00:00-07:00 today)
    const isNightContinuation = (tipoTurno === "Notte" && inizio === "00:00" && prevShifts.some(s => s.tipoTurno === "Notte" && (s.orarioFine === "24:00" || s.orarioFine === "00:00" || s.orarioInizio === "23:00")));

    if (!isNightContinuation && lastEndTimeMin > 0 && (nextStartAbsoluteMin - lastEndTimeMin) < 11 * 60) {
      return { valid: false, reason: "Non rispetta le 11 ore di riposo dal turno precedente" };
    }
    
    // 3. Check rule with SAME day's shifts (allow 00:00-07:00 + 23:00-24:00 with 16h rest, 07:00-11:00 + 23:00-07:00 multi-shift with 12h rest, etc.)
    const sameDayShifts = shifts.filter(s => s.staffId === staffId && s.data === dateStr && s.id !== shiftIdToIgnore && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");
    let sameDayOverlap = false;
    let insufficientSameDayRest = false;

    sameDayShifts.forEach(s => {
      // Exemption: exact identical start time is an overlap
      if (s.orarioInizio === inizio) {
        sameDayOverlap = true;
        return;
      }

      const sStartParts = s.orarioInizio.split(":");
      const sStartMin = parseInt(sStartParts[0], 10) * 60 + parseInt(sStartParts[1] || "0", 10);
      const sEndMin = getShiftEndInDayMins(s.orarioInizio, s.orarioFine);

      const newStartParts = inizio.split(":");
      const newStartMin = parseInt(newStartParts[0], 10) * 60 + parseInt(newStartParts[1] || "0", 10);
      const newEndMin = getShiftEndInDayMins(inizio, fine);
      
      // Check interval overlap
      if (Math.max(newStartMin, sStartMin) < Math.min(newEndMin, sEndMin)) {
        sameDayOverlap = true;
      } else {
        // If not overlapping, check rest between same-day shifts
        const firstEnd = Math.min(sEndMin, newEndMin);
        const secondStart = Math.max(sStartMin, newStartMin);
        const gap = secondStart - firstEnd;
        if (gap < 11 * 60) {
          insufficientSameDayRest = true;
        }
      }
    });

    if (sameDayOverlap) {
      return { valid: false, reason: "Orari sovrapposti con un altro turno dello stesso operatore" };
    }
    if (insufficientSameDayRest) {
      return { valid: false, reason: "Meno di 11 ore di riposo tra i turni dello stesso giorno" };
    }

    // 4. Check 11-hour rule with NEXT day's shifts
    const nextDateObj = new Date(dateStr);
    nextDateObj.setDate(nextDateObj.getDate() + 1);
    const nextDateStr = formatDateYMD(nextDateObj);
    
    const nextShifts = shifts.filter(s => s.staffId === staffId && s.data === nextDateStr && s.id !== shiftIdToIgnore && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");
    
    const myEndMin = getShiftEndInDayMins(inizio, fine);
    
    // If this shift is an evening night shift continuing into tomorrow (e.g. 23:00-24:00), skip tomorrow's morning continuation (00:00-07:00)
    const isThisShiftNightConnectingToNext = (tipoTurno === "Notte" && (fine === "24:00" || fine === "00:00" || fine === "07:00" || fine === "23:59"));
    
    const relevantNextShifts = nextShifts.filter(s => {
      if (isThisShiftNightConnectingToNext && s.tipoTurno === "Notte" && (s.orarioInizio === "00:00" || s.orarioInizio === "24:00")) {
        return false;
      }
      return true;
    });

    let earliestNextStartMin = 48 * 60; 
    relevantNextShifts.forEach(s => {
      const nStartParts = s.orarioInizio.split(":");
      if (nStartParts.length === 2) {
        let mins = parseInt(nStartParts[0], 10) * 60 + parseInt(nStartParts[1] || "0", 10) + 24 * 60;
        if (mins < earliestNextStartMin) earliestNextStartMin = mins;
      }
    });

    if (earliestNextStartMin < 48 * 60 && (earliestNextStartMin - myEndMin) < 11 * 60) {
      return { valid: false, reason: "Non rispetta le 11 ore di riposo prima del turno del giorno successivo" };
    }
    
    return { valid: true };
  };

  const checkShiftValidity = (shift: Shift) => {
    return checkPotentialShiftValidity(shift.staffId, shift.data, shift.tipoTurno, shift.struttura, shift.orarioInizio, shift.orarioFine, shift.id);
  };

  const isStrutturaSatura = (struttura: string, data: string, shiftIdToIgnore?: string) => {
    const dayShifts = shifts.filter(s => s.data === data && s.struttura === struttura && s.id !== shiftIdToIgnore && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie");
    
    if (struttura === "Vannucci 1" || struttura === "Struttura 1") {
      const hasPulizie = shifts.some(s => 
        s.data === data && 
        s.id !== shiftIdToIgnore && 
        s.tipoTurno !== "Riposo" && 
        s.tipoTurno !== "Ferie" &&
        (s.tipoTurno === "Pulizie" || ((s.orarioInizio === "07:00" && s.orarioFine === "11:00") || (s.note && s.note.toLowerCase().includes("puliz"))))
      );
      const hasV2MorningAt7 = shifts.some(s =>
        s.data === data &&
        s.id !== shiftIdToIgnore &&
        (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2") &&
        s.tipoTurno === "Mattina" &&
        s.orarioInizio === "07:00" &&
        s.tipoTurno !== "Riposo" &&
        s.tipoTurno !== "Ferie"
      );
      const requiredMorning = (hasPulizie || hasV2MorningAt7) ? 1 : 2;
      const morningCount = dayShifts.filter(s => s.tipoTurno === "Mattina").length;
      const hasPomeriggio = dayShifts.some(s => s.tipoTurno === "Pomeriggio");
      return morningCount >= requiredMorning && hasPomeriggio;
    }

    const hasMattina = dayShifts.some(s => s.tipoTurno === "Mattina");
    const hasPomeriggio = dayShifts.some(s => s.tipoTurno === "Pomeriggio");
    return hasMattina && hasPomeriggio;
  };

  // Smart Shift Suggestion Interface
  interface SmartShiftSuggestion {
    tipoTurno: "Mattina" | "Pomeriggio" | "Notte";
    struttura: string;
    shortStruttura: string;
    orarioInizio: string;
    orarioFine: string;
    icon: string;
    reasonLabel: string;
    badgeStyle: string;
  }

  // Calcola il suggerimento intelligente per uno slot vuoto in base ai filtri attivi (Struttura e/o Fascia oraria)
  // REGOLA: suggerisce solo MATTINO e POMERIGGIO.
  // Se è attivo SIA il filtro struttura SIA il filtro Mattino/Pomeriggio, suggerisce direttamente quel turno per quella struttura con i suoi colori!
  // Una volta coperti i turni richiesti per quel giorno, NON suggerisce nulla.
  const getSmartShiftSuggestion = (dateStr: string): SmartShiftSuggestion | null => {
    if (isStaffRole || lockedDays.includes(dateStr)) return null;
    const isFilterActive = activeStrutturaFilters.length > 0 || activeTimeFilter !== null;
    if (!isFilterActive) return null;

    // Caso speciale Notte
    if (activeTimeFilter === 'notte') {
      return {
        tipoTurno: "Notte",
        struttura: "",
        shortStruttura: "Notte",
        orarioInizio: "23:00",
        orarioFine: "07:00",
        icon: "🌙",
        reasonLabel: "Notte",
        badgeStyle: "bg-blue-600 text-white border-2 border-blue-700 shadow-md ring-1 ring-blue-600/80"
      };
    }

    // Configurazione orari standard e colori per struttura
    const config = {
      v1: {
        mattina: { start: "07:00", end: "15:00" },
        pomeriggio: { start: "15:00", end: "23:00" },
        name: "Vannucci 1",
        short: "V1",
        badgeStyle: "bg-yellow-400 text-yellow-950 border-2 border-yellow-500 shadow-md ring-1 ring-yellow-500/50"
      },
      v2: {
        mattina: { start: "07:00", end: "14:00" },
        pomeriggio: { start: "14:00", end: "21:00" },
        name: "Vannucci 2",
        short: "V2",
        badgeStyle: "bg-orange-500 text-white border-2 border-orange-600 shadow-md ring-1 ring-orange-500/60"
      },
      v4: {
        mattina: { start: "08:00", end: "15:00" },
        pomeriggio: { start: "15:00", end: "20:00" },
        name: "Vannucci 4",
        short: "V4",
        badgeStyle: "bg-lime-300 text-lime-950 border-2 border-lime-500 shadow-md ring-1 ring-lime-400/50"
      }
    };

    const isShiftCovered = (structCode: 'v1' | 'v2' | 'v4', tipo: 'Mattina' | 'Pomeriggio') => {
      const sName = config[structCode].name;
      return shifts.some(s => 
        s.data === dateStr && 
        (s.struttura === sName || s.struttura === sName.replace("Vannucci", "Struttura")) && 
        s.tipoTurno === tipo
      );
    };

    // 1. SE È ATTIVO IL FILTRO "POMERIGGIO" (da solo o combinato con il filtro Struttura)
    if (activeTimeFilter === 'pomeriggio') {
      const candidateStructs: ('v1' | 'v2' | 'v4')[] = activeStrutturaFilters.length > 0 
        ? (activeStrutturaFilters as ('v1' | 'v2' | 'v4')[])
        : ['v1', 'v2', 'v4'];
      
      const target = candidateStructs.find(sc => !isShiftCovered(sc, "Pomeriggio"));
      if (!target) return null; // Pomeriggio già coperto per la/le struttura/e selezionata/e!

      const c = config[target];
      return {
        tipoTurno: "Pomeriggio",
        struttura: c.name,
        shortStruttura: c.short,
        orarioInizio: c.pomeriggio.start,
        orarioFine: c.pomeriggio.end,
        icon: "🌇",
        reasonLabel: `${c.short} Pomeriggio`,
        badgeStyle: c.badgeStyle
      };
    }

    // 2. SE È ATTIVO IL FILTRO "MATTINO" o "ALZATE" (da solo o combinato con il filtro Struttura)
    if (activeTimeFilter === 'mattino' || activeTimeFilter === 'alzate') {
      const candidateStructs: ('v1' | 'v2' | 'v4')[] = activeStrutturaFilters.length > 0 
        ? (activeStrutturaFilters as ('v1' | 'v2' | 'v4')[])
        : ['v1', 'v2', 'v4'];

      const target = candidateStructs.find(sc => !isShiftCovered(sc, "Mattina"));
      if (!target) return null; // Mattino già coperto per la/le struttura/e selezionata/e!

      const c = config[target];
      return {
        tipoTurno: "Mattina",
        struttura: c.name,
        shortStruttura: c.short,
        orarioInizio: c.mattina.start,
        orarioFine: c.mattina.end,
        icon: "🌅",
        reasonLabel: `${c.short} Mattino`,
        badgeStyle: c.badgeStyle
      };
    }

    // 3. SOLO FILTRO STRUTTURA ATTIVO (senza filtro orario): sequenza logica Mattino -> Pomeriggio
    if (activeStrutturaFilters.length > 0) {
      const candidateStructs = activeStrutturaFilters as ('v1' | 'v2' | 'v4')[];
      const target = candidateStructs.find(sc => !isShiftCovered(sc, "Mattina") || !isShiftCovered(sc, "Pomeriggio"));
      if (!target) return null; // Entrambi già coperti per tutte le strutture filtrate!

      const c = config[target];
      const hasM = isShiftCovered(target, "Mattina");
      const hasP = isShiftCovered(target, "Pomeriggio");

      // Inizia dal Mattino
      if (!hasM) {
        return {
          tipoTurno: "Mattina",
          struttura: c.name,
          shortStruttura: c.short,
          orarioInizio: c.mattina.start,
          orarioFine: c.mattina.end,
          icon: "🌅",
          reasonLabel: `${c.short} Mattino`,
          badgeStyle: c.badgeStyle
        };
      }

      // Se il Mattino c'è già, propone il Pomeriggio
      if (!hasP) {
        return {
          tipoTurno: "Pomeriggio",
          struttura: c.name,
          shortStruttura: c.short,
          orarioInizio: c.pomeriggio.start,
          orarioFine: c.pomeriggio.end,
          icon: "🌇",
          reasonLabel: `${c.short} Pomeriggio`,
          badgeStyle: c.badgeStyle
        };
      }
    }

    return null;
  };

  // Assegnazione istantanea con 1 click del turno suggerito
  const handleQuickAddSmartShift = (
    staffId: string,
    dateStr: string,
    suggestion: SmartShiftSuggestion
  ) => {
    if (isStaffRole) return;
    if (lockedDays.includes(dateStr)) {
      showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
      return;
    }

    if (suggestion.tipoTurno === "Notte") {
      handleQuickAddNightShift(staffId, dateStr);
      return;
    }

    const validity = checkPotentialShiftValidity(
      staffId,
      dateStr,
      suggestion.tipoTurno,
      suggestion.struttura,
      suggestion.orarioInizio,
      suggestion.orarioFine
    );
    if (!validity.valid) {
      showToast(`⚠️ Impossibile assegnare: ${validity.reason || "Non rispetta il riposo di 11 ore"}`, true);
      return;
    }

    const memberObj = staff.find(s => s.id === staffId);
    const memberName = memberObj ? `${memberObj.nome} ${memberObj.cognome}` : "Operatore";

    const newShiftObj: Shift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      staffId,
      data: dateStr,
      tipoTurno: suggestion.tipoTurno,
      orarioInizio: suggestion.orarioInizio,
      orarioFine: suggestion.orarioFine,
      struttura: suggestion.struttura,
      note: ""
    };

    const existingFiltered = shifts.filter(s => !(s.staffId === staffId && s.data === dateStr && (s.tipoTurno === "Riposo" || s.tipoTurno === "Ferie")));
    const updatedShiftsList = [...existingFiltered, newShiftObj];
    applyShiftsUpdate(updatedShiftsList);
    showToast(`⚡ ${suggestion.tipoTurno} (${suggestion.shortStruttura} ${suggestion.orarioInizio}-${suggestion.orarioFine}) assegnato con 1-Click a ${memberName}!`);
  };

  // Badge Color Styles for Turno Types (Varies color dynamically if shift hours are customized!)
  const getShiftBadgeStyle = (tipo: string, start?: string, end?: string, struttura?: string) => {
    // 1. TURNO DI NOTTE: Blu come richiesto (ex Nero)
    if (tipo === "Notte") {
      return "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 font-black shadow-xs ring-1 ring-blue-600/80";
    }

    // 1.3 TURNO PULIZIE: Verde Smeraldo / Teal con mocio e secchio 🪣🧹
    if (tipo === "Pulizie") {
      return "bg-teal-600 text-white border-teal-700 hover:bg-teal-700 font-black shadow-xs ring-1 ring-teal-600/80";
    }

    // 1.5 TURNO DI CUCINA: Azzurro molto diverso
    if (tipo === "Cucina") {
      return "bg-sky-100 text-sky-950 border-sky-300 hover:bg-sky-200 font-extrabold shadow-2xs ring-1 ring-sky-400/50";
    }

    // 2. FERIE: Sempre Ambra/Giallo
    if (tipo === "Ferie") {
      return "bg-amber-800 text-amber-50 border-amber-900 hover:bg-amber-900 font-black shadow-xs ring-2 ring-amber-800/50";
    }

    // 2.5 MALATTIA / RIPOSO MEDICO: Rosso/Rosa scuro 🤒
    if (tipo === "Malattia") {
      return "bg-rose-700 text-rose-50 border-rose-800 hover:bg-rose-800 font-black shadow-xs ring-2 ring-rose-700/50";
    }

    // 3. RIPOSO: Sempre Grigio chiaro
    if (tipo === "Riposo") {
      return "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200";
    }

    // 4. STRUTTURE COLORI DIVERSI (per Mattina, Pomeriggio, Reperibilità, ecc.)
    const normStruttura = struttura || "";
    if (normStruttura === "Vannucci 1" || normStruttura === "Struttura 1") {
      // Giallo intenso per V1
      return "bg-yellow-400 text-yellow-950 border-yellow-500 hover:bg-yellow-500 font-bold shadow-2xs ring-1 ring-yellow-500/50";
    } else if (normStruttura === "Vannucci 2" || normStruttura === "Struttura 2") {
      // Arancione vivo per V2
      return "bg-orange-500 text-white border-orange-600 hover:bg-orange-600 font-bold shadow-2xs ring-1 ring-orange-500/60";
    } else if (normStruttura === "Vannucci 4" || normStruttura === "Struttura 4") {
      // Verde chiaro
      return "bg-lime-300 text-lime-950 border-lime-400 hover:bg-lime-400 font-bold shadow-2xs ring-1 ring-lime-400/50";
    }

    // 5. FALLBACK IN ASSENZA DI STRUTTURA SPECIFICATA
    const isStandardMattina = tipo === "Mattina" && (start === "07:00" || !start) && (end === "14:00" || !end);
    const isStandardPomeriggio = tipo === "Pomeriggio" && (start === "14:00" || !start) && (end === "21:00" || !end);
    const isStandardReperibilita = tipo === "Reperibilità" && (start === "00:00" || !start) && (end === "23:59" || !end);

    const isStandard = isStandardMattina || isStandardPomeriggio || isStandardReperibilita;

    if (isStandard) {
      switch (tipo) {
        case "Mattina":
          return "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200";
        case "Pomeriggio":
          return "bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200";
        case "Reperibilità":
          return "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200";
        default:
          return "bg-blue-100 text-blue-900 border-blue-200";
      }
    } else {
      if (tipo === "Mattina") {
        return "bg-amber-200 text-amber-950 border-amber-400 hover:bg-amber-300 ring-1 ring-amber-500/80 shadow-2xs font-bold";
      } else if (tipo === "Pomeriggio") {
        return "bg-violet-100 text-violet-950 border-violet-400 hover:bg-violet-200 ring-1 ring-violet-500/80 shadow-2xs font-bold";
      } else if (tipo === "Reperibilità") {
        return "bg-teal-100 text-teal-950 border-teal-400 hover:bg-teal-200 ring-1 ring-teal-500/80 shadow-2xs font-bold";
      } else {
        return "bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200 ring-1 ring-rose-400/80 shadow-2xs font-bold";
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
    link.setAttribute("download", `Tabellone_Turni_${getFullMonthName(weekDays[1])}_${weekDays[1].getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("📊 File CSV per Google Sheets / Excel scaricato con successo!");
  };

  // PRINT / EXPORT PDF
  const printViaHiddenIframe = (contentHtml: string) => {
    const existingIframe = document.getElementById("shift-print-iframe");
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "shift-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(contentHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error("Print error:", e);
      }
    }, 300);
  };

  const handleExportPDF = () => {
    setShowExportModal(false);
    const activeStaff = displayedStaff.filter(m => m.attivo !== false);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tabellone Turni - Casa Famiglia Anzio</title>
        <style>
          @page { size: landscape; margin: 6mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 6px; background: #ffffff; }
          .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; }
          .header h1 { margin: 0; font-size: 16px; color: #1e293b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          .header p { margin: 3px 0 0 0; color: #475569; font-size: 10px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; table-layout: fixed; }
          th, td { border: 1px solid #cbd5e1; padding: 4px; text-align: left; vertical-align: top; word-wrap: break-word; }
          th { background-color: #f1f5f9; font-weight: 800; color: #334155; }
          .staff-th { width: 13%; background-color: #f8fafc; font-size: 10px; }
          .day-header { text-align: center; font-size: 9.5px; }
          .day-name { font-size: 10px; text-transform: uppercase; color: #2563eb; font-weight: 800; }
          .day-date { font-size: 8.5px; color: #64748b; font-weight: 600; }
          .ref-day { background-color: #f8fafc; opacity: 0.85; }
          .struct-header { background-color: #eff6ff; font-weight: 800; color: #1e40af; text-align: center; font-size: 11px; padding: 6px; }
          
          .shift-box { border-radius: 4px; padding: 2.5px 4px; margin-bottom: 2px; border: 1px solid transparent; font-size: 9px; }
          .shift-box-mattina { background: #fffbeb; border-color: #fcd34d; color: #78350f; }
          .shift-box-pomeriggio { background: #eef2ff; border-color: #c7d2fe; color: #312e81; }
          .shift-box-notte { background: #0f172a; border-color: #1e293b; color: #ffffff; }
          .shift-box-pulizie { background: #f0fdfa; border-color: #99f6e4; color: #115e59; }
          .shift-box-cucina { background: #e0f2fe; border-color: #7dd3fc; color: #0369a1; }
          .shift-box-ferie { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
          .shift-box-riposo { background: #f1f5f9; border-color: #e2e8f0; color: #64748b; font-style: italic; }
          
          .shift-top { display: flex; justify-content: space-between; align-items: center; font-weight: 800; }
          .shift-hours { font-family: monospace; font-size: 8px; font-weight: 700; opacity: 0.9; }
          .struct-tag { font-size: 7.5px; font-weight: 800; padding: 1px 3px; border-radius: 2px; background: rgba(255,255,255,0.9); display: inline-block; margin-top: 1px; }
          .struct-v1 { color: #ca8a04; border: 1px solid #fde047; }
          .struct-v2 { color: #ea580c; border: 1px solid #fdba74; }
          .struct-v4 { color: #16a34a; border: 1px solid #86efac; }
          
          .footer { margin-top: 10px; text-align: right; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Casa Famiglia Anzio - Tabellone Turni</h1>
          <p>Settimana dal ${formatDateIT(weekDays[1] || weekDays[0])} al ${formatDateIT(weekDays[weekDays.length - 1])}</p>
        </div>

        ${viewMode === 'struttura' ? `
          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Struttura</th>
                ${weekDays.map((d, idx) => `
                  <th class="day-header ${idx === 0 ? 'ref-day' : ''}">
                    <div class="day-name">${idx === 0 ? 'Dom. Prec.' : d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                    <div class="day-date">${d.getDate()}/${d.getMonth()+1}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${STRUTTURE.map(struct => `
                <tr>
                  <td class="struct-header" style="vertical-align: middle;">${struct.nome}</td>
                  ${weekDays.map(d => {
                    const dateStr = formatDateYMD(d);
                    const dayShifts = shifts.filter(s => s.data === dateStr && s.struttura === struct.nome);
                    return `
                      <td>
                        ${dayShifts.length === 0 ? '<div style="color:#cbd5e1; text-align:center; font-style:italic; font-size:9px;">-</div>' : dayShifts.map(s => {
                          const staffM = staff.find(m => m.id === s.staffId);
                          const boxClass = s.tipoTurno === "Mattina" ? "shift-box-mattina" : s.tipoTurno === "Pomeriggio" ? "shift-box-pomeriggio" : "shift-box-riposo";
                          return `
                            <div class="shift-box ${boxClass}">
                              <div class="shift-top">
                                <span>${s.tipoTurno}</span>
                                <span class="shift-hours">${s.orarioInizio}-${s.orarioFine}</span>
                              </div>
                              <div style="font-weight:700; font-size:8.5px; margin-top:1px;">${staffM ? staffM.nome : 'Non assegnato'}</div>
                            </div>
                          `;
                        }).join('')}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <table>
            <thead>
              <tr>
                <th class="staff-th">Operatore</th>
                ${weekDays.map((d, idx) => `
                  <th class="day-header ${idx === 0 ? 'ref-day' : ''}">
                    <div class="day-name">${idx === 0 ? 'Dom. Prec.' : d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                    <div class="day-date">${d.getDate()}/${d.getMonth()+1}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${activeStaff.map(member => `
                <tr>
                  <td style="font-weight: 800; vertical-align: middle; background-color: #f8fafc; font-size: 9.5px;">${member.nome}</td>
                  ${weekDays.map((d, idx) => {
                    const dateStr = formatDateYMD(d);
                    const memberShifts = shifts.filter(s => s.staffId === member.id && s.data === dateStr);
                    if (memberShifts.length === 0) {
                      return `<td class="${idx === 0 ? 'ref-day' : ''}"><div class="shift-box shift-box-riposo">🛋️ Riposo</div></td>`;
                    }
                    return `
                      <td class="${idx === 0 ? 'ref-day' : ''}">
                        ${memberShifts.map(s => {
                          let boxClass = "shift-box-mattina";
                          let icon = "🌅";
                          if (s.tipoTurno === "Pomeriggio") { boxClass = "shift-box-pomeriggio"; icon = "🌆"; }
                          else if (s.tipoTurno === "Notte") { boxClass = "shift-box-notte"; icon = "🌙"; }
                          else if (s.tipoTurno === "Pulizie") { boxClass = "shift-box-pulizie"; icon = "🪣🧹"; }
                          else if (s.tipoTurno === "Cucina") { boxClass = "shift-box-cucina"; icon = "🍲"; }
                          else if (s.tipoTurno === "Ferie") { boxClass = "shift-box-ferie"; icon = "🏖️"; }
                          else if (s.tipoTurno === "Riposo") { boxClass = "shift-box-riposo"; icon = "🛋️"; }

                          const structClass = s.struttura === "Vannucci 1" ? "struct-v1" : s.struttura === "Vannucci 2" ? "struct-v2" : "struct-v4";

                          return `
                            <div class="shift-box ${boxClass}">
                              <div class="shift-top">
                                <span>${icon} ${s.tipoTurno}</span>
                                ${s.tipoTurno !== "Ferie" && s.tipoTurno !== "Riposo" ? `<span class="shift-hours">${s.orarioInizio}-${s.orarioFine}</span>` : ''}
                              </div>
                              ${s.struttura && !["Notte", "Riposo", "Ferie", "Cucina", "Pulizie"].includes(s.tipoTurno) ? `
                                <div class="struct-tag ${structClass}">Vannucci ${s.struttura.replace(/\D/g, '')}</div>
                              ` : ''}
                            </div>
                          `;
                        }).join('')}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <div class="footer">
          Stampato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')} - Casa Famiglia Anzio
        </div>
      </body>
      </html>
    `;

    printViaHiddenIframe(html);
  };

  const handleExportWeeklyPDF = () => {
    handleExportPDF();
  };

  const handleExportMonthlyPDF = () => {
    const activeStaff = displayedStaff.filter(m => m.attivo !== false);
    const monthDaysCount = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: monthDaysCount }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1));

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Riepilogo Mensile Turni - Casa Famiglia Anzio</title>
        <style>
          @page { size: landscape; margin: 6mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 10px; background: #ffffff; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px; }
          .header h1 { margin: 0; font-size: 16px; color: #1e293b; font-weight: 800; text-transform: uppercase; }
          .header p { margin: 3px 0 0 0; color: #475569; font-size: 11px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; }
          th, td { border: 1px solid #cbd5e1; padding: 3px; text-align: center; vertical-align: top; font-size: 8.5px; word-wrap: break-word; }
          th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
          .staff-col { text-align: left; font-weight: bold; background-color: #f8fafc; font-size: 9.5px; width: 110px; }
          .shift-tag { font-size: 8px; font-weight: bold; padding: 1px; margin-bottom: 1px; border-radius: 2px; }
          .tag-m { background: #dbeafe; color: #1e40af; }
          .tag-p { background: #e0e7ff; color: #3730a3; }
          .tag-n { background: #f1f5f9; color: #334155; }
          .tag-r { color: #94a3b8; font-style: italic; }
          .footer { margin-top: 10px; text-align: right; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Casa Famiglia Anzio - Riepilogo Mensile Turni</h1>
          <p>Mese di ${getFullMonthName(currentDate).toUpperCase()} ${currentDate.getFullYear()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="staff-col">Operatore</th>
              ${daysArray.map(d => `
                <th>
                  <div>${d.toLocaleDateString('it-IT', { weekday: 'narrow' })}</div>
                  <div style="font-size: 8px; color: #64748b;">${d.getDate()}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${activeStaff.map(member => `
              <tr>
                <td class="staff-col">${member.nome}</td>
                ${daysArray.map(d => {
                  const dateStr = formatDateYMD(d);
                  const memberShifts = shifts.filter(s => s.staffId === member.id && s.data === dateStr);
                  if (memberShifts.length === 0) {
                    return `<td class="tag-r">R</td>`;
                  }
                  return `
                    <td>
                      ${memberShifts.map(s => `
                        <div class="shift-tag ${s.tipoTurno.startsWith('M') ? 'tag-m' : s.tipoTurno.startsWith('P') ? 'tag-p' : 'tag-n'}">
                          ${s.tipoTurno.charAt(0)}
                        </div>
                      `).join('')}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Stampato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')} - Casa Famiglia Anzio
        </div>
      </body>
      </html>
    `;

    printViaHiddenIframe(html);
  };

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

  // Helpers to check if a global shift already exists for the selected date in Add Modal
  const hasNotteOnSelectedDay = shifts.some(s => s.data === newDate && s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00")));
  const hasCucinaOnSelectedDay = shifts.some(s => s.data === newDate && s.tipoTurno === "Cucina");
  const hasPulizieOnSelectedDay = shifts.some(s => s.data === newDate && s.tipoTurno === "Pulizie");

  // Helpers to check if a global shift already exists for the selected date in Edit Modal
  const hasNotteOnEditDay = shifts.some(s => s.data === editShiftDate && s.tipoTurno === "Notte" && (s.orarioInizio === "23:00" || (s.orarioInizio !== "00:00" && s.orarioFine === "07:00")) && s.id !== selectedShiftForDetail?.id);
  const hasCucinaOnEditDay = shifts.some(s => s.data === editShiftDate && s.tipoTurno === "Cucina" && s.id !== selectedShiftForDetail?.id);
  const hasPulizieOnEditDay = shifts.some(s => s.data === editShiftDate && s.tipoTurno === "Pulizie" && s.id !== selectedShiftForDetail?.id);

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
      
      {/* PUBLIC READ ONLY / PERSONAL STAFF VIEW NOTICE BANNER */}
      {isStaffRole && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border border-indigo-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-3 font-bold">
            <span className="px-2.5 py-1 bg-emerald-500/30 border border-emerald-400 text-emerald-200 rounded-lg text-[10px] font-mono tracking-wider uppercase shrink-0">
              🔒 VISTA RISERVATA
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-indigo-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <strong>Vista Personale Riservata {loggedInStaffMember ? `(${loggedInStaffMember.nome} ${loggedInStaffMember.cognome})` : currentUser?.username ? `(${currentUser.username})` : ""}:</strong> Stai visualizzando esclusivamente i tuoi turni, le tue ferie e i tuoi riposi settimanali.
              </span>
              <span className="text-[11px] text-indigo-300 font-normal">
                I turni e i dati degli altri operatori sono protetti e non sono visibili a garanzia della tua privacy.
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
            title="Ricarica i tuoi turni dal server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Aggiorna ora</span>
          </button>
        </div>
      )}

      {/* SIDEBAR + MAIN CONTENT LAYOUT CONTAINER */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Toggle Button when Turni Sidebar is Collapsed */}
        {turniSidebarCollapsed && (
          <button
            type="button"
            onClick={toggleTurniSidebar}
            title="Mostra Menu Turni & Opzioni"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-indigo-200 font-bold text-xs rounded-2xl border border-slate-700 shadow-xl cursor-pointer transition-all shrink-0"
          >
            <PanelLeft className="w-4 h-4 text-emerald-400" />
            <span>Menu Turni</span>
          </button>
        )}

        {/* LEFT SIDEBAR MENU */}
        {!turniSidebarCollapsed && (
          <aside className="w-full lg:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col rounded-3xl border border-slate-800 shadow-xl z-30 p-4 space-y-4 lg:sticky lg:top-4 transition-all">
            {/* Brand Logo & Title */}
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-black text-white text-sm tracking-tight leading-tight">Casa Famiglia</h1>
                  <p className="text-[10px] text-indigo-400 font-semibold">Anzio • Turni H24</p>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={toggleTurniSidebar}
                title="Nascondi Menu Turni"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4 text-indigo-300" />
              </button>
            </div>

          {/* Navigation Menu */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 py-1">
              Menu Principale
            </div>

            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all text-left cursor-pointer ${
                viewMode === "week"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <CalendarDays className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Tabellone Settimanale</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all text-left cursor-pointer ${
                viewMode === "month"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Riepilogo Mensile</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("roster")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-xs transition-all text-left cursor-pointer ${
                viewMode === "roster"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Users className="w-4 h-4 text-indigo-300 shrink-0" />
              <div className="flex-1 flex items-center justify-between">
                <span>Gestione Operatori</span>
                <span className="bg-slate-800 text-slate-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {staff.filter(m => m.attivo !== false).length}
                </span>
              </div>
            </button>
          </div>

          {/* Quick Action Buttons */}
          {!isPublicView && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 py-1">
                Azioni Rapide
              </div>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>+ Nuovo Turno</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAutomaticShifts}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>⚡ Genera Auto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/30 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>+ Operatore</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Stampa / Esporta</span>
                </button>
              </div>
            </div>
          )}

          {/* Sidebar Footer */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="font-semibold">Casa Famiglia Anzio</span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </aside>
        )}

        {/* RIGHT MAIN CONTENT AREA */}
        <div className="flex-1 min-w-0 w-full space-y-6">
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
          
          {/* UNDO / REDO ACTION BUTTONS (ROTONDE A SINISTRA E DESTRA) */}
          {!isPublicView && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200" title="Annulla / Ripristina modifiche">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                  historyIndex > 0
                    ? "bg-white text-indigo-700 shadow-sm hover:bg-indigo-50 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-50"
                }`}
                title="Annulla ultima azione (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4 stroke-[2.5px]" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1}
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                  historyIndex < historyStack.length - 1
                    ? "bg-white text-indigo-700 shadow-sm hover:bg-indigo-50 cursor-pointer"
                    : "text-slate-300 cursor-not-allowed opacity-50"
                }`}
                title="Ripristina azione annullata (Ctrl+Y / Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>
          )}

          {/* GENERATE / DELETE ACTIONS - MOVED HERE FOR BETTER VISIBILITY */}
          {!isPublicView && onUpdateShifts && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handleGenerateAutomaticShifts}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[10px] uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title="Genera automaticamente i turni della settimana"
              >
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Genera Turni</span>
              </button>

              <button
                onClick={handleDeleteWeekShifts}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-lg text-[10px] uppercase flex items-center gap-1.5 transition-all shadow-sm cursor-pointer whitespace-nowrap"
                title="Cancella tutti i turni della settimana corrente"
              >
                <Trash2 className="w-3 h-3" />
                <span>Cancella Settimana</span>
              </button>
            </div>
          )}

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

          {/* SICK LEAVE / MALATTIA BUTTON */}
          <button
            onClick={() => handleOpenSickModal()}
            className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            title="Registra Malattia o Riposo Medico"
          >
            <AlertCircle className="w-4 h-4 text-white" />
            <span>Inserisci Malattia / Medico</span>
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAutomaticShifts}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Genera automaticamente i turni per tutte le strutture (Struttura 1 dalle 07:00, Struttura 2 e 3 dalle 08:00)"
              >
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>⚡ Genera Turni</span>
              </button>

              <button
                onClick={handleDeleteWeekShifts}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Cancella tutti i turni non bloccati della settimana corrente"
              >
                <Trash2 className="w-4 h-4" />
                <span>Cancella Settimana</span>
              </button>
            </div>
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
        
        {/* Date Selector Controls - Prominent & Visible Buttons for easy navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={viewMode === "month" ? handlePrevMonth : handlePrevWeek}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer transform active:scale-95"
            title={viewMode === "month" ? "Mese precedente" : "Settimana precedente"}
          >
            <ChevronLeft className="w-4 h-4 text-indigo-700 stroke-[3px]" />
            <span>{viewMode === "month" ? "Mese Prec." : "Settimana Prec."}</span>
          </button>

          <button
            onClick={handleToday}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs border border-slate-300 transition-all cursor-pointer transform active:scale-95"
          >
            Oggi
          </button>

          <button
            onClick={viewMode === "month" ? handleNextMonth : handleNextWeek}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-200 text-indigo-700 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition-all cursor-pointer transform active:scale-95"
            title={viewMode === "month" ? "Mese successivo" : "Settimana successiva"}
          >
            <span>{viewMode === "month" ? "Mese Succ." : "Settimana Succ."}</span>
            <ChevronRight className="w-4 h-4 text-indigo-700 stroke-[3px]" />
          </button>

          <span className="text-sm font-extrabold text-slate-800 ml-2">
            {viewMode === "month"
              ? `Mese di ${getFullMonthName(currentDate).toUpperCase()} ${currentDate.getFullYear()}`
              : `dal ${weekDays[1].getDate()} ${getFullMonthName(weekDays[1])} al ${weekDays[7].getDate()} ${getFullMonthName(weekDays[7])} ${weekDays[7].getFullYear()}`
            }
          </span>
        </div>

        {/* View Switcher, Operator Filter & Full Screen Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* OPERATOR FILTER / PRIVACY INDICATOR */}
          {!isStaffRole ? (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-extrabold text-slate-600 flex items-center gap-1 pl-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Operatore:</span>
              </span>
              <select
                value={selectedStaffFilterId}
                onChange={(e) => setSelectedStaffFilterId(e.target.value)}
                className="bg-white text-slate-900 border border-slate-300 font-bold rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">👥 Tutti gli Operatori ({staff.length})</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    👤 {s.nome} {s.cognome} ({s.ruolo})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-900 shadow-2xs">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Vista Personale: <strong>{loggedInStaffMember ? `${loggedInStaffMember.nome} ${loggedInStaffMember.cognome}` : (currentUser?.username || "Dipendente")}</strong></span>
              <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wide">
                Solo i tuoi turni
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
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
              {isStaffRole ? "Scheda Personale" : `Schede Operatori (${displayedStaff.length})`}
            </button>
          </div>

          {(viewMode === "week" || viewMode === "month") && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer whitespace-nowrap"
              title={isFullScreen ? "Esci da Schermo Intero" : "Attiva Schermo Intero"}
            >
              <span>{isFullScreen ? "Esci Schermo Intero ✖" : "🖥️ Schermo Intero"}</span>
            </button>
          )}
        </div>
      </div>



      {/* WEEKLY CALENDAR MATRIX VIEW */}
      {viewMode === "week" && (
        <div className={isFullScreen ? "fixed inset-0 z-45 bg-slate-50 p-4 sm:p-6 overflow-auto flex flex-col h-screen" : ""}>
          {isFullScreen && (
            <div className="flex flex-wrap items-center justify-between bg-indigo-900 text-white p-2.5 rounded-xl mb-3 shadow-md shrink-0 gap-2 border border-indigo-800 text-xs">
              {/* Left: View Mode Toggle & Direct Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <div className="flex items-center gap-1 bg-indigo-950 p-1 rounded-lg border border-indigo-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "week"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    📅 Settimanale
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "month"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    🗓️ Mensile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWeekShifts}
                    className={`px-3 py-1 rounded-md text-xs font-black bg-rose-600 text-white shadow-xs hover:bg-rose-500 transition-all cursor-pointer whitespace-nowrap`}
                  >
                    🗑️ Cancella Settimana
                  </button>
                </div>

                {/* Interactive Weekly Filters */}
                <div className="flex items-center gap-1.5 bg-indigo-950 p-1.5 rounded-xl border border-indigo-700/50 shadow-2xl shrink-0">
                  <span className="text-[10px] font-bold text-indigo-400 px-1.5 uppercase tracking-tighter">Filtra:</span>
                  
                  {/* Primary Filters (Alzate, V1, V2, V4, Notte) - EXCLUSIVE Group */}
                  <div className="flex items-center gap-1.5 border-r border-indigo-800 pr-3 mr-1.5">
                    {/* Alzate */}
                    <button
                      type="button"
                      onClick={() => handleTimeFilterClick("alzate")}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                        activeTimeFilter === "alzate" 
                          ? "bg-amber-500 text-white shadow-lg ring-2 ring-amber-300 scale-105" 
                          : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                      }`}
                      title="Filtra per Alzate (07:00)"
                    >
                      ⏰ Alzate
                    </button>

                    {/* V1 */}
                    <button
                      type="button"
                      onClick={() => handleStrutturaFilterClick("v1")}
                      className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                        activeStrutturaFilters.includes("v1") 
                          ? "bg-yellow-400 text-yellow-950 shadow-lg ring-2 ring-yellow-500 scale-105" 
                          : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                      }`}
                      title="Filtra per VANNUCCI 1"
                    >
                      V1
                    </button>

                    {/* V2 */}
                    <button
                      type="button"
                      onClick={() => handleStrutturaFilterClick("v2")}
                      className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                        activeStrutturaFilters.includes("v2") 
                          ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-400 scale-105" 
                          : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                      }`}
                      title="Filtra per VANNUCCI 2"
                    >
                      V2
                    </button>

                    {/* V4 */}
                    <button
                      type="button"
                      onClick={() => handleStrutturaFilterClick("v4")}
                      className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                        activeStrutturaFilters.includes("v4") 
                          ? "bg-lime-300 text-lime-950 shadow-lg ring-2 ring-lime-400 scale-105" 
                          : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                      }`}
                      title="Filtra per VANNUCCI 4"
                    >
                      V4
                    </button>

                    {/* Notte */}
                    <button
                      type="button"
                      onClick={() => handleTimeFilterClick("notte")}
                      className={`px-2.5 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                        activeTimeFilter === "notte" 
                          ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400 scale-105" 
                          : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                      }`}
                      title="Filtra per turni di Notte"
                    >
                      🌙 Notte
                    </button>
                  </div>

                  {/* Range Filters (Mattina, Pomeriggio) - SECONDARY Group */}
                  <div className="flex items-center gap-3 pl-2">
                    {(["mattino", "pomeriggio"] as const).map((type) => {
                      const isActive = activeTimeFilter === type;
                      const config = {
                        mattino: { label: "☀️ Mattina", activeClass: "bg-sky-500 ring-sky-300", title: "Filtra per turni di Mattina" },
                        pomeriggio: { label: "🌤️ Pom.", activeClass: "bg-emerald-600 ring-emerald-300", title: "Filtra per turni di Pomeriggio" }
                      };
                      const { label, activeClass, title } = config[type];
                      
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTimeFilterClick(type)}
                          className={`px-3 py-1.5 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 cursor-pointer ${
                            isActive 
                              ? `${activeClass} text-white shadow-lg ring-2 scale-105` 
                              : "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/60 hover:text-white"
                          }`}
                          title={title}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Month Selector Input */}
                <div className="flex items-center gap-1.5 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-700 shrink-0" title="Seleziona Mese e Anno">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-200 hidden sm:inline">Mese:</span>
                  <input
                    type="month"
                    value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-").map(Number);
                        const nextD = new Date(currentDate);
                        nextD.setFullYear(y);
                        nextD.setMonth(m - 1);
                        setCurrentDate(nextD);
                      }
                    }}
                    className="bg-indigo-900 border border-indigo-600 text-white text-xs font-bold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Center: Navigation Controls & Period Label */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrevWeek}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Settimana Precedente"
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>Prec.</span>
                </button>
                
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Vai a oggi"
                >
                  Oggi
                </button>

                <button
                  onClick={handleNextWeek}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Settimana Successiva"
                >
                  <span>Succ.</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
                </button>

                <span className="text-[11px] sm:text-xs font-semibold bg-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-700 whitespace-nowrap text-amber-200">
                  dal {weekDays[1].getDate()} {getFullMonthName(weekDays[1])} al {weekDays[7].getDate()} {getFullMonthName(weekDays[7])} {weekDays[7].getFullYear()}
                </span>
              </div>

              {/* Right: Actions & Exit Fullscreen */}
              <div className="flex items-center gap-1.5 shrink-0">
                {!isPublicView && (
                  <div className="flex items-center gap-1 bg-indigo-950 p-1 rounded-lg border border-indigo-700">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className={`p-1 rounded transition-all flex items-center justify-center ${
                        historyIndex > 0
                          ? "bg-indigo-800 text-white hover:bg-indigo-700 cursor-pointer"
                          : "text-indigo-400 opacity-40 cursor-not-allowed"
                      }`}
                      title="Annulla ultima azione (Ctrl+Z)"
                    >
                      <Undo2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= historyStack.length - 1}
                      className={`p-1 rounded transition-all flex items-center justify-center ${
                        historyIndex < historyStack.length - 1
                          ? "bg-indigo-800 text-white hover:bg-indigo-700 cursor-pointer"
                          : "text-indigo-400 opacity-40 cursor-not-allowed"
                      }`}
                      title="Ripristina azione annullata (Ctrl+Y / Ctrl+Shift+Z)"
                    >
                      <Redo2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </button>
                  </div>
                )}
                {!isPublicView && onUpdateShifts && (
                  <button
                    onClick={handleGenerateAutomaticShifts}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shadow flex items-center gap-1"
                    title="Genera automaticamente i turni per le 3 strutture"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>⚡ Genera Turni</span>
                  </button>
                )}
                <button
                  onClick={handleExportWeeklyPDF}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Esporta in PDF</span>
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1 font-extrabold whitespace-nowrap"
                >
                  <span>Esci Schermo Intero ✖</span>
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative group/calendar flex-1 flex flex-col">
          
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
          <div className={`w-full ${isFullScreen ? "overflow-y-auto overflow-x-hidden flex-1 max-h-[calc(100vh-70px)]" : "overflow-auto max-h-[calc(100vh-250px)]"}`}>
            <table id="weekly-schedule-table" className={`w-full text-left border-collapse ${isFullScreen ? "table-fixed min-w-0" : "min-w-[1150px] sm:min-w-[1300px]"}`}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-700">
                  <th className={`border-r border-slate-200 sticky top-0 left-0 z-40 bg-slate-100 shadow-xs ${isFullScreen ? "w-[15%] min-w-0 p-2.5" : "w-48 min-w-[190px] p-4"}`}>
                    <span className="md:hidden">Operatore</span>
                    <span className="hidden md:inline">Operatore / Ruolo</span>
                  </th>
                  {weekDays.map((day, idx) => {
                    const dateYMD = formatDateYMD(day);
                    const isToday = dateYMD === todayStr;
                    const isDragOver = dragOverTargetDate === dateYMD;
                    const isHolding = holdingDayDate === dateYMD;
                    const dayShiftsCount = shifts.filter(s => s.data === dateYMD).length;
                    
                    const isReferenceDay = idx === 0; // Domenica precedente (riferimento)
                    const isEffectivelyLocked = lockedDays.includes(dateYMD) || isReferenceDay;

                    return (
                      <th
                        key={idx}
                        data-date={dateYMD}
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
                          if (!isPublicView && !isReferenceDay) handleMouseDownDay(dateYMD, e);
                        }}
                        onMouseUp={handleMouseUpDay}
                        onTouchStart={(e) => {
                          if (!isPublicView && !isReferenceDay) handleMouseDownDay(dateYMD, e);
                        }}
                        onTouchEnd={handleMouseUpDay}
                        
                         className={`text-center transition-all select-none relative group sticky top-0 z-30 whitespace-nowrap overflow-hidden ${
                          isFullScreen ? "w-[12.5%] min-w-0 p-1.5" : "w-[155px] min-w-[155px] p-3"
                        } ${
                          isPublicView ? "" : "cursor-grab active:cursor-grabbing"
                        } ${
                          isDayComplete(dateYMD) && !isReferenceDay
                            ? "border-x-2 border-t-2 border-emerald-500 shadow-xs"
                            : "border-r border-slate-200 last:border-r-0"
                        } ${
                          isReferenceDay
                            ? "bg-slate-100 text-slate-500 border-x-4 border-slate-300 shadow-inner"
                            : isDragOver
                            ? "bg-indigo-100 text-indigo-900 border-indigo-400 ring-2 ring-indigo-400"
                            : isHolding
                            ? "bg-amber-200 text-amber-950 animate-pulse"
                            : isToday
                            ? "bg-white text-indigo-950 border-b-2 border-indigo-500 shadow-sm opacity-100"
                            : "bg-slate-50 hover:bg-slate-100 opacity-100"
                        }`}
                      >
                        {/* Long Press Visual Indicator */}
                        {isHolding && !isReferenceDay && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
                        )}

                        <div className={`flex flex-col items-center justify-center space-y-1.5 py-1 ${isReferenceDay ? 'opacity-80' : ''}`}>
                          {isReferenceDay && (
                            <span className="absolute -top-1 bg-slate-300 text-slate-700 text-[9px] px-2 py-0.5 rounded-b-md font-bold shadow-sm">RIFERIMENTO</span>
                          )}
                          {(() => {
                            const festivo = isItalianFestivo(day);
                            const prefestivo = isItalianPrefestivo(day);
                            let weekdayColor = "text-indigo-600/90";
                            let dateColor = isToday ? "text-indigo-800" : "text-slate-800";
                            if (festivo.isFestivo) {
                              weekdayColor = "text-red-600";
                              dateColor = isToday ? "text-red-700" : "text-red-600";
                            } else if (prefestivo.isPrefestivo) {
                              weekdayColor = "text-orange-500";
                              dateColor = isToday ? "text-orange-700" : "text-orange-600";
                            }
                            return (
                              <>
                                <span className={`uppercase text-[11px] font-black tracking-widest flex items-center gap-1 justify-center ${weekdayColor}`} title={festivo.isFestivo ? festivo.label : prefestivo.isPrefestivo ? prefestivo.label : undefined}>
                                  {getFullWeekdayName(day)}
                                </span>
                                <div onContextMenu={(e) => handleDateContextMenu(e, dateYMD)} className={`text-sm sm:text-[15px] font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${isToday ? `bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 ${dateColor}` : dateColor} flex items-center justify-center gap-1 cursor-help`} title={festivo.isFestivo ? festivo.label : prefestivo.isPrefestivo ? prefestivo.label : undefined}>
                                  {day.getDate()} {getFullMonthName(day)} {day.getFullYear()}
                                </div>
                              </>
                            );
                          })()}
                        </div>

                        {!isStaffRole && !isReferenceDay && (
                          <>
                            {/* LOCK TOGGLE BUTTON */}
                            <button
                              type="button"
                              onClick={(e) => toggleLockDay(dateYMD, e)}
                              className="absolute top-2 left-2 p-1 rounded-lg transition-all duration-150 transform hover:scale-125 cursor-pointer z-40"
                              title={lockedDays.includes(dateYMD) ? "Sblocca questo giorno" : "Blocca questo giorno per evitare modifiche accidentali"}
                            >
                              {lockedDays.includes(dateYMD) ? (
                                <Lock className="w-4 h-4 text-rose-600 fill-rose-600/10" />
                              ) : (
                                <Unlock className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            {/* TRASH ICON FOR ENTIRE DAY */}
                            <button
                              type="button"
                              onClick={(e) => {
                                if (lockedDays.includes(dateYMD)) {
                                  showToast("🔒 Giorno bloccato! Sbloccalo prima di cancellare.");
                                  return;
                                }
                                handleRequestDeleteDay(dateYMD, e);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150 transform hover:scale-125 hover:shadow-md hover:ring-2 hover:ring-rose-300 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white cursor-pointer z-40"
                              title="Cancella tutti i turni di questo giorno"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isReferenceDay && (
                          <div className="absolute top-2 left-2 p-1 z-40">
                            <Lock className="w-4 h-4 text-slate-400 opacity-60" />
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {displayedStaff.map(member => (
                  <tr 
                    key={member.id} 
                    className={`transition-colors ${hoveredStaffId === member.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50/60'}`}
                  >
                    
                    {/* Member Details Cell - Click to edit staff card */}
                    <td 
                      className={`p-3 border-r border-slate-200 sticky left-0 z-10 backdrop-blur-xs shadow-xs transition-all group/staff ${
                        hoveredStaffId === member.id 
                          ? 'bg-indigo-50/95 ring-2 ring-indigo-500 border-indigo-400 shadow-sm' 
                          : 'bg-white/95'
                      } ${
                        isStaffRole ? "" : "cursor-pointer hover:bg-slate-100"
                      }`}
                      onMouseEnter={() => setHoveredStaffId(member.id)}
                      onMouseLeave={() => setHoveredStaffId(null)}
                      onClick={() => {
                        if (!isStaffRole) setSelectedStaffProfile(member);
                      }}
                      title={isStaffRole ? `${member.nome} ${member.cognome} - ${member.ruolo}` : "Clicca per modificare la scheda e gli orari predefiniti"}
                    >
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-white text-xs shadow-xs shrink-0 transition-transform ${
                              hoveredStaffId === member.id ? 'ring-2 ring-indigo-600 ring-offset-1 scale-105 shadow-sm' : ''
                            }`}
                            style={{ backgroundColor: member.coloreBadge }}
                          >
                            {member.nome[0]}{member.cognome[0]}
                          </div>
                          <div className="overflow-hidden">
                            <div className={`font-bold text-xs flex items-center gap-1 transition-colors ${
                              hoveredStaffId === member.id ? 'text-indigo-950 font-black' : 'text-slate-900'
                            }`}>
                              <span>{member.nome} {member.cognome}</span>
                              {!isStaffRole && <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover/staff:opacity-100 transition-opacity" />}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate hidden md:block">{member.ruolo}</div>
                          </div>
                        </div>

                        {/* Real-time stats display in weekly view: separated weekly and monthly to prevent confusion */}
                        <div className="flex flex-col gap-1 mt-1.5 pt-1.5 border-t border-slate-100">
                          {/* WEEKLY HOURS & SHIFTS (PROMINENT) */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[9px] font-black bg-amber-50 hover:bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200/80 flex items-center gap-0.5 shadow-2xs" title="Ore lavorate nella settimana visualizzata">
                              ⏱️ Sett: {getMemberWeeklyStats(member.id).totalHours} ore ({getMemberWeeklyStats(member.id).shiftCount}T)
                            </span>
                          </div>
                          
                          {/* MONTHLY HOURS & REST DAYS */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[9px] font-bold bg-indigo-50/80 text-indigo-700 px-1 rounded border border-indigo-100" title="Turni effettuati nel mese">
                              Mese: {getMemberMonthlyStats(member.id).shiftCount}T
                            </span>
                            <span className="text-[9px] font-bold bg-emerald-50/80 text-emerald-700 px-1 rounded border border-emerald-100" title="Ore lavorate nel mese">
                              {getMemberMonthlyStats(member.id).totalHours} ore
                            </span>
                            {getMemberMonthlyStats(member.id).festiviCount > 0 && (
                              <span className="text-[9px] font-bold bg-red-50 text-red-700 px-1 rounded border border-red-100" title="Turni festivi nel mese">
                                Fest: {getMemberMonthlyStats(member.id).festiviCount}
                              </span>
                            )}
                            {getMemberMonthlyStats(member.id).prefestiviCount > 0 && (
                              <span className="text-[9px] font-bold bg-orange-50 text-orange-700 px-1 rounded border border-orange-100" title="Turni prefestivi nel mese">
                                Prefest: {getMemberMonthlyStats(member.id).prefestiviCount}
                              </span>
                            )}
                            {hasRestDayInCurrentWeek(member.id) ? (
                              <span className="text-[9px] font-bold bg-sky-50 text-sky-700 px-1 rounded border border-sky-100 flex items-center gap-0.5" title="Giorno di riposo presente nella settimana corrente">
                                🛋️ Riposo OK
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1 rounded border border-rose-100 flex items-center gap-0.5 animate-pulse" title="NESSUN riposo pianificato nella settimana corrente!">
                                ⚠️ No Riposo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 8 Days Cells (weekDays contains Previous Sunday + Mon-Sun) */}
                    {weekDays.map((day, dIdx) => {
                      const dateYMD = formatDateYMD(day);
                      
                      // Helper to check if a shift matches the interactive weekly filter
                      const isShiftMatchingFilter = (s: Shift) => {
                        if (activeStrutturaFilters.length === 0 && !activeTimeFilter) return true;
                        
                        let matchesStruttura = true;
                        let matchesTime = true;
                        const isNightShift = s.tipoTurno === "Notte" || s.orarioInizio === "23:00";

                        if (activeStrutturaFilters.length > 0) {
                          const targetStructures = activeStrutturaFilters.map(f => 
                            f === "v1" ? "Vannucci 1" : f === "v2" ? "Vannucci 2" : "Vannucci 4"
                          );
                          if (activeTimeFilter === "notte" && isNightShift) {
                            matchesStruttura = true;
                          } else {
                            matchesStruttura = targetStructures.includes(s.struttura || "");
                          }
                        }

                        if (activeTimeFilter) {
                          const type = activeTimeFilter;
                          if (type === "alzate") matchesTime = s.orarioInizio === "07:00";
                          else if (type === "notte") {
                            matchesTime = isNightShift;
                            if (activeStrutturaFilters.length === 0) {
                              matchesStruttura = true;
                            }
                          }
                          else if (type === "mattino") {
                            const hour = parseInt(s.orarioInizio?.split(":")[0] || "99");
                            matchesTime = hour >= 5 && hour < 12;
                          }
                          else if (type === "pomeriggio") {
                            const hour = parseInt(s.orarioInizio?.split(":")[0] || "99");
                            matchesTime = hour >= 12 && hour < 22;
                          }
                        }

                        return matchesStruttura && matchesTime;
                      };

                      const cellKey = `${member.id}_${dateYMD}`;
                      const isToday = dateYMD === todayStr;
                      const isDragOverCell = dragOverCellKey === cellKey;
                      const dayShifts = shifts.filter(s => s.staffId === member.id && s.data === dateYMD);
                      
                      const isReferenceDay = dIdx === 0; // Domenica precedente (riferimento)
                      const isEffectivelyLocked = lockedDays.includes(dateYMD) || isReferenceDay;

                      const hasPulizieInCell = dayShifts.some(s => s.tipoTurno === "Pulizie" || (s.orarioInizio === "07:00" && s.orarioFine === "11:00"));
                      const hasNotteInCell = dayShifts.some(s => s.tipoTurno === "Notte" || (s.orarioInizio === "23:00" && s.orarioFine === "07:00"));
                      const isComboDayInCell = hasPulizieInCell && hasNotteInCell;

                      return (
                        <td
                          key={dIdx}
                          data-date={dateYMD}
                          onClick={() => {
                            if (isStaffRole) return;
                            if (isReferenceDay) {
                              showToast("🗓️ Questo giorno è un riferimento della settimana precedente (Sola lettura).");
                              return;
                            }
                            if (isEffectivelyLocked) {
                              showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
                              return;
                            }
                            handleOpenAddModal(member.id, dateYMD);
                          }}
                          onDragOver={(e) => {
                            if (!isStaffRole) handleDragOverCell(e, cellKey);
                          }}
                          onDragLeave={handleDragLeaveCell}
                          onDrop={(e) => {
                            if (!isStaffRole) handleDropOnCell(e, member.id, dateYMD);
                          }}
                          className={`p-2 transition-all relative group/cell h-24 align-top ${
                            isStaffRole || isReferenceDay ? "" : "cursor-pointer"
                          } ${
                            isDayComplete(dateYMD) && !isReferenceDay
                              ? "border-x-2 border-emerald-500 shadow-2xs"
                              : "border-r border-slate-200 last:border-r-0"
                          } ${
                            isReferenceDay
                              ? "bg-slate-100 text-slate-500 opacity-100"
                              : isDragOverCell
                              ? "bg-indigo-100 border-2 border-indigo-500 shadow-inner"
                              : isToday
                              ? "bg-white text-indigo-950 opacity-100"
                              : "bg-white opacity-100"
                          }`}
                          title={isStaffRole ? `${member.nome} — Turni del giorno` : isReferenceDay ? "Giorno di riferimento (sola lettura)" : lockedDays.includes(dateYMD) ? "🔒 Questo giorno è bloccato!" : `${member.nome}: ${dayShifts.length ? dayShifts.map(s => `${s.tipoTurno} (${s.orarioInizio}-${s.orarioFine})`).join(", ") : "Nessun turno"}. Clicca per inserire turno.`}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div className={`space-y-1.5 ${isReferenceDay ? 'grayscale-[30%]' : ''}`}>
                              {dayShifts.length === 0 ? (
                                (() => {
                                  const smartSuggestion = getSmartShiftSuggestion(dateYMD);
                                  
                                  // Se NON ci sono filtri attivi, mostra il classico slot vuoto con il "+"
                                  if (!smartSuggestion) {
                                    return (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isStaffRole && !isReferenceDay) {
                                            if (isEffectivelyLocked) {
                                              showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
                                              return;
                                            }
                                            handleOpenAddModal(member.id, dateYMD);
                                          }
                                        }}
                                        className="h-[72px] min-h-[72px] rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/30 hover:bg-indigo-50/50 flex items-center justify-center transition-all cursor-pointer group/emptybox shadow-3xs"
                                        title="Clicca per inserire un turno"
                                      >
                                        <div className="w-7 h-7 rounded-full bg-white/80 border border-slate-200 group-hover/emptybox:border-indigo-500 group-hover/emptybox:bg-indigo-600 group-hover/emptybox:text-white flex items-center justify-center text-slate-400 transition-all shadow-3xs">
                                          <Plus className="w-4 h-4 stroke-[2.5]" />
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Con filtro attivo: A RIPOSO RIMANE BIANCO CON IL "+" (nessun intasamento visivo!)
                                  // SOLO ALL'HOVER DEL MOUSE evidenzia il turno logico suggerito
                                  const validity = checkPotentialShiftValidity(
                                    member.id,
                                    dateYMD,
                                    smartSuggestion.tipoTurno,
                                    smartSuggestion.struttura,
                                    smartSuggestion.orarioInizio,
                                    smartSuggestion.orarioFine
                                  );
                                  const isInvalid = !validity.valid;

                                  return (
                                    <div
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (isStaffRole || isReferenceDay) return;
                                        if (isEffectivelyLocked) {
                                          showToast("🔒 Questo giorno è completato e bloccato!");
                                          return;
                                        }
                                        if (isInvalid) {
                                          showToast(`⚠️ Impossibile assegnare: ${validity.reason}`, true);
                                          return;
                                        }
                                        handleQuickAddSmartShift(member.id, dateYMD, smartSuggestion);
                                      }}
                                      className="h-[72px] min-h-[72px] rounded-lg border-2 border-dashed border-slate-200 hover:border-transparent bg-slate-50/30 flex items-center justify-center transition-all duration-150 cursor-pointer relative overflow-hidden select-none shadow-3xs group/smartbox"
                                      title={
                                        isInvalid
                                          ? `⚠️ ${validity.reason}`
                                          : `⚡ Clicca per inserire: ${smartSuggestion.shortStruttura} ${smartSuggestion.tipoTurno} (${smartSuggestion.orarioInizio}-${smartSuggestion.orarioFine})`
                                      }
                                    >
                                      {/* A RIPOSO (SENZA MOUSE): Completamente bianco e pulito con il simbolo "+" ESATTAMENTE COME PRIMA */}
                                      <div className="w-7 h-7 rounded-full bg-white/80 border border-slate-200 flex items-center justify-center text-slate-400 group-hover/cell:hidden transition-all shadow-3xs">
                                        <Plus className="w-4 h-4 stroke-[2.5]" />
                                      </div>

                                      {/* SOLO SE VADO CON IL MOUSE: Evidenzia direttamente con i colori ufficiali della struttura. Cliccando il turno è inserito! */}
                                      <div className={`hidden group-hover/cell:flex flex-col h-full w-full justify-between p-2 rounded-lg transition-all duration-150 ${smartSuggestion.badgeStyle}`}>
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1.5 font-black text-[11px] tracking-tight truncate leading-none">
                                            <span className="text-xs leading-none">{smartSuggestion.icon}</span>
                                            <span className="uppercase">{smartSuggestion.shortStruttura} {smartSuggestion.tipoTurno}</span>
                                          </div>
                                          <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded bg-black/15">
                                            1-Click
                                          </span>
                                        </div>

                                        <div className="text-[10px] font-mono font-black leading-tight flex items-center justify-between">
                                          <span>{smartSuggestion.orarioInizio} - {smartSuggestion.orarioFine}</span>
                                          {isInvalid ? (
                                            <span className="text-[7.5px] bg-red-800 text-white px-1 py-0.5 rounded font-bold">⚠️ 11h Riposo</span>
                                          ) : (
                                            <span className="text-[8.5px] font-sans font-black uppercase tracking-tight opacity-90 underline">
                                              Inserisci ↵
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-[8px] font-bold opacity-85 truncate tracking-tight">
                                          {smartSuggestion.reasonLabel}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : dayShifts.length === 1 ? (
                                (() => {
                                  const s = dayShifts[0];
                                  const validity = checkShiftValidity(s);
                                  const isInvalid = !validity.valid && !isReferenceDay;
                                  const isHovered = hoveredShiftId === s.id;
                                  const isStaffHovered = hoveredStaffId === s.staffId;

                                  const isMorningNight = s.tipoTurno === "Notte" && (s.orarioInizio === "00:00" || s.orarioFine === "07:00") && s.orarioInizio !== "23:00";
                                  const isEveningNight = s.tipoTurno === "Notte" && s.orarioInizio === "23:00";
                                  const isPulizie = s.tipoTurno === "Pulizie";
                                  const isHalfShift = isMorningNight || isEveningNight || isPulizie;

                                  if (isHalfShift) {
                                    const renderHalfShiftBadge = (shiftItem: Shift) => (
                                      <div
                                        key={shiftItem.id}
                                        draggable={!isStaffRole && !isEffectivelyLocked}
                                        onDragStart={(e) => {
                                          if (!isStaffRole && !isEffectivelyLocked) handleDragStartSingleShift(e, shiftItem);
                                        }}
                                        onMouseEnter={() => {
                                          setHoveredShiftId(shiftItem.id);
                                          setHoveredStaffId(shiftItem.staffId);
                                        }}
                                        onMouseLeave={() => {
                                          setHoveredShiftId(null);
                                          setHoveredStaffId(null);
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenDetailModal(shiftItem);
                                        }}
                                        className={`group/shift px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all shadow-2xs relative flex items-center justify-between h-[34px] min-h-[34px] max-h-[34px] ${
                                          isStaffRole || isEffectivelyLocked ? "cursor-pointer hover:shadow-md" : "cursor-grab active:cursor-grabbing"
                                        } ${getShiftBadgeStyle(shiftItem.tipoTurno, shiftItem.orarioInizio, shiftItem.orarioFine, shiftItem.struttura)} ${
                                          isInvalid ? "animate-pulse ring-2 ring-red-600 !border-red-600 !bg-red-100 !text-red-900" : ""
                                        } ${
                                          isHovered ? "ring-2 ring-indigo-600 shadow-md scale-[1.02] z-30" : isStaffHovered ? "ring-1 ring-indigo-400 shadow-xs" : ""
                                        } ${
                                          (activeStrutturaFilters.length > 0 || activeTimeFilter) && !isShiftMatchingFilter(shiftItem) ? "opacity-15 grayscale scale-95 blur-[0.5px] pointer-events-none" : ""
                                        }`}
                                        title={isInvalid ? `⚠️ ERRORE: ${validity.reason}` : isMorningNight ? "Turno Smonto Notte (00:00 - 07:00) — Clicca per dettagli" : `${shiftItem.tipoTurno} (${shiftItem.orarioInizio} - ${shiftItem.orarioFine})`}
                                      >
                                        <div className="flex items-center gap-1 flex-nowrap truncate min-w-0">
                                          {isMorningNight ? (
                                            <span className="text-xs leading-none" title="Smonto Notte">🌙</span>
                                          ) : shiftItem.tipoTurno === "Pulizie" ? (
                                            <span className="text-xs leading-none" title="Pulizie">🪣</span>
                                          ) : (
                                            <span className="text-xs leading-none">🌙</span>
                                          )}
                                          <span className="uppercase font-black truncate text-[9.5px] leading-tight shrink-0">
                                            {isMorningNight ? "Notte" : shiftItem.tipoTurno}
                                          </span>
                                          {isMorningNight && (
                                            <span className="text-[7.5px] font-black bg-indigo-200/90 text-indigo-950 px-1 py-0.2 rounded-xs uppercase tracking-tight shrink-0 border border-indigo-300">
                                              Smonto
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 font-mono text-[9px] font-bold">
                                          <span>{shiftItem.orarioInizio}-{shiftItem.orarioFine}</span>
                                          {!isStaffRole && !lockedDays.includes(dateYMD) && (
                                            <button
                                              type="button"
                                              onClick={(e) => handleDeleteSingleShift(shiftItem.id, e)}
                                              className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover/shift:opacity-100 transition-all shadow-xs cursor-pointer"
                                              title="Elimina questo turno"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );

                                    const renderAvailableHalfSlot = (isForNight: boolean) => (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isStaffRole && !isEffectivelyLocked) {
                                            if (isForNight) {
                                              handleQuickAddNightShift(member.id, dateYMD);
                                            } else {
                                              handleOpenAddModal(member.id, dateYMD);
                                            }
                                          }
                                        }}
                                        className={`h-[34px] min-h-[34px] max-h-[34px] rounded-lg border-2 border-dashed flex items-center justify-between px-2 transition-all cursor-pointer shadow-3xs group/slotadd opacity-0 group-hover/cell:opacity-100 ${
                                          isForNight
                                            ? "border-indigo-400/80 bg-indigo-50/80 hover:bg-indigo-600 hover:text-white text-indigo-700 hover:border-indigo-600"
                                            : "border-slate-300 bg-slate-50/70 hover:bg-indigo-50 hover:text-indigo-700 text-slate-500 hover:border-indigo-400"
                                        }`}
                                        title={
                                          isForNight
                                            ? "⚡ Clicca per inserire DIRETTAMENTE la Notte (23:00 oggi + 00:00-07:00 domani) senza passare dalla scheda"
                                            : "Clicca per inserire un altro turno"
                                        }
                                      >
                                        <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold truncate">
                                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                            isForNight
                                              ? "bg-indigo-200 group-hover/slotadd:bg-white group-hover/slotadd:text-indigo-600 text-indigo-800"
                                              : "bg-slate-200 group-hover/slotadd:bg-indigo-500 group-hover/slotadd:text-white text-slate-600"
                                          }`}>
                                            <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                          </div>
                                          <span className="truncate">
                                            {isForNight ? "🌙 + Notte (23:00)" : "+"}
                                          </span>
                                        </div>
                                        <span className={`text-[8.5px] font-mono font-black shrink-0 ${
                                          isForNight ? "text-indigo-600 group-hover/slotadd:text-white" : "text-slate-400"
                                        }`}>
                                          {isForNight ? "⚡ Subito" : "+"}
                                        </span>
                                      </div>
                                    );

                                    return (
                                      <div className="flex flex-col gap-1">
                                        {isEveningNight ? (
                                          <>
                                            {renderAvailableHalfSlot(false)}
                                            {renderHalfShiftBadge(s)}
                                          </>
                                        ) : (
                                          <>
                                            {renderHalfShiftBadge(s)}
                                            {renderAvailableHalfSlot(isMorningNight || isPulizie)}
                                          </>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={s.id}
                                      draggable={!isStaffRole && !isEffectivelyLocked}
                                      onDragStart={(e) => {
                                        if (!isStaffRole && !isEffectivelyLocked) handleDragStartSingleShift(e, s);
                                      }}
                                      onMouseEnter={() => {
                                        setHoveredShiftId(s.id);
                                        setHoveredStaffId(s.staffId);
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredShiftId(null);
                                        setHoveredStaffId(null);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetailModal(s);
                                      }}
                                      className={`group/shift p-2 rounded-lg border text-[11px] font-bold transition-all shadow-2xs relative flex flex-col justify-between h-[72px] min-h-[72px] max-h-[72px] ${
                                        isStaffRole || isEffectivelyLocked ? "cursor-pointer hover:shadow-md" : "cursor-grab active:cursor-grabbing"
                                      } ${getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine, s.struttura)} ${
                                        s.tipoTurno === "Ferie" ? "animate-pulse ring-2 ring-amber-500 ring-offset-1 border-amber-500 border-2" : ""
                                      } ${
                                        isInvalid ? "animate-pulse ring-4 ring-red-600 ring-offset-1 !border-red-600 !bg-red-100 !text-red-900" : ""
                                      } ${
                                        isHovered ? "ring-2 ring-indigo-600 shadow-lg scale-[1.02] z-30" : isStaffHovered ? "ring-1 ring-indigo-400 shadow-xs" : ""
                                      } ${
                                        (activeStrutturaFilters.length > 0 || activeTimeFilter) && !isShiftMatchingFilter(s) ? "opacity-15 grayscale scale-95 blur-[0.5px] pointer-events-none" : ""
                                      }`}
                                      title={isInvalid ? `⚠️ ERRORE: ${validity.reason}` : isStaffRole ? `${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine}) - Clicca per dettagli` : s.tipoTurno === "Ferie" ? "🏖️ Ferie — Clicca per dettagli" : isReferenceDay ? "Turno di riferimento - Clicca per dettagli" : lockedDays.includes(dateYMD) ? "Giorno bloccato - Clicca per dettagli" : "Trascina per spostare o duplicare, oppure clicca per dettagli"}
                                    >
                                       {/* Shift Header & Trash Hover Button */}
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1 flex-nowrap truncate min-w-0">
                                          <span className="uppercase tracking-wider font-black truncate text-[10px] leading-tight shrink-0">{s.tipoTurno}</span>
                                          {!s.id.startsWith("auto-") && !isReferenceDay && s.tipoTurno !== "Ferie" && s.tipoTurno !== "Riposo" && !lockedDays.includes(dateYMD) && (
                                            <span className="text-[7px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-0.5 rounded-xs shrink-0">📌</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          {isInvalid && (
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                          )}
                                          {s.tipoTurno === "Mattina" && <GenovaLandscapeIcon isMorning={true} />}
                                          {s.tipoTurno === "Pomeriggio" && <GenovaLandscapeIcon isMorning={false} />}
                                          {s.tipoTurno === "Notte" && <Moon className="w-4 h-4 text-slate-400" />}
                                          {s.tipoTurno === "Pulizie" && <span className="text-sm leading-none" title="Pulizie / Supporto Alzate V1">🪣🧹</span>}
                                          {s.tipoTurno === "Cucina" && <span className="text-sm leading-none">🍲</span>}
                                          {s.note && s.note.trim().length > 0 && s.note !== "Programmazione automatica" && (
                                            <span className="relative flex h-2 w-2 ml-0.5" title={`Nota: ${s.note}`}>
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                                            </span>
                                          )}

                                          {!isStaffRole && (
                                            <>
                                              {lockedDays.includes(dateYMD) ? (
                                                <span className="p-0.5 rounded bg-slate-100 text-slate-500 opacity-0 group-hover/shift:opacity-100 transition-all duration-150" title="Questo giorno è completato e bloccato">
                                                  <Lock className="w-3 h-3 text-emerald-600" />
                                                </span>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleDeleteSingleShift(s.id, e)}
                                                  className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover/shift:opacity-100 transition-all duration-150 shadow-xs z-10 cursor-pointer transform hover:scale-110"
                                                  title="Elimina questo singolo turno"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Shift Hours & Structure Badge */}
                                      {s.tipoTurno !== "Ferie" && s.tipoTurno !== "Riposo" ? (
                                        <div className="flex items-center justify-between text-xs font-mono font-bold opacity-90 border-t border-black/5 pt-0.5">
                                          <span className="text-[10px]">{s.orarioInizio} - {s.orarioFine}</span>
                                          {s.struttura && s.tipoTurno !== "Notte" && s.tipoTurno !== "Cucina" && s.tipoTurno !== "Pulizie" && (
                                            <span className="bg-white/95 text-slate-800 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold border border-black/10 uppercase tracking-tight flex items-center gap-0.5 shadow-3xs">
                                              {(s.struttura === "Vannucci 1" || s.struttura === "Struttura 1") ? (
                                                <span>Vannucci <strong className="text-[11px] font-black text-yellow-600 leading-none">1</strong></span>
                                              ) : (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2") ? (
                                                <span>Vannucci <strong className="text-[11px] font-black text-orange-600 leading-none">2</strong></span>
                                              ) : (
                                                <span>Vannucci <strong className="text-[11px] font-black text-emerald-600 leading-none">4</strong></span>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-[9.5px] font-medium opacity-80 border-t border-black/5 pt-0.5 italic">
                                          {s.tipoTurno === "Ferie" ? "🏖️ Tutto il giorno" : "Giorno libero"}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                dayShifts.map(s => {
                                  const validity = checkShiftValidity(s);
                                  const isInvalid = !validity.valid && !isReferenceDay;
                                  const isHovered = hoveredShiftId === s.id;
                                  const isStaffHovered = hoveredStaffId === s.staffId;

                                  return (
                                    <div
                                      key={s.id}
                                      draggable={!isStaffRole && !isEffectivelyLocked}
                                      onDragStart={(e) => {
                                        if (!isStaffRole && !isEffectivelyLocked) handleDragStartSingleShift(e, s);
                                      }}
                                      onMouseEnter={() => {
                                        setHoveredShiftId(s.id);
                                        setHoveredStaffId(s.staffId);
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredShiftId(null);
                                        setHoveredStaffId(null);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDetailModal(s);
                                      }}
                                      className={`group/shift px-1.5 py-0.5 rounded-md border text-[10px] font-bold transition-all shadow-2xs relative flex items-center justify-between h-[29px] min-h-[29px] max-h-[29px] ${
                                        isStaffRole || isEffectivelyLocked ? "cursor-pointer hover:shadow-md" : "cursor-grab active:cursor-grabbing"
                                      } ${getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine, s.struttura)} ${
                                        isInvalid ? "animate-pulse ring-2 ring-red-600 !border-red-600 !bg-red-100 !text-red-900" : ""
                                      } ${
                                        isHovered ? "ring-2 ring-indigo-600 shadow-md scale-[1.02] z-30" : isStaffHovered ? "ring-1 ring-indigo-400 shadow-xs" : ""
                                      } ${
                                        (activeStrutturaFilters.length > 0 || activeTimeFilter) && !isShiftMatchingFilter(s) ? "opacity-15 grayscale scale-95 blur-[0.5px] pointer-events-none" : ""
                                      }`}
                                      title={isInvalid ? `⚠️ ERRORE: ${validity.reason}` : `${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine})`}
                                    >
                                      <div className="flex items-center gap-1 flex-nowrap truncate min-w-0">
                                        {s.tipoTurno === "Pulizie" ? <span>🪣</span> : s.tipoTurno === "Notte" ? <span>🌙</span> : s.tipoTurno === "Cucina" ? <span>🍲</span> : null}
                                        <span className="uppercase font-black truncate text-[9px] leading-tight shrink-0">{s.tipoTurno}</span>
                                        {s.struttura && !["Notte", "Riposo", "Ferie", "Cucina", "Pulizie"].includes(s.tipoTurno) && (
                                          <span className="text-[7.5px] bg-white/95 px-1 rounded font-black text-slate-800 border border-slate-200">
                                            V{s.struttura.replace(/\D/g, '')}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 font-mono text-[8.5px] font-bold">
                                        <span>{s.orarioInizio}-{s.orarioFine}</span>
                                        {!isStaffRole && !lockedDays.includes(dateYMD) && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleDeleteSingleShift(s.id, e)}
                                            className="p-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white opacity-0 group-hover/shift:opacity-100 transition-all shadow-xs cursor-pointer"
                                            title="Elimina turno"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* SUBTLE HOVER ADD ICON FOR CELL (DOUBLE-CLICK PRIMARY) */}
                            {!isStaffRole && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAddModal(member.id, dateYMD);
                                }}
                                className="absolute bottom-1 right-1 p-0.5 rounded-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-400 opacity-0 group-hover/cell:opacity-100 transition-all cursor-pointer z-20 shadow-3xs flex items-center justify-center border border-slate-200"
                                title="Aggiungi Turno"
                              >
                                <Plus className="w-3 h-3 stroke-[2.5]" />
                              </button>
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
      </div>
      )}

      {/* MONTHLY CALENDAR MATRIX VIEW (Staff × Days of Month) */}
      {viewMode === "month" && (
        <div className={isFullScreen ? "fixed inset-0 z-45 bg-slate-50 p-4 sm:p-6 overflow-auto flex flex-col h-screen" : ""}>
          {isFullScreen && (
            <div className="flex flex-wrap items-center justify-between bg-indigo-900 text-white p-2.5 rounded-xl mb-3 shadow-md shrink-0 gap-2 border border-indigo-800 text-xs">
              {/* Left: View Mode Toggle & Direct Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <div className="flex items-center gap-1 bg-indigo-950 p-1 rounded-lg border border-indigo-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "week"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    📅 Settimanale
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "month"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    🗓️ Mensile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWeekShifts}
                    className={`px-3 py-1 rounded-md text-xs font-black bg-rose-600 text-white shadow-xs hover:bg-rose-500 transition-all cursor-pointer whitespace-nowrap`}
                  >
                    🗑️ Cancella Settimana
                  </button>
                </div>

                {/* Direct Month Selector Input */}
                <div className="flex items-center gap-1.5 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-700 shrink-0" title="Seleziona Mese e Anno">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-200 hidden sm:inline">Mese:</span>
                  <input
                    type="month"
                    value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-").map(Number);
                        const nextD = new Date(currentDate);
                        nextD.setFullYear(y);
                        nextD.setMonth(m - 1);
                        setCurrentDate(nextD);
                      }
                    }}
                    className="bg-indigo-900 border border-indigo-600 text-white text-xs font-bold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Center: Navigation Controls & Period Label */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrevMonth}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Mese Precedente"
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>Prec.</span>
                </button>
                
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Vai a oggi"
                >
                  Oggi
                </button>

                <button
                  onClick={handleNextMonth}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Mese Successivo"
                >
                  <span>Succ.</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
                </button>

                <span className="text-[11px] sm:text-xs font-semibold bg-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-700 whitespace-nowrap text-amber-200">
                  Mese di {getFullMonthName(currentDate).toUpperCase()} {currentDate.getFullYear()}
                </span>
              </div>

              {/* Right: Actions & Exit Fullscreen */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleExportMonthlyPDF}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Esporta in PDF</span>
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1 font-extrabold whitespace-nowrap"
                >
                  <span>Esci Schermo Intero ✖</span>
                </button>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative group/calendar flex-1 flex flex-col">
          
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
            <table id="monthly-schedule-table" className="w-full table-fixed text-left border-collapse">
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
                        data-date={dateYMD}
                        draggable={!lockedDays.includes(dateYMD)}
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
                        
                        className={`p-0.5 text-center cursor-grab active:cursor-grabbing transition-all select-none relative group/mhead sticky top-0 z-30 ${
                          isDayComplete(dateYMD)
                            ? "border-x-2 border-t-2 border-emerald-500 z-10 shadow-xs"
                            : "border-r border-slate-200 last:border-r-0"
                        } ${
                          isDragOver
                            ? "bg-indigo-100 text-indigo-900 border-indigo-400 ring-2 ring-indigo-400 z-10"
                            : isHolding
                            ? "bg-amber-200 text-amber-950 animate-pulse"
                            : isToday
                            ? "bg-white text-indigo-950 border-indigo-400 border-b-4 opacity-100"
                            : isWeekend
                            ? "bg-amber-50 text-amber-950 opacity-100"
                            : "bg-slate-50 hover:bg-slate-100 opacity-100"
                        }`}
                        title={`Giorno ${day.getDate()} ${getFullMonthName(day)} (${dayShiftsCount} turni).\n\n${isDayComplete(dateYMD) ? "✅ Giornata completa" : "❌ Mancanti:\n- " + getMissingShiftsForDay(dateYMD).join("\n- ")}\n\nTrascina per spostare o duplicare l'intero giorno.`}
                      >
                        {/* Long Press Visual Indicator */}
                        {isHolding && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
                        )}

                        {(() => {
                          const festivo = isItalianFestivo(day);
                          const prefestivo = isItalianPrefestivo(day);
                          let weekdayColor = "text-slate-400 group-hover/mhead:text-indigo-600";
                          let dateColor = isToday ? "text-white bg-indigo-600" : "text-slate-800";
                          
                          if (festivo.isFestivo) {
                            weekdayColor = "text-red-500 group-hover/mhead:text-red-600";
                            dateColor = isToday ? "text-white bg-red-600" : "text-red-600";
                          } else if (prefestivo.isPrefestivo) {
                            weekdayColor = "text-orange-400 group-hover/mhead:text-orange-500";
                            dateColor = isToday ? "text-white bg-orange-500" : "text-orange-600";
                          }

                          return (
                            <>
                              <div className={`text-[8px] font-black uppercase flex items-center justify-center gap-0.5 ${weekdayColor}`} title={festivo.isFestivo ? festivo.label : prefestivo.isPrefestivo ? prefestivo.label : undefined}>
                                {day.toLocaleDateString("it-IT", { weekday: "narrow" })}
                              </div>

                              <div className={`text-[10px] sm:text-xs font-black my-0.5 ${dateColor} ${isToday ? "rounded-full w-4 h-4 sm:w-5 sm:h-5 mx-auto flex items-center justify-center shadow-2xs" : ""}`} title={festivo.isFestivo ? festivo.label : prefestivo.isPrefestivo ? prefestivo.label : undefined}>
                                {day.getDate()}
                              </div>
                            </>
                          );
                        })()}

                        {/* Action buttons on hover */}
                        {!isPublicView && (
                          <>
                            {/* LOCK TOGGLE BUTTON (ALWAYS VISIBLE, RED CLOSED WHEN LOCKED, GRAY OPEN WHEN UNLOCKED) */}
                            <button
                              type="button"
                              onClick={(e) => toggleLockDay(dateYMD, e)}
                              className="absolute top-1 left-1 p-0.5 rounded-sm transition-all duration-150 transform hover:scale-125 cursor-pointer z-40"
                              title={lockedDays.includes(dateYMD) ? "Sblocca questo giorno" : "Blocca questo giorno"}
                            >
                              {lockedDays.includes(dateYMD) ? (
                                <Lock className="w-3 h-3 text-rose-600 fill-rose-600/10" />
                              ) : (
                                <Unlock className="w-3 h-3 text-slate-400" />
                              )}
                            </button>

                            {/* TRASH ICON (ONLY SHOWN ON HOVER, HIGHLIGHT ON HOVER) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                if (lockedDays.includes(dateYMD)) {
                                  showToast("🔒 Questo giorno è bloccato!");
                                  return;
                                }
                                handleRequestDeleteDay(dateYMD, e);
                              }}
                              className="absolute top-1 right-1 p-0.5 rounded-sm opacity-0 group-hover/mhead:opacity-100 transition-all duration-150 transform hover:scale-125 hover:shadow-md hover:ring-1 hover:ring-rose-300 bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white cursor-pointer z-40"
                              title="Cancella turni del giorno"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {displayedStaff.map(member => (
                  <tr 
                    key={member.id} 
                    className={`transition-colors ${hoveredStaffId === member.id ? 'bg-indigo-50/60' : 'hover:bg-slate-50/60'}`}
                  >
                    
                    {/* Member Details Sticky Cell */}
                    <td
                      className={`p-1.5 border-r border-slate-200 sticky left-0 z-10 backdrop-blur-xs transition-all group/staff shadow-2xs overflow-hidden ${
                        hoveredStaffId === member.id ? 'bg-indigo-100/95 ring-2 ring-indigo-500 border-indigo-400 z-30' : 'bg-white/95'
                      } ${
                        isPublicView ? "" : "cursor-pointer hover:bg-slate-100"
                      }`}
                      onMouseEnter={() => setHoveredStaffId(member.id)}
                      onMouseLeave={() => setHoveredStaffId(null)}
                      onClick={() => {
                        if (!isPublicView) setSelectedStaffProfile(member);
                      }}
                      title={isPublicView ? `${member.nome} ${member.cognome}` : "Clicca per modificare scheda e orari"}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-extrabold text-white text-[9px] shadow-xs shrink-0 transition-transform ${hoveredStaffId === member.id ? 'ring-2 ring-indigo-600 scale-105' : ''}`}
                          style={{ backgroundColor: member.coloreBadge }}
                        >
                          {member.nome[0]}{member.cognome[0]}
                        </div>
                        <div className="truncate min-w-0">
                          <div className={`font-bold text-[10px] sm:text-xs truncate transition-colors ${hoveredStaffId === member.id ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                            {member.nome} {member.cognome[0]}.
                          </div>
                          <div className="text-[8px] text-slate-400 truncate hidden md:block">{member.ruolo}</div>
                          {/* Compact real-time stats in monthly view */}
                          <div className="mt-1 flex flex-col gap-0.5 text-[8px] font-bold">
                            <span className="text-[8px] text-indigo-700 bg-indigo-50/85 px-1 py-0.2 rounded border border-indigo-100 whitespace-nowrap">
                              📅 {getMemberMonthlyStats(member.id).shiftCount} turni
                            </span>
                            <span className="text-[8px] text-emerald-700 bg-emerald-50/85 px-1 py-0.2 rounded border border-emerald-100 whitespace-nowrap">
                              ⏱️ {getMemberMonthlyStats(member.id).totalHours} ore
                            </span>
                            {getMemberMonthlyStats(member.id).festiviCount > 0 && (
                              <span className="text-[8px] text-red-700 bg-red-50/85 px-1 py-0.2 rounded border border-red-100 whitespace-nowrap">
                                🔴 {getMemberMonthlyStats(member.id).festiviCount} festivi
                              </span>
                            )}
                            {getMemberMonthlyStats(member.id).prefestiviCount > 0 && (
                              <span className="text-[8px] text-orange-700 bg-orange-50/85 px-1 py-0.2 rounded border border-orange-100 whitespace-nowrap">
                                🟠 {getMemberMonthlyStats(member.id).prefestiviCount} prefest.
                              </span>
                            )}
                          </div>
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

                      const hasPulizieInCell = dayShifts.some(s => s.tipoTurno === "Pulizie" || (s.orarioInizio === "07:00" && s.orarioFine === "11:00"));
                      const hasNotteInCell = dayShifts.some(s => s.tipoTurno === "Notte" || (s.orarioInizio === "23:00" && s.orarioFine === "07:00"));
                      const isComboDayInCell = hasPulizieInCell && hasNotteInCell;

                      return (
                        <td
                          key={dIdx}
                          data-date={dateYMD}
                          onMouseEnter={() => setHoveredStaffId(member.id)}
                          onMouseLeave={() => setHoveredStaffId(null)}
                          onClick={() => {
                            if (isPublicView) return;
                            if (lockedDays.includes(dateYMD)) {
                              showToast("🔒 Questo giorno è completato e bloccato contro modifiche accidentali!");
                              return;
                            }
                            handleOpenAddModal(member.id, dateYMD);
                          }}
                          onDragOver={(e) => {
                            if (!isPublicView && !lockedDays.includes(dateYMD)) handleDragOverCell(e, cellKey);
                          }}
                          onDragLeave={handleDragLeaveCell}
                          onDrop={(e) => {
                            if (!isPublicView) handleDropOnCell(e, member.id, dateYMD);
                          }}
                          className={`p-0.5 transition-all relative group/cell text-center align-middle h-10 ${
                            isPublicView ? "" : "cursor-pointer"
                          } ${
                            isDayComplete(dateYMD)
                              ? "border-x-2 border-emerald-500 shadow-2xs"
                              : "border-r border-slate-200 last:border-r-0"
                          } ${
                            isDragOverCell
                              ? "bg-indigo-100 border-2 border-indigo-500 shadow-inner"
                              : hoveredStaffId === member.id
                              ? "bg-indigo-50/40"
                              : isToday
                              ? "bg-indigo-50/40"
                              : isWeekend
                              ? "bg-amber-50/20"
                              : ""
                          }`}
                          title={lockedDays.includes(dateYMD) ? `🔒 ${member.nome}: Giorno Bloccato` : `${member.nome}: ${dayShifts.length ? dayShifts.map(s => `${s.tipoTurno} (${s.orarioInizio}-${s.orarioFine})`).join(", ") : "Nessun turno"}.`}
                        >
                          <div className="flex flex-wrap items-center justify-center gap-0.5 h-full">
                            {dayShifts.length > 0 ? (
                              dayShifts.map(s => {
                                let badgeText = s.tipoTurno.substring(0, 1).toUpperCase();
                                if (s.tipoTurno === "Mattina") badgeText = "M";
                                else if (s.tipoTurno === "Pomeriggio") badgeText = "P";
                                else if (s.tipoTurno === "Notte") badgeText = "N";
                                else if (s.tipoTurno === "Reperibilità") badgeText = "R";
                                else if (s.tipoTurno === "Cucina") badgeText = "🍲";
                                else if (s.tipoTurno === "Pulizie") badgeText = "🪣🧹";
                                else if (s.tipoTurno === "Riposo") badgeText = "💤";
                                else if (s.tipoTurno === "Ferie") badgeText = "🏖️";

                                const badgeStyle = getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine, s.struttura);
                                const isShiftHovered = hoveredShiftId === s.id;

                                return (
                                  <div
                                    key={s.id}
                                    draggable={!isPublicView && !lockedDays.includes(dateYMD)}
                                    onDragStart={(e) => {
                                      if (!isPublicView) handleDragStartSingleShift(e, s);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      setHoveredShiftId(s.id);
                                      setHoveredStaffId(member.id);
                                    }}
                                    onMouseLeave={(e) => {
                                      e.stopPropagation();
                                      setHoveredShiftId(null);
                                      setHoveredStaffId(null);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenDetailModal(s);
                                    }}
                                    className={`px-0.5 py-0.5 rounded text-[9px] font-black border shadow-2xs hover:scale-110 transition-transform flex items-center justify-center min-w-[16px] relative ${
                                      isPublicView || lockedDays.includes(dateYMD) ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                                    } ${badgeStyle} ${
                                      s.tipoTurno === "Ferie" ? "animate-pulse ring-1 ring-amber-800 border-amber-800 border-2" : ""
                                    } ${
                                      isShiftHovered ? "ring-2 ring-indigo-600 scale-125 z-30 shadow-md" : ""
                                    }`}
                                    title={s.tipoTurno === "Ferie" ? `🏖️ Ferie — Trascina per spostare/duplicare o clicca per dettagli` : lockedDays.includes(dateYMD) ? `Giorno Bloccato: ${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine})` : `${s.tipoTurno} (${s.orarioInizio} - ${s.orarioFine}) - Clicca per dettagli`}
                                  >
                                    {badgeText}
                                    {s.note && s.note.trim().length > 0 && s.note !== "Programmazione automatica" && (
                                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-600 rounded-full border border-white" title={`Nota: ${s.note}`} />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              !isPublicView && !lockedDays.includes(dateYMD) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddModal(member.id, dateYMD);
                                  }}
                                  className="w-5 h-5 rounded-full bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-400 opacity-40 sm:opacity-0 group-hover/cell:opacity-100 transition-all flex items-center justify-center font-bold text-xs cursor-pointer shadow-3xs"
                                  title="Aggiungi Turno"
                                >
                                  +
                                </button>
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
      </div>
      )}

      {/* ROSTER / OPERATOR CARDS VIEW */}
      {viewMode === "roster" && (
        <div className={isFullScreen ? "fixed inset-0 z-45 bg-slate-50 p-4 sm:p-6 overflow-auto flex flex-col h-screen space-y-4" : "space-y-5"}>
          {isFullScreen && (
            <div className="flex flex-wrap items-center justify-between bg-indigo-900 text-white p-2.5 rounded-xl mb-1 shadow-md shrink-0 gap-2 border border-indigo-800 text-xs">
              {/* Left: View Mode Toggle & Direct Month Selector */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                <div className="flex items-center gap-1 bg-indigo-950 p-1 rounded-lg border border-indigo-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode("week")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "week"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    📅 Settimanale
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("month")}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      viewMode === "month"
                        ? "bg-indigo-600 text-white shadow-xs font-black"
                        : "text-indigo-200 hover:text-white hover:bg-indigo-800/60"
                    }`}
                  >
                    🗓️ Mensile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteWeekShifts}
                    className={`px-3 py-1 rounded-md text-xs font-black bg-rose-600 text-white shadow-xs hover:bg-rose-500 transition-all cursor-pointer whitespace-nowrap`}
                  >
                    🗑️ Cancella Settimana
                  </button>
                </div>

                {/* Direct Month Selector Input */}
                <div className="flex items-center gap-1.5 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-700 shrink-0" title="Seleziona Mese e Anno">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-200 hidden sm:inline">Mese:</span>
                  <input
                    type="month"
                    value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [y, m] = e.target.value.split("-").map(Number);
                        const nextD = new Date(currentDate);
                        nextD.setFullYear(y);
                        nextD.setMonth(m - 1);
                        setCurrentDate(nextD);
                      }
                    }}
                    className="bg-indigo-900 border border-indigo-600 text-white text-xs font-bold rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Center: Navigation Controls & Period Label */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handlePrevMonth}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Mese Precedente"
                >
                  <ChevronLeft className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>Prec.</span>
                </button>
                
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Vai a oggi"
                >
                  Oggi
                </button>

                <button
                  onClick={handleNextMonth}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 border border-indigo-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Mese Successivo"
                >
                  <span>Succ.</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3px]" />
                </button>

                <span className="text-[11px] sm:text-xs font-semibold bg-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-700 whitespace-nowrap text-amber-200">
                  Mese di {getFullMonthName(currentDate).toUpperCase()} {currentDate.getFullYear()}
                </span>
              </div>

              {/* Right: Actions & Exit Fullscreen */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsFullScreen(false)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1 font-extrabold whitespace-nowrap"
                >
                  <span>Esci Schermo Intero ✖</span>
                </button>
              </div>
            </div>
          )}
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
            {displayedStaff.map(member => {
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
                        {member.tipoContratto && (
                          <span className="block mt-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-max border border-slate-200">
                            {member.tipoContratto}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isPublicView && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedStaffProfile(member)}
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
                          onClick={() => {
                            const updatedList = staff.map(st => st.id === member.id ? { ...st, attivo: st.attivo === false ? true : false } : st);
                            if (onUpdateStaff) onUpdateStaff(updatedList);
                            firestoreSync.saveStaff(updatedList);
                            apiSync.saveStaff(updatedList);
                            showToast(member.attivo === false ? `✅ ${member.nome} riattivato` : `📁 ${member.nome} archiviato`);
                          }}
                          className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-all"
                          title={member.attivo === false ? "Riattiva operatore" : "Archivia operatore"}
                        >
                          <Archive className="w-4 h-4" />
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
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer ${getShiftBadgeStyle(s.tipoTurno, s.orarioInizio, s.orarioFine, s.struttura)}`}
                      >
                        <div>
                          <span>{s.tipoTurno} • {formatItalianDateString(s.data)} {(s.struttura && !["Notte", "Riposo", "Ferie", "Cucina", "Pulizie"].includes(s.tipoTurno)) ? ` (${s.struttura})` : ""}</span>
                          <div className="text-[13px] font-mono font-bold opacity-80 mt-0.5">{s.orarioInizio} - {s.orarioFine}</div>
                        </div>
                        {!isStaffRole && (
                          <Trash2
                            className="w-4 h-4 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                            onClick={(e) => handleDeleteSingleShift(s.id, e)}
                          />
                        )}
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
        </div>
      </div>

      {/* MODAL: ADD SHIFT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full p-5 shadow-2xl space-y-4 max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 shrink-0">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>Aggiungi Turno nel Calendario</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col text-xs overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 overflow-hidden">
                
                {/* LEFT COLUMN: Context Info & Graphical Situation */}
                <div className="space-y-3 flex flex-col">
                  {/* Informazione Operatore - locked/evidenziato */}
                  <div className="bg-indigo-600/5 border border-indigo-500/20 p-3 rounded-2xl flex items-center justify-between shadow-3xs shrink-0">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700 block mb-0.5">Operatore Selezionato</span>
                      <span className="text-lg font-extrabold text-indigo-950 block leading-none">
                        {staff.find(st => st.id === newStaffId) ? `${staff.find(st => st.id === newStaffId)?.nome} ${staff.find(st => st.id === newStaffId)?.cognome}` : "Operatore"}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm border-2 border-white shadow-sm uppercase shrink-0 ml-2">
                      {(() => {
                        const activeStaff = staff.find(st => st.id === newStaffId);
                        return activeStaff ? `${activeStaff.nome.charAt(0)}${activeStaff.cognome.charAt(0)}` : "OP";
                      })()}
                    </div>
                  </div>

                  {/* Situazione Grafica del Giorno (Richiesta Utente: Identica al hover) */}
                  <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-md border border-slate-700 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Situazione Copertura</span>
                        <span className="text-xs font-black text-slate-100 tracking-wide bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">{formatItalianVerbalDate(newDate).toUpperCase()}</span>
                      </div>
                      {(() => {
                        const cov = getDayCoverageDetails(newDate);
                        return cov.isComplete ? (
                          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> OK
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full text-[9px] font-black flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> {cov.totalCovered}/{cov.totalRequired}
                          </span>
                        );
                      })()}
                    </div>

                    {(() => {
                      const cov = getDayCoverageDetails(newDate);
                      const renderMiniChip = (slotId: string, icon: string) => {
                        const slot = cov.mandatorySlots.find(s => s.id === slotId) || cov.extraSlots.find(s => s.id === slotId);
                        if (!slot) return null;
                        const isCovered = slot.isCovered;
                        return (
                          <div key={slotId} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[9px] font-bold truncate ${
                            isCovered ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                          }`}>
                            <span>{icon}</span>
                            <span className={isCovered ? "text-white truncate" : "opacity-50"}>
                              {isCovered ? slot.assignedStaff[0]?.nome : "-"}
                            </span>
                          </div>
                        );
                      };

                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 font-black text-[8px] text-indigo-400 uppercase tracking-tighter opacity-70">🏠 Strutture</div>
                            <div className="grid grid-cols-1 gap-1">
                              <div className="flex gap-1">{renderMiniChip("v1_m", "🌅")} {renderMiniChip("v1_p", "🌆")}</div>
                              <div className="flex gap-1">{renderMiniChip("v2_m", "🌅")} {renderMiniChip("v2_p", "🌆")}</div>
                              <div className="flex gap-1">{renderMiniChip("v4_m", "🌅")} {renderMiniChip("v4_p", "🌆")}</div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1 font-black text-[8px] text-indigo-400 uppercase tracking-tighter opacity-70">⚙️ Servizi</div>
                            <div className="grid grid-cols-1 gap-1">
                              {renderMiniChip("notte", "🌙")}
                              {renderMiniChip("cucina", "🍲")}
                              {renderMiniChip("alzate", "🪣")}
                              {renderMiniChip("pulizie", "🧹")}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Scelta Struttura */}
                  <div className="space-y-1.5 shrink-0">
                    <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">Struttura di Assegnazione *</label>
                    <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    const sat1 = isStrutturaSatura("Vannucci 1", newDate);
                    return (
                      <button
                        type="button"
                        onClick={() => !sat1 && setNewStruttura("Vannucci 1")}
                        disabled={sat1}
                        title={sat1 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                        className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                          sat1 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                          "cursor-pointer " + (newStruttura === "Vannucci 1"
                            ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"
                            : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100")
                        }`}
                      >
                        <span className="text-[11px]">Vannucci</span>
                        <strong className="text-base font-black leading-none">1</strong>
                      </button>
                    );
                  })()}
                  {(() => {
                    const sat2 = isStrutturaSatura("Vannucci 2", newDate);
                    return (
                      <button
                        type="button"
                        onClick={() => !sat2 && setNewStruttura("Vannucci 2")}
                        disabled={sat2}
                        title={sat2 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                        className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                          sat2 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                          "cursor-pointer " + (newStruttura === "Vannucci 2"
                            ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"
                            : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100")
                        }`}
                      >
                        <span className="text-[11px]">Vannucci</span>
                        <strong className="text-base font-black leading-none">2</strong>
                      </button>
                    );
                  })()}
                  {(() => {
                    const sat3 = isStrutturaSatura("Vannucci 4", newDate);
                    return (
                      <button
                        type="button"
                        onClick={() => !sat3 && setNewStruttura("Vannucci 4")}
                        disabled={sat3}
                        title={sat3 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                        className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                          sat3 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                          "cursor-pointer " + (newStruttura === "Vannucci 4"
                            ? "bg-lime-400 text-lime-950 border-lime-500 ring-4 ring-lime-400/25 scale-102"
                            : "bg-lime-50/50 text-lime-950 border-lime-200 hover:bg-lime-100")
                        }`}
                      >
                        <span className="text-[11px]">Vannucci</span>
                        <strong className="text-base font-black leading-none">4</strong>
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>

                {/* MIDDLE COLUMN: Presets */}
                <div className="space-y-3 overflow-hidden flex flex-col">
                  {/* Shift Presets */}
                  <div className="space-y-2 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between shrink-0">
                      <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">
                        Preset Orari & Turni ({savedPresets.length})
                      </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPresetInizio(newOrarioInizio);
                        setCustomPresetFine(newOrarioFine);
                        setCustomPresetTipo(newTipoTurno === "Riposo" || newTipoTurno === "Ferie" ? "Cucina" : newTipoTurno);
                        setShowAddPresetForm(!showAddPresetForm);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddPresetForm ? "Chiudi Form" : "Nuovo Preset"}</span>
                    </button>
                    {savedPresets.length !== INITIAL_SHIFT_PRESETS.length && (
                      <button
                        type="button"
                        onClick={handleResetDefaultPresets}
                        className="text-[10px] font-medium text-slate-400 hover:text-slate-600 underline"
                        title="Ripristina preset di default"
                      >
                        Ripristina
                      </button>
                    )}
                  </div>
                </div>


                {/* Inline form to create and save a new preset */}
                {showAddPresetForm && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-950 text-[11px] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Memorizza Nuovo Preset Orario</span>
                      </span>
                      <button type="button" onClick={() => setShowAddPresetForm(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 text-[9px] mb-0.5">Nome / Etichetta</label>
                        <input
                          type="text"
                          placeholder="es. Cucina, Post-pranzo"
                          value={customPresetName}
                          onChange={(e) => setCustomPresetName(e.target.value)}
                          className="w-full border p-1.5 rounded-lg bg-white font-semibold text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 text-[9px] mb-0.5">Tipo Turno</label>
                        <select
                          value={customPresetTipo}
                          onChange={(e) => setCustomPresetTipo(e.target.value)}
                          className="w-full border p-1.5 rounded-lg bg-white font-semibold text-xs"
                        >
                          <option value="Cucina">🍳 Cucina</option>
                          <option value="Mattina">🌅 Mattina</option>
                          <option value="Pomeriggio">🌆 Pomeriggio</option>
                          <option value="Notte">🌙 Notte</option>
                          <option value="Reperibilità">📞 Reperibilità</option>
                          <option value="Personalizzato">⏱️ Personalizzato</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 text-[9px] mb-0.5">Ora Inizio</label>
                        <input
                          type="time"
                          value={customPresetInizio}
                          onChange={(e) => setCustomPresetInizio(e.target.value)}
                          className="w-full border p-1.5 rounded-lg bg-white font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 text-[9px] mb-0.5">Ora Fine</label>
                        <input
                          type="time"
                          value={customPresetFine}
                          onChange={(e) => setCustomPresetFine(e.target.value)}
                          className="w-full border p-1.5 rounded-lg bg-white font-mono text-xs font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewPreset}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Memorizza Preset Orario</span>
                    </button>
                  </div>
                )}

                {/* Preset Buttons Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {savedPresets
                    .filter((preset) => {
                      if (!preset.struttura || preset.tipoTurno === "Cucina" || preset.tipoTurno === "Notte" || preset.tipoTurno === "Pulizie") {
                        return true;
                      }
                      const currentS = newStruttura.toLowerCase();
                      const presetS = preset.struttura.toLowerCase();
                      if (currentS.includes("1") && presetS.includes("1")) return true;
                      if (currentS.includes("2") && presetS.includes("2")) return true;
                      if (currentS.includes("4") && presetS.includes("4")) return true;
                      return false;
                    })
                    .map((preset) => {
                    const isSelected = newTipoTurno === preset.tipoTurno && newOrarioInizio === preset.orarioInizio && newOrarioFine === preset.orarioFine;
                    const validity = checkPotentialShiftValidity(newStaffId, newDate, preset.tipoTurno, newStruttura, preset.orarioInizio, preset.orarioFine);

                    return (
                      <div key={preset.id} className="relative group/preset">
                        <button
                          type="button"
                          onDoubleClick={() => {
                            if (!validity.valid) return;
                            handleFastSubmit(preset);
                          }}
                          onClick={() => {
                            if (!validity.valid) return;
                            setNewTipoTurno(preset.tipoTurno);
                            setNewOrarioInizio(preset.orarioInizio);
                            setNewOrarioFine(preset.orarioFine);
                            if (preset.tipoTurno === "Cucina" && !newNote) {
                              setNewNote("Servizio Cucina e Mensa");
                            }
                          }}
                          disabled={!validity.valid}
                          title={validity.reason || `${preset.label} (${preset.orarioInizio} - ${preset.orarioFine})`}
                          className={`w-full p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center relative ${
                            !validity.valid ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200" :
                            "cursor-pointer " + (isSelected
                              ? preset.tipoTurno === "Pulizie"
                                ? "bg-teal-600 border-teal-700 text-white ring-4 ring-teal-600/30"
                                : preset.tipoTurno === "Cucina"
                                ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30"
                                : preset.tipoTurno === "Notte"
                                ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30"
                                : newStruttura === "Vannucci 1" || newStruttura === "Struttura 1"
                                ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"
                                : newStruttura === "Vannucci 2" || newStruttura === "Struttura 2"
                                ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"
                                : "bg-lime-400 border-lime-500 text-lime-950 ring-4 ring-lime-400/25"
                              : preset.tipoTurno === "Pulizie"
                              ? "bg-teal-50/80 border-teal-200 hover:bg-teal-100 text-teal-950"
                              : preset.tipoTurno === "Cucina"
                              ? "bg-sky-50/80 border-sky-300 hover:bg-sky-100 text-sky-950"
                              : preset.tipoTurno === "Notte"
                              ? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900"
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                          }`}
                        >
                          <span className="font-extrabold text-[12px] truncate pr-5">{preset.label}</span>
                          <span className="text-[9px] opacity-75 font-normal truncate">
                            {preset.subtitle || `${preset.orarioInizio} - ${preset.orarioFine}`}
                          </span>
                        </button>

                        {/* Trash Button to Remove Any Preset */}
                        <button
                          type="button"
                          onClick={(e) => handleRemovePreset(preset.id, e)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-rose-600 hover:text-white text-rose-500 bg-white/80 shadow-3xs transition-all cursor-pointer z-10"
                          title="Rimuovi questo preset orario"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Turno Notturno Generale */}
                  <button
                    type="button"
                    disabled={hasNotteOnSelectedDay}
                    onDoubleClick={() => {
                      if (hasNotteOnSelectedDay) return;
                      setNewNote("Turno di Notte");
                      handleFastSubmit({ tipoTurno: "Notte", orarioInizio: "23:00", orarioFine: "07:00" });
                    }}
                    onClick={() => {
                      if (hasNotteOnSelectedDay) return;
                      setNewTipoTurno("Notte");
                      setNewOrarioInizio("23:00");
                      setNewOrarioFine("07:00");
                      if (!newNote) setNewNote("Turno di Notte");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                      hasNotteOnSelectedDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                      "cursor-pointer " + (newTipoTurno === "Notte" && newOrarioInizio === "23:00" && newOrarioFine === "07:00" ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30" : "bg-blue-50/80 border-blue-200 hover:bg-blue-100 text-blue-900")
                    }`}
                    title={hasNotteOnSelectedDay ? "Turno Notte già assegnato per questo giorno" : "Clicca per selezionare il turno Notte"}
                  >
                    <span className="font-extrabold text-[12px]">🌙 Notte</span>
                    <span className="text-[9px] opacity-75 font-normal">{hasNotteOnSelectedDay ? "Già assegnato" : "23:00 - 07:00"}</span>
                  </button>

                  {/* Servizi Comuni: Cucina */}
                  <button
                    type="button"
                    disabled={hasCucinaOnSelectedDay}
                    onDoubleClick={() => {
                      if (hasCucinaOnSelectedDay) return;
                      setNewNote("Servizio Cucina e Mensa");
                      handleFastSubmit({ tipoTurno: "Cucina", orarioInizio: "10:30", orarioFine: "15:30" });
                    }}
                    onClick={() => {
                      if (hasCucinaOnSelectedDay) return;
                      setNewTipoTurno("Cucina");
                      setNewOrarioInizio("10:30");
                      setNewOrarioFine("15:30");
                      if (!newNote) setNewNote("Servizio Cucina e Mensa");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                      hasCucinaOnSelectedDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                      "cursor-pointer " + (newTipoTurno === "Cucina" && newOrarioInizio === "10:30" && newOrarioFine === "15:30" ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30" : "bg-sky-50/80 border-sky-300 hover:bg-sky-100 text-sky-950")
                    }`}
                    title={hasCucinaOnSelectedDay ? "Turno Cucina già assegnato per questo giorno" : "Clicca per selezionare il turno Cucina"}
                  >
                    <span className="font-extrabold text-[12px]">🍲 Cucina</span>
                    <span className="text-[9px] opacity-75 font-normal">{hasCucinaOnSelectedDay ? "Già assegnato" : "10:30 - 15:30"}</span>
                  </button>

                  {/* Servizi Comuni: Pulizie */}
                  <button
                    type="button"
                    disabled={hasPulizieOnSelectedDay}
                    onDoubleClick={() => {
                      if (hasPulizieOnSelectedDay) return;
                      setNewNote("Servizio Pulizie & Supporto Alzate");
                      handleFastSubmit({ tipoTurno: "Pulizie", orarioInizio: "07:00", orarioFine: "11:00" });
                    }}
                    onClick={() => {
                      if (hasPulizieOnSelectedDay) return;
                      setNewTipoTurno("Pulizie");
                      setNewOrarioInizio("07:00");
                      setNewOrarioFine("11:00");
                      if (!newNote) setNewNote("Servizio Pulizie & Supporto Alzate");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                      hasPulizieOnSelectedDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                      "cursor-pointer " + (newTipoTurno === "Pulizie" && newOrarioInizio === "07:00" && newOrarioFine === "11:00" ? "bg-teal-600 border-teal-700 text-white ring-4 ring-teal-600/30" : "bg-teal-50/80 border-teal-200 hover:bg-teal-100 text-teal-950")
                    }`}
                    title={hasPulizieOnSelectedDay ? "Turno Pulizie già assegnato per questo giorno" : "Clicca per selezionare il turno Pulizie"}
                  >
                    <span className="font-extrabold text-[12px] flex items-center gap-1">🪣🧹 Pulizie</span>
                    <span className="text-[9px] opacity-75 font-normal">{hasPulizieOnSelectedDay ? "Già assegnato" : "07:00 - 11:00 (Aiuto Alzate V1)"}</span>
                  </button>

                  {/* COMBO SPECIALE 2-COL BUTTON */}
                  <button
                    type="button"
                    disabled={hasPulizieOnSelectedDay || hasNotteOnSelectedDay}
                    onDoubleClick={() => {
                      if (hasPulizieOnSelectedDay || hasNotteOnSelectedDay) return;
                      handleAddComboPulizieNotte(newStaffId, newDate, newStruttura);
                    }}
                    onClick={() => {
                      if (hasPulizieOnSelectedDay || hasNotteOnSelectedDay) return;
                      handleAddComboPulizieNotte(newStaffId, newDate, newStruttura);
                    }}
                    className={`col-span-2 p-2.5 rounded-xl border-2 font-bold transition-all text-xs flex flex-col justify-center shadow-xs ${
                      (hasPulizieOnSelectedDay || hasNotteOnSelectedDay)
                        ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                        : "cursor-pointer border-teal-500/60 bg-gradient-to-r from-teal-500/15 via-indigo-500/15 to-blue-500/15 hover:from-teal-500/25 hover:to-blue-500/25"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-indigo-950 flex items-center gap-1">
                        <span>⚡ Combo Regola Speciale</span>
                        <span className="text-[9px] bg-teal-700 text-white px-1.5 py-0.2 rounded-full font-bold">12h Riposo</span>
                      </span>
                      <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">5h oggi (4h+1h)</span>
                    </div>
                    <span className="text-[10px] text-slate-700 font-semibold mt-0.5">
                      {hasPulizieOnSelectedDay || hasNotteOnSelectedDay 
                        ? "⚠️ Pulizie o Notte già presenti in questo giorno" 
                        : "✨ Carica: 🪣 Pulizie (07:00-11:00) + 🌙 Notte (23:00-07:00)"}
                    </span>
                  </button>

                  {/* Riposo */}
                  <button
                    type="button"
                    onDoubleClick={() => handleFastSubmit({ tipoTurno: "Riposo", orarioInizio: "00:00", orarioFine: "00:00" })}
                    onClick={() => {
                      setNewTipoTurno("Riposo");
                      setNewOrarioInizio("00:00");
                      setNewOrarioFine("00:00");
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer ${
                      newTipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-extrabold text-[12px]">🛋️ Riposo</span>
                    <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                  </button>

                  {/* Ferie */}
                  <button
                    type="button"
                    onDoubleClick={() => handleFastSubmit({ tipoTurno: "Ferie", orarioInizio: "00:00", orarioFine: "00:00" })}
                    onClick={() => {
                      handleOpenVacationModal(newStaffId, newDate);
                    }}
                    className="p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs hover:from-amber-600 hover:to-orange-600 ring-2 ring-amber-400/30"
                  >
                    <span className="font-extrabold text-[12px] flex items-center gap-1">🏖️ Ferie</span>
                    <span className="text-[9px] opacity-90 font-normal">Doppio clic: carica ferie / Clic: apri calendario</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Custom Time & Notes */}
            <div className="space-y-3 flex flex-col overflow-hidden">
              {/* Custom Time Picker & Quick Save */}
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-indigo-900 block tracking-tight">Personalizzazione Orario</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        setCustomPresetInizio(newOrarioInizio);
                        setCustomPresetFine(newOrarioFine);
                        const computedTipo = newTipoTurno === "Riposo" || newTipoTurno === "Ferie" ? "Cucina" : newTipoTurno;
                        setCustomPresetTipo(computedTipo);
                        handleAddNewPreset(e as any, newOrarioInizio, newOrarioFine, computedTipo);
                      }}
                      className="text-[10px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                      title="Salva l'orario inserito nei tuoi preset memorizzati"
                    >
                      <Save className="w-3 h-3 text-indigo-600" />
                      <span>Memorizza come Preset</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Inizio (HH:MM)</label>
                      <input
                        type="time"
                        value={newOrarioInizio}
                        onChange={(e) => setNewOrarioInizio(e.target.value)}
                        className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Fine (HH:MM)</label>
                      <input
                        type="time"
                        value={newOrarioFine}
                        onChange={(e) => setNewOrarioFine(e.target.value)}
                        className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

              {/* Notes */}
              <div>
                <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px] mb-1">Note o Mansioni Specifiche:</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="w-full border p-2.5 rounded-xl bg-slate-50 font-medium focus:bg-white"
                  placeholder="es. Responsabile carrello medicinali / Sostituzione turno"
                />
            </div>
            
              <div className="pt-3 flex justify-end gap-2 border-t mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
                >
                  Salva Turno in Calendario
                </button>
              </div>
            </div>
          </div>
          </form>
        </div>
      </div>
      )}

      {/* MODAL: STAFF PROFILE & NOTES & STATS */}
      {selectedStaffProfile && (
        <StaffProfileModal
          staffMember={selectedStaffProfile}
          allShifts={shifts}
          onClose={() => setSelectedStaffProfile(null)}
          onUpdateStaff={handleUpdateSingleStaffFromShifts}
          isAdmin={!isStaffRole}
        />
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
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo di Contratto</label>
                  <input
                    type="text"
                    placeholder="es. Part-time 24h, P.IVA..."
                    value={newStaffTipoContratto}
                    onChange={e => setNewStaffTipoContratto(e.target.value)}
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



      {/* MODAL: SHIFT DETAIL / EDIT / DELETE */}
      {selectedShiftForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600" />
                <span>{isStaffRole ? "Scheda Dettaglio Turno" : "Gestione & Modifica Turno"}</span>
              </h3>
              <button onClick={() => setSelectedShiftForDetail(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const mem = staff.find(s => s.id === selectedShiftForDetail.staffId);
              
              if (isStaffRole) {
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
                      <span className={`px-3 py-1 rounded-xl font-black text-xs shadow-2xs ${getShiftBadgeStyle(selectedShiftForDetail.tipoTurno, selectedShiftForDetail.orarioInizio, selectedShiftForDetail.orarioFine, selectedShiftForDetail.struttura)}`}>
                        {selectedShiftForDetail.tipoTurno}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-semibold">Data Turno:</span>
                        <span className="font-extrabold text-slate-900 capitalize">
                          {formatItalianVerbalDate(selectedShiftForDetail.data)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-slate-500 font-semibold">Orario Previsto:</span>
                        <span className="font-mono font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200/80 text-xs shadow-2xs">
                          {selectedShiftForDetail.orarioInizio} — {selectedShiftForDetail.orarioFine}
                        </span>
                      </div>

                      {selectedShiftForDetail.struttura && selectedShiftForDetail.tipoTurno !== "Notte" && selectedShiftForDetail.tipoTurno !== "Riposo" && selectedShiftForDetail.tipoTurno !== "Ferie" && selectedShiftForDetail.tipoTurno !== "Cucina" && selectedShiftForDetail.tipoTurno !== "Pulizie" && (
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <span className="text-slate-500 font-semibold">Struttura:</span>
                          <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
                            🏠 {selectedShiftForDetail.struttura}
                          </span>
                        </div>
                      )}

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
                <div className="flex flex-col text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: Context Info */}
                    <div className="space-y-4">
                      {/* Informazione Operatore */}
                      <div className="bg-indigo-600/10 border-2 border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block mb-1">Collaboratore Individuato</span>
                          <span className="text-xl font-extrabold text-indigo-950 block leading-none">
                            {mem ? `${mem.nome} ${mem.cognome}` : "Operatore"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 block mt-1 uppercase tracking-wide">
                            💼 {mem?.ruolo || "Staff"}
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-base border-2 border-white shadow-md uppercase shrink-0 ml-2">
                          {mem ? `${mem.nome.charAt(0)}${mem.cognome.charAt(0)}` : "OP"}
                        </div>
                      </div>

                      {/* Data del Turno */}
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center shadow-3xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block mb-1">Data Turno</span>
                        <span className="text-base font-extrabold text-slate-800 block capitalize">
                          📅 {formatItalianVerbalDate(editShiftDate)}
                        </span>
                      </div>

                      {/* Scelta Struttura */}
                      <div className="space-y-1.5">
                        <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">Struttura di Assegnazione *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(() => {
                            const sat1 = isStrutturaSatura("Vannucci 1", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat1 && setEditShiftStruttura("Vannucci 1")}
                                disabled={sat1}
                                title={sat1 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                                  sat1 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"
                                    ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"
                                    : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100")
                                }`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">1</strong>
                              </button>
                            );
                          })()}
                          {(() => {
                            const sat2 = isStrutturaSatura("Vannucci 2", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat2 && setEditShiftStruttura("Vannucci 2")}
                                disabled={sat2}
                                title={sat2 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                                  sat2 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"
                                    ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"
                                    : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100")
                                }`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">2</strong>
                              </button>
                            );
                          })()}
                          {(() => {
                            const sat3 = isStrutturaSatura("Vannucci 4", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat3 && setEditShiftStruttura("Vannucci 4")}
                                disabled={sat3}
                                title={sat3 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center ${
                                  sat3 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 4" || editShiftStruttura === "Struttura 4"
                                    ? "bg-lime-400 text-lime-950 border-lime-500 ring-4 ring-lime-400/25 scale-102"
                                    : "bg-lime-50/50 text-lime-950 border-lime-200 hover:bg-lime-100")
                                }`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">4</strong>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE COLUMN: Presets */}
                    <div className="space-y-4">
                      {/* Shift Presets */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">
                            Preset Orari & Turni ({savedPresets.length}) *
                          </label>
                        </div>

                        {/* Preset Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {savedPresets
                            .filter((preset) => {
                              if (!preset.struttura || preset.tipoTurno === "Cucina" || preset.tipoTurno === "Notte" || preset.tipoTurno === "Pulizie") {
                                return true;
                              }
                              const currentS = editShiftStruttura.toLowerCase();
                              const presetS = preset.struttura.toLowerCase();
                              if (currentS.includes("1") && presetS.includes("1")) return true;
                              if (currentS.includes("2") && presetS.includes("2")) return true;
                              if (currentS.includes("4") && presetS.includes("4")) return true;
                              return false;
                            })
                            .map((preset) => {
                            const isSelected = selectedShiftForDetail?.tipoTurno === preset.tipoTurno && editShiftInizio === preset.orarioInizio && editShiftFine === preset.orarioFine;
                            const validity = checkPotentialShiftValidity(selectedShiftForDetail?.staffId || "", editShiftDate, preset.tipoTurno, editShiftStruttura, preset.orarioInizio, preset.orarioFine, selectedShiftForDetail?.id);

                            return (
                              <div key={preset.id} className="relative group/preset">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!validity.valid) return;
                                    setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: preset.tipoTurno } : prev);
                                    setEditShiftInizio(preset.orarioInizio);
                                    setEditShiftFine(preset.orarioFine);
                                    if (preset.tipoTurno === "Cucina" && !editShiftNote) {
                                      setEditShiftNote("Servizio Cucina e Mensa");
                                    }
                                  }}
                                  disabled={!validity.valid}
                                  title={validity.reason || `${preset.label} (${preset.orarioInizio} - ${preset.orarioFine})`}
                                  className={`w-full p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center relative ${
                                    !validity.valid ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200" :
                                    "cursor-pointer " + (isSelected
                                      ? preset.tipoTurno === "Pulizie"
                                        ? "bg-teal-600 border-teal-700 text-white ring-4 ring-teal-600/30"
                                        : preset.tipoTurno === "Cucina"
                                        ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30"
                                        : preset.tipoTurno === "Notte"
                                        ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30"
                                        : editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"
                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"
                                        : editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"
                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"
                                        : "bg-lime-400 border-lime-500 text-lime-950 ring-4 ring-lime-400/25"
                                      : preset.tipoTurno === "Pulizie"
                                      ? "bg-teal-50/80 border-teal-200 hover:bg-teal-100 text-teal-950"
                                      : preset.tipoTurno === "Cucina"
                                      ? "bg-sky-50/80 border-sky-300 hover:bg-sky-100 text-sky-950"
                                      : preset.tipoTurno === "Notte"
                                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                                  }`}
                                >
                                  <span className="font-extrabold text-[12px] truncate pr-1">{preset.label}</span>
                                  <span className="text-[9px] opacity-75 font-normal truncate">
                                    {preset.subtitle || `${preset.orarioInizio} - ${preset.orarioFine}`}
                                  </span>
                                </button>
                              </div>
                            );
                          })}

                          {/* Turno Notturno Generale */}
                          <button
                            type="button"
                            disabled={hasNotteOnEditDay}
                            onClick={() => {
                              if (hasNotteOnEditDay) return;
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Notte" } : prev);
                              setEditShiftInizio("23:00");
                              setEditShiftFine("07:00");
                              if (!editShiftNote) setEditShiftNote("Turno di Notte");
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                              hasNotteOnEditDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                              "cursor-pointer " + (selectedShiftForDetail?.tipoTurno === "Notte" && editShiftInizio === "23:00" && editShiftFine === "07:00" ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30" : "bg-blue-50/80 border-blue-200 hover:bg-blue-100 text-blue-900")
                            }`}
                            title={hasNotteOnEditDay ? "Turno Notte già assegnato per questo giorno" : "Clicca per selezionare il turno Notte"}
                          >
                            <span className="font-extrabold text-[12px]">🌙 Notte</span>
                            <span className="text-[9px] opacity-75 font-normal">{hasNotteOnEditDay ? "Già assegnato" : "23:00 - 07:00"}</span>
                          </button>

                          {/* Servizi Comuni: Cucina */}
                          <button
                            type="button"
                            disabled={hasCucinaOnEditDay}
                            onClick={() => {
                              if (hasCucinaOnEditDay) return;
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Cucina" } : prev);
                              setEditShiftInizio("10:30");
                              setEditShiftFine("15:30");
                              if (!editShiftNote) setEditShiftNote("Servizio Cucina e Mensa");
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                              hasCucinaOnEditDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                              "cursor-pointer " + (selectedShiftForDetail?.tipoTurno === "Cucina" && editShiftInizio === "10:30" && editShiftFine === "15:30" ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30" : "bg-sky-50/80 border-sky-200 hover:bg-sky-100 text-sky-900")
                            }`}
                            title={hasCucinaOnEditDay ? "Turno Cucina già assegnato per questo giorno" : "Clicca per selezionare il turno Cucina"}
                          >
                            <span className="font-extrabold text-[12px]">🍲 Cucina</span>
                            <span className="text-[9px] opacity-75 font-normal">{hasCucinaOnEditDay ? "Già assegnato" : "10:30 - 15:30"}</span>
                          </button>

                          {/* Servizi Comuni: Pulizie */}
                          <button
                            type="button"
                            disabled={hasPulizieOnEditDay}
                            onClick={() => {
                              if (hasPulizieOnEditDay) return;
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Pulizie" } : prev);
                              setEditShiftInizio("07:00");
                              setEditShiftFine("11:00");
                              if (!editShiftNote) setEditShiftNote("Servizio Pulizie & Supporto Alzate");
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center ${
                              hasPulizieOnEditDay ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400" :
                              "cursor-pointer " + (selectedShiftForDetail?.tipoTurno === "Pulizie" && editShiftInizio === "07:00" && editShiftFine === "11:00" ? "bg-teal-600 border-teal-700 text-white ring-4 ring-teal-600/30" : "bg-teal-50/80 border-teal-200 hover:bg-teal-100 text-teal-950")
                            }`}
                            title={hasPulizieOnEditDay ? "Turno Pulizie già assegnato per questo giorno" : "Clicca per selezionare il turno Pulizie"}
                          >
                            <span className="font-extrabold text-[12px] flex items-center gap-1">🪣🧹 Pulizie</span>
                            <span className="text-[9px] opacity-75 font-normal">{hasPulizieOnEditDay ? "Già assegnato" : "07:00 - 11:00"}</span>
                          </button>

                          {/* Riposo */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Riposo" } : prev);
                              setEditShiftInizio("00:00");
                              setEditShiftFine("00:00");
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer ${
                              selectedShiftForDetail?.tipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="font-extrabold text-[12px]">🛋️ Riposo</span>
                            <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                          </button>

                          {/* Ferie */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Ferie" } : prev);
                              setEditShiftInizio("00:00");
                              setEditShiftFine("00:00");
                            }}
                            className={`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer ${
                              selectedShiftForDetail?.tipoTurno === "Ferie" ? "bg-amber-800 border-amber-900 text-white ring-4 ring-amber-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span className="font-extrabold text-[12px]">🏖️ Ferie</span>
                            <span className="text-[9px] opacity-75 font-normal">Pianificate / Desiderate</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Custom Time & Notes */}
                    <div className="space-y-4 flex flex-col">
                      {/* Custom Time Picker */}
                      <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-900 block">Modifica Orario Effettivo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Inizio (HH:MM)</label>
                              <input
                                type="time"
                                value={editShiftInizio}
                                onChange={(e) => setEditShiftInizio(e.target.value)}
                                className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fine (HH:MM)</label>
                              <input
                                type="time"
                                value={editShiftFine}
                                onChange={(e) => setEditShiftFine(e.target.value)}
                                className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>

                      {/* Notes */}
                      <div>
                        <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px] mb-1">Note o Mansioni Specifiche:</label>
                        <input
                          type="text"
                          value={editShiftNote}
                          onChange={e => setEditShiftNote(e.target.value)}
                          className="w-full border p-2.5 rounded-xl bg-slate-50 font-medium focus:bg-white"
                          placeholder="es. Sostituzione, mansioni speciali..."
                        />
                      </div>
                    
                      <div className="pt-3 flex justify-between items-center border-t mt-2 shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingleShift(selectedShiftForDetail.id, e)}
                          className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span className="hidden sm:inline">Elimina Turno</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForDetail(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveShiftEdit}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
                          >
                            Salva Modifiche
                          </button>
                        </div>
                      </div>
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
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-amber-200 my-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-md text-xl shrink-0">
                  🏖️
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>Pianificazione & Inserimento Ferie</span>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Calendario Interattivo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleziona un singolo giorno o un intervallo (dal-al) cliccando direttamente sul calendario
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowVacationModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVacationSubmit} className="space-y-4 text-xs">
              
              {/* Select Staff Member */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1.5 flex items-center justify-between">
                  <span>Operatore / Dipendente *</span>
                  {currentUser?.role === 'staff' && (
                    <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      👤 Il tuo account personale
                    </span>
                  )}
                </label>
                <select
                  value={vacationStaffId}
                  onChange={e => {
                    if (currentUser?.role === 'staff') return;
                    setVacationStaffId(e.target.value);
                  }}
                  disabled={currentUser?.role === 'staff'}
                  className="w-full border border-slate-300 p-2.5 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-sm text-slate-900 disabled:opacity-80 disabled:cursor-not-allowed shadow-3xs"
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

              {/* Date Selection Info Banner */}
              <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-3 flex items-center justify-between shadow-3xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <div>
                    <div className="text-[11px] font-extrabold text-amber-950 flex items-center gap-1.5">
                      <span>Data Inizio (giorno selezionato):</span>
                      <span className="bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded-md font-black">
                        {new Date(vacationStartDate).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-800 font-medium mt-0.5">
                      {vacationStartDate === vacationEndDate
                        ? "👉 Clicca su un giorno successivo nel calendario per selezionare la data di fine, oppure conferma per 1 solo giorno."
                        : `📅 Fino a: ${new Date(vacationEndDate).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`}
                    </div>
                  </div>
                </div>

                {vacationStartDate !== vacationEndDate && (
                  <button
                    type="button"
                    onClick={() => setVacationEndDate(vacationStartDate)}
                    className="text-[10px] font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl shadow-3xs cursor-pointer transition-colors"
                  >
                    Resetta a 1 Giorno
                  </button>
                )}
              </div>

              {/* Interactive Calendar Month Picker */}
              <div className="border border-amber-200/90 rounded-2xl p-3.5 bg-gradient-to-b from-amber-50/40 to-white shadow-3xs space-y-3">
                {/* Calendar Header with navigation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(vacationCalendarMonth.getFullYear(), vacationCalendarMonth.getMonth() - 1, 1);
                        setVacationCalendarMonth(prev);
                      }}
                      className="p-1.5 rounded-xl hover:bg-amber-100 text-slate-700 font-bold transition-colors cursor-pointer border border-amber-200/60 bg-white"
                      title="Mese precedente"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-black text-slate-900 text-sm capitalize">
                      {vacationCalendarMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(vacationCalendarMonth.getFullYear(), vacationCalendarMonth.getMonth() + 1, 1);
                        setVacationCalendarMonth(next);
                      }}
                      className="p-1.5 rounded-xl hover:bg-amber-100 text-slate-700 font-bold transition-colors cursor-pointer border border-amber-200/60 bg-white"
                      title="Mese successivo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      setVacationCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    }}
                    className="text-[10px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2 py-1 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                  >
                    Mese Corrente
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-black text-[10px] text-slate-500 border-b border-slate-100 pb-1.5">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mer</span>
                  <span>Gio</span>
                  <span>Ven</span>
                  <span className="text-amber-700">Sab</span>
                  <span className="text-red-600">Dom</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const year = vacationCalendarMonth.getFullYear();
                    const month = vacationCalendarMonth.getMonth();
                    const firstDayOfMonth = new Date(year, month, 1);
                    const lastDayOfMonth = new Date(year, month + 1, 0);
                    const totalDays = lastDayOfMonth.getDate();
                    
                    // Day of week index (0=Sun, 1=Mon, ..., 6=Sat) converted to Monday=0
                    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7;

                    const dayCells = [];
                    // Pad empty cells before 1st of month
                    for (let i = 0; i < startWeekday; i++) {
                      dayCells.push(<div key={`pad-${i}`} className="h-9" />);
                    }

                    // Render days
                    for (let d = 1; d <= totalDays; d++) {
                      const dateObj = new Date(year, month, d);
                      const monthStr = String(month + 1).padStart(2, "0");
                      const dayStr = String(d).padStart(2, "0");
                      const dateStr = `${year}-${monthStr}-${dayStr}`;

                      const isStart = dateStr === vacationStartDate;
                      const isEnd = dateStr === vacationEndDate;
                      const isBetween = vacationStartDate && vacationEndDate && dateStr > vacationStartDate && dateStr < vacationEndDate;
                      const isSelected = isStart || isEnd || isBetween;
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                      const isToday = dateStr === todayStr;

                      // Check if employee already has ferie or work shift
                      const existingStaffShifts = shifts.filter(s => s.staffId === vacationStaffId && s.data === dateStr);
                      const hasExistingFerie = existingStaffShifts.some(s => s.tipoTurno === "Ferie");
                      const hasExistingWork = existingStaffShifts.some(s => s.tipoTurno !== "Ferie" && s.tipoTurno !== "Riposo");

                      let buttonClasses = "h-9 w-full rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center cursor-pointer ";
                      if (isStart && isEnd) {
                        buttonClasses += "bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-black shadow-md ring-2 ring-amber-300 scale-105 z-10 ";
                      } else if (isStart) {
                        buttonClasses += "bg-amber-500 text-white font-black shadow-md rounded-r-none z-10 ";
                      } else if (isEnd) {
                        buttonClasses += "bg-orange-500 text-white font-black shadow-md rounded-l-none z-10 ";
                      } else if (isBetween) {
                        buttonClasses += "bg-amber-100 text-amber-950 font-black rounded-none border-y border-amber-300 ";
                      } else if (isToday) {
                        buttonClasses += "bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-amber-50 ";
                      } else if (isWeekend) {
                        buttonClasses += "bg-slate-50/70 text-slate-700 hover:bg-amber-100/70 ";
                      } else {
                        buttonClasses += "hover:bg-amber-100/80 text-slate-800 ";
                      }

                      dayCells.push(
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => {
                            if (dateStr >= vacationStartDate) {
                              setVacationEndDate(dateStr);
                            } else {
                              // If clicked date is before start date, update start date to clicked date
                              setVacationStartDate(dateStr);
                              setVacationEndDate(dateStr);
                            }
                          }}
                          className={buttonClasses}
                          title={
                            hasExistingFerie
                              ? `${d}: Già registrate Ferie per questo giorno`
                              : hasExistingWork
                              ? `${d}: Presente turno di lavoro (verrà sostituito con Ferie)`
                              : `${d} ${vacationCalendarMonth.toLocaleDateString("it-IT", { month: "long" })}`
                          }
                        >
                          <span className="leading-none">{d}</span>
                          {/* Mini badges for status */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {hasExistingFerie && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Ferie già impostate" />
                            )}
                            {hasExistingWork && !isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="Turno presente" />
                            )}
                          </div>
                        </button>
                      );
                    }

                    return dayCells;
                  })()}
                </div>

                {/* Range Summary Box */}
                <div className="mt-2 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <span>🏖️</span>
                    <span>
                      {(() => {
                        if (!vacationStartDate || !vacationEndDate) return "Nessuna data selezionata";
                        const s = new Date(vacationStartDate);
                        const e = new Date(vacationEndDate);
                        const diffTime = Math.abs(e.getTime() - s.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (vacationStartDate === vacationEndDate) {
                          return `1 giorno selezionato (${s.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })})`;
                        }
                        return `${diffDays} giorni selezionati (dal ${s.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} al ${e.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })})`;
                      })()}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium">
                    Clicca un giorno per estendere o cambiare il periodo
                  </span>
                </div>
              </div>

              {/* Notes / Reason */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Note / Motivo Richiesta (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Ferie estive, riposo concordato, permesso studio..."
                  value={vacationNotes}
                  onChange={e => setVacationNotes(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-2xl font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 text-xs text-slate-900 shadow-3xs"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="text-base shrink-0">🌴</span>
                <span>
                  L'inserimento assegnerà il turno <strong>"Ferie"</strong> per ogni data del periodo selezionato, evidenziandolo sia sul tabellone settimanale che mensile.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
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
                  <span>
                    {vacationStartDate === vacationEndDate
                      ? `Conferma Ferie (1 Giorno: ${new Date(vacationStartDate).toLocaleDateString("it-IT", { day: "numeric", month: "short" })})`
                      : `Conferma Ferie Periodo (${Math.ceil(Math.abs(new Date(vacationEndDate).getTime() - new Date(vacationStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Giorni)`}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: SICK LEAVE / MALATTIA / RIPOSO MEDICO */}
      {showSickModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200 border border-rose-200 my-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-md text-xl shrink-0 text-white font-black">
                  🤒
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>Registrazione Malattia / Riposo Medico</span>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full border border-rose-300">
                      Calendario Interattivo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleziona le giornate di assenza per malattia o visite mediche certificate
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSickModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSickSubmit} className="space-y-4">
              {/* Select Staff Member */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Collaboratore / Operatore
                </label>
                <select
                  value={sickStaffId}
                  onChange={e => setSickStaffId(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-2xl font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-xs text-slate-900 shadow-3xs"
                  required
                >
                  {staff.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome} {m.cognome} ({m.ruolo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Interactive Calendar for Sick Leave Range Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    <span>Seleziona Periodo Malattia / Medico</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(sickCalendarMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setSickCalendarMonth(prev);
                      }}
                      className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-700 border border-slate-200 text-xs font-bold"
                    >
                      ◀
                    </button>
                    <span className="text-xs font-black text-slate-800 px-2 min-w-[100px] text-center">
                      {sickCalendarMonth.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(sickCalendarMonth);
                        next.setMonth(next.getMonth() + 1);
                        setSickCalendarMonth(next);
                      }}
                      className="p-1.5 bg-white hover:bg-slate-200 rounded-lg text-slate-700 border border-slate-200 text-xs font-bold"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Mini Calendar Grid */}
                {(() => {
                  const year = sickCalendarMonth.getFullYear();
                  const month = sickCalendarMonth.getMonth();
                  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday start
                  const daysInMonth = new Date(year, month + 1, 0).getDate();

                  const dayCells = [];
                  const weekDaysNames = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

                  for (let i = 0; i < firstDayIndex; i++) {
                    dayCells.push(<div key={`empty-${i}`} className="h-8" />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const monthStr = String(month + 1).padStart(2, "0");
                    const dayStr = String(day).padStart(2, "0");
                    const dateStr = `${year}-${monthStr}-${dayStr}`;

                    const isStart = sickStartDate === dateStr;
                    const isEnd = sickEndDate === dateStr;
                    const isBetween = sickStartDate && sickEndDate && dateStr > sickStartDate && dateStr < sickEndDate;
                    const isToday = new Date().toISOString().split("T")[0] === dateStr;

                    let buttonClasses = "h-8 rounded-xl text-xs flex items-center justify-center transition-all cursor-pointer font-bold ";
                    if (isStart && isEnd) {
                      buttonClasses += "bg-gradient-to-tr from-rose-600 to-red-500 text-white font-black shadow-md ring-2 ring-rose-300 scale-105 z-10 ";
                    } else if (isStart) {
                      buttonClasses += "bg-rose-600 text-white font-black shadow-md rounded-r-none z-10 ";
                    } else if (isEnd) {
                      buttonClasses += "bg-red-500 text-white font-black shadow-md rounded-l-none z-10 ";
                    } else if (isBetween) {
                      buttonClasses += "bg-rose-100 text-rose-950 font-black rounded-none border-y border-rose-300 ";
                    } else if (isToday) {
                      buttonClasses += "bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-rose-50 ";
                    } else {
                      buttonClasses += "hover:bg-rose-100/80 text-slate-800 ";
                    }

                    dayCells.push(
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          if (dateStr >= sickStartDate) {
                            setSickEndDate(dateStr);
                          } else {
                            setSickStartDate(dateStr);
                            setSickEndDate(dateStr);
                          }
                        }}
                        className={buttonClasses}
                        title={`Seleziona ${dateStr}`}
                      >
                        {day}
                      </button>
                    );
                  }

                  return (
                    <div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 mb-1">
                        {weekDaysNames.map(w => <div key={w}>{w}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-xl border border-slate-200">
                        {dayCells}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                    <span>
                      {(() => {
                        if (!sickStartDate || !sickEndDate) return "Nessuna data selezionata";
                        const s = new Date(sickStartDate);
                        const e = new Date(sickEndDate);
                        const diffTime = Math.abs(e.getTime() - s.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                        if (sickStartDate === sickEndDate) {
                          return `1 giorno di malattia (${s.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })})`;
                        }
                        return `${diffDays} giorni di malattia (dal ${s.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} al ${e.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })})`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Note / Certificato Medico (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Certificato n. 12345, visita specialistica, riposo medico..."
                  value={sickNotes}
                  onChange={e => setSickNotes(e.target.value)}
                  className="w-full border border-slate-300 p-2.5 rounded-2xl font-medium bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 text-xs text-slate-900 shadow-3xs"
                />
              </div>

              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 text-rose-950 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="text-base shrink-0">🤒</span>
                <span>
                  L'inserimento assegnerà il turno <strong>"Malattia"</strong> per ogni data del periodo selezionato, registrandolo ufficialmente nel tabellone turni e nello storico presenze.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSickModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black rounded-2xl text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {sickStartDate === sickEndDate
                      ? `Conferma Malattia (1 Giorno: ${new Date(sickStartDate).toLocaleDateString("it-IT", { day: "numeric", month: "short" })})`
                      : `Conferma Malattia (${Math.ceil(Math.abs(new Date(sickEndDate).getTime() - new Date(sickStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Giorni)`}
                  </span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Day Coverage Tooltip / Inspector on Hover - Ultra Streamlined 2-Row Symbolic Graphic Layout */}
      {hoveredDayCoverageDate && (() => {
        const cov = getDayCoverageDetails(hoveredDayCoverageDate);
        const formatItalianCoverageDate = (dateStr: string) => {
          const parts = dateStr.split("-");
          if (parts.length !== 3) return dateStr;
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const weekday = d.toLocaleDateString("it-IT", { weekday: "short" });
          const dayNum = d.getDate();
          const monthName = d.toLocaleDateString("it-IT", { month: "short" });
          const year = d.getFullYear();
          return `${weekday.toUpperCase()} ${dayNum} ${monthName.toUpperCase()} ${year}`;
        };

        const v1_m = cov.mandatorySlots.find(s => s.id === "v1_m");
        const v1_p = cov.mandatorySlots.find(s => s.id === "v1_p");
        const v2_m = cov.mandatorySlots.find(s => s.id === "v2_m");
        const v2_p = cov.mandatorySlots.find(s => s.id === "v2_p");
        const v4_m = cov.mandatorySlots.find(s => s.id === "v4_m");
        const v4_p = cov.mandatorySlots.find(s => s.id === "v4_p");
        const notteSlot = cov.mandatorySlots.find(s => s.id === "notte");
        const cucinaSlot = cov.mandatorySlots.find(s => s.id === "cucina");
        const alzateSlot = cov.mandatorySlots.find(s => s.id === "alzate");
        const pulizieSlot = cov.extraSlots.find(s => s.id === "pulizie");
        const smontoNotteSlot = cov.extraSlots.find(s => s.id === "smonto_notte");

        const renderShiftSymbolChip = (slot: typeof v1_m, icon: string, shortName: string) => {
          if (!slot) return null;
          if (slot.isCovered) {
            const firstName = slot.assignedStaff[0]?.nome || "✓";
            return (
              <span
                key={slot.id}
                title={`${shortName}: ${slot.assignedStaff.map(s => `${s.nome} ${s.cognome}`).join(", ")}`}
                className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 px-1.5 py-0.5 rounded-md text-[11px] font-bold shadow-2xs truncate max-w-[105px]"
              >
                <span>{icon}</span>
                <span className="text-white truncate">{firstName}</span>
                <span className="text-emerald-400 text-[10px] font-black">✓</span>
              </span>
            );
          }
          return (
            <span
              key={slot.id}
              title={`${shortName}: Non assegnato`}
              className="flex items-center gap-1 bg-rose-500/20 border border-rose-500/60 text-rose-300 px-1.5 py-0.5 rounded-md text-[11px] font-bold shadow-2xs"
            >
              <span>{icon}</span>
              <span className="text-rose-400 text-[11px] font-black">❌</span>
            </span>
          );
        };

        return (
          <div
            className="fixed z-50 pointer-events-none transition-all duration-70 ease-out"
            style={{
              left: hoveredDayCoveragePos
                ? Math.min(Math.max(16, hoveredDayCoveragePos.x - 240), window.innerWidth - 500)
                : "50%",
              top: hoveredDayCoveragePos
                ? hoveredDayCoveragePos.y + 24 + 180 > window.innerHeight
                  ? Math.max(16, hoveredDayCoveragePos.y - 190)
                  : hoveredDayCoveragePos.y + 16
                : "20%",
              width: "480px"
            }}
          >
            <div className={`bg-slate-950/95 backdrop-blur-xl text-white border-2 ${
              cov.isComplete ? "border-emerald-500/70 ring-2 ring-emerald-500/30" : "border-slate-700/80 ring-2 ring-slate-900/60"
            } rounded-2xl shadow-2xl p-2.5 space-y-2 text-xs`}>
              
              {/* Header: Date + Status Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 px-0.5">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-extrabold text-xs text-slate-100 tracking-wide">
                    {formatItalianCoverageDate(hoveredDayCoverageDate)}
                  </span>
                </div>
                {cov.isComplete ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    TUTTO COPERTO ✨
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    {cov.totalCovered}/{cov.totalRequired}
                  </span>
                )}
              </div>

              {/* RIGA 1: SITUAZIONE STRUTTURE (V1, V2, V4) */}
              <div className="flex items-center gap-1.5">
                {/* V1 */}
                <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-black text-yellow-400 uppercase tracking-tight px-0.5">
                    <span>🏠 V1</span>
                    {v1_m?.isCovered && v1_p?.isCovered ? (
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    ) : (
                      <span className="text-rose-400 text-[10px]">⚠️</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderShiftSymbolChip(v1_m, "🌅", "V1 Mattina")}
                    {renderShiftSymbolChip(v1_p, "🌆", "V1 Pomeriggio")}
                  </div>
                </div>

                {/* V2 */}
                <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-black text-orange-400 uppercase tracking-tight px-0.5">
                    <span>🏠 V2</span>
                    {v2_m?.isCovered && v2_p?.isCovered ? (
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    ) : (
                      <span className="text-rose-400 text-[10px]">⚠️</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderShiftSymbolChip(v2_m, "🌅", "V2 Mattina")}
                    {renderShiftSymbolChip(v2_p, "🌆", "V2 Pomeriggio")}
                  </div>
                </div>

                {/* V4 */}
                <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-black text-purple-300 uppercase tracking-tight px-0.5">
                    <span>🏠 V4</span>
                    {v4_m?.isCovered && v4_p?.isCovered ? (
                      <span className="text-emerald-400 text-[10px]">✓</span>
                    ) : (
                      <span className="text-rose-400 text-[10px]">⚠️</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {renderShiftSymbolChip(v4_m, "🌅", "V4 Mattina")}
                    {renderShiftSymbolChip(v4_p, "🌆", "V4 Pomeriggio")}
                  </div>
                </div>
              </div>

              {/* RIGA 2: SITUAZIONE SERVIZI COMPLEMENTARI / GENERALI */}
              <div className="flex items-center gap-1.5">
                {/* Notte */}
                <div className="flex-1 min-w-0">
                  {notteSlot?.isCovered ? (
                    <div
                      title={`Notte: ${notteSlot.assignedStaff.map(s => `${s.nome} ${s.cognome}`).join(", ")}`}
                      className="bg-indigo-950/60 border border-indigo-500/50 text-indigo-200 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">🌙</span>
                        <span className="text-[10px] font-extrabold text-white truncate">
                          {notteSlot.assignedStaff[0]?.nome || "Notte"}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-black text-[10px]">✓</span>
                    </div>
                  ) : (
                    <div
                      title="Notte: Non assegnato"
                      className="bg-rose-500/20 border border-rose-500/60 text-rose-300 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <span className="text-xs">🌙</span>
                      <span className="text-rose-400 font-black text-[10px]">❌</span>
                    </div>
                  )}
                </div>

                {/* Cucina */}
                <div className="flex-1 min-w-0">
                  {cucinaSlot?.isCovered ? (
                    <div
                      title={`Cucina: ${cucinaSlot.assignedStaff.map(s => `${s.nome} ${s.cognome}`).join(", ")}`}
                      className="bg-amber-950/60 border border-amber-500/50 text-amber-200 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">🍲</span>
                        <span className="text-[10px] font-extrabold text-white truncate">
                          {cucinaSlot.assignedStaff[0]?.nome || "Cucina"}
                        </span>
                      </div>
                      <span className="text-emerald-400 font-black text-[10px]">✓</span>
                    </div>
                  ) : (
                    <div
                      title="Cucina: Non assegnato"
                      className="bg-rose-500/20 border border-rose-500/60 text-rose-300 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <span className="text-xs">🍲</span>
                      <span className="text-rose-400 font-black text-[10px]">❌</span>
                    </div>
                  )}
                </div>

                {/* Alzate ore 07:00 */}
                <div className="flex-1 min-w-0">
                  {alzateSlot?.isCovered ? (
                    <div
                      title={`Alzate ore 07:00: ${cov.shiftsAt7Count} turni attivi`}
                      className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">⏰</span>
                        <span className="text-[10px] font-black text-emerald-300">
                          {cov.shiftsAt7Count}/2
                        </span>
                      </div>
                      <span className="text-emerald-400 font-black text-[10px]">✓</span>
                    </div>
                  ) : (
                    <div
                      title={`Alzate ore 07:00: Mancano operatori (${cov.shiftsAt7Count}/2 presenti)`}
                      className="bg-rose-500/20 border border-rose-500/60 text-rose-300 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">⏰</span>
                        <span className="text-[10px] font-black text-rose-300">
                          {cov.shiftsAt7Count}/2
                        </span>
                      </div>
                      <span className="text-rose-400 font-black text-[10px]">❌</span>
                    </div>
                  )}
                </div>

                {/* Pulizie (Extra) */}
                <div className="flex-1 min-w-0">
                  {pulizieSlot?.isCovered ? (
                    <div
                      title={`Pulizie (07-11): ${pulizieSlot.assignedStaff.map(s => `${s.nome} ${s.cognome}`).join(", ")}`}
                      className="bg-teal-950/60 border border-teal-500/50 text-teal-200 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">🪣</span>
                        <span className="text-[10px] font-extrabold text-white truncate">
                          {pulizieSlot.assignedStaff[0]?.nome || "Pulizie"}
                        </span>
                      </div>
                      <span className="text-teal-400 font-black text-[10px]">✓</span>
                    </div>
                  ) : (
                    <div
                      title="Pulizie (07-11): Opzionale / Non assegnato"
                      className="bg-slate-900/60 border border-slate-800 text-slate-400 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs opacity-70"
                    >
                      <span className="text-xs">🪣</span>
                      <span className="text-slate-500 text-[10px] font-bold">—</span>
                    </div>
                  )}
                </div>

                {/* Smonto Notte (00:00 - 07:00 del mattino) */}
                {smontoNotteSlot && (
                  <div className="flex-1 min-w-0">
                    <div
                      title={`Smonto Notte: ${smontoNotteSlot.assignedStaff.map(s => `${s.nome} ${s.cognome}`).join(", ")} (00:00 - 07:00)`}
                      className="bg-indigo-900/70 border border-indigo-400/60 text-indigo-200 p-1.5 rounded-xl flex items-center justify-between gap-1 shadow-2xs"
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span className="text-xs">🌙🌅</span>
                        <span className="text-[10px] font-extrabold text-white truncate">
                          {smontoNotteSlot.assignedStaff[0]?.nome || "Smonto"}
                        </span>
                      </div>
                      <span className="text-indigo-300 font-bold text-[9px] font-mono">00-07</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini Ferie & Riposi Footer */}
              {(cov.ferieStaff.length > 0 || cov.riposoStaff.length > 0) && (
                <div className="pt-1 border-t border-slate-800/80 flex items-center gap-2 text-[9px] text-slate-400 overflow-x-auto truncate">
                  {cov.ferieStaff.length > 0 && (
                    <span className="truncate text-amber-300 font-medium">
                      🏖️ <span className="font-bold">{cov.ferieStaff.join(", ")}</span>
                    </span>
                  )}
                  {cov.riposoStaff.length > 0 && (
                    <span className="truncate text-slate-300 font-medium">
                      🛋️ {cov.riposoStaff.join(", ")}
                    </span>
                  )}
                </div>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
};