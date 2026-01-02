"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, ToggleRight, Check, XCircle } from "lucide-react";
import { getRoutes, createRoute, updateRoute, toggleRouteStatus, deleteRoute, RouteWithStops, Stop } from "@/lib/routes";
import { getRouteRequests, approveRouteRequest, rejectRouteRequest } from "@/lib/enrollments";

type ActiveTab = "routes" | "requests";

export default function ManageRoutes() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [routeRequests, setRouteRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("routes");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    route_name: "",
    start_point: "",
    end_point: "",
    is_active: true,
    stops: [] as { id?: number; stop_name: string; stop_order: number }[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Route request handling
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name || parsed.name || "Admin");
      else router.push("/login");
    } else router.push("/login");

    loadRoutes();
    loadRouteRequests();
  }, [router]);

  const loadRoutes = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await getRoutes();
      if (error) {
        console.error("Error loading routes:", error.message || error);
        setErrorMsg("Failed to load routes. Please refresh.");
      } else if (data) {
        setRoutes(data as RouteWithStops[]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadRouteRequests = async () => {
    try {
      const { data, error } = await getRouteRequests("pending");
      if (error) {
        try {
          console.error("Error loading route requests:", JSON.stringify(error));
        } catch (e) {
          console.error("Error loading route requests:", error);
        }
        setErrorMsg(error.message || (error.raw ? JSON.stringify(error.raw) : JSON.stringify(error)));
      } else if (data) {
        setRouteRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.route_name.trim()) errors.route_name = "Route name is required";
    if (!formData.start_point.trim()) errors.start_point = "Start point is required";
    if (!formData.end_point.trim()) errors.end_point = "End point is required";

    // Validate stops
    if (!formData.stops || formData.stops.length === 0) {
      errors.stops = "At least one stop is required";
    } else {
      for (let i = 0; i < formData.stops.length; i++) {
        const s = formData.stops[i];
        if (!s.stop_name || !s.stop_name.trim()) {
          errors[`stop_${i}`] = "Stop name is required";
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({ route_name: "", start_point: "", end_point: "", is_active: true, stops: [] });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (route: any) => {
    setEditingId(route.id);
    // route may include stops when returned by getRoutes
    const r = route as RouteWithStops;
    setFormData({
      route_name: r.route_name,
      start_point: r.start_point,
      end_point: r.end_point,
      is_active: r.is_active,
      stops: (r.stops || []).map((s) => ({ id: s.id, stop_name: s.stop_name, stop_order: s.stop_order })),
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ route_name: "", start_point: "", end_point: "", is_active: true });
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
        // Edit with stops
        const stopsPayload = formData.stops.map((s) => ({ stop_name: s.stop_name, stop_order: s.stop_order }));
        const { data, error } = await updateRoute(editingId, {
          route_name: formData.route_name,
          start_point: formData.start_point,
          end_point: formData.end_point,
          is_active: formData.is_active,
          stops: stopsPayload,
        });
        if (error) {
          setErrorMsg(error.message || "Failed to update route");
        } else if (data) {
          setSuccessMsg("Route updated successfully!");
          closeModal();
          await loadRoutes();
        }
      } else {
        // Create with stops
        const stopsPayload = formData.stops.map((s) => ({ stop_name: s.stop_name, stop_order: s.stop_order }));
        const { data, error } = await createRoute({
          route_name: formData.route_name,
          start_point: formData.start_point,
          end_point: formData.end_point,
          is_active: true,
          stops: stopsPayload,
        });
        if (error) {
          setErrorMsg(error.message || "Failed to create route");
        } else if (data) {
          setSuccessMsg("Route created successfully!");
          closeModal();
          await loadRoutes();
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

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await toggleRouteStatus(id, !currentStatus);
      if (error) {
        setErrorMsg(error.message || "Failed to toggle status");
      } else {
        setSuccessMsg(`Route ${!currentStatus ? "activated" : "deactivated"}!`);
        await loadRoutes();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this route?")) return;
    try {
      const { success, error } = await deleteRoute(id);
      if (error) {
        setErrorMsg(error.message || "Failed to delete route");
      } else if (success) {
        setSuccessMsg("Route deleted successfully!");
        await loadRoutes();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const handleApproveRequest = async (requestId: number) => {
    setApprovingRequestId(requestId);
    try {
      const { error } = await approveRouteRequest(requestId);
      if (error) {
        setErrorMsg("Failed to approve request");
      } else {
        setSuccessMsg("Route request approved!");
        await loadRouteRequests();
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setApprovingRequestId(null);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 2000);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setRejectingRequestId(requestId);
    try {
      const { error } = await rejectRouteRequest(requestId);
      if (error) {
        setErrorMsg("Failed to reject request");
      } else {
        setSuccessMsg("Route request rejected!");
        await loadRouteRequests();
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setRejectingRequestId(null);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 2000);
    }
  };

  const filteredRoutes = routes.filter((route) =>
    route.route_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10"
    >
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-green-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-green-300 rounded-full blur-3xl opacity-30"></div>

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
            className="flex items-center gap-2 bg-white/70 hover:bg-green-100 text-green-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 via-green-500 to-emerald-400 bg-clip-text text-transparent">
            Manage Routes
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-green-200">
          <button
            onClick={() => setActiveTab("routes")}
            className={`pb-3 px-2 font-semibold transition ${
              activeTab === "routes"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Routes
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-2 font-semibold transition relative ${
              activeTab === "requests"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Route Requests
            {routeRequests.length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {routeRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Controls - only show for routes tab */}
        {activeTab === "routes" && (
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-green-200 bg-white/80 focus:outline-none focus:border-green-400"
              />
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-full shadow-md transition"
            >
              <Plus size={20} /> Add Route
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="relative z-10">
        {/* ROUTES TAB */}
        {activeTab === "routes" && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading routes...</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-600 mb-4">{searchTerm ? "No routes match your search." : "No routes found."}</p>
                {!searchTerm && (
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition"
                  >
                    <Plus size={20} /> Create First Route
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                <thead className="bg-gradient-to-r from-green-100 to-emerald-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Route ID</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Route Name</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Route Path</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoutes.map((route) => (
                    <tr
                      key={route.id}
                      className="border-t border-gray-200 hover:bg-green-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-700 font-semibold">#{route.id}</td>
                      <td className="px-6 py-4 text-gray-800 font-semibold">{route.route_name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <div className="text-sm">
                          {route.start_point}
                          {route.stops && route.stops.length > 0 && (
                            <>
                              {route.stops.map((stop) => (
                                <span key={stop.id}> → {stop.stop_name}</span>
                              ))}
                            </>
                          )}
                          {route.end_point && (
                            <span> → {route.end_point}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(route.id, route.is_active)}
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                            route.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <ToggleRight size={16} />
                          {route.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        <button
                          onClick={() => openEdit(route)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
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
          </>
        )}

        {/* ROUTE REQUESTS TAB */}
        {activeTab === "requests" && (
          <>
            {routeRequests.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-600">No pending route requests.</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-green-100 to-emerald-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Student Name</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Class</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Phone</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Requested Stop</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Area</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Description</th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeRequests.map((request) => (
                        <tr key={request.id} className="border-t border-gray-200 hover:bg-green-50 transition">
                          <td className="px-6 py-4 text-gray-700 font-semibold">
                            {request.students?.full_name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {request.students?.student_class || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {request.students?.phone || request.students?.parent_phone || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-semibold">
                            {request.requested_stop}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {request.area || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {request.description ? request.description.substring(0, 50) + "..." : "—"}
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={approvingRequestId === request.id}
                              className="text-green-600 hover:text-green-800 transition disabled:opacity-50 flex items-center gap-1"
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={rejectingRequestId === request.id}
                              className="text-red-600 hover:text-red-800 transition disabled:opacity-50 flex items-center gap-1"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Route" : "Add New Route"}
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
              {/* Route Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Route Name *</label>
                <input
                  type="text"
                  value={formData.route_name}
                  onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                  placeholder="e.g., Morning Route A"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                {formErrors.route_name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.route_name}</p>
                )}
              </div>

              {/* Start Point */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Point *</label>
                <input
                  type="text"
                  value={formData.start_point}
                  onChange={(e) => setFormData({ ...formData, start_point: e.target.value })}
                  placeholder="e.g., Central Station"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                {formErrors.start_point && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.start_point}</p>
                )}
              </div>

              {/* End Point */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Point *</label>
                <input
                  type="text"
                  value={formData.end_point}
                  onChange={(e) => setFormData({ ...formData, end_point: e.target.value })}
                  placeholder="e.g., School Terminal"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                />
                {formErrors.end_point && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.end_point}</p>
                )}
              </div>

              {/* Route Stops Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Route Stops *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newStop = {
                        stop_name: "",
                        stop_order: (formData.stops?.length || 0) + 1,
                      };
                      setFormData({
                        ...formData,
                        stops: [...(formData.stops || []), newStop],
                      });
                    }}
                    className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition"
                  >
                    + Add Stop
                  </button>
                </div>

                {formErrors.stops && (
                  <p className="text-red-500 text-xs mb-3">{formErrors.stops}</p>
                )}

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {formData.stops && formData.stops.length > 0 ? (
                    formData.stops.map((stop, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-gray-600 min-w-6">{idx + 1}.</div>
                        <input
                          type="text"
                          value={stop.stop_name}
                          onChange={(e) => {
                            const updatedStops = [...formData.stops];
                            updatedStops[idx].stop_name = e.target.value;
                            setFormData({ ...formData, stops: updatedStops });
                          }}
                          placeholder="Stop name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (idx > 0) {
                              const updatedStops = [...formData.stops];
                              [updatedStops[idx], updatedStops[idx - 1]] = [updatedStops[idx - 1], updatedStops[idx]];
                              updatedStops.forEach((s, i) => (s.stop_order = i + 1));
                              setFormData({ ...formData, stops: updatedStops });
                            }
                          }}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-green-600 disabled:opacity-50 transition text-sm font-semibold"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (idx < formData.stops.length - 1) {
                              const updatedStops = [...formData.stops];
                              [updatedStops[idx], updatedStops[idx + 1]] = [updatedStops[idx + 1], updatedStops[idx]];
                              updatedStops.forEach((s, i) => (s.stop_order = i + 1));
                              setFormData({ ...formData, stops: updatedStops });
                            }
                          }}
                          disabled={idx === formData.stops.length - 1}
                          className="text-gray-400 hover:text-green-600 disabled:opacity-50 transition text-sm font-semibold"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedStops = formData.stops.filter((_, i) => i !== idx);
                            updatedStops.forEach((s, i) => (s.stop_order = i + 1));
                            setFormData({ ...formData, stops: updatedStops });
                          }}
                          className="text-red-500 hover:text-red-700 transition text-sm font-semibold"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm py-2">No stops added yet</p>
                  )}
                </div>
                {formErrors.stops && (
                  <p className="text-red-500 text-xs mt-2">{formErrors.stops}</p>
                )}
              </div>

              {/* Status (only for edit) */}
              {editingId && (
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-semibold text-gray-700">Status</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      formData.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {formData.is_active ? "Active" : "Inactive"}
                  </button>
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition font-semibold disabled:opacity-50"
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
