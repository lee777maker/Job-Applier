import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Zap, Award, Download, FileText,
  Mail, Sparkles, CheckCircle2, AlertCircle, Lightbulb,
  GripVertical, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { getMatchScore, tailorResume, generateCoverLetter, generateEmail } from '@/lib/api';
import type { MatchScoreResult } from '@/types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// ─── Resizable inline document editor ─────────────────────────────────────────

function DocPanel({
  content,
  placeholder,
  onChange,
}: {
  content: string;
  placeholder: React.ReactNode;
  onChange: (val: string) => void;
}) {
  const [height, setHeight] = useState(420);
  const [copied, setCopied] = useState(false);
  const resizeRef = useRef<{ y: number; h: number } | null>(null);
  const editRef = useRef<HTMLDivElement>(null);

  // Sync external content changes into the contentEditable div
  useEffect(() => {
    if (editRef.current && content) {
      editRef.current.innerHTML = content;
    }
  }, []);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { y: e.clientY, h: height };
    const move = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      setHeight(Math.max(200, Math.min(900, resizeRef.current.h + me.clientY - resizeRef.current.y)));
    };
    const up = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }, [height]);

  const handleCopy = async () => {
    const text = editRef.current?.innerText || content;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
          title="Copy text"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Editable paper-style document */}
      <div
        className="border border-border rounded-lg overflow-hidden"
        style={{ height: `${height}px`, display: 'flex', flexDirection: 'column' }}
      >
        {content ? (
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            className="flex-1 overflow-y-auto p-6 bg-white focus:outline-none"
            style={{
              fontFamily: 'Times New Roman, serif',
              fontSize: '11pt',
              lineHeight: 1.5,
              color: '#111',
            }}
            dangerouslySetInnerHTML={{ __html: formatForDisplay(content) }}
          />
        ) : (
          <div className="flex-1 overflow-y-auto bg-white flex items-center justify-center">
            {placeholder}
          </div>
        )}

        {/* Bottom resize handle */}
        <div
          className="h-3 bg-gray-100 border-t border-border cursor-ns-resize flex items-center justify-center hover:bg-primary/10 flex-shrink-0 select-none"
          onMouseDown={startResize}
        >
          <GripVertical className="w-4 h-4 text-gray-400 rotate-90" />
        </div>
      </div>
    </div>
  );
}

/**
 * Convert plain text / markdown-like content to readable HTML for the inline editor.
 * All documents render in Times New Roman.
 */
function formatForDisplay(text: string): string {
  if (!text) return '';

  // If it already contains HTML tags, return as-is
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  return text
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return '<br/>';

      // Section headings (all-caps lines)
      if (/^[A-Z][A-Z\s&]{4,}$/.test(t)) {
        return `<div style="font-weight:bold;font-size:11pt;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid #000;padding-bottom:2px;margin:10px 0 4px 0">${t}</div>`;
      }
      // Bullet points
      if (t.startsWith('•') || t.startsWith('- ') || t.startsWith('* ')) {
        return `<div style="margin-left:18px;padding-left:4px">• ${t.replace(/^[•\-\*]\s*/, '')}</div>`;
      }
      // Key: value (skills lines)
      if (/^[A-Za-z\s&]+:\s.+/.test(t)) {
        const col = t.indexOf(':');
        return `<div><strong>${t.slice(0, col).trim()}:</strong> ${t.slice(col + 1).trim()}</div>`;
      }
      return `<span>${t}</span><br/>`;
    })
    .join('');
}

// ─── PDF / Word export helpers ─────────────────────────────────────────────────

function exportToPDF(content: string, filename: string) {
  try {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    const clean = stripHtml(content);
    const lines = doc.splitTextToSize(clean, 180);
    let y = 20;
    lines.forEach((line: string) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 6;
    });
    doc.save(filename);
    toast.success('PDF downloaded!');
  } catch (e) {
    toast.error('Failed to generate PDF');
    console.error(e);
  }
}

async function exportToWord(content: string, filename: string) {
  try {
    const lines = stripHtml(content).split('\n').filter(Boolean);
    const children = lines.map((line) => {
      const isBullet = line.trim().startsWith('•');
      const isHeading = /^[A-Z][A-Z\s&]{4,}$/.test(line.trim());
      return new Paragraph({
        children: [
          new TextRun({
            text: line.trim().replace(/^•\s*/, ''),
            size: 22,
            font: 'Times New Roman',
            bold: isHeading,
            allCaps: isHeading,
          }),
        ],
        spacing: { after: 80 },
        bullet: isBullet ? { level: 0 } : undefined,
        border: isHeading
          ? { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' } }
          : undefined,
      });
    });
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    toast.success('Word document downloaded!');
  } catch (e) {
    toast.error('Failed to generate Word document');
    console.error(e);
  }
}

function stripHtml(html: string): string {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || html.replace(/<[^>]+>/g, '');
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssistancePage() {
  const { profile } = useApp();

  // Left panel mode
  const [leftMode, setLeftMode] = useState<'report' | 'edit'>('report');
  // Right panel active document tab
  const [docTab, setDocTab] = useState<'cv' | 'cover-letter' | 'email'>('cv');

  // Inputs
  const [cvText, setCvText] = useState(profile?.resumeText || '');
  const [jobDescription, setJobDescription] = useState('');

  // Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchScoreResult | null>(null);

  // Document content (inline-editable via DocPanel)
  const [resumeContent, setResumeContent] = useState(profile?.resumeText || '');
  const [coverLetterContent, setCoverLetterContent] = useState('');
  const [emailContent, setEmailContent] = useState('');

  // ── Handlers ──

  const handleAnalyze = async () => {
    if (!cvText.trim()) { toast.error('Please enter your CV in the Edit tab'); return; }
    if (!jobDescription.trim()) { toast.error('Please paste a job description'); return; }
    setIsAnalyzing(true);
    try {
      const result = await getMatchScore({ skills: profile?.skills || [] }, jobDescription, cvText);
      setMatchResult(result);
      setLeftMode('report');
      toast.success('Analysis complete!');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTailorResume = async () => {
    if (!matchResult) { toast.error('Please run analysis first (Edit tab → Analyze)'); return; }
    setIsTailoring(true);
    try {
      const result = await tailorResume(cvText, jobDescription, {
        skills: profile?.skills || [],
        name: profile?.contactInfo?.firstName,
        experience: profile?.experience || [],
        education: profile?.education || [],
      });
      setResumeContent(result.tailored_resume);
      setDocTab('cv');
      toast.success('Resume tailored!');
    } catch (e: any) {
      toast.error(e.message || 'Tailoring failed');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!matchResult) { toast.error('Please run analysis first'); return; }
    setIsGeneratingCL(true);
    try {
      const result = await generateCoverLetter(jobDescription, {
        skills: profile?.skills || [],
        name: profile?.contactInfo?.firstName,
        experience: profile?.experience || [],
      });
      setCoverLetterContent(result.cover_letter);
      setDocTab('cover-letter');
      toast.success('Cover letter generated!');
    } catch (e: any) {
      toast.error('Cover letter generation failed');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (!matchResult) { toast.error('Please run analysis first'); return; }
    setIsGeneratingEmail(true);
    try {
      const result = await generateEmail(jobDescription, {
        skills: profile?.skills || [],
        name: profile?.contactInfo?.firstName,
      }, 'recruiter');
      setEmailContent(result.email);
      setDocTab('email');
      toast.success('Email generated!');
    } catch (e: any) {
      toast.error('Email generation failed');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const scoreColor = (s: number) => s >= 80 ? 'text-green-500' : s >= 60 ? 'text-yellow-500' : 'text-red-500';
  const scoreBg = (s: number) => s >= 80 ? 'bg-green-500/20' : s >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20';

  // ── Render ──

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">AI Assistance</h1>
          <p className="text-muted-foreground">AI-powered CV tailoring, cover letters, and outreach emails.</p>
        </div>

        {/* ── Action bar ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant={leftMode === 'report' ? 'default' : 'outline'}
            onClick={() => setLeftMode('report')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Report
          </Button>
          <Button
            variant={leftMode === 'edit' ? 'default' : 'outline'}
            onClick={() => setLeftMode('edit')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={handleTailorResume}
            disabled={!matchResult || isTailoring}
            className="bg-primary/20 text-primary hover:bg-primary/30"
          >
            {isTailoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            AI Optimise CV
          </Button>
          <Button
            onClick={handleGenerateCoverLetter}
            disabled={!matchResult || isGeneratingCL}
            className="bg-primary/20 text-primary hover:bg-primary/30"
          >
            {isGeneratingCL ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Generate Cover Letter
          </Button>
          <Button
            onClick={handleGenerateEmail}
            disabled={!matchResult || isGeneratingEmail}
            className="bg-primary/20 text-primary hover:bg-primary/30"
          >
            {isGeneratingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Generate Email
          </Button>
        </div>

        {/* ── Main 2-column layout ── */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* ── Left: inputs or report ── */}
          <div className="space-y-6 lg:sticky lg:top-8">
            {/* Edit mode */}
            {leftMode === 'edit' && (
              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your CV</label>
                    <Textarea
                      placeholder="Paste your CV text here…"
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="min-h-[200px] resize-y font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Description</label>
                    <Textarea
                      placeholder="Paste the full job advertisement here…"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[160px] resize-y text-sm"
                    />
                  </div>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary w-full">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Analyse
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Report mode — no analysis yet */}
            {leftMode === 'report' && !matchResult && (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <FileText className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Go to Edit, paste your CV + job description, then hit Analyse.
                  </p>
                  <Button onClick={() => setLeftMode('edit')} className="btn-primary">
                    Start Editing
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Report mode — analysis available */}
            {leftMode === 'report' && matchResult && (
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-6">Analysis Report</h2>

                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { label: 'ATS Score', value: matchResult.ats_score },
                      { label: 'Skills Match', value: Math.round(matchResult.match_score * 100) },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <div className={`w-20 h-20 mx-auto rounded-full ${scoreBg(value)} flex items-center justify-center mb-2`}>
                          <span className={`text-2xl font-bold ${scoreColor(value)}`}>{value}</span>
                        </div>
                        <p className="text-sm font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {matchResult.strengths?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Strengths
                      </h3>
                      <ul className="space-y-1">
                        {matchResult.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-green-500">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Gaps */}
                  {matchResult.gaps?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" /> Gaps
                      </h3>
                      <ul className="space-y-1">
                        {matchResult.gaps.map((g: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-yellow-500">•</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Keywords */}
                  {matchResult.keywords_to_add?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <Lightbulb className="w-4 h-4 text-primary" /> Keywords to Add
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.keywords_to_add.map((k: string, i: number) => (
                          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended bullets */}
                  {matchResult.recommended_bullets?.length > 0 && (
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold mb-2">
                        <Award className="w-4 h-4 text-primary" /> Suggested Bullet Points
                      </h3>
                      <ul className="space-y-2">
                        {matchResult.recommended_bullets.map((b: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground bg-secondary/50 p-2 rounded">• {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Right: document tabs ── */}
          <div>
            {/* Tab buttons */}
            <div className="flex gap-1 mb-4 bg-secondary p-1 rounded-lg">
              {(['cv', 'cover-letter', 'email'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDocTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    docTab === tab ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab === 'cv' ? 'CV' : tab === 'cover-letter' ? 'Cover Letter' : 'Email'}
                </button>
              ))}
            </div>

            {/* ── CV panel ── */}
            {docTab === 'cv' && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Resume Preview</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => exportToPDF(resumeContent, 'resume.pdf')}
                        disabled={!resumeContent}
                      >
                        <Download className="w-4 h-4 mr-1" /> PDF
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => exportToWord(resumeContent, 'resume.docx')}
                        disabled={!resumeContent}
                      >
                        <FileText className="w-4 h-4 mr-1" /> Word
                      </Button>
                    </div>
                  </div>
                  <DocPanel
                    content={resumeContent}
                    onChange={setResumeContent}
                    placeholder={
                      <div className="text-center p-8 text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">No CV content yet</p>
                        <p className="text-sm mt-1">Paste your CV in Edit tab and click <strong>AI Optimise CV</strong></p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* ── Cover Letter panel ── */}
            {docTab === 'cover-letter' && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Cover Letter</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={handleGenerateCoverLetter}
                        disabled={!matchResult || isGeneratingCL}
                      >
                        {isGeneratingCL ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                        Generate
                      </Button>
                      {coverLetterContent && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => exportToPDF(coverLetterContent, 'cover-letter.pdf')}>
                            <Download className="w-4 h-4 mr-1" /> PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => exportToWord(coverLetterContent, 'cover-letter.docx')}>
                            <FileText className="w-4 h-4 mr-1" /> Word
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <DocPanel
                    content={coverLetterContent}
                    onChange={setCoverLetterContent}
                    placeholder={
                      <div className="text-center p-8 text-gray-400">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">No cover letter yet</p>
                        <p className="text-sm mt-1">Run analysis first, then click <strong>Generate Cover Letter</strong></p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* ── Email panel ── */}
            {docTab === 'email' && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Outreach Email</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={handleGenerateEmail}
                        disabled={!matchResult || isGeneratingEmail}
                      >
                        {isGeneratingEmail ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                        Generate
                      </Button>
                      {emailContent && (
                        <Button
                          variant="outline" size="sm"
                          onClick={async () => {
                            await navigator.clipboard.writeText(stripHtml(emailContent));
                            toast.success('Email copied!');
                          }}
                        >
                          <Copy className="w-4 h-4 mr-1" /> Copy
                        </Button>
                      )}
                    </div>
                  </div>
                  <DocPanel
                    content={emailContent}
                    onChange={setEmailContent}
                    placeholder={
                      <div className="text-center p-8 text-gray-400">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">No email yet</p>
                        <p className="text-sm mt-1">Run analysis first, then click <strong>Generate Email</strong></p>
                      </div>
                    }
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}