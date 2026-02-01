import { useState, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Send, X, FileText, Image as ImageIcon, FileJson } from 'lucide-react';
import type { ChatMessage, Attachment } from '@/types';
import { set } from 'date-fns';

export function HomePage() {
  const { chatMessages, addChatMessage, resumeText, setResumeText, jobDescription, setJobDescription } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);




  const handleSendMessage = useCallback(async () => {
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

    await processUserRequest(inputValue.trim(), attachments);
  }, [inputValue, attachments, addChatMessage]);

  const processUserRequest = async (message: string, attachments: Attachment[]) => {
    try {
      const lower = message.toLowerCase();
      // Heuristic: if user pastes a long text, treat it as job description
      if (message.length > 300 || lower.includes("about the job") || lower.includes("requirements")) {
        setJobDescription(message);
        }

      // Helper: post JSON to backend and return { response: string } or full payload
      const postJson = async (path: string, payload: any) => {
        const res = await fetch(path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data: any = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

        if (!res.ok) {
          throw new Error(data?.error ?? data?.message ?? text ?? `Request failed: ${res.status}`);
        }
        return data;
      };

      // --- ROUTING ---

      if (lower.includes("tailor") || lower.includes("improve cv") || lower.includes("resume") || lower.includes("cv")) {
        if (!resumeText) {
          addChatMessage({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Please upload your CV first (paperclip icon), then ask me to tailor it.",
            timestamp: new Date(),
          });
          return;
        }

        if (!jobDescription) {
          addChatMessage({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Paste the job description you want to target, then say “tailor my CV”.",
            timestamp: new Date(),
          });
          return;
        }

        // Call the real agent endpoint
        const data = await postJson("/api/ai/tailor-resume", {
          original_resume: resumeText,
          job_description: jobDescription,
          user_profile: {},
          style: "professional",
          tone: "professional",
          length: "standard",
        });

        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.tailored_resume ?? data.response ?? JSON.stringify(data),
          timestamp: new Date(),
        });

        return;
      }
      

      // 2) Match score intent
      if (lower.includes("ats") || lower.includes("match score")) {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sure — paste the job description and make sure your CV is uploaded, then I’ll calculate an ATS/match score.",
          timestamp: new Date(),
        });
        return;
      }

      // 3) Cover letter intent
      if (lower.includes("cover letter") || lower.includes("motivation letter")) {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sure — paste the job description and tell me the company name, then I’ll draft a cover letter.",
          timestamp: new Date(),
        });
        return;
      }

      // 4) Default: call backend chat (still mocked unless you change it)
      const data = await postJson("/api/ai/chat", { message, attachments: [] });

      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response ?? JSON.stringify(data),
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Error processing user request:", error);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${error?.message ?? String(error)}`,
        timestamp: new Date(),
      });
    }
  };
  

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1️⃣ Validate file type
    const isValidType = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);

    if (!isValidType) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ Unsupported file type. Please upload a PDF, DOCX, or TXT resume.",
        timestamp: new Date(),
      });
      return;
    }

    // 2️⃣ Show uploading state
    setIsUploading(true);

    try {
      // 3️⃣ Upload to backend
      const data = await uploadResume(file);

      // 4️⃣ Show backend response in chat
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content:
          `✅ Parsed ${data.filename}\n\n` +
          `Words: ${data.word_count}\n` +
          `Skills: ${data.extracted_skills.join(", ") || "None detected"}\n\n` +
          `Preview:\n${data.content_preview}`,
        timestamp: new Date(),
      });
      setResumeText(data.full_text ?? data.resume_text ?? data.content_preview ?? "");

    } catch (e: any) {
      addChatMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ Resume upload failed: ${e.message ?? String(e)}`,
        timestamp: new Date(),
      });
    } finally {
      // 5️⃣ Always clear loading state
      setIsUploading(false);
    }
    
  };


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
  async function uploadResume(file: File) {
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/ai/upload-resume", {
        method: "POST",
        body: form,
      });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    return res.json() as Promise<{
      filename: string;
      content_preview: string;
      word_count: number;
      extracted_skills: string[];
      full_text?: string;
      resume_text?: string;
    }>;
  }


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
            accept=".pdf,.docx,.txt"
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
          Supported files:DOCX, PDF, TXT
        </p>
      </div>
    </div>
  );
}
