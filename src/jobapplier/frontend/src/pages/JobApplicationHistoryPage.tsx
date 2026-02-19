import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Briefcase, Plus, Trash2, ChevronRight, Loader2,
  CheckCircle2, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { createApplication } from '@/lib/api';

type ApplicationStatus = 'applied' | 'interviewing' | 'offered' | 'rejected' | 'accepted';
type SearchStatus = 'just-starting' | 'actively-applying' | 'casual';

interface PastApplication {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  appliedAt: string;
  notes: string;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'applied',      label: 'Applied',      color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  { value: 'interviewing', label: 'Interviewing',  color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  { value: 'offered',      label: 'Offered',       color: 'bg-green-500/10 text-green-600 border-green-500/30' },
  { value: 'rejected',     label: 'Rejected',      color: 'bg-red-500/10 text-red-500 border-red-500/30' },
  { value: 'accepted',     label: 'Accepted',      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
];

const SEARCH_STATUS_OPTIONS: { value: SearchStatus; label: string; description: string }[] = [
  { value: 'just-starting',     label: 'Just Starting',     description: "I'm new to the job search or recently graduated" },
  { value: 'actively-applying', label: 'Actively Applying',  description: "I've been applying to jobs and tracking progress" },
  { value: 'casual',            label: 'Casually Browsing',  description: "I'm employed but open to opportunities" },
];

function newEntry(): PastApplication {
  return {
    id: Math.random().toString(36).substr(2, 8),
    company: '',
    role: '',
    status: 'applied',
    appliedAt: new Date().toISOString().split('T')[0],
    notes: '',
  };
}

export default function JobApplicationHistoryPage() {
  const navigate = useNavigate();
  const { user } = useApp();

  const [searchStatus, setSearchStatus] = useState<SearchStatus>('just-starting');
  const [applications, setApplications] = useState<PastApplication[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const addApplication = () => setApplications((prev) => [...prev, newEntry()]);

  const removeApplication = (id: string) =>
    setApplications((prev) => prev.filter((a) => a.id !== id));

  const updateApplication = (id: string, field: keyof PastApplication, value: string) =>
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const validApps = applications.filter((a) => a.company.trim() && a.role.trim());
      if (validApps.length > 0) {
        await Promise.all(
          validApps.map((app) =>
            createApplication({
              userId: user?.id,
              company: app.company,
              role: app.role,
              status: app.status,
              appliedAt: app.appliedAt,
              notes: app.notes,
              source: 'history',
            })
          )
        );
        toast.success(`Saved ${validApps.length} application${validApps.length > 1 ? 's' : ''}`);
      }
      if (user?.id) {
        fetch(`/api/profile/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobSearchStatus: searchStatus }),
        }).catch(() => {});
      }
      navigate('/home');
    } catch (e) {
      console.error(e);
      toast.error('Could not save — continuing anyway');
      navigate('/home');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">tick</span>
          <span>Upload CV</span>
          <div className="flex-1 h-px bg-border" />
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">tick</span>
          <span>Preferences</span>
          <div className="flex-1 h-px bg-border" />
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
          <span className="font-medium text-foreground">Job History</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your Job Search History</h1>
          <p className="text-muted-foreground">
            Helps personalise your dashboard and recommendations. Totally optional.
          </p>
        </div>

        {/* Search status */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">Where are you in your job search?</h2>
            <div className="grid gap-3">
              {SEARCH_STATUS_OPTIONS.map(({ value, label, description }) => (
                <button
                  key={value}
                  onClick={() => setSearchStatus(value)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    searchStatus === value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    searchStatus === value ? 'bg-primary/20' : 'bg-secondary'
                  }`}>
                    <Clock className={`w-5 h-5 ${searchStatus === value ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  {searchStatus === value && (
                    <CheckCircle2 className="w-5 h-5 text-primary ml-auto flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past applications */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent Applications</h2>
              <span className="text-sm text-muted-foreground">Optional</span>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Add any recent job applications you have made</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Input
                          placeholder="Company name *"
                          value={app.company}
                          onChange={(e) => updateApplication(app.id, 'company', e.target.value)}
                          className="mb-2"
                        />
                        <Input
                          placeholder="Job title / Role *"
                          value={app.role}
                          onChange={(e) => updateApplication(app.id, 'role', e.target.value)}
                        />
                      </div>
                      <button
                        onClick={() => removeApplication(app.id)}
                        className="p-2 h-fit hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(({ value, label, color }) => (
                        <button
                          key={value}
                          onClick={() => updateApplication(app.id, 'status', value)}
                          className={`px-3 py-1 rounded-full text-xs border font-medium transition-all ${
                            app.status === value
                              ? color
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Applied on</label>
                        <Input
                          type="date"
                          value={app.appliedAt}
                          onChange={(e) => updateApplication(app.id, 'appliedAt', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                        <Input
                          placeholder="e.g. Recruiter: Jane"
                          value={app.notes}
                          onChange={(e) => updateApplication(app.id, 'notes', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={addApplication} className="w-full border-dashed">
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSaveAndContinue} className="btn-primary flex-1 h-12" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center">Save and Go to Dashboard <ChevronRight className="w-5 h-5 ml-1" /></span>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate('/home')} className="h-12 px-6">
            Skip
          </Button>
        </div>

      </div>
    </div>
  );
}