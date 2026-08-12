import React, { useState, useEffect, useRef, useCallback } from "react";
import { storage, apiSync } from "./utils/storage";
import { firestoreSync, testConnection } from "./lib/firebase";
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
  UserCredential
} from "./types";

import { Navbar } from "./components/Navbar";
import { NavigationTabs, TabType } from "./components/NavigationTabs";
import { DashboardView } from "./components/DashboardView";
import { ResidentsView } from "./components/ResidentsView";
import { MedicationCartView } from "./components/MedicationCartView";
import { RoomsView } from "./components/RoomsView";
import { DailyLogsView } from "./components/DailyLogsView";
import { StaffShiftsView } from "./components/StaffShiftsView";
import { VisitsView } from "./components/VisitsView";
import { FinancialsView } from "./components/FinancialsView";
import { PaiAssistantView } from "./components/PaiAssistantView";
import { LoginScreen } from "./components/LoginScreen";
import { QuickVitalModal } from "./components/QuickModals";
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, LogOut } from "lucide-react";

export default function App() {
  // State Initialization from Storage
  const [residents, setResidents] = useState<Resident[]>(() => storage.getResidents());
  const [rooms, setRooms] = useState<Room[]>(() => storage.getRooms());
  const [therapies, setTherapies] = useState<Therapy[]>(() => storage.getTherapies());
  const [vitals, setVitals] = useState<VitalSign[]>(() => storage.getVitals());
  const [logs, setLogs] = useState<DailyLog[]>(() => storage.getLogs());
  const [pais, setPais] = useState<PAI[]>(() => storage.getPais());
  const [staff, setStaff] = useState<StaffMember[]>(() => storage.getStaff());
  const [shifts, setShifts] = useState<Shift[]>(() => storage.getShifts());
  const [credentials, setCredentials] = useState<UserCredential[]>(() => storage.getCredentials());
  
  const [currentUser, setCurrentUser] = useState<UserCredential | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("current_user");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [visits, setVisits] = useState<FamilyVisit[]>(() => storage.getVisits());
  const [financials, setFinancials] = useState<FinancialRecord[]>(() => storage.getFinancials());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => storage.getInventory());
  const [meals, setMeals] = useState<DayMealPlan[]>(() => storage.getMeals());

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  
  // Use the logged-in user's name as the active operator
  const activeOperator = currentUser ? (currentUser.role === 'admin' ? `Admin ${currentUser.username}` : `Staff ${currentUser.username}`) : "";

  // Modal Visibility
  const [showQuickVitalModal, setShowQuickVitalModal] = useState(false);

  // Check if opening as Public Read-Only Shift View for employees
  const [isPublicTurniView, setIsPublicTurniView] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;
      return search.includes("view=public-turni") || search.includes("mode=public") || hash.includes("turni-pubblici");
    }
    return false;
  });

  // Public Link Password Security State ("Vannucci 2026")
  const [isPublicAuthenticated, setIsPublicAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("public_turni_auth") === "true" || sessionStorage.getItem("public_turni_auth") === "true";
    }
    return false;
  });
  const [publicPasswordInput, setPublicPasswordInput] = useState<string>("");
  const [publicPasswordError, setPublicPasswordError] = useState<string>("");
  const [showPublicPassword, setShowPublicPassword] = useState<boolean>(false);

  const handleVerifyPublicPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned = publicPasswordInput.trim();
    // Accept "Vannucci 2026" (case-insensitive & trimmed)
    if (cleaned.toLowerCase() === "vannucci 2026" || cleaned.toLowerCase() === "vannucci2026") {
      setIsPublicAuthenticated(true);
      setPublicPasswordError("");
      try {
        localStorage.setItem("public_turni_auth", "true");
        sessionStorage.setItem("public_turni_auth", "true");
      } catch (err) {
        console.warn("Storage write notice:", err);
      }
    } else {
      setPublicPasswordError("Password errata. Inserisci la password aziendale corretta per accedere.");
    }
  };

  const handleLogoutPublicView = () => {
    setIsPublicAuthenticated(false);
    setPublicPasswordInput("");
    setPublicPasswordError("");
    try {
      localStorage.removeItem("public_turni_auth");
      sessionStorage.removeItem("public_turni_auth");
    } catch (err) {
      console.warn("Storage clear notice:", err);
    }
  };

  // Track timestamps for shifts and staff to prevent race conditions & stale overwrites
  const shiftsUpdatedAtRef = useRef<string>(storage.getShiftsUpdatedAt() || "1970-01-01T00:00:00.000Z");
  const staffUpdatedAtRef = useRef<string>(storage.getStaffUpdatedAt() || "1970-01-01T00:00:00.000Z");
  const credentialsUpdatedAtRef = useRef<string>(storage.getCredentialsUpdatedAt() || "1970-01-01T00:00:00.000Z");

  const handleUpdateCredentials = useCallback((newCredsOrUpdater: UserCredential[] | ((prev: UserCredential[]) => UserCredential[])) => {
    setCredentials(prev => {
      const nextCreds = typeof newCredsOrUpdater === "function" ? newCredsOrUpdater(prev) : newCredsOrUpdater;
      const now = new Date().toISOString();
      credentialsUpdatedAtRef.current = now;
      storage.setCredentials(nextCreds, now);
      firestoreSync.saveCredentials(nextCreds, now);
      return nextCreds;
    });
  }, []);

  // Handler to update shifts both locally and remotely
  const handleUpdateShifts = useCallback((newShiftsOrUpdater: Shift[] | ((prev: Shift[]) => Shift[])) => {
    setShifts(prevShifts => {
      const nextShifts = typeof newShiftsOrUpdater === "function" ? newShiftsOrUpdater(prevShifts) : newShiftsOrUpdater;
      const now = new Date().toISOString();
      shiftsUpdatedAtRef.current = now;
      storage.setShifts(nextShifts, now);
      firestoreSync.saveShifts(nextShifts, now);
      apiSync.saveShifts(nextShifts, now);
      return nextShifts;
    });
  }, []);

  // Handler to update staff both locally and remotely
  const handleUpdateStaff = useCallback((newStaffOrUpdater: StaffMember[] | ((prev: StaffMember[]) => StaffMember[])) => {
    setStaff(prevStaff => {
      const nextStaff = typeof newStaffOrUpdater === "function" ? newStaffOrUpdater(prevStaff) : newStaffOrUpdater;
      const now = new Date().toISOString();
      staffUpdatedAtRef.current = now;
      storage.setStaff(nextStaff, now);
      firestoreSync.saveStaff(nextStaff, now);
      apiSync.saveStaff(nextStaff, now);
      
      // Also refresh credentials based on current staff list
      setCredentials(storage.getCredentials());
      return nextStaff;
    });
  }, []);

  // Test connection to Firestore on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Subscribe to real-time Firebase Firestore database listeners for shifts and staff
  useEffect(() => {
    const initialShifts = storage.getShifts();
    const initialStaff = storage.getStaff();
    const initialCredentials = storage.getCredentials();

    const unsubscribeCredentials = firestoreSync.subscribeCredentials((remoteCreds, remoteUpdatedAt) => {
      if (remoteCreds && Array.isArray(remoteCreds)) {
        if (remoteUpdatedAt && remoteUpdatedAt <= credentialsUpdatedAtRef.current) {
          return;
        }
        if (remoteUpdatedAt) credentialsUpdatedAtRef.current = remoteUpdatedAt;
        storage.setCredentials(remoteCreds, remoteUpdatedAt);
        setCredentials(remoteCreds);
      }
    }, initialCredentials);

    const unsubscribeShifts = firestoreSync.subscribeShifts((remoteShifts, remoteUpdatedAt) => {
      if (remoteShifts && Array.isArray(remoteShifts)) {
        if (remoteUpdatedAt && remoteUpdatedAt <= shiftsUpdatedAtRef.current) {
          return; // Ignore stale or local echo update
        }
        if (remoteUpdatedAt) {
          shiftsUpdatedAtRef.current = remoteUpdatedAt;
        }
        storage.setShifts(remoteShifts, remoteUpdatedAt);
        setShifts(remoteShifts);
      }
    }, initialShifts);

    const unsubscribeStaff = firestoreSync.subscribeStaff((remoteStaff, remoteUpdatedAt) => {
      if (remoteStaff && Array.isArray(remoteStaff)) {
        if (remoteUpdatedAt && remoteUpdatedAt <= staffUpdatedAtRef.current) {
          return; // Ignore stale or local echo update
        }
        if (remoteUpdatedAt) {
          staffUpdatedAtRef.current = remoteUpdatedAt;
        }
        storage.setStaff(remoteStaff, remoteUpdatedAt);
        setStaff(remoteStaff);
      }
    }, initialStaff);

    return () => {
      unsubscribeCredentials();
      unsubscribeShifts();
      unsubscribeStaff();
    };
  }, []);

  // Sync state changes with Storage
  useEffect(() => { storage.setResidents(residents); }, [residents]);
  useEffect(() => { storage.setRooms(rooms); }, [rooms]);
  useEffect(() => { storage.setTherapies(therapies); }, [therapies]);
  useEffect(() => { storage.setVitals(vitals); }, [vitals]);
  useEffect(() => { storage.setLogs(logs); }, [logs]);
  useEffect(() => { storage.setPais(pais); }, [pais]);
  useEffect(() => { storage.setVisits(visits); }, [visits]);
  useEffect(() => { storage.setFinancials(financials); }, [financials]);

  // Manual & automatic trigger for server synchronization
  const syncWithServer = useCallback(async () => {
    try {
      const { staff: serverStaff, updatedAt: serverStaffUpdated } = await apiSync.fetchStaff();
      if (serverStaff && Array.isArray(serverStaff) && serverStaff.length > 0) {
        if (serverStaffUpdated && serverStaffUpdated > staffUpdatedAtRef.current) {
          staffUpdatedAtRef.current = serverStaffUpdated;
          storage.setStaff(serverStaff, serverStaffUpdated);
          setStaff(serverStaff);
        }
      } else if (staff.length > 0) {
        apiSync.saveStaff(staff, staffUpdatedAtRef.current);
      }

      const { shifts: serverShifts, updatedAt: serverShiftsUpdated } = await apiSync.fetchShifts();
      if (serverShifts && Array.isArray(serverShifts)) {
        if (serverShiftsUpdated && serverShiftsUpdated > shiftsUpdatedAtRef.current) {
          shiftsUpdatedAtRef.current = serverShiftsUpdated;
          storage.setShifts(serverShifts, serverShiftsUpdated);
          setShifts(serverShifts);
        }
      } else if (shifts.length > 0) {
        apiSync.saveShifts(shifts, shiftsUpdatedAtRef.current);
      }
    } catch (err) {
      console.warn("Server sync notice:", err);
    }
  }, [shifts, staff]);

  // Auto-sync on boot, tab focus, and periodic interval (6 seconds) for real-time public links
  useEffect(() => {
    syncWithServer();

    const handleFocus = () => {
      syncWithServer();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    const intervalId = setInterval(() => {
      syncWithServer();
    }, 6000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(intervalId);
    };
  }, [syncWithServer]);

  // Compute pending meds today
  const todayStr = new Date().toISOString().split("T")[0];
  let totalMedsScheduled = 0;
  let totalMedsAdministered = 0;

  therapies.forEach(t => {
    t.orari.forEach(o => {
      totalMedsScheduled++;
      if (t.somministrazioni?.[todayStr]?.[o]?.somministrato) {
        totalMedsAdministered++;
      }
    });
  });

  const pendingMedsCount = Math.max(0, totalMedsScheduled - totalMedsAdministered);
  const unreadLogsCount = logs.filter(l => !l.lettoDaSuccessivo).length;
  const unpaidFeesCount = financials.filter(f => f.statoPagamento !== "Pagato").length;

  // Handlers
  const handleSelectResident = (res: Resident | null) => {
    setSelectedResident(res);
    if (res && activeTab !== "residents") {
      setActiveTab("residents");
    }
  };

  const handleAddResident = (newRes: Resident) => {
    setResidents(prev => [newRes, ...prev]);
  };

  const handleUpdateResident = (updatedRes: Resident) => {
    setResidents(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));
  };

  const handleUpdateTherapy = (updatedTherapies: Therapy[]) => {
    setTherapies(updatedTherapies);
  };

  const handleAddTherapy = (newTherapy: Therapy) => {
    setTherapies(prev => [newTherapy, ...prev]);
  };

  const handleAddVital = (newVital: VitalSign) => {
    setVitals(prev => [newVital, ...prev]);
  };

  const handleAddLog = (newLog: DailyLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleUpdateLog = (updatedLog: DailyLog) => {
    setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
  };

  const handleSavePai = (pai: PAI) => {
    setPais(prev => {
      const exists = prev.some(p => p.ospiteId === pai.ospiteId);
      if (exists) {
        return prev.map(p => p.ospiteId === pai.ospiteId ? pai : p);
      }
      return [pai, ...prev];
    });
  };

  const handleUpdateFinancials = (updated: FinancialRecord[]) => {
    setFinancials(updated);
  };

  if (isPublicTurniView && !isPublicAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black">Residenza Vannucci</h1>
            <p className="text-xs text-slate-400">
              Accesso protetto al calendario turni e organico operatori in tempo reale.
            </p>
          </div>

          <form onSubmit={handleVerifyPublicPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password Aziendale Link Pubblico
              </label>
              <div className="relative">
                <input
                  type={showPublicPassword ? "text" : "password"}
                  value={publicPasswordInput}
                  onChange={e => setPublicPasswordInput(e.target.value)}
                  placeholder="Inserisci password (es. Vannucci 2026)"
                  className="w-full bg-slate-800 border border-slate-700 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPublicPassword(!showPublicPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  {showPublicPassword ? "Nascondi" : "Mostra"}
                </button>
              </div>
              {publicPasswordError && (
                <p className="text-rose-400 text-xs mt-1 font-semibold">{publicPasswordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg transition-all cursor-pointer"
            >
              Accedi al Calendario Turni
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500">
            Area riservata al personale di Casa Famiglia Residenza Anziani Vannucci.
          </div>
        </div>
      </div>
    );
  }

  if (isPublicTurniView) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased">
        <header className="bg-slate-900 text-white py-4 px-6 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-base">
              RV
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base">RESIDENZA VANNUCCI — Turni Operatori</h1>
              <p className="text-[11px] text-slate-400">Consultazione live organico e tabellone turni aggiornato in tempo reale</p>
            </div>
          </div>
          <button
            onClick={handleLogoutPublicView}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Esci / Blocca
          </button>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <StaffShiftsView
            staff={staff}
            shifts={shifts}
            onAddShift={() => {}}
            onDeleteShift={() => {}}
            onUpdateShifts={() => {}}
            onUpdateStaff={() => {}}
            onRefreshShifts={syncWithServer}
            isPublicView={true}
          />
        </main>

        <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto text-center">
          <p className="font-semibold text-slate-300">RESIDENZA VANNUCCI — Casa Famiglia & Residenza Assistita per Anziani</p>
        </footer>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        credentials={credentials}
        onLogin={(user) => {
          setCurrentUser(user);
          sessionStorage.setItem("current_user", JSON.stringify(user));
        }}
        onUpdatePassword={(username, newPassword) => {
          const updatedCreds = credentials.map(c => 
            c.username.toLowerCase() === username.toLowerCase() 
              ? { ...c, passwordHash: newPassword, mustChange: false } 
              : c
          );
          handleUpdateCredentials(updatedCreds);
        }}
      />
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header Navbar */}
      <Navbar
        residents={residents}
        onSelectResident={handleSelectResident}
        onOpenNewResidentModal={() => {
          setActiveTab("residents");
          setSelectedResident(null);
        }}
        onOpenMedCart={() => setActiveTab("medications")}
        onOpenVitalModal={() => setShowQuickVitalModal(true)}
        onOpenLogModal={() => setActiveTab("logs")}
        onResetData={() => {
          if (confirm("Sei sicuro di voler ripristinare i dati di esempio iniziali per RESIDENZA VANNUCCI?")) {
            storage.resetToDefaults();
          }
        }}
        activeOperator={activeOperator}
        onChangeOperator={() => {}}
      />

      {/* Main Tab Navigation */}
      <NavigationTabs
        userRole={currentUser.role}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== "residents") {
            // Keep selected resident state or clear if needed
          }
        }}
        pendingMedsCount={pendingMedsCount}
        unreadLogsCount={unreadLogsCount}
        unpaidFeesCount={unpaidFeesCount}
      />

      {/* Main Container View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === "dashboard" && (
          <DashboardView
            residents={residents}
            rooms={rooms}
            therapies={therapies}
            vitals={vitals}
            logs={logs}
            visits={visits}
            meals={meals}
            onNavigateTab={setActiveTab}
            onSelectResident={handleSelectResident}
            onOpenMedCart={() => setActiveTab("medications")}
            onOpenVitalModal={() => setShowQuickVitalModal(true)}
            onOpenLogModal={() => setActiveTab("logs")}
            onOpenNewResidentModal={() => {
              setActiveTab("residents");
              setSelectedResident(null);
            }}
          />
        )}

        {activeTab === "residents" && (
          <ResidentsView
            residents={residents}
            rooms={rooms}
            therapies={therapies}
            vitals={vitals}
            logs={logs}
            pais={pais}
            selectedResident={selectedResident}
            onSelectResident={setSelectedResident}
            onAddResident={handleAddResident}
            onUpdateResident={handleUpdateResident}
            onAddTherapy={handleAddTherapy}
            onAddVital={handleAddVital}
            onAddLog={handleAddLog}
            onSavePai={handleSavePai}
            activeOperator={activeOperator}
          />
        )}

        {activeTab === "medications" && (
          <MedicationCartView
            residents={residents}
            therapies={therapies}
            onUpdateTherapy={handleUpdateTherapy}
            activeOperator={activeOperator}
          />
        )}

        {activeTab === "rooms" && (
          <RoomsView
            rooms={rooms}
            residents={residents}
            onUpdateRooms={setRooms}
            onSelectResident={handleSelectResident}
          />
        )}

        {activeTab === "logs" && (
          <DailyLogsView
            logs={logs}
            residents={residents}
            onAddLog={handleAddLog}
            onUpdateLog={handleUpdateLog}
            activeOperator={activeOperator}
          />
        )}

        {activeTab === "shifts" && (
          <StaffShiftsView
            staff={staff}
            shifts={shifts}
            onAddShift={(newShift) => handleUpdateShifts(prev => [newShift, ...prev])}
            onDeleteShift={(shiftId) => handleUpdateShifts(prev => prev.filter(s => s.id !== shiftId))}
            onUpdateShifts={(updatedShifts) => handleUpdateShifts(updatedShifts)}
            onUpdateStaff={(updatedStaff) => handleUpdateStaff(updatedStaff)}
            onRefreshShifts={syncWithServer}
            isPublicView={currentUser.role === 'staff'}
            currentUser={currentUser}
          />
        )}

        {activeTab === "visits" && (
          <VisitsView
            visits={visits}
            residents={residents}
            onAddVisit={(newVisit) => setVisits(prev => [newVisit, ...prev])}
          />
        )}

        {activeTab === "financials" && (
          <FinancialsView
            financials={financials}
            residents={residents}
            onUpdateFinancials={handleUpdateFinancials}
          />
        )}

        {activeTab === "ai" && (
          <PaiAssistantView
            residents={residents}
            therapies={therapies}
            vitals={vitals}
            logs={logs}
            pais={pais}
            onSavePai={handleSavePai}
            activeOperator={activeOperator}
          />
        )}
      </main>

      {/* Global Quick Modals */}
      <QuickVitalModal
        isOpen={showQuickVitalModal}
        onClose={() => setShowQuickVitalModal(false)}
        residents={residents}
        onAddVital={handleAddVital}
        activeOperator={activeOperator}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            RESIDENZA VANNUCCI — Casa Famiglia & Residenza Assistita per Anziani
          </p>
          <p className="text-slate-500">
            Sistema di Gestione Socio-Sanitaria, Somministrazione Terapie e PAI Integrato con AI Gemini • Italia
          </p>
        </div>
      </footer>

    </div>
  );
}
