import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronRight, MapPin, Briefcase, Clock, Globe, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getProfile, updateProfile } from '@/lib/api';

interface RoleCategory {
  name: string;
  subcategories: string[];
}

const roleCategories: RoleCategory[] = [
  {
    name: 'Software/IT',
    subcategories: [
      'Software Engineering',
      'Backend Engineering',
      'Frontend Engineering',
      'Full Stack Engineering',
      'DevOps Engineering',
      'Data Engineering',
      'Machine Learning Engineering',
      'Mobile Engineering',
      'Security Engineering',
    ],
  },
  {
    name: 'Consulting',
    subcategories: [
      'Management Consulting',
      'Strategy Consulting',
      'Technology Consulting',
      'Financial Advisory',
    ],
  },
  {
    name: 'Marketing',
    subcategories: [
      'Digital Marketing',
      'Content Marketing',
      'Product Marketing',
      'Brand Management',
    ],
  },
  {
    name: 'Finance',
    subcategories: [
      'Investment Banking',
      'Corporate Finance',
      'Financial Analysis',
      'Risk Management',
    ],
  },
  {
    name: 'Product',
    subcategories: [
      'Product Management',
      'Product Design',
      'UX Research',
      'Product Analytics',
    ],
  },
  {
    name: 'Healthcare',
    subcategories: [
      'Healthcare Administration',
      'Clinical Research',
      'Health Informatics',
      'Public Health',
    ],
  },
  {
    name: 'Human Resource/Administrative/Legal',
    subcategories: [
      'Human Resources',
      'Office Administration',
      'Legal Services',
      'Compliance',
    ],
  },
  {
    name: 'Sales',
    subcategories: [
      'Business Development',
      'Account Management',
      'Sales Operations',
      'Enterprise Sales',
    ],
  },
];

const contractTypes = [
  { id: 'full-time', label: 'Full-time', icon: Briefcase },
  { id: 'part-time', label: 'Part-time', icon: Clock },
  { id: 'contract', label: 'Contract', icon: Briefcase },
  { id: 'internship', label: 'Internship', icon: Briefcase },
];

const locations = [
  { id: 'johannesburg', label: 'Johannesburg, GP', icon: MapPin },
  { id: 'cape-town', label: 'Cape Town, WC', icon: MapPin },
  { id: 'durban', label: 'Durban, KZN', icon: MapPin },
  { id: 'pretoria', label: 'Pretoria, GP', icon: MapPin },
];

export default function JobPreferencesPage() {
  const navigate = useNavigate();
  const { setJobPreferences, user, profile } = useApp();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [openToRemote, setOpenToRemote] = useState(true);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load suggested roles from localStorage or API
  useEffect(() => {
    loadSuggestedRoles();
  }, [user?.id]);

  const loadSuggestedRoles = async () => {
    if (!user?.id) {
      console.log('No user ID available');
      return;
    }

    // First try localStorage (immediate)
    const saved = localStorage.getItem('suggestedJobTitles');
    if (saved) {
      try {
        const titles = JSON.parse(saved);
        console.log('Loaded from localStorage:', titles);
        if (Array.isArray(titles) && titles.length > 0) {
          setSuggestedRoles(titles);
          if (!selectedRole) {
            setSelectedRole(titles[0]);
          }
          return; // Exit early if we have localStorage data
        }
      } catch (e) {
        console.error("Failed to parse suggested roles from localStorage:", e);
      }
    }
    
    // Fallback: fetch from profile API
    console.log('Fetching suggested roles from API for user:', user.id);
    setIsRefreshing(true);
    try {
      const profileData = await getProfile(user.id);
      console.log('Profile data received:', profileData);
      
      if (profileData?.suggestedJobTitles && profileData.suggestedJobTitles.length > 0) {
        console.log('Setting suggested roles from API:', profileData.suggestedJobTitles);
        setSuggestedRoles(profileData.suggestedJobTitles);
        // Save to localStorage for next time
        localStorage.setItem('suggestedJobTitles', JSON.stringify(profileData.suggestedJobTitles));
        if (!selectedRole) {
          setSelectedRole(profileData.suggestedJobTitles[0]);
        }
      } else {
        console.warn('No suggestedJobTitles found in profile');
        // If profile has primaryJobTitle but no suggestedJobTitles array
        if (profileData?.primaryJobTitle) {
          setSuggestedRoles([profileData.primaryJobTitle]);
          localStorage.setItem('suggestedJobTitles', JSON.stringify([profileData.primaryJobTitle]));
          if (!selectedRole) {
            setSelectedRole(profileData.primaryJobTitle);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile for suggested roles:", err);
      toast.error('Failed to load AI suggestions. Please select your role manually.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContractTypeToggle = (typeId: string) => {
    setSelectedContractTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleRoleSelect = (subcategory: string, category: string) => {
    setSelectedRole(subcategory);
    setSelectedCategory(category);
    setShowRoleDropdown(false);
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error('Please select a preferred role');
      return;
    }

    if (selectedContractTypes.length === 0) {
      toast.error('Please select at least one contract type');
      return;
    }

    if (!selectedLocation && !openToRemote) {
      toast.error('Please select a location or enable remote work');
      return;
    }

    setIsLoading(true);

    try {
      const preferences = {
        preferredRole: selectedRole,
        contractTypes: selectedContractTypes,
        location: selectedLocation,
        openToRemote,
      };

      // Save to context
      setJobPreferences(preferences);
      
      // Save to backend (merge with existing profile)
      if (user?.id) {
        await updateProfile(user.id, {
          ...profile,
          preferences: preferences,
          preferredRole: selectedRole,
          location: selectedLocation,
          openToRemote: openToRemote
        });
      }
      
      toast.success('Preferences saved!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Job Preferences</h1>
          <p className="text-muted-foreground">
            Tell us what you're looking for so we can find the best matches
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Preferred Role */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <span className="text-primary">*</span> Preferred role
              </label>
              <div className="relative">
                <Input
                  placeholder="Please select/ enter your preferred role"
                  value={selectedRole}
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  readOnly
                  className="input-dark h-14 cursor-pointer"
                />
                
                {showRoleDropdown && (
                  <div className="dropdown-menu mt-2 max-h-[500px] overflow-y-auto">
                    {/* AI Suggestions Section */}
                    {(suggestedRoles.length > 0 || isRefreshing) && (
                      <div className="p-3 bg-primary/5 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-primary flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            SUGGESTED BASED ON YOUR CV
                          </p>
                          {isRefreshing && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                        </div>
                        
                        {suggestedRoles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {suggestedRoles.map((title) => (
                              <button
                                key={title}
                                onClick={() => {
                                  setSelectedRole(title);
                                  setShowRoleDropdown(false);
                                }}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                              >
                                {title}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No suggestions available</p>
                        )}
                        
                        {/* Refresh button */}
                        {!isRefreshing && suggestedRoles.length === 0 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              loadSuggestedRoles();
                            }}
                            className="text-xs text-primary flex items-center gap-1 mt-2 hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Refresh suggestions
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2">
                      {/* Categories */}
                      <div className="border-r border-border">
                        {roleCategories.map((category) => (
                          <div
                            key={category.name}
                            onClick={() => setSelectedCategory(category.name)}
                            className={`dropdown-item flex items-center justify-between ${
                              selectedCategory === category.name
                                ? 'bg-primary/10 text-primary'
                                : ''
                            }`}
                          >
                            <span>{category.name}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        ))}
                      </div>
                      
                      {/* Subcategories */}
                      <div>
                        {selectedCategory &&
                          roleCategories
                            .find(c => c.name === selectedCategory)
                            ?.subcategories.map((sub) => (
                              <div
                                key={sub}
                                onClick={() => handleRoleSelect(sub, selectedCategory)}
                                className={`dropdown-item text-sm hover:bg-primary/10 hover:text-primary ${
                                  selectedRole === sub ? 'bg-primary/10 text-primary font-medium' : ''
                                }`}
                              >
                                {sub}
                              </div>
                            ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Debug info - remove in production */}
              {suggestedRoles.length === 0 && !isRefreshing && (
                <p className="text-xs text-muted-foreground mt-2">
                  No AI suggestions loaded. {!user?.id ? 'Please log in again.' : 'Try uploading your CV again.'}
                </p>
              )}
            </div>

            {/* Contract Type */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <span className="text-primary">*</span> Contract Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {contractTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedContractTypes.includes(type.id);
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleContractTypeToggle(type.id)}
                      className={`checkbox-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span>{type.label}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-3">
                <span className="text-primary">*</span> Location
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {locations.map((loc) => {
                    const Icon = loc.icon;
                    const isSelected = selectedLocation === loc.id;
                    return (
                      <div
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc.id)}
                        className={`checkbox-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm">{loc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Remote Option */}
                <div
                  onClick={() => setOpenToRemote(!openToRemote)}
                  className={`checkbox-card ${openToRemote ? 'selected' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <span>Open to Remote</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      openToRemote
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {openToRemote && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="hidden lg:block">
            <Card className="bg-card border-border h-full">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Preferred Role</p>
                    <p className="font-medium">
                      {selectedRole || 'Not selected'}
                    </p>
                    {suggestedRoles.length > 0 && selectedRole && suggestedRoles.includes(selectedRole) && (
                      <span className="text-xs text-primary flex items-center gap-1 mt-1">
                        <Sparkles className="w-3 h-3" />
                        AI Suggested
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contract Types</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContractTypes.length > 0 ? (
                        selectedContractTypes.map(type => (
                          <span key={type} className="tag tag-primary">
                            {contractTypes.find(t => t.id === type)?.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None selected</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">
                      {selectedLocation
                        ? locations.find(l => l.id === selectedLocation)?.label
                        : 'Not selected'}
                      {openToRemote && ' (Remote OK)'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSubmit}
            className="btn-primary px-12 h-14 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}