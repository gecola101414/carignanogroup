const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

// 1. Swap emoji
content = content.replaceAll('🏖️ Riposo', '🛋️ Riposo');
content = content.replaceAll('🌴 Ferie', '🏖️ Ferie');

// 2. Change getShiftBadgeStyle for Ferie to Brown
const oldFerieStyle = 'if (tipo === "Ferie") {\n      return "bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-300 font-black shadow-xs ring-2 ring-amber-500/50";\n    }';
const newFerieStyle = 'if (tipo === "Ferie") {\n      return "bg-amber-800 text-amber-50 border-amber-900 hover:bg-amber-900 font-black shadow-xs ring-2 ring-amber-800/50";\n    }';
content = content.replace(oldFerieStyle, newFerieStyle);

// 3. Change "animate-pulse ring-1 ring-amber-500 border-amber-500 border-2" inside badge styling
content = content.replaceAll(
  's.tipoTurno === "Ferie" ? "animate-pulse ring-1 ring-amber-500 border-amber-500 border-2" : ""',
  's.tipoTurno === "Ferie" ? "animate-pulse ring-1 ring-amber-800 border-amber-800 border-2" : ""'
);

// 4. Change Add Shift modal Ferie button styling
content = content.replaceAll(
  'newTipoTurno === "Ferie" ? "bg-amber-400 border-amber-500 text-amber-950 ring-4 ring-amber-500/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"',
  'newTipoTurno === "Ferie" ? "bg-amber-800 border-amber-900 text-white ring-4 ring-amber-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"'
);

// 5. Change Edit Shift modal Ferie button styling
content = content.replaceAll(
  'selectedShiftForDetail?.tipoTurno === "Ferie" ? "bg-amber-400 border-amber-500 text-amber-950 ring-4 ring-amber-500/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"',
  'selectedShiftForDetail?.tipoTurno === "Ferie" ? "bg-amber-800 border-amber-900 text-white ring-4 ring-amber-800/40" : "bg-slate-50 border-slate-200 hover:bg-slate-100"'
);

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log('Ferie patched!');
