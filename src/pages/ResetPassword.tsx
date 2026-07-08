import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, MessageCircle, Lock, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setError("This reset link has expired. Please request a new one.");
      } else {
        setReady(true);
      }
    };
    checkSession();
  }, []);

  const getStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = getStrength(newPw);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][strength] || "";
  const strengthColor = ["", "bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-bruchat-online", "bg-bruchat-online"][strength] || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });

    if (updateError) {
      setError("Could not update password. The link may have expired. Request a new one.");
      setLoading(false);
      return;
    }



    setSuccess("Password updated! You're all good 🔐");
    toast({ title: "Password updated! 🔐" });
    setTimeout(() => navigate("/login"), 2000);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MessageCircle className="h-8 w-8 text-primary animate-breathe" />
          <span className="text-3xl font-heading font-extrabold text-foreground">
            BRU<span className="text-primary">Chat</span>
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-1 text-center">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">Choose a new password for your account</p>

          {error && !ready && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 text-center mb-4">
              {error}
              <Button variant="outline" className="mt-3 w-full rounded-pill" onClick={() => navigate("/login")}>
                Back to Login
              </Button>
            </div>
          )}

          {success && (
            <div className="text-sm text-bruchat-online bg-bruchat-online/10 rounded-xl px-4 py-3 text-center">
              {success}
            </div>
          )}

          {ready && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                    className="pl-10 pr-10 rounded-pill"
                    placeholder="New password"
                    required
                    maxLength={100}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{strengthLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                    className="pl-10 pr-10 rounded-pill"
                    placeholder="Confirm new password"
                    required
                    maxLength={100}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPw && confirmPw && (
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {newPw === confirmPw ? (
                      <><Check className="h-3 w-3 text-bruchat-online" /> <span className="text-bruchat-online">Passwords match</span></>
                    ) : (
                      <><X className="h-3 w-3 text-destructive" /> <span className="text-destructive">Passwords don't match</span></>
                    )}
                  </div>
                )}
              </div>

              {error && ready && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full rounded-pill" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
