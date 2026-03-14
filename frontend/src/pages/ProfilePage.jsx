import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/axios";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateContextUser } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (isUpdatingProfile) return;

    try {
      setIsUpdatingProfile(true);
      const res = await api.put("/auth/me", { name, phone });
      // Backend returns: { success, message, data: { user: {...} } }
      updateContextUser(res.data.data?.user || res.data.data);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (isUpdatingPassword) return;

    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }

    try {
      setIsUpdatingPassword(true);
      await api.put("/auth/me/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold uppercase">
            {user?.name?.substring(0, 2) || "UI"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Update Profile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                value={user?.email || ""} 
                type="email" 
                disabled 
                className="bg-secondary/50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone"
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role"
                value={user?.role?.replace('_', ' ') || ""} 
                disabled 
                className="bg-secondary/50 cursor-not-allowed capitalize" 
              />
            </div>
          </div>
          <Button type="submit" disabled={isUpdatingProfile}>
            {isUpdatingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : "Save Changes"}
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Change Password</span>
          </div>
          <div className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input 
                id="current-password"
                type="password" 
                placeholder="••••••••" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password" 
                placeholder="••••••••" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                required
              />
            </div>
            <Button type="submit" variant="outline" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      {/* Logout */}
      <div className="glass-card rounded-xl p-6">
        <Button variant="destructive" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
