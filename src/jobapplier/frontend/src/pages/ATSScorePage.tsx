import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Zap, 
  TrendingUp, 
  Award,
  Download,
  FileText,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import type { MatchScoreResult, TailoredResume } from '@/types';

export default function ATSScorePage() {
  const { profile } = useApp();
  const [cvText, setCvText] = useState(profile?.resumeText || '');
  const [jobDescription, setJobDescription] = useState('');
  const [activeTab, setActiveTab] = useState('report');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchScoreResult | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');

  const handleAnalyze = async () => {
    if (!cvText.trim()) {
      toast.error('Please enter your CV');
      return;
    }

    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      // In production, call actual API
      // const result = await getMatchScore(
      //   { skills: profile?.skills || [] },
      //   jobDescription,
      //   cvText
      // );

      // Simulate API delay and mock result
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResult: MatchScoreResult = {
        match_score: 0.75,
        ats_score: 75,
        strengths: [
          'Strong technical skills in Java and Python',
          'Relevant project experience',
          'Good educational background',
        ],
        gaps: [
          'Missing cloud platform experience',
          'Limited leadership experience mentioned',
        ],
        keywords_to_add: [
          'AWS',
          'Docker',
          'Kubernetes',
          'CI/CD',
          'Agile',
        ],
        recommended_bullets: [
          'Implemented CI/CD pipelines reducing deployment time by 40%',
          'Led a team of 3 developers to deliver project 2 weeks ahead of schedule',
          'Architected scalable microservices handling 1M+ daily requests',
        ],
        confidence: 0.85,
      };

      setMatchResult(mockResult);
      toast.success('Analysis complete!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTailorResume = async () => {
    if (!matchResult) {
      toast.error('Please analyze first');
      return;
    }

    setIsTailoring(true);
    try {
      // In production, call actual API
      // const result = await tailorResume(
      //   cvText,
      //   jobDescription,
      //   { skills: profile?.skills || [] }
      // );

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const mockTailored: TailoredResume = {
        tailored_resume: `LETHABO NEO
Johannesburg, Gauteng | +27 81 447 8357 | lethaboneo@icloud.com | linkedin.com/in/lethabo-neo

SUMMARY
Junior Full Stack Engineer with strong foundations in Java, Python, and systems programming. Experienced in building concurrent systems, production-grade solutions, data modeling, and data-driven pipelines. Proficient in AWS, Docker, Kubernetes, and CI/CD practices. Eager to leverage problem-solving expertise to deliver reliable software solutions aligned with business requirements.

TECHNICAL SKILLS
Languages: Java, Python, JavaScript, TypeScript, SQL
Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, CI/CD, Jenkins
Frameworks: React, Node.js, Spring Boot, FastAPI
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, GitHub Actions, Terraform, Ansible

PROFESSIONAL EXPERIENCE

Junior Software Engineer | Tech Corp | Jan 2024 - Present
• Architected scalable microservices using AWS ECS and Docker, handling 1M+ daily requests
• Implemented CI/CD pipelines with GitHub Actions, reducing deployment time by 40%
• Led migration to Kubernetes, improving system reliability by 99.9%
• Mentored 2 junior developers in Agile practices and code reviews

Software Developer Intern | StartupXYZ | Jun 2023 - Dec 2023
• Developed RESTful APIs using Spring Boot and PostgreSQL
• Built responsive React frontend components serving 10K+ users
• Implemented automated testing, achieving 85% code coverage`,
        changes_made: {
          words_added: 45,
          words_removed: 12,
          length_change_percent: 8.5,
          top_keywords_added: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Agile'],
        },
        optimization_score: 0.92,
      };

      setTailoredResume(mockTailored);
      setActiveTab('cv');
      toast.success('Resume tailored successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to tailor resume');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!matchResult) {
      toast.error('Please analyze first');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the Software Engineer position at your company. With my background in full-stack development and expertise in Java, Python, and cloud technologies, I am confident in my ability to contribute effectively to your team.

During my time at Tech Corp, I have gained hands-on experience building scalable microservices and implementing CI/CD pipelines. I have successfully architected systems handling over 1 million daily requests and led initiatives that reduced deployment time by 40%.

My technical skills align well with your requirements:
• Proficient in Java, Python, and JavaScript
• Experienced with AWS, Docker, and Kubernetes
• Strong understanding of Agile methodologies
• Track record of delivering high-quality code

I am particularly drawn to your company's innovative approach to technology and would welcome the opportunity to discuss how my skills can contribute to your team's success.

Thank you for considering my application. I look forward to the opportunity to speak with you further.

Sincerely,
Lethabo Neo`;

      setCoverLetter(mockCoverLetter);
      setActiveTab('cover-letter');
      toast.success('Cover letter generated!');
    } catch (error: any) {
      toast.error('Failed to generate cover letter');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input & Report */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant={activeTab === 'report' ? 'default' : 'outline'}
                onClick={() => setActiveTab('report')}
                className={activeTab === 'report' ? 'bg-primary text-primary-foreground' : ''}
              >
                <FileText className="w-4 h-4 mr-2" />
                Report
              </Button>
              <Button
                variant={activeTab === 'edit' ? 'default' : 'outline'}
                onClick={() => setActiveTab('edit')}
                className={activeTab === 'edit' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleTailorResume}
                disabled={!matchResult || isTailoring}
                className="bg-primary/20 text-primary hover:bg-primary/30"
              >
                {isTailoring ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                AI Optimise
              </Button>
            </div>

            {/* Input Section */}
            {activeTab === 'edit' && (
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Enter CV</label>
                    <Textarea
                      placeholder="Copy and Paste CV"
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="input-dark min-h-[200px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Paste Job Description</label>
                    <Textarea
                      placeholder="Copy the whole job ad"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="input-dark min-h-[150px] resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="btn-primary flex-1"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Analyze
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Section */}
            {activeTab === 'report' && matchResult && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Analysis Report</h2>
                  
                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {/* ATS Score */}
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full ${getScoreBg(matchResult.ats_score)} flex items-center justify-center mb-2`}>
                        <span className={`text-2xl font-bold ${getScoreColor(matchResult.ats_score)}`}>
                          {matchResult.ats_score}
                        </span>
                      </div>
                      <p className="text-sm font-medium">ATS Score</p>
                    </div>

                    {/* Skills Match */}
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full ${getScoreBg(matchResult.match_score * 100)} flex items-center justify-center mb-2`}>
                        <span className={`text-2xl font-bold ${getScoreColor(matchResult.match_score * 100)}`}>
                          {Math.round(matchResult.match_score * 100)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Skills Match</p>
                    </div>

                    {/* Experience */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-2">
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Experience</p>
                      <p className="text-xs text-muted-foreground">46%</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {matchResult.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Gaps */}
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      Gaps to Address
                    </h3>
                    <ul className="space-y-2">
                      {matchResult.gaps.map((gap, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords to Add */}
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Keywords to Add
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.keywords_to_add.map((keyword, i) => (
                        <span key={i} className="tag tag-primary">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Bullets */}
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Award className="w-4 h-4 text-primary" />
                      Suggested Bullet Points
                    </h3>
                    <ul className="space-y-2">
                      {matchResult.recommended_bullets.map((bullet, i) => (
                        <li key={i} className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                          • {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'report' && !matchResult && (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter your CV and job description to get started
                  </p>
                  <Button onClick={() => setActiveTab('edit')} className="btn-primary">
                    Start Analysis
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Preview */}
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary">
                <TabsTrigger value="cv">CV</TabsTrigger>
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="cv" className="mt-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Resume Preview</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Download feature coming soon!')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[600px]">
                      {tailoredResume ? (
                        <div className="resume-preview whitespace-pre-wrap">
                          {tailoredResume.tailored_resume}
                        </div>
                      ) : cvText ? (
                        <div className="resume-preview whitespace-pre-wrap">
                          {cvText}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No resume content yet</p>
                          <p className="text-sm">Enter your CV in the Edit tab</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cover-letter" className="mt-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Cover Letter</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateCoverLetter}
                          disabled={!matchResult}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate
                        </Button>
                        {coverLetter && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info('Download feature coming soon!')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[600px]">
                      {coverLetter ? (
                        <div className="resume-preview whitespace-pre-wrap">
                          {coverLetter}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No cover letter yet</p>
                          <p className="text-sm">Click Generate to create one</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-12 text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Outreach Email</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Generate a professional outreach email to recruiters
                    </p>
                    <Button 
                      onClick={() => toast.info('Coming soon!')}
                      className="btn-primary"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Email
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
