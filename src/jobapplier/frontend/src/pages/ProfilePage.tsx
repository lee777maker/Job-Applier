import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  ExternalLink,
  GraduationCap,
  Briefcase,
  Folder,
  Award,
  User,
  Mail,
  Phone,
  Sparkles
} from 'lucide-react';
import type { Experience, Education, Project, Skill, Certification } from '@/types';

export function ProfilePage() {
  const { 
    profile, 
    isProfileEditing, 
    setIsProfileEditing,
    updateContactInfo,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification
  } = useApp();

  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState(profile.contactInfo);

  const handleSaveContact = () => {
    updateContactInfo(contactForm);
    setEditingContact(false);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#0f0f0f] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Candidate</h1>
          <Button
            onClick={() => setIsProfileEditing(!isProfileEditing)}
            className={`${
              isProfileEditing 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-[#f5c518] hover:bg-[#e6b800] text-black'
            }`}
          >
            {isProfileEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </div>

        {/* Contact Info Section */}
        <Section title="Contact Info" icon={<User className="w-5 h-5" />}>
          <div className="flex justify-end mb-4">
            {isProfileEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editingContact) {
                    handleSaveContact();
                  } else {
                    setEditingContact(true);
                    setContactForm(profile.contactInfo);
                  }
                }}
                className="text-[#f5c518] hover:text-[#e6b800]"
              >
                {editingContact ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            )}
          </div>
          
          {editingContact ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">First Name</Label>
                <Input
                  value={contactForm.firstName}
                  onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Last Name</Label>
                <Input
                  value={contactForm.lastName}
                  onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number
                </Label>
                <Input
                  value={contactForm.phoneNumber}
                  onChange={(e) => setContactForm({ ...contactForm, phoneNumber: e.target.value })}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="First Name" value={profile.contactInfo.firstName} />
              <InfoField label="Last Name" value={profile.contactInfo.lastName} />
              <InfoField label="Email" value={profile.contactInfo.email} icon={<Mail className="w-4 h-4" />} />
              <InfoField label="Phone Number" value={profile.contactInfo.phoneNumber} icon={<Phone className="w-4 h-4" />} />
            </div>
          )}
        </Section>

        {/* Experience Section */}
        <Section title="Experience" icon={<Briefcase className="w-5 h-5" />}>
          <div className="space-y-4">
            {profile.experience.map((exp) => (
              <ExperienceCard 
                key={exp.id} 
                experience={exp} 
                isEditing={isProfileEditing}
                onUpdate={(updated) => updateExperience(exp.id, updated)}
                onRemove={() => removeExperience(exp.id)}
              />
            ))}
            {isProfileEditing && (
              <Button
                variant="outline"
                onClick={() => addExperience({
                  id: Date.now().toString(),
                  title: 'New Position',
                  company: 'Company Name',
                  duration: 'Duration',
                  description: 'Description of your role and achievements...'
                })}
                className="w-full border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            )}
          </div>
        </Section>

        {/* Education Section */}
        <Section title="Education" icon={<GraduationCap className="w-5 h-5" />}>
          <div className="space-y-4">
            {profile.education.map((edu) => (
              <EducationCard 
                key={edu.id} 
                education={edu}
                isEditing={isProfileEditing}
                onUpdate={(updated) => updateEducation(edu.id, updated)}
                onRemove={() => removeEducation(edu.id)}
              />
            ))}
            {isProfileEditing && (
              <Button
                variant="outline"
                onClick={() => addEducation({
                  id: Date.now().toString(),
                  degree: 'Degree',
                  field: 'Field of Study',
                  institution: 'Institution Name',
                  gpa: 'GPA'
                })}
                className="w-full border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            )}
          </div>
        </Section>

        {/* Projects Section */}
        <Section title="Projects" icon={<Folder className="w-5 h-5" />}>
          <div className="space-y-4">
            {profile.projects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                isEditing={isProfileEditing}
                onUpdate={(updated) => updateProject(project.id, updated)}
                onRemove={() => removeProject(project.id)}
              />
            ))}
            {isProfileEditing && (
              <Button
                variant="outline"
                onClick={() => addProject({
                  id: Date.now().toString(),
                  name: 'Project Name',
                  description: 'Description of your project...'
                })}
                className="w-full border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        </Section>

        {/* Skills Section */}
        <Section title="Skills" icon={<Sparkles className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <SkillBadge 
                key={skill.id} 
                skill={skill}
                isEditing={isProfileEditing}
                onRemove={() => removeSkill(skill.id)}
              />
            ))}
            {isProfileEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSkill({
                  id: Date.now().toString(),
                  name: 'New Skill'
                })}
                className="border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            )}
          </div>
        </Section>

        {/* Certifications Section */}
        <Section title="Certifications" icon={<Award className="w-5 h-5" />}>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert) => (
              <CertBadge 
                key={cert.id} 
                certification={cert}
                isEditing={isProfileEditing}
                onRemove={() => removeCertification(cert.id)}
              />
            ))}
            {isProfileEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => addCertification({
                  id: Date.now().toString(),
                  name: 'New Certification',
                  link: '#'
                })}
                className="border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:border-[#f5c518]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

// Section Component
function Section({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode 
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-[#2a2a2a]">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-[#f5c518]">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

// Info Field Component
function InfoField({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode 
}) {
  return (
    <div>
      <p className="text-gray-500 text-sm mb-1 flex items-center gap-2">
        {icon} {label}
      </p>
      <p className="text-white">{value}</p>
    </div>
  );
}

// Experience Card Component
function ExperienceCard({ 
  experience, 
  isEditing, 
  onUpdate, 
  onRemove 
}: { 
  experience: Experience; 
  isEditing: boolean; 
  onUpdate: (exp: Experience) => void;
  onRemove: () => void;
}) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [formData, setFormData] = useState(experience);

  if (!isEditing) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-white font-medium">{experience.title}</h3>
          <span className="text-[#f5c518] text-sm">{experience.duration}</span>
        </div>
        <p className="text-gray-400 text-sm mb-2">{experience.company}</p>
        <p className="text-gray-500 text-sm">{experience.description}</p>
      </div>
    );
  }

  if (isEditingLocal) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Title"
        />
        <Input
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Company"
        />
        <Input
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Duration"
        />
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate(formData);
              setIsEditingLocal(false);
            }}
            className="bg-[#f5c518] hover:bg-[#e6b800] text-black"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFormData(experience);
              setIsEditingLocal(false);
            }}
            className="text-gray-400"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 flex justify-between items-center">
      <div>
        <h3 className="text-white font-medium">{experience.title}</h3>
        <p className="text-gray-400 text-sm">{experience.company} · {experience.duration}</p>
      </div>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditingLocal(true)}
          className="text-gray-400 hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Education Card Component
function EducationCard({ 
  education, 
  isEditing, 
  onUpdate, 
  onRemove 
}: { 
  education: Education; 
  isEditing: boolean; 
  onUpdate: (edu: Education) => void;
  onRemove: () => void;
}) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [formData, setFormData] = useState(education);

  if (!isEditing) {
    return (
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-white font-medium">{education.degree}</p>
          <p className="text-gray-400">{education.field}</p>
        </div>
        <div>
          <p className="text-gray-500">Institution</p>
          <p className="text-white">{education.institution}</p>
        </div>
        <div>
          <p className="text-gray-500">GPA</p>
          <p className="text-white">{education.gpa}</p>
        </div>
      </div>
    );
  }

  if (isEditingLocal) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
            placeholder="Degree"
          />
          <Input
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
            className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
            placeholder="Field"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
            placeholder="Institution"
          />
          <Input
            value={formData.gpa}
            onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
            className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
            placeholder="GPA"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate(formData);
              setIsEditingLocal(false);
            }}
            className="bg-[#f5c518] hover:bg-[#e6b800] text-black"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFormData(education);
              setIsEditingLocal(false);
            }}
            className="text-gray-400"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 flex justify-between items-center">
      <div className="grid grid-cols-3 gap-4 flex-1 text-sm">
        <div>
          <p className="text-white font-medium">{education.degree}</p>
          <p className="text-gray-400">{education.field}</p>
        </div>
        <div>
          <p className="text-gray-500">Institution</p>
          <p className="text-white">{education.institution}</p>
        </div>
        <div>
          <p className="text-gray-500">GPA</p>
          <p className="text-white">{education.gpa}</p>
        </div>
      </div>
      <div className="flex gap-2 ml-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditingLocal(true)}
          className="text-gray-400 hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Project Card Component
function ProjectCard({ 
  project, 
  isEditing, 
  onUpdate, 
  onRemove 
}: { 
  project: Project; 
  isEditing: boolean; 
  onUpdate: (proj: Project) => void;
  onRemove: () => void;
}) {
  const [isEditingLocal, setIsEditingLocal] = useState(false);
  const [formData, setFormData] = useState(project);

  if (!isEditing) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">{project.name}</h3>
        <p className="text-gray-500 text-sm">{project.description}</p>
      </div>
    );
  }

  if (isEditingLocal) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 space-y-3">
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Project Name"
        />
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-[#3a3a3a] border-[#4a4a4a] text-white"
          placeholder="Description"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              onUpdate(formData);
              setIsEditingLocal(false);
            }}
            className="bg-[#f5c518] hover:bg-[#e6b800] text-black"
          >
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFormData(project);
              setIsEditingLocal(false);
            }}
            className="text-gray-400"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] rounded-lg p-4 flex justify-between items-center">
      <div>
        <h3 className="text-white font-medium">{project.name}</h3>
        <p className="text-gray-500 text-sm truncate max-w-md">{project.description}</p>
      </div>
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditingLocal(true)}
          className="text-gray-400 hover:text-white"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Skill Badge Component
function SkillBadge({ 
  skill, 
  isEditing, 
  onRemove 
}: { 
  skill: Skill; 
  isEditing: boolean; 
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-4 py-2">
      <span className="text-white text-sm">{skill.name}</span>
      {isEditing && (
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-red-500"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Certification Badge Component
function CertBadge({ 
  certification, 
  isEditing, 
  onRemove 
}: { 
  certification: Certification; 
  isEditing: boolean; 
  onRemove: () => void;
}) {
  return (
    <a
      href={certification.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-[#2a2a2a] rounded-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors"
    >
      <span className="text-white text-sm">{certification.name}</span>
      {!isEditing && <ExternalLink className="w-3 h-3 text-[#f5c518]" />}
      {isEditing && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
          className="text-gray-500 hover:text-red-500"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </a>
  );
}
