import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getMatchScore, tailorResume, generateCoverLetter } from '@/lib/api';
import type { MatchScoreResult, TailoredResume } from '@/types';
import { DocumentEditor } from '@/components/custom/DocumentEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

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
  
  // Download handlers
  const downloadAsPDF = (content: string, filename: string) => {
    try {
      const doc = new jsPDF();
      const cleanContent = content.replace(/[#*_`]/g, '');
      const splitText = doc.splitTextToSize(cleanContent, 180);
      
      // Add header
      doc.setFontSize(16);
      doc.text(filename.replace('.pdf', '').toUpperCase(), 15, 20);
      doc.setFontSize(12);
      doc.text(splitText, 15, 30);
      
      doc.save(filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const downloadAsWord = async (content: string, filename: string) => {
    try {
      const cleanContent = content.replace(/[#*_`]/g, '');
      const lines = cleanContent.split('\n').filter(line => line.trim());
      
      const children = lines.map(line => 
        new Paragraph({
          children: [new TextRun({ text: line, size: 24 })],
          spacing: { after: 200 }
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });
      
      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
      toast.success('Word document downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate Word document');
      console.error(error);
    }
  };

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
      const result = await getMatchScore(
        { skills: profile?.skills || [] },
        jobDescription,
        cvText
      );
      setMatchResult(result);
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
      const result = await tailorResume(
        cvText,
        jobDescription,
        { skills: profile?.skills || [] }
      );
      setTailoredResume(result);
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
      const result = await generateCoverLetter(
        jobDescription,
        { skills: profile?.skills || [], name: profile?.contactInfo?.firstName }
      );
      setCoverLetter(result.cover_letter);
      setActiveTab('cover-letter');
      toast.success('Cover letter generated!');
    } catch (error: any) {
      toast.error('Failed to generate cover letter');
    }
  }

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
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Input & Report */}
          <div className="space-y-6 lg:sticky lg:top-8">
            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
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
                      className="input-dark min-h-[200px] resize-none bg-secondary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Paste Job Description</label>
                    <Textarea
                      placeholder="Copy the whole job ad"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="input-dark min-h-[150px] resize-none bg-secondary/50"
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
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full ${getScoreBg(matchResult.ats_score)} flex items-center justify-center mb-2`}>
                        <span className={`text-2xl font-bold ${getScoreColor(matchResult.ats_score)}`}>
                          {matchResult.ats_score}
                        </span>
                      </div>
                      <p className="text-sm font-medium">ATS Score</p>
                    </div>

                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full ${getScoreBg(matchResult.match_score * 100)} flex items-center justify-center mb-2`}>
                        <span className={`text-2xl font-bold ${getScoreColor(matchResult.match_score * 100)}`}>
                          {Math.round(matchResult.match_score * 100)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">Skills Match</p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-2">
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Experience</p>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {matchResult.strengths?.map((strength, i) => (
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
                      {matchResult.gaps?.map((gap, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-yellow-500 mt-1">•</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Keywords */}
                  <div className="mb-6">
                    <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Keywords to Add
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.keywords_to_add?.map((keyword, i) => (
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
                      {matchResult.recommended_bullets?.map((bullet, i) => (
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
          <div className="lg:h-[calc(100vh-8rem)] lg:sticky lg:top-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-secondary flex-shrink-0">
                <TabsTrigger value="cv">CV</TabsTrigger>
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-4 min-h-0">
                <TabsContent value="cv" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <Card className="bg-card border-border h-full flex flex-col overflow-hidden">
                    <CardContent className="p-6 flex flex-col h-full overflow-hidden">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <h3 className="font-semibold">Resume Preview</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAsPDF(tailoredResume?.tailored_resume || cvText, 'resume.pdf')}
                            disabled={!cvText && !tailoredResume}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAsWord(tailoredResume?.tailored_resume || cvText, 'resume.docx')}
                            disabled={!cvText && !tailoredResume}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Word
                          </Button>
                        </div>
                      </div>
                      
                      {/* Fixed: Dark background scrollable area */}
                      <div className="flex-1 overflow-y-auto bg-secondary/30 rounded-lg border border-border p-4 min-h-0 custom-scrollbar">
                        {tailoredResume ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {tailoredResume.tailored_resume}
                            </ReactMarkdown>
                          </div>
                        ) : cvText ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                            {cvText}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No resume content yet</p>
                            <p className="text-sm">Enter your CV in the Edit tab</p>
                          </div>
                        )}
                      </div>

                      {/* Resizable Document Editor */}
                      {tailoredResume && (
                        <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-2">Edit Mode (Drag bottom-right to resize):</p>
                          <div 
                            className="min-h-[200px] max-h-[600px] border rounded-lg overflow-hidden resize-y bg-background custom-scrollbar"
                            style={{ height: '400px' }}
                          >
                            <DocumentEditor 
                              initialContent={tailoredResume.tailored_resume} 
                              documentType="cv"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="cover-letter" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <Card className="bg-card border-border h-full flex flex-col overflow-hidden">
                    <CardContent className="p-6 flex flex-col h-full overflow-hidden">
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAsPDF(coverLetter, 'cover-letter.pdf')}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAsWord(coverLetter, 'cover-letter.docx')}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Word
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Fixed: Dark background scrollable area */}
                      <div className="flex-1 overflow-y-auto bg-secondary/30 rounded-lg border border-border p-4 min-h-0 custom-scrollbar">
                        {coverLetter ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {coverLetter}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground">
                            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No cover letter yet</p>
                            <p className="text-sm">Click Generate to create one</p>
                          </div>
                        )}
                      </div>

                      {/* Resizable Document Editor for Cover Letter */}
                      {coverLetter && (
                        <div className="mt-4 pt-4 border-t border-border flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-2">Edit Mode (Drag bottom-right to resize):</p>
                          <div 
                            className="min-h-[200px] max-h-[600px] border rounded-lg overflow-hidden resize-y bg-background custom-scrollbar"
                            style={{ height: '400px' }}
                          >
                            <DocumentEditor 
                              initialContent={coverLetter} 
                              documentType="cover-letter"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="email" className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <Card className="bg-card border-border h-full flex flex-col">
                    <CardContent className="p-12 text-center flex flex-col items-center justify-center h-full">
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
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}