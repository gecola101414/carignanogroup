import React, { useState } from "react";
import { HeartHandshake, Plus, Calendar, Clock, User, Phone, CheckCircle2 } from "lucide-react";
import { FamilyVisit, Resident } from "../types";

interface VisitsViewProps {
  visits: FamilyVisit[];
  residents: Resident[];
  onAddVisit: (visit: FamilyVisit) => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  visits,
  residents,
  onAddVisit
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-teal-600" />
            <span>Agenda Visite Familiari & Registro Ingressi</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Prenotazione e controllo accessi dei parenti nella casa famiglia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visits.map(v => {
          const res = residents.find(r => r.id === v.ospiteId);

          return (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{v.nomeVisitatore} ({v.parentela})</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {v.stato}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-teal-50/50 p-3 rounded-xl border border-teal-200/60">
                <p><strong>Ospite visitato:</strong> {res ? `${res.nome} ${res.cognome}` : "Ospite"}</p>
                <p><strong>Data & Ora:</strong> {v.data} dalle {v.oraInizio} alle {v.oraFine}</p>
                <p><strong>Recapito:</strong> {v.telefono}</p>
                {v.note && <p className="italic text-slate-500">Note: {v.note}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
