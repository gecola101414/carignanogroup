export type ResidentStatus = "Presente" | "Uscita Temporanea" | "Ospedalizzato" | "Dimesso";

export interface Resident {
  id: string;
  nome: string;
  cognome: string;
  fotoUrl: string;
  dataNascita: string; // YYYY-MM-DD
  codiceFiscale: string;
  stanzaId: string;
  letto: string; // "Letto A", "Letto B", ecc.
  medicoCurante: string;
  telefonoMedico?: string;
  contattoFamiglia: {
    nome: string;
    parentela: string;
    telefono: string;
    email: string;
    indirizzo?: string;
  };
  allergie: string;
  patologie: string;
  stato: ResidentStatus;
  dataIngresso: string;
  dieta: string;
  noteComportamentali?: string;
  livelloAutonomia: "Autonomo" | "Parzialmente Autonomo" | "Non Autonomo";
  deambulazione: "Libera" | "Deambulatore/Bastone" | "Sedia a Rotelle" | "A letto";
}

export type RoomStatus = "Occupata" | "Parzialmente Libera" | "Libera" | "In Manutenzione";

export interface Room {
  id: string;
  numero: string;
  piano: number;
  tipo: "Singola" | "Doppia" | "Tripla";
  postiLettoTotali: number;
  stato: RoomStatus;
  note?: string;
  dotazioni: string[]; // es. ["Bagno per disabili", "Aria condizionata", "TV", "Campanello d'emergenza"]
}

export interface MedicationAdministration {
  somministrato: boolean;
  orarioEffettivo?: string;
  operatore?: string;
  nota?: string;
}

export interface Therapy {
  id: string;
  ospiteId: string;
  nomeFarmaco: string;
  principioAttivo?: string;
  dosaggio: string; // es. "1 compressa", "20 gocce"
  viaSomministrazione: "Orale" | "Iniezione IM/EV" | "Gocce" | "Cerotto" | "Inalatoria" | "Topica";
  orari: string[]; // es. ["08:00", "12:00", "20:00"]
  isPrimaNecessita: boolean; // Salvavita / prioritario
  dataInizio: string;
  dataFine?: string;
  prescrittore: string;
  note?: string;
  // Mappa data (YYYY-MM-DD) -> orario -> somministrazione
  somministrazioni: Record<string, Record<string, MedicationAdministration>>;
}

export interface VitalSign {
  id: string;
  ospiteId: string;
  dataOra: string; // ISO string or YYYY-MM-DD HH:mm
  pressioneSistolica?: number; // mmHg
  pressioneDiastolica?: number; // mmHg
  frequenzaCardiaca?: number; // bpm
  glicemia?: number; // mg/dL
  temperatura?: number; // °C
  saturazioneO2?: number; // %
  peso?: number; // kg
  operatore: string;
  note?: string;
}

export type LogCategory = 
  | "Nutrizione" 
  | "Igiene e Cura" 
  | "Umore e Comportamento" 
  | "Attività e Socializzazione" 
  | "Evento / Caduta" 
  | "Visita Medica" 
  | "Gis / Terapia" 
  | "Generale";

export type LogPriority = "Bassa" | "Normale" | "Alta" | "Urgente";

export interface DailyLog {
  id: string;
  ospiteId: string;
  dataOra: string;
  turno: "Mattina (07:00-14:00)" | "Pomeriggio (14:00-21:00)" | "Notte (21:00-07:00)";
  operatore: string;
  categoria: LogCategory;
  priorita: LogPriority;
  titolo: string;
  descrizione: string;
  lettoDaSuccessivo: boolean; // Spuntato dai colleghi del turno successivo
}

export interface PAI {
  id: string;
  ospiteId: string;
  dataCompilazione: string;
  dataProssimaRevisione: string;
  obiettiviAutonomia: string;
  obiettiviSanitari: string;
  attivitaCognitive: string;
  indicazioniCaregiver: string;
  frequenzaMonitoraggio: string;
  raccomandazioniMiglioramento?: string[];
  compilatore: string;
  generatoConAI?: boolean;
}

export type StaffRole = "Coordinatore / Direttore" | "Infermiera / Infermiere" | "OSS (Operatore Socio-Sanitario)" | "Educatore" | "Fisioterapista" | "Cuoco / Addetto Cucina";

export interface UserCredential {
  username: string;
  role: "admin" | "staff";
  passwordHash: string;
  mustChange: boolean;
}

export interface StaffMember {
  id: string;
  nome: string;
  cognome: string;
  ruolo: StaffRole;
  telefono: string;
  email: string;
  codiceFiscale: string;
  attivo: boolean;
  coloreBadge: string;
  orarioMattina?: string; // e.g. "07:00 - 14:00"
  orarioPomeriggio?: string; // e.g. "14:00 - 21:00"
  orarioNotte?: string; // e.g. "21:00 - 07:00"
}

export interface Shift {
  id: string;
  staffId: string;
  data: string; // YYYY-MM-DD
  orarioInizio: string; // "07:00"
  orarioFine: string; // "14:00"
  tipoTurno: "Mattina" | "Pomeriggio" | "Notte" | "Reperibilità" | "Riposo" | "Ferie";
  note?: string;
  struttura?: string; // "Struttura 1", "Struttura 2", "Struttura 3"
}

export interface BachecaNotice {
  id: string;
  dataOra: string;
  autore: string;
  titolo: string;
  testo: string;
  visti: string[]; // usernames of staff/admin who acknowledged
}

export interface ChatWhatsAppMessage {
  id: string;
  dataOra: string;
  autore: string;
  messaggio: string;
  ruoloAutore?: "admin" | "staff";
}

export interface FamilyVisit {
  id: string;
  ospiteId: string;
  nomeVisitatore: string;
  parentela: string;
  telefono: string;
  data: string; // YYYY-MM-DD
  oraInizio: string;
  oraFine: string;
  stato: "Confermata" | "In attesa" | "Completata" | "Annullata";
  note?: string;
  numeroPersone: number;
}

export interface FinancialRecord {
  id: string;
  ospiteId: string;
  meseAnno: string; // "2026-08"
  importoBase: number; // Retta mensile in euro
  speseExtra: {
    descrizione: string;
    importo: number;
  }[];
  totale: number;
  statoPagamento: "Pagato" | "In attesa" | "Scaduto";
  dataScadenza: string;
  dataPagamento?: string;
  note?: string;
}

export interface InventoryItem {
  id: string;
  nome: string;
  categoria: "Farmaci" | "Presidi Igiene e Pannoloni" | "Materiale Sanitario" | "Alimentari / Cucina" | "Pulizia";
  quantita: number;
  unitaMisura: string;
  sogliaMinima: number;
  scadenza?: string;
  fornitore?: string;
}

export interface DayMealPlan {
  giorno: "Lunedì" | "Martedì" | "Mercoledì" | "Giovedì" | "Venerdì" | "Sabato" | "Domenica";
  pranzo: {
    primo: string;
    secondo: string;
    contorno: string;
    fruttaDolce: string;
  };
  cena: {
    primo: string;
    secondo: string;
    contorno: string;
    fruttaDolce: string;
  };
  dietaSpecialeNote?: string;
}
