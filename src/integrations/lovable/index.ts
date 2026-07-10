// Lovable integration replaced with Supabase direct auth
import { supabase } from "../supabase/client";

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: { redirect_uri?: string }) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider === "apple" ? "apple" : "google",
        options: {
          redirectTo: opts?.redirect_uri || window.location.origin + "/auth/callback",
        },
      });
      return { error };
    },
  },
};
