import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
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
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-500/20">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Xatolik yuz berdi</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            {/* @ts-ignore */}
            {this.props.fallbackMessage || "Kutilmagan texnik xatolik ro'y berdi. Iltimos, sahifani qayta yuklang."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/30 hover:bg-indigo-600 hover:shadow-indigo-500/30 transition-all active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            Sahifani qayta yuklash
          </button>
        </div>
      );
    }

    {/* @ts-ignore */}
    return this.props.children;
  }
}
