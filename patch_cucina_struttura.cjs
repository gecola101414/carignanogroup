const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

// 1. PDF export line 2404
content = content.replace(
  '<div class="shift-staff">${s.struttura}</div>',
  '<div class="shift-staff">${!["Notte", "Riposo", "Ferie", "Cucina"].includes(s.tipoTurno) && s.struttura ? s.struttura : ""}</div>'
);

// 2. Main calendar card line 3624
content = content.replace(
  '{s.struttura && s.tipoTurno !== "Notte" && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie" && (',
  '{s.struttura && s.tipoTurno !== "Notte" && s.tipoTurno !== "Riposo" && s.tipoTurno !== "Ferie" && s.tipoTurno !== "Cucina" && ('
);

// 3. Shift list line 4324
content = content.replace(
  '{s.struttura ? `(${s.struttura})` : ""}',
  '{(s.struttura && !["Notte", "Riposo", "Ferie", "Cucina"].includes(s.tipoTurno)) ? ` (${s.struttura})` : ""}'
);

// 4. Detail modal line 5279
content = content.replace(
  '{selectedShiftForDetail.struttura && selectedShiftForDetail.tipoTurno !== "Notte" && selectedShiftForDetail.tipoTurno !== "Riposo" && selectedShiftForDetail.tipoTurno !== "Ferie" && (',
  '{selectedShiftForDetail.struttura && selectedShiftForDetail.tipoTurno !== "Notte" && selectedShiftForDetail.tipoTurno !== "Riposo" && selectedShiftForDetail.tipoTurno !== "Ferie" && selectedShiftForDetail.tipoTurno !== "Cucina" && ('
);

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log('Struttura hidden for Cucina');
