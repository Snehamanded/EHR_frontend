import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Users,
  FileText,
  ClipboardList,
  UserCheck,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import dataService from '@/app/services/dataService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function DoctorDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);
  const [doctorPatients, setDoctorPatients] = useState([]);
  const [doctorSymptomAnalyses, setDoctorSymptomAnalyses] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState(null);
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    diagnosis: '',
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });

  const {
    currentUser,
    patients,
    reports,
    prescriptions,
    tasks,
    vitals,
    symptomAnalyses, // global fallback
    addItem,
    updateItem,
  } = useApp();

  // Resolve canonical doctorId (Doctor table id)
  useEffect(() => {
    let cancelled = false;

    async function resolveDoctor() {
      try {
        setDoctorError(null);
        const resolved = currentUser?.doctorId || null;

        if (resolved) {
          if (!cancelled) setDoctorId(resolved.toString());
          return;
        }

        // Fallback: use email -> doctor lookup
        const email = currentUser?.email;
        if (!email) return;
        const doctor = await dataService.getDoctorByEmail(email);
        if (!cancelled && doctor?.id) setDoctorId(doctor.id.toString());
      } catch (e) {
        if (!cancelled) setDoctorError(e?.message || 'Failed to resolve doctor profile');
      }
    }

    resolveDoctor();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Load doctor-scoped data via backend filtering
  useEffect(() => {
    let cancelled = false;

    async function loadDoctorData() {
      if (!doctorId) return;
      try {
        setDoctorLoading(true);
        setDoctorError(null);
        const [appts, rx, pats, reviews] = await Promise.all([
          dataService.getAppointmentsByDoctor(doctorId),
          dataService.getPrescriptionsByDoctor(doctorId),
          dataService.getPatientsByDoctor(doctorId),
          dataService.getSymptomAnalysesByDoctor(doctorId),
        ]);
        if (!cancelled) {
          setDoctorAppointments(Array.isArray(appts) ? appts : []);
          setDoctorPrescriptions(Array.isArray(rx) ? rx : []);
          setDoctorPatients(Array.isArray(pats) ? pats : []);
          setDoctorSymptomAnalyses(Array.isArray(reviews) ? reviews : []);
        }
      } catch (e) {
        if (!cancelled) setDoctorError(e?.message || 'Failed to load doctor dashboard data');
      } finally {
        if (!cancelled) setDoctorLoading(false);
      }
    }

    loadDoctorData();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const users = await dataService.getAll('users');
        const staff = users.filter(user => {
          const role = user.userType?.name?.toLowerCase() || user.role?.toLowerCase() || '';
          return role.includes('staff') || role.includes('nurse');
        });
        setStaffMembers(staff || []);
      } catch (error) {
        console.error('Error loading staff members:', error);
        setStaffMembers([]);
      }
    };
    loadStaff();
  }, []);

  const myAppointments = doctorAppointments;
  const todayIso = new Date().toISOString().split('T')[0];
  const todayAppointments = useMemo(
    () => myAppointments.filter((a) => a?.date === todayIso),
    [myAppointments, todayIso]
  );
  const myPrescriptions = doctorPrescriptions;
  // Tasks: backend mapping is not reliable yet; keep client-side as a fallback
  const myTasks = useMemo(() => {
    const did = doctorId?.toString();
    if (!did) return [];
    return (tasks || []).filter((t) => t?.assignedBy?.toString?.() === did || t?.assignerId?.toString?.() === did);
  }, [tasks, doctorId]);
  const effectiveSymptomAnalyses = doctorSymptomAnalyses.length ? doctorSymptomAnalyses : (symptomAnalyses || []);
  const pendingSymptomAnalyses = effectiveSymptomAnalyses.filter((s) => s.status === 'pending');

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-500';
      case 'pending':
      case 'in_progress':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {doctorError && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {doctorError}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back{currentUser?.firstName ? `, Dr. ${currentUser.firstName}` : ''}{doctorLoading ? ' (loading...)' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Today's Schedule
              </Button>
              <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setPrescriptionForm({
                      patientId: '',
                      diagnosis: '',
                      medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                    });
                    setEditingPrescription(null);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Prescription
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPrescription ? 'Edit Prescription' : 'New Prescription'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Patient</Label>
                      <Select 
                        value={prescriptionForm.patientId}
                        onValueChange={(value) => setPrescriptionForm({...prescriptionForm, patientId: value})}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctorPatients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Diagnosis</Label>
                      <Input 
                        value={prescriptionForm.diagnosis}
                        onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                        placeholder="Enter diagnosis"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Medications</Label>
                      {prescriptionForm.medications.map((med, idx) => (
                        <div key={idx} className="border rounded p-4 mt-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Medicine Name</Label>
                              <Input 
                                value={med.name}
                                onChange={(e) => {
                                  const newMeds = [...prescriptionForm.medications];
                                  newMeds[idx].name = e.target.value;
                                  setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                }}
                                placeholder="Medicine name"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Dosage</Label>
                              <Input 
                                value={med.dosage}
                                onChange={(e) => {
                                  const newMeds = [...prescriptionForm.medications];
                                  newMeds[idx].dosage = e.target.value;
                                  setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                }}
                                placeholder="e.g., 500mg"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Frequency</Label>
                              <Input 
                                value={med.frequency}
                                onChange={(e) => {
                                  const newMeds = [...prescriptionForm.medications];
                                  newMeds[idx].frequency = e.target.value;
                                  setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                }}
                                placeholder="e.g., Twice daily"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Duration</Label>
                              <Input 
                                value={med.duration}
                                onChange={(e) => {
                                  const newMeds = [...prescriptionForm.medications];
                                  newMeds[idx].duration = e.target.value;
                                  setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                }}
                                placeholder="e.g., 7 days"
                                className="mt-1"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Instructions</Label>
                              <Textarea 
                                value={med.instructions}
                                onChange={(e) => {
                                  const newMeds = [...prescriptionForm.medications];
                                  newMeds[idx].instructions = e.target.value;
                                  setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                }}
                                placeholder="Special instructions"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          {prescriptionForm.medications.length > 1 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const newMeds = prescriptionForm.medications.filter((_, i) => i !== idx);
                                setPrescriptionForm({...prescriptionForm, medications: newMeds});
                              }}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setPrescriptionForm({
                            ...prescriptionForm,
                            medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                          });
                        }}
                      >
                        Add Medication
                      </Button>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={async () => {
                        try {
                          const prescriptionData = {
                            patientId: parseInt(prescriptionForm.patientId),
                            doctorId: parseInt(doctorId),
                            diagnosis: prescriptionForm.diagnosis,
                            medications: prescriptionForm.medications.filter(m => m.name),
                            date: new Date().toISOString().split('T')[0],
                            status: 'active'
                          };
                          if (editingPrescription) {
                            await dataService.update('prescriptions', editingPrescription.id, prescriptionData);
                            toast.success('Prescription updated successfully');
                          } else {
                            await dataService.create('prescriptions', prescriptionData);
                            toast.success('Prescription created successfully');
                          }
                          setShowPrescriptionDialog(false);
                          // Reload prescriptions
                          const updated = await dataService.getPrescriptionsByDoctor(doctorId);
                          setDoctorPrescriptions(updated || []);
                        } catch (error) {
                          console.error('Error saving prescription:', error);
                          toast.error('Failed to save prescription');
                        }
                      }}>
                        {editingPrescription ? 'Update' : 'Create'} Prescription
                      </Button>
                    </div>
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
              <p className="text-xs text-gray-500 mt-1">
                {todayAppointments.filter((a) => a.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-gray-500 mt-1">Active cases</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTasks.filter((t) => t.status === 'pending').length}</div>
              <p className="text-xs text-gray-500 mt-1">{myTasks.filter((t) => t.priority === 'high').length} high priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSymptomAnalyses.length}</div>
              <p className="text-xs text-gray-500 mt-1">AI analyses to review</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Appointments for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{appointment.patientName}</p>
                                <p className="text-sm text-gray-600">{appointment.department}</p>
                                <p className="text-xs text-gray-500 mt-1">{appointment.time}</p>
                              </div>
                              <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                            </div>
                            {appointment.symptoms && (
                              <p className="text-xs text-gray-600 mt-2">
                                <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Patient Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Patient Activity</CardTitle>
                  <CardDescription>Latest updates from your patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {reports.slice(0, 4).map((report) => (
                        <div key={report.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                          <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{report.patientName}</p>
                            <p className="text-xs text-gray-600">{report.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{report.date}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Tasks</CardTitle>
                    <CardDescription>Tasks assigned to staff</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Assign to Staff</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffMembers.length > 0 ? (
                                staffMembers.map((staff) => (
                                  <SelectItem key={staff.id} value={staff.id?.toString()}>
                                    {staff.name || [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>No staff members available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Patient (Optional)</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctorPatients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Task Type</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vitals">Vitals Check</SelectItem>
                              <SelectItem value="medication">Medication</SelectItem>
                              <SelectItem value="report">Report Collection</SelectItem>
                              <SelectItem value="discharge">Discharge</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input placeholder="Task title" className="mt-2" />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea placeholder="Task description" className="mt-2" />
                        </div>
                        <div>
                          <Label>Priority</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">Assign Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myTasks.filter((t) => t.status !== 'completed').map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.patientName ? `Patient: ${task.patientName}` : 'General Task'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge variant="outline" className="text-xs">
                          Due: {task.dueDate}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
                <CardDescription>View and manage patient records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age/Gender</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Medical History</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctorPatients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.id}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>
                          {patient.age} / {patient.gender}
                        </TableCell>
                        <TableCell>{patient.bloodGroup}</TableCell>
                        <TableCell className="text-sm">{patient.phone}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {patient.medicalHistory.slice(0, 2).map((condition, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPatient(patient.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Patient Details: {patient.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Patient ID</Label>
                                    <p className="text-sm mt-1">{patient.id}</p>
                                  </div>
                                  <div>
                                    <Label>Age / Gender</Label>
                                    <p className="text-sm mt-1">
                                      {patient.age} years / {patient.gender}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Blood Group</Label>
                                    <p className="text-sm mt-1">{patient.bloodGroup}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm mt-1">{patient.phone}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label>Address</Label>
                                    <p className="text-sm mt-1">{patient.address}</p>
                                  </div>
                                  <div>
                                    <Label>Emergency Contact</Label>
                                    <p className="text-sm mt-1">{patient.emergencyContact}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label>Medical History</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {patient.medicalHistory.map((condition, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        {condition}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label>Allergies</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {patient.allergies.map((allergy, idx) => (
                                      <Badge key={idx} variant="destructive">
                                        {allergy}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label>Current Medications</Label>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {patient.currentMedications.map((med, idx) => (
                                      <Badge key={idx} className="bg-blue-500">
                                        {med}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>

                                {/* Recent Vitals */}
                                {vitals.find((v) => v.patientId === patient.id) && (
                                  <div>
                                    <Label>Recent Vitals</Label>
                                    {(() => {
                                      const patientVitals = vitals.find((v) => v.patientId === patient.id);
                                      return patientVitals ? (
                                        <div className="grid grid-cols-4 gap-3 mt-2">
                                          <div className="border rounded p-2">
                                            <p className="text-xs text-gray-500">BP</p>
                                            <p className="text-sm font-medium">{patientVitals.bloodPressure}</p>
                                          </div>
                                          <div className="border rounded p-2">
                                            <p className="text-xs text-gray-500">Heart Rate</p>
                                            <p className="text-sm font-medium">{patientVitals.heartRate} bpm</p>
                                          </div>
                                          <div className="border rounded p-2">
                                            <p className="text-xs text-gray-500">Temp</p>
                                            <p className="text-sm font-medium">{patientVitals.temperature}°F</p>
                                          </div>
                                          <div className="border rounded p-2">
                                            <p className="text-xs text-gray-500">SpO2</p>
                                            <p className="text-sm font-medium">{patientVitals.oxygenSaturation}%</p>
                                          </div>
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                )}

                                {/* Recent Reports */}
                                <div>
                                  <Label>Recent Reports</Label>
                                  <div className="space-y-2 mt-2">
                                    {reports
                                      .filter((r) => r.patientId === patient.id)
                                      .map((report) => (
                                        <div key={report.id} className="flex items-center justify-between border rounded p-2">
                                          <div>
                                            <p className="text-sm font-medium">{report.name}</p>
                                            <p className="text-xs text-gray-500">{report.date}</p>
                                          </div>
                                          <Button variant="outline" size="sm">
                                            View
                                          </Button>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>Manage patient appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`h-12 w-12 rounded-full flex items-center justify-center ${
                              appointment.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                            }`}
                          >
                            <Calendar
                              className={`h-6 w-6 ${
                                appointment.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.patientName}</p>
                            <p className="text-sm text-gray-600">{appointment.department}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                {appointment.date} at {appointment.time}
                              </p>
                            </div>
                            <Badge className="mt-2" variant="outline">
                              {appointment.type}
                            </Badge>
                            {appointment.symptoms && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          {appointment.status !== 'completed' && (
                            <>
                              <Button variant="outline" size="sm">
                                Start Consultation
                              </Button>
                              <Button variant="secondary" size="sm">
                                Mark Complete
                              </Button>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              View Summary
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prescriptions Issued</CardTitle>
                    <CardDescription>View and manage prescriptions</CardDescription>
                  </div>
                  <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setPrescriptionForm({
                          patientId: '',
                          diagnosis: '',
                          medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                        });
                        setEditingPrescription(null);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Prescription
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingPrescription ? 'Edit Prescription' : 'New Prescription'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Patient</Label>
                          <Select 
                            value={prescriptionForm.patientId}
                            onValueChange={(value) => setPrescriptionForm({...prescriptionForm, patientId: value})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {doctorPatients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                  {patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Diagnosis</Label>
                          <Input 
                            value={prescriptionForm.diagnosis}
                            onChange={(e) => setPrescriptionForm({...prescriptionForm, diagnosis: e.target.value})}
                            placeholder="Enter diagnosis"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Medications</Label>
                          {prescriptionForm.medications.map((med, idx) => (
                            <div key={idx} className="border rounded p-4 mt-2 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Medicine Name</Label>
                                  <Input 
                                    value={med.name}
                                    onChange={(e) => {
                                      const newMeds = [...prescriptionForm.medications];
                                      newMeds[idx].name = e.target.value;
                                      setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                    }}
                                    placeholder="Medicine name"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Dosage</Label>
                                  <Input 
                                    value={med.dosage}
                                    onChange={(e) => {
                                      const newMeds = [...prescriptionForm.medications];
                                      newMeds[idx].dosage = e.target.value;
                                      setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                    }}
                                    placeholder="e.g., 500mg"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Frequency</Label>
                                  <Input 
                                    value={med.frequency}
                                    onChange={(e) => {
                                      const newMeds = [...prescriptionForm.medications];
                                      newMeds[idx].frequency = e.target.value;
                                      setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                    }}
                                    placeholder="e.g., Twice daily"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Duration</Label>
                                  <Input 
                                    value={med.duration}
                                    onChange={(e) => {
                                      const newMeds = [...prescriptionForm.medications];
                                      newMeds[idx].duration = e.target.value;
                                      setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                    }}
                                    placeholder="e.g., 7 days"
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-xs">Instructions</Label>
                                  <Textarea 
                                    value={med.instructions}
                                    onChange={(e) => {
                                      const newMeds = [...prescriptionForm.medications];
                                      newMeds[idx].instructions = e.target.value;
                                      setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                    }}
                                    placeholder="Special instructions"
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                              {prescriptionForm.medications.length > 1 && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const newMeds = prescriptionForm.medications.filter((_, i) => i !== idx);
                                    setPrescriptionForm({...prescriptionForm, medications: newMeds});
                                  }}
                                >
                                  Remove
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setPrescriptionForm({
                                ...prescriptionForm,
                                medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                              });
                            }}
                          >
                            Add Medication
                          </Button>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={async () => {
                            try {
                              const prescriptionData = {
                                patientId: parseInt(prescriptionForm.patientId),
                                doctorId: parseInt(doctorId),
                                diagnosis: prescriptionForm.diagnosis,
                                medications: prescriptionForm.medications.filter(m => m.name),
                                date: new Date().toISOString().split('T')[0],
                                status: 'active'
                              };
                              if (editingPrescription) {
                                await dataService.update('prescriptions', editingPrescription.id, prescriptionData);
                                toast.success('Prescription updated successfully');
                              } else {
                                await dataService.create('prescriptions', prescriptionData);
                                toast.success('Prescription created successfully');
                              }
                              setShowPrescriptionDialog(false);
                              // Reload prescriptions
                              const updated = await dataService.getPrescriptionsByDoctor(doctorId);
                              setDoctorPrescriptions(updated || []);
                            } catch (error) {
                              console.error('Error saving prescription:', error);
                              toast.error('Failed to save prescription');
                            }
                          }}>
                            {editingPrescription ? 'Update' : 'Create'} Prescription
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {myPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium">Patient: {prescription.patientName}</p>
                          <p className="text-sm text-gray-600">Date: {prescription.date}</p>
                          <Badge className="mt-2 bg-blue-500">{prescription.diagnosis}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingPrescription(prescription);
                              setPrescriptionForm({
                                patientId: prescription.patientId?.toString() || '',
                                diagnosis: prescription.diagnosis || '',
                                medications: prescription.medications || [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
                              });
                              setShowPrescriptionDialog(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this prescription?')) {
                                try {
                                  await dataService.delete('prescriptions', prescription.id);
                                  toast.success('Prescription deleted successfully');
                                  const updated = await dataService.getPrescriptionsByDoctor(doctorId);
                                  setDoctorPrescriptions(updated || []);
                                } catch (error) {
                                  console.error('Error deleting prescription:', error);
                                  toast.error('Failed to delete prescription');
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium text-sm">Medications:</p>
                        {prescription.medications.map((med) => (
                          <div key={med.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{med.name}</p>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                                  <div>
                                    <p className="text-xs text-gray-500">Dosage</p>
                                    <p>{med.dosage}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Frequency</p>
                                    <p>{med.frequency}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Duration</p>
                                    <p>{med.duration}</p>
                                  </div>
                                </div>
                                {med.instructions && (
                                  <p className="text-xs text-gray-600 mt-2">
                                    <span className="font-medium">Instructions:</span> {med.instructions}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assigned Tasks</CardTitle>
                    <CardDescription>Tasks assigned to staff members</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Assign Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Assign to Staff</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffMembers.length > 0 ? (
                                staffMembers.map((staff) => (
                                  <SelectItem key={staff.id} value={staff.id?.toString()}>
                                    {staff.name || [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>No staff members available</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Patient (Optional)</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select patient" />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Title</Label>
                          <Input placeholder="Task title" className="mt-2" />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea placeholder="Task description" className="mt-2" />
                        </div>
                        <Button className="w-full">Assign Task</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            task.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                            {task.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            {task.patientName && (
                              <p className="text-sm text-gray-500 mt-1">Patient: {task.patientName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {task.type}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Due: {task.dueDate}</p>
                            {task.completedAt && (
                              <p className="text-xs text-green-600 mt-1">Completed: {task.completedAt}</p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      </div>
                      {task.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span> {task.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis Reviews</CardTitle>
                <CardDescription>Review and approve symptom analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(symptomAnalyses || []).map((analysis) => (
                    <div key={analysis.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{patients.find(p => p.id === analysis.patientId)?.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={analysis.severity === 'severe' ? 'destructive' : 'secondary'}>
                              {analysis.severity}
                            </Badge>
                            <Badge className={getStatusColor(analysis.status)}>{analysis.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{analysis.date}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-sm mb-1">Symptoms:</p>
                          <div className="flex flex-wrap gap-2">
                            {(analysis.symptoms || []).map((symptom, idx) => (
                              <Badge key={idx} variant="outline">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">AI Analysis:</p>
                          <p className="text-sm text-gray-700">{analysis.aiAnalysis}</p>
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">Suggested Department:</p>
                          <Badge className="bg-blue-500">{analysis.suggestedDepartment}</Badge>
                        </div>
                        {analysis.status === 'pending' && (
                          <div className="flex gap-2 mt-4">
                            <Button variant="default" size="sm">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit & Approve
                            </Button>
                            <Button variant="destructive" size="sm">
                              Reject
                            </Button>
                          </div>
                        )}
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
