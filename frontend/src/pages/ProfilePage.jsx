import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input defaultValue="John Smith" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue="john@coreinventory.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input defaultValue="+1 (555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input defaultValue="Inventory Manager" disabled className="bg-secondary/50" />
          </div>
        </div>
        <Button>Save Changes</Button>
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-medium">Change Password</span>
        </div>
        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button variant="outline">Update Password</Button>
        </div>
      </div>

      {/* Logout */}
      <div className="glass-card rounded-xl p-6">
        <Button variant="destructive" className="gap-2" onClick={() => navigate("/")}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
