import { useState } from "react";
import { Menu, X, Home, PieChart, Wallet, Shield, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface MobileNavProps {
  currentPath: string;
}

export default function MobileNav({ currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Challenges", icon: Home },
    { href: "/budget", label: "Budget", icon: PieChart },
    { href: "/money-usage", label: "Money Usage", icon: Wallet },
    { href: "/gambling-habits", label: "Gambling Habits", icon: Shield },
    { href: "/analytics", label: "Analytics", icon: TrendingUp },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Drawer Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b border-border md:hidden z-50">
          <nav className="container py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
