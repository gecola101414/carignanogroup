import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  UserCredential,
  BachecaNotice,
  ChatWhatsAppMessage
} from "./types";

import { Sidebar } from "./components/Sidebar";
import { TabType } from "./components/NavigationTabs";
import { DashboardView } from "./components/DashboardView";
import { ResidentsView } from "./components/ResidentsView";
import { MedicationCartView } from "./components/MedicationCartView";
import { RoomsView } from "./components/RoomsView";
import { DailyLogsView } from "./components/DailyLogsView";
import { StaffShiftsView } from "./components/StaffShiftsView";
import { BachecaView } from "./components/BachecaView";
import { ChatWhatsAppView } from "./components/ChatWhatsAppView";
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

  const [bacheca, setBacheca] = useState<BachecaNotice[]>(() => storage.getBacheca());
  const [chatMessages, setChatMessages] = useState<ChatWhatsAppMessage[]>(() => storage.getChat());

  const [presenceRecord, setPresenceRecord] = useState<Record<string, string>>({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const onlineUsers = useMemo(() => {
    return Object.entries(presenceRecord)
      .filter(([_, time]) => (currentTime - new Date(time as string).getTime()) < 120000)
      .map(([user]) => user);
  }, [presenceRecord, currentTime]);

  useEffect(() => {
    if (currentUser?.role === 'staff' && activeTab !== 'shifts' && activeTab !== 'logs' && activeTab !== 'bacheca' && activeTab !== 'chat') {
      setActiveTab('shifts');
    }
  }, [currentUser, activeTab]);
  
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
  const chatUpdatedAtRef = useRef<string>("1970-01-01T00:00:00.000Z");
  const bachecaUpdatedAtRef = useRef<string>("1970-01-01T00:00:00.000Z");

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

  const handleUpdateBacheca = useCallback((newBachecaOrUpdater: BachecaNotice[] | ((prev: BachecaNotice[]) => BachecaNotice[])) => {
    setBacheca(prev => {
      const next = typeof newBachecaOrUpdater === "function" ? newBachecaOrUpdater(prev) : newBachecaOrUpdater;
      const now = new Date().toISOString();
      bachecaUpdatedAtRef.current = now;
      storage.setBacheca(next);
      firestoreSync.saveBacheca(next, now);
      return next;
    });
  }, []);

  const handleUpdateChat = useCallback((newChatOrUpdater: ChatWhatsAppMessage[] | ((prev: ChatWhatsAppMessage[]) => ChatWhatsAppMessage[])) => {
    setChatMessages(prev => {
      const next = typeof newChatOrUpdater === "function" ? newChatOrUpdater(prev) : newChatOrUpdater;
      const now = new Date().toISOString();
      chatUpdatedAtRef.current = now;
      storage.setChat(next);
      firestoreSync.saveChat(next, now);
      return next;
    });
  }, []);
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

  // Subscribe to real-time Firebase Firestore database listeners for shifts, staff, chat, and bacheca
  useEffect(() => {
    const initialShifts = storage.getShifts();
    const initialStaff = storage.getStaff();
    const initialCredentials = storage.getCredentials();
    const initialChat = storage.getChat();
    const initialBacheca = storage.getBacheca();

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

    const unsubscribeChat = firestoreSync.subscribeChat((remoteChat, remoteUpdatedAt) => {
      if (remoteChat && Array.isArray(remoteChat)) {
        if (remoteUpdatedAt && remoteUpdatedAt <= chatUpdatedAtRef.current) {
          return;
        }
        if (remoteUpdatedAt) chatUpdatedAtRef.current = remoteUpdatedAt;
        storage.setChat(remoteChat);
        setChatMessages(remoteChat);
      }
    }, initialChat);

    const unsubscribeBacheca = firestoreSync.subscribeBacheca((remoteBacheca, remoteUpdatedAt) => {
      if (remoteBacheca && Array.isArray(remoteBacheca)) {
        if (remoteUpdatedAt && remoteUpdatedAt <= bachecaUpdatedAtRef.current) {
          return;
        }
        if (remoteUpdatedAt) bachecaUpdatedAtRef.current = remoteUpdatedAt;
        storage.setBacheca(remoteBacheca);
        setBacheca(remoteBacheca);
      }
    }, initialBacheca);

    const unsubscribePresence = firestoreSync.subscribePresence((data) => {
      if (data) setPresenceRecord(data);
    });

    return () => {
      unsubscribeCredentials();
      unsubscribeShifts();
      unsubscribeStaff();
      unsubscribeChat();
      unsubscribeBacheca();
      unsubscribePresence();
    };
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!currentUser) return;
    
    const updateMyPresence = () => {
      firestoreSync.updatePresence(currentUser.username, new Date().toISOString());
    };
    
    // Initial update
    updateMyPresence();
    
    // Heartbeat every 5 minutes
    const intervalId = setInterval(updateMyPresence, 300000);
    
    // Set offline on unload
    const handleUnload = () => {
      firestoreSync.updatePresence(currentUser.username, "1970-01-01T00:00:00.000Z");
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [currentUser]);

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
    }, 120000);

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Left Column Sidebar */}
      <Sidebar
        userRole={currentUser.role}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        pendingMedsCount={pendingMedsCount}
        unreadLogsCount={unreadLogsCount}
        unpaidFeesCount={unpaidFeesCount}
        unreadBachecaCount={bacheca.filter(b => !b.visti.includes(currentUser ? (currentUser.role === 'admin' ? `Admin ${currentUser.username}` : currentUser.username) : "")).length}
        activeOperator={activeOperator}
        onlineUsers={onlineUsers}
        onResetData={() => {
          if (confirm("Sei sicuro di voler ripristinare i dati di esempio iniziali per RESIDENZA VANNUCCI?")) {
            storage.resetToDefaults();
          }
        }}
        onLogout={() => {
          sessionStorage.removeItem("current_user");
          window.location.reload();
        }}
        isSuperAdmin={currentUser.username.toLowerCase() === 'antonio'}
        onResetAllPasswords={() => {
          if (confirm("Attenzione: Vuoi reimpostare le password di tutti gli utenti al valore predefinito '1234'? Al prossimo accesso, a ciascuno verrà chiesto di crearne una nuova.")) {
            const updatedCreds = credentials.map(c => {
              // Non resettare la password del Super Admin Antonio stesso per comodità
              if (c.username.toLowerCase() === 'antonio') return c;
              return {
                ...c,
                passwordHash: "1234",
                mustChange: true
              };
            });
            handleUpdateCredentials(updatedCreds);
            alert("Le password (eccetto quella del Direttore) sono state reimpostate a '1234'.");
          }
        }}
      />

      {/* Main Container View Area (Maximized height for Calendar & Views) */}
      <div className="flex-1 min-w-0 min-h-screen flex flex-col">
        <main className="flex-1 w-full max-w-[1650px] mx-auto p-3 sm:p-5 lg:p-6">
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
              currentUser={currentUser}
              staff={staff}
              shifts={shifts}
              bacheca={bacheca}
              onAddBacheca={(n) => handleUpdateBacheca(prev => [n, ...prev])}
              onUpdateBacheca={(n) => handleUpdateBacheca(prev => prev.map(item => item.id === n.id ? n : item))}
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

          {activeTab === "bacheca" && (
            <BachecaView
              bacheca={bacheca}
              currentUser={currentUser}
              onAddBacheca={(n) => handleUpdateBacheca(prev => [n, ...prev])}
              onUpdateBacheca={(n) => handleUpdateBacheca(prev => prev.map(item => item.id === n.id ? n : item))}
            />
          )}

          {activeTab === "chat" && (
            <ChatWhatsAppView
              chatMessages={chatMessages}
              currentUser={currentUser}
              activeOperator={activeOperator}
              onSendMessage={(msg) => handleUpdateChat(prev => [...prev, msg])}
              staff={staff}
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
        <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-0.5">
            <p className="font-semibold text-slate-300">
              GESTIONALE — Casa Famiglia & Residenza Assistita per Anziani
            </p>
            <p className="text-slate-500 text-[11px]">
              @2026 AETERNA - GIMONDO DOMENICO
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
