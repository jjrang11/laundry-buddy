"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteShopAdmin } from "@/features/owner/owner.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface InviteAdminFormProps {
  shopId: string;
  shopName: string;
  onClose: () => void;
}

export function InviteAdminForm({ shopId, shopName, onClose }: InviteAdminFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const res = await inviteShopAdmin(shopId, email.trim());
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success(`Admin account created for ${email.trim()}.`);
        setEmail("");
        onClose();
      }
    });
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 mt-2">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            placeholder="admin@example.com"
            required
            aria-label={`Admin email for ${shopName}`}
            className="max-w-[260px]"
          />
        </div>

        <p className="text-xs text-gray-400">
          Default password: <span className="font-mono font-medium text-gray-600">laundrybuddy123</span> — the admin can change this after first login.
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Admin Account"
            )}
          </Button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 shrink-0"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
