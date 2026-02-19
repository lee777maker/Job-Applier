import { useState, useRef, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  type: 'header' | 'summary' | 'experience' | 'projects' | 'education' | 'skills' | 'generic';
  title: string;   // The section heading text (uppercase), empty for header
  content: string; // HTML content
}

// ─── CV Template Parser ───────────────────────────────────────────────────────
// Parses AI output into sections matching Lethabo's CV format:
// Header → Summary → Professional Experience → Projects → Education → Skills

const SECTION_REGEX = /^(SUMMARY|PROFESSIONAL EXPERIENCE|EXPERIENCE|PROJECTS|EDUCATION|SKILLS|CERTIFICATIONS|LANGUAGES|AWARDS|REFERENCES|PUBLICATIONS|VOLUNTEER|ACHIEVEMENTS)$/i;

function parseAIContent(raw: string, type: 'cv' | 'cover-letter'): Section[] {
  if (type === 'cover-letter') {
    return [{
      id: 'cl-1',
      type: 'generic',
      title: 'Cover Letter',
      content: raw.split('\n').map(l => `<p style="margin:0 0 8px 0">${escapeHtml(l)}</p>`).join(''),
    }];
  }

  const lines = raw.split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;
  let headerLines: string[] = [];
  let headerCollected = false;

  for (let i = 0; i < lines.length; i++) {
    const raw_line = lines[i];
    const trimmed = raw_line.trim();

    if (!trimmed) {
      // Empty line: paragraph break inside current section
      if (current) current.content += '<br/>';
      continue;
    }

    // Check if this is a known section header
    if (SECTION_REGEX.test(trimmed)) {
      headerCollected = true;
      if (current) sections.push(current);
      current = {
        id: `s-${Math.random().toString(36).substr(2, 7)}`,
        type: sectionType(trimmed),
        title: trimmed.toUpperCase(),
        content: '',
      };
      continue;
    }

    // If we haven't hit a section header yet, these are header lines (name + contact)
    if (!headerCollected && i < 8) {
      headerLines.push(trimmed);
      continue;
    }

    // Normal content line — format and append to current section
    if (current) {
      current.content += formatContentLine(raw_line);
    }
  }

  if (current) sections.push(current);

  // Build the header section from first lines (name + contact info)
  if (headerLines.length > 0) {
    const headerSection: Section = {
      id: 'header',
      type: 'header',
      title: '',
      content: buildHeaderHtml(headerLines),
    };
    sections.unshift(headerSection);
  }

  return sections.length
    ? sections
    : [{ id: 'cv-1', type: 'generic', title: 'Curriculum Vitae', content: raw.replace(/\n/g, '<br/>') }];
}

function sectionType(title: string): Section['type'] {
  const t = title.toUpperCase();
  if (t.includes('SUMMARY')) return 'summary';
  if (t.includes('EXPERIENCE')) return 'experience';
  if (t.includes('PROJECT')) return 'projects';
  if (t.includes('EDUCATION')) return 'education';
  if (t.includes('SKILL')) return 'skills';
  return 'generic';
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Format a single content line into HTML */
function formatContentLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';

  // Bullet points
  if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
    return `<li style="margin:0 0 3px 18px;padding-left:4px">${escapeHtml(trimmed.slice(1).trim())}</li>`;
  }

  // Lines that look like a job title + date (e.g., "MiWay Insurance: Role    Jul 2025")
  const datePattern = /(.+?)\s{2,}((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}(?:\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}|(?:\s*[-–]\s*Present|Current))?|\d{4}(?:\s*[-–]\s*\d{4})?)/i;
  const dateMatch = trimmed.match(datePattern);
  if (dateMatch) {
    return `<div style="display:flex;justify-content:space-between;font-weight:bold;margin:6px 0 2px 0">
      <span>${escapeHtml(dateMatch[1].trim())}</span>
      <span>${escapeHtml(dateMatch[2].trim())}</span>
    </div>`;
  }

  // Lines that look like tech stack (comma-separated keywords without verbs)
  const techStackPattern = /^[A-Za-z0-9#+\s,./()-]{5,}(?:,\s*[A-Za-z0-9#+\s./()-]+){2,}$/;
  if (techStackPattern.test(trimmed) && !trimmed.match(/[.!?]$/) && trimmed.length < 120) {
    return `<div style="font-style:italic;color:#444;margin:0 0 4px 0;font-size:9.5pt">${escapeHtml(trimmed)}</div>`;
  }

  // Skill category lines (e.g., "Programming Languages: Python, Java, C++")
  if (trimmed.match(/^[A-Za-z\s&]+:\s.+/)) {
    const [cat, vals] = trimmed.split(':');
    return `<div style="margin:2px 0"><strong>${escapeHtml(cat.trim())}:</strong> ${escapeHtml(vals.trim())}</div>`;
  }

  return `<span>${escapeHtml(trimmed)}</span><br/>`;
}

function buildHeaderHtml(lines: string[]): string {
  if (!lines.length) return '';
  const name = lines[0];
  const contactLines = lines.slice(1);
  return `
    <div style="margin-bottom:12px">
      <div style="font-size:18pt;font-weight:bold;margin-bottom:4px">${escapeHtml(name)}</div>
      ${contactLines.map(l =>
        `<div style="font-size:9.5pt;color:#333">${escapeHtml(l)}</div>`
      ).join('')}
    </div>
  `;
}

// ─── Inline Section Editor ────────────────────────────────────────────────────

function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (html: string) => void }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className="min-h-[80px] p-2 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
      style={{ fontFamily: 'Times New Roman, serif', lineHeight: 1.4 }}
      onBlur={(e) => onUpdate(e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: section.content }}
    />
  );
}

// ─── Sortable Section (left pane) ────────────────────────────────────────────

function SortableSection({ section, onUpdate }: { section: Section; onUpdate: (html: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg p-3 mb-3 select-none">
      <div className="flex items-center gap-2 mb-2 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
          {section.type === 'header' ? 'Header / Contact' : section.title}
        </h3>
      </div>
      <SectionEditor section={section} onUpdate={onUpdate} />
    </div>
  );
}

// ─── CV Preview ───────────────────────────────────────────────────────────────
// Renders sections exactly as they would appear on paper (Times New Roman)

function CVPreview({ sections }: { sections: Section[] }) {
  return (
    <div style={{ fontFamily: 'Times New Roman, serif', color: '#000', fontSize: '10.5pt', lineHeight: 1.45 }}>
      {sections.map((section) => {
        if (section.type === 'header') {
          return (
            <div key={section.id} dangerouslySetInnerHTML={{ __html: section.content }} />
          );
        }
        return (
          <div key={section.id} style={{ marginBottom: '14px' }}>
            {/* Section heading with horizontal rule — matches Lethabo template */}
            <div style={{
              fontWeight: 'bold',
              fontSize: '10.5pt',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '1px solid #000',
              paddingBottom: '2px',
              marginBottom: '6px',
            }}>
              {section.title}
            </div>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Main DocumentEditor Component ───────────────────────────────────────────

export function DocumentEditor({
  initialContent,
  documentType,
}: {
  initialContent: string;
  documentType: 'cv' | 'cover-letter';
}) {
  const [sections, setSections] = useState<Section[]>(() =>
    parseAIContent(initialContent, documentType)
  );
  const [isExporting, setIsExporting] = useState(false);
  const [editorHeight, setEditorHeight] = useState(600);
  const previewRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ y: number; h: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateSection = (id: string, content: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  };

  // ── Height resize ──
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { y: e.clientY, h: editorHeight };
    const onMove = (me: MouseEvent) => {
      if (!resizeRef.current) return;
      const newH = Math.max(300, Math.min(1000, resizeRef.current.h + me.clientY - resizeRef.current.y));
      setEditorHeight(newH);
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [editorHeight]);

  // ── Export PDF (captures the preview pane) ──
  const exportToPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      await html2pdf().set({
        margin: [15, 15, 15, 15],
        filename: `${documentType}-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(previewRef.current).save();
    } finally {
      setIsExporting(false);
    }
  };

  // ── Export Word ──
  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const tnr = 'Times New Roman';

      const allParagraphs = sections.flatMap((section): Paragraph[] => {
        if (section.type === 'header') {
          // Name line (first div text) + contact lines
          const tmp = document.createElement('div');
          tmp.innerHTML = section.content;
          const divs = Array.from(tmp.querySelectorAll('div'));
          return divs.map((div, i) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: div.textContent || '',
                  bold: i === 0,
                  size: i === 0 ? 36 : 20,
                  font: tnr,
                }),
              ],
              spacing: { after: i === 0 ? 100 : 60 },
            })
          );
        }

        return [
          // Section title
          new Paragraph({
            children: [
              new TextRun({
                text: section.title,
                bold: true,
                size: 22,
                font: tnr,
                allCaps: true,
              }),
            ],
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
            spacing: { before: 240, after: 80 },
          }),
          // Content
          ...stripHtmlToLines(section.content).map((line) =>
            new Paragraph({
              children: [new TextRun({ text: line, size: 20, font: tnr })],
              spacing: { after: 60 },
              bullet: line.startsWith('• ') ? { level: 0 } : undefined,
            })
          ),
        ];
      });

      const doc = new Document({
        sections: [{ properties: {}, children: allParagraphs }],
      });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${documentType}-${Date.now()}.docx`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: `${editorHeight}px` }}>
      {/* Toolbar */}
      <div className="flex gap-2 p-3 border-b border-border bg-card flex-shrink-0">
        <Button onClick={exportToPDF} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <FileText className="w-4 h-4 mr-1" />}
          Export PDF
        </Button>
        <Button onClick={exportToWord} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
          Export Word
        </Button>
        <span className="ml-auto text-xs text-muted-foreground self-center">
          Drag ≡ to reorder · Click content to edit
        </span>
      </div>

      {/* Split pane: editor left, preview right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: drag-to-reorder sections */}
        <div className="w-1/2 border-r border-border overflow-y-auto p-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={(content) => updateSection(section.id, content)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Right: live preview (paper-style, Times New Roman) */}
        <div className="w-1/2 bg-gray-200 overflow-y-auto p-4">
          <div
            ref={previewRef}
            className="bg-white shadow-md mx-auto p-10"
            style={{
              minHeight: '11in',
              width: '8.5in',
              fontFamily: 'Times New Roman, serif',
              color: '#000',
            }}
          >
            <CVPreview sections={sections} />
          </div>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        className="h-3 flex items-center justify-center cursor-ns-resize hover:bg-primary/10 border-t border-border flex-shrink-0 select-none"
        onMouseDown={handleResizeStart}
        title="Drag to resize editor"
      >
        <div className="w-16 h-1 rounded-full bg-muted-foreground/40" />
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtmlToLines(html: string): string[] {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}