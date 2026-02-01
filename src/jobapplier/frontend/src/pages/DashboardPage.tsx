import { useApp } from '@/context/AppContext';
import { 
  Briefcase, 
  FileText, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function DashboardPage() {
  const { profile, chatMessages } = useApp();

  const stats = [
    { 
      label: 'Profile Completion', 
      value: '85%', 
      icon: <FileText className="w-5 h-5" />,
      color: 'text-[#f5c518]'
    },
    { 
      label: 'Jobs Applied', 
      value: '12', 
      icon: <Briefcase className="w-5 h-5" />,
      color: 'text-green-500'
    },
    { 
      label: 'AI Conversations', 
      value: chatMessages.length.toString(), 
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'text-blue-500'
    },
    { 
      label: 'Match Score', 
      value: '92%', 
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-500'
    }
  ];

  const recentActivity = [
    { 
      type: 'application', 
      title: 'Applied to Graduate Software Engineer at BT',
      time: '2 hours ago',
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />
    },
    { 
      type: 'profile', 
      title: 'Updated profile skills section',
      time: '1 day ago',
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    { 
      type: 'chat', 
      title: 'Asked AI about resume optimization',
      time: '2 days ago',
      icon: <MessageSquare className="w-4 h-4 text-[#f5c518]" />
    },
    { 
      type: 'job', 
      title: 'New job match: Agentic Engineer at Deloitte',
      time: '3 days ago',
      icon: <AlertCircle className="w-4 h-4 text-purple-500" />
    }
  ];

  const upcomingEvents = [
    { 
      title: 'Technical Interview - BT',
      date: 'Feb 5, 2026',
      time: '10:00 AM',
      type: 'interview'
    },
    { 
      title: 'Resume Review Session',
      date: 'Feb 8, 2026',
      time: '2:00 PM',
      type: 'meeting'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {profile.contactInfo.firstName}! Here's your job search overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]"
            >
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#f5c518]" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-[#2a2a2a] rounded-lg"
                >
                  <div className="mt-0.5">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#f5c518]" />
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#2a2a2a] rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{event.title}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time}
                      </span>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    event.type === 'interview' ? 'bg-[#f5c518]' : 'bg-blue-500'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
              Update Resume
            </button>
            <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
              Browse Jobs
            </button>
            <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
              Ask AI Assistant
            </button>
            <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg text-sm transition-colors">
              View Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
