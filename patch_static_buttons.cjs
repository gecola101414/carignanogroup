const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const oldAddButtons = `                  {/* Riposo */}
                  <button
                    type="button"
                    onDoubleClick={() => handleFastSubmit({ tipoTurno: "Riposo", orarioInizio: "00:00", orarioFine: "00:00" })}
                    onClick={() => {
                      setNewTipoTurno("Riposo");
                      setNewOrarioInizio("00:00");
                      setNewOrarioFine("00:00");
                    }}
                    className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                      newTipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }\`}
                  >
                    <span className="font-extrabold text-[12px]">🏖️ Riposo</span>
                    <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                  </button>`;

const newAddButtons = `                  {/* Servizi Comuni: Cucina */}
                  <button
                    type="button"
                    onDoubleClick={() => {
                      setNewNote("Servizio Cucina e Mensa");
                      handleFastSubmit({ tipoTurno: "Cucina", orarioInizio: "10:30", orarioFine: "15:00" });
                    }}
                    onClick={() => {
                      setNewTipoTurno("Cucina");
                      setNewOrarioInizio("10:30");
                      setNewOrarioFine("15:00");
                      if (!newNote) setNewNote("Servizio Cucina e Mensa");
                    }}
                    className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                      newTipoTurno === "Cucina" && newOrarioInizio === "10:30" && newOrarioFine === "15:00" ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30" : "bg-sky-50/80 border-sky-200 hover:bg-sky-100 text-sky-900"
                    }\`}
                  >
                    <span className="font-extrabold text-[12px]">🍲 Cucina</span>
                    <span className="text-[9px] opacity-75 font-normal">10:30 - 15:00</span>
                  </button>

                  {/* Servizi Comuni: Pulizie */}
                  <button
                    type="button"
                    onDoubleClick={() => {
                      setNewNote("Pulizie");
                      handleFastSubmit({ tipoTurno: "Mattina", orarioInizio: "07:00", orarioFine: "11:00" });
                    }}
                    onClick={() => {
                      setNewTipoTurno("Mattina");
                      setNewOrarioInizio("07:00");
                      setNewOrarioFine("11:00");
                      if (!newNote) setNewNote("Pulizie");
                    }}
                    className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                      newTipoTurno === "Mattina" && newOrarioInizio === "07:00" && newOrarioFine === "11:00" ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/30" : "bg-orange-50/80 border-orange-200 hover:bg-orange-100 text-orange-900"
                    }\`}
                  >
                    <span className="font-extrabold text-[12px]">🧹 Pulizie</span>
                    <span className="text-[9px] opacity-75 font-normal">07:00 - 11:00</span>
                  </button>

                  {/* Riposo */}
                  <button
                    type="button"
                    onDoubleClick={() => handleFastSubmit({ tipoTurno: "Riposo", orarioInizio: "00:00", orarioFine: "00:00" })}
                    onClick={() => {
                      setNewTipoTurno("Riposo");
                      setNewOrarioInizio("00:00");
                      setNewOrarioFine("00:00");
                    }}
                    className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                      newTipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }\`}
                  >
                    <span className="font-extrabold text-[12px]">🏖️ Riposo</span>
                    <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                  </button>`;

const oldEditButtons = `                          {/* Riposo */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Riposo" } : prev);
                              setEditShiftInizio("00:00");
                              setEditShiftFine("00:00");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🏖️ Riposo</span>
                            <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                          </button>`;

const newEditButtons = `                          {/* Servizi Comuni: Cucina */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Cucina" } : prev);
                              setEditShiftInizio("10:30");
                              setEditShiftFine("15:00");
                              if (!editShiftNote) setEditShiftNote("Servizio Cucina e Mensa");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Cucina" && editShiftInizio === "10:30" && editShiftFine === "15:00" ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30" : "bg-sky-50/80 border-sky-200 hover:bg-sky-100 text-sky-900"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🍲 Cucina</span>
                            <span className="text-[9px] opacity-75 font-normal">10:30 - 15:00</span>
                          </button>

                          {/* Servizi Comuni: Pulizie */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Mattina" } : prev);
                              setEditShiftInizio("07:00");
                              setEditShiftFine("11:00");
                              if (!editShiftNote) setEditShiftNote("Pulizie");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Mattina" && editShiftInizio === "07:00" && editShiftFine === "11:00" ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/30" : "bg-orange-50/80 border-orange-200 hover:bg-orange-100 text-orange-900"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🧹 Pulizie</span>
                            <span className="text-[9px] opacity-75 font-normal">07:00 - 11:00</span>
                          </button>

                          {/* Riposo */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Riposo" } : prev);
                              setEditShiftInizio("00:00");
                              setEditShiftFine("00:00");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Riposo" ? "bg-slate-200 border-slate-400 text-slate-700 ring-4 ring-slate-400/30" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🏖️ Riposo</span>
                            <span className="text-[9px] opacity-75 font-normal">Giorno libero</span>
                          </button>`;

if (content.includes(oldAddButtons)) {
  content = content.replace(oldAddButtons, newAddButtons);
  console.log("Replaced AddButtons");
}
if (content.includes(oldEditButtons)) {
  content = content.replace(oldEditButtons, newEditButtons);
  console.log("Replaced EditButtons");
}

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
