import { Link } from "react-router-dom";
import { MessageCircle, Heart } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";

const Footer = () => {
  return (
    <footer className="py-6 text-center border-t border-border space-y-3">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4 text-primary" />
        <span>Having any problem?</span>
        <Link
          to="/user/bruchat"
          className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
        >
          Message @bruchat <VerifiedBadge username="bruchat" />
        </Link>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Heart className="h-4 w-4 text-primary" />
        <Link to="/donate" className="text-primary hover:underline font-medium">
          Donate to BRUChat
        </Link>
      </div>
      <nav className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
          Privacy Policy
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
          Terms of Service
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
          About & Contact
        </Link>
      </nav>
      <p className="text-sm text-muted-foreground">
        Made by INEZA AIME BRUNO
      </p>
    </footer>
  );
};

export default Footer;
