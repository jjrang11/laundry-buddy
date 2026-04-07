import { signOut } from "@/features/auth/auth.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WashingMachine, LogOut } from "lucide-react";

interface OwnerHeaderProps {
  email: string;
}

export function OwnerHeader({ email }: OwnerHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white">
          <WashingMachine className="h-4 w-4" />
        </div>
        <span className="font-semibold text-gray-900 text-sm">Laundry Buddy</span>
        <Badge variant="secondary" className="text-xs">Owner Portal</Badge>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[180px]">
          {email}
        </span>
        <form action={signOut} aria-label="Sign out">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="gap-1.5 h-8"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
