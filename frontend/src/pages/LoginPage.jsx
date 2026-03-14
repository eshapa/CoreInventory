import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Box, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    try {
      setIsSubmitting(true);
      await login(email, password);
      
      // Navigate to intended page or generic dashboard
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Login failed", err);
      setError(err.response?.data?.message || err.message || "Failed to login");
      
      if (
        err.response?.status === 403 && 
        err.response?.data?.message?.includes("verify your email")
      ) {
        navigate('/verify-email', { state: { email } });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding & Image */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#F0F4FF] flex-col p-12 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-24">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">CoreInventory</span>
          </div>

          
          <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Streamline your <br />
            <span className="text-primary">warehouse operations.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-md">
            The ultimate inventory management platform for growing businesses. 
            Real-time tracking, automated reordering, and deep insights.
          </p>
        </div>
        
        <div className="text-slate-400 text-sm flex gap-4">
          <span>© 2024 CoreInventory Inc.</span>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 mt-2">Log in to your account to continue managing your stock.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-slate-200"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-slate-700 font-semibold">Password</Label>
                <Link 
                  to="/forgot-password"
                  className="text-sm text-primary font-medium hover:underline focus:outline-none"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10 border-slate-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input type="checkbox" id="remember" className="rounded border-slate-300 text-primary focus:ring-primary" />
              <label htmlFor="remember" className="text-sm text-slate-500">Remember this device for 30 days</label>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-bold text-lg rounded-xl shadow-primary">
              {isSubmitting ? "Signing In..." : "Sign In →"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or sign in with SSO</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-12 border-slate-200 flex gap-2">
              <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
              Google
            </Button>
            <Button variant="outline" className="h-12 border-slate-200 flex gap-2">
              <img src="https://www.svgrepo.com/show/448240/microsoft.svg" className="w-5 h-5" alt="Microsoft" />
              Microsoft
            </Button>
          </div>

          <p className="text-center text-slate-500 mt-8">
            Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}