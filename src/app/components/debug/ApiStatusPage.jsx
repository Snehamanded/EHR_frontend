import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Server, 
  Database,
  Wifi,
  AlertTriangle,
  Info
} from 'lucide-react';
import apiService from '@/app/services/apiService';

export function ApiStatusPage({ onClose }) {
  const [tests, setTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState(null);

  const endpoints = [
    { name: 'API Base', path: '', method: 'GET', critical: true },
    { name: 'User List', path: '/user/list', method: 'GET', critical: true },
    { name: 'User Signin', path: '/user/signin', method: 'POST', critical: true, 
      body: { email: 'test@example.com', password: 'test123' } },
    { name: 'Patient List', path: '/patient/list', method: 'GET', critical: false },
    { name: 'Doctor List', path: '/doctor/list', method: 'GET', critical: false },
    { name: 'Appointment List', path: '/appointment/list', method: 'GET', critical: false },
    { name: 'Document List', path: '/document/list', method: 'GET', critical: false },
    { name: 'Medicine List', path: '/medicine/list', method: 'GET', critical: false },
  ];

  const runTests = async () => {
    setIsRunning(true);
    setTests([]);
    
    const results = [];
    
    for (const endpoint of endpoints) {
      const testResult = {
        ...endpoint,
        status: 'running',
        startTime: Date.now(),
        response: null,
        error: null
      };
      
      setTests(prev => [...prev, testResult]);
      
      try {
        let response;
        if (endpoint.method === 'POST') {
          response = await apiService.post(endpoint.path, endpoint.body || {});
        } else {
          response = await apiService.get(endpoint.path);
        }
        
        testResult.status = 'success';
        testResult.response = response;
        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;
        
      } catch (error) {
        testResult.status = 'error';
        testResult.error = error;
        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;
      }
      
      results.push(testResult);
      setTests([...results]);
    }
    
    // Generate summary
    const passed = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const criticalFailed = results.filter(r => r.status === 'error' && r.critical).length;
    
    setSummary({
      total: results.length,
      passed,
      failed,
      criticalFailed,
      overallStatus: criticalFailed > 0 ? 'critical' : failed > 0 ? 'warning' : 'success'
    });
    
    setIsRunning(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (test) => {
    if (test.status === 'success') {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    }
    if (test.status === 'error') {
      const errorType = test.error?.status === 404 ? 'Not Found' : 
                       test.error?.status === 500 ? 'Server Error' :
                       test.error?.status === 0 ? 'Network Error' : 'Error';
      return <Badge variant="destructive">{errorType}</Badge>;
    }
    if (test.status === 'running') {
      return <Badge className="bg-blue-100 text-blue-800">Running...</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const getErrorDetails = (error) => {
    if (!error) return null;
    
    const status = error.status || 0;
    const message = error.message || 'Unknown error';
    
    if (status === 404) {
      return {
        type: 'Missing Endpoint',
        message: 'This endpoint is not implemented on the backend',
        severity: 'high',
        action: 'Backend team needs to add this endpoint'
      };
    }
    
    if (status === 500 && message.includes('not associated')) {
      return {
        type: 'Database Relationship Issue',
        message: 'Database foreign key relationships are broken',
        severity: 'high',
        action: 'Database cleanup required'
      };
    }
    
    if (status === 0) {
      return {
        type: 'Network/CORS Issue',
        message: 'Cannot connect to the API server',
        severity: 'critical',
        action: 'Check server status and CORS configuration'
      };
    }
    
    return {
      type: 'Server Error',
      message: message,
      severity: 'medium',
      action: 'Check backend server logs'
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Server className="h-6 w-6" />
                API Status Dashboard
              </CardTitle>
              <CardDescription>
                Testing connectivity to production API endpoints
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runTests}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retest
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          {summary && (
            <Alert className={
              summary.overallStatus === 'critical' ? 'border-red-200 bg-red-50' :
              summary.overallStatus === 'warning' ? 'border-yellow-200 bg-yellow-50' :
              'border-green-200 bg-green-50'
            }>
              <Info className={`h-4 w-4 ${
                summary.overallStatus === 'critical' ? 'text-red-600' :
                summary.overallStatus === 'warning' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
              <AlertDescription className={
                summary.overallStatus === 'critical' ? 'text-red-800' :
                summary.overallStatus === 'warning' ? 'text-yellow-800' :
                'text-green-800'
              }>
                <strong>Test Summary:</strong> {summary.passed}/{summary.total} endpoints working
                {summary.criticalFailed > 0 && (
                  <span className="block mt-1">
                    ⚠️ {summary.criticalFailed} critical endpoints are failing - authentication may not work
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Endpoint Tests</h3>
            
            {tests.map((test, index) => (
              <Card key={index} className="border-l-4 border-l-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {test.name}
                          {test.critical && (
                            <Badge variant="outline" className="text-xs">Critical</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {test.method} {test.path || '/'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.duration && (
                        <span className="text-xs text-gray-500">{test.duration}ms</span>
                      )}
                      {getStatusBadge(test)}
                    </div>
                  </div>

                  {/* Error Details */}
                  {test.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      {(() => {
                        const errorDetails = getErrorDetails(test.error);
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <strong className="text-red-800">{errorDetails.type}</strong>
                            </div>
                            <p className="text-sm text-red-700">{errorDetails.message}</p>
                            <p className="text-xs text-red-600">
                              <strong>Action needed:</strong> {errorDetails.action}
                            </p>
                            {test.error.status && (
                              <p className="text-xs text-gray-600">
                                HTTP {test.error.status}: {test.error.message}
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Success Details */}
                  {test.response && test.status === 'success' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <strong className="text-green-800">Response received</strong>
                      </div>
                      {test.response.data && Array.isArray(test.response.data) && (
                        <p className="text-sm text-green-700">
                          Returned {test.response.data.length} records
                        </p>
                      )}
                      {test.response.success !== undefined && (
                        <p className="text-sm text-green-700">
                          Success: {test.response.success ? 'true' : 'false'}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommendations */}
          {summary && summary.failed > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="text-blue-700 space-y-2">
                {summary.criticalFailed > 0 && (
                  <div>
                    <strong>Critical Issues:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Authentication endpoints are not working - users cannot login</li>
                      <li>Backend team needs to add missing endpoints immediately</li>
                      <li>Consider using fallback authentication for testing</li>
                    </ul>
                  </div>
                )}
                
                <div>
                  <strong>General Issues:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Database relationships need to be fixed</li>
                    <li>Run database cleanup scripts</li>
                    <li>Verify all foreign key constraints</li>
                    <li>Check backend server logs for detailed errors</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}