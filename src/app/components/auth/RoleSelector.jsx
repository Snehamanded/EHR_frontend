import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  User,
  Stethoscope,
  UserCog,
  TestTube,
  Pill,
  ClipboardList,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export function RoleSelector({ onRoleSelect, onBack, showBackButton = false }) {
  const roleCards = [
    {
      role: 'patient',
      title: 'Patient Portal',
      description: 'Access your health records, appointments, and medical reports',
      icon: User,
      color: 'bg-blue-500',
    },
    {
      role: 'doctor',
      title: 'Doctor Dashboard',
      description: 'Manage patients, prescriptions, and medical consultations',
      icon: Stethoscope,
      color: 'bg-green-500',
    },
    {
      role: 'staff',
      title: 'Staff Dashboard',
      description: 'Handle assigned tasks, vitals, and discharge summaries',
      icon: UserCog,
      color: 'bg-purple-500',
    },
    {
      role: 'lab',
      title: 'Laboratory',
      description: 'Manage lab tests, reports, and diagnostic services',
      icon: TestTube,
      color: 'bg-yellow-500',
    },
    {
      role: 'pharmacy',
      title: 'Pharmacy',
      description: 'Handle medicine inventory, orders, and prescriptions',
      icon: Pill,
      color: 'bg-orange-500',
    },
    {
      role: 'receptionist',
      title: 'Reception',
      description: 'Manage appointments, billing, and patient flow',
      icon: ClipboardList,
      color: 'bg-pink-500',
    },
    {
      role: 'admin',
      title: 'Admin Panel',
      description: 'System administration, user management, and analytics',
      icon: Shield,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {showBackButton && (
        <div className="mb-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      <div className="text-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Select Your Role</h2>
        <p className="text-sm text-gray-600">Choose your role to access the appropriate dashboard</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.role}
                className="hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 flex flex-col"
                onClick={() => onRoleSelect(card.role)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-10 w-10 ${card.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full text-sm py-2">
                    Continue as {card.title.split(' ')[0]}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}