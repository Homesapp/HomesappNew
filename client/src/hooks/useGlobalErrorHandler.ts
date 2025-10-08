import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function useGlobalErrorHandler() {
  useEffect(() => {
    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      sendErrorToBackend({
        errorType: 'unhandled_rejection',
        errorMessage: event.reason?.message || String(event.reason),
        errorStack: event.reason?.stack || '',
        url: window.location.href,
        additionalInfo: {
          reason: String(event.reason),
          timestamp: new Date().toISOString(),
        },
      });
    };

    // Capture global JavaScript errors
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      sendErrorToBackend({
        errorType: 'console_error',
        errorMessage: event.message,
        errorStack: event.error?.stack || '',
        url: window.location.href,
        errorCode: String(event.lineno),
        additionalInfo: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: new Date().toISOString(),
        },
      });
    };

    // Capture console.error calls
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError(...args);
      
      // Only send to backend if it's an actual Error object or important message
      const firstArg = args[0];
      if (firstArg instanceof Error || (typeof firstArg === 'string' && firstArg.toLowerCase().includes('error'))) {
        sendErrorToBackend({
          errorType: 'console_error',
          errorMessage: firstArg instanceof Error ? firstArg.message : String(firstArg),
          errorStack: firstArg instanceof Error ? firstArg.stack || '' : '',
          url: window.location.href,
          additionalInfo: {
            args: args.slice(1).map(arg => String(arg)),
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      console.error = originalConsoleError;
    };
  }, []);
}

async function sendErrorToBackend(errorData: any) {
  try {
    await apiRequest('POST', '/api/error-logs', {
      ...errorData,
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    // Silently fail - don't want to create an error loop
    console.warn('Failed to send error to backend:', err);
  }
}
