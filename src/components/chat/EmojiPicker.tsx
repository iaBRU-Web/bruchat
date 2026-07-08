import { useState, memo } from "react";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: ["😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","🥰","😘","😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥","😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","🤪","😝","🤑","🤭","🧐","🤓","😈","👿","👹","👺","💀","👻","👽","🤖","💩","😺","😸","😹","😻","😼","😽","🙀","😿","😾"]
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁","👅","👄"]
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🫶","😍","🥰","😘","💏","💑"]
  },
  {
    name: "Animals",
    icon: "🐶",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑"]
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🌽","🥕","🫒","🧄","🧅","🥔","🍠","🫘","🥐","🥖","🍞","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🫓","🥪","🌮","🌯","🫔","🥙"]
  },
  {
    name: "Objects",
    icon: "⚽",
    emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋","🤸","🤺","⛹","🤾","🏌","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚵","🚴"]
  },
  {
    name: "Stickers",
    icon: "🎉",
    emojis: ["🎉","🎊","🎈","🎁","🎀","🎗","🎟","🎫","🎖","🏆","🏅","🥇","🥈","🥉","⚽","🏀","🎯","🎮","🕹","🎲","🧩","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻","🎪","🤹","💐","🌸","💮","🏵","🌹","🥀","🌺","🌻","🌼","🌷","🪷","🌱","🪴","🌲","🌳","🌴","🌵","🌾","🌿","☘","🍀","🍁","🍂","🍃","🪹","🪺","🍄"]
  }
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker = memo(({ onSelect, onClose }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");

  const currentEmojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(() => true) // show all when searching
    : EMOJI_CATEGORIES[activeCategory].emojis;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-[320px] max-h-[360px] bg-card border border-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-slide-up-fade">
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 pt-2 pb-1 border-b border-border overflow-x-auto scrollbar-thin">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`p-1.5 rounded-lg text-base transition-colors flex-shrink-0 ${
              activeCategory === i ? "bg-primary/10" : "hover:bg-muted"
            }`}
            title={cat.name}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {/* Category label */}
      <div className="px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {EMOJI_CATEGORIES[activeCategory].name}
        </span>
      </div>

      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        <div className="grid grid-cols-8 gap-0.5">
          {currentEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-xl leading-none text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

EmojiPicker.displayName = "EmojiPicker";

export default EmojiPicker;
