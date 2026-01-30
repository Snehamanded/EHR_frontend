import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Activity, Calendar } from 'lucide-react';

export function SymptomAnalyzer({ symptomAnalyses, getStatusColor }) {
  return (
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
                  <Textarea placeholder="e.g., Chest pain, headache, fever..." className="mt-2" />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input placeholder="e.g., 2 days" className="mt-2" />
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select>
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
                <Button className="w-full">Analyze Symptoms</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {symptomAnalyses.map((analysis) => (
            <div key={analysis.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
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
                    {analysis.symptoms.map((symptom, idx) => (
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
                <div>
                  <p className="font-medium text-sm mb-1">Recommended Doctors:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.suggestedDoctors.map((doctor, idx) => (
                      <Badge key={idx} variant="secondary">
                        {doctor}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}