import { useLocation, Link } from "react-router-dom";
import { MessageCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import AdSense from "@/components/AdSense";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <MessageCircle className="h-16 w-16 text-primary/30 mb-6 animate-breathe" />
      <h1 className="font-heading text-6xl font-extrabold text-foreground mb-3">404</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">
        This page went on vacation and forgot to tell anyone 🏖️
      </p>
      <Button variant="hero" size="lg" asChild>
        <Link to="/"><Home className="h-4 w-4 mr-2" /> Head back home</Link>
      </Button>
      <div className="w-full max-w-2xl mt-8"><AdSense /></div>
      <div className="mt-auto pt-12"><Footer /></div>
    </div>
  );
};

export default NotFound;
