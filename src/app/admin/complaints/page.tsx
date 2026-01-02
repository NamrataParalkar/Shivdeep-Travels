"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, MessageCircle, Search, AlertCircle, Filter } from "lucide-react";
import {
  Entry,
  fetchAdminEntries,
  updateStatus,
  updateAdminResponse,
  deleteEntry,
  fetchUserProfiles,
} from "@/lib/complaints";

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [userMap, setUserMap] = useState<Record<string, any>>({});

  // Visible filters
  const [typeFilter, setTypeFilter] = useState<"all" | "complaint" | "feedback">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return router.push("/login");
    try {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "admin") return router.push("/login");
      setIsAdmin(true);
      loadEntries();
    } catch (e) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadEntries = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await fetchAdminEntries({
        entry_type: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm || undefined,
      });

      if (fetchError) {
        setError(fetchError.message || "Failed to load entries");
        setEntries([]);
      } else if (data) {
        setEntries(data);
        // Load user profiles for display
        const uniqueIds = Array.from(new Set(data.map((d: any) => String(d.user_id))));
        try {
          const res = await fetchUserProfiles(uniqueIds);
          if (!res.error && res.data) setUserMap(res.data as any);
        } catch (e) {
          console.warn("Failed to fetch user profiles:", e);
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Trigger load when filters change
  useEffect(() => {
    if (isAdmin) loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, isAdmin]);

  const handleSearch = () => {
    loadEntries();
  };

  const handleChangeStatus = async (
    id: number,
    newStatus: "Pending" | "In Progress" | "Resolved" | "Closed"
  ) => {
    setSaving(true);
    try {
      const { data, error: updateError } = await updateStatus(id, newStatus);
      if (updateError) {
        setError(updateError.message || "Failed to update status");
      } else if (data) {
        setEntries((prev) => prev.map((c) => (c.id === id ? data : c)));
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResponse = async (id: number) => {
    setSaving(true);
    try {
      const { data, error: saveError } = await updateAdminResponse(id, adminResponse);
      if (saveError) {
        setError(saveError.message || "Failed to save response");
      } else if (data) {
        setEntries((prev) => prev.map((c) => (c.id === id ? data : c)));
        setEditingId(null);
        setAdminResponse("");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry? This action cannot be undone.")) return;
    try {
      const res = await deleteEntry(id);
      if (res.success) {
        setEntries((p) => p.filter((c) => c.id !== id));
      } else {
        setError(res.error?.message || "Failed to delete");
      }
    } catch (err) {
      setError(String(err));
    }
  };

  // Helper to get user info
  const getUserInfo = (userId: string) => {
    const key = String(userId);
    const info = userMap[key] || {};
    return {
      name: info.full_name || userId,
      role: info.role || "unknown",
      id: info.auth_id || info.id || userId,
    };
  };

  // Helper for status badge color
  const getStatusBadgeColor = (status: string) => {
    if (status === "Pending") return "bg-yellow-100 text-yellow-800";
    if (status === "In Progress") return "bg-yellow-50 text-yellow-800";
    if (status === "Resolved") return "bg-green-100 text-green-800";
    if (status === "Closed") return "bg-gray-800 text-white";
    return "bg-gray-100 text-gray-800";
  };

  // Helper for type badge
  const getTypeBadgeColor = (type: string) => {
    if (type === "complaint") return "bg-red-100 text-red-700";
    if (type === "feedback") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
                Admin — Complaints & Feedback
              </h1>
              <p className="text-sm text-slate-500 mt-1">View and manage all user submissions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-6 mb-6">
          {/* Type Filter: Visible Tabs */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">View Type:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  typeFilter === "all"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("complaint")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  typeFilter === "complaint"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Complaints Only
              </button>
              <button
                onClick={() => setTypeFilter("feedback")}
                className={`px-5 py-2 rounded-lg font-medium transition-all ${
                  typeFilter === "feedback"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Feedback Only
              </button>
            </div>
          </div>

          {/* Status Filter: Only visible for complaints */}
          {typeFilter !== "feedback" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                <Filter className="w-4 h-4 inline mr-2" />
                Status Filter (Complaints):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === "all"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All Complaints
                </button>
                <button
                  onClick={() => setStatusFilter("Pending")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === "Pending"
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Pending Only
                </button>
                <button
                  onClick={() => setStatusFilter("Resolved")}
                  className={`px-5 py-2 rounded-lg font-medium transition-all ${
                    statusFilter === "Resolved"
                      ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Resolved Only
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Search:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by subject, message, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mx-auto"></div>
              <p className="text-slate-600 font-medium">Loading entries…</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && entries.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600">No entries found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {/* Entries List */}
        {!loading && entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry) => {
              const userInfo = getUserInfo(entry.user_id);
              return (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-6"
                >
                  {/* Header Row: Type, Status, User Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {/* User Info Card */}
                      <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Submitted By</div>
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-slate-900">{userInfo.name}</div>
                          <div className="flex items-center gap-3">
                            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full capitalize">
                              {userInfo.role}
                            </span>
                            <span className="text-xs text-slate-600 font-mono bg-slate-200 px-2 py-1 rounded">
                              ID: {userInfo.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Entry Type & Status Badges */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getTypeBadgeColor(entry.entry_type)}`}>
                          {entry.entry_type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(entry.status)}`}>
                          {entry.status}
                        </span>
                        {entry.category && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                            {entry.category}
                          </span>
                        )}
                      </div>

                      {/* Subject */}
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{entry.subject}</h3>

                      {/* Message */}
                      <p className="text-slate-700 leading-relaxed mb-3">{entry.message}</p>

                      {/* Subtle note for feedback entries */}
                      {entry.entry_type === "feedback" && (
                        <div className="mt-3 text-sm text-slate-500 italic">
                          This feedback helps us improve our service. Thank you for sharing.
                        </div>
                      )}

                      {/* Admin Response */}
                      {entry.admin_response && (
                        <div className="mt-4 p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
                          <div className="text-xs font-semibold text-purple-700 uppercase mb-2">Admin Response</div>
                          <p className="text-slate-800">{entry.admin_response}</p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="text-xs text-slate-500 mt-4">
                        Submitted: {new Date(entry.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      {/* Status Selector - show feedback-specific statuses when entry is feedback */}
                      {entry.entry_type === "feedback" ? (
                        <select
                          value={entry.status}
                          onChange={(e) => handleChangeStatus(entry.id, e.target.value as any)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      ) : (
                        <select
                          value={entry.status}
                          onChange={(e) => handleChangeStatus(entry.id, e.target.value as any)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}

                      {/* Action Buttons */}
                      <button
                        onClick={() => {
                          setEditingId(entry.id);
                          setAdminResponse(entry.admin_response || "");
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Add Note
                      </button>

                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Edit Response Form */}
                  {editingId === entry.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Add Admin Response:</label>
                      <textarea
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        placeholder="Type your response or note here..."
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleSaveResponse(entry.id)}
                          disabled={saving}
                          className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save Response"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setAdminResponse("");
                          }}
                          className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
