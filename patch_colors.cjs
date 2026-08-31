const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

// 1. Update getShiftBadgeStyle

const badgeRegex = /const getShiftBadgeStyle = [\s\S]*?\/\/ 5\. FALLBACK IN ASSENZA DI STRUTTURA SPECIFICATA/g;

const newBadgeStyle = `const getShiftBadgeStyle = (tipo: string, start?: string, end?: string, struttura?: string) => {
    // 1. TURNO DI NOTTE: Blu come richiesto (ex Nero)
    if (tipo === "Notte") {
      return "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 font-black shadow-xs ring-1 ring-blue-600/80";
    }

    // 1.5 TURNO DI CUCINA: Azzurro molto diverso
    if (tipo === "Cucina") {
      return "bg-sky-100 text-sky-950 border-sky-300 hover:bg-sky-200 font-extrabold shadow-2xs ring-1 ring-sky-400/50";
    }

    // 2. FERIE: Sempre Ambra/Giallo
    if (tipo === "Ferie") {
      return "bg-amber-400 text-amber-950 border-amber-500 hover:bg-amber-300 font-black shadow-xs ring-2 ring-amber-500/50";
    }

    // 3. RIPOSO: Sempre Grigio chiaro
    if (tipo === "Riposo") {
      return "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200";
    }

    // 4. STRUTTURE COLORI DIVERSI (per Mattina, Pomeriggio, Reperibilità, ecc.)
    const normStruttura = struttura || "";
    if (normStruttura === "Vannucci 1" || normStruttura === "Struttura 1") {
      // Giallo intenso
      return "bg-yellow-400 text-yellow-950 border-yellow-500 hover:bg-yellow-500 font-bold shadow-2xs ring-1 ring-yellow-500/50";
    } else if (normStruttura === "Vannucci 2" || normStruttura === "Struttura 2") {
      // Arancione vivo
      return "bg-orange-500 text-white border-orange-600 hover:bg-orange-600 font-bold shadow-2xs ring-1 ring-orange-500/60";
    } else if (normStruttura === "Vannucci 4" || normStruttura === "Struttura 4") {
      // Verde chiaro
      return "bg-lime-300 text-lime-950 border-lime-400 hover:bg-lime-400 font-bold shadow-2xs ring-1 ring-lime-400/50";
    }

    // 5. FALLBACK IN ASSENZA DI STRUTTURA SPECIFICATA`;

content = content.replace(badgeRegex, newBadgeStyle);

// 2. Update Structure Buttons classes (Add Shift & Edit Shift)

// Vannucci 1
content = content.replaceAll(
  'editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"\n                                    ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"\n                                    : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100"',
  'editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"\n                                    ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"\n                                    : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100"'
);

content = content.replaceAll(
  'newStruttura === "Vannucci 1"\n                            ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"\n                            : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100"',
  'newStruttura === "Vannucci 1"\n                            ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"\n                            : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100"'
);

// Vannucci 2
content = content.replaceAll(
  'editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"\n                                    ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"\n                                    : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100"',
  'editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"\n                                    ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"\n                                    : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100"'
);

content = content.replaceAll(
  'newStruttura === "Vannucci 2"\n                            ? "bg-yellow-400 text-yellow-950 border-yellow-500 ring-4 ring-yellow-400/25 scale-102"\n                            : "bg-yellow-50/50 text-yellow-950 border-yellow-200 hover:bg-yellow-100"',
  'newStruttura === "Vannucci 2"\n                            ? "bg-orange-500 text-white border-orange-600 ring-4 ring-orange-500/20 scale-102"\n                            : "bg-orange-50/50 text-orange-950 border-orange-200 hover:bg-orange-100"'
);

// Vannucci 4
content = content.replaceAll(
  'editShiftStruttura === "Vannucci 4" || editShiftStruttura === "Struttura 4"\n                                    ? "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-600/20 scale-102"\n                                    : "bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:bg-emerald-100"',
  'editShiftStruttura === "Vannucci 4" || editShiftStruttura === "Struttura 4"\n                                    ? "bg-lime-400 text-lime-950 border-lime-500 ring-4 ring-lime-400/25 scale-102"\n                                    : "bg-lime-50/50 text-lime-950 border-lime-200 hover:bg-lime-100"'
);

content = content.replaceAll(
  'newStruttura === "Vannucci 4"\n                            ? "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-600/20 scale-102"\n                            : "bg-emerald-50/50 text-emerald-950 border-emerald-200 hover:bg-emerald-100"',
  'newStruttura === "Vannucci 4"\n                            ? "bg-lime-400 text-lime-950 border-lime-500 ring-4 ring-lime-400/25 scale-102"\n                            : "bg-lime-50/50 text-lime-950 border-lime-200 hover:bg-lime-100"'
);


// 3. Update Preset list colors

// Preset Notte button
content = content.replaceAll(
  'newTipoTurno === "Notte" && newOrarioInizio === "23:00" && newOrarioFine === "07:00" ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80" : "bg-slate-800 border-slate-900 hover:bg-slate-900 text-slate-100"',
  'newTipoTurno === "Notte" && newOrarioInizio === "23:00" && newOrarioFine === "07:00" ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30" : "bg-blue-50/80 border-blue-200 hover:bg-blue-100 text-blue-900"'
);

content = content.replaceAll(
  'selectedShiftForDetail?.tipoTurno === "Notte" && editShiftInizio === "23:00" && editShiftFine === "07:00" ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80" : "bg-slate-800 border-slate-900 hover:bg-slate-900 text-slate-100"',
  'selectedShiftForDetail?.tipoTurno === "Notte" && editShiftInizio === "23:00" && editShiftFine === "07:00" ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30" : "bg-blue-50/80 border-blue-200 hover:bg-blue-100 text-blue-900"'
);

// Dynamic preset colors
content = content.replaceAll(
  'preset.tipoTurno === "Notte"\n                                        ? "bg-slate-900 border-slate-950 text-white ring-4 ring-slate-800/80"',
  'preset.tipoTurno === "Notte"\n                                        ? "bg-blue-600 border-blue-700 text-white ring-4 ring-blue-600/30"'
);

content = content.replaceAll(
  'preset.tipoTurno === "Notte"\n                                      ? "bg-slate-900 border-slate-950 text-slate-100 hover:bg-slate-950"',
  'preset.tipoTurno === "Notte"\n                                      ? "bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900"'
);

content = content.replaceAll(
  'newStruttura === "Vannucci 1" || newStruttura === "Struttura 1"\n                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"\n                                        : newStruttura === "Vannucci 2" || newStruttura === "Struttura 2"\n                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"\n                                        : "bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-600/20"',
  'newStruttura === "Vannucci 1" || newStruttura === "Struttura 1"\n                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"\n                                        : newStruttura === "Vannucci 2" || newStruttura === "Struttura 2"\n                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"\n                                        : "bg-lime-400 border-lime-500 text-lime-950 ring-4 ring-lime-400/25"'
);

content = content.replaceAll(
  'editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"\n                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"\n                                        : editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"\n                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"\n                                        : "bg-emerald-600 border-emerald-700 text-white ring-4 ring-emerald-600/20"',
  'editShiftStruttura === "Vannucci 1" || editShiftStruttura === "Struttura 1"\n                                        ? "bg-yellow-400 border-yellow-500 text-yellow-950 ring-4 ring-yellow-400/25"\n                                        : editShiftStruttura === "Vannucci 2" || editShiftStruttura === "Struttura 2"\n                                        ? "bg-orange-500 border-orange-600 text-white ring-4 ring-orange-500/20"\n                                        : "bg-lime-400 border-lime-500 text-lime-950 ring-4 ring-lime-400/25"'
);

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log('Colors patched');
