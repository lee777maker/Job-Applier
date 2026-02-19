import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { extractCV, extractJobTitlesFromCV, updateProfile } from '@/lib/api';

export default function CVUploadPage() {
  const navigate = useNavigate();
  const { setUploadedCV, setProfile, user} = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionComplete, setExtractionComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const validateAndSetFile = (selectedFile: File) => {
    // Validate file type
    const validTypes = ['.pdf', '.docx', '.doc'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must not exceed 10MB');
      return;
    }

    setFile(selectedFile);
    setUploadedCV(selectedFile);
    toast.success('File selected successfully');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 70 ? 70 : prev + 10));
      }, 200);

      // API CALL - Extract CV
      const extractedData = await extractCV(file);
      
      clearInterval(progressInterval);
      setUploadProgress(80);
      
      // Get user info from context/signup
      let suggestedJobTitles: string[] = [];
      
      try {
        if (extractedData.rawText && extractedData.rawText.length > 50) {
          const jobTitleResult = await extractJobTitlesFromCV(
            extractedData.rawText,
            '' // preferred role (empty for initial extraction)
          );
          
          suggestedJobTitles = jobTitleResult.job_titles || [];
          
          if (suggestedJobTitles.length === 0) {
            console.warn("No job titles extracted from CV");
            toast.warning('Could not auto-detect job titles from CV. You can manually select your role in the next step.');
          } else {
            console.log("Extracted job titles:", suggestedJobTitles);
            toast.success(`Identified ${suggestedJobTitles.length} suitable job roles from your CV`);
          }
        } else {
          console.warn("CV text too short for job title extraction");
          toast.warning('CV text too short for analysis. You can manually select your role.');
        }
      } catch (e) {
        console.error("Job title extraction failed:", e);
        toast.error('Failed to analyze CV for job titles, but continuing with upload...');
        // Continue without AI suggestions - user can still select manually
      }
      
      setUploadProgress(90);

      const firstName = extractedData.contactInfo?.firstName || user?.name || '';
      const lastName = extractedData.contactInfo?.lastName || user?.surname || '';
      
      // Create profile from extracted data
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
      };

      const resumeBase64 = await fileToBase64(file);
      
      if(!user?.id){ 
        toast.error('User not authenticated. Please log in again.'); 
        setIsUploading(false); 
        return;
      }
      
      const profile = {
        id: user.id,
        contactInfo: {
          firstName: firstName,
          lastName: lastName,
          email: extractedData.contactInfo?.email || '',
          phoneNumber: extractedData.contactInfo?.phone || '',
        },
        experience: extractedData.experiences?.map((exp: any, i: number) => ({
          id: exp.id || `exp-${i}`,
          title: exp.title,
          company: exp.company,
          duration: exp.duration,
          description: exp.description,
        })) || [],
        education: extractedData.educations?.map((edu: any, i: number) => ({
          id: edu.id || `edu-${i}`,
          degree: edu.degree,
          institution: edu.institution,
          field: edu.field,
          duration: edu.duration,
          gpa: '',
        })) || [],
        skills: extractedData.skills?.map((skill: any) => 
          typeof skill === 'string' ? skill : skill.name
        ) || [],
        projects: extractedData.projects || [],
        certifications: extractedData.certifications?.map((cert: any) => ({
          id: cert.id || `cert-${Date.now()}-${Math.random()}`,
          name: cert.name,
          link: cert.link || '',
          issuer: cert.issuer || '',
          date: cert.date || ''
        })) || [],
        resumeText: extractedData.rawText || '',
        resumeFileName: file.name,
        resumeUploadedAt: new Date().toISOString(),
        resumeBase64: resumeBase64,
        suggestedJobTitles: suggestedJobTitles,
        primaryJobTitle: suggestedJobTitles[0] || ''
      };
      
      // Save to backend
      await updateProfile(user.id, profile);
      
      // Update local context
      setProfile(profile);
      
      // Save to localStorage for preferences page to access immediately
      localStorage.setItem('suggestedJobTitles', JSON.stringify(suggestedJobTitles));
      
      setExtractionComplete(true);
      toast.success('CV uploaded and analyzed successfully!');
      
      setTimeout(() => navigate('/preferences'), 1500);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload CV');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setUploadedCV(null);
    setUploadProgress(0);
    setExtractionComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload CV</h1>
          <p className="text-muted-foreground">
            Our AI will extract your information and auto-fill your profile
          </p>
        </div>

        {/* Upload Area */}
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }`}
              >
                <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload CV</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* File Preview */}
                <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  {!isUploading && (
                    <button
                      onClick={clearFile}
                      className="p-2 hover:bg-destructive/20 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {uploadProgress < 80 ? 'Uploading...' : 'Analyzing with AI...'}
                      </span>
                      <span className="text-primary font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Success State */}
                {extractionComplete && (
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CV analyzed successfully! Redirecting...</span>
                  </div>
                )}

                {/* Error State - when extraction fails but upload succeeds */}
                {!extractionComplete && !isUploading && uploadProgress === 0 && file && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-xl text-yellow-500 text-sm">
                    <AlertCircle className="w-5 h-5" />
                    <span>Ready to upload and analyze</span>
                  </div>
                )}

                {/* Upload Button */}
                {!extractionComplete && (
                  <Button
                    onClick={handleUpload}
                    className="btn-primary w-full h-14 text-lg"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Analyze CV'
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Info Text */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Files should be in PDF or Word Format and must not exceed 10MB
            </p>
          </CardContent>
        </Card>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/preferences')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}