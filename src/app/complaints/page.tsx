"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, AlertCircle, CheckCircle } from "lucide-react";
import { createEntry, fetchUserEntries, Entry } from "@/lib/complaints";

export default function ComplaintsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState<"student" | "parent" | "driver" | "admin">("student");
  const [userName, setUserName] = useState("");

  // Form state
  const [formMode, setFormMode] = useState<"complaint" | "feedback">("complaint");
  const [category, setCategory] = useState<"Bus" | "Driver" | "Route" | "App" | "Other">("Bus");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High">("Normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // UI state
  const [complaints, setComplaints] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
          if (userData) {
      try {
        const parsed = JSON.parse(userData);
        if (parsed.role === "student" || parsed.role === "parent" || parsed.role === "driver") {
          // Use auth_id if available (from new auth system), otherwise use id
          const authId = parsed.authId || parsed.id || parsed.auth_id;
          setUserId(authId || "");
          setUserRole((parsed.role || "student") as any);
          setUserName(parsed.full_name || parsed.name || "User");
          loadComplaints(authId || "");
        } else {
          router.push("/login");
        }
      } catch (e) {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadComplaints = async (id: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await fetchUserEntries(id);
      if (error) {
        console.error("Error loading complaints:", error.message || error);
        setErrorMsg("Failed to load complaints. Please try again.");
      } else if (data) {
        setComplaints(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!subject.trim()) {
      setErrorMsg("Subject is required");
      return false;
    }
    if (!message.trim()) {
      setErrorMsg("Message is required");
      return false;
    }
    if (subject.trim().length < 5) {
      setErrorMsg("Subject must be at least 5 characters");
      return false;
    }
    if (message.trim().length < 20) {
      setErrorMsg("Message must be at least 20 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await createEntry({
        user_id: userId,
        user_role: userRole,
        entry_type: formMode,
        category: formMode === "complaint" ? category : undefined,
        subject: subject.trim(),
        message: message.trim(),
        priority: formMode === "complaint" ? priority : undefined,
      });

      if (error) {
        setErrorMsg((error && (error.message || String(error))) || "Failed to submit complaint");
      } else if (data) {
        setSuccessMsg("Submitted successfully!");
        setComplaints([data, ...complaints]);
        setSubject("");
        setMessage("");
        setFormMode("complaint");
        setCategory("Bus");
        setPriority("Normal");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err || "Unexpected error"));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-purple-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
                Complaints & Feedback
              </h1>
              <p className="text-sm text-slate-500">Share your feedback or report issues</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Welcome, {userName}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error and Success Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}

        {/* Submit Forms */}
        <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6 mb-8">
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setFormMode("complaint")}
              className={`px-4 py-2 rounded ${formMode === "complaint" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-gray-100 text-purple-600"}`}
            >
              Raise a Complaint
            </button>
            <button
              onClick={() => setFormMode("feedback")}
              className={`px-4 py-2 rounded ${formMode === "feedback" ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white" : "bg-gray-100 text-purple-600"}`}
            >
              Give Feedback
            </button>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-4">{formMode === "complaint" ? "Complaint Form" : "Feedback Form"}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formMode === "complaint" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="w-full p-2 border rounded">
                    <option value="Bus">Bus</option>
                    <option value="Driver">Driver</option>
                    <option value="Route">Route</option>
                    <option value="App">App</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as any)} className="w-full p-2 border rounded">
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief title" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-200" />
              {subject.length > 0 && subject.length < 5 && (<p className="text-xs text-amber-600 mt-1">At least 5 characters required</p>)}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your message (min 20 characters)" rows={5} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-200 resize-none" />
              {message.length > 0 && message.length < 20 && (<p className="text-xs text-amber-600 mt-1">At least 20 characters required</p>)}
            </div>

            <button type="submit" disabled={submitting} className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? (<><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>Submitting...</>) : (<><Send className="w-4 h-4" />{formMode === "complaint" ? "Submit Complaint" : "Submit Feedback"}</>)}
            </button>
          </form>
        </div>

        {/* Complaints History */}
        <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Your Complaints & Feedback</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-spin mx-auto"></div>
                <p className="text-slate-600">Loading complaints...</p>
              </div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No complaints submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{complaint.subject}</h3>
                          <div className="text-xs text-slate-500">Type: <span className="font-medium text-slate-700">{complaint.entry_type}</span></div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3 leading-relaxed">{complaint.message}</p>
                  <p className="text-xs text-slate-500">
                    Submitted on {new Date(complaint.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
