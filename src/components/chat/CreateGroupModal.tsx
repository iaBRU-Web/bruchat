import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search, Camera, Users, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
}

const CreateGroupModal = ({ onClose }: { onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url,is_online")
        .neq("id", user?.id)
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .limit(10);
      setResults((data || []).filter((u) => !selected.find((s) => s.id === u.id)));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user, selected]);

  const toggleUser = (u: UserResult) => {
    setError("");
    if (selected.find((s) => s.id === u.id)) {
      setSelected(selected.filter((s) => s.id !== u.id));
    } else {
      if (selected.length >= 499) {
        setError("This group is full. Max 500 members reached.");
        return;
      }
      setSelected([...selected, u]);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    setError("");

    // Validate
    const trimmedName = name.replace(/<[^>]*>/g, "").trim();
    if (!trimmedName) {
      setError("Group needs a name 😅");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Group name must be between 2 and 50 characters.");
      return;
    }

    setCreating(true);
    let membersFailed = false;

    try {
      const cleanDesc = description.replace(/<[^>]*>/g, "").trim();
      const inviteCode = Math.random().toString(36).substring(2, 10) +
                         Math.random().toString(36).substring(2, 10);

      // Insert group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: trimmedName,
          description: cleanDesc || null,
          created_by: user.id,
          is_public: isPublic,
          max_members: 500,
          invite_link: inviteCode,
        })
        .select()
        .single();

      if (groupError || !group) {
        console.error("Group creation error:", groupError);
        throw new Error(groupError?.message || "Failed to create group.");
      }

      // Add creator as admin
      const { error: creatorError } = await supabase
        .from("group_members")
        .insert({ group_id: group.id, user_id: user.id, role: "admin" });

      if (creatorError) {
        console.error("Creator member error:", creatorError);
        throw new Error(creatorError.message || "Failed to add you to the group.");
      }

      // Add selected members
      if (selected.length > 0) {
        const memberInserts = selected.map((s) => ({
          group_id: group.id,
          user_id: s.id,
          role: "member",
        }));

        const { error: membersError } = await supabase
          .from("group_members")
          .insert(memberInserts);

        if (membersError) {
          console.error("Members insert error:", membersError);
          membersFailed = true;
        }
      }

      onClose();
      navigate(`/app/group/${group.id}`);

      toast({
        title: membersFailed
          ? `Group created! Some members could not be added. You can add them from the group info panel. 🎉`
          : `Group created! Welcome to ${trimmedName} 🎉`,
      });
    } catch (err: any) {
      setError(err.message || "Could not create group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-heading font-bold text-lg text-foreground">Create Group</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto scrollbar-thin flex-1">
          {/* Group avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
              <Camera className="h-6 w-6 text-primary/50" />
            </div>
            <div className="flex-1">
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Group name"
                className="rounded-pill font-medium text-base"
                maxLength={50}
              />
            </div>
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-xl bg-muted border-0 px-4 py-3 text-sm text-foreground resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            maxLength={200}
          />

          {/* Public toggle */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-medium text-foreground">🌐 Public Group</p>
              <p className="text-[11px] text-muted-foreground">Anyone can find and join this group</p>
            </div>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-10 h-6 rounded-full transition-colors relative ${isPublic ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPublic ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>

          {/* Inline error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2.5 font-medium">
              {error}
            </div>
          )}

          {/* Selected members */}
          {selected.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">{selected.length} member{selected.length > 1 ? "s" : ""} selected</p>
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-pill px-3 py-1.5 text-xs font-medium">
                    {s.display_name}
                    <button onClick={() => toggleUser(s)} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search members */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Add members..."
              className="pl-10 rounded-pill"
            />
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
            {results.map((r) => {
              const isSelected = selected.find((s) => s.id === r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleUser(r)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                        {r.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {r.is_online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card bg-bruchat-online" />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-foreground">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{r.username}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? "bg-primary border-primary" : "border-border"
                  }`}>
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <Button
            variant="hero"
            className="w-full rounded-pill"
            disabled={!name.trim() || creating}
            onClick={handleCreate}
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating... ⏳</>
            ) : (
              <><Users className="h-4 w-4 mr-2" /> Create Group {selected.length > 0 ? `(${selected.length + 1} members)` : "(just you)"}</>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">Adding members is optional — you can invite people later</p>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
