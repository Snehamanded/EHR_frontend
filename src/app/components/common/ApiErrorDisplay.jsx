import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Button } from '@/app/components/ui/button';
import { 
  AlertTriangle, 
  Wifi, 
  Server, 
  Database, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';

export function ApiErrorDisplay({ error, onRetry, className = "" }) {
  if (!error) return null;

  // Determine error type and appropriate message
  const getErrorInfo = (error) => {
    const status = error.status || 0;
    const message = error.message || 'Unknown error';
    const url = error.url || '';

    // Network errors
    if (status === 0 || message.toLowerCase().includes('network')) {
      return {
        type: 'network',
        icon: Wifi,
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        color: 'border-orange-200 bg-orange-50',
        iconColor: 'text-orange-600',
        textColor: 'text-orange-800',
        suggestions: [
          'Check your internet connection',
          'Verify the server is running',
          'Try refreshing the page'
        ]
      };
    }

    // Authentication errors
    if (status === 401) {
      return {
        type: 'auth',
        icon: AlertTriangle,
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again.',
        color: 'border-red-200 bg-red-50',
        iconColor: 'text-red-600',
        textColor: 'text-red-800',
        suggestions: [
          'Click "Go to Login" to sign in again',
          'Clear your browser cache if issues persist'
        ]
      };
    }

    // Not found errors
    if (status === 404) {
      return {
        type: 'notfound',
        icon: Server,
        title: 'Service Not Available',
        message: `The requested service is not available. This may be a temporary issue.`,
        color: 'border-blue-200 bg-blue-50',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-800',
        suggestions: [
          'The backend service may be updating',
          'Try again in a few minutes',
          'Contact support if the issue persists'
        ]
      };
    }

    // Database/relationship errors
    if (status === 500 && (
      message.includes('not associated') || 
      message.includes('relationship') ||
      message.includes('foreign key')
    )) {
      return {
        type: 'database',
        icon: Database,
        title: 'Data Issue',
        message: 'There\'s a temporary data issue on our servers. Our team has been notified.',
        color: 'border-purple-200 bg-purple-50',
        iconColor: 'text-purple-600',
        textColor: 'text-purple-800',
        suggestions: [
          'This is not an issue with your account',
          'Our technical team is working on a fix',
          'Try again later or contact support'
        ]
      };
    }

    // Server errors
    if (status >= 500) {
      return {
        type: 'server',
        icon: Server,
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again later.',
        color: 'border-red-200 bg-red-50',
        iconColor: 'text-red-600',
        textColor: 'text-red-800',
        suggestions: [
          'This is a temporary server issue',
          'Try refreshing the page',
          'Contact support if the problem continues'
        ]
      };
    }

    // Client errors
    if (status >= 400) {
      return {
        type: 'client',
        icon: AlertTriangle,
        title: 'Request Error',
        message: message || 'There was a problem with your request.',
        color: 'border-yellow-200 bg-yellow-50',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-800',
        suggestions: [
          'Check your input and try again',
          'Refresh the page if the issue persists'
        ]
      };
    }

    // Generic error
    return {
      type: 'generic',
      icon: AlertTriangle,
      title: 'Something went wrong',
      message: message || 'An unexpected error occurred.',
      color: 'border-gray-200 bg-gray-50',
      iconColor: 'text-gray-600',
      textColor: 'text-gray-800',
      suggestions: [
        'Try refreshing the page',
        'Contact support if the issue persists'
      ]
    };
  };

  const errorInfo = getErrorInfo(error);
  const Icon = errorInfo.icon;

  const handleGoToLogin = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Alert className={`${errorInfo.color} ${className}`}>
      <Icon className={`h-4 w-4 ${errorInfo.iconColor}`} />
      <AlertDescription className={errorInfo.textColor}>
        <div className="space-y-3">
          <div>
            <strong className="font-semibold">{errorInfo.title}</strong>
            <p className="mt-1">{errorInfo.message}</p>
          </div>

          {errorInfo.suggestions && errorInfo.suggestions.length > 0 && (
            <div>
              <p className="font-medium mb-2">What you can do:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
            
            {errorInfo.type === 'auth' && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleGoToLogin}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Go to Login
              </Button>
            )}
          </div>

          {/* Technical details for developers */}
          {import.meta.env.DEV && error.status && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-mono opacity-70 hover:opacity-100">
                Technical Details (Dev Mode)
              </summary>
              <div className="mt-2 p-2 bg-black bg-opacity-10 rounded text-xs font-mono">
                <div>Status: {error.status}</div>
                <div>URL: {error.url}</div>
                <div>Method: {error.method}</div>
                {error.rawMessage && (
                  <div>Raw Error: {error.rawMessage}</div>
                )}
              </div>
            </details>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}