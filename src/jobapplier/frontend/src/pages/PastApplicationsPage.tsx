import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  ChevronRight,
  Loader2,
  History,
  TrendingUp,
  Award,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createApplication, getMatchScore } from '@/lib/api';

// Application status options
const statusOptions = [
  { value: 'applied', label: 'Applied - Waiting for response', icon: Clock, color: 'bg-blue-500' },
  { value: 'screening', label: 'Phone/HR Screening', icon: Clock, color: 'bg-yellow-500' },
  { value: 'interview', label: 'Interviewing', icon: TrendingUp, color: 'bg-purple-500' },
  { value: 'offer', label: 'Received Offer', icon: Award, color: 'bg-green-500' },
  { value: 'hired', label: 'Hired!', icon: Check, color: 'bg-emerald-500' },
  { value: 'declined', label: 'Not Selected / Rejected', icon: XCircle, color: 'bg-red-500' },
  { value: 'withdrawn', label: 'I Withdrew', icon: XCircle, color: 'bg-gray-500' },
];

interface PastApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  status: string;
  appliedDate: string;
  notes: string;
  wasSuccessful: boolean | null;
  outcomeNotes: string;
  jobDescription: string; 
  matchScore?: number;
}

export default function PastApplicationsPage() {
  const navigate = useNavigate();
  const { user, profile } = useApp(); // Get profile from context for match score calculation
  const [applications, setApplications] = useState<PastApplication[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCalculatingMatch, setIsCalculatingMatch] = useState(false);
  
  // Form state for new application
  const [newApplication, setNewApplication] = useState<Partial<PastApplication>>({
    company: '',
    role: '',
    location: '',
    status: 'applied',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: '',
    wasSuccessful: null,
    outcomeNotes: '',
    jobDescription: ''
  });

  const handleAddApplication = async () => {
    if (!newApplication.company?.trim() || !newApplication.role?.trim()) {
      toast.error('Please enter both company and role');
      return;
    }

    // Calculate match score if job description and profile exist
    let matchScore: number | undefined = undefined;
    if (newApplication.jobDescription?.trim() && profile?.skills && profile.skills.length > 0) {
      setIsCalculatingMatch(true);
      try {
        const result = await getMatchScore(
          { skills: profile.skills },
          newApplication.jobDescription,
          profile?.resumeText || ''
        );
        matchScore = result.match_score ? Math.round(result.match_score * 100) : undefined;
        toast.success(`Match score calculated: ${matchScore}%`);
      } catch (e) {
        console.error('Failed to calculate match score:', e);
        // Don't block adding if match calculation fails
      } finally {
        setIsCalculatingMatch(false);
      }
    }

    const application: PastApplication = {
      id: Date.now().toString(),
      company: newApplication.company!,
      role: newApplication.role!,
      location: newApplication.location || '',
      status: newApplication.status || 'applied',
      appliedDate: newApplication.appliedDate || new Date().toISOString().split('T')[0],
      notes: newApplication.notes || '',
      wasSuccessful: newApplication.wasSuccessful ?? null,
      outcomeNotes: newApplication.outcomeNotes || '',
      jobDescription: newApplication.jobDescription || '',
      matchScore: matchScore
    };

    setApplications([...applications, application]);
    
    // Reset form
    setNewApplication({
      company: '',
      role: '',
      location: '',
      status: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      notes: '',
      wasSuccessful: null,
      outcomeNotes: '',
      jobDescription: ''
    });
    
    setShowAddForm(false);
    toast.success('Application added!');
  };

  const handleRemoveApplication = (id: string) => {
    setApplications(applications.filter(app => app.id !== id));
    toast.success('Application removed');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Please log in again');
      return;
    }

    setIsSubmitting(true);

    try {
      const validApps = applications.filter((a) => a.company.trim() && a.role.trim());
      
      if (validApps.length > 0) {
        await Promise.all(
          validApps.map((app) =>
            createApplication({
              userId: user.id,
              company: app.company,
              role: app.role,
              location: app.location,
              status: app.status,
              appliedAt: new Date(app.appliedDate).toISOString(),
              notes: app.notes,
              source: 'history',
              jobDescription: app.jobDescription || '',  // Include job description (can be empty)
              matchScore: app.matchScore
            })
          )
        );
        toast.success(`Saved ${validApps.length} application${validApps.length > 1 ? 's' : ''}`);
      }
      
      navigate('/home');
    } catch (e) {
      console.error(e);
      toast.error('Could not save — continuing anyway');
      navigate('/home');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/home');
  };

  const getStatusOption = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Past Applications</h1>
            </div>
          </div>
          <p className="text-muted-foreground ml-13">
            Help us understand your job search journey. Add any jobs you've applied to recently.
          </p>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20 mb-8">
          <CardContent className="p-4">
            <p className="text-sm text-primary">
              <strong>Why are we asking?</strong> This helps us:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
              <li>• Better match you with jobs you're likely to get</li>
              <li>• Understand which companies are responding to your applications</li>
              <li>• Track your job search progress over time</li>
              <li>• Provide personalized advice based on your outcomes</li>
            </ul>
          </CardContent>
        </Card>

        {/* Applications List */}
        {applications.length > 0 && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Your Applications ({applications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {applications.map((app) => {
                  const statusOpt = getStatusOption(app.status);
                  const StatusIcon = statusOpt.icon;
                  return (
                    <div 
                      key={app.id} 
                      className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{app.role}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${statusOpt.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusOpt.label}
                          </span>
                          {app.matchScore !== undefined && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary">
                              <TrendingUp className="w-3 h-3" />
                              {app.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {app.company}
                          </span>
                          {app.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {app.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(app.appliedDate).toLocaleDateString('en-ZA')}
                          </span>
                        </div>
                        {app.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{app.notes}</p>
                        )}
                        {app.wasSuccessful !== null && (
                          <div className="mt-2 text-sm">
                            <span className={app.wasSuccessful ? 'text-green-600' : 'text-red-600'}>
                              {app.wasSuccessful ? '✓ Successful outcome' : '✗ Unsuccessful'}
                            </span>
                            {app.outcomeNotes && (
                              <span className="text-muted-foreground"> - {app.outcomeNotes}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveApplication(app.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Application Form */}
        {showAddForm ? (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Add Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-primary">*</span> Company
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Standard Bank"
                      value={newApplication.company}
                      onChange={(e) => setNewApplication({...newApplication, company: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    <span className="text-primary">*</span> Role/Position
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Software Engineer"
                      value={newApplication.role}
                      onChange={(e) => setNewApplication({...newApplication, role: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., Johannesburg"
                      value={newApplication.location}
                      onChange={(e) => setNewApplication({...newApplication, location: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date Applied</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={newApplication.appliedDate}
                      onChange={(e) => setNewApplication({...newApplication, appliedDate: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Status</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setNewApplication({...newApplication, status: opt.value})}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${
                          newApplication.status === opt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Job Description (for match analysis)
                </label>
                <textarea
                  value={newApplication.jobDescription}
                  onChange={(e) => setNewApplication({...newApplication, jobDescription: e.target.value})}
                  placeholder="Paste the job description here. We'll analyze how well you matched this role and calculate a match score."
                  className="w-full h-32 rounded-lg border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Adding the job description helps us calculate your match score and improve future recommendations.
                  {profile?.skills && profile.skills.length > 0 && (
                    <span className="text-primary ml-1">✓ Your profile has skills - match score will be calculated!</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <textarea
                  value={newApplication.notes}
                  onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
                  placeholder="Any details about the application process, recruiter name, etc."
                  className="w-full h-20 rounded-lg border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Outcome Section */}
              <div className="border-t border-border pt-4">
                <label className="block text-sm font-medium mb-2">Do you know the outcome?</label>
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={() => setNewApplication({...newApplication, wasSuccessful: true})}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-all ${
                      newApplication.wasSuccessful === true
                        ? 'border-green-500 bg-green-500/10 text-green-600'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    ✓ I got the job/offer
                  </button>
                  <button
                    onClick={() => setNewApplication({...newApplication, wasSuccessful: false})}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-all ${
                      newApplication.wasSuccessful === false
                        ? 'border-red-500 bg-red-500/10 text-red-600'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    ✗ Not selected
                  </button>
                  <button
                    onClick={() => setNewApplication({...newApplication, wasSuccessful: null})}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-all ${
                      newApplication.wasSuccessful === null
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    Still waiting
                  </button>
                </div>

                {newApplication.wasSuccessful !== null && (
                  <textarea
                    value={newApplication.outcomeNotes}
                    onChange={(e) => setNewApplication({...newApplication, outcomeNotes: e.target.value})}
                    placeholder={newApplication.wasSuccessful ? "What went well? Any tips?" : "Any feedback received?"}
                    className="w-full h-16 rounded-lg border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleAddApplication}
                  className="flex-1"
                  disabled={isCalculatingMatch}
                >
                  {isCalculatingMatch ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isCalculatingMatch ? 'Calculating Match...' : 'Add Application'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            onClick={() => setShowAddForm(true)}
            variant="outline"
            className="w-full mb-6 py-6 border-dashed border-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add a Past Application
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-primary px-8 h-12 text-lg"
            disabled={isSubmitting || applications.length === 0}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <>
                Continue to Jobs
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}