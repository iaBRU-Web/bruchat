import { BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Batched, cached verified-user lookup. One query per micro-batch instead
// of one per badge, and no hardcoded "always verified" list — the DB is
// the single source of truth.
type Badge = "true" | "fake" | null;

const cache = new Map<string, Badge>(); // key: userId
const usernameToId = new Map<string, string | null>();
const subscribers = new Map<string, Set<(b: Badge) => void>>();

let pendingIds = new Set<string>();
let pendingUsernames = new Set<string>();
let scheduled = false;

const notify = (id: string) => {
  const subs = subscribers.get(id);
  if (subs) subs.forEach(fn => fn(cache.get(id) ?? null));
};

const flush = async () => {
  scheduled = false;
  const ids = Array.from(pendingIds);
  const unames = Array.from(pendingUsernames);
  pendingIds = new Set();
  pendingUsernames = new Set();

  // Resolve usernames -> ids first
  if (unames.length) {
    const { data } = await supabase.from("profiles").select("id,username").in("username", unames);
    unames.forEach(u => usernameToId.set(u.toLowerCase(), null));
    (data || []).forEach((p: any) => {
      usernameToId.set(p.username.toLowerCase(), p.id);
      ids.push(p.id);
    });
  }

  if (!ids.length) return;
  const uniq = Array.from(new Set(ids));
  const { data } = await supabase.from("verified_users").select("user_id,badge_type").in("user_id", uniq);
  const found = new Map<string, Badge>();
  (data || []).forEach((r: any) => found.set(r.user_id, (r.badge_type as Badge) || "true"));
  uniq.forEach(id => {
    cache.set(id, found.get(id) ?? null);
    notify(id);
  });
};

const schedule = () => {
  if (scheduled) return;
  scheduled = true;
  setTimeout(flush, 30);
};

const request = (userId: string | undefined, username: string | undefined, cb: (b: Badge) => void) => {
  let id = userId;
  if (!id && username) {
    const known = usernameToId.get(username.toLowerCase());
    if (known === null) return cb(null);
    if (typeof known === "string") id = known;
  }
  if (id) {
    if (cache.has(id)) return cb(cache.get(id) ?? null);
    if (!subscribers.has(id)) subscribers.set(id, new Set());
    subscribers.get(id)!.add(cb);
    pendingIds.add(id);
    schedule();
    return;
  }
  if (username) {
    // Need username lookup — reuse subscriber map keyed by lowercase username
    const key = `u:${username.toLowerCase()}`;
    if (!subscribers.has(key)) subscribers.set(key, new Set());
    subscribers.get(key)!.add(cb);
    pendingUsernames.add(username);
    // After flush, we'll have the id → subscribe to that id too
    const wrapper = (b: Badge) => {
      cb(b);
    };
    // Re-check after flush completes
    setTimeout(() => {
      const resolved = usernameToId.get(username.toLowerCase());
      if (resolved && cache.has(resolved)) cb(cache.get(resolved) ?? null);
      else if (resolved === null) cb(null);
    }, 80);
    schedule();
  }
};

interface VerifiedBadgeProps {
  username?: string;
  userId?: string;
  className?: string;
}

const VerifiedBadge = ({ username, userId, className = "" }: VerifiedBadgeProps) => {
  const [badgeType, setBadgeType] = useState<Badge>(() => {
    if (userId && cache.has(userId)) return cache.get(userId) ?? null;
    return null;
  });

  useEffect(() => {
    let alive = true;
    request(userId, username, b => { if (alive) setBadgeType(b); });
    return () => { alive = false; };
  }, [username, userId]);

  if (!badgeType) return null;

  if (badgeType === "true") {
    return (
      <BadgeCheck
        className={`inline h-4 w-4 text-blue-500 flex-shrink-0 ${className}`}
        aria-label="Verified"
        style={{ userSelect: "none", pointerEvents: "none" }}
      />
    );
  }

  return (
    <span className={`inline-flex items-center text-blue-500 text-sm ${className}`} aria-label="Verified" title="Verified">
      ☑️
    </span>
  );
};

export default VerifiedBadge;
