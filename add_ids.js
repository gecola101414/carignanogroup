import fs from 'fs';
let content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

content = content.replace(
  /<table className="w-full text-left border-collapse min-w-\[1150px\] sm:min-w-\[1300px\]">/,
  '<table id="weekly-schedule-table" className="w-full text-left border-collapse min-w-[1150px] sm:min-w-[1300px]">'
);

content = content.replace(
  /<table className="w-full table-fixed text-left border-collapse">/,
  '<table id="monthly-schedule-table" className="w-full table-fixed text-left border-collapse">'
);

fs.writeFileSync('src/components/StaffShiftsView.tsx', content);
console.log("Added table IDs");
