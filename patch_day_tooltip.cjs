const fs = require('fs');
const content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const search = "title={`Giorno ${day.getDate()} ${getFullMonthName(day)} (${dayShiftsCount} turni). Trascina per spostare o duplicare l'intero giorno.`}";
const replacement = "title={`Giorno ${day.getDate()} ${getFullMonthName(day)} (${dayShiftsCount} turni).\\n\\n${isDayComplete(dateYMD) ? \"✅ Giornata completa\" : \"❌ Mancanti:\\n- \" + getMissingShiftsForDay(dateYMD).join(\"\\n- \")}\\n\\nTrascina per spostare o duplicare l'intero giorno.`}";

if (content.includes(search)) {
  fs.writeFileSync('src/components/StaffShiftsView.tsx', content.replace(search, replacement));
  console.log('Tooltip updated successfully');
} else {
  console.log('Tooltip search text not found');
}
