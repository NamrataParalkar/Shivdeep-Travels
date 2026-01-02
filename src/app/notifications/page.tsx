"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getAllNotifications, subscribeToNotifications, Notification } from "@/lib/notifications";

export default function NotificationsPage() {
  const [messages, setMessages] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
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
            console.error("Failed to load notifications:", msg);
            setErrorMessage(msg);
            setMessages([]);
          } else if (data) {
            setMessages(data);
            setErrorMessage(null);
          }

          channel = subscribeToNotifications(
            (n: Notification) => setMessages((prev) => [...prev, n]),
            (id: number) => setMessages((prev) => prev.filter((m) => m.id !== id))
          );
        } catch (err) {
          const msg = String(err || "Unexpected error");
          console.error("Unexpected error loading notifications:", msg);
          setErrorMessage(msg);
          setMessages([]);
        } finally {
          setLoading(false);
        }
      }

    load();

    return () => { try { if (channel && channel.unsubscribe) channel.unsubscribe(); } catch(e) {} };
  }, []);

  const memo = useMemo(() => messages, [messages]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    try {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  }, [memo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold">A</div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Announcements</h1>
              <p className="text-sm text-gray-500">Messages from Admin — read-only</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">{messages.length} messages</div>
        </div>

        {/* Message area */}
        <div ref={listRef} className="px-6 py-6 h-[64vh] overflow-y-auto bg-gradient-to-b from-white to-purple-50">
          {loading ? (
            <div className="text-center text-gray-500">Loading messages…</div>
          ) : errorMessage ? (
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800 rounded-md">
              <strong>Unable to load messages:</strong>
              <div className="mt-1 text-sm">{errorMessage}</div>
              <div className="mt-2 text-sm text-gray-600">Ask an admin to run <code className="bg-gray-100 px-1 rounded">scripts/CREATE_NOTIFICATIONS_TABLE.sql</code>.</div>
            </div>
          ) : memo.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-36 h-36 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 font-bold text-2xl">✉️</div>
                <p className="mt-4 text-gray-600">No announcements yet. Check back soon.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {memo.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">AD</div>
                  <div>
                    <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm max-w-[80vw]">
                      <div className="whitespace-pre-wrap text-gray-800">{m.message_text}</div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{new Date(m.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
