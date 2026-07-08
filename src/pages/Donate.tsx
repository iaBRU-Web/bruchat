import { Heart, Phone, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/chat/AppSidebar";
import AdSense from "@/components/AdSense";

const numbers = ["0722610568", "0722610569", "0788610568", "0788610569"];

const Donate = () => {
  const copy = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: `Copied ${num} 📋` });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Support BRUChat</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Your donations help us keep BRUChat running and improving. Send money via MoMo to any of the numbers below 💜
            </p>
          </div>

          <div className="space-y-3">
            {numbers.map((num) => (
              <div key={num} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="text-foreground font-mono font-medium">{num}</span>
                </div>
                <Button size="sm" variant="outline" className="rounded-pill" onClick={() => copy(num)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Thank you for your generosity! Every contribution counts 🙏
          </p>
          <AdSense />
        </div>
        <Footer />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AppSidebar mobile />
      </div>
    </div>
  );
};

export default Donate;
