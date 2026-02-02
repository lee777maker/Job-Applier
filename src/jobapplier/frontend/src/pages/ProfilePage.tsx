import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Navigation from '@/components/custom/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Pencil, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Folder,
  Award,
  Wrench,
  ExternalLink,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { profile, user, setProfile } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    if (editedProfile) {
      setProfile(editedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateContactInfo = (field: string, value: string) => {
    setEditedProfile(prev => prev ? {
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    } : null);
  };

  if (!profile) {
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
            <h1 className="text-3xl font-bold mb-2">Candidate</h1>
            <p className="text-muted-foreground">
              {user?.name} {user?.surname}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
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
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">First Name</label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.contactInfo.firstName || ''}
                          onChange={(e) => updateContactInfo('firstName', e.target.value)}
                          className="input-dark"
                        />
                      ) : (
                        <p className="font-medium">{profile.contactInfo.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Last Name</label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.contactInfo.lastName || ''}
                          onChange={(e) => updateContactInfo('lastName', e.target.value)}
                          className="input-dark"
                        />
                      ) : (
                        <p className="font-medium">{profile.contactInfo.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.contactInfo.email || ''}
                          onChange={(e) => updateContactInfo('email', e.target.value)}
                          className="input-dark"
                        />
                      ) : (
                        <p className="font-medium">{profile.contactInfo.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Phone Number</label>
                      {isEditing ? (
                        <Input
                          value={editedProfile?.contactInfo.phoneNumber || ''}
                          onChange={(e) => updateContactInfo('phoneNumber', e.target.value)}
                          className="input-dark"
                        />
                      ) : (
                        <p className="font-medium">{profile.contactInfo.phoneNumber}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Experience */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Experience
              </h2>
              <div className="space-y-4">
                {profile.experience.map((exp) => (
                  <Card key={exp.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{exp.title}</h3>
                          <p className="text-muted-foreground">{exp.company}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {exp.description}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {exp.duration}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Resume Upload */}
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
                      <p className="font-medium">LethaboNeoCV.pdf</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded on {new Date().toLocaleDateString()}
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
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Education
              </h2>
              <div className="space-y-4">
                {profile.education.map((edu) => (
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
                          <p className="font-medium">{edu.gpa}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-primary" />
                Projects
              </h2>
              <div className="space-y-4">
                {profile.projects.map((project) => (
                  <Card key={project.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      <h3 className="font-semibold mb-2">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" />
                Skills
              </h2>
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Certifications */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Certifications
              </h2>
              <div className="space-y-4">
                {profile.certifications.map((cert) => (
                  <Card key={cert.id} className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{cert.name}</p>
                        <a
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
