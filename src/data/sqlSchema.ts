export const SQL_DDL_SCHEMA = `-- =============================================================================
-- SISTEMA GESTIONALE ERP SOCIOSANITARIO PER CASA DI RIPOSO / RSA (35 OSPITI)
-- Schema SQL DDL Compatibile con PostgreSQL / MySQL 8.0
-- Autore: Senior ERP Architect
-- Data: 2026-08-10
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABELLE AREE E STRUTTURA LOGISTICA
-- -----------------------------------------------------------------------------
CREATE TABLE rsa_aree (
    id VARCHAR(36) PRIMARY KEY,
    nome_area VARCHAR(100) NOT NULL UNIQUE, -- 'Piano 1', 'Piano 2', 'Ala Protetta'
    descrizione TEXT,
    capacita_massima INT NOT NULL DEFAULT 15,
    livello_assistenziale VARCHAR(50) NOT NULL, -- 'Basso', 'Medio', 'Alto (Alzheimer/Demenze)'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rsa_stanze (
    id VARCHAR(36) PRIMARY KEY,
    area_id VARCHAR(36) NOT NULL REFERENCES rsa_aree(id) ON DELETE CASCADE,
    numero_stanza VARCHAR(20) NOT NULL,
    numero_letti INT NOT NULL DEFAULT 2,
    note TEXT,
    CONSTRAINT idx_stanza_area UNIQUE(area_id, numero_stanza)
);

-- -----------------------------------------------------------------------------
-- 2. TABELLE ANAGRAFICA OSPITI E STORICO TRASFERIMENTI
-- -----------------------------------------------------------------------------
CREATE TABLE ospiti (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
    data_nascita DATE NOT NULL,
    sesso CHAR(1) CHECK (sesso IN ('M', 'F')),
    stanza VARCHAR(20) NOT NULL,
    letto VARCHAR(10) NOT NULL,
    area_assegnata VARCHAR(50) NOT NULL CHECK (area_assegnata IN ('Piano 1', 'Piano 2', 'Ala Protetta')),
    stato VARCHAR(20) NOT NULL DEFAULT 'Attivo' CHECK (stato IN ('Attivo', 'In Ospedale', 'Dimesso', 'Deceduto')),
    data_ingresso DATE NOT NULL,
    referente_nome VARCHAR(150) NOT NULL,
    referente_telefono VARCHAR(30) NOT NULL,
    referente_email VARCHAR(100),
    referente_parentela VARCHAR(50) NOT NULL,
    tutore_note TEXT,
    foto_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trasferimenti_interni (
    id VARCHAR(36) PRIMARY KEY,
    ospite_id VARCHAR(36) NOT NULL REFERENCES ospiti(id) ON DELETE CASCADE,
    area_origine VARCHAR(50) NOT NULL,
    area_destinazione VARCHAR(50) NOT NULL,
    data_trasferimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL,
    operatore_nome VARCHAR(150) NOT NULL
);

-- -----------------------------------------------------------------------------
-- 3. CARTELLA CLINICA, DIARIO SANITARIO E TERAPIE FARMACOLOGICHE
-- -----------------------------------------------------------------------------
CREATE TABLE diario_sanitario (
    id VARCHAR(36) PRIMARY KEY,
    ospite_id VARCHAR(36) NOT NULL REFERENCES ospiti(id) ON DELETE CASCADE,
    data_ora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    operatore_id VARCHAR(36) NOT NULL,
    operatore_nome VARCHAR(150) NOT NULL,
    operatore_ruolo VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
        'Parametri Vitali', 'Nota Clinica', 'Evento/Caduta', 'Igiene/Cura', 'Visita Medico', 'Fisioterapia'
    )),
    note TEXT NOT NULL,
    pressione_arteriosa VARCHAR(20),
    saturazione INT,
    glicemia INT,
    temperatura DECIMAL(4,1),
    frequenza_cardiaca INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schede_terapeutiche (
    id VARCHAR(36) PRIMARY KEY,
    ospite_id VARCHAR(36) NOT NULL REFERENCES ospiti(id) ON DELETE CASCADE,
    nome_farmaco VARCHAR(150) NOT NULL,
    principio_attivo VARCHAR(150) NOT NULL,
    dosaggio VARCHAR(50) NOT NULL,
    via_somministrazione VARCHAR(50) NOT NULL CHECK (via_somministrazione IN (
        'Orale', 'Inramuscolare', 'Sottocutanea', 'Endovenosa', 'Cerotto', 'Inalatoria'
    )),
    orari_json JSON NOT NULL, -- es. ["08:00", "12:00", "20:00"]
    data_inizio DATE NOT NULL,
    data_fine DATE,
    medico_prescrittore VARCHAR(150) NOT NULL,
    note TEXT,
    attiva BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE somministrazione_farmaci (
    id VARCHAR(36) PRIMARY KEY,
    terapia_id VARCHAR(36) NOT NULL REFERENCES schede_terapeutiche(id) ON DELETE CASCADE,
    ospite_id VARCHAR(36) NOT NULL REFERENCES ospiti(id) ON DELETE CASCADE,
    data_ora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    orario_previsto VARCHAR(10) NOT NULL, -- es. "08:00"
    stato VARCHAR(30) NOT NULL CHECK (stato IN ('Somministrato', 'Rifiutato', 'Non Disponibile', 'Sospeso')),
    infermiere_nome VARCHAR(150) NOT NULL,
    note TEXT
);

-- -----------------------------------------------------------------------------
-- 4. MODULO RISTORAZIONE E ARCHIVIO AUDIT ASL / NAS
-- -----------------------------------------------------------------------------
CREATE TABLE menu_giornalieri (
    id VARCHAR(36) PRIMARY KEY,
    data DATE NOT NULL,
    pasto VARCHAR(20) NOT NULL CHECK (pasto IN ('Colazione', 'Pranzo', 'Merenda', 'Cena')),
    primo VARCHAR(200) NOT NULL,
    secondo VARCHAR(200) NOT NULL,
    contorno VARCHAR(200) NOT NULL,
    frutta_dolce VARCHAR(200) NOT NULL,
    note_allergeni TEXT,
    CONSTRAINT idx_data_pasto UNIQUE(data, pasto)
);

CREATE TABLE diete_ospiti (
    ospite_id VARCHAR(36) PRIMARY KEY REFERENCES ospiti(id) ON DELETE CASCADE,
    tipo_dieta VARCHAR(100) NOT NULL, -- 'Iposodica', 'Diabetica', 'Iperproteica', 'Celiaca'
    consistenza VARCHAR(30) NOT NULL CHECK (consistenza IN ('Solida', 'Tritata', 'Frullata', 'Omogeneizzata')),
    addensante_liquidi BOOLEAN DEFAULT FALSE,
    intolleranze_json JSON, -- es. ["Lattosio", "Glutine", "Frutta a guscio"]
    note_cucina TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_ristorazione_asl (
    id VARCHAR(36) PRIMARY KEY,
    data DATE NOT NULL,
    tipo_ispezione VARCHAR(100) NOT NULL, -- 'Controllo Interno HACCP', 'Ispezione ASL', 'Audit NAS'
    esito VARCHAR(50) NOT NULL CHECK (esito IN ('Conforme', 'Conforme con Riserva', 'Non Conforme')),
    note_conformita TEXT NOT NULL,
    ispettore_verificatore VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. GESTIONE PERSONALE, TURNISTICA E MANSIONI
-- -----------------------------------------------------------------------------
CREATE TABLE personale (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cognome VARCHAR(100) NOT NULL,
    codice_fiscale VARCHAR(16) UNIQUE NOT NULL,
    ruolo VARCHAR(50) NOT NULL CHECK (ruolo IN (
        'OSS', 'Infermiere', 'Educatore', 'Medico', 'Fisioterapista', 'Amministrativo', 'Coordinatore'
    )),
    email VARCHAR(100) UNIQUE NOT NULL,
    telefono VARCHAR(30) NOT NULL,
    ore_contrattuali_settimanali INT NOT NULL DEFAULT 38,
    attivo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE turni_personale (
    id VARCHAR(36) PRIMARY KEY,
    staff_id VARCHAR(36) NOT NULL REFERENCES personale(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    tipo_turno VARCHAR(30) NOT NULL CHECK (tipo_turno IN ('Mattina', 'Pomeriggio', 'Notte', 'Reperibilità', 'Spezzato')),
    ora_inizio TIME NOT NULL,
    ora_fine TIME NOT NULL,
    area_assegnata VARCHAR(50) NOT NULL CHECK (area_assegnata IN ('Piano 1', 'Piano 2', 'Ala Protetta', 'Tutta la Struttura')),
    mansioni_json JSON NOT NULL, -- es. ["Igiene Mattutina", "Distribuzione Pasti"]
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indice per prevenire doppie assegnazioni e velocizzare le query
CREATE INDEX idx_turni_staff_data ON turni_personale(staff_id, data);
CREATE INDEX idx_turni_area_data ON turni_personale(area_assegnata, data);

-- -----------------------------------------------------------------------------
-- 6. GESTIONE CONTABILE (PRIMA NOTA CASSA / BANCA)
-- -----------------------------------------------------------------------------
CREATE TABLE prima_nota_contabile (
    id VARCHAR(36) PRIMARY KEY,
    data DATE NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('Entrata', 'Uscita')),
    importo DECIMAL(10,2) NOT NULL,
    categoria VARCHAR(100) NOT NULL CHECK (categoria IN (
        'Rette Ospiti', 'Farmaci e Presidi', 'Alimentari e Ristorazione', 
        'Utenze', 'Stipendi Personale', 'Manutenzione Struttura', 
        'Servizi Personali Ospiti', 'Varie'
    )),
    descrizione TEXT NOT NULL,
    metodo_pagamento VARCHAR(30) NOT NULL CHECK (metodo_pagamento IN ('Bonifico', 'RID/SDD', 'Cassa', 'POS')),
    ospite_id VARCHAR(36) REFERENCES ospiti(id) ON DELETE SET NULL, -- Opzionale: addebito ad ospite specifico
    numero_ricevuta_fattura VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. ARCHIVIO DOCUMENTALE (OSPITI ED AZIENDALE)
-- -----------------------------------------------------------------------------
CREATE TABLE documenti (
    id VARCHAR(36) PRIMARY KEY,
    titolo VARCHAR(200) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('Ospite', 'Aziendale')),
    sub_categoria VARCHAR(100) NOT NULL CHECK (sub_categoria IN (
        'Carta Identità', 'Tessera Sanitaria', 'Referto Medico', 'Contratto Ingresso', 'Impegnativa ASL',
        'Contratto Fornitore', 'Certificazione Struttura', 'HACCP / Sicurezza', 'Protocollo Interno'
    )),
    ospite_id VARCHAR(36) REFERENCES ospiti(id) ON DELETE CASCADE,
    data_caricamento DATE NOT NULL DEFAULT (CURRENT_DATE),
    data_scadenza DATE,
    file_url VARCHAR(500) NOT NULL,
    dimensione_kb INT NOT NULL,
    note TEXT
);

-- -----------------------------------------------------------------------------
-- 8. CALENDARIO E VISITE SPECIALISTICHE ESTERNE
-- -----------------------------------------------------------------------------
CREATE TABLE visite_specialistiche (
    id VARCHAR(36) PRIMARY KEY,
    ospite_id VARCHAR(36) NOT NULL REFERENCES ospiti(id) ON DELETE CASCADE,
    tipo_specialista VARCHAR(100) NOT NULL, -- 'Cardiologo', 'Neurologo', 'Dermatologo', 'Laboratorio Analisi'
    nome_struttura_clinica VARCHAR(200) NOT NULL,
    indirizzo_clinica VARCHAR(255) NOT NULL,
    telefono_clinica VARCHAR(30) NOT NULL,
    email_clinica VARCHAR(100),
    data_ora TIMESTAMP NOT NULL,
    operatore_accompagnatore VARCHAR(150),
    esito_visita TEXT,
    note_follow_up TEXT,
    completata BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eventi_calendario (
    id VARCHAR(36) PRIMARY KEY,
    titolo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Generale Struttura', 'Attività Ricreativa', 'Riunione Equipe', 'Visita Parenti', 'Manutenzione')),
    data_inizio TIMESTAMP NOT NULL,
    data_fine TIMESTAMP NOT NULL,
    area_riferimento VARCHAR(50) CHECK (area_riferimento IN ('Piano 1', 'Piano 2', 'Ala Protetta', 'Tutta la Struttura')),
    ospite_id VARCHAR(36) REFERENCES ospiti(id) ON DELETE CASCADE,
    descrizione TEXT NOT NULL
);
`;

export const SHIFT_LOGIC_DOCUMENTATION = `
### LOGICA DEI TURNI E PREVENZIONE SOVRAPPOSIZIONI

Per la corretta pianificazione del personale in una struttura sociosanitaria (35 ospiti, 3 aree) con operatività H24/365, il modulo dei turni adotta le seguenti regole di dominio:

#### 1. Tipologie di Turno Standard e Orari
- **Mattina (M):** 07:00 - 14:00 (7 ore)
- **Pomeriggio (P):** 14:00 - 21:00 (7 ore)
- **Notte (N):** 21:00 - 07:00 (10 ore)
- **Reperibilità (R):** Disponibilità a chiamata extra-turno
- **Spezzato (S):** 08:30 - 12:30 e 15:30 - 19:30 (8 ore)

#### 2. Regola di Prevenzione Sovrapposizioni (Overlapping Prevention)
In fase di inserimento o modifica di un turno, il sistema esegue una verifica temporale per impedire:
a) L'assegnazione dello stesso operatore a due turni sovrapposti nello stesso giorno/orario.
b) Il mancato rispetto del riposo minimo obbligatorio di 11 ore consecutive tra due turni (d.lgs 66/2003).

**Query SQL per controllo sovrapposizione:**
\`\`\`sql
SELECT COUNT(*) AS turni_conflitto
FROM turni_personale
WHERE staff_id = :staff_id
  AND data = :data_turno
  AND (
    (ora_inizio < :ora_fine AND ora_fine > :ora_inizio)
  );
\`\`\`

#### 3. Rendicontazione Mensile ed Annuale Ore Lavorate
Per il calcolo dello straordinario e il consuntivo ore mensile:

\`\`\`sql
SELECT 
    p.id AS staff_id,
    p.nome,
    p.cognome,
    p.ruolo,
    p.ore_contrattuali_settimanali * 4.33 AS ore_contrattuali_mensili,
    SUM(
        TIMESTAMPDIFF(MINUTE, t.ora_inizio, 
            CASE WHEN t.ora_fine < t.ora_inizio THEN ADDTIME(t.ora_fine, '24:00:00') ELSE t.ora_fine END
        ) / 60.0
    ) AS ore_effettuate,
    SUM(
        CASE WHEN t.tipo_turno = 'Notte' THEN 1 ELSE 0 END
    ) AS turni_notturni
FROM personale p
LEFT JOIN turni_personale t ON p.id = t.staff_id 
    AND t.data BETWEEN :data_inizio AND :data_fine
GROUP BY p.id, p.nome, p.cognome, p.ruolo, p.ore_contrattuali_settimanali;
\`\`\`

#### 4. Verifica Copertura Minima per Area e Livello Assistenziale
Ogni area richiede standard assistenziali minimi garantiti (es. Ala Protetta Alzheimer richiede una presenza OSS potenziata):
- **Mattina:** Almeno 1 Infermiere (Tutta la struttura) + 2 OSS per Piano 1, 2 OSS per Piano 2, 2 OSS per Ala Protetta.
- **Pomeriggio:** Almeno 1 Infermiere + 1 OSS per area.
- **Notte:** Almeno 1 Infermiere di guardia + 2 OSS di ronda.
`;

export const SYSTEM_ARCHITECTURE_DOC = `
### ARCHITETTURA TECNOLOGICA DEL SISTEMA ERP (RSA)

#### 1. Stack Tecnologico Consigliato
- **Frontend App:** React 19 / TypeScript + Tailwind CSS v4 + Motion + Lucide Icons per un'interfaccia ad altissima reattività, accessibilità e fruibilità da tablet/desktop da parte degli operatori.
- **Backend Service:** Node.js Express in TypeScript (o NestJS per grandi strutture) con API RESTful / GraphQL, validazione DTO con Zod e gestione transazionale.
- **Database Relazionale:** PostgreSQL 16 con estensione \`pgcrypto\` per la crittografia dei dati sensibili a riposo.
- **ORM / Query Builder:** Drizzle ORM o Prisma ORM per una tipizzazione end-to-end senza errori di runtime.

#### 2. Sicurezza dei Dati Sanitari e Conformità GDPR (UE 2016/679)
- **Crittografia at-Rest & in-Transit:** Tutte le comunicazioni su HTTPS/TLS 1.3. Campi sanitari sensibili (Codice Fiscale, Diagnosi, Parametri vitali) crittografati a livello colonna.
- **Role-Based Access Control (RBAC):**
  - *Medico/Infermiere:* Accesso completo alla Cartella Clinica, Scheda Terapeutica e Somministrazioni.
  - *OSS:* Lettura Diario Sanitario, Igiene, Consegne di turno e Ristorazione (Diete/Disfagia).
  - *Coordinatore/Amministrativo:* Accesso a Gestione Personale, Turnistica, Prima Nota e Contratti.
- **Audit Log Inalterabile:** Registro di log centralizzato che traccia chi ha letto o modificato ogni cartella clinica, con marca temporale e IP.
- **Backup & Disaster Recovery:** Backup differenziale automatico ogni 6 ore con retention crittografata su storage cloud conforme ISO 27001 / ACN.
`;
