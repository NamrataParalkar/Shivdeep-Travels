"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Edit2, X, Check } from "lucide-react";
import { getAllContacts, createContact, updateContact, deleteContact, ContactInfo } from "@/lib/contactInfo";

export default function ManageContactInfoPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") {
        setAdminName(parsed.full_name || parsed.name || "Admin");
        loadContacts();
      } else {
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadContacts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await getAllContacts();
      if (error) {
        let msg = "Unknown error";
        try {
          msg = (error && error.message) || JSON.stringify(error);
        } catch (e) {
          msg = String(error);
        }
        console.error("Error loading contacts:", msg);
        setErrorMsg("Failed to load contacts. Please refresh.");
      } else if (data) {
        setContacts(data);
      }
    } catch (err) {
      console.error("Unexpected error:", String(err));
      setErrorMsg("Unexpected error loading contacts.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (formData.phone && !/^[0-9\-\+\s()]{7,}$/.test(formData.phone.trim())) {
      errors.phone = "Invalid phone number";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address";
    }
    if (!formData.phone && !formData.email) {
      errors.contact = "At least phone or email is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (contact?: ContactInfo) => {
    if (contact) {
      setEditingId(contact.id);
      setFormData({
        name: contact.name,
        phone: contact.phone || "",
        email: contact.email || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", phone: "", email: "" });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ name: "", phone: "", email: "" });
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (editingId) {
        // Update
        const { data, error } = await updateContact(editingId, formData);
        if (error) {
          let msg = "Failed to update contact";
          try {
            msg = (error && error.message) || String(error);
          } catch (e) {
            msg = "Failed to update contact";
          }
          setErrorMsg(msg);
          console.error(error);
        } else if (data) {
          setContacts(contacts.map((c) => (c.id === editingId ? data : c)));
          setSuccessMsg("Contact updated successfully!");
          handleCloseModal();
        }
      } else {
        // Create
        const { data, error } = await createContact(formData as Omit<ContactInfo, "id" | "created_at">);
        if (error) {
          let msg = "Failed to create contact";
          try {
            msg = (error && error.message) || String(error);
          } catch (e) {
            msg = "Failed to create contact";
          }
          setErrorMsg(msg);
          console.error(error);
        } else if (data) {
          setContacts([data, ...contacts]);
          setSuccessMsg("Contact added successfully!");
          handleCloseModal();
        }
      }
    } catch (err) {
      const msg = String(err || "Unexpected error");
      console.error(msg);
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this contact?")) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { success, error } = await deleteContact(id);
      if (!success) {
        let msg = "Failed to delete contact";
        try {
          msg = (error && error.message) || String(error);
        } catch (e) {
          msg = "Failed to delete contact";
        }
        setErrorMsg(msg);
        console.error(error);
      } else {
        setContacts(contacts.filter((c) => c.id !== id));
        setSuccessMsg("Contact deleted successfully!");
      }
    } catch (err) {
      console.error(String(err));
      setErrorMsg(String(err || "Unexpected error"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 pt-20">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-purple-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 bg-clip-text text-transparent">
                Manage Contact Info
              </h1>
              <p className="text-sm text-slate-500">Add, edit, and delete contact information</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-spin mx-auto"></div>
              <p className="text-slate-600">Loading contacts...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-medium">No contacts yet</p>
              <p className="text-sm text-slate-500 mt-1">Click "Add Contact" to create the first one</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-purple-100">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{contact.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contact.phone || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{contact.email || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(contact)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit Contact" : "Add New Contact"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 ${
                    formErrors.name
                      ? "border-red-300 focus:ring-red-400"
                      : "border-slate-300 focus:ring-purple-400"
                  }`}
                  placeholder="Contact name"
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 ${
                    formErrors.phone
                      ? "border-red-300 focus:ring-red-400"
                      : "border-slate-300 focus:ring-purple-400"
                  }`}
                  placeholder="Phone number"
                />
                {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-200 ${
                    formErrors.email
                      ? "border-red-300 focus:ring-red-400"
                      : "border-slate-300 focus:ring-purple-400"
                  }`}
                  placeholder="Email address"
                />
                {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
              </div>

              {formErrors.contact && (
                <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formErrors.contact}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingId ? "Update" : "Add"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
