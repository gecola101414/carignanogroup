import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  'if (remoteCreds && Array.isArray(remoteCreds)) {',
  `if (remoteCreds && Array.isArray(remoteCreds)) {
        const hasProgrammatore = remoteCreds.some(c => c.username === "programmatore");
        if (!hasProgrammatore) {
          remoteCreds.push({ username: "programmatore", role: "admin", passwordHash: "1234", mustChange: true });
          firestoreSync.saveCredentials(remoteCreds);
        }`
);
fs.writeFileSync('src/App.tsx', content);
