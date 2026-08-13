import fs from 'fs';

const content = `import React, { useState } from 'react';
import { UserCredential } from '../types';
import { KeyRound, User, Lock, ArrowRight, ShieldCheck, Activity, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  credentials: UserCredential[];
  onLogin: (user: UserCredential) => void;
  onUpdatePassword: (username: string, newPassword: string) => void;
}

export function LoginScreen({ credentials, onLogin, onUpdatePassword }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const [needsPasswordChange, setNeedsPasswordChange] = useState<UserCredential | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Stato di caricamento per isolare i passaggi
  const [isLoading, setIsLoading] = useState(false);

  const handleSafeTransition = (action: () => void) => {
    // 1. Togliamo il focus dai campi di testo. Questo dice a Chrome: "Ehi, ho finito di scrivere!"
    // e fa scattare il salvataggio della password in modo sicuro.
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    // 2. Mostriamo la schermata di caricamento, nascondendo i campi incriminati
    setIsLoading(true);
    
    // 3. Aspettiamo mezzo secondo per far finire a Chrome i suoi "lavori in background"
    setTimeout(() => {
      setIsLoading(false);
      action();
    }, 500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = credentials.find(c => c.username.toLowerCase() === username.trim().toLowerCase());
    
    if (!user || user.passwordHash !== password) {
      setError("Credenziali non valide. Riprova.");
      return;
    }

    setError("");
    handleSafeTransition(() => {
      if (user.mustChange) {
        setNeedsPasswordChange(user);
      } else {
        onLogin(user);
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setError("La nuova password deve avere almeno 4 caratteri.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }
    
    setError("");
    handleSafeTransition(() => {
      onUpdatePassword(needsPasswordChange!.username, newPassword);
      onLogin({ ...needsPasswordChange!, passwordHash: newPassword, mustChange: false });
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">RESIDENZA VANNUCCI</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Portale Operativo & Coordinamento</p>
        </div>
        <div className="p-8">
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
              <p className="text-slate-600 font-medium animate-pulse">Accesso sicuro in corso...</p>
            </div>
          ) : (
            <>
              {!needsPasswordChange ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Nome Utente</span>
                    </label>
                    {/* ISOLAMENTO: Div vuoto intorno al campo per bloccare le intrusioni di Chrome */}
                    <div>
                      <select
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-medium"
                        required
                      >
                        <option value="" disabled>-- Seleziona --</option>
                        {credentials.map(c => (
                          <option key={c.username} value={c.username}>
                            {c.username} {c.role === 'admin' ? '(Amministratore)' : '(Collaboratore)'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Password</span>
                    </label>
                    {/* ISOLAMENTO: Div vuoto intorno al campo per bloccare le intrusioni di Chrome */}
                    <div>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Accedi al Sistema</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div className="mb-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 text-amber-600 rounded-full mb-3">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Aggiornamento Sicurezza</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Ciao {needsPasswordChange.username}, imposta una nuova password personale.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      <span>Nuova Password</span>
                    </label>
                    {/* ISOLAMENTO */}
                    <div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Nuova password..."
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Conferma Password</label>
                    {/* ISOLAMENTO */}
                    <div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        placeholder="Ripeti password..."
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Salva ed Entra</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/LoginScreen.tsx', content);
console.log('LoginScreen completely rewritten for Chrome isolation.');
