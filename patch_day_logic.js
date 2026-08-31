const fs = require('fs');
const content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const missingLogic = `
  const getMissingShiftsForDay = (dateStr: string): string[] => {
    const dayShifts = shifts.filter(s => s.data === dateStr);
    const missing = [];

    const hasMattina1 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasPomeriggio1 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasNotte1 = dayShifts.some(s => s.tipoTurno === "Notte" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    if (!hasMattina1) missing.push("Vannucci 1: Mattina");
    if (!hasPomeriggio1) missing.push("Vannucci 1: Pomeriggio");
    if (!hasNotte1) missing.push("Vannucci 1: Notte");

    const hasMattina2 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    const hasPomeriggio2 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    if (!hasMattina2) missing.push("Vannucci 2: Mattina");
    if (!hasPomeriggio2) missing.push("Vannucci 2: Pomeriggio");

    const hasMattina4 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    const hasPomeriggio4 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    if (!hasMattina4) missing.push("Vannucci 4: Mattina");
    if (!hasPomeriggio4) missing.push("Vannucci 4: Pomeriggio");

    const hasCucina = dayShifts.some(s => s.tipoTurno === "Cucina");
    if (!hasCucina) missing.push("Cucina (Generale)");

    return missing;
  };

  const isDayComplete = (dateStr: string): boolean => {
    return getMissingShiftsForDay(dateStr).length === 0;
  };
`;
// Let's first replace isDayComplete logic
