import fs from 'fs';

let content = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');

// handleLogin
content = content.replace(
  /if \(user\.mustChange\) {\n\s+setNeedsPasswordChange\(user\);\n\s+setError\(""\);\n\s+} else {\n\s+onLogin\(user\);\n\s+}/g,
  `if (user.mustChange) {
      // Ritardo per permettere al Password Manager di Chrome di completare il suo hook sul submit del form
      setTimeout(() => {
        setNeedsPasswordChange(user);
        setError("");
      }, 150);
    } else {
      setTimeout(() => {
        onLogin(user);
      }, 150);
    }`
);

// handleChangePassword
content = content.replace(
  /if \(needsPasswordChange\) {\n\s+onUpdatePassword\(needsPasswordChange\.username, newPassword\);\n\s+onLogin\(\{ \.\.\.needsPasswordChange, passwordHash: newPassword, mustChange: false \}\);\n\s+}/g,
  `if (needsPasswordChange) {
      setTimeout(() => {
        onUpdatePassword(needsPasswordChange.username, newPassword);
        onLogin({ ...needsPasswordChange, passwordHash: newPassword, mustChange: false });
      }, 150);
    }`
);

fs.writeFileSync('src/components/LoginScreen.tsx', content);
console.log('Fixed LoginScreen with setTimeout');
