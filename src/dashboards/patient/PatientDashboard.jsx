import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Calendar,
  FileText,
  TestTube,
  Pill,
  Bell,
  Utensils,
  Activity,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import dataService from '@/app/services/dataService';
import { toast } from 'sonner';

export function PatientDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [patientId, setPatientId] = useState(null);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Local state for patient-specific data
  const [myAppointments, setMyAppointments] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [myLabOrders, setMyLabOrders] = useState([]);
  const [myPrescriptions, setMyPrescriptions] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [myDietPlan, setMyDietPlan] = useState(null);
  const [mySymptomAnalysis, setMySymptomAnalysis] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  
  // Appointment booking form state
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    time: '',
    department: '',
    doctorId: '',
    reason: '',
    type: 'onsite',
  });
  const [doctors, setDoctors] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);

  const {
    addItem,
    updateItem,
    currentUser,
  } = useApp();

  // Initialize: Get patientId from userId
  useEffect(() => {
    const initializePatient = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get patientId from userId
        const patient = await dataService.getPatientByUserId(userId);
        if (patient) {
          setPatientId(patient.id);
          setPatientData(patient);
        } else {
          // If patient not found, try using userId directly as patientId
          setPatientId(userId);
          const patientById = await dataService.getById('patients', userId);
          if (patientById) {
            setPatientData(patientById);
          }
        }
      } catch (err) {
        console.error('Error initializing patient:', err);
        setError('Failed to load patient data');
        // Fallback: use userId as patientId
        setPatientId(userId);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      initializePatient();
    }
  }, [userId]);

  // Load patient-specific data when patientId is available
  useEffect(() => {
    const loadPatientData = async () => {
      if (!patientId) return;

      try {
        setLoading(true);
        
        // Load all patient data in parallel
        const [
          appointments,
          reports,
          labOrders,
          prescriptions,
          notifications,
          dietPlan,
          symptomAnalyses,
          tests,
        ] = await Promise.all([
          dataService.getAppointmentsByPatient(patientId),
          dataService.getDocumentsByPatient(patientId),
          dataService.getLabOrdersByPatient(patientId),
          dataService.getPrescriptionsByPatient(patientId),
          dataService.getNotificationsByUser(userId),
          dataService.getDietPlanByPatient(patientId),
          dataService.getSymptomAnalysesByPatient(patientId),
          dataService.getAll('labTests'), // Get lab test catalog
        ]);

        setMyAppointments(appointments || []);
        setMyReports(reports || []);
        setMyLabOrders(labOrders || []);
        setMyPrescriptions(prescriptions || []);
        setMyNotifications(notifications || []);
        setMyDietPlan(dietPlan);
        setMySymptomAnalysis(symptomAnalyses || []);
        setLabTests(tests || []);
      } catch (err) {
        console.error('Error loading patient data:', err);
        setError('Failed to load patient data');
        toast.error('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [patientId, userId]);

  // Load doctors when component mounts
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const doctorsList = await dataService.getAll('doctors');
        setDoctors(doctorsList || []);
      } catch (err) {
        console.error('Error loading doctors:', err);
      }
    };
    loadDoctors();
  }, []);

  // Filter doctors by department/specialization when department changes
  useEffect(() => {
    if (appointmentForm.department) {
      const departmentMap = {
        'cardiology': ['Cardiology', 'Cardiologist', 'Cardiac'],
        'pulmonology': ['Pulmonology', 'Pulmonologist', 'Respiratory', 'Lung'],
        'orthopedics': ['Orthopedics', 'Orthopedic', 'Orthopedist', 'Bone', 'Joint'],
      };
      const specializations = departmentMap[appointmentForm.department] || [appointmentForm.department];
      const filtered = doctors.filter(doctor => {
        if (!doctor.specialization) return false;
        const doctorSpec = doctor.specialization.toLowerCase();
        return specializations.some(spec => doctorSpec.includes(spec.toLowerCase()));
      });
      setAvailableDoctors(filtered);
      // Reset doctor selection when department changes
      setAppointmentForm(prev => ({ ...prev, doctorId: '' }));
    } else {
      setAvailableDoctors([]);
    }
  }, [appointmentForm.department, doctors]);

  const unreadNotifications = myNotifications.filter(n => !n.read);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleNewAppointment = async () => {
    try {
      // Validate form data
      if (!appointmentForm.date || !appointmentForm.time) {
        throw new Error('Please select date and time for the appointment');
      }
      if (!appointmentForm.doctorId) {
        throw new Error('Please select a doctor for the appointment');
      }
      
      const appointmentPayload = {
        patientId: patientId,
        doctorId: appointmentForm.doctorId,
        appointmentDate: `${appointmentForm.date}T${appointmentForm.time}:00`,
        appointmentType: appointmentForm.type || 'onsite',
        reason: appointmentForm.reason || '',
        status: 'pending',
      };

      const newAppointment = await addItem('appointments', appointmentPayload);
      toast.success('Appointment booked successfully!');
      
      // Reset form
      setAppointmentForm({
        date: '',
        time: '',
        department: '',
        doctorId: '',
        reason: '',
        type: 'onsite',
      });
      
      // Reload appointments
      const appointments = await dataService.getAppointmentsByPatient(patientId);
      setMyAppointments(appointments || []);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || 'Failed to book appointment');
    }
  };

  const handleSymptomAnalysis = async (symptomData) => {
    try {
      const analysisPayload = {
        patientId: patientId,
        doctorId: null, // Will be assigned by doctor
        recordType: 'symptomanalysis',
        description: JSON.stringify({
          symptoms: symptomData.symptoms || [],
          duration: symptomData.duration || '',
          severity: symptomData.severity || 'mild',
          aiAnalysis: symptomData.aiAnalysis || '',
          suggestedDepartment: symptomData.suggestedDepartment || '',
          suggestedDoctors: symptomData.suggestedDoctors || [],
        }),
        dateRecorded: new Date().toISOString(),
      };

      const newAnalysis = await addItem('vitals', analysisPayload); // Using vitals entity for medical records
      toast.success('Symptom analysis submitted successfully!');
      
      // Reload symptom analyses
      const analyses = await dataService.getSymptomAnalysesByPatient(patientId);
      setMySymptomAnalysis(analyses || []);
    } catch (error) {
      console.error('Error creating symptom analysis:', error);
      toast.error(error.message || 'Failed to submit symptom analysis');
    }
  };

  const handleRescheduleAppointment = async (appointmentId, newDate, newTime) => {
    try {
      await updateItem('appointments', appointmentId, {
        appointmentDate: `${newDate}T${newTime}:00`,
      });
      toast.success('Appointment rescheduled successfully!');
      
      // Reload appointments
      const appointments = await dataService.getAppointmentsByPatient(patientId);
      setMyAppointments(appointments || []);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error(error.message || 'Failed to reschedule appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await updateItem('appointments', appointmentId, {
        status: 'cancelled',
      });
      toast.success('Appointment cancelled successfully!');
      
      // Reload appointments
      const appointments = await dataService.getAppointmentsByPatient(patientId);
      setMyAppointments(appointments || []);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.message || 'Failed to cancel appointment');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      if (window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
        await dataService.delete('appointments', appointmentId);
        toast.success('Appointment deleted successfully!');
        
        // Reload appointments
        const appointments = await dataService.getAppointmentsByPatient(patientId);
        setMyAppointments(appointments || []);
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error(error.message || 'Failed to delete appointment');
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      if (window.confirm('Are you sure you want to delete this document?')) {
        await dataService.delete('reports', documentId);
        toast.success('Document deleted successfully!');
        
        // Reload documents
        const reports = await dataService.getDocumentsByPatient(patientId);
        setMyReports(reports || []);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const handleDeleteLabOrder = async (labOrderId) => {
    try {
      if (window.confirm('Are you sure you want to delete this lab order?')) {
        await dataService.delete('labOrders', labOrderId);
        toast.success('Lab order deleted successfully!');
        
        // Reload lab orders
        const labOrders = await dataService.getLabOrdersByPatient(patientId);
        setMyLabOrders(labOrders || []);
      }
    } catch (error) {
      console.error('Error deleting lab order:', error);
      toast.error(error.message || 'Failed to delete lab order');
    }
  };

  const handleBookLabTest = async (testId, testName) => {
    try {
      const labOrderPayload = {
        patientId: patientId,
        testName: testName,
        testId: testId,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'booked',
      };

      await addItem('labOrders', labOrderPayload);
      toast.success('Lab test booked successfully!');
      
      // Reload lab orders
      const labOrders = await dataService.getLabOrdersByPatient(patientId);
      setMyLabOrders(labOrders || []);
    } catch (error) {
      console.error('Error booking lab test:', error);
      toast.error(error.message || 'Failed to book lab test');
    }
  };

  const handleUploadReport = async (file, reportName, reportType) => {
    try {
      // Note: File upload may need FormData handling
      const reportPayload = {
        patientId: patientId,
        name: reportName,
        type: reportType,
        uploadedBy: userId,
        date: new Date().toISOString().split('T')[0],
        status: 'uploaded',
      };

      await addItem('reports', reportPayload);
      toast.success('Report uploaded successfully!');
      
      // Reload reports
      const reports = await dataService.getDocumentsByPatient(patientId);
      setMyReports(reports || []);
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error(error.message || 'Failed to upload report');
    }
  };

  // Loading state
  if (loading && !patientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !patientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Get patient name from patientData or useApp context
  const patientName = patientData 
    ? `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 'Patient'
    : currentUser?.name || currentUser?.firstName || 'Patient';

  // Get complete profile data (merge patientData with currentUser)
  const profileData = patientData || currentUser?.patient || currentUser || {};
  const displayEmail = profileData.email || currentUser?.email;
  const displayPhone = profileData.contactNumber || profileData.phone || currentUser?.phone;
  const displayDateOfBirth = profileData.dateOfBirth || currentUser?.dateOfBirth;
  const displayGender = profileData.gender || currentUser?.gender;
  const displayAddress = profileData.address || currentUser?.address;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {patientName}</p>
              {displayEmail && (
                <p className="text-sm text-gray-500 mt-1">{displayEmail}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 bg-red-500">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <DialogTitle>Patient Profile</DialogTitle>
                      {!isEditingProfile && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsEditingProfile(true);
                            setProfileForm({
                              firstName: profileData.firstName || currentUser?.firstName || '',
                              lastName: profileData.lastName || currentUser?.lastName || '',
                              phone: displayPhone || profileData.contactNumber || '',
                              dateOfBirth: displayDateOfBirth ? new Date(displayDateOfBirth).toISOString().split('T')[0] : '',
                              gender: displayGender || '',
                              address: displayAddress || profileData.address || ''
                            });
                          }}
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </DialogHeader>
                  {isEditingProfile ? (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input 
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input 
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input 
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Date of Birth</Label>
                          <Input 
                            type="date"
                            value={profileForm.dateOfBirth}
                            onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label>Gender</Label>
                          <Select 
                            value={profileForm.gender}
                            onValueChange={(value) => setProfileForm({...profileForm, gender: value})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label>Address</Label>
                          <Input 
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({});
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={async () => {
                            try {
                              await dataService.update('patients', patientId, {
                                firstName: profileForm.firstName,
                                lastName: profileForm.lastName,
                                contactNumber: profileForm.phone,
                                dateOfBirth: profileForm.dateOfBirth,
                                gender: profileForm.gender,
                                address: profileForm.address
                              });
                              toast.success('Profile updated successfully');
                              setIsEditingProfile(false);
                              // Reload patient data
                              const updated = await dataService.getPatientByUserId(userId);
                              if (updated) {
                                setPatientData(updated);
                                setPatientId(updated.id);
                              }
                            } catch (error) {
                              console.error('Error updating profile:', error);
                              toast.error('Failed to update profile');
                            }
                          }}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">First Name</Label>
                          <p className="text-base font-medium">{profileData.firstName || currentUser?.firstName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Last Name</Label>
                          <p className="text-base font-medium">{profileData.lastName || currentUser?.lastName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <p className="text-base">{displayEmail || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Phone</Label>
                          <p className="text-base">{displayPhone || 'N/A'}</p>
                        </div>
                        {displayDateOfBirth && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                            <p className="text-base">{new Date(displayDateOfBirth).toLocaleDateString()}</p>
                          </div>
                        )}
                        {displayGender && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Gender</Label>
                            <p className="text-base">{displayGender}</p>
                          </div>
                        )}
                        {displayAddress && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-gray-500">Address</Label>
                            <p className="text-base">{displayAddress}</p>
                          </div>
                        )}
                        {profileData.type && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Patient Type</Label>
                            <p className="text-base">{profileData.type.name || profileData.type || 'N/A'}</p>
                          </div>
                        )}
                        {profileData.emergencyContact && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                            <p className="text-base">
                              {profileData.emergencyContact.name || profileData.emergencyContact} - {profileData.emergencyContact.phone || 'N/A'}
                            </p>
                          </div>
                        )}
                        {profileData.insuranceRecord && (
                          <div className="col-span-2">
                            <Label className="text-sm font-medium text-gray-500">Insurance</Label>
                            <p className="text-base">
                              {profileData.insuranceRecord.providerName || 'N/A'} - Policy: {profileData.insuranceRecord.policyNumber || 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {myAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled')[0] 
                  ? `Next: ${myAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled')[0].date}`
                  : 'No upcoming appointments'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Lab Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myLabOrders.filter((l) => l.status === 'processing' || l.status === 'booked').length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {(() => {
                  const samplesCollected = myLabOrders.filter((l) => l.status === 'sample_collected').length;
                  return samplesCollected > 0 
                    ? `${samplesCollected} sample${samplesCollected !== 1 ? 's' : ''} collected`
                    : 'No samples collected';
                })()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myPrescriptions.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {myPrescriptions.length > 0 ? `${myPrescriptions.length} medications` : 'No active prescriptions'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Health Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myReports.length}</div>
              <p className="text-xs text-gray-500 mt-1">
                {myReports.length > 0 
                  ? `Last uploaded: ${myReports[0]?.date || 'N/A'}`
                  : 'No reports uploaded'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="labtests">Lab Tests</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="diet">Diet Plan</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest healthcare interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {myNotifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                          <div className="mt-1">
                            {notification.type === 'appointment' && <Calendar className="h-4 w-4 text-blue-500" />}
                            {notification.type === 'lab_result' && <TestTube className="h-4 w-4 text-green-500" />}
                            {notification.type === 'prescription' && <Pill className="h-4 w-4 text-purple-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.date}</p>
                          </div>
                        </div>
                      ))}
                      {myNotifications.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">No recent activity</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="h-20 flex-col">
                          <Calendar className="h-6 w-6 mb-2" />
                          <span className="text-sm">Book Appointment</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Book New Appointment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Date</Label>
                            <Input 
                              type="date" 
                              className="mt-2" 
                              value={appointmentForm.date}
                              onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Time</Label>
                            <Input 
                              type="time" 
                              className="mt-2" 
                              value={appointmentForm.time}
                              onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Department</Label>
                            <Select 
                              value={appointmentForm.department}
                              onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, department: value, doctorId: '' }))}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cardiology">Cardiology</SelectItem>
                                <SelectItem value="pulmonology">Pulmonology</SelectItem>
                                <SelectItem value="orthopedics">Orthopedics</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {appointmentForm.department && (
                            <div>
                              <Label>Doctor</Label>
                              <Select 
                                value={appointmentForm.doctorId}
                                onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, doctorId: value }))}
                              >
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder="Select doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableDoctors.length > 0 ? (
                                    availableDoctors.map((doctor) => (
                                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                        Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>No doctors available for this department</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div>
                            <Label>Reason</Label>
                            <Textarea 
                              placeholder="Brief reason for visit..." 
                              className="mt-2" 
                              value={appointmentForm.reason}
                              onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                            />
                          </div>
                          <Button className="w-full" onClick={handleNewAppointment}>
                            Book Appointment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="h-20 flex-col">
                      <Upload className="h-6 w-6 mb-2" />
                      <span className="text-sm">Upload Report</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <TestTube className="h-6 w-6 mb-2" />
                      <span className="text-sm">Book Lab Test</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Pill className="h-6 w-6 mb-2" />
                      <span className="text-sm">Order Medicine</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myAppointments
                    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
                    .slice(0, 5)
                    .map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{appointment.doctorName || 'Doctor'}</p>
                            <p className="text-sm text-gray-600">{appointment.department || 'Department'}</p>
                            <p className="text-sm text-gray-500">
                              {appointment.date} at {appointment.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRescheduleAppointment(appointment.id, appointment.date, appointment.time)}
                          >
                            Reschedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  {myAppointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No upcoming appointments</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Symptom Analysis Tab */}
          <TabsContent value="symptoms" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Symptom Analysis</CardTitle>
                    <CardDescription>AI-powered symptom checker and department recommendations</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Activity className="h-4 w-4 mr-2" />
                        New Analysis
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Symptom Analysis</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Describe your symptoms</Label>
                          <Textarea placeholder="e.g., Chest pain, headache, fever..." className="mt-2" id="symptoms" />
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <Input placeholder="e.g., 2 days" className="mt-2" id="duration" />
                        </div>
                        <div>
                          <Label>Severity</Label>
                          <Select id="severity">
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="w-full"
                          onClick={() => {
                            const symptoms = document.getElementById('symptoms')?.value || '';
                            const duration = document.getElementById('duration')?.value || '';
                            const severity = document.getElementById('severity')?.value || 'mild';
                            handleSymptomAnalysis({ symptoms: symptoms.split(','), duration, severity });
                          }}
                        >
                          Analyze Symptoms
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mySymptomAnalysis.map((analysis) => {
                    let analysisData = {};
                    try {
                      analysisData = typeof analysis.description === 'string' 
                        ? JSON.parse(analysis.description) 
                        : analysis.description || {};
                    } catch (e) {
                      analysisData = {};
                    }
                    
                    return (
                      <div key={analysis.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={analysisData.severity === 'severe' ? 'destructive' : 'secondary'}>
                                {analysisData.severity || 'mild'}
                              </Badge>
                              <Badge className={getStatusColor(analysis.status || 'pending')}>
                                {analysis.status || 'pending'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">
                              {analysis.dateRecorded?.split('T')[0] || analysis.date || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {analysisData.symptoms && analysisData.symptoms.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-1">Symptoms:</p>
                              <div className="flex flex-wrap gap-2">
                                {analysisData.symptoms.map((symptom, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {symptom}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysisData.aiAnalysis && (
                            <div>
                              <p className="font-medium text-sm mb-1">AI Analysis:</p>
                              <p className="text-sm text-gray-700">{analysisData.aiAnalysis}</p>
                            </div>
                          )}
                          {analysisData.suggestedDepartment && (
                            <div>
                              <p className="font-medium text-sm mb-1">Suggested Department:</p>
                              <Badge className="bg-blue-500">{analysisData.suggestedDepartment}</Badge>
                            </div>
                          )}
                          {analysisData.suggestedDoctors && analysisData.suggestedDoctors.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-1">Recommended Doctors:</p>
                              <div className="flex flex-wrap gap-2">
                                {analysisData.suggestedDoctors.map((doctor, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {doctor}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Appointment
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {mySymptomAnalysis.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No symptom analyses yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab - Continue with similar pattern */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>My Appointments</CardTitle>
                    <CardDescription>View and manage your appointments</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Book New Appointment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Date</Label>
                          <Input 
                            type="date" 
                            className="mt-2" 
                            value={appointmentForm.date}
                            onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Time</Label>
                          <Input 
                            type="time" 
                            className="mt-2" 
                            value={appointmentForm.time}
                            onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Department</Label>
                          <Select 
                            value={appointmentForm.department}
                            onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, department: value, doctorId: '' }))}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cardiology">Cardiology</SelectItem>
                              <SelectItem value="pulmonology">Pulmonology</SelectItem>
                              <SelectItem value="orthopedics">Orthopedics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {appointmentForm.department && (
                          <div>
                            <Label>Doctor</Label>
                            <Select 
                              value={appointmentForm.doctorId}
                              onValueChange={(value) => setAppointmentForm(prev => ({ ...prev, doctorId: value }))}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Select doctor" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableDoctors.length > 0 ? (
                                  availableDoctors.map((doctor) => (
                                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" disabled>No doctors available for this department</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label>Reason</Label>
                          <Textarea 
                            placeholder="Brief reason for visit..." 
                            className="mt-2" 
                            value={appointmentForm.reason}
                            onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                          />
                        </div>
                        <Button className="w-full" onClick={handleNewAppointment}>
                          Book Appointment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                            <p className="font-medium">{appointment.doctorName || 'Doctor'}</p>
                            <p className="text-sm text-gray-600">{appointment.department || 'Department'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                {appointment.date} at {appointment.time}
                              </p>
                            </div>
                            <Badge className="mt-2" variant="outline">
                              {appointment.appointmentType || appointment.type || 'onsite'}
                            </Badge>
                            {appointment.reason && (
                              <p className="text-sm text-gray-600 mt-2">
                                <span className="font-medium">Reason:</span> {appointment.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRescheduleAppointment(appointment.id, appointment.date, appointment.time)}
                              >
                                Reschedule
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {myAppointments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No appointments found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medical Reports</CardTitle>
                    <CardDescription>View and upload medical reports</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Medical Report</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Report Name</Label>
                          <Input placeholder="e.g., Blood Test Report" className="mt-2" />
                        </div>
                        <div>
                          <Label>Report Type</Label>
                          <Select>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Lab">Lab Report</SelectItem>
                              <SelectItem value="X-Ray">X-Ray</SelectItem>
                              <SelectItem value="MRI">MRI</SelectItem>
                              <SelectItem value="CT Scan">CT Scan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>File</Label>
                          <Input type="file" className="mt-2" />
                        </div>
                        <Button className="w-full" onClick={() => handleUploadReport(null, 'Report', 'Lab')}>
                          Upload Report
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <FileText className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-gray-600">Type: {report.type}</p>
                          <p className="text-sm text-gray-500">Date: {report.date}</p>
                          {report.uploadedBy && (
                            <p className="text-xs text-gray-400">Uploaded by: {report.uploadedBy}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(report.status || 'uploaded')}>
                          {report.status || 'uploaded'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteDocument(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {myReports.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No reports uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Tests Tab */}
          <TabsContent value="labtests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Lab Tests</CardTitle>
                <CardDescription>Book diagnostic tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {labTests.map((test) => (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {test.category}
                          </Badge>
                        </div>
                        <p className="font-bold text-lg">${test.price || 'N/A'}</p>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{test.description}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Duration: {test.duration || 'N/A'}</p>
                        <Button 
                          size="sm"
                          onClick={() => handleBookLabTest(test.id, test.name)}
                        >
                          Book Test
                        </Button>
                      </div>
                    </div>
                  ))}
                  {labTests.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8 col-span-2">No lab tests available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Lab Orders</CardTitle>
                <CardDescription>Track your lab test status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myLabOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                          <TestTube className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{order.testName}</p>
                          <p className="text-sm text-gray-600">Order Date: {order.orderDate}</p>
                          {order.sampleCollectionDate && (
                            <p className="text-sm text-gray-500">Sample Collected: {order.sampleCollectionDate}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        {order.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            View Results
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteLabOrder(order.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {myLabOrders.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No lab orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Prescriptions</CardTitle>
                <CardDescription>View prescriptions and order medicines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {myPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium">Prescribed by: {prescription.doctorName || 'Doctor'}</p>
                          <p className="text-sm text-gray-600">Date: {prescription.date || prescription.createdAt?.split('T')[0]}</p>
                          {prescription.diagnosis && (
                            <Badge className="mt-2 bg-blue-500">
                              {prescription.diagnosis}
                            </Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <Pill className="h-4 w-4 mr-2" />
                          Order Medicines
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <p className="font-medium text-sm">Medications:</p>
                        {prescription.medications && prescription.medications.length > 0 ? (
                          prescription.medications.map((med) => (
                            <div key={med.id || med.name} className="bg-gray-50 p-3 rounded-lg">
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
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No medications listed</p>
                        )}
                      </div>
                      {prescription.notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm">
                            <span className="font-medium">Notes:</span> {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  {myPrescriptions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">No prescriptions found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diet Plan Tab */}
          <TabsContent value="diet" className="space-y-6">
            {myDietPlan ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Diet Plan</CardTitle>
                      <CardDescription>Personalized nutrition guidance</CardDescription>
                    </div>
                    {myDietPlan.condition && (
                      <Badge className="bg-green-500">{myDietPlan.condition}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {myDietPlan.createdBy && (
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Created by: {myDietPlan.createdBy}</p>
                          <p className="text-sm text-gray-500">
                            Date: {myDietPlan.dateRecorded?.split('T')[0] || myDietPlan.createdAt?.split('T')[0]}
                          </p>
                        </div>
                      </div>
                    )}

                    {(() => {
                      let dietData = {};
                      try {
                        dietData = typeof myDietPlan.description === 'string' 
                          ? JSON.parse(myDietPlan.description) 
                          : myDietPlan.description || {};
                      } catch (e) {
                        dietData = {};
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {dietData.breakfast && dietData.breakfast.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Utensils className="h-5 w-5 text-orange-500" />
                                <p className="font-medium">Breakfast</p>
                              </div>
                              <ul className="space-y-2">
                                {dietData.breakfast.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dietData.lunch && dietData.lunch.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Utensils className="h-5 w-5 text-blue-500" />
                                <p className="font-medium">Lunch</p>
                              </div>
                              <ul className="space-y-2">
                                {dietData.lunch.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dietData.dinner && dietData.dinner.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Utensils className="h-5 w-5 text-purple-500" />
                                <p className="font-medium">Dinner</p>
                              </div>
                              <ul className="space-y-2">
                                {dietData.dinner.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {dietData.snacks && dietData.snacks.length > 0 && (
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Utensils className="h-5 w-5 text-green-500" />
                                <p className="font-medium">Snacks</p>
                              </div>
                              <ul className="space-y-2">
                                {dietData.snacks.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {(() => {
                      let dietData = {};
                      try {
                        dietData = typeof myDietPlan.description === 'string' 
                          ? JSON.parse(myDietPlan.description) 
                          : myDietPlan.description || {};
                      } catch (e) {
                        dietData = {};
                      }

                      return dietData.restrictions && dietData.restrictions.length > 0 ? (
                        <div className="border-t pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <p className="font-medium">Dietary Restrictions</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {dietData.restrictions.map((restriction, idx) => (
                              <Badge key={idx} variant="destructive">
                                {restriction}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Utensils className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No diet plan assigned yet</p>
                  <Button>Request Diet Plan</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
