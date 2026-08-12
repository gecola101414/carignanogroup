import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from "recharts";
import { VitalSign } from "../types";
import { Activity, Heart, Droplets, Gauge, Weight } from "lucide-react";

interface VitalSignsChartProps {
  vitals: VitalSign[];
}

export const VitalSignsChart: React.FC<VitalSignsChartProps> = ({ vitals }) => {
  const [activeMetric, setActiveMetric] = useState<"pressure" | "glucose" | "heart" | "oxygen" | "weight">("pressure");

  // Sort vitals chronologically
  const sortedVitals = [...vitals].sort((a, b) => new Date(a.dataOra).getTime() - new Date(b.dataOra).getTime());

  const chartData = sortedVitals.map(v => ({
    data: v.dataOra.split(" ")[0].slice(5), // MM-DD
    dataOraFull: v.dataOra,
    Sistolica: v.pressioneSistolica,
    Diastolica: v.pressioneDiastolica,
    Glicemia: v.glicemia,
    FrequenzaCardiaca: v.frequenzaCardiaca,
    SaturazioneO2: v.saturazioneO2,
    Peso: v.peso
  }));

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Grafico Storico Parametri Vitali</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">Andamento delle rilevazioni nel tempo</p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveMetric("pressure")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeMetric === "pressure" ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Pressione (PA)</span>
          </button>

          <button
            onClick={() => setActiveMetric("glucose")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeMetric === "glucose" ? "bg-white text-rose-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Glicemia</span>
          </button>

          <button
            onClick={() => setActiveMetric("heart")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeMetric === "heart" ? "bg-white text-emerald-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Frequenza (FC)</span>
          </button>

          <button
            onClick={() => setActiveMetric("oxygen")}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
              activeMetric === "oxygen" ? "bg-white text-sky-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Sat O2%</span>
          </button>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Nessun parametro registrato per generare il grafico.
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === "pressure" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" stroke="#64748b" fontSize={11} />
                <YAxis domain={[50, 180]} stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", border: "none" }} 
                  labelStyle={{ fontWeight: "bold", color: "#38bdf8" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <ReferenceLine y={135} label={{ value: "Soglia Max Sys (135)", fill: "#f43f5e", fontSize: 10 }} stroke="#f43f5e" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Sistolica" name="Pressione Sistolica (mmHg)" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Diastolica" name="Pressione Diastolica (mmHg)" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            ) : activeMetric === "glucose" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" stroke="#64748b" fontSize={11} />
                <YAxis domain={[60, 220]} stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff", border: "none" }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <ReferenceLine y={130} label={{ value: "Max Digiuno (130)", fill: "#f59e0b", fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="Glicemia" name="Glicemia (mg/dL)" stroke="#e11d48" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            ) : activeMetric === "heart" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" stroke="#64748b" fontSize={11} />
                <YAxis domain={[50, 120]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="FrequenzaCardiaca" name="Frequenza Cardiaca (bpm)" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="data" stroke="#64748b" fontSize={11} />
                <YAxis domain={[85, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <ReferenceLine y={95} label={{ value: "Min O2 (95%)", fill: "#38bdf8", fontSize: 10 }} stroke="#38bdf8" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="SaturazioneO2" name="Saturazione O2 (%)" stroke="#0284c7" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
