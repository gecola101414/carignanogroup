import React, { useState } from "react";
import { MessageCircle, Send, User, Lock, ShieldAlert, CheckCircle2 } from "lucide-react";
import { ChatWhatsAppMessage, UserCredential, StaffMember } from "../types";

interface ChatWhatsAppViewProps {
  chatMessages: ChatWhatsAppMessage[];
  currentUser?: UserCredential | null;
  activeOperator: string;
  onSendMessage: (message: ChatWhatsAppMessage) => void;
  staff?: StaffMember[];
}

export const ChatWhatsAppView: React.FC<ChatWhatsAppViewProps> = ({
  chatMessages,
  currentUser,
  activeOperator,
  onSendMessage,
  staff = []
}) => {
  const [inputText, setInputText] = useState("");

  const currentUsername = currentUser ? (currentUser.role === 'admin' ? `Admin ${currentUser.username}` : currentUser.username) : activeOperator;
  const userRole = currentUser?.role || 'staff';

  // Check access authorization
  const isAdmin = currentUser?.role === "admin" || currentUsername.toLowerCase().includes("admin") || currentUsername.toUpperCase() === "VANNUCCI";
  
  // A staff member is authorized if their username corresponds to a registered active staff member's name or surname
  const isAuthorizedStaff = currentUser?.role === "staff" && staff.some(
    s => s.nome.toLowerCase() === currentUser.username.toLowerCase() || 
         s.cognome.toLowerCase() === currentUser.username.toLowerCase() ||
         `${s.nome} ${s.cognome}`.toLowerCase() === currentUser.username.toLowerCase()
  );

  const isAllowed = isAdmin || isAuthorizedStaff;

  // Compile list of authorized staff names for display
  const authorizedStaffNames = staff.filter(s => s.attivo).map(s => `${s.nome} ${s.cognome}`);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllowed) return;
    if (!inputText.trim()) return;

    const newMessage: ChatWhatsAppMessage = {
      id: `msg-${Date.now()}`,
      dataOra: `${new Date().toLocaleDateString("it-IT")} ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
      autore: currentUsername,
      messaggio: inputText.trim(),
      ruoloAutore: userRole
    };

    onSendMessage(newMessage);
    setInputText("");
  };

  if (!isAllowed) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <Lock className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Accesso alla Chat Riservato</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto leading-relaxed">
            Spiacenti <span className="font-bold text-slate-700">{currentUser?.username || "Utente"}</span>, l'accesso a questo canale di messaggistica interna è consentito esclusivamente alla direzione amministrativa e ai collaboratori attivi registrati nell'elenco ufficiale del personale.
          </p>

          <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left max-w-md mx-auto">
            <h3 className="text-xs font-black text-slate-700 tracking-wider uppercase mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Elenco Operatori Autorizzati ad accedere:
            </h3>
            <ul className="space-y-2">
              <li className="text-xs text-slate-600 font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Direzione Amministrativa (Amministratore VANNUCCI)</span>
              </li>
              {authorizedStaffNames.map((name, idx) => (
                <li key={idx} className="text-xs text-slate-600 font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{name}</span>
                </li>
              ))}
              {authorizedStaffNames.length === 0 && (
                <li className="text-xs text-slate-400 italic">Nessun operatore configurato nel registro dipendenti. Contatta l'amministratore.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-140px)]">
      {/* Left Chat Screen Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white shadow">
              <MessageCircle className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">Chat Libera Struttura</h2>
              <p className="text-[11px] text-emerald-200">Canale aperto per scambi rapidi tra il personale autorizzato</p>
            </div>
          </div>
          <div className="bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-700 text-xs font-bold text-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Chat Attiva Live</span>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 bg-slate-100 p-4 overflow-y-auto space-y-3">
          {chatMessages.map(msg => {
            const isMe = msg.autore === currentUsername || msg.autore.includes(currentUsername);
            const isAdminMsg = msg.ruoloAutore === "admin" || msg.autore.includes("Admin") || msg.autore.includes("VANNUCCI");

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1 mb-0.5 px-1 text-[11px] text-slate-500 font-semibold">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{msg.autore}</span>
                  {isAdminMsg && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.2 rounded font-bold ml-1">Direzione</span>}
                  <span className="text-[10px] text-slate-400 ml-1">{msg.dataOra}</span>
                </div>

                <div className={`max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs ${
                  isMe 
                    ? "bg-emerald-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.messaggio}</p>
                </div>
              </div>
            );
          })}

          {chatMessages.length === 0 && (
            <div className="text-center py-20 text-slate-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Nessun messaggio nella chat. Scrivi il primo messaggio!</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white border-t border-slate-200 p-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Scrivi un messaggio libero per i colleghi..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow transition-all cursor-pointer shrink-0"
            >
              <span>Invia</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Authorized Staff Panel */}
      <div className="w-full md:w-64 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-xs">
        <h3 className="text-xs font-black text-slate-800 tracking-wider uppercase mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Membri della Chat ({1 + authorizedStaffNames.length})
        </h3>
        <p className="text-[10px] text-slate-400 mb-4 leading-normal">
          Canale ristretto solo all'amministratore e ai dipendenti attivi del registro.
        </p>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {/* Admin Row */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-indigo-900 truncate">VANNUCCI</p>
              <p className="text-[10px] text-indigo-600 font-semibold leading-none mt-0.5">Direzione / Admin</p>
            </div>
          </div>

          {/* Staff Rows */}
          {staff.filter(s => s.attivo).map((s, idx) => (
            <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
              <div className="w-7 h-7 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                {s.nome.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{s.nome} {s.cognome}</p>
                <p className="text-[9px] text-slate-400 truncate">{s.ruolo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
