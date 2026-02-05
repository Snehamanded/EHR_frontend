import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ApiStatusPage } from './ApiStatusPage';
import { 
  Bug, 
  Server, 
  Database, 
  Trash2, 
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react';

export function DebugPanel() {
  const [showApiStatus, setShowApiStatus] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Storage cleared');
    alert('Browser storage cleared! Page will reload.');
    window.location.reload();
  };

  const showErrorSummary = () => {
    if (window.apiErrorTracker) {
      window.apiErrorTracker.printSummary();
      console.log('📊 Error summary printed to console');
    } else {
      console.log('❌ Error tracker not available');
    }
  };

  const testApiConnection = async () => {
    console.log('🔍 Testing API connection...');
    try {
      const apiService = (await import('@/app/services/apiService')).default;
      const response = await apiService.get('/user/list');
      console.log('✅ API connection successful:', response);
    } catch (error) {
      console.error('❌ API connection failed:', error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200"
        >
          <Bug className="h-4 w-4 mr-1" />
          Debug
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <Card className="w-80 bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Tools
                </CardTitle>
                <CardDescription className="text-purple-600">
                  Development utilities
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="text-purple-600 hover:text-purple-800"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiStatus(true)}
              className="w-full justify-start text-purple-700 border-purple-300 hover:bg-purple-100"
            >
              <Server className="h-4 w-4 mr-2" />
              API Status
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={showErrorSummary}
              className="w-full justify-start text-purple-700 border-purple-300 hover:bg-purple-100"
            >
              <Eye className="h-4 w-4 mr-2" />
              Show Errors
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={testApiConnection}
              className="w-full justify-start text-purple-700 border-purple-300 hover:bg-purple-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test API
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={clearStorage}
              className="w-full justify-start text-red-700 border-red-300 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Storage
            </Button>
            
            <div className="pt-2 border-t border-purple-200">
              <p className="text-xs text-purple-600">
                💡 Open DevTools Console for detailed logs
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showApiStatus && (
        <ApiStatusPage onClose={() => setShowApiStatus(false)} />
      )}
    </>
  );
}