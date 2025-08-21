import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportForm from '@/components/ReportForm';
import IncidentList from '@/components/IncidentList';
import SafetyTips from '@/components/SafetyTips';
import { AlertTriangle, LogOut, User, Plus, List } from 'lucide-react';

const UserDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold text-gray-900">ReliefLink</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {profile?.full_name || user.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">
            Welcome back, {profile?.full_name || 'User'}! Manage your incident reports and stay updated.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="report">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </TabsTrigger>
            <TabsTrigger value="my-reports">
              <List className="h-4 w-4 mr-2" />
              My Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest incident reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    View and manage your recent incident reports and updates.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab('my-reports')}
                  >
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report New Incident</CardTitle>
                  <CardDescription>Submit a new emergency report</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Quickly report emergencies and incidents in your area.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab('report')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Community Updates</CardTitle>
                  <CardDescription>Latest incidents in your area</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Stay informed about ongoing incidents and emergency situations.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/')}
                  >
                    View All
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Community Incidents</CardTitle>
                <CardDescription>
                  Latest incident reports from your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report">
            <div className="max-w-2xl mx-auto">
              <ReportForm />
            </div>
          </TabsContent>

          <TabsContent value="my-reports">
            <Card>
              <CardHeader>
                <CardTitle>My Incident Reports</CardTitle>
                <CardDescription>
                  View and track all your submitted incident reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IncidentList userOnly={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Safety Tips Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <SafetyTips disasterType="General Emergency" location="Your Area" />
      </div>
    </div>
  );
};

export default UserDashboard;