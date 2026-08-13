import fs from 'fs';

// 1. Fix mockData.ts
const mockFile = 'src/mockData.ts';
let mockContent = fs.readFileSync(mockFile, 'utf8');
mockContent = mockContent.replace(/passwordHash: "(Beppe2024!|Deborah2024!|Claudia2024!)"/g, 'passwordHash: "1234"');
fs.writeFileSync(mockFile, mockContent);

// 2. Fix storage.ts
const storageFile = 'src/utils/storage.ts';
let storageContent = fs.readFileSync(storageFile, 'utf8');
storageContent = storageContent.replace(/passwordHash: "(Beppe2024!|Deborah2024!|Claudia2024!)"/g, 'passwordHash: "1234"');

// 3. Force reset by updating the credentials storage key
storageContent = storageContent.replace('CREDENTIALS: "casafamiglia_credentials_v1"', 'CREDENTIALS: "casafamiglia_credentials_v2"');

fs.writeFileSync(storageFile, storageContent);
console.log('Passwords and Storage Keys Reset!');
