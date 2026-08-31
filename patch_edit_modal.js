const fs = require('fs');
const content = fs.readFileSync('src/components/StaffShiftsView.tsx', 'utf8');

const startIdx = content.indexOf('return (', content.indexOf('const mem = staff.find(s => s.id === selectedShiftForDetail.staffId);'));
// We want the return for non-staff. Let's find exactly line 5215.

