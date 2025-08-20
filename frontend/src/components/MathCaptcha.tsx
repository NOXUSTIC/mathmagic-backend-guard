import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MathCaptchaProps {
  onVerified: () => void;
  onError: (error: string) => void;
}

const MathCaptcha = ({ onVerified, onError }: MathCaptchaProps) => {
  const [question, setQuestion] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateCaptcha = async () => {
    setGenerating(true);
    try {
      console.log('Attempting to generate captcha...');
      const { data, error } = await supabase.functions.invoke('captcha', {
        method: 'GET',
      });

      console.log('Captcha response:', { data, error });

      if (error) {
        console.error('Error generating captcha:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.question && data?.sessionId) {
        setQuestion(data.question);
        setSessionId(data.sessionId);
        setUserAnswer('');
        console.log('Generated captcha successfully:', data.question);
      } else {
        throw new Error('Invalid response format from captcha service');
      }
    } catch (error: any) {
      console.error('Failed to generate captcha:', error);
      toast({
        title: "Error",
        description: "Failed to generate captcha. Please try again.",
        variant: "destructive",
      });
      onError('Failed to generate captcha. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const verifyCaptcha = async () => {
    if (!userAnswer.trim()) {
      onError('Please enter your answer');
      return;
    }

    if (!sessionId) {
      onError('No captcha session found. Please refresh.');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to verify captcha with sessionId:', sessionId, 'answer:', userAnswer.trim());
      
      const { data, error } = await supabase.functions.invoke('captcha', {
        body: {
          sessionId,
          userAnswer: userAnswer.trim()
        },
      });

      console.log('Verification response:', { data, error });

      if (error) {
        console.error('Error verifying captcha:', error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success === true) {
        toast({
          title: "Success",
          description: "Captcha verified successfully!",
        });
        onVerified();
      } else {
        onError('Incorrect answer. Please try again.');
        await generateCaptcha(); // Generate new captcha on wrong answer
      }
    } catch (error: any) {
      console.error('Failed to verify captcha:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify captcha. Please try again.",
        variant: "destructive",
      });
      onError('Failed to verify captcha. Please try again.');
      await generateCaptcha(); // Generate new captcha on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCaptcha();
  };

  const handleRefresh = () => {
    generateCaptcha();
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Security Verification</span>
        </CardTitle>
        <CardDescription>
          Please solve this math problem to verify you're human
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl font-bold text-primary">
                {generating ? 'Loading...' : question || 'Loading...'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={generating}
                className="p-1"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="captcha-answer" className="text-sm font-medium">
              Your Answer
            </label>
            <Input
              id="captcha-answer"
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter the result"
              required
              disabled={loading || generating || !question}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || generating || !question || !userAnswer.trim()}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MathCaptcha;