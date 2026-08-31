const fs = require('fs');
const lines = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8').split('\n');

const startLine = 5214; // 0-indexed is 5214 (line 5215)
const endLine = 5596; // 0-indexed is 5595 (line 5596)

const newCode = `              return (
                <div className="flex flex-col text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* LEFT COLUMN: Context Info */}
                    <div className="space-y-4">
                      {/* Informazione Operatore */}
                      <div className="bg-indigo-600/10 border-2 border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 block mb-1">Collaboratore Individuato</span>
                          <span className="text-xl font-extrabold text-indigo-950 block leading-none">
                            {mem ? \`\${mem.nome} \${mem.cognome}\` : "Operatore"}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 block mt-1 uppercase tracking-wide">
                            💼 {mem?.ruolo || "Staff"}
                          </span>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-base border-2 border-white shadow-md uppercase shrink-0 ml-2">
                          {mem ? \`\${mem.nome.charAt(0)}\${mem.cognome.charAt(0)}\` : "OP"}
                        </div>
                      </div>

                      {/* Data del Turno */}
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center shadow-3xs">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block mb-1">Data Turno</span>
                        <span className="text-base font-extrabold text-slate-800 block capitalize">
                          📅 {formatItalianVerbalDate(editShiftDate)}
                        </span>
                      </div>

                      {/* Scelta Struttura */}
                      <div className="space-y-1.5">
                        <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">Struttura di Assegnazione *</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(() => {
                            const sat1 = isStrutturaSatura("Vannucci 1", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat1 && setEditShiftStruttura("Vannucci 1")}
                                disabled={sat1}
                                title={sat1 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={\`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center \${
                                  sat1 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"
                                    ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"
                                    : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100")
                                }\`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">1</strong>
                              </button>
                            );
                          })()}
                          {(() => {
                            const sat2 = isStrutturaSatura("Vannucci 2", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat2 && setEditShiftStruttura("Vannucci 2")}
                                disabled={sat2}
                                title={sat2 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={\`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center \${
                                  sat2 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"
                                    ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"
                                    : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100")
                                }\`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">2</strong>
                              </button>
                            );
                          })()}
                          {(() => {
                            const sat3 = isStrutturaSatura("Vannucci 4", editShiftDate, selectedShiftForDetail?.id);
                            return (
                              <button
                                type="button"
                                onClick={() => !sat3 && setEditShiftStruttura("Vannucci 4")}
                                disabled={sat3}
                                title={sat3 ? "Struttura satura (Mattina e Pomeriggio già assegnati)" : ""}
                                className={\`p-3 rounded-xl border font-black transition-all text-center text-xs flex flex-col items-center justify-center \${
                                  sat3 ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400 grayscale" :
                                  "cursor-pointer " + (editShiftStruttura === "Vannucci 4" || editShiftStruttura === "Struttura 4"
                                    ? "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-600/20 scale-102"
                                    : "bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:bg-emerald-100")
                                }\`}
                              >
                                <span className="text-[11px]">Vannucci</span>
                                <strong className="text-base font-black leading-none">4</strong>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE COLUMN: Presets */}
                    <div className="space-y-4">
                      {/* Shift Presets */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px]">
                            Preset Orari & Turni ({savedPresets.length}) *
                          </label>
                        </div>

                        {/* Preset Buttons Grid */}
                        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                          {savedPresets
                            .filter((preset) => {
                              if (!preset.struttura) {
                                return editShiftStruttura.includes("1");
                              }
                              const currentS = editShiftStruttura.toLowerCase();
                              const presetS = preset.struttura.toLowerCase();
                              if (currentS.includes("1") && presetS.includes("1")) return true;
                              if (currentS.includes("2") && presetS.includes("2")) return true;
                              if (currentS.includes("4") && presetS.includes("4")) return true;
                              return false;
                            })
                            .map((preset) => {
                            const isSelected = selectedShiftForDetail?.tipoTurno === preset.tipoTurno && editShiftInizio === preset.orarioInizio && editShiftFine === preset.orarioFine;
                            const validity = checkPotentialShiftValidity(selectedShiftForDetail?.staffId || "", editShiftDate, preset.tipoTurno, editShiftStruttura, preset.orarioInizio, preset.orarioFine, selectedShiftForDetail?.id);

                            return (
                              <div key={preset.id} className="relative group/preset">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!validity.valid) return;
                                    setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: preset.tipoTurno } : prev);
                                    setEditShiftInizio(preset.orarioInizio);
                                    setEditShiftFine(preset.orarioFine);
                                    if (preset.tipoTurno === "Cucina" && !editShiftNote) {
                                      setEditShiftNote("Servizio Cucina e Mensa");
                                    }
                                  }}
                                  disabled={!validity.valid}
                                  title={validity.reason || \`\${preset.label} (\${preset.orarioInizio} - \${preset.orarioFine})\`}
                                  className={\`w-full p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center relative \${
                                    !validity.valid ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200" :
                                    "cursor-pointer " + (isSelected
                                      ? preset.tipoTurno === "Cucina"
                                        ? "bg-sky-500 border-sky-600 text-white ring-4 ring-sky-500/30"
                                        : preset.tipoTurno === "Notte"
                                        ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80"
                                        : editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"
                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"
                                        : editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"
                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"
                                        : "bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-600/20"
                                      : preset.tipoTurno === "Cucina"
                                      ? "bg-sky-50/80 border-sky-300 hover:bg-sky-100 text-sky-950"
                                      : preset.tipoTurno === "Notte"
                                      ? "bg-slate-900 border-slate-950 text-slate-100 hover:bg-slate-950"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100")
                                  }\`}
                                >
                                  <span className="font-extrabold text-[12px] truncate pr-1">{preset.label}</span>
                                  <span className="text-[9px] opacity-75 font-normal truncate">
                                    {preset.subtitle || \`\${preset.orarioInizio} - \${preset.orarioFine}\`}
                                  </span>
                                </button>
                              </div>
                            );
                          })}

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
                          </button>

                          {/* Ferie */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedShiftForDetail(prev => prev ? { ...prev, tipoTurno: "Ferie" } : prev);
                              setEditShiftInizio("00:00");
                              setEditShiftFine("00:00");
                            }}
                            className={\`p-2.5 rounded-xl border text-left font-bold transition-all text-xs flex flex-col justify-center cursor-pointer \${
                              selectedShiftForDetail?.tipoTurno === "Ferie" ? "bg-amber-400 border-amber-500 text-amber-950 ring-4 ring-amber-500/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                            }\`}
                          >
                            <span className="font-extrabold text-[12px]">🌴 Ferie</span>
                            <span className="text-[9px] opacity-75 font-normal">Pianificate / Desiderate</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Custom Time & Notes */}
                    <div className="space-y-4 flex flex-col">
                      {/* Custom Time Picker */}
                      <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-900 block">Modifica Orario Effettivo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Inizio (HH:MM)</label>
                              <input
                                type="time"
                                value={editShiftInizio}
                                onChange={(e) => setEditShiftInizio(e.target.value)}
                                className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-1">Fine (HH:MM)</label>
                              <input
                                type="time"
                                value={editShiftFine}
                                onChange={(e) => setEditShiftFine(e.target.value)}
                                className="w-full border border-indigo-200 p-2 rounded-xl text-xs font-mono font-bold bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                        </div>

                      {/* Notes */}
                      <div>
                        <label className="block font-black text-slate-700 tracking-wide uppercase text-[10px] mb-1">Note o Mansioni Specifiche:</label>
                        <input
                          type="text"
                          value={editShiftNote}
                          onChange={e => setEditShiftNote(e.target.value)}
                          className="w-full border p-2.5 rounded-xl bg-slate-50 font-medium focus:bg-white"
                          placeholder="es. Sostituzione, mansioni speciali..."
                        />
                      </div>
                    
                      <div className="pt-3 flex justify-between items-center border-t mt-2 shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingleShift(selectedShiftForDetail.id, e)}
                          className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-600" />
                          <span className="hidden sm:inline">Elimina Turno</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedShiftForDetail(null)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveShiftEdit}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
                          >
                            Salva Modifiche
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );`;

lines.splice(startLine, endLine - startLine + 1, newCode);
fs.writeFileSync('src/components/StaffShiftsView.tsx', lines.join('\n'));
