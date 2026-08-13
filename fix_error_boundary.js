import fs from 'fs';
let content = fs.readFileSync('src/ErrorBoundary.tsx', 'utf8');
content = content.replace('this.props.children', '(this.props as any).children');
fs.writeFileSync('src/ErrorBoundary.tsx', content);
