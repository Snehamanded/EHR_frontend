import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import {
  Calendar,
  DollarSign,
  FileText,
  Users,
  CheckCircle,
  Clock,
  UserCheck,
  CreditCard,
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import dataService from '@/app/services/dataService';
import { toast } from 'sonner';

export function ReceptionistDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [billingRecords, setBillingRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newApptPatientId, setNewApptPatientId] = useState('');
  const [newApptDoctorId, setNewApptDoctorId] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');

  const {
    currentUser,
    appointments,
    patients,
    dischargeSummaries,
    addItem,
    updateItem,
  } = useApp();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Load billing records and doctors on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [billings, doctorsList] = await Promise.all([
          dataService.getAllBillingRecords(),
          dataService.getAllDoctors(),
        ]);
        setBillingRecords(billings);
        setDoctors(doctorsList);
      } catch (error) {
        console.error('Error loading receptionist data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const confirmedAppointments = appointments.filter((a) => a.status === 'confirmed');
  const todayAppointments = appointments.filter((a) => {
    const appointmentDate = a.appointmentDate?.split('T')[0] || a.date;
    return appointmentDate === today;
  });
  const waitingPatients = todayAppointments.filter((a) => a.status === 'confirmed');

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Transform billing records for display
  const transformedBillings = billingRecords.map((bill) => {
    const patient = patients.find((p) => p.id?.toString() === bill.patientId?.toString());
    return {
      id: bill.id,
      patientId: bill.patientId,
      patientName: patient?.name || `Patient ${bill.patientId}`,
      date: bill.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      services: bill.description ? [bill.description] : ['Service'],
      amount: bill.amount || 0,
      paymentStatus: bill.status?.toLowerCase() || 'pending',
    };
  });

  // Helper to get patient name by ID
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id?.toString() === patientId?.toString());
    return patient?.name || `Patient ${patientId}`;
  };

  // Handlers
  const handleAppointmentStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await dataService.update('appointments', appointmentId, { status: newStatus });
      toast.success(`Appointment ${newStatus}`);
      // Refresh appointments
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleCreateAppointment = async () => {
    try {
      if (!newApptPatientId || !newApptDoctorId || !newApptDate || !newApptTime) {
        toast.error('Please select patient, doctor, date and time');
        return;
      }

      const appointmentPayload = {
        patientId: newApptPatientId,
        doctorId: newApptDoctorId,
        date: newApptDate,
        time: newApptTime,
        appointmentType: 'onsite',
      };

      await dataService.create('appointments', appointmentPayload);
      toast.success('Appointment created');

      // Clear form
      setNewApptPatientId('');
      setNewApptDoctorId('');
      setNewApptDate('');
      setNewApptTime('');

      // Simple refresh so lists pick up the new appointment
      window.location.reload();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Failed to create appointment');
    }
  };

  const handleRecordPayment = async (billingId) => {
    try {
      await dataService.updateBillingRecord(billingId, { 
        status: 'paid',
        paidAt: new Date().toISOString()
      });
      toast.success('Payment recorded');
      // Refresh billing records
      const updated = await dataService.getAllBillingRecords();
      setBillingRecords(updated);
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const receptionistName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    'there';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {receptionistName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Patient Queue
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Calendar className="h-4 w-4 mr-2" />
                    New Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => {
                            const patientName = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
                            return (
                              <SelectItem key={patient.id} value={patient.id} onClick={() => setNewApptPatientId(patient.id)}>
                                {patientName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Doctor</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => {
                            const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name;
                            return (
                              <SelectItem key={doctor.id} value={doctor.id} onClick={() => setNewApptDoctorId(doctor.id)}>
                                {doctorName} {doctor.specialization ? `(${doctor.specialization})` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        className="mt-2"
                        value={newApptDate}
                        onChange={(e) => setNewApptDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Time</Label>
                      <Input
                        type="time"
                        className="mt-2"
                        value={newApptTime}
                        onChange={(e) => setNewApptTime(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleCreateAppointment} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Appointment'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAppointments.length}</div>
              <p className="text-xs text-gray-500 mt-1">{waitingPatients.length} waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingAppointments.length}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-gray-500 mt-1">Registered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${transformedBillings.filter((b) => b.paymentStatus === 'pending').reduce((sum, b) => sum + b.amount, 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">{transformedBillings.filter((b) => b.paymentStatus === 'pending').length} bills</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="discharge">Discharge</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient Queue */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Queue</CardTitle>
                  <CardDescription>Patients waiting for consultation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {waitingPatients.map((appointment, index) => (
                      <div key={appointment.id} className="flex items-center justify-between pb-4 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{appointment.patientName}</p>
                            <p className="text-sm text-gray-600">{appointment.department}</p>
                            <p className="text-xs text-gray-500">Scheduled: {appointment.time}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          <Button variant="outline" size="sm">
                            Call Patient
                          </Button>
                        </div>
                      </div>
                    ))}
                    {waitingPatients.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No patients waiting</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Confirmations</CardTitle>
                  <CardDescription>Appointments awaiting approval</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start justify-between pb-4 border-b last:border-0">
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-sm text-gray-600">{appointment.department}</p>
                          <p className="text-xs text-gray-500">
                            {appointment.date} at {appointment.time}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Type:</span> {appointment.type}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleAppointmentStatusUpdate(appointment.id, 'confirmed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleAppointmentStatusUpdate(appointment.id, 'cancelled')}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
                <CardDescription>Overview of today's operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Appointments</p>
                        <p className="text-2xl font-bold">{todayAppointments.length}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {todayAppointments.filter((a) => a.status === 'completed').length} completed
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold">
                          ${transformedBillings.filter((b) => b.date === today).reduce((sum, b) => sum + b.amount, 0)}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {transformedBillings.filter((b) => b.date === today && b.paymentStatus === 'paid').length} paid bills
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Check-ins</p>
                        <p className="text-2xl font-bold">{confirmedAppointments.length}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Appointments</CardTitle>
                    <CardDescription>Manage patient appointments</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        New Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Appointment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Patient</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient) => (
                            <SelectItem
                              key={patient.id}
                              value={patient.id}
                              onClick={() => setNewApptPatientId(patient.id)}
                            >
                              {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                            </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                      <Label>Doctor</Label>
                      <Select>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => {
                            const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || doctor.name;
                            return (
                              <SelectItem key={doctor.id} value={doctor.id} onClick={() => setNewApptDoctorId(doctor.id)}>
                                {doctorName} {doctor.specialization ? `(${doctor.specialization})` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Date</Label>
                        <Input
                          type="date"
                          className="mt-2"
                          value={newApptDate}
                          onChange={(e) => setNewApptDate(e.target.value)}
                        />
                          </div>
                          <div>
                            <Label>Time</Label>
                        <Input
                          type="time"
                          className="mt-2"
                          value={newApptTime}
                          onChange={(e) => setNewApptTime(e.target.value)}
                        />
                          </div>
                        </div>
                    <Button className="w-full" onClick={handleCreateAppointment} disabled={loading}>
                      {loading ? 'Creating...' : 'Create Appointment'}
                    </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Appointment ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.id}</TableCell>
                        <TableCell>{appointment.patientName}</TableCell>
                        <TableCell>{appointment.doctorName}</TableCell>
                        <TableCell>{appointment.department}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{appointment.date}</p>
                            <p className="text-xs text-gray-500">{appointment.time}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {appointment.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAppointmentStatusUpdate(appointment.id, 'confirmed')}
                              >
                                Confirm
                              </Button>
                            )}
                            {appointment.status === 'confirmed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleAppointmentStatusUpdate(appointment.id, 'completed')}
                              >
                                Check-in
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              Edit
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

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Billing Management</CardTitle>
                    <CardDescription>Patient billing and payments</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <CreditCard className="h-4 w-4 mr-2" />
                        New Bill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Bill</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Patient</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Services</Label>
                          <Input placeholder="e.g., Consultation, X-Ray" className="mt-2" />
                        </div>
                        <div>
                          <Label>Amount ($)</Label>
                          <Input type="number" placeholder="0.00" className="mt-2" />
                        </div>
                        <Button className="w-full">Create Bill</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transformedBillings.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.patientName}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {bill.services.map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">${bill.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={bill.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {bill.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {bill.paymentStatus === 'pending' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleRecordPayment(bill.id)}
                              >
                                Record Payment
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
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

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Records</CardTitle>
                <CardDescription>View and manage patient information</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => {
                      const patientName = patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
                      const age = patient.dateOfBirth ? Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
                      return (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.id}</TableCell>
                          <TableCell>{patientName}</TableCell>
                          <TableCell>
                            {age} / {patient.gender || 'N/A'}
                          </TableCell>
                          <TableCell>{patient.phone || patient.contactNumber || 'N/A'}</TableCell>
                          <TableCell className="text-sm">{patient.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">N/A</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discharge Tab */}
          <TabsContent value="discharge" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discharge Management</CardTitle>
                <CardDescription>Coordinate patient discharge summaries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dischargeSummaries && dischargeSummaries.length > 0 ? (
                    dischargeSummaries.map((summary) => (
                      <div key={summary.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{summary.patientName || `Patient ${summary.patientId}`}</p>
                            <p className="text-sm text-gray-600">
                              Visit Date: {summary.visitDate?.split('T')[0] || summary.createdAt?.split('T')[0]}
                            </p>
                            <Badge className="mt-2">{summary.diagnosis || summary.recordType}</Badge>
                          </div>
                          <Badge className={getStatusColor(summary.status)}>{summary.status || 'pending'}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Doctor:</p>
                            <p className="text-sm">{summary.doctorId ? `Doctor ${summary.doctorId}` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Follow-up Date:</p>
                            <p className="text-sm">{summary.followUpDate?.split('T')[0] || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            View Summary
                          </Button>
                          <Button variant="outline" size="sm">
                            Print
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No discharge summaries available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
