import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  UserPlus,
  Settings,
  FileText,
  BarChart3,
  Shield,
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

export function AdminDashboard({ userId }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [allUsers, setAllUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: '', password: '' });
  const [loading, setLoading] = useState(false);

  const {
    currentUser,
    patients,
    appointments,
    labOrders,
    pharmacyOrders,
    prescriptions,
    doctors,
    getStats,
    addItem,
    updateItem,
  } = useApp();

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await dataService.getAll('users');
        setAllUsers(users || []);
      } catch (error) {
        console.error('Error loading users:', error);
        setAllUsers([]);
      }
    };
    loadUsers();
  }, []);

  // Load audit logs
  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const logs = await dataService.getAll('auditLogs');
        setAuditLogs(logs || []);
      } catch (error) {
        console.error('Error loading audit logs:', error);
        setAuditLogs([]);
      }
    };
    loadAuditLogs();
  }, []);

  const adminName =
    currentUser?.name ||
    [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ') ||
    'Administrator';

  // Helper to get user role from userType
  const getUserRole = (user) => {
    const userTypeName = user.userType?.name?.toLowerCase() || user.role?.toLowerCase() || 'user';
    // Map backend user types to frontend roles
    if (userTypeName.includes('patient')) return 'patient';
    if (userTypeName.includes('doctor')) return 'doctor';
    if (userTypeName.includes('staff') || userTypeName.includes('nurse')) return 'staff';
    if (userTypeName.includes('lab')) return 'lab';
    if (userTypeName.includes('pharmacy')) return 'pharmacy';
    if (userTypeName.includes('reception')) return 'receptionist';
    if (userTypeName.includes('admin')) return 'admin';
    return userTypeName;
  };

  // Helper to get user name
  const getUserName = (user) => {
    return user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  };

  // Get role counts
  const getRoleCount = (role) => {
    return allUsers.filter(u => getUserRole(u) === role).length;
  };

  const totalRevenue =
    pharmacyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) +
    appointments.reduce((sum, appointment) => sum + (appointment.fee || appointment.amount || 0), 0);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500';
      case 'doctor':
        return 'bg-blue-500';
      case 'staff':
        return 'bg-green-500';
      case 'lab':
        return 'bg-yellow-500';
      case 'pharmacy':
        return 'bg-orange-500';
      case 'receptionist':
        return 'bg-pink-500';
      case 'patient':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {adminName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input 
                            placeholder="e.g., Dr. John Smith" 
                            className="mt-2"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input 
                            type="email" 
                            placeholder="Enter email address" 
                            className="mt-2"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input 
                            type="tel" 
                            placeholder="Enter phone number" 
                            className="mt-2"
                            value={userForm.phone}
                            onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select 
                            value={userForm.role}
                            onValueChange={(value) => setUserForm({...userForm, role: value})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Patient">Patient</SelectItem>
                              <SelectItem value="Doctor">Doctor</SelectItem>
                              <SelectItem value="Staff">Staff/Nurse</SelectItem>
                              <SelectItem value="Lab">Laboratory</SelectItem>
                              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                              <SelectItem value="Receptionist">Receptionist</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input 
                            type="password" 
                            placeholder="Enter password" 
                            className="mt-2"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const nameParts = userForm.name.split(' ');
                              const firstName = nameParts[0] || '';
                              const lastName = nameParts.slice(1).join(' ') || '';
                              
                              await dataService.create('users', {
                                firstName,
                                lastName,
                                email: userForm.email,
                                password: userForm.password,
                                mobile: userForm.phone,
                                userType: userForm.role
                              });
                              toast.success('User created successfully');
                              setUserForm({ name: '', email: '', phone: '', role: '', password: '' });
                              window.location.reload();
                            } catch (error) {
                              console.error('Error creating user:', error);
                              toast.error('Failed to create user');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading || !userForm.name || !userForm.email || !userForm.role || !userForm.password}
                        >
                          {loading ? 'Creating...' : 'Create User'}
                        </Button>
                      </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
              <p className="text-xs text-gray-500 mt-1">System-wide</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-600">+15% this month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-600">+22% this month</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent System Activity</CardTitle>
                  <CardDescription>Latest actions across all modules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{log.action}</p>
                          <p className="text-xs text-gray-600">{log.newValue || log.details || 'No details'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {log.user?.name || log.user?.email || `User ${log.userId}`} • {log.createdAt?.split('T')[0] || log.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No audit logs yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>User Distribution by Role</CardTitle>
                  <CardDescription>System user breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { role: 'patient', count: patients.length, color: 'bg-gray-500' },
                      { role: 'doctor', count: getRoleCount('doctor'), color: 'bg-blue-500' },
                      { role: 'staff', count: getRoleCount('staff'), color: 'bg-green-500' },
                      { role: 'lab', count: getRoleCount('lab'), color: 'bg-yellow-500' },
                      { role: 'pharmacy', count: getRoleCount('pharmacy'), color: 'bg-orange-500' },
                      { role: 'receptionist', count: getRoleCount('receptionist'), color: 'bg-pink-500' },
                      { role: 'admin', count: getRoleCount('admin'), color: 'bg-purple-500' },
                    ].map((item) => {
                      const totalUsers = allUsers.length + patients.length;
                      return (
                        <div key={item.role}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{item.role}</span>
                            <span className="text-sm text-gray-600">{item.count} users</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${item.color} h-2 rounded-full`}
                              style={{ width: totalUsers > 0 ? `${(item.count / totalUsers) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Lab Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{labOrders.length}</div>
                  <p className="text-sm text-gray-500 mt-1">Total orders</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">
                      Completed: {labOrders.filter((o) => o.status === 'completed').length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{prescriptions.length}</div>
                  <p className="text-sm text-gray-500 mt-1">Total issued</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">By {getRoleCount('doctor')} doctors</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pharmacy Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${pharmacyOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Total sales</p>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">{pharmacyOrders.length} orders</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Users</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input 
                            placeholder="e.g., Dr. John Smith" 
                            className="mt-2"
                            value={userForm.name}
                            onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input 
                            type="email" 
                            placeholder="Enter email address" 
                            className="mt-2"
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input 
                            type="tel" 
                            placeholder="Enter phone number" 
                            className="mt-2"
                            value={userForm.phone}
                            onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select 
                            value={userForm.role}
                            onValueChange={(value) => setUserForm({...userForm, role: value})}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Patient">Patient</SelectItem>
                              <SelectItem value="Doctor">Doctor</SelectItem>
                              <SelectItem value="Staff">Staff/Nurse</SelectItem>
                              <SelectItem value="Lab">Laboratory</SelectItem>
                              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                              <SelectItem value="Receptionist">Receptionist</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Password</Label>
                          <Input 
                            type="password" 
                            placeholder="Enter password" 
                            className="mt-2"
                            value={userForm.password}
                            onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                          />
                        </div>
                        <Button 
                          className="w-full"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              const nameParts = userForm.name.split(' ');
                              const firstName = nameParts[0] || '';
                              const lastName = nameParts.slice(1).join(' ') || '';
                              
                              await dataService.create('users', {
                                firstName,
                                lastName,
                                email: userForm.email,
                                password: userForm.password,
                                mobile: userForm.phone,
                                userType: userForm.role
                              });
                              toast.success('User created successfully');
                              setUserForm({ name: '', email: '', phone: '', role: '', password: '' });
                              window.location.reload();
                            } catch (error) {
                              console.error('Error creating user:', error);
                              toast.error('Failed to create user');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading || !userForm.name || !userForm.email || !userForm.role || !userForm.password}
                        >
                          {loading ? 'Creating...' : 'Create User'}
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
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{getUserName(user)}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(getUserRole(user))}>{getUserRole(user)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                // TODO: Implement edit user
                                toast.info('Edit user functionality coming soon');
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => {
                                if (confirm('Are you sure you want to remove this user?')) {
                                  try {
                                    await dataService.delete('users', user.id);
                                    toast.success('User removed');
                                    window.location.reload();
                                  } catch (error) {
                                    console.error('Error removing user:', error);
                                    toast.error('Failed to remove user');
                                  }
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Appointment Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Appointments</span>
                      <span className="font-bold">{appointments.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed</span>
                      <span className="font-bold text-green-600">
                        {appointments.filter((a) => a.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Confirmed</span>
                      <span className="font-bold text-blue-600">
                        {appointments.filter((a) => a.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="font-bold text-yellow-600">
                        {appointments.filter((a) => a.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cancelled</span>
                      <span className="font-bold text-red-600">
                        {appointments.filter((a) => a.status === 'cancelled').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Consultations</span>
                      <span className="font-bold">${appointments.reduce((sum, appointment) => sum + (appointment.fee || appointment.amount || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Lab Tests</span>
                      <span className="font-bold">${labOrders.reduce((sum, order) => sum + (order.fee || order.amount || order.totalAmount || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pharmacy</span>
                      <span className="font-bold">
                        ${pharmacyOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Total Revenue</span>
                        <span className="font-bold text-lg">${totalRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Avg. Appointments/Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(appointments.length / 30).toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Patient Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Avg. Wait Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15 min</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Patient Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8/5</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Audit Logs
                </CardTitle>
                <CardDescription>Track all system actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.id}</TableCell>
                        <TableCell>{log.user?.name || log.user?.email || `User ${log.userId}`}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="text-sm text-gray-600">{log.newValue || log.details || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.entity || log.type || 'general'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.createdAt?.split('T')[0] || log.timestamp}</TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Manage system-wide settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Hospital Name</Label>
                      <Input defaultValue="" className="mt-2" />
                    </div>
                    <div>
                      <Label>Contact Email</Label>
                      <Input defaultValue="" className="mt-2" />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input defaultValue="" className="mt-2" />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input defaultValue="" className="mt-2" />
                    </div>
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Management</CardTitle>
                  <CardDescription>Configure hospital departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Cardiology', 'Pulmonology', 'Orthopedics', 'Neurology', 'Pediatrics'].map((dept) => (
                      <div key={dept} className="flex items-center justify-between p-3 border rounded">
                        <span className="font-medium">{dept}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      Add Department
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage security and access control</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Require 2FA for all users</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Session Timeout</p>
                        <p className="text-sm text-gray-600">Auto logout after inactivity</p>
                      </div>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 mins</SelectItem>
                          <SelectItem value="30">30 mins</SelectItem>
                          <SelectItem value="60">60 mins</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password Policy</p>
                        <p className="text-sm text-gray-600">Enforce strong passwords</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Backup</CardTitle>
                  <CardDescription>Manage data backup and recovery</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Last backup: {new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                      <Button>Backup Now</Button>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="font-medium mb-2">Automatic Backups</p>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-4 border-t">
                      <Button variant="outline" className="w-full">
                        Export All Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
