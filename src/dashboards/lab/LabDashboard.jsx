import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { TestTube, Upload, TrendingUp, Clock, CheckCircle, Package } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import dataService from '@/app/services/dataService';
import { toast } from 'sonner';

export function LabDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [resultsSummary, setResultsSummary] = useState('');

  const {
    currentUser,
    labTests,
    labOrders,
    reports,
    patients,
    addItem,
    updateItem,
  } = useApp();

  // Helper to get patient name by ID
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id?.toString() === patientId?.toString());
    return patient?.name || patient?.firstName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : `Patient ${patientId}`;
  };

  // Map backend status to frontend status
  const mapBackendStatus = (status) => {
    const statusMap = {
      'Pending': 'booked',
      'In Progress': 'processing',
      'Completed': 'completed',
      'Cancelled': 'cancelled',
    };
    return statusMap[status] || status?.toLowerCase() || 'booked';
  };

  // Map frontend status to backend status
  const mapFrontendStatus = (status) => {
    const statusMap = {
      'booked': 'Pending',
      'sample_collected': 'Pending', // Still pending until processing starts
      'processing': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return statusMap[status] || 'Pending';
  };

  // Calculate stats using mapped status
  const totalOrders = labOrders.length;
  const completedOrders = labOrders.filter((o) => mapBackendStatus(o.status) === 'completed').length;
  const processingOrders = labOrders.filter((o) => mapBackendStatus(o.status) === 'processing').length;
  const pendingOrders = labOrders.filter((o) => {
    const status = mapBackendStatus(o.status);
    return status === 'booked' || status === 'sample_collected';
  }).length;

  const getStatusColor = (status) => {
    const mappedStatus = mapBackendStatus(status);
    switch (mappedStatus) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'sample_collected':
        return 'bg-yellow-500';
      case 'booked':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handlers
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const backendStatus = mapFrontendStatus(newStatus);
      await dataService.update('labOrders', orderId, { status: backendStatus });
      toast.success(`Lab order status updated to ${newStatus}`);
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error('Error updating lab order status:', error);
      toast.error('Failed to update lab order status');
    }
  };

  const handleUploadReport = async (orderId, file, summary) => {
    try {
      if (!file || !orderId) {
        toast.error('Please select a file and lab order');
        return;
      }

      const order = labOrders.find((o) => o.id?.toString() === orderId?.toString());
      if (!order) {
        toast.error('Lab order not found');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', `Lab Report - ${order.testName || order.labTestType}`);
      formData.append('description', summary || 'Lab test results');
      formData.append('patientId', order.patientId);
      formData.append('uploadedBy', currentUser?.id || userId);
      formData.append('relatedEntityId', order.patientId);
      formData.append('relatedEntityType', 'Patient');

      // Upload document (you may need to adjust the API endpoint for file uploads)
      await dataService.create('reports', formData);

      // Update lab order status to completed
      await handleStatusUpdate(orderId, 'completed');

      toast.success('Report uploaded and lab order marked as completed');
      setSelectedOrderId('');
      setReportFile(null);
      setResultsSummary('');
      window.location.reload();
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error('Failed to upload report');
    }
  };

  const labTechnicianName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    'Lab Technician';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Laboratory Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {labTechnicianName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Lab Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Order</Label>
                      <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select lab order" />
                        </SelectTrigger>
                        <SelectContent>
                          {labOrders
                            .filter((o) => {
                              const status = mapBackendStatus(o.status);
                              return status !== 'completed';
                            })
                            .map((order) => {
                              const testName = order.testName || order.labTestType;
                              const patientName = getPatientName(order.patientId);
                              return (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  {testName} - {patientName}
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Report File</Label>
                      <Input 
                        type="file" 
                        className="mt-2" 
                        accept=".pdf,.jpg,.png"
                        onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div>
                      <Label>Test Results Summary</Label>
                      <Textarea 
                        placeholder="Enter key findings..." 
                        className="mt-2"
                        value={resultsSummary}
                        onChange={(e) => setResultsSummary(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => handleUploadReport(selectedOrderId, reportFile, resultsSummary)}
                      disabled={!selectedOrderId || !reportFile}
                    >
                      Upload & Mark Complete
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{processingOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Tests in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting sample/start</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Results uploaded</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Lab Orders</TabsTrigger>
            <TabsTrigger value="tests">Available Tests</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest test orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {labOrders.slice(0, 5).map((order) => {
                      const mappedStatus = mapBackendStatus(order.status);
                      return (
                        <div key={order.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                mappedStatus === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                              }`}
                            >
                              <TestTube
                                className={`h-5 w-5 ${mappedStatus === 'completed' ? 'text-green-600' : 'text-blue-600'}`}
                              />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{getPatientName(order.patientId)}</p>
                              <p className="text-xs text-gray-600">{order.testName || order.labTestType}</p>
                              <p className="text-xs text-gray-500">{order.orderDate || order.createdAt?.split('T')[0]}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status)}>{mappedStatus}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Test Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Categories</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Calculate test categories from actual labTests data
                      const categoryCounts = {};
                      const categoryColors = {
                        'Hematology': 'bg-red-500',
                        'Biochemistry': 'bg-blue-500',
                        'Microbiology': 'bg-green-500',
                        'Endocrinology': 'bg-purple-500',
                        'Immunology': 'bg-yellow-500',
                        'Pathology': 'bg-pink-500',
                      };
                      
                      (labTests || []).forEach(test => {
                        const category = test.category || test.testType || 'Other';
                        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                      });
                      
                      const totalTests = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) || 1;
                      const categories = Object.entries(categoryCounts).map(([category, count]) => ({
                        category,
                        count,
                        color: categoryColors[category] || 'bg-gray-500'
                      }));
                      
                      return categories.length > 0 ? (
                        categories.map((item) => (
                          <div key={item.category}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{item.category}</span>
                              <span className="text-sm text-gray-600">{item.count} tests</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`${item.color} h-2 rounded-full`}
                                style={{ width: `${(item.count / totalTests) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center">No test data available</p>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-24 flex-col">
                    <TestTube className="h-8 w-8 mb-2" />
                    <span>New Test Order</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <Upload className="h-8 w-8 mb-2" />
                    <span>Upload Report</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <Package className="h-8 w-8 mb-2" />
                    <span>Manage Inventory</span>
                  </Button>
                  <Button variant="outline" className="h-24 flex-col">
                    <CheckCircle className="h-8 w-8 mb-2" />
                    <span>Quality Control</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Lab Orders</CardTitle>
                <CardDescription>Manage and track test orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Sample Collection</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labOrders.map((order) => {
                      const mappedStatus = mapBackendStatus(order.status);
                      const testName = order.testName || order.labTestType;
                      const patientName = getPatientName(order.patientId);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id}</TableCell>
                          <TableCell>{patientName}</TableCell>
                          <TableCell>{testName}</TableCell>
                          <TableCell>{order.orderDate || order.createdAt?.split('T')[0]}</TableCell>
                          <TableCell>
                            {order.sampleCollectionDate ? (
                              <span className="text-sm">{order.sampleCollectionDate}</span>
                            ) : (
                              <span className="text-sm text-gray-400">Not collected</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>{mappedStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {mappedStatus === 'booked' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(order.id, 'sample_collected')}
                                >
                                  Collect Sample
                                </Button>
                              )}
                              {mappedStatus === 'sample_collected' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStatusUpdate(order.id, 'processing')}
                                >
                                  Start Processing
                                </Button>
                              )}
                              {mappedStatus === 'processing' && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm">Upload Result</Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Upload Test Result</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Patient: {patientName}</Label>
                                        <p className="text-sm text-gray-600 mt-1">Test: {testName}</p>
                                      </div>
                                      <div>
                                        <Label>Report File</Label>
                                        <Input 
                                          type="file" 
                                          className="mt-2" 
                                          accept=".pdf"
                                          onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Results Summary</Label>
                                        <Textarea 
                                          placeholder="Key findings..." 
                                          className="mt-2"
                                          value={resultsSummary}
                                          onChange={(e) => setResultsSummary(e.target.value)}
                                        />
                                      </div>
                                      <Button 
                                        className="w-full"
                                        onClick={() => handleUploadReport(order.id, reportFile, resultsSummary)}
                                        disabled={!reportFile}
                                      >
                                        Upload & Complete
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                              {mappedStatus === 'completed' && (
                                <Button variant="outline" size="sm">
                                  View Report
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Available Tests Tab */}
          <TabsContent value="tests" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Available Lab Tests</CardTitle>
                    <CardDescription>Test catalog and pricing</CardDescription>
                  </div>
                  <Button>
                    <Package className="h-4 w-4 mr-2" />
                    Add New Test
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {labTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium">{test.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {test.category}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">${test.price}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{test.duration}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Reports</CardTitle>
                <CardDescription>Patient test reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports
                    .filter((r) => r.type === 'Lab')
                    .map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <TestTube className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{report.name}</p>
                            <p className="text-sm text-gray-600">Patient: {report.patientName}</p>
                            <p className="text-sm text-gray-500">Date: {report.date}</p>
                            <p className="text-xs text-gray-400">Uploaded by: {report.uploadedBy}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
