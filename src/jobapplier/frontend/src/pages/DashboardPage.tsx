import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  ArrowUpRight, 
  Sparkles, 
  Loader2,
  MapPin,
  Building2,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { neilweChat, searchJobsByProfile, getProfile } from '@/lib/api';
import type { Job, ChatMessage } from '@/types';

// Extended profile type that includes suggestedJobTitles
interface ExtendedProfile {
  suggestedJobTitles?: string[];
  primaryJobTitle?: string;
  [key: string]: any;
}

export default function DashboardPage() {
  const { user, jobPreferences, chatMessages, addChatMessage, setRecommendedJobs, profile, setProfile } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load profile if missing (e.g., after page refresh)
  useEffect(() => {
    if (user?.id && !profile) {
      console.log("DEBUG: Profile missing, fetching from API");
      getProfile(user.id).then(data => {
        console.log("DEBUG: Profile loaded:", data);
        setProfile(data);
      }).catch(err => {
        console.error("Failed to load profile:", err);
      });
    }
  }, [user?.id, profile, setProfile]);

  useEffect(() => {
    if(user?.id && profile){
      fetchJobs();
    }
  }, [user?.id, profile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchJobs = async () => {
    setIsJobsLoading(true);
    try {
      if(!user?.id){
        console.error("DEBUG: No user ID found");
        toast.error('User not found');
        return;
      }
      
      console.log("DEBUG: Fetching jobs for user:", user.id);
      
      // Ensure we have the latest profile data with extended fields
      const extProfile = profile as ExtendedProfile;
      
      // First try profile-based search with AI-suggested job titles
      // Check if we have the necessary data to do a profile-based search
      const hasSuggestedTitles = extProfile?.suggestedJobTitles && extProfile.suggestedJobTitles.length > 0;
      const hasPreferredRole = jobPreferences?.preferredRole || extProfile?.primaryJobTitle;
      
      if (hasSuggestedTitles || hasPreferredRole) {
        try {
          console.log("DEBUG: Trying profile-based search with:", {
            suggestedJobTitles: extProfile?.suggestedJobTitles,
            preferredRole: jobPreferences?.preferredRole,
            primaryJobTitle: extProfile?.primaryJobTitle
          });
          
          const result = await searchJobsByProfile(
            { 
              ...extProfile,
              // Ensure these fields exist for the API
              suggestedJobTitles: extProfile?.suggestedJobTitles || [],
              skills: extProfile?.skills || [],
              title: jobPreferences?.preferredRole || extProfile?.primaryJobTitle || extProfile?.suggestedJobTitles?.[0]
            }, 
            jobPreferences, 
            20
          );
          
          console.log("DEBUG: Profile search result:", result);
          
          if (result.jobs && result.jobs.length > 0) {
            console.log("DEBUG: Profile search successful, found", result.jobs.length, "jobs");
            const mappedJobs: Job[] = result.jobs.map((job: any) => ({
              id: job.id,
              title: job.title,
              company: job.company,
              location: job.location,
              applicationUrl: job.apply_url || job.applicationUrl,
              matchScore: job.match_score || job.matchScore || 0.75,
              postedAt: job.date_posted || job.postedAt,
              jobType: job.job_type || job.jobType
            }));
            
            setJobs(mappedJobs);
            setRecommendedJobs(mappedJobs);
            return; // Exit early if successful
          } else {
            console.warn("DEBUG: Profile search returned no jobs, will try fallback");
          }
        } catch (e) {
          console.error("DEBUG: Profile-based search failed, falling back:", e);
        }
      } else {
        console.warn("DEBUG: No suggestedJobTitles or preferredRole available, skipping profile search");
      }
      
      // Fallback to existing backend endpoint
      console.log("DEBUG: Falling back to /api/jobs/recommendations");
      const response = await fetch(`/api/jobs/recommendations/${user.id}`);
      console.log("DEBUG: Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("DEBUG: Error response:", errorText);
        throw new Error('Failed to fetch job recommendations');
      }
      
      const result = await response.json();
      console.log("DEBUG: Full API response:", result);
      
      if (!result.jobs || result.jobs.length === 0) {
        console.warn("DEBUG: No jobs returned from fallback API");
        toast.info('No jobs found. Try updating your preferences.');
      }

      const mappedJobs: Job[] = result.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        applicationUrl: job.applicationUrl,
        matchScore: job.matchScore,
        postedAt: job.postedAt,
        jobType: job.jobType
      }));

      console.log("DEBUG: Mapped jobs:", mappedJobs);
      setJobs(mappedJobs);
      setRecommendedJobs(mappedJobs);
      
    } catch (error) {
      console.error("DEBUG: Fetch error:", error);
      toast.error('Failed to load jobs');
    } finally {
      setIsJobsLoading(false);
    }
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
    };

    addChatMessage(userMessage);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await neilweChat(
        userMessage.content,
        {
          userProfile: user,
          jobPreferences,
          recentJobs: jobs.slice(0, 3),
        },
        chatMessages.slice(-5)
      );

      addChatMessage({
        role: 'assistant',
        content: response.response,
      });
    } catch (error: any) {
      toast.error('Failed to get response from Neilwe');
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setIsChatLoading(false);
    }
  };
 
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Cast profile for rendering
  const extProfile = profile as ExtendedProfile;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Job Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Top jobs based on your profile
              </h1>
              <p className="text-muted-foreground">
                {jobPreferences?.preferredRole && `Showing ${jobPreferences.preferredRole} positions`}
                {extProfile?.suggestedJobTitles && ` (including ${extProfile.suggestedJobTitles.slice(0, 3).join(', ')})`}
              </p>
            </div>

            {isJobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <Card className="bg-card border-border">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No jobs found. Try updating your preferences.</p>
                      <Button 
                        onClick={() => window.location.href = '/preferences'} 
                        className="mt-4 btn-primary"
                      >
                        Update Preferences
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job, index) => (
                    <Card
                      key={job.id}
                      className="job-card animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">
                                  {Math.round((job.matchScore || 0) * 100)}% Match
                                </span>
                              </div>
                              <div className="flex-1 max-w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: `${(job.matchScore || 0) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <a
                            href={job.applicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                          >
                            <ArrowUpRight className="w-5 h-5 text-primary-foreground" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column - Neilwe Chatbot */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border flex flex-col h-[calc(100vh-8rem)]">
              {/* Chat Header - Fixed at top */}
              <div className="flex items-center gap-3 p-4 border-b border-border flex-shrink-0">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Neilwe</h3>
                  <p className="text-xs text-muted-foreground">Your AI assistant</p>
                </div>
              </div>

              {/* Chat Messages - Scrollable area */}
              <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full w-full">
                  <div className="p-4 space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] break-words whitespace-pre-wrap px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-secondary text-foreground rounded-bl-md'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%] flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Input - Fixed at bottom */}
              <div className="p-4 border-t border-border flex-shrink-0">
                <div className="relative">
                  <Input
                    placeholder="What would you like to know?"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="input-dark pr-12"
                    disabled={isChatLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 bg-primary hover:bg-primary/90 rounded-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}