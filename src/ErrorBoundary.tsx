import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full text-slate-800">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Errore di Sistema (Crash)</h1>
            <p className="mb-4 text-slate-600">L'applicazione ha riscontrato un errore imprevisto. Copia questo testo e invialo per risolvere il problema.</p>
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono text-slate-700">
              <p className="font-bold mb-2">{this.state.error?.toString()}</p>
              <pre>{this.state.error?.stack}</pre>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }} 
              className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors w-full"
            >
              Forza Riavvio (Cancella Cache)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
