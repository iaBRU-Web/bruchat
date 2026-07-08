import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, MessageCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("admin-login", {
        body: { password },
      });
      if (fnErr || !data?.token) {
        setError("Wrong password");
      } else {
        sessionStorage.setItem("bruchat-admin-token", data.token);
        sessionStorage.setItem("bruchat-admin-exp", String(data.exp));
        navigate("/admin/panel", { replace: true });
      }
    } catch {
      setError("Could not reach server");
    }
    setLoading(false);
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <MessageCircle className="h-8 w-8 text-destructive animate-breathe" />
          <span className="text-3xl font-heading font-extrabold text-foreground">
            BRU<span className="text-destructive">Admin</span>
          </span>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 text-center">Admin Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 rounded-pill"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full rounded-pill bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {loading ? "Checking..." : <>Enter <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
