import React, { useState } from "react";
import { Receipt, Printer, CheckCircle2, AlertCircle, Plus, FileText } from "lucide-react";
import { FinancialRecord, Resident } from "../types";

interface FinancialsViewProps {
  financials: FinancialRecord[];
  residents: Resident[];
  onUpdateFinancials: (updated: FinancialRecord[]) => void;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({
  financials,
  residents,
  onUpdateFinancials
}) => {
  const handleMarkAsPaid = (record: FinancialRecord) => {
    const updated = financials.map(f => {
      if (f.id !== record.id) return f;
      return {
        ...f,
        statoPagamento: "Pagato" as const,
        dataPagamento: new Date().toISOString().split("T")[0]
      };
    });
    onUpdateFinancials(updated);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Rette Mensili & Contabilità Struttura</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestione rette di degenza, spese straordinarie e avvisi di pagamento</p>
        </div>
      </div>

      <div className="space-y-4">
        {financials.map(f => {
          const res = residents.find(r => r.id === f.ospiteId);

          return (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{res ? `${res.nome} ${res.cognome}` : "Ospite"}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Mese: {f.meseAnno}</span>
                </div>

                <p className="text-xs text-slate-600">
                  Retta base: €{f.importoBase.toFixed(2)} • Spese extra: €{f.speseExtra.reduce((acc, s) => acc + s.importo, 0).toFixed(2)}
                </p>

                {f.speseExtra.length > 0 && (
                  <div className="text-xs text-slate-500 italic">
                    Dettaglio extra: {f.speseExtra.map(s => `${s.descrizione} (€${s.importo})`).join(", ")}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900">€{f.totale.toFixed(2)}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    f.statoPagamento === "Pagato" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {f.statoPagamento} {f.dataPagamento ? `il ${f.dataPagamento}` : ""}
                  </span>
                </div>

                {f.statoPagamento !== "Pagato" && (
                  <button
                    onClick={() => handleMarkAsPaid(f)}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow"
                  >
                    Segna Pagato
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
