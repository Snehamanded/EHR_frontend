import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Pill, Package, ShoppingCart, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import dataService from '@/app/services/dataService';
import { toast } from 'sonner';

export function PharmacyDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [updatingStock, setUpdatingStock] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('');
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    category: '',
    manufacturer: '',
    price: '',
    stockQuantity: '',
    expiryDate: ''
  });

  const {
    currentUser,
    medicines,
    pharmacyOrders,
    prescriptions,
    patients,
    addItem,
    updateItem,
  } = useApp();

  const totalOrders = pharmacyOrders.length;
  const pendingOrders = pharmacyOrders.filter((o) => o.status === 'pending').length;
  const deliveredOrders = pharmacyOrders.filter((o) => o.status === 'delivered').length;
  const lowStockMedicines = medicines.filter((m) => (m.stock || m.stockQuantity || 0) < 100).length;

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500';
      case 'confirmed':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === 'paid' ? 'bg-green-500' : 'bg-yellow-500';
  };

  // Helper to get patient name by ID
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id?.toString() === patientId?.toString());
    return patient?.name || patient?.firstName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : `Patient ${patientId}`;
  };

  // Map payment status to order status for display
  const getOrderStatus = (paymentStatus) => {
    const status = paymentStatus?.toLowerCase();
    if (status === 'completed') return 'delivered';
    if (status === 'pending') return 'pending';
    return status || 'pending';
  };

  const isLowStock = (stock) => (stock || 0) < 100;
  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiry < sixMonthsFromNow;
  };

  // Handlers
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      // Map frontend status to payment status
      const paymentStatus = newStatus === 'delivered' ? 'Completed' : newStatus === 'confirmed' ? 'Pending' : 'Pending';
      await dataService.update('pharmacyOrders', orderId, { status: paymentStatus });
      toast.success(`Order ${newStatus}`);
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleUpdateStock = async (medicineId, currentStock, addQuantity) => {
    try {
      const newStock = (currentStock || 0) + (parseInt(addQuantity) || 0);
      await dataService.update('medicines', medicineId, { stockQuantity: newStock });
      toast.success('Stock updated successfully');
      setStockQuantity('');
      window.location.reload();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const pharmacistName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    'Pharmacist';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pharmacy Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {pharmacistName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Manage Inventory
              </Button>
              <Button>
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-600">+8% from last week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveredOrders}</div>
              <p className="text-xs text-gray-500 mt-1">Completed orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockMedicines}</div>
              <p className="text-xs text-gray-500 mt-1">Requires restocking</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest pharmacy orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pharmacyOrders.map((order) => (
                      <div key={order.id} className="flex items-start justify-between pb-4 border-b last:border-0">
                        <div className="flex items-start gap-3">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              order.status === 'delivered' ? 'bg-green-100' : 'bg-blue-100'
                            }`}
                          >
                            <ShoppingCart
                              className={`h-5 w-5 ${
                                order.status === 'delivered' ? 'text-green-600' : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getPatientName(order.patientId)}</p>
                            <p className="text-xs text-gray-600">{(order.items || []).length} items</p>
                            <p className="text-xs text-gray-500">{order.orderDate || order.createdAt?.split('T')[0]}</p>
                            <p className="text-sm font-medium mt-1">${(order.totalAmount || order.amount || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={getStatusColor(getOrderStatus(order.status || order.paymentStatus))}>
                            {getOrderStatus(order.status || order.paymentStatus)}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus || (order.status === 'Completed' ? 'paid' : 'pending'))} variant="outline">
                            {order.paymentStatus || (order.status === 'Completed' ? 'paid' : 'pending')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Stock Alerts
                  </CardTitle>
                  <CardDescription>Items requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicines
                      .filter((m) => isLowStock(m.stock || m.stockQuantity) || isExpiringSoon(m.expiryDate))
                      .map((medicine) => (
                        <div key={medicine.id} className="flex items-start justify-between pb-4 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{medicine.name}</p>
                            <p className="text-xs text-gray-600">{medicine.manufacturer || 'N/A'}</p>
                            {isLowStock(medicine.stock || medicine.stockQuantity) && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Low Stock: {medicine.stock || medicine.stockQuantity || 0} units
                              </Badge>
                            )}
                            {isExpiringSoon(medicine.expiryDate) && (
                              <Badge variant="outline" className="mt-1 ml-1 text-xs border-yellow-500 text-yellow-700">
                                Expiring: {medicine.expiryDate}
                              </Badge>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Reorder
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${pharmacyOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${medicines.reduce((sum, med) => sum + (med.price || 0) * (med.stock || med.stockQuantity || 0), 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total stock value</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pending Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{prescriptions.length}</div>
                  <p className="text-sm text-gray-500 mt-1">To be fulfilled</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage pharmacy orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacyOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{getPatientName(order.patientId)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" className="p-0 h-auto">
                                {(order.items || []).length} items
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Order Items</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                {(order.items || []).length > 0 ? (
                                  <>
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                                        <div>
                                          <p className="font-medium">{item.medicineName || item.name || 'Medicine'}</p>
                                          <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
                                        </div>
                                        <p className="font-medium">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                                      </div>
                                    ))}
                                    <div className="flex items-center justify-between pt-3 border-t font-bold">
                                      <span>Total</span>
                                      <span>${(order.totalAmount || order.amount || 0).toFixed(2)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500">No items details available</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>{order.orderDate || order.createdAt?.split('T')[0]}</TableCell>
                        <TableCell className="font-medium">${(order.totalAmount || order.amount || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.paymentStatus || (order.status === 'Completed' ? 'paid' : 'pending'))}>
                            {order.paymentStatus || (order.status === 'Completed' ? 'paid' : 'pending')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(getOrderStatus(order.status || order.paymentStatus))}>
                            {getOrderStatus(order.status || order.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {getOrderStatus(order.status || order.paymentStatus) === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOrderStatusUpdate(order.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                            )}
                            {getOrderStatus(order.status || order.paymentStatus) === 'confirmed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOrderStatusUpdate(order.id, 'delivered')}
                              >
                                Mark Delivered
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medicine Inventory</CardTitle>
                    <CardDescription>Stock management and tracking</CardDescription>
                  </div>
                  <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setMedicineForm({
                          name: '',
                          category: '',
                          manufacturer: '',
                          price: '',
                          stockQuantity: '',
                          expiryDate: ''
                        });
                      }}>
                        <Package className="h-4 w-4 mr-2" />
                        Add Medicine
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Medicine</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Medicine Name</Label>
                          <Input 
                            value={medicineForm.name}
                            onChange={(e) => setMedicineForm({...medicineForm, name: e.target.value})}
                            placeholder="e.g., Aspirin 100mg" 
                            className="mt-2" 
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input 
                            value={medicineForm.category}
                            onChange={(e) => setMedicineForm({...medicineForm, category: e.target.value})}
                            placeholder="e.g., Cardiovascular" 
                            className="mt-2" 
                          />
                        </div>
                        <div>
                          <Label>Manufacturer</Label>
                          <Input 
                            value={medicineForm.manufacturer}
                            onChange={(e) => setMedicineForm({...medicineForm, manufacturer: e.target.value})}
                            placeholder="e.g., Pfizer" 
                            className="mt-2" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Price ($)</Label>
                            <Input 
                              type="number" 
                              value={medicineForm.price}
                              onChange={(e) => setMedicineForm({...medicineForm, price: e.target.value})}
                              placeholder="0.00" 
                              className="mt-2" 
                            />
                          </div>
                          <div>
                            <Label>Stock Quantity</Label>
                            <Input 
                              type="number" 
                              value={medicineForm.stockQuantity}
                              onChange={(e) => setMedicineForm({...medicineForm, stockQuantity: e.target.value})}
                              placeholder="0" 
                              className="mt-2" 
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <Input 
                            type="date" 
                            value={medicineForm.expiryDate}
                            onChange={(e) => setMedicineForm({...medicineForm, expiryDate: e.target.value})}
                            className="mt-2" 
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => setShowMedicineDialog(false)}>
                            Cancel
                          </Button>
                          <Button 
                            className="flex-1" 
                            onClick={async () => {
                              try {
                                await dataService.create('medicines', {
                                  name: medicineForm.name,
                                  category: medicineForm.category,
                                  manufacturer: medicineForm.manufacturer,
                                  price: parseFloat(medicineForm.price) || 0,
                                  stockQuantity: parseInt(medicineForm.stockQuantity) || 0,
                                  expiryDate: medicineForm.expiryDate
                                });
                                toast.success('Medicine added successfully');
                                setShowMedicineDialog(false);
                                window.location.reload();
                              } catch (error) {
                                console.error('Error adding medicine:', error);
                                toast.error('Failed to add medicine');
                              }
                            }}
                          >
                            Add to Inventory
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell className="font-medium">{medicine.name}</TableCell>
                        <TableCell>{medicine.category}</TableCell>
                        <TableCell>{medicine.manufacturer}</TableCell>
                        <TableCell>${(medicine.price || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isLowStock(medicine.stock || medicine.stockQuantity) ? 'text-red-600 font-medium' : ''}>
                              {medicine.stock || medicine.stockQuantity || 0}
                            </span>
                            {isLowStock(medicine.stock || medicine.stockQuantity) && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={isExpiringSoon(medicine.expiryDate) ? 'text-yellow-600' : ''}>
                            {medicine.expiryDate || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isLowStock(medicine.stock || medicine.stockQuantity) ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-500">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Update
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update Stock</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Medicine: {medicine.name}</Label>
                                  </div>
                                  <div>
                                    <Label>Current Stock: {medicine.stock || medicine.stockQuantity || 0}</Label>
                                  </div>
                                  <div>
                                    <Label>Add Quantity</Label>
                                    <Input 
                                      type="number" 
                                      placeholder="0" 
                                      className="mt-2"
                                      value={stockQuantity}
                                      onChange={(e) => setStockQuantity(e.target.value)}
                                    />
                                  </div>
                                  <Button 
                                    className="w-full"
                                    onClick={() => handleUpdateStock(medicine.id, medicine.stock || medicine.stockQuantity, stockQuantity)}
                                    disabled={!stockQuantity || parseInt(stockQuantity) <= 0}
                                  >
                                    Update Stock
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              aria-label={`Delete ${medicine.name}`}
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete ${medicine.name}?`)) {
                                  try {
                                    await dataService.delete('medicines', medicine.id);
                                    toast.success('Medicine deleted successfully');
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error deleting medicine:', error);
                                    toast.error('Failed to delete medicine');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Prescriptions</CardTitle>
                <CardDescription>Prescriptions to fulfill</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {prescriptions.map((prescription) => {
                    const patientName = getPatientName(prescription.patientId);
                    const medications = Array.isArray(prescription.medicines) 
                      ? prescription.medicines 
                      : (Array.isArray(prescription.medications) 
                          ? prescription.medications 
                          : []);
                    return (
                      <div key={prescription.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium">Patient: {patientName}</p>
                            <p className="text-sm text-gray-600">Prescribed by: {prescription.doctorName || `Doctor ${prescription.doctorId}`}</p>
                            <p className="text-sm text-gray-500">Date: {prescription.issuedDate?.split('T')[0] || prescription.date || prescription.createdAt?.split('T')[0]}</p>
                            <Badge className="mt-2 bg-blue-500">{prescription.diagnosis || 'N/A'}</Badge>
                          </div>
                          <Button variant="outline">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Create Order
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <p className="font-medium text-sm">Medications:</p>
                          {medications.length > 0 ? (
                            medications.map((med, idx) => {
                              const medName = typeof med === 'string' ? med : med.name || med.medicineName || 'Medicine';
                              const isInStock = medicines.some((m) => 
                                m.name?.toLowerCase().includes(medName.toLowerCase().split(' ')[0]) && 
                                (m.stock || m.stockQuantity || 0) > 0
                              );
                              return (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">{medName}</p>
                                      {typeof med === 'object' && (
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                                          <div>
                                            <p className="text-xs text-gray-500">Dosage</p>
                                            <p>{med.dosage || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Frequency</p>
                                            <p>{med.frequency || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Duration</p>
                                            <p>{med.duration || 'N/A'}</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {isInStock ? (
                                        <Badge className="bg-green-500">In Stock</Badge>
                                      ) : (
                                        <Badge variant="destructive">Out of Stock</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-gray-500">No medications listed</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
