import fs from 'fs';

// 1. Fix mockData.ts
const mockFile = 'src/mockData.ts';
let mockContent = fs.readFileSync(mockFile, 'utf8');
mockContent = mockContent.replace(
  '{ username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true },\n  ',
  ''
);
fs.writeFileSync(mockFile, mockContent);

// 2. Fix storage.ts
const storageFile = 'src/utils/storage.ts';
let storageContent = fs.readFileSync(storageFile, 'utf8');
storageContent = storageContent.replace(
  '{ username: "VANNUCCI", role: "admin", passwordHash: "Antonio@2010", mustChange: true },\n      ',
  ''
);
// Also filter out VANNUCCI from storedCreds so it doesn't linger from localStorage
storageContent = storageContent.replace(
  'const adminCreds = storedCreds.filter(c => c.role === \'admin\');',
  'let adminCreds = storedCreds.filter(c => c.role === \'admin\' && c.username !== "VANNUCCI");\n    storedCreds = storedCreds.filter(c => c.username !== "VANNUCCI");'
);
storageContent = storageContent.replace(
  'const storedCreds = getItem(STORAGE_KEYS.CREDENTIALS, INITIAL_CREDENTIALS);',
  'let storedCreds = getItem(STORAGE_KEYS.CREDENTIALS, INITIAL_CREDENTIALS);'
);
fs.writeFileSync(storageFile, storageContent);
console.log('Fixed VANNUCCI');
