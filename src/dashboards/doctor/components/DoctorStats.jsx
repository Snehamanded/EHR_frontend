import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export function DoctorStats({ todayAppointments, patients, tasks, pendingReviews }) {
  return (
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
          <div className="text-2xl font-bold">{tasks.filter((t) => t.status === 'pending').length}</div>
          <p className="text-xs text-gray-500 mt-1">{tasks.filter((t) => t.priority === 'high').length} high priority</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingReviews.length}</div>
          <p className="text-xs text-gray-500 mt-1">AI analyses to review</p>
        </CardContent>
      </Card>
    </div>
  );
}