import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side persistent storage setup
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

let serverStore: Record<string, any> = {};

function initServerStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      serverStore = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error loading server store:", err);
  }
}

function saveServerStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(serverStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving server store:", err);
  }
}

initServerStore();

// Lazy GoogleGenAI helper
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Casa Famiglia Anziani - Gestionale RSA & Care" });
});

// REST Endpoints for real-time synchronization across devices
app.get("/api/shifts", (req, res) => {
  res.json({ success: true, shifts: serverStore.shifts || null, updatedAt: serverStore.shiftsUpdatedAt || null });
});

app.post("/api/shifts", (req, res) => {
  const { shifts } = req.body;
  if (Array.isArray(shifts)) {
    serverStore.shifts = shifts;
    serverStore.shiftsUpdatedAt = new Date().toISOString();
    saveServerStore();
    return res.json({ success: true, count: shifts.length, updatedAt: serverStore.shiftsUpdatedAt });
  }
  return res.status(400).json({ error: "Invalid shifts format" });
});

app.get("/api/staff", (req, res) => {
  res.json({ success: true, staff: serverStore.staff || null, updatedAt: serverStore.staffUpdatedAt || null });
});

app.post("/api/staff", (req, res) => {
  const { staff } = req.body;
  if (Array.isArray(staff)) {
    serverStore.staff = staff;
    serverStore.staffUpdatedAt = new Date().toISOString();
    saveServerStore();
    return res.json({ success: true, count: staff.length, updatedAt: serverStore.staffUpdatedAt });
  }
  return res.status(400).json({ error: "Invalid staff format" });
});

// AI Endpoint: Generate or update PAI (Piano Assistenziale Individualizzato)
app.post("/api/ai/generate-pai", async (req, res) => {
  try {
    const { resident, dailyLogs, vitalSigns, existingPai } = req.body;
    
    if (!resident) {
      return res.status(400).json({ error: "Dati dell'ospite mancanti." });
    }

    const ai = getGenAI();

    const prompt = `Sei un coordinatore socio-sanitario ed esperto in gestione di case famiglia per anziani (RSA / Strutture residenziali assistite in Italia).
Devi redigere o aggiornare un Piano Assistenziale Individualizzato (PAI) formale in lingua italiana per l'ospite descritto di seguito.

DATI OSPITE:
- Nome e Cognome: ${resident.nome} ${resident.cognome}
- Età / Data Nascita: ${resident.dataNascita}
- Patologie / Diagnosi: ${resident.patologie || "Nessuna patologia rilevante specificata"}
- Allergie: ${resident.allergie || "Nessuna allergia nota"}
- Dieta: ${resident.dieta || "Standard"}
- Note comportamentali / Autonomia: ${resident.noteComportamentali || "Non specificato"}

ULTIME OSSERVAZIONI / DIARIO DI BORDO (Ultimi giorni):
${JSON.stringify(dailyLogs || [], null, 2)}

ULTIMI PARAMETRI VITALI:
${JSON.stringify(vitalSigns || [], null, 2)}

PAI PRECEDENTE O RIFERIMENTO:
${existingPai ? JSON.stringify(existingPai, null, 2) : "Nessun PAI precedente disponibile."}

Genera una risposta strutturata strictly in formato JSON valido senza markup di codice superfluo con queste chiavi:
{
  "obiettiviAutonomia": "Descrizione dettagliata degli obiettivi per il mantenimento o miglioramento dell'autonomia motoria e funzionale.",
  "obiettiviSanitari": "Descrizione degli obiettivi sanitari, monitoraggio parametri e prevenzione complicanze.",
  "attivitaCognitive": "Proposte di stimolazione cognitiva, socializzazione, laboratori o attività per il benessere emotivo.",
  "indicazioniCaregiver": "Indicazioni pratiche ed operative fondamentali per gli operatore OSS e infermieri durante i turni quotidiani.",
  "frequenzaMonitoraggio": "Indicazioni su cadenza rilevazione parametri vitali, peso, e valutazioni periodiche.",
  "raccomandazioniMiglioramento": "3-4 suggerimenti chiave pratici da attuare subito."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const paiData = JSON.parse(text);

    return res.json({ success: true, pai: paiData });
  } catch (error: any) {
    console.error("Errore generazione PAI:", error);
    return res.status(500).json({ error: error.message || "Errore durante la generazione del PAI con AI." });
  }
});

// AI Endpoint: Shift Handover Summary (Sintesi Consegne Turno)
app.post("/api/ai/shift-summary", async (req, res) => {
  try {
    const { logs, vitalSigns, shiftName, date } = req.body;

    const ai = getGenAI();

    const prompt = `Sei un caposala/coordinatore di una casa famiglia per anziani. 
Elabora una "Sintesi Consegne di Turno" chiara, sintetica e professionale in lingua italiana per il turno di: ${shiftName || "Generale"} del giorno ${date || "Oggi"}.

DIARIO DI BORDO (Consegne degli operatori):
${JSON.stringify(logs || [], null, 2)}

PARAMETRI VITALI RILEVATI:
${JSON.stringify(vitalSigns || [], null, 2)}

Fornisci la risposta in formato JSON con la seguente struttura:
{
  "titolo": "Sintesi Consegne Turno",
  "quadroGenerale": "Breve riassunto dell'andamento generale del turno e clima in struttura.",
  "eventiCritici": ["Elenco di eventuali cadute, picchi febbrili, episodi di agitazione o anomalie rilevate, oppure 'Nessun evento critico'"],
  "ospitiAttenzionati": ["Ospite X: motivo dell'attenzione specifica", "Ospite Y: motivo"],
  "raccomandazioniTurnoSuccessivo": ["Azione 1 da eseguire nel prossimo turno", "Azione 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return res.json({ success: true, summary: JSON.parse(text) });
  } catch (error: any) {
    console.error("Errore sintesi turno:", error);
    return res.status(500).json({ error: error.message || "Errore nella generazione sintesi turno." });
  }
});

// AI Endpoint: Medication Interaction / Safety Check
app.post("/api/ai/med-check", async (req, res) => {
  try {
    const { resident, therapies } = req.body;

    const ai = getGenAI();

    const prompt = `Analizza la terapia farmacologica di un anziano accolto in una casa famiglia per valutare possibili interazioni, precauzioni di somministrazione o consigli d'uso per il personale OSS/Infermieristico.

OSPITE: ${resident.nome} ${resident.cognome}, Anni: ${resident.dataNascita}, Allergie: ${resident.allergie || "Nessuna"}, Patologie: ${resident.patologie || "Nessuna"}

TERAPIE ATTIVE:
${JSON.stringify(therapies || [], null, 2)}

Rispondi in formato JSON:
{
  "valutazioneSicurezza": "Verde / Gialla / Arancione",
  "sintesiInterazioni": "Spiegazione in italiano semplice e professionale per gli operatori della struttura.",
  "precauzioniSomministrazione": ["Precauzione 1 (es. assumere a stomaco pieno)", "Precauzione 2"],
  "segnaliDaMonitorare": ["Segnale 1 (es. sonnolenza eccessiva)", "Segnale 2"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    return res.json({ success: true, analysis: JSON.parse(text) });
  } catch (error: any) {
    console.error("Errore verifica farmaci:", error);
    return res.status(500).json({ error: error.message || "Errore durante il controllo farmaci." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server "Casa Famiglia Anziani" in ascolto su http://0.0.0.0:${PORT}`);
  });
}

startServer();
