"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit2, Trash2, X } from "lucide-react";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  Driver,
} from "@/lib/drivers";

export default function ManageDrivers() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    gender: "Male",
    experience: "",
    phone: "",
    email: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name || parsed.name || "Admin");
      else router.push("/login");
    } else router.push("/login");

    loadDrivers();
  }, [router]);

  const loadDrivers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await getDrivers();
      if (error) {
        console.error("Error loading drivers:", error.message || error);
        setErrorMsg("Failed to load drivers. Please refresh.");
      } else if (data) {
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name.trim()) errors.full_name = "Full name is required";
    const ageNum = Number(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 18 || ageNum > 65)
      errors.age = "Age must be between 18 and 65";
    const expNum = Number(formData.experience);
    if (!formData.experience || isNaN(expNum) || expNum < 1)
      errors.experience = "Experience must be at least 1";
    if (!/^[0-9]{10}$/.test(formData.phone)) errors.phone = "Phone must be 10 digits";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email";
    if (!editingId && !formData.password) errors.password = "Password is required when creating a driver";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ full_name: "", age: "", gender: "Male", experience: "", phone: "", email: "", password: "" });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (d: Driver) => {
    setEditingId(d.id);
    setFormData({
      full_name: d.full_name,
      age: String(d.age),
      gender: d.gender,
      experience: String(d.experience),
      phone: d.phone,
      email: d.email || "",
      password: "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
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
        const payload: any = {
          full_name: formData.full_name,
          age: Number(formData.age),
          gender: formData.gender as any,
          experience: Number(formData.experience),
          phone: formData.phone,
          email: formData.email || undefined,
        };
        if (formData.password) payload.password = formData.password;
        const { data, error } = await updateDriver(editingId, payload);
        if (error) {
          setErrorMsg((error && (error.message || String(error))) || "Failed to update driver");
        } else if (data) {
          setDrivers(drivers.map((dr) => (dr.id === editingId ? data : dr)));
          setSuccessMsg("Driver updated successfully");
          closeModal();
        }
      } else {
        const payload = {
          full_name: formData.full_name,
          age: Number(formData.age),
          gender: formData.gender as any,
          experience: Number(formData.experience),
          phone: formData.phone,
          email: formData.email || undefined,
          password: formData.password,
        };
        const { data, error } = await createDriver(payload);
        if (error) {
          setErrorMsg((error && (error.message || String(error))) || "Failed to create driver");
        } else if (data) {
          setDrivers([data, ...drivers]);
          setSuccessMsg("Driver created successfully");
          closeModal();
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err || "Unexpected error"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) return;
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { success, error } = await deleteDriver(id);
      if (!success) {
        setErrorMsg((error && (error.message || String(error))) || "Failed to delete driver");
      } else {
        setDrivers(drivers.filter((d) => d.id !== id));
        setSuccessMsg("Driver deleted");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err || "Unexpected error"));
    }
  };

  const filtered = drivers.filter((d) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return d.full_name.toLowerCase().includes(q) || d.phone.includes(q);
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-10">
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/70 hover:bg-pink-100 text-pink-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            Manage Drivers
          </h1>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name or phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-pink-200 bg-white/80 focus:outline-none focus:border-pink-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-2 rounded-full shadow-md transition"
          >
            <Plus size={20} /> Add Driver
          </button>
        </div>
      </header>

      <div className="relative z-10">
        {successMsg && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">{successMsg}</div>}
        {errorMsg && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">{errorMsg}</div>}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading drivers...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No drivers found.</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full transition">
              <Plus size={20} /> Add First Driver
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-pink-100 to-purple-100">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Age</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Gender</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Experience</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-gray-800 font-semibold">Created</th>
                  <th className="px-6 py-4 text-right text-gray-800 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-t border-gray-200 hover:bg-pink-50 transition">
                    <td className="px-6 py-4 text-gray-800">{d.full_name}</td>
                    <td className="px-6 py-4 text-gray-700">{d.age}</td>
                    <td className="px-6 py-4 text-gray-700">{d.gender}</td>
                    <td className="px-6 py-4 text-gray-700">{d.phone}</td>
                    <td className="px-6 py-4 text-gray-700">{d.experience}</td>
                    <td className="px-6 py-4 text-gray-700">{d.email || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right flex gap-3 justify-end">
                      <button onClick={() => openEdit(d)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingId ? "Edit Driver" : "Add Driver"}</h2>
              <button onClick={closeModal} className="p-2 rounded-md hover:bg-slate-100"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full name *</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.full_name? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.full_name && <p className="text-sm text-red-600">{formErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age *</label>
                <input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.age? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.age && <p className="text-sm text-red-600">{formErrors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-3 py-2 border rounded-lg border-slate-300">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years) *</label>
                <input type="number" value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.experience? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.experience && <p className="text-sm text-red-600">{formErrors.experience}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.phone? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.phone && <p className="text-sm text-red-600">{formErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.email? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password {editingId ? '(leave blank to keep current)' : '*'}</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full px-3 py-2 border rounded-lg ${formErrors.password? 'border-red-300': 'border-slate-300'}`} />
                {formErrors.password && <p className="text-sm text-red-600">{formErrors.password}</p>}
              </div>

              <div className="md:col-span-2 flex gap-3 justify-end pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg">
                  {submitting ? 'Saving...' : (editingId ? 'Update Driver' : 'Add Driver')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
