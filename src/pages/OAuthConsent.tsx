import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import Footer from "@/components/Footer";

type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorizationId)
      : await oauth().denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Helmet>
        <title>Connect an app · BRUChat</title>
        <meta name="description" content="Authorize an external app to access your BRUChat account." />
      </Helmet>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl font-bold">Connect an app to BRUChat</h1>
          </div>
          {error && (
            <p className="text-sm text-destructive mb-4">Could not load this authorization request: {error}</p>
          )}
          {!error && !details && <p className="text-sm text-muted-foreground">Loading…</p>}
          {details && (
            <>
              <p className="text-sm text-foreground mb-2">
                <span className="font-semibold">{details.client?.name ?? "An app"}</span> is requesting access to your
                BRUChat account.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Approving will let this app read and act in BRUChat as you. You can revoke access at any time.
              </p>
              <div className="flex gap-3">
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1 rounded-full">
                  Approve
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => decide(false)}
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  Deny
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
