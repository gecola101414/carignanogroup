import fs from 'fs';
const file = 'src/components/LoginScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Delay onLogin for handleLogin
content = content.replace(
  '      onLogin(user);\n    }',
  '      // Evita crash di Chrome ritardando l\'unmount\n      setTimeout(() => onLogin(user), 50);\n    }'
);

// Delay onLogin for handleChangePassword
content = content.replace(
  '      onLogin({ ...needsPasswordChange, passwordHash: newPassword, mustChange: false });\n    }',
  '      setTimeout(() => onLogin({ ...needsPasswordChange, passwordHash: newPassword, mustChange: false }), 50);\n    }'
);

// Add attributes to login form
content = content.replace(
  'onChange={e => setUsername(e.target.value)}',
  'name="username" autoComplete="username" onChange={e => setUsername(e.target.value)}'
);

content = content.replace(
  'onChange={e => setPassword(e.target.value)}',
  'name="password" autoComplete="current-password" onChange={e => setPassword(e.target.value)}'
);

// Add attributes to password change form
content = content.replace(
  'onChange={e => setNewPassword(e.target.value)}',
  'name="newPassword" autoComplete="new-password" onChange={e => setNewPassword(e.target.value)}'
);

content = content.replace(
  'onChange={e => setConfirmPassword(e.target.value)}',
  'name="confirmPassword" autoComplete="new-password" onChange={e => setConfirmPassword(e.target.value)}'
);

fs.writeFileSync(file, content);
console.log('Fixed LoginScreen');
