const fs = require('fs');
const content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const oldLogicStr = `  // Helper to check if a day is complete: Mattina + Pomeriggio for each structure (1, 2, 3) + at least 1 Notte
  const isDayComplete = (dateStr: string): boolean => {
    const dayShifts = shifts.filter(s => s.data === dateStr);
    
    const hasMattina1 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasPomeriggio1 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    
    const hasMattina2 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    const hasPomeriggio2 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    
    const hasMattina3 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    const hasPomeriggio3 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    
    const hasNotte = dayShifts.some(s => s.tipoTurno === "Notte");
    
    return hasMattina1 && hasPomeriggio1 && hasMattina2 && hasPomeriggio2 && hasMattina3 && hasPomeriggio3 && hasNotte;
  };`;

const newLogicStr = `  // Helper to check if a day is complete: Mattina + Pomeriggio for each structure + at least 1 Notte
  const getMissingShiftsForDay = (dateStr: string): string[] => {
    const dayShifts = shifts.filter(s => s.data === dateStr);
    const missing: string[] = [];

    const hasMattina1 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasPomeriggio1 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 1" || s.struttura === "Struttura 1"));
    const hasNotte1 = dayShifts.some(s => s.tipoTurno === "Notte");
    
    if (!hasMattina1) missing.push("Vannucci 1: Mattina");
    if (!hasPomeriggio1) missing.push("Vannucci 1: Pomeriggio");
    if (!hasNotte1) missing.push("Vannucci 1: Notte");

    const hasMattina2 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    const hasPomeriggio2 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 2" || s.struttura === "Struttura 2"));
    
    if (!hasMattina2) missing.push("Vannucci 2: Mattina");
    if (!hasPomeriggio2) missing.push("Vannucci 2: Pomeriggio");

    const hasMattina3 = dayShifts.some(s => s.tipoTurno === "Mattina" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    const hasPomeriggio3 = dayShifts.some(s => s.tipoTurno === "Pomeriggio" && (s.struttura === "Vannucci 4" || s.struttura === "Struttura 4"));
    
    if (!hasMattina3) missing.push("Vannucci 4: Mattina");
    if (!hasPomeriggio3) missing.push("Vannucci 4: Pomeriggio");

    const hasCucina = dayShifts.some(s => s.tipoTurno === "Cucina");
    if (!hasCucina) missing.push("Cucina (Generale)");

    return missing;
  };

  const isDayComplete = (dateStr: string): boolean => {
    return getMissingShiftsForDay(dateStr).length === 0;
  };`;

if (content.includes(oldLogicStr)) {
  fs.writeFileSync('src/components/StaffShiftsView.tsx', content.replace(oldLogicStr, newLogicStr));
  console.log('Successfully patched logic');
} else {
  console.log('Logic string not found!');
}
