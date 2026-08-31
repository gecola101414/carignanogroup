const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const searchAdd = `                  {/* Servizi Comuni: Cucina */}`;
const replaceAdd = `                  {/* Turno Notturno Generale */}
                  <button
                    type="button"
                    onDoubleClick={() => {
                      setNewNote("Turno di Notte");
                      handleFastSubmit({ tipoTurno: "Notte", orarioInizio: "23:00", orarioFine: "07:00" });
                    }}
                    onClick={() => {
                      setNewTipoTurno("Notte");
                      setNewOrarioInizio("23:00");
                      setNewOrarioFine("07:00");
                      if (!newNote) setNewNote("Turno di Notte");
                    }}
                    className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                      newTipoTurno === "Notte" && newOrarioInizio === "23:00" && newOrarioFine === "07:00" ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80" : "bg-slate-800 border-slate-900 hover:bg-slate-900 text-slate-100"
                    }\`}
                  >
                    <span className="font-extrabold text-[12px]">🌙 Notte</span>
                    <span className="text-[9px] opacity-75 font-normal">23:00 - 07:00</span>
                  </button>

                  {/* Servizi Comuni: Cucina */}`;

const searchEdit = `                          {/* Servizi Comuni: Cucina */}`;
const replaceEdit = `                          {/* Turno Notturno Generale */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Notte" } : prev);
                              setEditShiftInizio("23:00");
                              setEditShiftFine("07:00");
                              if (!editShiftNote) setEditShiftNote("Turno di Notte");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Notte" && editShiftInizio === "23:00" && editShiftFine === "07:00" ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80" : "bg-slate-800 border-slate-900 hover:bg-slate-900 text-slate-100"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🌙 Notte</span>
                            <span className="text-[9px] opacity-75 font-normal">23:00 - 07:00</span>
                          </button>

                          {/* Servizi Comuni: Cucina */}`;

if (content.includes(searchAdd)) {
  content = content.replace(searchAdd, replaceAdd);
}
if (content.includes(searchEdit)) {
  content = content.replace(searchEdit, replaceEdit);
}

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log('Added Notte preset');
