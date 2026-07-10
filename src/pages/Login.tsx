import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, MessageCircle, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "@/hooks/use-toast";
import BrunoProjects from "@/components/BrunoProjects";
import Footer from "@/components/Footer";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";
  const redirectBackUrl = `${window.location.origin}${nextPath}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectBackUrl,
      }
    });
    
    if (error) {
      setError("Something went wrong with sign in. Try again or use email 😅");
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockedUntil(Date.now() + 120000);
        setError("Too many attempts. Take a breath and try again in 2 minutes 😮‍💨");
      } else {
        setError("Hmm that doesn't look right. Double-check and try again!");
      }
      return;
    }

    if (data?.user) {
      // Check if banned
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned")
        .eq("id", data.user.id)
        .single();

      if (profile?.is_banned) {
        await supabase.auth.signOut();
        setError("Your account has been suspended. Contact Bruno if you think this is a mistake.");
        return;
      }

      navigate(nextPath, { replace: true });
    }
  };

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      setForgotError("Hmm we couldn't find that email. Double-check and try again!");
    } else {
      setForgotSuccess("Check your inbox! A reset link is on its way 📬");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Log in to BRUChat</title>
        <meta name="description" content="Sign in to BRUChat to access your private chats, groups, and social posts." />
        <link rel="canonical" href="https://bruchat.vercel.app/login" />
        <meta property="og:url" content="https://bruchat.vercel.app/login" />
        <meta property="og:title" content="Log in to BRUChat" />
      </Helmet>
      <main id="main" className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MessageCircle className="h-8 w-8 text-primary animate-breathe" aria-hidden="true" />
            <span className="text-3xl font-heading font-extrabold text-foreground">
              BRU<span className="text-primary">Chat</span>
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1 text-center">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6 text-center">Log in to continue chatting</p>

            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 rounded-pill"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="email"
                  id="login-email"
                  aria-label="Email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-pill"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type={showPassword ? "text" : "password"}
                  id="login-password"
                  aria-label="Password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-pill"
                  required
                  maxLength={100}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  Remember me
                </label>
                <button type="button" onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotSuccess(""); setForgotError(""); }} className="text-sm text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center animate-slide-up-fade">{error}</p>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading || !!isLocked}
              >
                {loading ? "Logging in..." : "Log In"}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>


      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-heading text-lg font-bold text-foreground mb-1">Forgot Password</h3>
            <p className="text-sm text-muted-foreground mb-4">Enter your email and we'll send you a reset link</p>

            <Input
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
              placeholder="Your email address"
              className="rounded-pill mb-3"
            />

            {forgotError && (
              <p className="text-sm text-destructive mb-3">{forgotError}</p>
            )}
            {forgotSuccess && (
              <p className="text-sm text-bruchat-online mb-3">{forgotSuccess}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-pill" onClick={() => setShowForgotModal(false)}>
                Cancel
              </Button>
              <Button variant="hero" className="flex-1 rounded-pill" onClick={handleForgotPassword} disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BrunoProjects />
      <Footer />
    </div>
  );
};

export default Login;
