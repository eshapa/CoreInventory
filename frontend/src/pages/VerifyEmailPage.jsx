import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Box, Mail, ShieldCheck, Loader2, ChevronLeft } from "lucide-react";
import api from "../api/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateContextUser } = useAuth();
  
  // Get email from location state, or fallback
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please login again.");
      navigate("/login");
    }
  }, [email, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const res = await api.post("/auth/verify-email", { email, otp });
      
      // Update global auth context
      if (res.data.data?.user) {
        // Technically, verify-email sets the cookie/returns accessToken 
        // We'll update context, but ideally AuthContext would parse the response or
        // we ask the user to just log in again since `login` handles local storage set up best.
        
        // Let's redirect to login for a fresh flow, or if they have the token, dashboard.
        // The backend verify-email returns accessToken. Let's just redirect to login 
        // with a success message so they go through standard login flow.
      }
      
      toast.success("Email verified successfully! You can now log in.");
      navigate("/login", { replace: true });
      
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending) return;
    try {
      setIsResending(true);
      await api.post("/auth/resend-otp", { email, type: "EMAIL_VERIFY" });
      toast.success("A new OTP has been sent to your email.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null; // Wait for effect to redirect

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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Verify Email</h2>
              <p className="text-muted-foreground mt-2">
                We sent a 6-digit code to <br />
                <span className="text-foreground font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2 text-center">
                <Label htmlFor="otp" className="sr-only">Verification Code</Label>
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
                onClick={handleResendOtp}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={isResending}
              >
                {isResending ? "Resending..." : "Resend code"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
