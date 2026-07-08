import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { keys: "Enter", desc: "Send message" },
  { keys: "Shift + Enter", desc: "New line" },
  { keys: "Escape", desc: "Close modal / cancel reply" },
  { keys: "Ctrl + K", desc: "Global search" },
  { keys: "↑", desc: "Edit last message" },
  { keys: "?", desc: "Show keyboard shortcuts" },
];

const KeyboardShortcuts = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Keyboard Shortcuts</h3>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-foreground">{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
