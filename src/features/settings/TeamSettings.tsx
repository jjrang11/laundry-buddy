"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff } from "@/features/settings/shop.actions";
import type { ShopActionState } from "@/features/settings/shop.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface TeamSettingsProps {
  shopName: string;
}

export function TeamSettings({ shopName }: TeamSettingsProps) {
  const defaultPassword =
    shopName.toLowerCase().replace(/\s+/g, "") + "123";
  const [email, setEmail] = useState("");
  const [, setResult] = useState<ShopActionState>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      const res = await inviteStaff(email.trim());
      setResult(res);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Staff account created.");
        setEmail("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="invite_email">Staff Email</Label>
        <Input
          id="invite_email"
          name="invite_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          placeholder="staff@example.com"
          className="max-w-[280px]"
          required
        />
        <p className="text-xs text-gray-400">
          Default password:{" "}
          <span className="font-mono font-medium text-gray-600">
            {defaultPassword || "shopname123"}
          </span>
          . Staff can change this after first login.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="sm"
        className="gap-1.5"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating…
          </>
        ) : (
          "Create Staff Account"
        )}
      </Button>
    </form>
  );
}
