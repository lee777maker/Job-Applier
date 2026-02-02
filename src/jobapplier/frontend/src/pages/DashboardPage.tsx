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
import type { Job, ChatMessage } from '@/types';

// Mock job data for demo
const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Graduate Software Engineer',
    company: 'EY',
    location: 'Johannesburg, South Africa',
    applicationUrl: 'https://careers.ey.com',
    matchScore: 0.92,
    description: 'Join our technology team and work on cutting-edge projects...',
  },
  {
    id: '2',
    title: 'Agentic Engineer',
    company: 'Deloitte',
    location: 'Johannesburg, South Africa',
    applicationUrl: 'https://careers.deloitte.com',
    matchScore: 0.88,
    description: 'Build intelligent AI agents and automation systems...',
  },
  {
    id: '3',
    title: 'Junior Automation Engineer',
    company: 'Lectra',
    location: 'Paris, France (Remote)',
    applicationUrl: 'https://careers.lectra.com',
    matchScore: 0.85,
    description: 'Automate manufacturing processes and workflows...',
  },
  {
    id: '4',
    title: 'Full Stack Developer',
    company: 'Google',
    location: 'Mountain View, CA (Remote)',
    applicationUrl: 'https://careers.google.com',
    matchScore: 0.83,
    description: 'Build scalable web applications...',
  },
];

export default function DashboardPage() {
  const { user, jobPreferences, chatMessages, addChatMessage, setRecommendedJobs } = useApp();
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch job recommendations on mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchJobs = async () => {
    setIsJobsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setJobs(mockJobs);
      setRecommendedJobs(mockJobs);
    } catch (error: any) {
      toast.error('Failed to load job recommendations');
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
      // Simulate API delay and response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let response = '';
      const lowerMsg = userMessage.content.toLowerCase();
      
      if (lowerMsg.includes('job') || lowerMsg.includes('position')) {
        response = `I found ${jobs.length} jobs matching your profile! The top match is "${jobs[0].title}" at ${jobs[0].company} with a ${Math.round(jobs[0].matchScore * 100)}% match score. Would you like me to help you apply for this position?`;
      } else if (lowerMsg.includes('interview')) {
        response = 'I can help you prepare for interviews! Here are some tips:\n\n1. Research the company thoroughly\n2. Practice the STAR method for behavioral questions\n3. Prepare questions to ask the interviewer\n4. Review the job description and align your experience\n\nWould you like me to simulate a mock interview?';
      } else if (lowerMsg.includes('resume') || lowerMsg.includes('cv')) {
        response = 'I can help optimize your resume! Go to the Dashboard tab to:\n\n- Get ATS scores\n- Tailor your resume for specific jobs\n- See improvement suggestions\n\nWould you like me to analyze a specific job description against your profile?';
      } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
        response = `Hello ${user?.name || 'there'}! I'm Neilwe, your AI career assistant. I can help you:\n\n- Find jobs where you're a top candidate\n- Prepare for interviews\n- Optimize your resume\n- Navigate the platform\n\nWhat would you like help with today?`;
      } else {
        response = 'I understand! I can help you with various career-related tasks. Feel free to ask me about:\n\n- Job recommendations\n- Interview preparation\n- Resume optimization\n- Career advice\n- Specific companies or roles\n\nWhat would you like to know?';
      }

      addChatMessage({
        role: 'assistant',
        content: response,
      });
    } catch (error: any) {
      toast.error('Failed to get response from Neilwe');
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
              </p>
            </div>

            {isJobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, index) => (
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
                          
                          {/* Match Score */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">
                                {Math.round(job.matchScore * 100)}% Match
                              </span>
                            </div>
                            <div className="flex-1 max-w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${job.matchScore * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Apply Button */}
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
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Neilwe Chatbot */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border h-[calc(100vh-12rem)] flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Neilwe</h3>
                    <p className="text-xs text-muted-foreground">Your AI assistant</p>
                  </div>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="flex-1 py-4">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'chat-message-user'
                              : 'chat-message-assistant'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="chat-message-assistant flex items-center gap-2">
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

                {/* Chat Input */}
                <div className="pt-4 border-t border-border">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
