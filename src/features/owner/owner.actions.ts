"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isOwner } from "@/lib/auth-utils";
import type { Shop } from "@/lib/types";

export type OwnerActionState = { error: string } | { success: true } | null;

// ── Get all shops ─────────────────────────────────────────────────────────────
// Owner-only. Uses the service role client to bypass RLS and fetch every shop.

export async function getAllShops(): Promise<Shop[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isOwner(user)) return [];

  const adminClient = createServiceRoleClient();

  const { data, error } = await adminClient
    .from("shops")
    .select("id, name, created_at, is_suspended, settings(shop_name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getAllShops]", error);
    return [];
  }

  return (data ?? []).map((shop) => {
    const settingsRow = Array.isArray(shop.settings) ? shop.settings[0] : shop.settings;
    return {
      id: shop.id,
      name: shop.name,
      display_name: (settingsRow as { shop_name?: string | null } | null)?.shop_name || shop.name,
      created_at: shop.created_at,
      is_suspended: shop.is_suspended,
    };
  });
}

// ── Create shop with owner ────────────────────────────────────────────────────
// Owner-only. Creates a shop record, seeds its settings row, then invites the
// specified email as the shop's first admin.

export async function createShopWithOwner(
  shopName: string,
  ownerEmail: string
): Promise<OwnerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isOwner(user)) return { error: "Unauthorized." };

  const trimmedShopName = shopName?.trim();
  if (!trimmedShopName) return { error: "Shop name is required." };

  const trimmedEmail = ownerEmail?.trim();
  if (!trimmedEmail) return { error: "Owner email is required." };

  const adminClient = createServiceRoleClient();

  // 1. Insert the shop record.
  const { data: shop, error: shopError } = await adminClient
    .from("shops")
    .insert({ name: trimmedShopName })
    .select("id")
    .single();

  if (shopError || !shop) {
    console.error("[createShopWithOwner]", shopError);
    return { error: "Could not create shop. Please try again." };
  }

  // 2. Seed the settings row for this shop.
  const { error: settingsError } = await adminClient
    .from("settings")
    .insert({ shop_id: shop.id, price_per_kg: 80, shop_name: trimmedShopName });

  if (settingsError) {
    console.error("[createShopWithOwner]", settingsError);
    return { error: "Could not initialise shop settings. Please try again." };
  }

  // 3. Create the designated email as admin for this shop.
  const { error: inviteError } = await adminClient.auth.admin.createUser({
    email: trimmedEmail,
    password: "laundrybuddy123",
    email_confirm: true,
    user_metadata: {
      role: "admin",
      shop_id: shop.id,
    },
  });

  if (inviteError) {
    console.error(
      "[createShopWithOwner] create user error:",
      inviteError.message,
      inviteError
    );
    await adminClient.from("settings").delete().eq("shop_id", shop.id);
    await adminClient.from("shops").delete().eq("id", shop.id);

    return {
      error:
        inviteError.message ??
        "Could not create admin user. Please try again.",
    };
  }

  return { success: true };
}

// ── Invite shop admin ─────────────────────────────────────────────────────────
// Owner-only. Sends a magic-link invitation with role=admin and the target
// shop_id pre-baked into the new user's metadata.

export async function inviteShopAdmin(
  shopId: string,
  email: string
): Promise<OwnerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isOwner(user)) return { error: "Unauthorized." };

  const trimmedEmail = email?.trim();
  if (!trimmedEmail) return { error: "Email is required." };

  const adminClient = createServiceRoleClient();

  // Verify the target shop exists before sending an invitation.
  const { error: shopError } = await adminClient
    .from("shops")
    .select("id")
    .eq("id", shopId)
    .single();

  if (shopError) {
    console.error("[inviteShopAdmin]", shopError);
    return { error: "Shop not found." };
  }

  const { error: inviteError } = await adminClient.auth.admin.createUser({
    email: trimmedEmail,
    password: "laundrybuddy123",
    email_confirm: true,
    user_metadata: {
      role: "admin",
      shop_id: shopId,
    },
  });

  if (inviteError) {
    console.error(
      "[inviteShopAdmin] create user error:",
      inviteError.message,
      inviteError
    );
    return {
      error:
        inviteError.message ?? "Could not create admin user. Please try again.",
    };
  }

  return { success: true };
}

// ── Set shop suspension ───────────────────────────────────────────────────────
// Owner-only. Toggles the is_suspended flag without deleting any data.
// When suspended, all admin/staff users of the shop are blocked from logging
// in and accessing the dashboard.

export async function setShopSuspension(
  shopId: string,
  suspend: boolean
): Promise<OwnerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isOwner(user)) return { error: "Unauthorized." };
  if (!shopId) return { error: "Shop ID is required." };

  const adminClient = createServiceRoleClient();

  const { error } = await adminClient
    .from("shops")
    .update({ is_suspended: suspend })
    .eq("id", shopId);

  if (error) {
    console.error("[setShopSuspension]", error);
    return { error: `Could not ${suspend ? "suspend" : "reactivate"} shop. Please try again.` };
  }

  return { success: true };
}

// ── Delete shop ───────────────────────────────────────────────────────────────
// Owner-only. Permanently deletes the shop and all its associated data
// (cascades via FK constraints on orders, settings, additional_charges).

export async function deleteShop(shopId: string): Promise<OwnerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isOwner(user)) return { error: "Unauthorized." };

  if (!shopId) return { error: "Shop ID is required." };

  const adminClient = createServiceRoleClient();

  const { error } = await adminClient.from("shops").delete().eq("id", shopId);

  if (error) {
    console.error("[deleteShop]", error);
    return { error: "Could not delete shop. Please try again." };
  }

  return { success: true };
}
