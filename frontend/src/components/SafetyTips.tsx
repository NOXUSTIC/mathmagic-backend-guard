
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

interface SafetyTipsProps {
  disasterType: string;
  location?: string;
}

const SafetyTips = ({ disasterType, location }: SafetyTipsProps) => {
  const [tips, setTips] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generateTips = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-safety-tips', {
        body: { disasterType, location }
      });

      if (error) throw error;

      setTips(data.safetyTips);
    } catch (error) {
      console.error('Error generating safety tips:', error);
      toast({
        title: "Error",
        description: "Failed to generate safety tips. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !tips && !loading) {
      generateTips();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Safety Tips
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Safety Tips for {disasterType}
          </DialogTitle>
          <DialogDescription>
            AI-generated safety recommendations for {disasterType.toLowerCase()} disasters
            {location && ` in ${location}`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Generating safety tips...</span>
            </div>
          ) : tips ? (
            <Card>
              <CardContent className="pt-6">
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {tips}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Safety tips will appear here once generated.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyTips;
