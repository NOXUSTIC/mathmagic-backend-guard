import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import MathCaptcha from '@/components/MathCaptcha';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const navigate = useNavigate();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!email || !password || (!isLogin && !fullName)) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Show captcha for verification
    setShowCaptcha(true);
  };

  const handleCaptchaVerified = async () => {
    setCaptchaVerified(true);
    setShowCaptcha(false);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if email is admin email
        const isAdminEmail = email.toLowerCase().includes('@g.bracu.ac.bd');
        
        toast({
          title: "Success",
          description: "Signed in successfully",
        });
        
        // Navigate based on email domain
        if (isAdminEmail) {
          navigate('/admin-panel');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) throw error;

        // Check if email is admin email for new accounts
        const isAdminEmail = email.toLowerCase().includes('@g.bracu.ac.bd');
        
        toast({
          title: "Success",
          description: "Account created successfully",
        });
        
        // Navigate based on email domain for new accounts
        if (isAdminEmail) {
          navigate('/admin-panel');
        } else {
          navigate('/user-dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
      // Reset captcha on auth error
      setCaptchaVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaError = (error: string) => {
    toast({
      title: "Captcha Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleBackToCaptcha = () => {
    setShowCaptcha(false);
    setCaptchaVerified(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">ReliefLink</h1>
          </div>
          <p className="text-gray-600">Emergency Communication Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Sign In' : 'Create Account'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Fill in your details to create a new account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showCaptcha ? (
              <div className="space-y-4">
                <MathCaptcha 
                  onVerified={handleCaptchaVerified}
                  onError={handleCaptchaError}
                />
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToCaptcha}
                    className="text-sm"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        required={!isLogin}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : 'Continue to Verification'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setShowCaptcha(false);
                      setCaptchaVerified(false);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="text-sm"
                  >
                    Back to Home
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;