import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface FormData {
  title: string;
  description: string;
  location: string;
  district: string;
  urgency_level: string;
  incident_type: string;
  image_url: string;
}

const ReportForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    district: '',
    urgency_level: '',
    incident_type: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    'Fire',
    'Flood',
    'Power Outage',
    'Medical Emergency',
    'Accident',
    'Security Issue',
    'Infrastructure Damage',
    'Other'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const districts = [
    'North',
    'South',
    'East',
    'West',
    'Central'
  ];

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to report an incident",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.location || !formData.urgency_level || !formData.incident_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('incident_reports')
        .insert({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          district: formData.district || null,
          urgency_level: formData.urgency_level,
          incident_type: formData.incident_type,
          image_url: formData.image_url || null,
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Incident reported successfully",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        location: '',
        district: '',
        urgency_level: '',
        incident_type: '',
        image_url: ''
      });
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast({
        title: "Error",
        description: "Failed to submit incident report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Report an Incident</CardTitle>
        <CardDescription>
          Fill out this form to report an emergency or incident in your area
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of the incident"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="incident_type" className="text-sm font-medium">
              Incident Type *
            </label>
            <Select value={formData.incident_type} onValueChange={(value) => handleInputChange('incident_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of what happened"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location *
              </label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Street address or landmark"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="district" className="text-sm font-medium">
                District
              </label>
              <Select value={formData.district} onValueChange={(value) => handleInputChange('district', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district.toLowerCase()}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="urgency_level" className="text-sm font-medium">
              Urgency Level *
            </label>
            <Select value={formData.urgency_level} onValueChange={(value) => handleInputChange('urgency_level', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                {urgencyLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium">
              Image URL (optional)
            </label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              placeholder="URL to an image of the incident"
              type="url"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReportForm;