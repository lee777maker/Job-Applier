import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, ArrowUpRight, Sparkles, Loader2,
  MapPin, Building2, TrendingUp, Briefcase,
  Clock, DollarSign, Maximize2, Minimize2,
  X, CheckCircle2, Bookmark, Users,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { neilweChat, searchJobsByProfile, getProfile, createApplication } from '@/lib/api';
import type { Job, ChatMessage } from '@/types';

interface ExtendedProfile {
  suggestedJobTitles?: string[];
  primaryJobTitle?: string;
  [key: string]: any;
}

// ─── Job Application Popup ─────────────────────────────────────────────────────

function JobPopup({
  job,
  onClose,
  onApplied,
}: {
  job: Job;
  onClose: () => void;
  onApplied: (job: Job) => void;
}) {
  const [showDataGathering, setShowDataGathering] = useState(false);
  const [interestLevel, setInterestLevel] = useState<number | null>(null);
  const [reasonInterest, setReasonInterest] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [questions, setQuestions] = useState('');

  const handleOpenJob = () => {
    // Show data gathering questions first
    setShowDataGathering(true);
  };

  const handleSubmitAndOpen = () => {
    // Save the data gathering info
    const jobInterestData = {
      jobId: job.id,
      interestLevel,
      reasonInterest,
      salaryExpectation,
      questions,
      timestamp: new Date().toISOString()
    };
    
    // Store in localStorage for now (can be sent to backend later)
    const existingData = JSON.parse(localStorage.getItem('jobInterestData') || '[]');
    existingData.push(jobInterestData);
    localStorage.setItem('jobInterestData', JSON.stringify(existingData));
    
    // Open the job in new tab
    window.open(job.applicationUrl, '_blank');
    
    // Show toast
    toast.info('Did you apply? Click "Mark as Applied" to track it!', {
      duration: 5000,
    });
  };

  const interestLevels = [
    { value: 1, label: 'Not interested', emoji: '😕' },
    { value: 2, label: 'Somewhat interested', emoji: '🤔' },
    { value: 3, label: 'Interested', emoji: '🙂' },
    { value: 4, label: 'Very interested', emoji: '😃' },
    { value: 5, label: 'Extremely interested!', emoji: '🤩' },
  ];

  if (showDataGathering) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={(e) => e.target === e.currentTarget && setShowDataGathering(false)}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-border sticky top-0 bg-card">
            <div>
              <h2 className="text-xl font-bold text-foreground">Quick Questions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help us find better matches for you
              </p>
            </div>
            <button onClick={() => setShowDataGathering(false)} className="p-2 hover:bg-secondary rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Interest Level */}
            <div>
              <label className="block text-sm font-medium mb-3">
                How interested are you in this position?
              </label>
              <div className="flex justify-between gap-1">
                {interestLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setInterestLevel(level.value)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      interestLevel === level.value
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <span className="text-2xl">{level.emoji}</span>
                    <span className="text-xs mt-1 text-center hidden sm:block">{level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Why interested */}
            <div>
              <label className="block text-sm font-medium mb-2">
                What interests you about this role? (optional)
              </label>
              <textarea
                value={reasonInterest}
                onChange={(e) => setReasonInterest(e.target.value)}
                placeholder="e.g., Great tech stack, company culture, growth opportunities..."
                className="w-full h-20 rounded-lg border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Salary expectation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Does the salary match your expectations? (optional)
              </label>
              <div className="flex gap-2">
                {['Below', 'Matches', 'Above'].map((option) => (
                  <button
                    key={option}
                    onClick={() => setSalaryExpectation(option)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                      salaryExpectation === option
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Any questions about this role? (optional)
              </label>
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="e.g., Remote work policy, team size, tech stack details..."
                className="w-full h-16 rounded-lg border border-border bg-secondary/30 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-border">
            <button
              onClick={handleSubmitAndOpen}
              className="w-full flex items-center justify-center gap-2 p-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity font-semibold"
            >
              <span>Open Job Listing</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Your feedback helps us find better job matches for you!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{job.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.company}</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
              {job.jobType && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.jobType}</span>}
              {job.postedAt && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.postedAt}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Match score */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">{Math.round((job.matchScore || 0) * 100)}% Match</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(job.matchScore || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="px-6 py-4 max-h-40 overflow-y-auto">
            <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Actions</p>
          <div className="grid grid-cols-1 gap-2">
            {/* Open listing */}
            <button
              onClick={handleOpenJob}
              className="flex items-center justify-between gap-3 p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="font-semibold">Open Job Listing</span>
              <ArrowUpRight className="w-5 h-5" />
            </button>

            {/* Mark as applied */}
            <button
              onClick={() => onApplied(job)}
              className="flex items-center justify-between gap-3 p-3 bg-green-500/10 text-green-600 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors"
            >
              <span className="font-semibold">I Applied to This Job</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>

            {/* Save for later */}
            <button
              onClick={() => {
                toast.success('Saved to your job list!');
                onClose();
              }}
              className="flex items-center justify-between gap-3 p-3 bg-secondary border border-border rounded-xl hover:bg-secondary/80 transition-colors text-foreground"
            >
              <span>Save for Later</span>
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Applied confirmation popup ────────────────────────────────────────────────

function AppliedPopup({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const { user } = useApp();
  const [status, setStatus] = useState<'applied' | 'interviewing' | 'offered'>('applied');
  const [notes, setNotes] = useState('');
  const [howDidYouApply, setHowDidYouApply] = useState<'direct' | 'referral' | 'recruiter' | 'other'>('direct');
  const [referralSource, setReferralSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In HomePage.tsx, update the handleSave function in AppliedPopup:

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Please log in again');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build full notes including job description for match calculation
      const fullNotes = `${notes}\n\nHow applied: ${howDidYouApply}${howDidYouApply === 'referral' && referralSource ? ` (${referralSource})` : ''}\n\nJob Description:\n${job.description || 'No description available'}`;
      
      // Ensure all required fields are present
      const applicationData = {
        userId: user.id,
        jobId: job.id,
        company: job.company || 'Unknown Company',
        role: job.title || 'Unknown Role',
        location: job.location || 'Not specified',
        status: status,
        appliedAt: new Date().toISOString(),
        notes: fullNotes,
        wasSuccessful: null, // Will be updated later
        outcomeNotes: '',
        applicationUrl: job.applicationUrl || '',
        source: howDidYouApply,
        // Include job description for AI match score calculation
        jobDescription: job.description || ''
      };

      console.log('Creating application with data:', applicationData);
      
      await createApplication(applicationData);

      toast.success(`Application to ${job.company} tracked!`);
      onClose();
    } catch (error) {
      console.error('Failed to save application:', error);
      toast.error('Could not save application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <h2 className="text-lg font-bold">Track Your Application</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Recording: <strong>{job.title}</strong> at <strong>{job.company}</strong>
          </p>

          <div className="space-y-4 mb-4">
            {/* Current Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['applied', 'interviewing', 'offered'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`py-2 px-3 rounded-lg text-sm capitalize border transition-all ${
                      status === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* How did you apply */}
            <div>
              <label className="block text-sm font-medium mb-2">How did you apply?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'direct', label: 'Company Website', icon: Building2 },
                  { value: 'referral', label: 'Referral', icon: Users },
                  { value: 'recruiter', label: 'Recruiter', icon: Briefcase },
                  { value: 'other', label: 'Other', icon: MessageSquare },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setHowDidYouApply(opt.value as any)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-all ${
                        howDidYouApply === opt.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {howDidYouApply === 'referral' && (
                <Input
                  placeholder="Who referred you?"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Recruiter: Jane Smith, deadline: 28 Feb, next steps..."
                className="w-full h-20 rounded-lg border border-border bg-secondary/30 p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Application
            </Button>
            <Button variant="outline" onClick={onClose}>Skip</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user, jobPreferences, chatMessages, addChatMessage, setRecommendedJobs, profile, setProfile } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [displayedJobsCount, setDisplayedJobsCount] = useState(10);

  // Chat panel dimensions
  const [chatPanelWidth, setChatPanelWidth] = useState(440);  // right column px
  const [chatHeight, setChatHeight] = useState(680);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Resize state refs
  const colResizeRef = useRef<{ x: number; w: number } | null>(null);
  const heightResizeRef = useRef<{ y: number; h: number } | null>(null);

  // Popup state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [appliedJob, setAppliedJob] = useState<Job | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load profile ──
  useEffect(() => {
    if (user?.id && !profile) {
      getProfile(user.id).then((d) => setProfile(d)).catch(console.error);
    }
  }, [user?.id, profile, setProfile]);

  useEffect(() => {
    if (user?.id && profile) fetchJobs();
  }, [user?.id, profile]);

  const fetchJobs = async () => {
    setIsJobsLoading(true);
    try {
      if (!user?.id) return;
      const ext = profile as ExtendedProfile;
      const hasTitles = (ext?.suggestedJobTitles?.length ?? 0) > 0;
      const hasRole = jobPreferences?.preferredRole || ext?.primaryJobTitle;
      let fetched: Job[] = [];

      if (hasTitles || hasRole) {
        try {
          const res = await searchJobsByProfile(
            { ...ext, suggestedJobTitles: ext?.suggestedJobTitles || [], skills: ext?.skills || [] },
            jobPreferences,
            50
          );
          if (res.jobs?.length) {
            fetched = res.jobs.map((j: any) => ({
              id: j.id, title: j.title, company: j.company, location: j.location,
              applicationUrl: j.apply_url || j.applicationUrl,
              matchScore: j.match_score || j.matchScore || 0.75,
              postedAt: j.date_posted || j.postedAt,
              jobType: j.job_type || j.jobType,
              salary: j.salary, description: j.description,
            }));
          }
        } catch (e) { console.error('Profile search failed:', e); }
      }

      if (!fetched.length) {
        const r = await fetch(`/api/jobs/recommendations/${user.id}?limit=50`);
        if (r.ok) {
          const data = await r.json();
          fetched = (data.jobs || []).map((j: any) => ({
            id: j.id, title: j.title, company: j.company, location: j.location,
            applicationUrl: j.applicationUrl, matchScore: j.matchScore,
            postedAt: j.postedAt, jobType: j.jobType, salary: j.salary, description: j.description,
          }));
        }
      }

      fetched.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setJobs(fetched);
      setRecommendedJobs(fetched);
    } catch (e) {
      toast.error('Failed to load jobs');
    } finally {
      setIsJobsLoading(false);
    }
  };

  // ── Chat ──
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { role: 'user', content: chatInput.trim() };
    addChatMessage(msg);
    setChatInput('');
    setIsChatLoading(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    try {
      const res = await neilweChat(msg.content, { userProfile: user, jobPreferences, recentJobs: jobs.slice(0, 3) }, chatMessages.slice(-5));
      addChatMessage({ role: 'assistant', content: res.response });
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      addChatMessage({ role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── Column width resize (drag on left border of chat) ──
  const startColResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    colResizeRef.current = { x: e.clientX, w: chatPanelWidth };
    const move = (me: MouseEvent) => {
      if (!colResizeRef.current) return;
      const delta = colResizeRef.current.x - me.clientX; // dragging left = wider
      setChatPanelWidth(Math.max(320, Math.min(700, colResizeRef.current.w + delta)));
    };
    const up = () => {
      colResizeRef.current = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [chatPanelWidth]);

  // ── Chat height resize ──
  const startHeightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    heightResizeRef.current = { y: e.clientY, h: chatHeight };
    const move = (me: MouseEvent) => {
      if (!heightResizeRef.current) return;
      setChatHeight(Math.max(300, Math.min(900, heightResizeRef.current.h + me.clientY - heightResizeRef.current.y)));
    };
    const up = () => {
      heightResizeRef.current = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [chatHeight]);

  const ext = profile as ExtendedProfile;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Popups */}
      {selectedJob && !appliedJob && (
        <JobPopup
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApplied={(job) => { setSelectedJob(null); setAppliedJob(job); }}
        />
      )}
      {appliedJob && (
        <AppliedPopup job={appliedJob} onClose={() => setAppliedJob(null)} />
      )}

      {/* Dynamic grid: [jobs] [chatPanelWidth]px */}
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8 py-8"
        style={{ maxWidth: '100%' }}
      >
        <div
          className="flex gap-0 items-start"
          style={{ minHeight: 'calc(100vh - 120px)' }}
        >
          {/* ── Jobs column (fills remaining space) ── */}
          <div className="flex-1 min-w-0 pr-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">Top jobs based on your profile</h1>
                <p className="text-muted-foreground text-sm">
                  {jobPreferences?.preferredRole && `Showing ${jobPreferences.preferredRole} positions`}
                  {(ext?.suggestedJobTitles?.length ?? 0) > 0 && ` (${ext.suggestedJobTitles!.slice(0, 2).join(', ')})`}
                  {jobs.length > 0 && ` • ${jobs.length} jobs found`}
                </p>
              </div>
              {jobs.length > 0 && (
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-bold text-primary">{jobs.length}</span>
                  <p className="text-sm text-muted-foreground">Jobs</p>
                </div>
              )}
            </div>

            {isJobsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No jobs found. Try updating your preferences.</p>
                      <Button onClick={() => window.location.href = '/preferences'} className="mt-4 btn-primary">
                        Update Preferences
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {jobs.slice(0, displayedJobsCount).map((job, idx) => (
                      <Card
                        key={job.id}
                        className="job-card animate-fade-in cursor-pointer hover:border-primary/40 transition-colors"
                        style={{ animationDelay: `${idx * 40}ms` }}
                        onClick={() => setSelectedJob(job)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{job.company}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                                {job.jobType && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.jobType}</span>}
                                {job.postedAt && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.postedAt}</span>}
                                {job.salary && job.salary !== 'Not disclosed' && (
                                  <span className="flex items-center gap-1 text-primary"><DollarSign className="w-4 h-4" />{job.salary}</span>
                                )}
                              </div>
                              {job.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{job.description}</p>
                              )}
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">{Math.round((job.matchScore || 0) * 100)}% Match</span>
                                <div className="flex-1 max-w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${(job.matchScore || 0) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                              className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 ml-4"
                            >
                              <ArrowUpRight className="w-5 h-5 text-primary-foreground" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {displayedJobsCount < jobs.length && (
                      <div className="flex justify-center pt-2">
                        <Button variant="outline" onClick={() => setDisplayedJobsCount((p) => Math.min(p + 10, jobs.length))}>
                          Load More ({jobs.length - displayedJobsCount} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Chat column ── fixed width, draggable from left border ── */}
          <div
            className="flex-shrink-0 relative"
            style={{ width: `${chatPanelWidth}px` }}
          >
            {/* Left-edge drag handle for column width */}
            <div
              className="absolute top-0 left-0 h-full w-2 cursor-col-resize z-10 hover:bg-primary/20 transition-colors rounded-l"
              onMouseDown={startColResize}
              title="Drag to resize panel"
            />

            {/* Chat Card */}
            <Card
              className="bg-card border-border flex flex-col w-full overflow-hidden"
              style={{ height: isChatMinimized ? '60px' : `${chatHeight}px` }}
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Neilwe</h3>
                  <p className="text-xs text-muted-foreground">Your AI assistant</p>
                </div>
                <button
                  onClick={() => setIsChatMinimized((p) => !p)}
                  className="p-1.5 hover:bg-secondary rounded-lg"
                >
                  {isChatMinimized
                    ? <Maximize2 className="w-4 h-4 text-muted-foreground" />
                    : <Minimize2 className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>

              {!isChatMinimized && (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full w-full">
                      <div className="p-4 space-y-3">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm break-words ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-secondary text-foreground rounded-bl-md'
                              }`}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ node, ...p }) => <p className="mb-2 last:mb-0" {...p} />,
                                  ul: ({ node, ...p }) => <ul className="list-disc pl-4 my-1 space-y-1" {...p} />,
                                  ol: ({ node, ...p }) => <ol className="list-decimal pl-4 my-1 space-y-1" {...p} />,
                                  strong: ({ node, ...p }) => <strong className="font-semibold" {...p} />,
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                              {[0, 150, 300].map((d) => (
                                <span key={d} className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                              ))}
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-border flex-shrink-0">
                    <div className="relative">
                      <Input
                        placeholder="What would you like to know?"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="pr-12"
                        disabled={isChatLoading}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isChatLoading}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-primary rounded-lg"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bottom height resize handle */}
                  <div
                    className="h-3 bg-card border-t border-border cursor-ns-resize flex items-center justify-center hover:bg-primary/10 flex-shrink-0 select-none"
                    onMouseDown={startHeightResize}
                    title="Drag to resize"
                  >
                    <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}