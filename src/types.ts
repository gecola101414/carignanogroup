export type RSAArea = 'Piano 1' | 'Piano 2' | 'Ala Protetta';

export type ResidentStatus = 'Attivo' | 'In Ospedale' | 'Dimesso' | 'Deceduto';

export interface Resident {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  sesso: 'M' | 'F';
  stanza: string;
  letto: string;
  areaAssegnata: RSAArea;
  stato: ResidentStatus;
  dataIngresso: string;
  referenteNome: string;
  referenteTelefono: string;
  referenteEmail: string;
  referenteParentela: string;
  tutoreNote?: string;
  fotoUrl?: string;
  dieteSpeciali: string[];
  allergeni: string[];
  noteDisfagia?: string;
}

export interface AreaTransferLog {
  id: string;
  ospiteId: string;
  areaOrigine: RSAArea;
  areaDestinazione: RSAArea;
  dataTrasferimento: string;
  motivo: string;
  operatoreNome: string;
}

export type HealthDiaryCategory = 
  | 'Parametri Vitali' 
  | 'Nota Clinica' 
  | 'Evento/Caduta' 
  | 'Igiene/Cura' 
  | 'Visita Medico' 
  | 'Fisioterapia';

export interface VitalSigns {
  pressioneArteriosa?: string; // e.g. "120/80"
  saturazione?: number; // e.g. 97
  glicemia?: number; // mg/dL
  temperatura?: number; // °C
  frequenzaCardiaca?: number; // bpm
}

export interface HealthDiaryEntry {
  id: string;
  ospiteId: string;
  dataOra: string;
  operatoreId: string;
  operatoreNome: string;
  operatoreRuolo: StaffRole;
  categoria: HealthDiaryCategory;
  note: string;
  parametriVitali?: VitalSigns;
}

export interface Therapy {
  id: string;
  ospiteId: string;
  nomeFarmaco: string;
  principioAttivo: string;
  dosaggio: string;
  viaSomministrazione: 'Orale' | 'Inramuscolare' | 'Sottocutanea' | 'Endovenosa' | 'Cerotto' | 'Inalatoria';
  orari: string[]; // e.g. ['08:00', '12:00', '20:00']
  dataInizio: string;
  dataFine?: string;
  medicoPrescrittore: string;
  note: string;
  attiva: boolean;
}

export interface DrugAdministration {
  id: string;
  terapiaId: string;
  ospiteId: string;
  dataOra: string;
  orarioPrevisto: string; // e.g. '08:00'
  stato: 'Somministrato' | 'Rifiutato' | 'Non Disponibile' | 'Sospeso';
  infermiereNome: string;
  note?: string;
}

export type MealType = 'Colazione' | 'Pranzo' | 'Merenda' | 'Cena';

export interface DailyMenu {
  id: string;
  data: string;
  pasto: MealType;
  primo: string;
  secondo: string;
  contorno: string;
  fruttaDolce: string;
  noteAllergeni?: string;
}

export type FoodTexture = 'Solida' | 'Tritata' | 'Frullata' | 'Omogeneizzata';

export interface GuestDietProfile {
  ospiteId: string;
  tipoDieta: string; // e.g., "Iposodica", "Diabetica 1800 Kcal", "Celiaca"
  consistenza: FoodTexture;
  addensanteLiquidi: boolean;
  intolleranze: string[];
  noteCucina: string;
  ultimaModificaData: string;
}

export interface CateringAuditLog {
  id: string;
  data: string;
  tipoIspezione: 'Controllo Interno HACCP' | 'Ispezione ASL' | 'Audit NAS' | 'Verifica Nutrizionale';
  esito: 'Conforme' | 'Conforme con Riserva' | 'Non Conforme';
  noteConformita: string;
  ispettoreOVerificatore: string;
}

export type StaffRole = 
  | 'OSS' 
  | 'Infermiere' 
  | 'Educatore' 
  | 'Medico' 
  | 'Fisioterapista' 
  | 'Amministrativo' 
  | 'Coordinatore';

export interface StaffMember {
  id: string;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  ruolo: StaffRole;
  email: string;
  telefono: string;
  oreContrattualiSettimanali: number;
  attivo: boolean;
}

export type ShiftType = 'Mattina' | 'Pomeriggio' | 'Notte' | 'Reperibilità' | 'Spezzato';

export interface Shift {
  id: string;
  staffId: string;
  data: string; // YYYY-MM-DD
  tipoTurno: ShiftType;
  oraInizio: string; // HH:mm
  oraFine: string; // HH:mm
  areaAssegnata: RSAArea | 'Tutta la Struttura';
  mansioni: string[];
  note?: string;
}

export interface ShiftReportStats {
  staffId: string;
  nomeCompleto: string;
  ruolo: StaffRole;
  oreContrattualiMensili: number;
  oreEffettuateMensili: number;
  oreStraordinario: number;
  turniNotturniCount: number;
  coperturaPerArea: Record<RSAArea | 'Tutta la Struttura', number>;
}

export interface AccountingEntry {
  id: string;
  data: string;
  tipo: 'Entrata' | 'Uscita';
  importo: number;
  categoria: 
    | 'Rette Ospiti' 
    | 'Farmaci e Presidi' 
    | 'Alimentari e Ristorazione' 
    | 'Utenze' 
    | 'Stipendi Personale' 
    | 'Manutenzione Struttura' 
    | 'Servizi Personali Ospiti'
    | 'Varie';
  descrizione: string;
  metodoPagamento: 'Bonifico' | 'RID/SDD' | 'Cassa' | 'POS';
  ospiteId?: string; // Optional link to guest
  numeroRicevutaFattura?: string;
}

export interface DocumentItem {
  id: string;
  titolo: string;
  categoria: 'Ospite' | 'Aziendale';
  subCategoria: 
    | 'Carta Identità' 
    | 'Tessera Sanitaria' 
    | 'Referto Medico' 
    | 'Contratto Ingresso' 
    | 'Impegnativa ASL'
    | 'Contratto Fornitore' 
    | 'Certificazione Struttura' 
    | 'HACCP / Sicurezza' 
    | 'Protocollo Interno';
  ospiteId?: string;
  dataCaricamento: string;
  dataScadenza?: string;
  fileUrl: string;
  dimensioneKb: number;
  note?: string;
}

export interface SpecialistVisit {
  id: string;
  ospiteId: string;
  tipoSpecialista: string; // e.g. "Cardiologia", "Neurologia", "Fisiatria", "Oftalmologia"
  nomeStrutturaClinica: string;
  indirizzoClinica: string;
  telefonoClinica: string;
  emailClinica: string;
  dataOra: string;
  operatoreAccompanying?: string;
  esitoVisita?: string;
  noteFollowUp?: string;
  completata: boolean;
}

export interface GlobalCalendarEvent {
  id: string;
  titolo: string;
  tipo: 'Generale Struttura' | 'Attività Ricreativa' | 'Riunione Equipe' | 'Visita Parenti' | 'Manutenzione';
  dataInizio: string;
  dataFine: string;
  areaRiferimento?: RSAArea | 'Tutta la Struttura';
  ospiteId?: string;
  descrizione: string;
}
