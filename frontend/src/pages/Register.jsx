import * as React from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Box, User, Mail, Phone, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    details: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic for registration request
    console.log("Registration request submitted:", formData);
    alert("Request sent! Admin will contact you soon.");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Left Section - Context */}
        <div className="md:w-1/3 bg-primary p-8 text-white flex flex-col justify-between">
          <div>
            <Box className="w-10 h-10 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Join CoreInventory</h2>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Experience the next generation of warehouse management. Submit your details to request access.
            </p>
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xs font-bold">1</span>
              </div>
              <span className="text-xs">Fill the form</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xs font-bold">2</span>
              </div>
              <span className="text-xs">Verify with Admin</span>
            </div>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="flex-1 p-8 md:p-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Access</h3>
          <p className="text-slate-500 mb-8 text-sm">Please provide your business details for verification.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="John Doe" 
                    className="pl-10 h-11 border-slate-200" 
                    required 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="+91 0000000000" 
                    className="pl-10 h-11 border-slate-200" 
                    required 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  type="email" 
                  placeholder="john@company.com" 
                  className="pl-10 h-11 border-slate-200" 
                  required 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Your Role</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full pl-10 h-11 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  required
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="">Select Role</option>
                  <option value="manager">Warehouse Manager</option>
                  <option value="admin">Operations Head</option>
                  <option value="staff">Inventory Staff</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">Company Details / Requirements</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Textarea 
                  placeholder="Tell us about your inventory needs..." 
                  className="pl-10 border-slate-200 min-h-[100px]"
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary-600 text-white font-bold rounded-xl shadow-primary mt-4">
              Submit Request
            </Button>

            <p className="text-center text-slate-500 text-sm mt-4">
              Already registered? <Link to="/" className="text-primary font-bold hover:underline">Log in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}