"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, ChevronDown } from "lucide-react";
import { getBuses, createBus, updateBus, changeBusStatus, deleteBus, getDriversForAssignment, Bus, Driver } from "@/lib/buses";

export default function ManageBuses() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bus_number: "",
    capacity: "",
    driver_id: "" as string | number,
    status: "active" as "active" | "maintenance" | "inactive",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Status dropdown
  const [statusDropdown, setStatusDropdown] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name || parsed.name || "Admin");
      else router.push("/login");
    } else router.push("/login");

    loadBuses();
    loadDrivers();
  }, [router]);

  const loadBuses = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await getBuses();
      if (error) {
        console.error("Error loading buses:", error.message || error);
        setErrorMsg("Failed to load buses. Please refresh.");
      } else if (data) {
        setBuses(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const { data, error } = await getDriversForAssignment();
      if (error) {
        console.error("Error loading drivers:", error);
      } else if (data) {
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.bus_number.trim()) errors.bus_number = "Bus number is required";
    const capNum = Number(formData.capacity);
    if (!formData.capacity || isNaN(capNum) || capNum <= 0)
      errors.capacity = "Capacity must be greater than 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ bus_number: "", capacity: "", driver_id: "", status: "active" });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (bus: Bus) => {
    setEditingId(bus.id);
    setFormData({
      bus_number: bus.bus_number,
      capacity: String(bus.capacity),
      driver_id: bus.driver_id || "",
      status: bus.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ bus_number: "", capacity: "", driver_id: "", status: "active" });
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
        // Edit
        const { data, error } = await updateBus(editingId, {
          bus_number: formData.bus_number,
          capacity: Number(formData.capacity),
          driver_id: formData.driver_id ? Number(formData.driver_id) : null,
          status: formData.status,
        });
        if (error) {
          setErrorMsg(error.message || "Failed to update bus");
        } else if (data) {
          setSuccessMsg("Bus updated successfully!");
          closeModal();
          await loadBuses();
        }
      } else {
        // Create
        const { data, error } = await createBus({
          bus_number: formData.bus_number,
          capacity: Number(formData.capacity),
          driver_id: formData.driver_id ? Number(formData.driver_id) : undefined,
          status: "active",
        });
        if (error) {
          setErrorMsg(error.message || "Failed to create bus");
        } else if (data) {
          setSuccessMsg("Bus created successfully!");
          closeModal();
          await loadBuses();
        }
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);
    }
  };

  const handleStatusChange = async (id: number, newStatus: "active" | "maintenance" | "inactive") => {
    try {
      const { error } = await changeBusStatus(id, newStatus);
      if (error) {
        setErrorMsg(error.message || "Failed to change status");
      } else {
        setSuccessMsg("Bus status updated!");
        await loadBuses();
      }
      setStatusDropdown(null);
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    try {
      const { success, error } = await deleteBus(id);
      if (error) {
        setErrorMsg(error.message || "Failed to delete bus");
      } else if (success) {
        setSuccessMsg("Bus deleted successfully!");
        await loadBuses();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const filteredBuses = buses.filter((bus) =>
    bus.bus_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDriverName = (driverId: number | null) => {
    if (!driverId) return "—";
    const driver = drivers.find((d) => d.id === driverId);
    return driver ? driver.full_name : "—";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10"
    >
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-yellow-300 rounded-full blur-3xl opacity-30"></div>

      {/* Alerts */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/70 hover:bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-400 bg-clip-text text-transparent">
            Manage Buses
          </h1>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search buses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-yellow-200 bg-white/80 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-full shadow-md transition"
          >
            <Plus size={20} /> Add Bus
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading buses...</p>
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">{searchTerm ? "No buses match your search." : "No buses found."}</p>
            {!searchTerm && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-full transition"
              >
                <Plus size={20} /> Add First Bus
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-yellow-100 to-orange-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Bus Number</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Capacity</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Assigned Driver</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr
                      key={bus.id}
                      className="border-t border-gray-200 hover:bg-yellow-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-800 font-semibold">{bus.bus_number}</td>
                      <td className="px-6 py-4 text-gray-600">{bus.capacity}</td>
                      <td className="px-6 py-4 text-gray-600">{getDriverName(bus.driver_id)}</td>
                      <td className="px-6 py-4">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setStatusDropdown(statusDropdown === bus.id ? null : bus.id)}
                            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(bus.status)}`}
                          >
                            {bus.status}
                            <ChevronDown size={14} />
                          </button>
                          {statusDropdown === bus.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              {(["active", "maintenance", "inactive"] as const).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(bus.id, status)}
                                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                    bus.status === status ? "bg-yellow-50 font-semibold" : ""
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button
                          onClick={() => openEdit(bus)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(bus.id)}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Bus" : "Add New Bus"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Bus Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bus Number *</label>
                <input
                  type="text"
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  placeholder="e.g., BUS-001"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
                />
                {formErrors.bus_number && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.bus_number}</p>
                )}
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Capacity *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="e.g., 50"
                  min="1"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
                />
                {formErrors.capacity && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>
                )}
              </div>

              {/* Driver Assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Driver</label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value ? Number(e.target.value) : "" })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
                >
                  <option value="">— No Driver —</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} ({driver.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status (only for edit) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
