import fs from 'fs';
const file = 'src/utils/storage.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'const adminCreds = storedCreds.filter(c => c.role === \'admin\');\n    if (adminCreds.length === 0) {\n      adminCreds.push({ username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true });\n    }',
  `const adminCreds = storedCreds.filter(c => c.role === 'admin');
    
    // Assicura che i 4 amministratori di base ci siano sempre
    const baseAdmins = [
      { username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true },
      { username: "BEPPE", role: "admin", passwordHash: "Beppe2024!", mustChange: true },
      { username: "DEBORAH", role: "admin", passwordHash: "Deborah2024!", mustChange: true },
      { username: "CLAUDIA", role: "admin", passwordHash: "Claudia2024!", mustChange: true }
    ];
    
    baseAdmins.forEach(ba => {
      if (!adminCreds.find(c => c.username.toLowerCase() === ba.username.toLowerCase())) {
        adminCreds.push(ba);
        storedCreds.push(ba); // Aggiungiamo anche nello stored originario cosí puó essere salvato poi
      }
    });`
);
fs.writeFileSync(file, content);
console.log('Fixed storage');
