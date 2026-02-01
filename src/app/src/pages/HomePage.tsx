import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, X, FileText, Image as ImageIcon, FileJson } from 'lucide-react';
import type { ChatMessage, Attachment } from '@/types';

export function HomePage() {
  const { chatMessages, addChatMessage } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() && attachments.length === 0) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    addChatMessage(newMessage);
    setInputValue('');
    setAttachments([]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I\'ve received your message. As an AI job assistant, I can help you with job searches, resume optimization, and career advice. How can I assist you today?',
        timestamp: new Date()
      };
      addChatMessage(aiResponse);
    }, 1000);
  }, [inputValue, attachments, addChatMessage]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);

    Array.from(files).forEach((file) => {
      const isValidType = [
        'application/json',
        'image/png',
        'image/jpeg',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);

      if (isValidType) {
        const attachment: Attachment = {
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file)
        };
        setAttachments(prev => [...prev, attachment]);
      }
    });

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const getFileIcon = (type: string) => {
    if (type.includes('json')) return <FileJson className="w-4 h-4" />;
    if (type.includes('image')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#0f0f0f]">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-semibold text-white mb-2">
              Enter Job description
            </h1>
            <p className="text-gray-500 text-sm">
              Ask me anything about jobs, careers, or upload your resume for analysis
            </p>
          </div>
        ) : (
          chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#f5c518] text-black'
                    : 'bg-[#2a2a2a] text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 text-xs opacity-80"
                      >
                        {getFileIcon(attachment.type)}
                        <span className="truncate">{attachment.name}</span>
                        <span className="text-gray-500">
                          ({formatFileSize(attachment.size)})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[#2a2a2a] bg-[#1a1a1a] p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 bg-[#2a2a2a] rounded-md px-3 py-2"
              >
                <span className="text-[#f5c518]">{getFileIcon(attachment.type)}</span>
                <span className="text-sm text-white truncate max-w-[150px]">
                  {attachment.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(attachment.size)})
                </span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-gray-400 hover:text-white ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".json,.png,.jpg,.jpeg,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] shrink-0"
            disabled={isUploading}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="What would you like to know?"
              className="w-full bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-gray-500 pr-12"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() && attachments.length === 0}
            className="bg-[#f5c518] hover:bg-[#e6b800] text-black shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Supported files: JSON, PNG, JPEG, DOCX
        </p>
      </div>
    </div>
  );
}
