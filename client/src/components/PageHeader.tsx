import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="container py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{title}</h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
