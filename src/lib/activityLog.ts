import { supabase } from "@/lib/supabase";

export async function logActivity(
  adminEmail: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      admin_email: adminEmail,
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
