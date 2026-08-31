const fs = require('fs');
const content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const oldFilterAdd = `                    .filter((preset) => {
                      if (!preset.struttura) {
                        return newStruttura.includes("1");
                      }
                      const currentS = newStruttura.toLowerCase();
                      const presetS = preset.struttura.toLowerCase();
                      if (currentS.includes("1") && presetS.includes("1")) return true;
                      if (currentS.includes("2") && presetS.includes("2")) return true;
                      if (currentS.includes("4") && presetS.includes("4")) return true;
                      return false;
                    })`;

const newFilterAdd = `                    .filter((preset) => {
                      if (!preset.struttura || preset.tipoTurno === "Cucina" || preset.tipoTurno === "Notte") {
                        return true;
                      }
                      const currentS = newStruttura.toLowerCase();
                      const presetS = preset.struttura.toLowerCase();
                      if (currentS.includes("1") && presetS.includes("1")) return true;
                      if (currentS.includes("2") && presetS.includes("2")) return true;
                      if (currentS.includes("4") && presetS.includes("4")) return true;
                      return false;
                    })`;


const oldFilterEdit = `                            .filter((preset) => {
                              if (!preset.struttura) {
                                return editShiftStruttura.includes("1");
                              }
                              const currentS = editShiftStruttura.toLowerCase();
                              const presetS = preset.struttura.toLowerCase();
                              if (currentS.includes("1") && presetS.includes("1")) return true;
                              if (currentS.includes("2") && presetS.includes("2")) return true;
                              if (currentS.includes("4") && presetS.includes("4")) return true;
                              return false;
                            })`;

const newFilterEdit = `                            .filter((preset) => {
                              if (!preset.struttura || preset.tipoTurno === "Cucina" || preset.tipoTurno === "Notte") {
                                return true;
                              }
                              const currentS = editShiftStruttura.toLowerCase();
                              const presetS = preset.struttura.toLowerCase();
                              if (currentS.includes("1") && presetS.includes("1")) return true;
                              if (currentS.includes("2") && presetS.includes("2")) return true;
                              if (currentS.includes("4") && presetS.includes("4")) return true;
                              return false;
                            })`;

let newContent = content.replace(oldFilterAdd, newFilterAdd);
newContent = newContent.replace(oldFilterEdit, newFilterEdit);

fs.writeFileSync('src/components/StaffShiftsView.tsx', newContent);
console.log('Patched preset filters');
