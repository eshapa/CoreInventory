import * as React from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Logic for saving profile changes would go here
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    // Logic for updating password would go here
  };

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile Info Section */}
      <div className="glass-card rounded-xl p-6 space-y-5 border border-border/50">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg shadow-primary/20">
            JS
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">John Smith</h2>
            <p className="text-sm text-muted-foreground">Inventory Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Update Profile</span>
        </div>

        <form onSubmit={handleSaveChanges} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" defaultValue="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="john@coreinventory.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue="+1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                defaultValue="Inventory Manager" 
                disabled 
                className="bg-secondary/50 cursor-not-allowed" 
              />
            </div>
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="glass-card rounded-xl p-6 space-y-5 border border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Change Password</span>
        </div>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" />
          </div>
          <Button type="submit" variant="outline">Update Password</Button>
        </form>
      </div>

      {/* Logout Section */}
      <div className="glass-card rounded-xl p-6 border border-border/50">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Once you log out, you will need to sign in again to access the inventory system.
          </p>
          <Button 
            variant="destructive" 
            className="gap-2 w-fit" 
            onClick={() => navigate("/")}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}