import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Eye } from 'lucide-react';

export function PatientList({ patients, vitals, reports }) {
  const [selectedPatient, setSelectedPatient] = useState(null);

  return (
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
            {patients.map((patient) => (
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
  );
}