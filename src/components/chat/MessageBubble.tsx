import { memo, useState } from "react";
import { Check, CheckCheck, Reply, Copy, Pencil, Trash2, Lock } from "lucide-react";
import DOMPurify from "dompurify";
import LinkPreview, { renderLinkedText, getLinksFromText } from "./LinkPreview";


interface Message {
  id: string;
  content: string;
  sender_id: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_read: boolean;
  message_type: string;
  image_url: string;
  audio_url: string;
  video_url?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  otherAvatar: string;
  otherName: string;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  senderName?: string;
  senderAvatar?: string;
}

const isEmojiOnly = (text: string) => {
  if (!text) return false;
  const stripped = text.replace(/[\s\uFE0F]/g, "");
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+$/u;
  return emojiRegex.test(stripped);
};

const emojiCount = (text: string) => {
  const stripped = text.replace(/[\s\uFE0F]/g, "");
  const emojis = [...stripped].filter(c => /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(c));
  return emojis.length;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getSmartTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString("en", { month: "short", day: "numeric" })} ${time}`;
};

const MessageBubble = memo(({ message, isOwn, showAvatar, otherAvatar, otherName, onReply, onEdit, onDelete, onCopy, senderName, senderAvatar }: MessageBubbleProps) => {
  const time = getSmartTime(message.created_at);
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const canEdit = isOwn && !message.is_deleted && (Date.now() - new Date(message.created_at).getTime() < 5 * 60 * 1000);

  const avatarUrl = senderAvatar || otherAvatar;
  const displayName = senderName || otherName;

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-1`}>
        {!isOwn && showAvatar ? (
          <div className="mr-2 flex-shrink-0 self-end">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ) : !isOwn ? <div className="w-8 mr-2 flex-shrink-0" /> : null}
        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn ? "bg-bruchat-bubble-own" : "bg-bruchat-bubble-other"}`}>
          <p className="text-xs italic text-muted-foreground">This message was deleted.</p>
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
      </div>
    );
  }

  const content = message.content || "";
  const emojiOnly = isEmojiOnly(content) && message.message_type === "text" && !message.image_url && !message.video_url && !message.file_url;
  const emojiN = emojiOnly ? emojiCount(content) : 0;
  const emojiSize = emojiN <= 3 ? "text-5xl" : emojiN <= 8 ? "text-3xl" : "text-base";
  const isLong = content.length > 300 && !emojiOnly;
  const displayContent = isLong && !expanded ? content.slice(0, 300) + "..." : content;
  const links = getLinksFromText(content);

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group animate-slide-up-fade px-1`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && showAvatar ? (
        <div className="mr-2 flex-shrink-0 self-end">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ) : !isOwn ? (
        <div className="w-8 mr-2 flex-shrink-0" />
      ) : null}

      <div className="relative max-w-[75%]">
        {/* Sender name for group messages */}
        {!isOwn && showAvatar && senderName && (
          <p className="text-[11px] font-semibold text-primary ml-1 mb-0.5">{senderName}</p>
        )}

        {showActions && (
          <div className={`absolute ${isOwn ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"} top-0 flex items-center gap-0.5 bg-card border border-border rounded-xl shadow-lg px-1.5 py-1 z-10`}>
            <button onClick={onReply} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Reply">
              <Reply className="h-3.5 w-3.5" />
            </button>
            {onCopy && (
              <button onClick={onCopy} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
            {canEdit && onEdit && (
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {isOwn && onDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className={`px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-bruchat-bubble-own rounded-br-md"
            : "bg-bruchat-bubble-other rounded-bl-md"
        }`}>
          {/* Image */}
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared"
              className="rounded-xl max-h-[260px] w-auto mb-2 cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          )}

          {/* Video */}
          {message.video_url && (
            <video
              src={message.video_url}
              controls
              className="rounded-xl max-h-[260px] w-auto mb-2"
              preload="metadata"
            />
          )}

          {/* Audio file */}
          {message.audio_url && message.message_type === "audio" && (
            <div className="mb-2 bg-muted/50 rounded-xl p-2.5">
              <p className="text-[10px] text-muted-foreground mb-1">{message.file_name || "Audio file"}</p>
              <audio src={message.audio_url} controls className="w-full h-8" />
            </div>
          )}

          {/* Voice message */}
          {message.audio_url && message.message_type === "voice" && (
            <audio src={message.audio_url} controls className="w-full h-8 mb-1" />
          )}

          {/* File card */}
          {message.file_url && (
            <a
              href={message.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl mb-2 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-lg flex-shrink-0">
                📄
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{message.file_name || "File"}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(message.file_size)}</p>
              </div>
            </a>
          )}

          {/* Text content */}
          {content && (
            emojiOnly ? (
              <p className={`${emojiSize} leading-tight`}>{content}</p>
            ) : content === '🔒 Encrypted message' ? (
              <p className="text-sm italic text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                Encrypted message
              </p>
            ) : (
              <>
                <p
                  className="text-sm text-foreground break-words leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderLinkedText(displayContent), { ALLOWED_TAGS: ["strong", "em", "code", "a"], ALLOWED_ATTR: ["href", "target", "rel", "class"] }) }}
                />

                {isLong && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-primary hover:underline mt-0.5"
                  >
                    {expanded ? "Read less" : "Read more"}
                  </button>
                )}
              </>
            )
          )}

          {/* Link previews */}
          {links.map((link, i) => (
            <LinkPreview key={i} url={link} />
          ))}

          <div className="flex items-center justify-end gap-1.5 mt-1">
            {message.is_edited && (
              <span className="text-[9px] text-muted-foreground italic">edited</span>
            )}
            <span className="text-[10px] text-muted-foreground">{time}</span>
            {isOwn && (
              message.is_read ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
