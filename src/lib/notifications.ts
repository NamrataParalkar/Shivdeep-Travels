import { supabase } from "./supabaseClient";

export type Notification = {
  id: number;
  message_text: string;
  timestamp: string;
  sender_role: string;
};

export async function getAllNotifications(): Promise<{ data?: Notification[]; error?: any }>{
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, message_text, timestamp, sender_role")
      .order("timestamp", { ascending: true });

    if (error) {
      return { data: undefined, error };
    }

    return { data: data as Notification[] | undefined };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function sendNotification(message_text: string){
  try {
    const payload = { message_text, timestamp: new Date().toISOString(), sender_role: "admin" };
    const { data, error } = await supabase
      .from("notifications")
      .insert(payload)
      .select()
      .single();

    if (error) return { data: undefined, error };
    return { data };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

export async function deleteNotification(id: number){
  try {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) return { data: undefined, error };
    return { data };
  } catch (err) {
    return { data: undefined, error: { message: String(err) } };
  }
}

// Subscriptions: returns the channel so callers can unsubscribe when needed
export function subscribeToNotifications(onInsert: (n: Notification) => void, onDelete?: (id: number) => void){
  try {
    const channel = supabase.channel("public:notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        if (payload?.new) onInsert(payload.new as Notification);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, (payload) => {
        if (payload?.old && onDelete) onDelete(payload.old.id as number);
      })
      .subscribe();

    return channel;
  } catch (err) {
    console.error("subscribeToNotifications error:", err);
    return null as any;
  }
}
