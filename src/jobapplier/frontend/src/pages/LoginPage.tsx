import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: loginUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // For demo purposes, simulate login
      // In production, this would call the actual API
      // const user = await login(email, password);
      
      // Mock login for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = {
        id: 'user-1',
        email,
        name: 'Lethabo',
        surname: 'Neo',
      };
      
      loginUser(mockUser);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-center">Sign Up</h2>
          <p className="text-muted-foreground text-center mt-2">
            Join thousands of job seekers using AI to land their dream jobs
          </p>
        </div>

        {/* Right Side - Login Form */}
        <Card className="bg-card border-border">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Welcome</h1>
              <p className="text-muted-foreground">
                Sign in to continue your job search journey
              </p>
            </div>

            <div className="text-center mb-6">
              <span className="text-sm text-muted-foreground">Sign Up</span>
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground uppercase">OR</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark h-14"
                  disabled={isLoading}
                />
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark h-14 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="btn-primary w-full h-14 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
