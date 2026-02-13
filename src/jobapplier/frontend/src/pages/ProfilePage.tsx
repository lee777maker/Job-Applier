import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pencil, FileText, Briefcase, GraduationCap, Folder,
  Award, ExternalLink, Save, X, Loader2 
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
  const [newExperience, setNewExperience] = useState({ title: '', company: '', duration: '', description: '' });
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [newCertification, setNewCertification] = useState({ name: '', link: '' });
  const [newEducation, setNewEducation] = useState({ 
  degree: '', 
  institution: '', 
  field: '', 
  duration: '', 
  gpa: '' 
});
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

  const updateExperience = (index: number, field: string, value: string) => {
    setEditedProfile(prev => {
      if (!prev) return null;
      const updatedExperience = [...(prev.experience || [])];
      updatedExperience[index] ={ ...updatedExperience[index], [field]: value };
      return { ...prev, experience: updatedExperience };
    });
  };

  const addExperience = () => {
    if ((editedProfile?.experience?.length || 0) >= 7){
      toast.error('Maximum of 7 experiences allowed');
      return;
    }
    setEditedProfile(prev => ({
      ...prev!,
      experience: [...(prev?.experience|| []), { ...newExperience, id: `exp-${Date.now()}` }]
    }));
    setNewExperience({ title: '', company: '', duration: '', description: '' });
  };

  const removeExperience = (index: number) => {
    setEditedProfile(prev => ({
      ...prev!,
      experience: prev?.experience?.filter((_, i) => i !== index) || []
    }));
  };

  const updateProject = (index: number, field: string, value: string) => {
    setEditedProfile(prev => {
      if (!prev) return null;
      const updatedProjects = [...(prev.projects || [])];
      updatedProjects[index] = { ...updatedProjects[index], [field]: value };
      return { ...prev, projects: updatedProjects };
    });
  };
  
  const addProject = () => {
    setEditedProfile(prev => ({
      ...prev!,
      projects: [...(prev?.projects || []), { ...newProject, id: `proj-${Date.now()}` }]
    }));
    setNewProject({ name: '', description: '' });
  };
  
  const removeProject = (index: number) => {
    setEditedProfile(prev => ({
      ...prev!,
      projects: prev?.projects?.filter((_, i) => i !== index) || []
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setEditedProfile(prev => {
      if (!prev) return null;
      const updatedCerts = [...(prev.certifications || [])];
      updatedCerts[index] = { ...updatedCerts[index], [field]: value };
      return { ...prev, certifications: updatedCerts };
    });
  };
  
  const addCertification = () => {
    setEditedProfile(prev => ({
      ...prev!,
      certifications: [...(prev?.certifications || []), { ...newCertification, id: `cert-${Date.now()}` }]
    }));
    setNewCertification({ name: '', link: '' });
  };

  const removeCertification = (index: number) => {
    setEditedProfile(prev => ({
      ...prev!,
      certifications: prev?.certifications?.filter((_, i) => i !== index) || []
    }));
  };

const updateEducation = (index: number, field: string, value: string) => {
  setEditedProfile(prev => {
    if (!prev) return null;
    const newEdu = [...(prev.education || [])];
    newEdu[index] = { ...newEdu[index], [field]: value };
    return { ...prev, education: newEdu };
  });
};

const addEducation = () => {
  setEditedProfile(prev => ({
    ...prev!,
    education: [...(prev?.education || []), { ...newEducation, id: `edu-${Date.now()}` }]
  }));
  setNewEducation({ degree: '', institution: '', field: '', duration: '', gpa: '' });
};

const removeEducation = (index: number) => {
  setEditedProfile(prev => ({
    ...prev!,
    education: prev?.education?.filter((_, i) => i !== index) || []
  }));
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Experience ({editedProfile?.experience?.length || 0}/7)
                  </h2>
                  {isEditing && (editedProfile?.experience?.length || 0) < 7 && (
                    <Button variant="outline" size="sm" onClick={addExperience}>
                      + Add
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {editedProfile?.experience?.map((exp: any, index: number) => (
                    <Card key={exp.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                value={exp.title}
                                onChange={(e) => updateExperience(index, 'title', e.target.value)}
                                placeholder="Job Title"
                                className="input-dark font-semibold"
                              />
                              <Input
                                value={exp.duration}
                                onChange={(e) => updateExperience(index, 'duration', e.target.value)}
                                placeholder="Duration (e.g., Dec 2023 - Jan 2024)"
                                className="input-dark text-right"
                              />
                            </div>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(index, 'company', e.target.value)}
                              placeholder="Company"
                              className="input-dark text-muted-foreground"
                            />
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full bg-secondary border-border rounded-md p-3 text-sm min-h-[100px]"
                            />
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeExperience(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{exp.title}</h3>
                              <p className="text-muted-foreground">{exp.company}</p>
                              <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
                            </div>
                            <span className="text-sm text-white whitespace-nowrap ml-4">{exp.duration}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Add new experience form when editing */}
                  {isEditing && (editedProfile?.experience?.length || 0) < 7 && (
                    <Card className="bg-card border-border border-dashed">
                      <CardContent className="p-5 space-y-3">
                        <p className="text-sm text-muted-foreground">Add New Experience</p>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={newExperience.title}
                            onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                            placeholder="Job Title"
                            className="input-dark"
                          />
                          <Input
                            value={newExperience.duration}
                            onChange={(e) => setNewExperience({...newExperience, duration: e.target.value})}
                            placeholder="Duration"
                            className="input-dark"
                          />
                        </div>
                        <Input
                          value={newExperience.company}
                          onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                          placeholder="Company"
                          className="input-dark"
                        />
                        <textarea
                          value={newExperience.description}
                          onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                          placeholder="Description"
                          className="w-full bg-secondary border-border rounded-md p-3 text-sm min-h-[100px]"
                        />
                        <Button onClick={addExperience} disabled={!newExperience.title}>
                          Add Experience
                        </Button>
                      </CardContent>
                    </Card>
                  )}
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
                    {profile?.resumeFileName && (
                    <Button variant="outline" size="sm" className="ml-auto" onClick={()=>{
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<iframe src="${profile.resumeBase64}" width="100%"; height="100%" style="border:none;"> </iframe>`);
                      }
                    }}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>)}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Education */}
            {profile?.education && profile.education.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </h2>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={addEducation}>
                    + Add
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {editedProfile?.education?.map((edu: any, index: number) => (
                  <Card key={edu.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={edu.degree}
                              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                              placeholder="Degree"
                              className="input-dark font-medium"
                            />
                            <Input
                              value={edu.duration}
                              onChange={(e) => updateEducation(index, 'duration', e.target.value)}
                              placeholder="Duration"
                              className="input-dark"
                            />
                          </div>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            placeholder="Institution"
                            className="input-dark"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              value={edu.field}
                              onChange={(e) => updateEducation(index, 'field', e.target.value)}
                              placeholder="Field of Study"
                              className="input-dark"
                            />
                            <Input
                              value={edu.gpa}
                              onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                              placeholder="GPA"
                              className="input-dark"
                            />
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeEducation(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {isEditing && (
                  <Card className="bg-card border-border border-dashed">
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm text-muted-foreground">Add New Education</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={newEducation.degree}
                          onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                          placeholder="Degree"
                          className="input-dark"
                        />
                        <Input
                          value={newEducation.duration}
                          onChange={(e) => setNewEducation({...newEducation, duration: e.target.value})}
                          placeholder="Duration"
                          className="input-dark"
                        />
                      </div>
                      <Input
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                        placeholder="Institution"
                        className="input-dark"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={newEducation.field}
                          onChange={(e) => setNewEducation({...newEducation, field: e.target.value})}
                          placeholder="Field of Study"
                          className="input-dark"
                        />
                        <Input
                          value={newEducation.gpa}
                          onChange={(e) => setNewEducation({...newEducation, gpa: e.target.value})}
                          placeholder="GPA"
                          className="input-dark"
                        />
                      </div>
                      <Button onClick={addEducation} disabled={!newEducation.degree}>
                        Add Education
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
            )}

            {/* Projects */}
            {profile?.projects && profile.projects.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    Projects
                  </h2>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={addProject}>
                      + Add
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {editedProfile?.projects?.map((project: any, index: number) => (
                    <Card key={project.id} className="bg-card border-border">
                      <CardContent className="p-5">
                        {isEditing ? (
                          <div className="space-y-3">
                            <Input
                              value={project.name}
                              onChange={(e) => updateProject(index, 'name', e.target.value)}
                              placeholder="Project Name"
                              className="input-dark font-semibold"
                            />
                            <textarea
                              value={project.description}
                              onChange={(e) => updateProject(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full bg-secondary border-border rounded-md p-3 text-sm min-h-[80px]"
                            />
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => removeProject(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold mb-2">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">{project.description}</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  {isEditing && (
                    <Card className="bg-card border-border border-dashed">
                      <CardContent className="p-5 space-y-3">
                        <p className="text-sm text-muted-foreground">Add New Project</p>
                        <Input
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          placeholder="Project Name"
                          className="input-dark"
                        />
                        <textarea
                          value={newProject.description}
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                          placeholder="Description"
                          className="w-full bg-secondary border-border rounded-md p-3 text-sm min-h-[80px]"
                        />
                        <Button onClick={addProject} disabled={!newProject.name}>
                          Add Project
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {/* Certifications */}
            {profile?.certifications && profile.certifications.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications
                </h2>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={addCertification}>
                    + Add
                  </Button>
                )}
              </div>
              
              <div className="space-y-4">
                {editedProfile?.certifications?.map((cert: any, index: number) => (
                  <Card key={cert.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={cert.name}
                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                            placeholder="Certification Name"
                            className="input-dark font-medium"
                          />
                          <Input
                            value={cert.link || ''}
                            onChange={(e) => updateCertification(index, 'link', e.target.value)}
                            placeholder="Link (optional)"
                            className="input-dark"
                          />
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeCertification(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{cert.name}</p>
                          {cert.link && (
                            <a href={cert.link} target="_blank" rel="noreferrer" className="text-primary text-sm flex items-center">
                              View <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {isEditing && (
                  <Card className="bg-card border-border border-dashed">
                    <CardContent className="p-5 space-y-3">
                      <p className="text-sm text-muted-foreground">Add New Certification</p>
                      <Input
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
                        placeholder="Certification Name"
                        className="input-dark"
                      />
                      <Input
                        value={newCertification.link}
                        onChange={(e) => setNewCertification({...newCertification, link: e.target.value})}
                        placeholder="Link (optional)"
                        className="input-dark"
                      />
                      <Button onClick={addCertification} disabled={!newCertification.name}>
                        Add Certification
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}