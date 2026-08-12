import React, { useState } from "react";
import { Bed, Users, ShieldAlert, Plus, CheckCircle, RefreshCw } from "lucide-react";
import { Room, Resident } from "../types";

interface RoomsViewProps {
  rooms: Room[];
  residents: Resident[];
  onUpdateRooms: (updated: Room[]) => void;
  onSelectResident: (res: Resident) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  residents,
  onUpdateRooms,
  onSelectResident
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(0); // 0 = tutti, 1 = primo piano, 2 = secondo piano

  const filteredRooms = rooms.filter(r => selectedFloor === 0 || r.piano === selectedFloor);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Bed className="w-6 h-6 text-indigo-600" />
            <span>Mappa Camere & Gestione Letti</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Disposizione degli ospiti per piano, stato occupazione e manutenzione</p>
        </div>

        {/* Floor Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedFloor(0)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedFloor === 0 ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tutti i Piani ({rooms.length} Camere)
          </button>
          <button
            onClick={() => setSelectedFloor(1)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedFloor === 1 ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Piano 1
          </button>
          <button
            onClick={() => setSelectedFloor(2)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedFloor === 2 ? "bg-white text-indigo-700 shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Piano 2
          </button>
        </div>
      </div>

      {/* Rooms Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => {
          const roomResidents = residents.filter(r => r.stanzaId === room.id);
          const freeBeds = room.postiLettoTotali - roomResidents.length;

          return (
            <div
              key={room.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 transition-all ${
                room.stato === "Occupata"
                  ? "border-slate-200 hover:border-indigo-300"
                  : room.stato === "Parzialmente Libera"
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-rose-200 bg-rose-50/20"
              }`}
            >
              {/* Room Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-sm">
                    {room.numero}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Camera {room.numero}</h3>
                    <p className="text-xs text-slate-500">Piano {room.piano} • Tipo: {room.tipo}</p>
                  </div>
                </div>

                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  room.stato === "Occupata"
                    ? "bg-emerald-100 text-emerald-800"
                    : room.stato === "Parzialmente Libera"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}>
                  {room.stato}
                </span>
              </div>

              {/* Dotazioni */}
              <div className="flex flex-wrap gap-1">
                {room.dotazioni.map((dot, idx) => (
                  <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {dot}
                  </span>
                ))}
              </div>

              {/* Occupanti list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Letti ({roomResidents.length} / {room.postiLettoTotali} occupati):
                </span>

                {roomResidents.map((r, i) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectResident(r)}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={r.fotoUrl} alt={r.nome} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-xs text-slate-900">{r.nome} {r.cognome}</div>
                        <div className="text-[10px] text-slate-500">{r.letto} • Autonomia: {r.livelloAutonomia}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">Vedi Scheda →</span>
                  </div>
                ))}

                {freeBeds > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 border-dashed text-amber-800 text-xs font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>{freeBeds} Letto libero disponibile per accoglimento</span>
                  </div>
                )}
              </div>

              {room.note && (
                <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-100">
                  Note: {room.note}
                </p>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
