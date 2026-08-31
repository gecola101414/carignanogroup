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
  DayMealPlan
} from "./types";

export const INITIAL_ROOMS: Room[] = [
  {
    id: "room-101",
    numero: "101",
    piano: 1,
    tipo: "Doppia",
    postiLettoTotali: 2,
    stato: "Occupata",
    dotazioni: ["Bagno assistito", "Campanello d'emergenza", "TV", "Aria condizionata", "Sollevatore mobile"],
    note: "Camera luminosa al primo piano vicina all'infermeria."
  },
  {
    id: "room-102",
    numero: "102",
    piano: 1,
    tipo: "Doppia",
    postiLettoTotali: 2,
    stato: "Occupata",
    dotazioni: ["Bagno assistito", "Campanello d'emergenza", "Aria condizionata", "Letti ortopedici elettrici"],
    note: "Affaccio sul giardino interno."
  },
  {
    id: "room-103",
    numero: "103",
    piano: 1,
    tipo: "Singola",
    postiLettoTotali: 1,
    stato: "Occupata",
    dotazioni: ["Bagno privato disabili", "TV", "Aria condizionata", "Poltrona relax elettrica"],
    note: "Camera singola riservata a ospiti con esigenze di tranquillità."
  },
  {
    id: "room-201",
    numero: "201",
    piano: 2,
    tipo: "Doppia",
    postiLettoTotali: 2,
    stato: "Parzialmente Libera",
    dotazioni: ["Bagno assistito", "Aria condizionata", "Campanello d'emergenza"],
    note: "Letto B attualmente disponibile per nuovo inserimento."
  },
  {
    id: "room-202",
    numero: "202",
    piano: 2,
    tipo: "Doppia",
    postiLettoTotali: 2,
    stato: "Occupata",
    dotazioni: ["Bagno privato", "Aria condizionata", "TV", "Poltrone ergonomiche"],
    note: "Camera al secondo piano vista colline."
  },
  {
    id: "room-203",
    numero: "203",
    piano: 2,
    tipo: "Singola",
    postiLettoTotali: 1,
    stato: "In Manutenzione",
    dotazioni: ["Bagno assistito", "TV", "Campanello d'emergenza"],
    note: "Tinteggiatura e sanificazione programmata in corso."
  }
];

export const INITIAL_RESIDENTS: Resident[] = [
  {
    id: "res-1",
    nome: "Nonna Maria",
    cognome: "Rossi",
    fotoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1938-04-12",
    codiceFiscale: "RSSMRA38D52H501Z",
    stanzaId: "room-101",
    letto: "Letto A",
    medicoCurante: "Dr. Marco Bellini",
    telefonoMedico: "+39 06 88776611",
    contattoFamiglia: {
      nome: "Laura Rossi (Figlia)",
      parentela: "Figlia",
      telefono: "+39 338 1234567",
      email: "laura.rossi@email.it",
      indirizzo: "Via delle Rose 14, Roma"
    },
    allergie: "Penicillina, Frutta a guscio",
    patologie: "Ipertensione arteriosa, Diabete tipo 2, Inizio declino cognitivo lieve",
    stato: "Presente",
    dataIngresso: "2024-02-15",
    dieta: "Iposodica e a basso contenuto di zuccheri complessi",
    noteComportamentali: "Molto socievole, ama ascoltare musica lirica nel pomeriggio e partecipare al laboratorio di pittura.",
    livelloAutonomia: "Parzialmente Autonomo",
    deambulazione: "Deambulatore/Bastone"
  },
  {
    id: "res-2",
    nome: "Giuseppe",
    cognome: "Bianchi",
    fotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1935-11-03",
    codiceFiscale: "BNCGPP35S03F205K",
    stanzaId: "room-101",
    letto: "Letto B",
    medicoCurante: "Dr.ssa Elena Moretti",
    telefonoMedico: "+39 06 77889900",
    contattoFamiglia: {
      nome: "Roberto Bianchi (Figlio)",
      parentela: "Figlio",
      telefono: "+39 347 9876543",
      email: "roberto.bianchi@gmail.com",
      indirizzo: "Viale Europa 88, Roma"
    },
    allergie: "Nessuna allergia nota",
    patologie: "Parkinson fase iniziale, Artrosi polidistrettuale, Cardiopatia ischemica cronica",
    stato: "Presente",
    dataIngresso: "2023-10-01",
    dieta: "Consistenza morbida (disfagia lieve per i liquidi rari)",
    noteComportamentali: "Cavaliere molto distinto, ex professore di storia. Necessita di incoraggiamento per la fisioterapia.",
    livelloAutonomia: "Parzialmente Autonomo",
    deambulazione: "Deambulatore/Bastone"
  },
  {
    id: "res-3",
    nome: "Teresa",
    cognome: "Esposito",
    fotoUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1940-07-28",
    codiceFiscale: "SPSTRS40L68F839A",
    stanzaId: "room-102",
    letto: "Letto A",
    medicoCurante: "Dr. Marco Bellini",
    telefonoMedico: "+39 06 88776611",
    contattoFamiglia: {
      nome: "Gianni Esposito (Nipote)",
      parentela: "Nipote",
      telefono: "+39 320 4455667",
      email: "gianni.esposito@virgilio.it"
    },
    allergie: "Aspirina, Lattosio",
    patologie: "Osteoporosi severa, Fibrillazione atriale in TAO",
    stato: "Presente",
    dataIngresso: "2024-01-10",
    dieta: "Senza lattosio, ricca di calcio e vitamina D",
    noteComportamentali: "A volte malinconica al mattino. Si rasserena ascoltando la radio e parlando con l'educatrice.",
    livelloAutonomia: "Parzialmente Autonomo",
    deambulazione: "Deambulatore/Bastone"
  },
  {
    id: "res-4",
    nome: "Antonio",
    cognome: "Ferrari",
    fotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1932-02-18",
    codiceFiscale: "FRRNTN32B18H501P",
    stanzaId: "room-102",
    letto: "Letto B",
    medicoCurante: "Dr.ssa Elena Moretti",
    telefonoMedico: "+39 06 77889900",
    contattoFamiglia: {
      nome: "Anna Ferrari (Moglie)",
      parentela: "Moglie",
      telefono: "+39 333 7788991",
      email: "anna.ferrari@libero.it"
    },
    allergie: "Nessuna",
    patologie: "Esiti di Ictus cerebrale destro (emiparesi sinistra), Ipertensione",
    stato: "Presente",
    dataIngresso: "2023-05-20",
    dieta: "Tritata / Omogeneizzata con addensante per liquidi",
    noteComportamentali: "Collaborativo durante la mobilitazione. Richiede ausilio totale per igiene e vestizione.",
    livelloAutonomia: "Non Autonomo",
    deambulazione: "Sedia a Rotelle"
  },
  {
    id: "res-5",
    nome: "Giovanna",
    cognome: "Conti",
    fotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1942-09-05",
    codiceFiscale: "CNTGVN42P45H501W",
    stanzaId: "room-103",
    letto: "Letto Unico",
    medicoCurante: "Dr. Marco Bellini",
    telefonoMedico: "+39 06 88776611",
    contattoFamiglia: {
      nome: "Sonia Conti (Figlia)",
      parentela: "Figlia",
      telefono: "+39 349 1122334",
      email: "sonia.conti@outlook.it"
    },
    allergie: "Polvere, Nichel",
    patologie: "Sindrome depressiva dell'anziano, Insufficienza venosa cronica",
    stato: "Presente",
    dataIngresso: "2024-04-02",
    dieta: "Mediterranea bilanciata",
    noteComportamentali: "Particolarmente attiva nelle passeggiate in giardino. Ama fare le carte con gli altri ospiti.",
    livelloAutonomia: "Autonomo",
    deambulazione: "Libera"
  },
  {
    id: "res-6",
    nome: "Luigi",
    cognome: "Ricci",
    fotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    dataNascita: "1936-12-30",
    codiceFiscale: "RCCLGU36T30F205X",
    stanzaId: "room-201",
    letto: "Letto A",
    medicoCurante: "Dr.ssa Elena Moretti",
    telefonoMedico: "+39 06 77889900",
    contattoFamiglia: {
      nome: "Matteo Ricci (Figlio)",
      parentela: "Figlio",
      telefono: "+39 366 5544332",
      email: "matteo.ricci@tech.it"
    },
    allergie: "Nessuna",
    patologie: "BPCO (Broncopneumopatia Cronica Ostruttiva), Ipertrofia prostatica benigna",
    stato: "Presente",
    dataIngresso: "2023-11-12",
    dieta: "Standard, idratazione controllata",
    noteComportamentali: "Usa ossigenoterapia a bassi flussi (1.5L/min) durante le ore notturne. Molto tranquillo.",
    livelloAutonomia: "Parzialmente Autonomo",
    deambulazione: "Libera"
  }
];

const todayStr = new Date().toISOString().split("T")[0];

export const INITIAL_THERAPIES: Therapy[] = [
  {
    id: "th-1",
    ospiteId: "res-1",
    nomeFarmaco: "Eutirox",
    dosaggio: "75 mcg - 1 cpr",
    viaSomministrazione: "Orale",
    orari: ["08:00"],
    isPrimaNecessita: true,
    dataInizio: "2024-02-15",
    prescrittore: "Dr. Marco Bellini",
    note: "Somministrare a digiuno 30 minuti prima della colazione",
    somministrazioni: {
      [todayStr]: {
        "08:00": { somministrato: true, orarioEffettivo: "08:10", operatore: "OSS Franco Marini", nota: "Assunta regolarmente" }
      }
    }
  },
  {
    id: "th-2",
    ospiteId: "res-1",
    nomeFarmaco: "Ramipril",
    dosaggio: "5 mg - 1 cpr",
    viaSomministrazione: "Orale",
    orari: ["08:00", "20:00"],
    isPrimaNecessita: true,
    dataInizio: "2024-02-15",
    prescrittore: "Dr. Marco Bellini",
    note: "Controllo pressione sistematico prima della somministrazione",
    somministrazioni: {
      [todayStr]: {
        "08:00": { somministrato: true, orarioEffettivo: "08:15", operatore: "OSS Franco Marini" },
        "20:00": { somministrato: false }
      }
    }
  },
  {
    id: "th-3",
    ospiteId: "res-1",
    nomeFarmaco: "Metformina",
    dosaggio: "500 mg - 1 cpr",
    viaSomministrazione: "Orale",
    orari: ["12:30", "19:30"],
    isPrimaNecessita: false,
    dataInizio: "2024-02-15",
    prescrittore: "Dr. Marco Bellini",
    note: "A stomaco pieno subito dopo i pasti principali",
    somministrazioni: {
      [todayStr]: {
        "12:30": { somministrato: true, orarioEffettivo: "12:45", operatore: "Inf. Giulia Costa" },
        "19:30": { somministrato: false }
      }
    }
  },
  {
    id: "th-4",
    ospiteId: "res-2",
    nomeFarmaco: "Madopar",
    dosaggio: "100 mg + 25 mg - 1 cpr",
    viaSomministrazione: "Orale",
    orari: ["08:00", "13:00", "18:00"],
    isPrimaNecessita: true,
    dataInizio: "2023-10-01",
    prescrittore: "Dr.ssa Elena Moretti",
    note: "Rispettare scrupolosamente gli orari per evitare fasi 'off' del Parkinson",
    somministrazioni: {
      [todayStr]: {
        "08:00": { somministrato: true, orarioEffettivo: "08:05", operatore: "OSS Franco Marini" },
        "13:00": { somministrato: true, orarioEffettivo: "13:00", operatore: "Inf. Giulia Costa" },
        "18:00": { somministrato: false }
      }
    }
  },
  {
    id: "th-5",
    ospiteId: "res-3",
    nomeFarmaco: "Coumadin (Warfarin)",
    dosaggio: "Secondo schema INR (Oggi: 1/2 compressa)",
    viaSomministrazione: "Orale",
    orari: ["17:00"],
    isPrimaNecessita: true,
    dataInizio: "2024-01-10",
    prescrittore: "Dr. Marco Bellini",
    note: "Controllare scheda INR settimanale esposta in infermeria",
    somministrazioni: {
      [todayStr]: {
        "17:00": { somministrato: false }
      }
    }
  },
  {
    id: "th-6",
    ospiteId: "res-4",
    nomeFarmaco: "Cardioaspirina",
    dosaggio: "100 mg - 1 cpr",
    viaSomministrazione: "Orale",
    orari: ["12:00"],
    isPrimaNecessita: true,
    dataInizio: "2023-05-20",
    prescrittore: "Dr.ssa Elena Moretti",
    note: "Subito dopo il pranzo",
    somministrazioni: {
      [todayStr]: {
        "12:00": { somministrato: true, orarioEffettivo: "12:20", operatore: "Inf. Giulia Costa" }
      }
    }
  }
];

export const INITIAL_VITALS: VitalSign[] = [
  {
    id: "vit-1",
    ospiteId: "res-1",
    dataOra: `${todayStr} 08:30`,
    pressioneSistolica: 130,
    pressioneDiastolica: 82,
    frequenzaCardiaca: 72,
    glicemia: 118,
    temperatura: 36.5,
    saturazioneO2: 98,
    peso: 64.5,
    operatore: "OSS Franco Marini",
    note: "Ospite riposata, parametri stabili a digiuno."
  },
  {
    id: "vit-2",
    ospiteId: "res-1",
    dataOra: "2026-08-09 08:30",
    pressioneSistolica: 135,
    pressioneDiastolica: 85,
    frequenzaCardiaca: 75,
    glicemia: 124,
    temperatura: 36.6,
    saturazioneO2: 97,
    peso: 64.6,
    operatore: "OSS Franco Marini"
  },
  {
    id: "vit-3",
    ospiteId: "res-1",
    dataOra: "2026-08-08 08:30",
    pressioneSistolica: 128,
    pressioneDiastolica: 80,
    frequenzaCardiaca: 70,
    glicemia: 112,
    temperatura: 36.4,
    saturazioneO2: 98,
    peso: 64.4,
    operatore: "Inf. Giulia Costa"
  },
  {
    id: "vit-4",
    ospiteId: "res-2",
    dataOra: `${todayStr} 09:00`,
    pressioneSistolica: 125,
    pressioneDiastolica: 78,
    frequenzaCardiaca: 68,
    glicemia: 98,
    temperatura: 36.3,
    saturazioneO2: 96,
    peso: 71.0,
    operatore: "OSS Franco Marini",
    note: "Tremori parkinsoniani lievi a riposo."
  },
  {
    id: "vit-5",
    ospiteId: "res-3",
    dataOra: `${todayStr} 09:15`,
    pressioneSistolica: 142,
    pressioneDiastolica: 88,
    frequenzaCardiaca: 84,
    glicemia: 105,
    temperatura: 36.7,
    saturazioneO2: 97,
    peso: 58.2,
    operatore: "Inf. Giulia Costa",
    note: "Pressione leggermente elevata, da ricontrollare prima del Coumadin."
  },
  {
    id: "vit-6",
    ospiteId: "res-4",
    dataOra: `${todayStr} 10:00`,
    pressioneSistolica: 122,
    pressioneDiastolica: 76,
    frequenzaCardiaca: 74,
    temperatura: 36.6,
    saturazioneO2: 95,
    peso: 78.4,
    operatore: "OSS Franco Marini",
    note: "Parametri regolari."
  }
];

export const INITIAL_LOGS: DailyLog[] = [
  {
    id: "log-1",
    ospiteId: "res-1",
    dataOra: `${todayStr} 09:30`,
    turno: "Mattina (07:00-14:00)",
    operatore: "OSS Franco Marini",
    categoria: "Nutrizione",
    priorita: "Normale",
    titolo: "Colazione abbondante e buon umore",
    descrizione: "Nonna Maria ha consumato tutta la colazione (latte di riso, fette biscottate con marmellata). Ha partecipato volentieri alla conversazione nel salone.",
    lettoDaSuccessivo: true
  },
  {
    id: "log-2",
    ospiteId: "res-2",
    dataOra: `${todayStr} 11:15`,
    turno: "Mattina (07:00-14:00)",
    operatore: "Fisioterapista Roberto Villa",
    categoria: "Attività e Socializzazione",
    priorita: "Normale",
    titolo: "Seduta di fisioterapia e deambulazione",
    descrizione: "Eseguiti 20 minuti di deambulazione assistita nei corridoi con deambulatore. Buona stabilità, passo costante.",
    lettoDaSuccessivo: false
  },
  {
    id: "log-3",
    ospiteId: "res-3",
    dataOra: `${todayStr} 11:45`,
    turno: "Mattina (07:00-14:00)",
    operatore: "Inf. Giulia Costa",
    categoria: "Visita Medica",
    priorita: "Alta",
    titolo: "Rilevazione INR per terapia anticoagulante",
    descrizione: "Prelievo ematico capillare eseguito per controllo INR. Valore 2.4 (in range terapeutico). Mantenere dosaggio Coumadin a 1/2 cpr ore 17:00.",
    lettoDaSuccessivo: false
  },
  {
    id: "log-4",
    ospiteId: "res-4",
    dataOra: `${todayStr} 12:45`,
    turno: "Mattina (07:00-14:00)",
    operatore: "OSS Franco Marini",
    categoria: "Igiene e Cura",
    priorita: "Normale",
    titolo: "Pranzo e posturale",
    descrizione: "Somministrato pranzo omogeneizzato con supporto totale. Assunzione di liquidi addensati regolare (circa 250ml). Successivo riposo a letto in decubito laterale destro.",
    lettoDaSuccessivo: false
  }
];

export const INITIAL_PAIS: PAI[] = [
  {
    id: "pai-1",
    ospiteId: "res-1",
    dataCompilazione: "2026-06-01",
    dataProssimaRevisione: "2026-12-01",
    obiettiviAutonomia: "Mantenere la deambulazione autonoma con ausilio nei percorsi interni. Stimolare l'autonomia nella vestizione della parte superiore del corpo.",
    obiettiviSanitari: "Mantenimento dei valori pressori < 135/85 mmHg e glicemia a digiuno < 130 mg/dL mediante aderenza terapeutica e dieta iposodica.",
    attivitaCognitive: "Partecipazione al laboratorio di pittura e tombolate settimanali. Coinvolgimento nella lettura del quotidiano al mattino.",
    indicazioniCaregiver: "Accompagnare durante la deambulazione su scale. Verificare assunzione Eutirox a digiuno ogni mattina.",
    frequenzaMonitoraggio: "Rilevazione PA e glicemia 3 volte a settimana. Controllo peso bisettimanale.",
    compilatore: "Dott.ssa Sara Conti (Coordinatrice)",
    generatoConAI: true
  },
  {
    id: "pai-2",
    ospiteId: "res-2",
    dataCompilazione: "2026-05-15",
    dataProssimaRevisione: "2026-11-15",
    obiettiviAutonomia: "Prevenire le cadute legate al blocco motorio (freezing) tipico del Parkinson. Mantenere l'equilibrio durante i trasferimenti sedia-letto.",
    obiettiviSanitari: "Somministrazione puntuale e rigorosa della levodopa (Madopar). Prevenzione piaghe da decubito con alternanza di posture.",
    attivitaCognitive: "Lettura di libri di storia e discussione in gruppo guidata dall'educatore.",
    indicazioniCaregiver: "Prestare massima attenzione durante le fasi 'off'. Utilizzare sempre la cintura di contenimento morbida sulla sedia a rotelle per sicurezza nei trasferimenti.",
    frequenzaMonitoraggio: "Fisioterapia 3 volte a settimana. Monitoraggio pressione e tremori quotidiano.",
    compilatore: "Dott.ssa Sara Conti (Coordinatrice)",
    generatoConAI: false
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "st-1",
    nome: "Sara",
    cognome: "Conti",
    ruolo: "Coordinatore / Direttore",
    telefono: "+39 335 1122334",
    email: "sara.conti@villaserena.it",
    codiceFiscale: "CNTSRA80A41H501K",
    attivo: true,
    coloreBadge: "#4f46e5"
  },
  {
    id: "st-2",
    nome: "Giulia",
    cognome: "Costa",
    ruolo: "Infermiera / Infermiere",
    telefono: "+39 340 9988776",
    email: "giulia.costa@villaserena.it",
    codiceFiscale: "CSTGLI85M50H501X",
    attivo: true,
    coloreBadge: "#0284c7"
  },
  {
    id: "st-3",
    nome: "Franco",
    cognome: "Marini",
    ruolo: "OSS (Operatore Socio-Sanitario)",
    telefono: "+39 339 4433221",
    email: "franco.marini@villaserena.it",
    codiceFiscale: "MRNFNC82R15F205W",
    attivo: true,
    coloreBadge: "#16a34a"
  },
  {
    id: "st-4",
    nome: "Lucia",
    cognome: "Moretti",
    ruolo: "OSS (Operatore Socio-Sanitario)",
    telefono: "+39 328 6655443",
    email: "lucia.moretti@villaserena.it",
    codiceFiscale: "MRTLCA88T62H501Z",
    attivo: true,
    coloreBadge: "#ca8a04"
  },
  {
    id: "st-5",
    nome: "Roberto",
    cognome: "Villa",
    ruolo: "Fisioterapista",
    telefono: "+39 347 1238901",
    email: "roberto.villa@villaserena.it",
    codiceFiscale: "VLLRBT83D20H501Y",
    attivo: true,
    coloreBadge: "#0d9488"
  }
];

export const INITIAL_SHIFTS: Shift[] = [
  {
    id: "sh-1",
    staffId: "st-3",
    data: todayStr,
    orarioInizio: "07:00",
    orarioFine: "14:00",
    tipoTurno: "Mattina",
    note: "Carrello farmaci e supporto igiene ospiti piano 1"
  },
  {
    id: "sh-2",
    staffId: "st-2",
    data: todayStr,
    orarioInizio: "08:00",
    orarioFine: "16:00",
    tipoTurno: "Mattina",
    note: "Medicazioni e controllo glicemie"
  },
  {
    id: "sh-3",
    staffId: "st-4",
    data: todayStr,
    orarioInizio: "14:00",
    orarioFine: "21:00",
    tipoTurno: "Pomeriggio",
    note: "Assistenza attività e cena"
  },
  {
    id: "sh-4",
    staffId: "st-3",
    data: todayStr,
    orarioInizio: "21:00",
    orarioFine: "07:00",
    tipoTurno: "Notte",
    note: "Vigilanza notturna e cambio posture"
  }
];

export const INITIAL_VISITS: FamilyVisit[] = [
  {
    id: "vis-1",
    ospiteId: "res-1",
    nomeVisitatore: "Laura Rossi",
    parentela: "Figlia",
    telefono: "+39 338 1234567",
    data: todayStr,
    oraInizio: "16:00",
    oraFine: "17:30",
    stato: "Confermata",
    numeroPersone: 2,
    note: "Incontro in salone o giardino esterno"
  },
  {
    id: "vis-2",
    ospiteId: "res-2",
    nomeVisitatore: "Roberto Bianchi",
    parentela: "Figlio",
    telefono: "+39 347 9876543",
    data: todayStr,
    oraInizio: "17:00",
    oraFine: "18:00",
    stato: "Confermata",
    numeroPersone: 1,
    note: "Porta riviste di storia per l'ospite"
  }
];

export const INITIAL_FINANCIALS: FinancialRecord[] = [
  {
    id: "fin-1",
    ospiteId: "res-1",
    meseAnno: "2026-08",
    importoBase: 1850.00,
    speseExtra: [
      { descrizione: "Servizio Parrucchiere e Pedicure", importo: 35.00 },
      { descrizione: "Integrazione Presidi Assorbenti", importo: 25.00 }
    ],
    totale: 1910.00,
    statoPagamento: "In attesa",
    dataScadenza: "2026-08-15",
    note: "Inviata avviso di pagamento tramite email a Laura Rossi"
  },
  {
    id: "fin-2",
    ospiteId: "res-2",
    meseAnno: "2026-08",
    importoBase: 1850.00,
    speseExtra: [
      { descrizione: "Farmaci non coperti da SSN", importo: 18.50 }
    ],
    totale: 1868.50,
    statoPagamento: "Pagato",
    dataScadenza: "2026-08-10",
    dataPagamento: "2026-08-05",
    note: "Bonifico ricevuto correttamente"
  },
  {
    id: "fin-3",
    ospiteId: "res-3",
    meseAnno: "2026-08",
    importoBase: 1850.00,
    speseExtra: [],
    totale: 1850.00,
    statoPagamento: "In attesa",
    dataScadenza: "2026-08-15"
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    nome: "Pannoloni Sagomati Taglia L",
    categoria: "Presidi Igiene e Pannoloni",
    quantita: 180,
    unitaMisura: "Pezzi",
    sogliaMinima: 100,
    scadenza: "2028-12-31",
    fornitore: "Sanitaria Medica Srl"
  },
  {
    id: "inv-2",
    nome: "Addensante per Liquidi (Polvere)",
    categoria: "Alimentari / Cucina",
    quantita: 12,
    unitaMisura: "Barattoli 225g",
    sogliaMinima: 5,
    scadenza: "2027-04-15",
    fornitore: "NutriCare Italia"
  },
  {
    id: "inv-3",
    nome: "Guanti in Nitrile Monouso (M/L)",
    categoria: "Materiale Sanitario",
    quantita: 8,
    unitaMisura: "Confezioni da 100",
    sogliaMinima: 10,
    scadenza: "2029-01-01",
    fornitore: "MedSupply Srl"
  },
  {
    id: "inv-4",
    nome: "Aghi e Lancette per Pungidito Glicemia",
    categoria: "Materiale Sanitario",
    quantita: 45,
    unitaMisura: "Pezzi",
    sogliaMinima: 50,
    scadenza: "2027-09-30",
    fornitore: "PharmaCare Direct"
  }
];

export const INITIAL_MEAL_PLAN: DayMealPlan[] = [
  {
    giorno: "Lunedì",
    pranzo: {
      primo: "Pasta corta al pomodoro e basilico fresco / Crema di verdure",
      secondo: "Petto di pollo alla griglia morbido con limone",
      contorno: "Carote al vapore all'olio d'oliva EVO",
      fruttaDolce: "Mela cotta con cannella"
    },
    cena: {
      primo: "Minestrone di verdure con riso soffiato",
      secondo: "Frittatina morbida alle erbe aromatiche",
      contorno: "Zucchine trifolate morbide",
      fruttaDolce: "Pero matura o pera cotta"
    },
    dietaSpecialeNote: "Iposodica per Rossi M.; Omogeneizzata con addensante per Ferrari A."
  },
  {
    giorno: "Martedì",
    pranzo: {
      primo: "Risotto alla zucca dolce e parmigiano",
      secondo: "Filetto di orata al forno con erbe",
      contorno: "Purè di patate biologiche",
      fruttaDolce: "Banana matura a rondelle"
    },
    cena: {
      primo: "Vellutata di zucchine con crostini morbidi",
      secondo: "Ricotta fresca di mucca con miele delicato",
      contorno: "Fagiolini al vapore",
      fruttaDolce: "Compota di prugne"
    }
  },
  {
    giorno: "Mercoledì",
    pranzo: {
      primo: "Gnocchetti di patate al pesto leggero senza aglio",
      secondo: "Polpettine di vitello magro al sugo di pomodoro",
      contorno: "Spinaci saltati in padella con olio e limone",
      fruttaDolce: "Pesca sciroppata senza zucchero aggiunto"
    },
    cena: {
      primo: "Passato di legumi e verdure con pastina",
      secondo: "Formaggio fresco Primo Sale morbido",
      contorno: "Finocchi al vapore gratinati",
      fruttaDolce: "Macedonia di frutta fresca morbida"
    }
  }
];

export const INITIAL_CREDENTIALS: any[] = [
  { username: "ANTONIO", role: "admin", passwordHash: "1234", mustChange: true },
  { username: "programmatore", role: "admin", passwordHash: "1234", mustChange: true },
  { username: "BEPPE", role: "admin", passwordHash: "1234", mustChange: true },
  { username: "DEBORAH", role: "admin", passwordHash: "1234", mustChange: true },
  { username: "CLAUDIA", role: "admin", passwordHash: "1234", mustChange: true },
  ...INITIAL_STAFF.map(staff => ({
    username: staff.nome,
    role: "staff",
    passwordHash: "1234",
    mustChange: true
  }))
];

export const INITIAL_BACHECA: any[] = [
  {
    id: "bach-1",
    dataOra: "2026-08-11 09:00",
    autore: "VANNUCCI (Direzione)",
    titolo: "Aggiornamento Protocolli Sanitari & Cambio Turni Estivi",
    testo: "Si ricorda a tutto il personale OSS e Infermieristico di verificare attentamente i turni estivi pubblicati e di firmare la presa visione di ogni avviso in Bacheca.",
    visti: ["VANNUCCI"]
  }
];

export const INITIAL_WHATSAPP_CHAT: any[] = [
  {
    id: "chat-1",
    dataOra: "2026-08-11 08:30",
    autore: "VANNUCCI",
    messaggio: "Buongiorno a tutti, ricordate di verificare le consegne della mattina prima del cambio turno.",
    ruoloAutore: "admin"
  },
  {
    id: "chat-2",
    dataOra: "2026-08-11 08:45",
    autore: "Marta",
    messaggio: "Buongiorno direttore, tutto regolare nel reparto A.",
    ruoloAutore: "staff"
  }
];

