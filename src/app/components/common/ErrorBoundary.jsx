import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    
    // Clear error state after a brief delay
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        isRetrying: false 
      });
    }, 500);
  };

  handleGoHome = () => {
    // Clear any stored session data that might be causing issues
    localStorage.removeItem('medora_token');
    localStorage.removeItem('medora_user');
    localStorage.removeItem('medora_role');
    
    // Reload the page to start fresh
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-red-800">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription className="text-lg">
                The application encountered an unexpected error
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* User-friendly error message */}
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>What happened?</strong><br />
                  The application ran into a problem and couldn't continue. This might be due to:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>A temporary server issue</li>
                    <li>Network connectivity problems</li>
                    <li>Corrupted session data</li>
                    <li>An unexpected application error</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex-1"
                >
                  {this.state.isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {/* Developer information (only in development) */}
              {isDevelopment && this.state.error && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Bug className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">Developer Information</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-gray-700">Error:</strong>
                      <pre className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 overflow-x-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    
                    {this.state.errorInfo && (
                      <div>
                        <strong className="text-gray-700">Component Stack:</strong>
                        <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 overflow-x-auto text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Help text */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  If this problem persists, please try clearing your browser cache or contact support.
                </p>
                {isDevelopment && (
                  <p className="mt-2 text-blue-600">
                    💡 Check the browser console for more detailed error information.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;