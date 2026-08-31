const fs = require('fs');
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const cucinaPreset = `  {
    id: "preset-cucina-10-14",
    label: "🍲 10:00-14:00 (Cucina)",
    tipoTurno: "Cucina",
    orarioInizio: "10:00",
    orarioFine: "14:00",
    isDefault: true
  },
  {
    id: "preset-cucina-17-20",
    label: "🍲 17:00-20:00 (Cucina)",
    tipoTurno: "Cucina",
    orarioInizio: "17:00",
    orarioFine: "20:00",
    isDefault: true
  },
`;

if (!content.includes("preset-cucina-10-14")) {
  content = content.replace('  // VANNUCCI 4', cucinaPreset + '  // VANNUCCI 4');
  fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
  console.log("Added cucina presets");
} else {
  console.log("Cucina presets already present");
}
