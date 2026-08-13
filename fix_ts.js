import fs from 'fs';
let content = fs.readFileSync('src/ErrorBoundary.tsx', 'utf8');
content = content.replace('this.props.children', '(this as any).props.children');
fs.writeFileSync('src/ErrorBoundary.tsx', content);
