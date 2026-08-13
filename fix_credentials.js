import fs from 'fs';
const file = 'src/mockData.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'export const INITIAL_CREDENTIALS: any[] = [\n  { username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true },',
  'export const INITIAL_CREDENTIALS: any[] = [\n  { username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true },\n  { username: "BEPPE", role: "admin", passwordHash: "Beppe2024!", mustChange: true },\n  { username: "DEBORAH", role: "admin", passwordHash: "Deborah2024!", mustChange: true },\n  { username: "CLAUDIA", role: "admin", passwordHash: "Claudia2024!", mustChange: true },'
);
fs.writeFileSync(file, content);
console.log('Fixed');
