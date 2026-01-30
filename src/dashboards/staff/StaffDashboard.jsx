import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { ClipboardList, Activity, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import dataService from '@/app/services/dataService';
import { toast } from 'sonner';

export function StaffDashboard({ userId }) {
  const [myTasks, setMyTasks] = useState([]);
  const [myVitals, setMyVitals] = useState([]);
  const [myDischargeSummaries, setMyDischargeSummaries] = useState([]);
  const [vitalForm, setVitalForm] = useState({});
  const [dischargeForm, setDischargeForm] = useState({});
  const [completionNotes, setCompletionNotes] = useState('');

  const {
    currentUser,
    tasks,
    vitals,
    dischargeSummaries,
    patients,
    getTasksByAssignee,
    updateItem,
  } = useApp();

  const staffId = currentUser?.id?.toString() || currentUser?.userId?.toString() || userId?.toString();
  
  // Load tasks for this staff member
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasksData = await getTasksByAssignee(staffId);
        setMyTasks(tasksData || []);
      } catch (error) {
        console.error('Error loading tasks:', error);
        setMyTasks([]);
      }
    };
    loadTasks();
  }, [staffId, getTasksByAssignee]);

  // Load vitals (medical records with recordType='vitals')
  useEffect(() => {
    const loadVitals = async () => {
      try {
        const vitalsData = await dataService.getByField('vitals', 'recordType', 'vitals');
        setMyVitals(vitalsData || []);
      } catch (error) {
        console.error('Error loading vitals:', error);
        setMyVitals([]);
      }
    };
    loadVitals();
  }, []);

  // Load discharge summaries (medical records with recordType='dischargesummary')
  useEffect(() => {
    const loadDischargeSummaries = async () => {
      try {
        const summariesData = await dataService.getByField('dischargeSummaries', 'recordType', 'dischargesummary');
        setMyDischargeSummaries(summariesData || []);
      } catch (error) {
        console.error('Error loading discharge summaries:', error);
        setMyDischargeSummaries([]);
      }
    };
    loadDischargeSummaries();
  }, []);

  // Helper to get patient name by ID
  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.id?.toString() === patientId?.toString());
    return patient?.name || patient?.firstName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : `Patient ${patientId}`;
  };

  const staffName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    'Staff Member';
  const pendingTasks = myTasks.filter((t) => t.status === 'pending');
  const inProgressTasks = myTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {staffName}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTasks.length}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <p className="text-xs text-gray-500 mt-1">Currently working on</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-gray-500 mt-1">Tasks finished</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myTasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length}</div>
              <p className="text-xs text-gray-500 mt-1">Urgent tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Tasks
              </CardTitle>
              <CardDescription>{pendingTasks.length} tasks waiting</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {getPatientName(task.patientId)}</p>
                          )}
                          {task.patientName && !task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {task.patientName}</p>
                          )}
                        </div>
                        <Badge className={getPriorityColor(task.priority)} variant="default">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await dataService.update('tasks', task.id, { 
                                status: 'in_progress',
                                details: { ...task.details, status: 'in_progress' }
                              });
                              toast.success('Task started');
                              window.location.reload();
                            } catch (error) {
                              console.error('Error starting task:', error);
                              toast.error('Failed to start task');
                            }
                          }}
                        >
                          Start
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Due: {task.dueDate}</p>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No pending tasks</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* In Progress Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                In Progress
              </CardTitle>
              <CardDescription>{inProgressTasks.length} tasks in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {inProgressTasks.map((task) => (
                    <div key={task.id} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {getPatientName(task.patientId)}</p>
                          )}
                          {task.patientName && !task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {task.patientName}</p>
                          )}
                        </div>
                        <Badge className={getPriorityColor(task.priority)} variant="default">
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        {task.type === 'vitals' ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                Record Vitals
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Record Patient Vitals</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Patient: {getPatientName(task.patientId) || task.patientName}</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Blood Pressure</Label>
                                    <Input 
                                      placeholder="Enter blood pressure (e.g., 120/80)" 
                                      className="mt-2"
                                      value={vitalForm.bloodPressure || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, bloodPressure: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Heart Rate (bpm)</Label>
                                    <Input 
                                      placeholder="Enter heart rate" 
                                      type="number" 
                                      className="mt-2"
                                      value={vitalForm.heartRate || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, heartRate: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Temperature (°F)</Label>
                                    <Input 
                                      placeholder="Enter temperature" 
                                      type="number" 
                                      step="0.1" 
                                      className="mt-2"
                                      value={vitalForm.temperature || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, temperature: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Oxygen Saturation (%)</Label>
                                    <Input 
                                      placeholder="Enter oxygen saturation" 
                                      type="number" 
                                      className="mt-2"
                                      value={vitalForm.oxygenSaturation || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, oxygenSaturation: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Respiratory Rate</Label>
                                    <Input 
                                      placeholder="Enter respiratory rate" 
                                      type="number" 
                                      className="mt-2"
                                      value={vitalForm.respiratoryRate || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, respiratoryRate: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Weight (kg)</Label>
                                    <Input 
                                      placeholder="Enter weight" 
                                      type="number" 
                                      className="mt-2"
                                      value={vitalForm.weight || ''}
                                      onChange={(e) => setVitalForm({...vitalForm, weight: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Notes</Label>
                                  <Textarea 
                                    placeholder="Any observations..." 
                                    className="mt-2"
                                    value={vitalForm.notes || ''}
                                    onChange={(e) => setVitalForm({...vitalForm, notes: e.target.value})}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={async () => {
                                    try {
                                      // Create medical record for vitals
                                      await dataService.create('vitals', {
                                        patientId: task.patientId,
                                        doctorId: currentUser?.doctorId || currentUser?.id,
                                        recordType: 'vitals',
                                        description: JSON.stringify(vitalForm),
                                        dateRecorded: new Date().toISOString()
                                      });
                                      // Complete the task
                                      await dataService.update('tasks', task.id, { 
                                        status: 'completed',
                                        details: { ...task.details, status: 'completed', completedAt: new Date().toISOString() }
                                      });
                                      toast.success('Vitals recorded and task completed');
                                      setVitalForm({});
                                      window.location.reload();
                                    } catch (error) {
                                      console.error('Error recording vitals:', error);
                                      toast.error('Failed to record vitals');
                                    }
                                  }}
                                >
                                  Save Vitals & Complete Task
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : task.type === 'discharge' ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                Update Summary
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Discharge Summary</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Patient: {getPatientName(task.patientId) || task.patientName}</Label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Admission Date</Label>
                                    <Input 
                                      type="date" 
                                      className="mt-2"
                                      value={dischargeForm.admissionDate || ''}
                                      onChange={(e) => setDischargeForm({...dischargeForm, admissionDate: e.target.value})}
                                    />
                                  </div>
                                  <div>
                                    <Label>Discharge Date</Label>
                                    <Input 
                                      type="date" 
                                      className="mt-2"
                                      value={dischargeForm.dischargeDate || ''}
                                      onChange={(e) => setDischargeForm({...dischargeForm, dischargeDate: e.target.value})}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Primary Diagnosis</Label>
                                  <Input 
                                    placeholder="Primary diagnosis..." 
                                    className="mt-2"
                                    value={dischargeForm.primaryDiagnosis || ''}
                                    onChange={(e) => setDischargeForm({...dischargeForm, primaryDiagnosis: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Follow-up Instructions</Label>
                                  <Textarea 
                                    placeholder="Instructions for patient..." 
                                    className="mt-2"
                                    value={dischargeForm.followUpInstructions || ''}
                                    onChange={(e) => setDischargeForm({...dischargeForm, followUpInstructions: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Dietary Advice</Label>
                                  <Textarea 
                                    placeholder="Diet recommendations..." 
                                    className="mt-2"
                                    value={dischargeForm.dietaryAdvice || ''}
                                    onChange={(e) => setDischargeForm({...dischargeForm, dietaryAdvice: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Activity Restrictions</Label>
                                  <Textarea 
                                    placeholder="Any restrictions..." 
                                    className="mt-2"
                                    value={dischargeForm.activityRestrictions || ''}
                                    onChange={(e) => setDischargeForm({...dischargeForm, activityRestrictions: e.target.value})}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={async () => {
                                    try {
                                      // Create or update medical record for discharge summary
                                      await dataService.create('dischargeSummaries', {
                                        patientId: task.patientId,
                                        doctorId: currentUser?.doctorId || currentUser?.id,
                                        recordType: 'dischargesummary',
                                        description: JSON.stringify(dischargeForm),
                                        dateRecorded: new Date().toISOString()
                                      });
                                      // Complete the task
                                      await dataService.update('tasks', task.id, { 
                                        status: 'completed',
                                        details: { ...task.details, status: 'completed', completedAt: new Date().toISOString() }
                                      });
                                      toast.success('Discharge summary saved and task completed');
                                      setDischargeForm({});
                                      window.location.reload();
                                    } catch (error) {
                                      console.error('Error saving discharge summary:', error);
                                      toast.error('Failed to save discharge summary');
                                    }
                                  }}
                                >
                                  Save & Complete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="flex-1">
                                Complete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Complete Task</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Task: {task.title}</Label>
                                </div>
                                <div>
                                  <Label>Completion Notes</Label>
                                  <Textarea 
                                    placeholder="Add any notes about task completion..." 
                                    className="mt-2"
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                  />
                                </div>
                                <Button 
                                  className="w-full"
                                  onClick={async () => {
                                    try {
                                      await dataService.update('tasks', task.id, { 
                                        status: 'completed',
                                        details: { 
                                          ...task.details, 
                                          status: 'completed', 
                                          completedAt: new Date().toISOString(),
                                          notes: completionNotes
                                        }
                                      });
                                      toast.success('Task completed');
                                      setCompletionNotes('');
                                      window.location.reload();
                                    } catch (error) {
                                      console.error('Error completing task:', error);
                                      toast.error('Failed to complete task');
                                    }
                                  }}
                                >
                                  Mark as Complete
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                  {inProgressTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No tasks in progress</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed
              </CardTitle>
              <CardDescription>{completedTasks.length} tasks completed</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="border border-green-200 rounded-lg p-3 bg-green-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title}</p>
                          {task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {getPatientName(task.patientId)}</p>
                          )}
                          {task.patientName && !task.patientId && (
                            <p className="text-xs text-gray-600 mt-1">Patient: {task.patientName}</p>
                          )}
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                        <Badge className="bg-green-600">completed</Badge>
                      </div>
                      {task.completedAt && (
                        <p className="text-xs text-green-600 mt-2">Completed: {task.completedAt}</p>
                      )}
                      {task.notes && (
                        <div className="mt-2 p-2 bg-white rounded text-xs">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  {completedTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardList className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No completed tasks yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Recent Vitals Recorded */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Vitals Recorded</CardTitle>
            <CardDescription>Patient vitals you have recorded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myVitals.length > 0 ? myVitals.map((vital, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{getPatientName(vital.patientId) || vital.patientName}</p>
                      <p className="text-sm text-gray-600">{vital.recordedAt || vital.createdAt?.split('T')[0]}</p>
                    </div>
                    <Badge className="bg-blue-500">Vitals</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
                      <p className="font-medium">{vital.bloodPressure}</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Heart Rate</p>
                      <p className="font-medium">{vital.heartRate} bpm</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Temperature</p>
                      <p className="font-medium">{vital.temperature}°F</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">SpO2</p>
                      <p className="font-medium">{vital.oxygenSaturation}%</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Respiratory Rate</p>
                      <p className="font-medium">{vital.respiratoryRate}/min</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Weight</p>
                      <p className="font-medium">{vital.weight} kg</p>
                    </div>
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500 mb-1">Height</p>
                      <p className="font-medium">{vital.height} cm</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No vitals recorded yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discharge Summaries */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Discharge Summaries</CardTitle>
            <CardDescription>Manage patient discharge documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myDischargeSummaries.length > 0 ? myDischargeSummaries.map((summary) => (
                <div key={summary.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium">{getPatientName(summary.patientId) || summary.patientName}</p>
                      <p className="text-sm text-gray-600">
                        Admitted: {summary.admissionDate || 'N/A'} | Discharged: {summary.dischargeDate || 'N/A'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(summary.status || 'draft')}>{summary.status || 'draft'}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Primary Diagnosis:</p>
                      <p className="text-sm text-gray-600">{summary.primaryDiagnosis}</p>
                    </div>
                    {summary.secondaryDiagnosis && summary.secondaryDiagnosis.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Secondary Diagnosis:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {summary.secondaryDiagnosis.map((diagnosis, idx) => (
                            <Badge key={idx} variant="secondary">
                              {diagnosis}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">Procedures:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {summary.procedures.map((procedure, idx) => (
                          <Badge key={idx} variant="outline">
                            {procedure}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {summary.status === 'draft' && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          Edit Summary
                        </Button>
                        <Button size="sm">Submit for Review</Button>
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No discharge summaries yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
