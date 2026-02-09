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
import { getJobRecommendations, neilweChat } from '@/lib/api';
import type { Job, ChatMessage } from '@/types';


export default function DashboardPage() {
  const { user, jobPreferences, chatMessages, addChatMessage, setRecommendedJobs } = useApp();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch job recommendations on mount
  useEffect(() => {
    if(user?.id){
      fetchRealJobs();
    }
  }, [user?.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  const fetchRealJobs = async () => {
    setIsJobsLoading(true);
    try {
      const data = await getJobRecommendations(user!.id, 10);
      setJobs(data.jobs || []);
      setRecommendedJobs(data.jobs || []);
    } catch (error: any) {
      toast.error('Failed to load job recommendations');
      // Fallback to empty, not mock
      setJobs([]);
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
