import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mb-4 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Un incident d'affichage est survenu</h2>
          <p className="text-xs text-white/60 max-w-md mb-6 leading-relaxed">
            Une erreur temporaire a été interceptée. Vos réglages et données sont en sécurité.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recharger l'écran</span>
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl glass hover:bg-white/10 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition"
            >
              <Home className="w-4 h-4" />
              <span>Retour Accueil</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
