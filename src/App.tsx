import React, { useState } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ResidentsView } from './components/ResidentsView';
import { CateringView } from './components/CateringView';
import { StaffShiftsView } from './components/StaffShiftsView';
import { AccountingView } from './components/AccountingView';
import { DocumentsView } from './components/DocumentsView';
import { CalendarVisitsView } from './components/CalendarVisitsView';
import { ArchitectureSqlView } from './components/ArchitectureSqlView';

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
} from './data/mockData';

import { 
  Resident, 
  AreaTransferLog, 
  HealthDiaryEntry, 
  Therapy, 
  DrugAdministration, 
  DailyMenu, 
  GuestDietProfile, 
  CateringAuditLog, 
  StaffMember, 
  Shift, 
  AccountingEntry, 
  DocumentItem, 
  SpecialistVisit, 
  GlobalCalendarEvent,
  RSAArea
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<RSAArea | 'Tutte'>('Tutte');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [residents, setResidents] = useState<Resident[]>(INITIAL_RESIDENTS);
  const [transfers, setTransfers] = useState<AreaTransferLog[]>(INITIAL_TRANSFERS);
  const [healthDiary, setHealthDiary] = useState<HealthDiaryEntry[]>(INITIAL_HEALTH_DIARY);
  const [therapies, setTherapies] = useState<Therapy[]>(INITIAL_THERAPIES);
  const [administrations, setAdministrations] = useState<DrugAdministration[]>(INITIAL_ADMINISTRATIONS);
  const [menus] = useState<DailyMenu[]>(INITIAL_DAILY_MENUS);
  const [diets] = useState<GuestDietProfile[]>(INITIAL_GUEST_DIETS);
  const [audits] = useState<CateringAuditLog[]>(INITIAL_CATERING_AUDITS);
  const [staff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [accounting, setAccounting] = useState<AccountingEntry[]>(INITIAL_ACCOUNTING);
  const [documents] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [specialistVisits, setSpecialistVisits] = useState<SpecialistVisit[]>(INITIAL_SPECIALIST_VISITS);
  const [calendarEvents] = useState<GlobalCalendarEvent[]>(INITIAL_CALENDAR_EVENTS);

  // Handlers
  const handleAddResident = (newR: Partial<Resident>) => {
    const created: Resident = {
      id: `res-${Date.now()}`,
      nome: newR.nome || 'Nuovo',
      cognome: newR.cognome || 'Ospite',
      codiceFiscale: newR.codiceFiscale || 'CF9999999999999',
      dataNascita: newR.dataNascita || '1940-01-01',
      sesso: newR.sesso || 'M',
      stanza: newR.stanza || '101',
      letto: newR.letto || 'A',
      areaAssegnata: newR.areaAssegnata || 'Piano 1',
      stato: 'Attivo',
      dataIngresso: new Date().toISOString().substring(0, 10),
      referenteNome: newR.referenteNome || 'Referente Familiare',
      referenteTelefono: newR.referenteTelefono || '333 0000000',
      referenteEmail: newR.referenteEmail || '',
      referenteParentela: newR.referenteParentela || 'Figlio/a',
      dieteSpeciali: newR.dieteSpeciali || [],
      allergeni: newR.allergeni || [],
      noteDisfagia: newR.noteDisfagia,
    };
    setResidents(prev => [created, ...prev]);
  };

  const handleTransferResident = (ospiteId: string, destArea: RSAArea, motivo: string, operatore: string) => {
    const res = residents.find(r => r.id === ospiteId);
    if (!res) return;

    const log: AreaTransferLog = {
      id: `tr-${Date.now()}`,
      ospiteId,
      areaOrigine: res.areaAssegnata,
      areaDestinazione: destArea,
      dataTrasferimento: new Date().toISOString().replace('T', ' ').substring(0, 16),
      motivo,
      operatoreNome: operatore,
    };

    setResidents(prev => prev.map(r => r.id === ospiteId ? { ...r, areaAssegnata: destArea } : r));
    setTransfers(prev => [log, ...prev]);
  };

  const handleAddDiaryEntry = (entry: Partial<HealthDiaryEntry>) => {
    const created: HealthDiaryEntry = {
      id: `hd-${Date.now()}`,
      ospiteId: entry.ospiteId || '',
      dataOra: new Date().toISOString().replace('T', ' ').substring(0, 16),
      operatoreId: entry.operatoreId || 'op-cur',
      operatoreNome: entry.operatoreNome || 'Giulia Neri',
      operatoreRuolo: entry.operatoreRuolo || 'Infermiere',
      categoria: entry.categoria || 'Parametri Vitali',
      note: entry.note || '',
      parametriVitali: entry.parametriVitali,
    };
    setHealthDiary(prev => [created, ...prev]);
  };

  const handleAddAdministration = (admin: Partial<DrugAdministration>) => {
    const created: DrugAdministration = {
      id: `adm-${Date.now()}`,
      terapiaId: admin.terapiaId || '',
      ospiteId: admin.ospiteId || '',
      dataOra: new Date().toISOString().replace('T', ' ').substring(0, 16),
      orarioPrevisto: admin.orarioPrevisto || '08:00',
      stato: admin.stato || 'Somministrato',
      infermiereNome: admin.infermiereNome || 'Giulia Neri (Infermiere)',
      note: admin.note,
    };
    setAdministrations(prev => [created, ...prev]);
  };

  const handleAddShift = (newShift: Omit<Shift, 'id'>) => {
    // Check overlap
    const conflict = shifts.find(s => 
      s.staffId === newShift.staffId &&
      s.data === newShift.data &&
      (newShift.oraInizio < s.oraFine && newShift.oraFine > s.oraInizio)
    );

    if (conflict) {
      return { 
        success: false, 
        error: `Conflitto di Orario: l'operatore ha già un turno (${conflict.tipoTurno} ${conflict.oraInizio}-${conflict.oraFine}) nella stessa data.` 
      };
    }

    const created: Shift = {
      id: `sh-${Date.now()}`,
      ...newShift,
    };

    setShifts(prev => [...prev, created]);
    return { success: true };
  };

  const handleAddAccounting = (entry: Omit<AccountingEntry, 'id'>) => {
    const created: AccountingEntry = {
      id: `acc-${Date.now()}`,
      ...entry,
    };
    setAccounting(prev => [created, ...prev]);
  };

  const handleAddSpecialistVisit = (visit: Omit<SpecialistVisit, 'id' | 'completata'>) => {
    const created: SpecialistVisit = {
      id: `vis-${Date.now()}`,
      completata: false,
      ...visit,
    };
    setSpecialistVisits(prev => [created, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedAreaFilter={selectedAreaFilter}
        setSelectedAreaFilter={setSelectedAreaFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            residents={residents}
            shifts={shifts}
            specialistVisits={specialistVisits}
            administrations={administrations}
            selectedAreaFilter={selectedAreaFilter}
            onNavigateTab={setActiveTab}
            onOpenNewDiaryModal={() => setActiveTab('residents')}
            onOpenNewVisitModal={() => setActiveTab('visits')}
          />
        )}

        {activeTab === 'residents' && (
          <ResidentsView
            residents={residents}
            transfers={transfers}
            healthDiary={healthDiary}
            therapies={therapies}
            administrations={administrations}
            selectedAreaFilter={selectedAreaFilter}
            searchQuery={searchQuery}
            onAddResident={handleAddResident}
            onTransferResident={handleTransferResident}
            onAddDiaryEntry={handleAddDiaryEntry}
            onAddAdministration={handleAddAdministration}
          />
        )}

        {activeTab === 'catering' && (
          <CateringView
            menus={menus}
            diets={diets}
            audits={audits}
            residents={residents}
          />
        )}

        {activeTab === 'staff' && (
          <StaffShiftsView
            staff={staff}
            shifts={shifts}
            onAddShift={handleAddShift}
          />
        )}

        {activeTab === 'accounting' && (
          <AccountingView
            entries={accounting}
            residents={residents}
            onAddEntry={handleAddAccounting}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            residents={residents}
          />
        )}

        {activeTab === 'visits' && (
          <CalendarVisitsView
            specialistVisits={specialistVisits}
            calendarEvents={calendarEvents}
            residents={residents}
            staff={staff}
            onAddSpecialistVisit={handleAddSpecialistVisit}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureSqlView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Gestionale RSA Care &copy; 2026 &bull; Architettura ERP Sociosanitaria (35 Ospiti &bull; 3 Aree)
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            PostgreSQL / Express / React 19 / GDPR Compliant
          </span>
        </div>
      </footer>
    </div>
  );
}
