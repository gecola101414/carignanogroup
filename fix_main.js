import fs from 'fs';
const file = 'src/main.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ErrorBoundary')) {
  content = content.replace(
    'import App from \'./App.tsx\';',
    'import App from \'./App.tsx\';\nimport { ErrorBoundary } from \'./ErrorBoundary.tsx\';'
  );
  content = content.replace(
    '<App />',
    '<ErrorBoundary>\n      <App />\n    </ErrorBoundary>'
  );
  fs.writeFileSync(file, content);
  console.log('Fixed main.tsx');
}
