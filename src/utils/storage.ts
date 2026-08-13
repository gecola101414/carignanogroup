import { 
  Resident, 
  Room, 
  Therapy, 
  VitalSign, 
  DailyLog, 
  PAI, 
  StaffMember, 
  Shift, 
  FamilyVisit, 
  FinancialRecord, 
  InventoryItem,
  DayMealPlan,
  UserCredential,
  BachecaNotice,
  ChatWhatsAppMessage
} from "../types";

import { 
  INITIAL_RESIDENTS, 
  INITIAL_ROOMS, 
  INITIAL_THERAPIES, 
  INITIAL_VITALS, 
  INITIAL_LOGS, 
  INITIAL_PAIS, 
  INITIAL_STAFF, 
  INITIAL_SHIFTS, 
  INITIAL_VISITS, 
  INITIAL_FINANCIALS, 
  INITIAL_INVENTORY,
  INITIAL_MEAL_PLAN,
  INITIAL_CREDENTIALS,
  INITIAL_BACHECA,
  INITIAL_WHATSAPP_CHAT
} from "../mockData";

const STORAGE_KEYS = {
  RESIDENTS: "casafamiglia_residents_v1",
  ROOMS: "casafamiglia_rooms_v1",
  THERAPIES: "casafamiglia_therapies_v1",
  VITALS: "casafamiglia_vitals_v1",
  LOGS: "casafamiglia_logs_v1",
  PAIS: "casafamiglia_pais_v1",
  STAFF: "casafamiglia_staff_v1",
  STAFF_UPDATED_AT: "casafamiglia_staff_updated_at_v1",
  SHIFTS: "casafamiglia_shifts_v1",
  SHIFTS_UPDATED_AT: "casafamiglia_shifts_updated_at_v1",
  CREDENTIALS: "casafamiglia_credentials_v1",
  CREDENTIALS_UPDATED_AT: "casafamiglia_credentials_updated_at_v1",
  VISITS: "casafamiglia_visits_v1",
  FINANCIALS: "casafamiglia_financials_v1",
  INVENTORY: "casafamiglia_inventory_v1",
  MEALS: "casafamiglia_meals_v1",
  BACHECA: "casafamiglia_bacheca_v1",
  CHAT: "casafamiglia_chat_v1"
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Errore nel caricamento di ${key} da localStorage`, e);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Errore nel salvataggio di ${key} su localStorage`, e);
  }
}

export const storage = {
  getResidents: (): Resident[] => getItem(STORAGE_KEYS.RESIDENTS, INITIAL_RESIDENTS),
  setResidents: (data: Resident[]) => setItem(STORAGE_KEYS.RESIDENTS, data),

  getRooms: (): Room[] => getItem(STORAGE_KEYS.ROOMS, INITIAL_ROOMS),
  setRooms: (data: Room[]) => setItem(STORAGE_KEYS.ROOMS, data),

  getTherapies: (): Therapy[] => getItem(STORAGE_KEYS.THERAPIES, INITIAL_THERAPIES),
  setTherapies: (data: Therapy[]) => setItem(STORAGE_KEYS.THERAPIES, data),

  getVitals: (): VitalSign[] => getItem(STORAGE_KEYS.VITALS, INITIAL_VITALS),
  setVitals: (data: VitalSign[]) => setItem(STORAGE_KEYS.VITALS, data),

  getLogs: (): DailyLog[] => getItem(STORAGE_KEYS.LOGS, INITIAL_LOGS),
  setLogs: (data: DailyLog[]) => setItem(STORAGE_KEYS.LOGS, data),

  getPais: (): PAI[] => getItem(STORAGE_KEYS.PAIS, INITIAL_PAIS),
  setPais: (data: PAI[]) => setItem(STORAGE_KEYS.PAIS, data),

  getStaff: (): StaffMember[] => getItem(STORAGE_KEYS.STAFF, INITIAL_STAFF),
  setStaff: (data: StaffMember[], updatedAt?: string) => {
    setItem(STORAGE_KEYS.STAFF, data);
    if (updatedAt) localStorage.setItem(STORAGE_KEYS.STAFF_UPDATED_AT, updatedAt);
  },
  getStaffUpdatedAt: (): string | null => localStorage.getItem(STORAGE_KEYS.STAFF_UPDATED_AT),

  getShifts: (): Shift[] => getItem(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS),
  setShifts: (data: Shift[], updatedAt?: string) => {
    setItem(STORAGE_KEYS.SHIFTS, data);
    if (updatedAt) localStorage.setItem(STORAGE_KEYS.SHIFTS_UPDATED_AT, updatedAt);
  },
  getShiftsUpdatedAt: (): string | null => localStorage.getItem(STORAGE_KEYS.SHIFTS_UPDATED_AT),

  getCredentials: (): UserCredential[] => {
    let storedCreds = getItem(STORAGE_KEYS.CREDENTIALS, INITIAL_CREDENTIALS);
    const currentStaff = getItem(STORAGE_KEYS.STAFF, INITIAL_STAFF);
    
    let adminCreds = storedCreds.filter(c => c.role === 'admin' && c.username !== "VANNUCCI");
    storedCreds = storedCreds.filter(c => c.username !== "VANNUCCI");
    
    // Assicura che i 4 amministratori di base ci siano sempre
    const baseAdmins = [
      { username: "BEPPE", role: "admin", passwordHash: "Beppe2024!", mustChange: true },
      { username: "DEBORAH", role: "admin", passwordHash: "Deborah2024!", mustChange: true },
      { username: "CLAUDIA", role: "admin", passwordHash: "Claudia2024!", mustChange: true }
    ];
    
    baseAdmins.forEach(ba => {
      if (!adminCreds.find(c => c.username.toLowerCase() === ba.username.toLowerCase())) {
        adminCreds.push(ba);
        storedCreds.push(ba); // Aggiungiamo anche nello stored originario cosí puó essere salvato poi
      }
    });
    
    const staffCreds: UserCredential[] = currentStaff.map(s => {
      const existing = storedCreds.find(c => c.username.toLowerCase() === s.nome.toLowerCase());
      if (existing) {
        return {
          ...existing,
          username: s.nome,
          role: "staff",
          mustChange: existing.passwordHash === "1234"
        };
      }
      return {
        username: s.nome,
        role: "staff",
        passwordHash: "1234",
        mustChange: true
      };
    });

    return [...adminCreds, ...staffCreds];
  },
  setCredentials: (data: UserCredential[], updatedAt?: string) => {
    setItem(STORAGE_KEYS.CREDENTIALS, data);
    if (updatedAt) localStorage.setItem(STORAGE_KEYS.CREDENTIALS_UPDATED_AT, updatedAt);
  },
  getCredentialsUpdatedAt: (): string | null => localStorage.getItem(STORAGE_KEYS.CREDENTIALS_UPDATED_AT),

  getVisits: (): FamilyVisit[] => getItem(STORAGE_KEYS.VISITS, INITIAL_VISITS),
  setVisits: (data: FamilyVisit[]) => setItem(STORAGE_KEYS.VISITS, data),

  getFinancials: (): FinancialRecord[] => getItem(STORAGE_KEYS.FINANCIALS, INITIAL_FINANCIALS),
  setFinancials: (data: FinancialRecord[]) => setItem(STORAGE_KEYS.FINANCIALS, data),

  getInventory: (): InventoryItem[] => getItem(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),
  setInventory: (data: InventoryItem[]) => setItem(STORAGE_KEYS.INVENTORY, data),

  getMeals: (): DayMealPlan[] => getItem(STORAGE_KEYS.MEALS, INITIAL_MEAL_PLAN),
  setMeals: (data: DayMealPlan[]) => setItem(STORAGE_KEYS.MEALS, data),

  getBacheca: (): BachecaNotice[] => getItem(STORAGE_KEYS.BACHECA, INITIAL_BACHECA),
  setBacheca: (data: BachecaNotice[]) => setItem(STORAGE_KEYS.BACHECA, data),

  getChat: (): ChatWhatsAppMessage[] => getItem(STORAGE_KEYS.CHAT, INITIAL_WHATSAPP_CHAT),
  setChat: (data: ChatWhatsAppMessage[]) => setItem(STORAGE_KEYS.CHAT, data),

  resetToDefaults: () => {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }
};

export const apiSync = {
  async fetchShifts(): Promise<{ shifts: Shift[] | null; updatedAt: string | null }> {
    try {
      const res = await fetch("/api/shifts");
      if (!res.ok) return { shifts: null, updatedAt: null };
      const data = await res.json();
      return { shifts: data.shifts || null, updatedAt: data.updatedAt || null };
    } catch {
      return { shifts: null, updatedAt: null };
    }
  },

  async saveShifts(shifts: Shift[], updatedAt?: string): Promise<string | null> {
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shifts, updatedAt })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.updatedAt || null;
    } catch (e) {
      console.error("Failed to sync shifts to server", e);
      return null;
    }
  },

  async fetchStaff(): Promise<{ staff: StaffMember[] | null; updatedAt: string | null }> {
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) return { staff: null, updatedAt: null };
      const data = await res.json();
      return { staff: data.staff || null, updatedAt: data.updatedAt || null };
    } catch {
      return { staff: null, updatedAt: null };
    }
  },

  async saveStaff(staff: StaffMember[], updatedAt?: string): Promise<string | null> {
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff, updatedAt })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.updatedAt || null;
    } catch (e) {
      console.error("Failed to sync staff to server", e);
      return null;
    }
  }
};
