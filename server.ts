import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { 
  INITIAL_RESIDENTS, 
  INITIAL_TRANSFERS, 
  INITIAL_HEALTH_DIARY, 
  INITIAL_THERAPIES, 
  INITIAL_ADMINISTRATIONS, 
  INITIAL_DAILY_MENUS, 
  INITIAL_GUEST_DIETS, 
  INITIAL_CATERING_AUDITS, 
  INITIAL_STAFF, 
  INITIAL_SHIFTS, 
  INITIAL_ACCOUNTING, 
  INITIAL_DOCUMENTS, 
  INITIAL_SPECIALIST_VISITS, 
  INITIAL_CALENDAR_EVENTS 
} from './src/data/mockData.js';
import { SQL_DDL_SCHEMA, SHIFT_LOGIC_DOCUMENTATION, SYSTEM_ARCHITECTURE_DOC } from './src/data/sqlSchema.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Memory store for full-stack API testing
  let residents = [...INITIAL_RESIDENTS];
  let transfers = [...INITIAL_TRANSFERS];
  let healthDiary = [...INITIAL_HEALTH_DIARY];
  let therapies = [...INITIAL_THERAPIES];
  let administrations = [...INITIAL_ADMINISTRATIONS];
  let menus = [...INITIAL_DAILY_MENUS];
  let diets = [...INITIAL_GUEST_DIETS];
  let audits = [...INITIAL_CATERING_AUDITS];
  let staff = [...INITIAL_STAFF];
  let shifts = [...INITIAL_SHIFTS];
  let accounting = [...INITIAL_ACCOUNTING];
  let documents = [...INITIAL_DOCUMENTS];
  let specialistVisits = [...INITIAL_SPECIALIST_VISITS];
  let calendarEvents = [...INITIAL_CALENDAR_EVENTS];

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), guestsCount: residents.length });
  });

  // 1. Guests
  app.get('/api/residents', (req, res) => {
    const { area } = req.query;
    if (area) {
      res.json(residents.filter(r => r.areaAssegnata === area));
    } else {
      res.json(residents);
    }
  });

  app.post('/api/residents', (req, res) => {
    const newResident = {
      id: `res-${Date.now()}`,
      ...req.body,
    };
    residents.push(newResident);
    res.status(201).json(newResident);
  });

  app.post('/api/transfers', (req, res) => {
    const { ospiteId, areaDestinazione, motivo, operatoreNome } = req.body;
    const resident = residents.find(r => r.id === ospiteId);
    if (!resident) {
      res.status(404).json({ error: 'Ospite non trovato' });
      return;
    }
    const transferLog = {
      id: `tr-${Date.now()}`,
      ospiteId,
      areaOrigine: resident.areaAssegnata,
      areaDestinazione,
      dataTrasferimento: new Date().toISOString().replace('T', ' ').substring(0, 16),
      motivo,
      operatoreNome,
    };
    resident.areaAssegnata = areaDestinazione;
    transfers.unshift(transferLog);
    res.json({ success: true, resident, transferLog });
  });

  // 2. Clinical Diary & Therapies
  app.get('/api/diary/:residentId', (req, res) => {
    const list = healthDiary.filter(d => d.ospiteId === req.params.residentId);
    res.json(list);
  });

  app.post('/api/diary', (req, res) => {
    const newEntry = {
      id: `hd-${Date.now()}`,
      dataOra: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...req.body,
    };
    healthDiary.unshift(newEntry);
    res.status(201).json(newEntry);
  });

  app.get('/api/therapies/:residentId', (req, res) => {
    const list = therapies.filter(t => t.ospiteId === req.params.residentId);
    res.json(list);
  });

  app.get('/api/administrations', (req, res) => {
    res.json(administrations);
  });

  app.post('/api/administrations', (req, res) => {
    const newAdmin = {
      id: `adm-${Date.now()}`,
      dataOra: new Date().toISOString().replace('T', ' ').substring(0, 16),
      ...req.body,
    };
    administrations.unshift(newAdmin);
    res.status(201).json(newAdmin);
  });

  // 3. Catering
  app.get('/api/menus', (req, res) => {
    res.json(menus);
  });

  app.get('/api/diets', (req, res) => {
    res.json(diets);
  });

  app.get('/api/catering-audits', (req, res) => {
    res.json(audits);
  });

  // 4. Staff & Shifts
  app.get('/api/staff', (req, res) => {
    res.json(staff);
  });

  app.get('/api/shifts', (req, res) => {
    res.json(shifts);
  });

  // Overlap prevention logic endpoint
  app.post('/api/shifts', (req, res) => {
    const { staffId, data, oraInizio, oraFine, areaAssegnata, tipoTurno, mansioni } = req.body;
    
    // Check overlapping shift for same staff
    const conflict = shifts.find(s => 
      s.staffId === staffId && 
      s.data === data && 
      ((oraInizio < s.oraFine && oraFine > s.oraInizio))
    );

    if (conflict) {
      res.status(400).json({ 
        error: 'Errore Sovrapposizione Turni', 
        message: `L'operatore ha già un turno assegnato (${conflict.tipoTurno} ${conflict.oraInizio}-${conflict.oraFine}) nella stessa data.` 
      });
      return;
    }

    const newShift = {
      id: `sh-${Date.now()}`,
      staffId,
      data,
      tipoTurno,
      oraInizio,
      oraFine,
      areaAssegnata,
      mansioni: mansioni || [],
    };
    shifts.push(newShift);
    res.status(201).json(newShift);
  });

  // 5. Accounting
  app.get('/api/accounting', (req, res) => {
    res.json(accounting);
  });

  app.post('/api/accounting', (req, res) => {
    const newEntry = {
      id: `acc-${Date.now()}`,
      ...req.body,
    };
    accounting.unshift(newEntry);
    res.status(201).json(newEntry);
  });

  // 6. Documents
  app.get('/api/documents', (req, res) => {
    res.json(documents);
  });

  // 7. Calendar & Visits
  app.get('/api/specialist-visits', (req, res) => {
    res.json(specialistVisits);
  });

  app.post('/api/specialist-visits', (req, res) => {
    const newVisit = {
      id: `vis-${Date.now()}`,
      completata: false,
      ...req.body,
    };
    specialistVisits.unshift(newVisit);
    res.status(201).json(newVisit);
  });

  app.get('/api/calendar', (req, res) => {
    res.json(calendarEvents);
  });

  // Architecture & Schema Info
  app.get('/api/schema', (req, res) => {
    res.json({
      ddl: SQL_DDL_SCHEMA,
      shiftLogic: SHIFT_LOGIC_DOCUMENTATION,
      architecture: SYSTEM_ARCHITECTURE_DOC
    });
  });

  // Serve Vite in dev, dist in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server gestionale RSA avviato su http://localhost:${PORT}`);
  });
}

startServer();
