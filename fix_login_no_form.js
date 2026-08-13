import fs from 'fs';
const file = 'src/components/LoginScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change first form
content = content.replace(
  '<form onSubmit={handleLogin} className="space-y-5">',
  '<div className="space-y-5" onKeyDown={e => { if (e.key === \'Enter\') handleLogin(e as any); }}>'
);
content = content.replace(
  '</form>',
  '</div>'
);
content = content.replace(
  '<button\n                type="submit"\n                className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"\n              >',
  '<button\n                type="button"\n                onClick={handleLogin}\n                className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"\n              >'
);

// Change second form
content = content.replace(
  '<form onSubmit={handleChangePassword} className="space-y-5">',
  '<div className="space-y-5" onKeyDown={e => { if (e.key === \'Enter\') handleChangePassword(e as any); }}>'
);
content = content.replace(
  '</form>',
  '</div>'
);
content = content.replace(
  '<button\n                type="submit"\n                className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"\n              >',
  '<button\n                type="button"\n                onClick={handleChangePassword}\n                className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"\n              >'
);

fs.writeFileSync(file, content);
console.log('Fixed LoginScreen to avoid Chrome form crash');
