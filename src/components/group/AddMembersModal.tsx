import { useState, useEffect } from "react";
import { X, Search, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddMembersModalProps {
  groupId: string;
  groupName: string;
  currentUserId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onMembersAdded: () => void;
}

const AddMembersModal = ({ groupId, groupName, currentUserId, existingMemberIds, onClose, onMembersAdded }: AddMembersModalProps) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,display_name,avatar_url")
        .neq("id", currentUserId)
        .limit(50);
      setUsers((data || []).filter(u => !existingMemberIds.includes(u.id)));
    };
    fetchUsers();
  }, [currentUserId, existingMemberIds]);

  const filtered = search
    ? users.filter(u => u.display_name.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()))
    : users;

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    const inserts = Array.from(selected).map(uid => ({ group_id: groupId, user_id: uid, role: "member" }));
    const { error } = await supabase.from("group_members").insert(inserts);

    if (!error) {
      // Send notifications
      for (const uid of selected) {
        await supabase.from("notifications").insert({
          user_id: uid,
          type: "group_added",
          from_user_id: currentUserId,
          group_id: groupId,
        });
      }
      // System messages
      for (const uid of selected) {
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", uid).single();
        await supabase.from("group_messages").insert({
          group_id: groupId,
          sender_id: currentUserId,
          content: `${prof?.username || "Someone"} was added to the group 👋`,
          message_type: "system",
        });
      }
      toast({ title: `${selected.size} member${selected.size > 1 ? "s" : ""} added! 🎉` });
      onMembersAdded();
      onClose();
    } else {
      toast({ title: "Could not add members. Try again.", variant: "destructive" });
    }
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-heading font-bold text-foreground">Add Members to {groupName}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted rounded-pill text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1">
          {filtered.map(u => (
            <button
              key={u.id}
              onClick={() => toggle(u.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${
                selected.has(u.id) ? "bg-primary/10" : "hover:bg-muted"
              }`}
            >
              {u.avatar_url ? (
                <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {u.display_name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.display_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
              {selected.has(u.id) && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-full py-2.5 rounded-pill bg-primary text-primary-foreground font-semibold text-sm"
            >
              {adding ? <><Loader2 className="h-4 w-4 animate-spin inline mr-1" /> Adding...</> : `Add ${selected.size} member${selected.size > 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMembersModal;
