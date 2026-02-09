import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pencil, FileText, Briefcase, GraduationCap, Folder,
  Award, Wrench, ExternalLink, Save, X, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { getProfile, updateProfile } from '@/lib/api';

// Type definition for contact fields
type ContactField = 'firstName' | 'lastName' | 'email' | 'phoneNumber';

export default function ProfilePage() {
  const { user, profile, setProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  // Load profile from API on mount
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await getProfile(user!.id);
      setProfile(data);
      setEditedProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile || !user?.id) return;
    
    try {
      setIsSaving(true);
      await updateProfile(user.id, editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateContactInfo = (field: ContactField, value: string) => {
    setEditedProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Profile Found</h2>
          <p className="text-muted-foreground mb-6">
            Please upload your CV to create your profile
          </p>
          <Button onClick={() => window.location.href = '/upload-cv'} className="btn-primary">
            Upload CV
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {profile?.contactInfo?.firstName || user?.name} {profile?.contactInfo?.lastName || user?.surname}
            </h1>
            <p className="text-muted-foreground">{profile?.contactInfo?.email || user?.email}</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-primary">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-8">
            {/* Contact Info */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Contact Info
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { label: 'First Name', field: 'firstName' as ContactField },
                      { label: 'Last Name', field: 'lastName' as ContactField },
                      { label: 'Email', field: 'email' as ContactField },
                      { label: 'Phone Number', field: 'phoneNumber' as ContactField },
                    ].map(({ label, field }) => (
                      <div key={field}>
                        <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
                        {isEditing ? (
                          <Input
                            value={editedProfile?.contactInfo?.[field] || ''}
                            onChange={(e) => updateContactInfo(field, e.target.value)}
                            className="input-dark"
                          />
                        ) : (
                          <p className="font-medium">{profile?.contactInfo?.[field] || 'Not provided'}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Experience */}
            {profile?.experience && profile.experience.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Experience
                </h2>
                <div className="space-y-4">
                  {profile?.experience?.map((exp: any) => (
                    <Card key={exp.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{exp.title}</h3>
                            <p className="text-muted-foreground">{exp.company}</p>
                            <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap">{exp.duration}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Resume */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resume
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile?.resumeFileName || 'Resume.pdf'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.resumeUploadedAt 
                          ? `Uploaded on ${new Date(profile.resumeUploadedAt).toLocaleDateString()}`
                          : 'Recently uploaded'
                        }
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-auto">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Education */}
            {profile?.education && profile.education.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </h2>
                <div className="space-y-4">
                  {profile?.education?.map((edu: any) => (
                    <Card key={edu.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Degree</p>
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-sm text-muted-foreground">{edu.field}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Institution</p>
                            <p className="font-medium">{edu.institution}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">GPA</p>
                            <p className="font-medium">{edu.gpa || 'N/A'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {profile?.projects && profile.projects.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-primary" />
                  Projects
                </h2>
                <div className="space-y-4">
                  {profile?.projects?.map((project: any) => (
                    <Card key={project.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <h3 className="font-semibold mb-2">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {profile?.skills && profile.skills.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Skills
                </h2>
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills?.map((skill: any, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                          {typeof skill === 'string' ? skill : skill.name}
                          {skill.level && ` (${skill.level})`}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Certifications */}
            {profile?.certifications && profile.certifications.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications
                </h2>
                <div className="space-y-4">
                  {profile?.certifications?.map((cert: any) => (
                    <Card key={cert.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{cert.name}</p>
                          {cert.link && (
                            <a href={cert.link} target="_blank" rel="noreferrer" className="text-primary text-sm flex items-center">
                              View <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}