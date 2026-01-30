import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

export function PatientStats({ appointments, labOrders, prescriptions, reports }) {
  // Get next upcoming appointment
  const upcomingAppointments = appointments
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => {
      const dateA = new Date(a.appointmentDate || a.date || 0);
      const dateB = new Date(b.appointmentDate || b.date || 0);
      return dateA - dateB;
    });
  const nextAppointment = upcomingAppointments[0];
  const nextAppointmentDate = nextAppointment 
    ? new Date(nextAppointment.appointmentDate || nextAppointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No upcoming appointments';

  // Get last uploaded report
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.date || a.uploadedDate || 0);
    const dateB = new Date(b.date || b.uploadedDate || 0);
    return dateB - dateA;
  });
  const lastReport = sortedReports[0];
  const lastReportDate = lastReport
    ? new Date(lastReport.date || lastReport.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No reports';

  // Count samples collected
  const samplesCollected = labOrders.filter((l) => 
    l.status === 'sample_collected' || l.status === 'processing' || l.status === 'completed'
  ).length;

  // Count active medications
  const activeMedications = prescriptions.filter((p) => 
    p.status !== 'completed' && p.status !== 'cancelled'
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{appointments.filter((a) => a.status !== 'completed').length}</div>
          <p className="text-xs text-gray-500 mt-1">Next: {nextAppointmentDate}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Pending Lab Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{labOrders.filter((l) => l.status === 'processing').length}</div>
          <p className="text-xs text-gray-500 mt-1">{samplesCollected > 0 ? `${samplesCollected} sample${samplesCollected !== 1 ? 's' : ''} collected` : 'No samples collected'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Active Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{prescriptions.length}</div>
          <p className="text-xs text-gray-500 mt-1">{activeMedications > 0 ? `${activeMedications} medication${activeMedications !== 1 ? 's' : ''} ongoing` : 'No active medications'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Health Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reports.length}</div>
          <p className="text-xs text-gray-500 mt-1">Last uploaded: {lastReportDate}</p>
        </CardContent>
      </Card>
    </div>
  );
}