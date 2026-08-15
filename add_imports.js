import fs from 'fs';
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

if (!content.includes('import jsPDF')) {
  content = content.replace(
    /import React, \{ useState, useRef \} from "react";/,
    `import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";`
  );
  fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
}
