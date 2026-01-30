import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Award, 
  Shield, 
  Edit, 
  Save, 
  X,
  Key
} from 'lucide-react';
import { useApp } from '@/app/context/AppContext';
import authService from '@/app/services/authService';

export function UserProfile({ onClose }) {
  const { currentUser, setCurrentUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || '',
    specialization: currentUser?.specialization || '',
    licenseNumber: currentUser?.licenseNumber || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await authService.updateProfile(formData);
      setCurrentUser(updatedUser);
      setIsEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      department: currentUser?.department || '',
      specialization: currentUser?.specialization || '',
      licenseNumber: currentUser?.licenseNumber || '',
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      patient: 'Patient',
      doctor: 'Doctor',
      staff: 'Staff Member',
      lab: 'Laboratory Technician',
      pharmacy: 'Pharmacy Staff',
      receptionist: 'Receptionist',
      admin: 'Administrator'
    };
    return roleNames[role] || 'User';
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      patient: 'bg-blue-100 text-blue-800',
      doctor: 'bg-green-100 text-green-800',
      staff: 'bg-purple-100 text-purple-800',
      lab: 'bg-yellow-100 text-yellow-800',
      pharmacy: 'bg-orange-100 text-orange-800',
      receptionist: 'bg-pink-100 text-pink-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <User className="h-6 w-6" />
                User Profile
              </CardTitle>
              <CardDescription>
                Manage your account information and settings
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Role and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getRoleBadgeColor(currentUser.role)}>
                {getRoleDisplayName(currentUser.role)}
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{currentUser.firstName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{currentUser.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              {isEditing ? (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>{currentUser.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>{currentUser.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {(currentUser.department || currentUser.specialization || currentUser.licenseNumber) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                
                {currentUser.department && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{currentUser.department}</span>
                      </div>
                    )}
                  </div>
                )}

                {currentUser.specialization && (
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    {isEditing ? (
                      <Input
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span>{currentUser.specialization}</span>
                      </div>
                    )}
                  </div>
                )}

                {currentUser.licenseNumber && (
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    {isEditing ? (
                      <Input
                        id="licenseNumber"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <Key className="h-4 w-4 text-gray-500" />
                        <span>{currentUser.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Account Information */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">User ID:</span> {currentUser.id}
              </div>
              <div>
                <span className="font-medium">Account Created:</span>{' '}
                {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}