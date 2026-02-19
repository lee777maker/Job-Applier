import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Users,
  FileText,
  Award,
  Calendar,
  Target,
  BookOpen,
  ExternalLink,
  Loader2,
  Phone,
  MapPin,
  Star,
  Zap,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  getDashboardAnalytics, 
  getDashboardApplications, 
  getApplicationStatusBreakdown,
  getWeeklyActivity,
  getMatchScoreTrend,
  getCareerResources
} from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Types for dashboard data
interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'declined' | 'withdrawn';
  appliedAt: string;
  matchScore: number;
}

interface Analytics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  responseRate: number;
  averageMatchScore: number;
}

interface CareerResource {
  id: string;
  title: string;
  source: string;
  excerpt: string;
  url: string;
  category: string;
  date: string;
}

interface StatusBreakdownItem {
  name: string;
  value: number;
  color: string;
}

interface WeeklyActivityItem {
  day: string;
  applications: number;
}

interface MatchScoreTrendItem {
  week: string;
  score: number;
}

// Status colors for applications
const statusColors: Record<string, string> = {
  applied: 'bg-blue-500',
  screening: 'bg-yellow-500',
  interview: 'bg-purple-500',
  offer: 'bg-green-500',
  hired: 'bg-emerald-500',
  declined: 'bg-red-500',
  withdrawn: 'bg-gray-500'
};

const statusLabels: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  declined: 'Declined',
  withdrawn: 'Withdrawn'
};

export default function DashboardPage() {
  const { user, profile, jobPreferences } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalApplications: 0,
    activeApplications: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    responseRate: 0,
    averageMatchScore: 0
  });
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdownItem[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityItem[]>([]);
  const [matchScoreTrend, setMatchScoreTrend] = useState<MatchScoreTrendItem[]>([]);
  const [careerResources, setCareerResources] = useState<CareerResource[]>([]);

  // Fetch all dashboard data
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Fetch all data in parallel
      const [
        analyticsRes,
        applicationsRes,
        statusRes,
        weeklyRes,
        trendRes,
        resourcesRes
      ] = await Promise.all([
        getDashboardAnalytics(user!.id),
        getDashboardApplications(user!.id),
        getApplicationStatusBreakdown(user!.id),
        getWeeklyActivity(user!.id),
        getMatchScoreTrend(user!.id),
        getCareerResources()
      ]);

      setAnalytics(analyticsRes);
      setApplications(applicationsRes.applications || []);
      setStatusBreakdown(statusRes.breakdown || []);
      setWeeklyActivity(weeklyRes.weeklyData || []);
      setMatchScoreTrend(trendRes.trendData || []);
      setCareerResources(resourcesRes.resources || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
    toast.success('Dashboard refreshed!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hired':
      case 'offer':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'interview':
        return <Calendar className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    let total = 5;
    
    if (profile?.contactInfo?.firstName || profile?.contactInfo?.lastName) completed++;
    if ((profile?.skills?.length ?? 0) > 0) completed++;
    if ((profile?.experience?.length ?? 0) > 0) completed++;
    if ((profile?.education?.length ?? 0) > 0) completed++;
    if (jobPreferences?.preferredRole) completed++;
    
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || 'User'}! Here's your job search overview.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold">{analytics.totalApplications}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Applications</p>
                  <p className="text-3xl font-bold">{analytics.activeApplications}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviews</p>
                  <p className="text-3xl font-bold">{analytics.interviewsScheduled}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offers Received</p>
                  <p className="text-3xl font-bold">{analytics.offersReceived}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Charts & Applications */}
          <div className="lg:col-span-2 space-y-8">
            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Application Status Pie Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Application Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusBreakdown.length > 0 ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              dataKey="value"
                            >
                              {statusBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {statusBreakdown.map((item) => (
                          <div key={item.name} className="flex items-center gap-1 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-muted-foreground">{item.name}: {item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p className="text-sm">No application data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weekly Activity Bar Chart */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Weekly Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyActivity.length > 0 ? weeklyActivity : [
                        { day: 'Mon', applications: 0 },
                        { day: 'Tue', applications: 0 },
                        { day: 'Wed', applications: 0 },
                        { day: 'Thu', applications: 0 },
                        { day: 'Fri', applications: 0 },
                        { day: 'Sat', applications: 0 },
                        { day: 'Sun', applications: 0 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match Score Trend */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Match Score Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={matchScoreTrend.length > 0 ? matchScoreTrend : [
                      { week: 'W1', score: 0 },
                      { week: 'W2', score: 0 },
                      { week: 'W3', score: 0 },
                      { week: 'W4', score: 0 },
                      { week: 'W5', score: 0 },
                      { week: 'W6', score: 0 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Recent Applications
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/home'}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 7).map((app) => (
                      <div 
                        key={app.id} 
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[app.status]}/20`}>
                            <div className={`w-3 h-3 rounded-full ${statusColors[app.status]}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.jobTitle}</p>
                            <p className="text-sm text-muted-foreground">{app.company}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[app.status]} bg-opacity-20 text-white`}>
                              {getStatusIcon(app.status)}
                              {statusLabels[app.status]}
                            </span>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{app.matchScore}%</p>
                            <p className="text-xs text-muted-foreground">Match</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No applications yet</p>
                    <p className="text-xs mt-1">Start applying to jobs to see them here!</p>
                    <Button 
                      className="mt-4" 
                      size="sm" 
                      onClick={() => window.location.href = '/home'}
                    >
                      Browse Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile & Resources */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {user?.name?.[0]}{user?.surname?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user?.name} {user?.surname}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border space-y-2">
                    {profile?.contactInfo?.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.contactInfo.phoneNumber}</span>
                      </div>
                    )}
                    {jobPreferences?.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{jobPreferences.location}</span>
                      </div>
                    )}
                    {jobPreferences?.preferredRole && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{jobPreferences.preferredRole}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Profile Completion</span>
                      <span className="text-sm font-medium">{calculateProfileCompletion()}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500" 
                        style={{ width: `${calculateProfileCompletion()}%` }} 
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => window.location.href = '/profile'}>
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Skills Overview */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Top Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills?.slice(0, 8).map((skill: any, index: number) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-secondary rounded-full text-sm text-foreground"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  )) || (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  )}
                </div>
                {profile?.skills && profile.skills.length > 8 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    +{profile.skills.length - 8} more skills
                  </p>
                )}
              </CardContent>
            </Card>

            {/* South African Career Resources */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  SA Career Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {careerResources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full mb-2">
                            {resource.category}
                          </span>
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {resource.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{resource.source}</span>
                          <span>{new Date(resource.date).toLocaleDateString('en-ZA')}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}