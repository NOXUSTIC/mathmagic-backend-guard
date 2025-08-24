import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { MapPin, Clock, User, Filter } from 'lucide-react';

interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  district: string | null;
  urgency_level: string;
  status: string;
  incident_type: string;
  created_at: string;
  user_id: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  profiles: {
    full_name: string;
  } | null;
}

interface IncidentListProps {
  userOnly?: boolean;
  adminView?: boolean;
}

const IncidentList = ({ userOnly = false, adminView = false }: IncidentListProps) => {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('time');

  const urgencyColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300', 
    high: 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    critical: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300'
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    in_progress: 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    resolved: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300'
  };

  useEffect(() => {
    fetchIncidents();
  }, [user, userOnly]);

  const fetchIncidents = async () => {
    try {
      let query = supabase
        .from('incident_reports')
        .select(`
          *,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (userOnly && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const transformedData: Incident[] = (data || []).map(item => ({
        ...item,
        profiles: item.profiles && typeof item.profiles === 'object' && !Array.isArray(item.profiles) && 'full_name' in item.profiles 
          ? item.profiles as { full_name: string }
          : null
      }));
      
      setIncidents(transformedData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      // If the join fails, fetch incidents without profile info
      try {
        let fallbackQuery = supabase
          .from('incident_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (userOnly && user) {
          fallbackQuery = fallbackQuery.eq('user_id', user.id);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) throw fallbackError;
        
        const fallbackTransformed: Incident[] = (fallbackData || []).map(item => ({
          ...item,
          profiles: null
        }));
        
        setIncidents(fallbackTransformed);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        toast({
          title: "Error",
          description: "Failed to fetch incidents",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({ status: newStatus })
        .eq('id', incidentId);

      if (error) throw error;

      setIncidents(prev => 
        prev.map(incident => 
          incident.id === incidentId 
            ? { ...incident, status: newStatus as any }
            : incident
        )
      );

      toast({
        title: "Success",
        description: "Incident status updated successfully",
      });
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (districtFilter !== 'all' && incident.district !== districtFilter) return false;
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
    if (urgencyFilter !== 'all' && incident.urgency_level !== urgencyFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="text-center">Loading incidents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={districtFilter} onValueChange={setDistrictFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="District" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            <SelectItem value="north">North</SelectItem>
            <SelectItem value="south">South</SelectItem>
            <SelectItem value="east">East</SelectItem>
            <SelectItem value="west">West</SelectItem>
            <SelectItem value="central">Central</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Urgency Levels</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => {
            setDistrictFilter('all');
            setStatusFilter('all');
            setUrgencyFilter('all');
          }}
        >
          Clear Filters
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredIncidents.map((incident) => (
          <Card key={incident.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{incident.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {incident.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={urgencyColors[incident.urgency_level]}>
                    {incident.urgency_level}
                  </Badge>
                  <Badge className={statusColors[incident.status]}>
                    {incident.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{incident.location}</span>
                    {incident.district && (
                      <Badge variant="outline" className="ml-2">
                        {incident.district}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(incident.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{incident.profiles?.full_name || 'Anonymous'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Type:</span> {incident.incident_type}
                  </div>
                </div>
                
                {incident.image_url && (
                  <div>
                    <img 
                      src={incident.image_url} 
                      alt="Incident" 
                      className="w-full h-32 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                {adminView && profile?.role === 'admin' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Update Status:</span>
                    <Select
                      value={incident.status} 
                      onValueChange={(value) => updateIncidentStatus(incident.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No incidents found matching the current filters.
        </div>
      )}
    </div>
  );
};

export default IncidentList;
