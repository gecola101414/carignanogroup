import fs from 'fs';
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

content = content.replace(
  /Settimana dal \{weekDays\[1\]\.getDate\(\)\} \{getFullMonthName\(weekDays\[1\]\)\} al \{weekDays\[7\]\.getDate\(\)\} \{getFullMonthName\(weekDays\[7\]\)\} \{weekDays\[7\]\.getFullYear\(\)\}\n\s+<\/span>\n\s+<button\n\s+onClick=\{\(\) => setIsFullScreen\(false\)\}/,
  `Settimana dal {weekDays[1].getDate()} {getFullMonthName(weekDays[1])} al {weekDays[7].getDate()} {getFullMonthName(weekDays[7])} {weekDays[7].getFullYear()}
                </span>
                <button
                  onClick={handleExportWeeklyPDF}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Esporta in PDF</span>
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}`
);

content = content.replace(
  /Mese di \{getFullMonthName\(currentDate\)\.toUpperCase\(\)\} \{currentDate\.getFullYear\(\)\}\n\s+<\/span>\n\s+<button\n\s+onClick=\{\(\) => setIsFullScreen\(false\)\}/,
  `Mese di {getFullMonthName(currentDate).toUpperCase()} {currentDate.getFullYear()}
                </span>
                <button
                  onClick={handleExportMonthlyPDF}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Esporta in PDF</span>
                </button>
                <button
                  onClick={() => setIsFullScreen(false)}`
);

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log("Added PDF buttons");
