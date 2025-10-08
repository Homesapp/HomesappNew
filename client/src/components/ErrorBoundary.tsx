import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isReporting: boolean;
  reported: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reported: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Automatically send error to backend
    this.sendErrorToBackend(error, errorInfo, false);
  }

  sendErrorToBackend = async (error: Error, errorInfo: React.ErrorInfo | null, reportedByUser: boolean) => {
    try {
      this.setState({ isReporting: true });

      const errorData = {
        errorType: 'frontend_error',
        errorMessage: error.message,
        errorStack: error.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        userAgent: navigator.userAgent,
        reportedByUser,
        additionalInfo: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      };

      await apiRequest('POST', '/api/error-logs', errorData);
      
      if (reportedByUser) {
        this.setState({ reported: true });
      }
    } catch (err) {
      console.error('Failed to send error to backend:', err);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  handleReport = () => {
    if (this.state.error && !this.state.reported) {
      this.sendErrorToBackend(this.state.error, this.state.errorInfo, true);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Algo salió mal</CardTitle>
                  <CardDescription>
                    Ocurrió un error inesperado en la aplicación
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {this.state.error?.message}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                El error ha sido reportado automáticamente a nuestro equipo técnico. 
                Puedes intentar recargar la página o reportar detalles adicionales.
              </p>
              {this.state.reported && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Reporte enviado. Gracias por tu ayuda.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 flex-wrap">
              <Button
                onClick={this.handleReload}
                variant="default"
                data-testid="button-reload-page"
              >
                Recargar Página
              </Button>
              <Button
                onClick={this.handleReport}
                variant="outline"
                disabled={this.state.isReporting || this.state.reported}
                data-testid="button-report-error"
              >
                {this.state.isReporting
                  ? 'Reportando...'
                  : this.state.reported
                  ? 'Reportado'
                  : 'Reportar Bug'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
