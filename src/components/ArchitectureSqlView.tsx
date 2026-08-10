import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  ShieldCheck, 
  Copy, 
  Download, 
  Check, 
  Terminal, 
  Server, 
  Lock, 
  FileCode, 
  Play,
  Cpu,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { SQL_DDL_SCHEMA, SHIFT_LOGIC_DOCUMENTATION, SYSTEM_ARCHITECTURE_DOC } from '../data/sqlSchema';

export const ArchitectureSqlView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'architecture' | 'shifts' | 'tester'>('sql');
  const [activeSampleQuery, setActiveSampleQuery] = useState('guests_area');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SQL_DDL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'schema_gestionale_rsa.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const sampleQueries = {
    guests_area: {
      title: 'Query 1: Conteggio Ospiti per Area ed Eventuali Degenti in Ospedale',
      sql: `SELECT area_assegnata, stato, COUNT(*) AS totale_ospiti
FROM ospiti
GROUP BY area_assegnata, stato
ORDER BY area_assegnata;`,
      result: [
        { area_assegnata: 'Piano 1', stato: 'Attivo', totale_ospiti: 11 },
        { area_assegnata: 'Piano 1', stato: 'In Ospedale', totale_ospiti: 1 },
        { area_assegnata: 'Piano 2', stato: 'Attivo', totale_ospiti: 15 },
        { area_assegnata: 'Ala Protetta', stato: 'Attivo', totale_ospiti: 8 }
      ]
    },
    drug_audit: {
      title: 'Query 2: Audit Somministrazione Terapie Farmacologiche per Controlli ASL',
      sql: `SELECT o.nome, o.cognome, o.area_assegnata, t.nome_farmaco, s.orario_previsto, s.stato, s.infermiere_nome
FROM somministrazione_farmaci s
JOIN schede_terapeutiche t ON s.terapia_id = t.id
JOIN ospiti o ON s.ospite_id = o.id
WHERE DATE(s.data_ora) = CURRENT_DATE
ORDER BY s.orario_previsto ASC;`,
      result: [
        { nome: 'Giuseppe', cognome: 'Rossi', area_assegnata: 'Piano 1', nome_farmaco: 'Amlodipina 5mg', orario_previsto: '08:00', stato: 'Somministrato', infermiere_nome: 'Giulia Neri' },
        { nome: 'Maria', cognome: 'Ferrari', area_assegnata: 'Piano 1', nome_farmaco: 'Metformina 850mg', orario_previsto: '08:00', stato: 'Somministrato', infermiere_nome: 'Giulia Neri' }
      ]
    },
    shift_hours: {
      title: 'Query 3: Rendicontazione Mensile Ore Lavorate per Dipendente e Straordinari',
      sql: `SELECT 
    p.nome, p.cognome, p.ruolo, p.ore_contrattuali_settimanali * 4.33 AS ore_contratto,
    ROUND(SUM(TIMESTAMPDIFF(MINUTE, t.ora_inizio, t.ora_fine)/60.0), 1) AS ore_effettuate
FROM personale p
LEFT JOIN turni_personale t ON p.id = t.staff_id
GROUP BY p.id;`,
      result: [
        { nome: 'Matteo', cognome: 'Rossi', ruolo: 'OSS', ore_contratto: 164.5, ore_effettuate: 168.0 },
        { nome: 'Giulia', cognome: 'Neri', ruolo: 'Infermiere', ore_contratto: 164.5, ore_effettuate: 172.0 },
        { nome: 'Simone', cognome: 'Marchetti', ruolo: 'OSS', ore_contratto: 164.5, ore_effettuate: 164.5 }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Blueprints & SQL Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            Architettura Software & Schema Relazionale SQL
          </h2>
          <p className="text-xs text-slate-300">
            Documentazione tecnica completa, DDL SQL compatibile con PostgreSQL/MySQL, logica di prevenzione sovrapposizione turni e conformità GDPR dati sanitari
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySql}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiato!' : 'Copia DDL SQL'}
          </button>

          <button
            onClick={handleDownloadSql}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Scarica File .sql
          </button>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center bg-white p-1.5 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('sql')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'sql' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-blue-400" />
          Schema Database DDL (SQL)
        </button>

        <button
          onClick={() => setActiveSubTab('shifts')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'shifts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          Logica Turni & Sovrapposizioni
        </button>

        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'architecture' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-400" />
          Architettura Tecnologica & GDPR
        </button>

        <button
          onClick={() => setActiveSubTab('tester')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'tester' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4 text-purple-400" />
          Simulatore Query SQL
        </button>
      </div>

      {/* SUB-TAB 1: DDL SQL Code */}
      {activeSubTab === 'sql' && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white text-sm">schema_gestionale_rsa.sql</span>
              <span className="text-slate-400 text-xs">(15 Tabelle Relazionali + FK e Indici)</span>
            </div>
            <button
              onClick={handleCopySql}
              className="text-xs text-blue-400 hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              Copia Codice
            </button>
          </div>

          <pre className="overflow-x-auto max-h-[600px] p-4 bg-slate-900 rounded-xl border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed scrollbar-thin">
            <code>{SQL_DDL_SCHEMA}</code>
          </pre>
        </div>
      )}

      {/* SUB-TAB 2: Logica Turni */}
      {activeSubTab === 'shifts' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Documentazione Algoritmi e Regole di Business Turni
            </h3>
            <p className="text-xs text-slate-500">
              Standardizzazione orari, prevenzione conflitti temporali e query per il calcolo delle ore contrattuali
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-sans space-y-3">
              <h4 className="font-bold text-slate-900 text-sm">Regola di Invarianza Oraria ed Overlap Check</h4>
              <p className="text-slate-700">
                L'infrastruttura impedisce l'inserimento di turni sovrapposti per la medesima figura professionale eseguendo un controllo con la condizione di intersezione degli intervalli orari: 
                <code className="bg-slate-200 text-slate-900 font-mono px-1.5 py-0.5 rounded text-[11px]">
                  (OraInizioNuovo &lt; OraFineEsistente AND OraFineNuovo &gt; OraInizioEsistente)
                </code>.
              </p>
            </div>

            <div className="bg-slate-950 text-slate-100 p-5 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2">
              <span className="text-amber-400 font-bold block">// Query per il calcolo degli straordinari mensili</span>
              <pre className="text-emerald-300 whitespace-pre-wrap">
{`SELECT 
    p.id, p.nome, p.cognome, p.ruolo,
    (p.ore_contrattuali_settimanali * 4.33) AS ore_dovute_mensili,
    SUM(TIMESTAMPDIFF(MINUTE, t.ora_inizio, t.ora_fine)/60.0) AS ore_effettive
FROM personale p
JOIN turni_personale t ON p.id = t.staff_id
WHERE t.data BETWEEN '2026-08-01' AND '2026-08-31'
GROUP BY p.id;`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Architettura Tecnologica & GDPR */}
      {activeSubTab === 'architecture' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              Relazione Tecnica sull'Architettura e Conformità GDPR Dati Sanitari
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                Componenti dello Stack
              </h4>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Frontend SPA:</strong> React 19 + TypeScript, Tailwind CSS v4, Motion per transizioni fluide.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Backend API:</strong> Node.js Express con bundler esbuild CJS ed esecuzione tsx in sviluppo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Database Relazionale:</strong> PostgreSQL 16 con estensione pgcrypto per cifratura a livello colonna.</span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                Conformità GDPR (UE 2016/679)
              </h4>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Incrittazione TLS 1.3:</strong> Tutte le chiamate API protette in transito.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Access Control (RBAC):</strong> Separazione tra personale sanitario (medico/infermiere) e amministrativo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Audit Trail:</strong> Registro immodificabile per tracciare chi legge/modifica i dati clinici.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Simulatore Query SQL */}
      {activeSubTab === 'tester' && (
        <div className="bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-sans">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              Simulatore Query SQL su Database ERP
            </h3>
            <span className="text-xs text-slate-400">Ambiente di Test Interattivo</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-sans">
            {Object.entries(sampleQueries).map(([key, q]) => (
              <button
                key={key}
                onClick={() => setActiveSampleQuery(key)}
                className={`p-3 rounded-xl text-left border text-xs font-medium transition-all ${
                  activeSampleQuery === key
                    ? 'bg-blue-600 border-blue-500 text-white font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {q.title}
              </button>
            ))}
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-emerald-400">
              <span className="text-slate-500 block mb-1 text-[10px] font-sans">Istruzione SQL Eseguita:</span>
              <code>{sampleQueries[activeSampleQuery as keyof typeof sampleQueries].sql}</code>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto">
              <span className="text-slate-500 block mb-2 text-[10px] font-sans">Risultato Query (JSON Table Result):</span>
              <pre className="text-blue-300 text-[11px]">
                {JSON.stringify(sampleQueries[activeSampleQuery as keyof typeof sampleQueries].result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
