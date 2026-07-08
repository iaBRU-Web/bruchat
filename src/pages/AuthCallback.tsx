import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Try exchanging code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.search
        );
        if (exchangeError) throw exchangeError;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user");

        // Check if profile exists, if not wait briefly for trigger
        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existing) {
          // Wait for the trigger to create the profile
          await new Promise(r => setTimeout(r, 1500));
        }

        navigate("/app", { replace: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        console.error("OAuth callback error:", msg);
        setError(msg);
        setTimeout(() => navigate("/login?error=oauth", { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-destructive/50 rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">😅</div>
          <p className="text-muted-foreground">Something went wrong with sign in. Try again or use email.</p>
          <p className="text-xs text-muted-foreground mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-breathe text-primary text-xl font-heading">Signing you in...</div>
    </div>
  );
};

export default AuthCallback;
