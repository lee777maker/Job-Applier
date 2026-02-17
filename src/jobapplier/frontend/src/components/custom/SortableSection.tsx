import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

export function SortableSection({ section, onUpdate }: { section: any; onUpdate: (c: string) => void }) {
  const [content, setContent] = useState(section.content);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle content change and propagate to parent
  const handleChange = (newContent: string) => {
    setContent(newContent);
    onUpdate(newContent);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-card border border-border rounded-lg p-4 mb-4 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <button 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <h3 className="font-semibold text-sm uppercase tracking-wider">{section.title}</h3>
      </div>
      
      {/* Fixed: Use handleChange instead of undefined onChange */}
      <div
        contentEditable
        className="min-h-[150px] p-3 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
        style={{ fontFamily: 'Times New Roman, serif' }}
        onBlur={(e) => handleChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}