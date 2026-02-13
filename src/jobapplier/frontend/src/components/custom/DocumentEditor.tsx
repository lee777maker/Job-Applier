import { useState, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface Section {
  id: string;
  type: string;
  title: string;
  content: string;
}

// Simple editable div instead of Quill (React 19 compatible)
function SimpleEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  return (
    <div
      contentEditable
      className="min-h-[150px] p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
      style={{ fontFamily: 'Times New Roman, serif' }}
      onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export function DocumentEditor({ 
  initialContent, 
  documentType 
}: { 
  initialContent: string;
  documentType: 'cv' | 'cover-letter';
}) {
  const [sections, setSections] = useState<Section[]>(() => parseAIContent(initialContent, documentType));
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateSection = (id: string, content: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const exportToPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${documentType}-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    await html2pdf().set(opt).from(previewRef.current).save();
    setIsExporting(false);
  };

  const exportToWord = async () => {
    setIsExporting(true);
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections.flatMap(section => [
          new Paragraph({
            children: [new TextRun({ text: section.title, bold: true, size: 24, font: 'Times New Roman' })],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: stripHtml(section.content), size: 22, font: 'Times New Roman' })],
            spacing: { after: 300 }
          })
        ])
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${documentType}-${Date.now()}.docx`);
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex gap-2 p-4 border-b border-border bg-card">
        <Button onClick={exportToPDF} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Export PDF
        </Button>
        <Button onClick={exportToWord} disabled={isExporting} variant="outline" size="sm">
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Word
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r border-border overflow-y-auto p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
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

        <div className="w-1/2 bg-gray-100 overflow-y-auto p-4">
          <div 
            ref={previewRef}
            className="bg-white shadow-lg mx-auto p-6 min-h-[11in] w-[8.5in]"
            style={{ fontFamily: 'Times New Roman, serif' }}
          >
            {sections.map((section) => (
              <div key={section.id} className="mb-4">
                <h2 className="text-lg font-bold border-b border-gray-300 mb-2 uppercase tracking-wider">
                  {section.title}
                </h2>
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableSection({ section, onUpdate }: { section: Section; onUpdate: (c: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2" {...attributes} {...listeners}>
        <button className="cursor-grab text-muted-foreground">
          <GripVertical className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-sm uppercase">{section.title}</h3>
      </div>
      <SimpleEditor content={section.content} onChange={onUpdate} />
    </div>
  );
}

function parseAIContent(content: string, type: 'cv' | 'cover-letter'): Section[] {
  if (type === 'cover-letter') {
    return [{ id: '1', type: 'letter', title: 'Cover Letter', content: content.replace(/\n/g, '<br/>') }];
  }
  
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  
  lines.forEach(line => {
    if (line.match(/^(EXPERIENCE|EDUCATION|SKILLS|PROJECTS|SUMMARY)/i)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: Math.random().toString(36).substr(2, 9),
        type: line.toLowerCase(),
        title: line.trim(),
        content: ''
      };
    } else if (currentSection) {
      currentSection.content += line + '<br/>';
    }
  });
  
  if (currentSection) sections.push(currentSection);
  return sections.length ? sections : [{ id: '1', type: 'cv', title: 'Curriculum Vitae', content: content.replace(/\n/g, '<br/>') }];
}

function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}