import * as React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, Mail, Lock, ChevronLeft, KeyRound, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  // Steps: 'request' | 'verify' | 'reset' | 'success'
  const [step, setStep] = useState('request');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  // Handler: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await api.post("/auth/forgot-password", { email });
      toast.success("If the account exists, a core has been sent to your email.");
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request reset. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await api.post("/auth/verify-reset-otp", { email, otp });
      // res.data.data = { resetToken }
      setResetToken(res.data.data?.resetToken);
      toast.success("OTP verified. Please set your new password.");
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      setIsLoading(true);
      await api.post("/auth/reset-password", { 
        resetToken, 
        newPassword 
      });
      toast.success("Password reset successful!");
      setStep('success');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'request':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
              <p className="text-muted-foreground mt-2">No worries, we'll send you reset instructions.</p>
            </div>

            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Send Reset Code
              </Button>
            </form>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Verify OTP</h2>
              <p className="text-muted-foreground mt-2">We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span></p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-center">
                <Label htmlFor="otp" className="sr-only">Reset Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-14 text-center text-2xl tracking-[0.5em] font-bold"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify Code
              </Button>
              <button 
                type="button" 
                onClick={() => setStep('request')}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isLoading}
              >
                Resend code
              </button>
            </form>
          </div>
        );

      case 'reset':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
              <p className="text-muted-foreground mt-2">Almost there! Choose a strong password.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </form>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Password reset</h2>
              <p className="text-muted-foreground mt-2">Your password has been successfully reset. You can now log in with your new password.</p>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full h-11">
              Back to Sign In
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Back to Home/Login */}
      <Link 
        to="/login" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Sign In
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">CoreInventory</span>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-border/50">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
