"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createShopWithOwner } from "@/features/owner/owner.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function CreateShopSection() {
  const [shopName, setShopName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shopName.trim() || !ownerEmail.trim()) return;

    startTransition(async () => {
      const res = await createShopWithOwner(shopName.trim(), ownerEmail.trim());
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Shop created successfully.");
        setShopName("");
        setOwnerEmail("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="shop_name">Shop Name</Label>
        <Input
          id="shop_name"
          name="shop_name"
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          disabled={isPending}
          placeholder="e.g. Sunshine Laundry"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="owner_email">Owner Email</Label>
        <Input
          id="owner_email"
          name="owner_email"
          type="email"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
          disabled={isPending}
          placeholder="owner@example.com"
          required
        />
        <p className="text-xs text-gray-400">
          Default password: <span className="font-mono font-medium text-gray-600">laundrybuddy123</span> — the admin can change this after first login.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="gap-1.5 w-full sm:w-auto"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          "Create Shop & Owner Account"
        )}
      </Button>
    </form>
  );
}
