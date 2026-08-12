import React, { useState } from "react";
import { 
  Users, 
  Bed, 
  Pill, 
  Activity, 
  BookOpenCheck, 
  HeartHandshake, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Utensils, 
  FileText,
  UserPlus,
  TrendingUp,
  Stethoscope
} from "lucide-react";

import { Resident, Room, Therapy, VitalSign, DailyLog, FamilyVisit, DayMealPlan } from "../types";

interface DashboardViewProps {
  residents: Resident[];
  rooms: Room[];
  therapies: Therapy[];
  vitals: VitalSign[];
  logs: DailyLog[];
  visits: FamilyVisit[];
  meals: DayMealPlan[];
  onNavigateTab: (tab: any) => void;
  onSelectResident: (res: Resident) => void;
  onOpenMedCart: () => void;
  onOpenVitalModal: () => void;
  onOpenLogModal: () => void;
  onOpenNewResidentModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  residents,
  rooms,
  therapies,
  vitals,
  logs,
  visits,
  meals,
  onNavigateTab,
  onSelectResident,
  onOpenMedCart,
  onOpenVitalModal,
  onOpenLogModal,
  onOpenNewResidentModal
}) => {
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<any>(null);

  const totalBeds = rooms.reduce((acc, r) => acc + r.postiLettoTotali, 0);
  const presentResidents = residents.filter(r => r.stato === "Presente");
  const occupancyRate = Math.round((presentResidents.length / (totalBeds || 1)) * 100);

  const todayStr = new Date().toISOString().split("T")[0];

  // Count due meds today
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

  const pendingMeds = totalMedsScheduled - totalMedsAdministered;

  // Filter vitals with warnings (e.g. Systolic > 140, Diastolic > 90, O2 < 95, Glucose > 140)
  const todayVitals = vitals.filter(v => v.dataOra.startsWith(todayStr));
  const warningVitals = todayVitals.filter(v => 
    (v.pressioneSistolica && v.pressioneSistolica > 140) ||
    (v.saturazioneO2 && v.saturazioneO2 < 95) ||
    (v.glicemia && v.glicemia > 140)
  );

  // Today visits
  const todayVisits = visits.filter(v => v.data === todayStr);

  // Current day meal
  const todayDayName = new Date().toLocaleDateString("it-IT", { weekday: "long" });
  const normalizedDay = todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1);
  const todayMeal = meals.find(m => m.giorno.toLowerCase() === normalizedDay.toLowerCase()) || meals[0];

  // Handler to generate AI shift summary
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    try {
      const res = await fetch("/api/ai/shift-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logs: logs.slice(0, 8),
          vitalSigns: vitals.slice(0, 8),
          shiftName: "Mattina / Cambio Turno",
          date: todayStr
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiSummaryData(data.summary);
      }
    } catch (e) {
      console.error("Errore generazione sintesi AI", e);
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RESIDENZA VANNUCCI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Panoramica Operativa della Struttura
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl">
              Monitoraggio in tempo reale degli ospiti, somministrazione farmaci, diari di bordo, turni del personale e parametri vitali.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={onOpenMedCart}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all transform hover:-translate-y-0.5"
            >
              <Pill className="w-4 h-4" />
              <span>Somministra Farmaci</span>
            </button>

            <button
              onClick={onOpenVitalModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Activity className="w-4 h-4 text-rose-400" />
              <span>Rileva Parametri</span>
            </button>

            <button
              onClick={onOpenLogModal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Nuova Consegna</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Ospiti Accolti */}
        <div 
          onClick={() => onNavigateTab("residents")}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ospiti In Struttura</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{presentResidents.length} / {totalBeds}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {occupancyRate}% Occupazione
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Stato: tutti presenti in sede</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* KPI 2: Somministrazioni Farmaci */}
        <div 
          onClick={() => onNavigateTab("medications")}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Farmaci Oggi</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalMedsAdministered} / {totalMedsScheduled}</span>
            {pendingMeds > 0 ? (
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {pendingMeds} Da Somministrare
              </span>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Completati
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Apri carrello orario farmaci</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* KPI 3: Diario e Consegne Turno */}
        <div 
          onClick={() => onNavigateTab("logs")}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Consegne Diario</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{logs.length}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Registri Attivi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Aggiornato con ultimo turno</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

        {/* KPI 4: Visite Parenti Oggi */}
        <div 
          onClick={() => onNavigateTab("visits")}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visite Familiari</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{todayVisits.length}</span>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Programmate Oggi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span>Visualizza agenda aperture</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
          </p>
        </div>

      </div>

      {/* Main Grid: Left Column (Ospiti & Camere) / Right Column (AI Sintesi, Avvisi Vitali, Menu) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Quick Resident Cards & Rooms Floor Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Ospiti In Evidenza */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Cartelle Socio-Sanitarie Ospiti</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Accedi direttamente alle schede individuali e ai PAI degli anziani accolti</p>
              </div>
              <button
                onClick={() => onNavigateTab("residents")}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline"
              >
                <span>Vedi Tutti ({residents.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {residents.slice(0, 4).map(res => {
                const resRoom = rooms.find(r => r.id === res.stanzaId);
                const resVitals = vitals.filter(v => v.ospiteId === res.id).slice(-1)[0];

                return (
                  <div
                    key={res.id}
                    onClick={() => onSelectResident(res)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-white flex items-start gap-3.5 group"
                  >
                    <img
                      src={res.fotoUrl}
                      alt={res.nome}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-100 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                          {res.nome} {res.cognome}
                        </h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 shrink-0">
                          Stanza {resRoom?.numero || res.stanzaId.replace("room-", "")}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {res.patologie || "Anziano parzialmente autonomo"}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {res.livelloAutonomia}
                        </span>
                        {resVitals ? (
                          <span className="text-slate-500 font-mono">
                            PA: {resVitals.pressioneSistolica}/{resVitals.pressioneDiastolica} | Glic: {resVitals.glicemia || "-"}
                          </span>
                        ) : (
                          <span className="text-slate-400">Nessun dato recente</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Visual Rooms Floor Map */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Bed className="w-5 h-5 text-indigo-600" />
                  <span>Stato Camere e Letti (Piano 1 & Piano 2)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Mappa occupazione in tempo reale della residenza</p>
              </div>
              <button
                onClick={() => onNavigateTab("rooms")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                <span>Gestione Camere</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {rooms.map(room => {
                const roomResidents = residents.filter(r => r.stanzaId === room.id);

                return (
                  <div
                    key={room.id}
                    onClick={() => onNavigateTab("rooms")}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      room.stato === "Occupata"
                        ? "bg-slate-50/80 border-slate-200 hover:border-indigo-300"
                        : room.stato === "Parzialmente Libera"
                        ? "bg-amber-50/50 border-amber-200 hover:border-amber-400"
                        : "bg-rose-50/50 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">
                        Camera {room.numero}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        room.stato === "Occupata"
                          ? "bg-emerald-100 text-emerald-800"
                          : room.stato === "Parzialmente Libera"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      }`}>
                        {room.stato}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Piano {room.piano} • {room.tipo} ({roomResidents.length}/{room.postiLettoTotali} letti)
                    </p>

                    <div className="mt-2.5 space-y-1">
                      {roomResidents.map(r => (
                        <div key={r.id} className="text-xs font-medium text-slate-700 flex items-center gap-1.5 bg-white p-1 rounded border border-slate-200/60">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                          <span className="truncate">{r.nome} {r.cognome}</span>
                        </div>
                      ))}
                      {roomResidents.length < room.postiLettoTotali && (
                        <div className="text-[11px] text-amber-700 italic flex items-center gap-1 bg-amber-100/60 p-1 rounded">
                          <span>+ 1 Letto libero</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): AI Handover, Vitals Alerts, Menu del Giorno */}
        <div className="space-y-6">
          
          {/* AI Shift Summary Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-purple-950 text-white rounded-2xl p-5 border border-indigo-800/80 shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">Sintesi Turno AI</h3>
                  <p className="text-[11px] text-indigo-200">Elaborazione intelligente consegne</p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiSummary}
                disabled={isGeneratingAiSummary}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
              >
                {isGeneratingAiSummary ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Elaborazione...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aggiorna AI</span>
                  </>
                )}
              </button>
            </div>

            {aiSummaryData ? (
              <div className="bg-indigo-950/80 rounded-xl p-4 border border-indigo-800 text-xs space-y-3">
                <div>
                  <span className="font-semibold text-indigo-300 block mb-0.5">Quadro Generale:</span>
                  <p className="text-slate-200 leading-relaxed">{aiSummaryData.quadroGenerale}</p>
                </div>

                {aiSummaryData.eventiCritici && aiSummaryData.eventiCritici.length > 0 && (
                  <div>
                    <span className="font-semibold text-amber-300 block mb-0.5">Eventi Critici:</span>
                    <ul className="list-disc pl-4 text-slate-200 space-y-0.5">
                      {aiSummaryData.eventiCritici.map((ev: string, idx: number) => (
                        <li key={idx}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSummaryData.raccomandazioniTurnoSuccessivo && (
                  <div>
                    <span className="font-semibold text-emerald-300 block mb-0.5">Raccomandazioni Prossimo Turno:</span>
                    <ul className="list-disc pl-4 text-slate-200 space-y-0.5">
                      {aiSummaryData.raccomandazioniTurnoSuccessivo.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-indigo-950/60 rounded-xl p-4 border border-indigo-800/60 text-xs text-indigo-200 space-y-2">
                <p>
                  Clicca su <strong>"Aggiorna AI"</strong> per generare un report sintetico ed esecutivo di tutte le annotazioni e i parametri delle ultime 24 ore per gli operatori in arrivo.
                </p>
              </div>
            )}
          </div>

          {/* Warning Vital Signs Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-600" />
                <span>Parametri Vitali in Evidenza</span>
              </h3>
              <button
                onClick={onOpenVitalModal}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
              >
                + Registra
              </button>
            </div>

            <div className="space-y-2">
              {todayVitals.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-2">
                  Nessun parametro rilevato per la giornata di oggi.
                </p>
              ) : (
                todayVitals.map(v => {
                  const res = residents.find(r => r.id === v.ospiteId);
                  const isHighBP = (v.pressioneSistolica && v.pressioneSistolica > 135);
                  
                  return (
                    <div key={v.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800">{res ? `${res.nome} ${res.cognome}` : "Ospite"}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          PA: {v.pressioneSistolica || "-"}/{v.pressioneDiastolica || "-"} mmHg • Fc: {v.frequenzaCardiaca || "-"} bpm • Glic: {v.glicemia || "-"} mg/dL
                        </div>
                      </div>
                      {isHighBP ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          PA Elevata
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Stabile
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Meal Plan Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <span>Menu del Giorno ({todayMeal.giorno})</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
              <div>
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">Pranzo:</span>
                <p className="text-slate-700 mt-0.5"><strong>Primo:</strong> {todayMeal.pranzo.primo}</p>
                <p className="text-slate-700"><strong>Secondo:</strong> {todayMeal.pranzo.secondo}</p>
                <p className="text-slate-700"><strong>Contorno & Dessert:</strong> {todayMeal.pranzo.contorno} • {todayMeal.pranzo.fruttaDolce}</p>
              </div>

              <div className="pt-2 border-t border-amber-200/60">
                <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block">Cena:</span>
                <p className="text-slate-700 mt-0.5"><strong>Primo:</strong> {todayMeal.cena.primo}</p>
                <p className="text-slate-700"><strong>Secondo:</strong> {todayMeal.cena.secondo}</p>
              </div>

              {todayMeal.dietaSpecialeNote && (
                <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-medium italic">
                  Note diete speciali: {todayMeal.dietaSpecialeNote}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
