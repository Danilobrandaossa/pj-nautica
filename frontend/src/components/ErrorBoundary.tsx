import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar erros de renderização no React
 * Exibe uma tela amigável de erro ao invés de quebrar a aplicação
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro (em produção, enviar para serviço de monitoramento)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Aqui você poderia enviar o erro para Sentry ou outro serviço
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg overflow-auto max-h-48">
            <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
              Detalhes do erro (apenas em desenvolvimento)
            </summary>
            <pre className="text-xs text-red-600 whitespace-pre-wrap">
              {error.toString()}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={onReset}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;

