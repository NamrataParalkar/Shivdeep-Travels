"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getAllNotifications, sendNotification, deleteNotification, subscribeToNotifications, Notification } from "@/lib/notifications";

export default function SendNotifications() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name || parsed.name || "Admin");
      else router.push("/login");
    } else router.push("/login");

    let channel: any;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await getAllNotifications();

        if (error) {
          let msg = "Unknown error";
          try {
            msg = (error && (error.message || error.msg)) || JSON.stringify(error);
          } catch (e) {
            msg = String(error);
          }
          console.error("Error loading notifications:", msg);
          setErrorMessage(msg);
          setNotifications([]);
        } else if (data) {
          setNotifications(data);
          setErrorMessage(null);
        }

        channel = subscribeToNotifications(
          (n: Notification) => setNotifications((prev) => [...prev, n]),
          (id: number) => setNotifications((prev) => prev.filter((p) => p.id !== id))
        );
      } catch (err) {
        const msg = String(err || "Unexpected error");
        console.error("Unexpected error loading notifications:", msg);
        setErrorMessage(msg);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      try { if (channel && channel.unsubscribe) channel.unsubscribe(); } catch (e) {}
    };
  }, [router]);

  const send = async () => {
    if (!messageText.trim()) return;
    setSending(true);
    const { error } = await sendNotification(messageText.trim());
    if (error) console.error("Send error:", error);
    setMessageText("");
    setSending(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await deleteNotification(id);
    if (error) console.error("Delete error:", error);
  };

  const memoizedMessages = useMemo(() => notifications, [notifications]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-6">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center gap-4 p-6 border-b">
          <button onClick={() => router.back()} className="p-2 rounded-full bg-white/60"><ArrowLeft size={18} /></button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Notifications — Admin</h2>
            <p className="text-sm text-gray-500">Signed in as <span className="font-medium text-purple-600">{adminName}</span></p>
          </div>
        </div>

        {/* Message list */}
        {errorMessage && (
          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Unable to load notifications:</strong>
                <div className="mt-1 text-sm">{errorMessage}</div>
                <div className="mt-2 text-sm text-gray-600">If the table doesn't exist, run <code className="bg-gray-100 px-1 rounded">scripts/CREATE_NOTIFICATIONS_TABLE.sql</code> in your Supabase SQL editor.</div>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 h-[60vh] overflow-y-auto flex flex-col gap-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages…</div>
          ) : memoizedMessages.length === 0 ? (
            <div className="text-center text-gray-500">No messages yet. Use the box below to send one.</div>
          ) : (
            memoizedMessages.map((m) => (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-3 rounded-2xl shadow-md relative">
                  <div className="whitespace-pre-wrap">{m.message_text}</div>
                  <div className="text-xs text-white/80 mt-2 flex items-center gap-2 justify-end">
                    <span>{new Date(m.timestamp).toLocaleString()}</span>
                    <button onClick={() => handleDelete(m.id)} title="Delete message" className="p-1 rounded hover:bg-white/10">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="p-4 border-t bg-white/90 flex gap-3 items-center">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message to all students..."
            className="flex-1 border rounded-xl px-4 py-3 resize-none h-20 focus:ring-2 focus:ring-pink-300"
          />
          <button onClick={send} disabled={sending} className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold disabled:opacity-60">
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
