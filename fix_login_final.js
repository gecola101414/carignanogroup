import fs from 'fs';
let content = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');

// Replace forms with divs
content = content.replace(
  /<form onSubmit=\{handleLogin\} className="space-y-5">/g,
  '<div className="space-y-5" onKeyDown={e => { if (e.key === \'Enter\') handleLogin(e as any); }}>'
);
content = content.replace(
  /<button\n\s+type="submit"\n\s+className="w-full py-3\.5 mt-2 bg-slate-900/g,
  '<button\n                type="button"\n                onClick={handleLogin}\n                className="w-full py-3.5 mt-2 bg-slate-900'
);

content = content.replace(
  /<form onSubmit=\{handleChangePassword\} className="space-y-5">/g,
  '<div className="space-y-5" onKeyDown={e => { if (e.key === \'Enter\') handleChangePassword(e as any); }}>'
);
content = content.replace(
  /<button\n\s+type="submit"\n\s+className="w-full py-3\.5 mt-2 bg-emerald-600/g,
  '<button\n                type="button"\n                onClick={handleChangePassword}\n                className="w-full py-3.5 mt-2 bg-emerald-600'
);

// Fix the missing setTimeout in handleLogin for mustChange
content = content.replace(
  /if \(user\.mustChange\) \{\n\s+setNeedsPasswordChange\(user\);\n\s+setError\(""\);\n\s+\} else \{/g,
  `if (user.mustChange) {
      setTimeout(() => {
        setNeedsPasswordChange(user);
        setError("");
      }, 300);
    } else {`
);

// Ensure closing tags for forms are updated
content = content.replace(/<\/form>/g, '</div>');

fs.writeFileSync('src/components/LoginScreen.tsx', content);
console.log('Final fix applied');
