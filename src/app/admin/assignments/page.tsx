"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, X } from "lucide-react";
import {
  getActiveAssignments,
  assignStudentToBus,
  unassignStudent,
  reassignStudent,
  getAssignedStudentIds,
  canAssignToBus,
  AssignmentWithDetails,
} from "@/lib/assignments";
import { getEnrolledStudents, Student } from "@/lib/students";
import { getBuses, Bus } from "@/lib/buses";
import { getRoutes, Route } from "@/lib/routes";
export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [assignedStudentIds, setAssignedStudentIds] = useState<number[]>([]);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    bus_id: "",
    route_id: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignData, setReassignData] = useState({
    assignmentId: 0,
    new_bus_id: "",
    new_route_id: "",
  });
  const [reassignErrors, setReassignErrors] = useState<Record<string, string>>({});
  const [busCapacityInfo, setBusCapacityInfo] = useState<{
    [key: number]: { current: number; capacity: number };
  }>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: assignmentsData, error: assignmentsError } =
        await getActiveAssignments();
      if (assignmentsError) {
        setErrorMsg("Failed to load assignments");
      } else {
        setAssignments(assignmentsData || []);
      }

      const { data: studentsData } = await getEnrolledStudents();
      setStudents(studentsData || []);

      const { data: busesData } = await getBuses();
      setBuses(busesData || []);

      const { data: routesData } = await getRoutes();
      setRoutes(routesData || []);

      const { data: assignedIds } = await getAssignedStudentIds();
      setAssignedStudentIds(assignedIds || []);

      if (busesData) {
        const capacityMap: { [key: number]: { current: number; capacity: number } } = {};
        for (const bus of busesData) {
          const { currentCount, capacity } = await canAssignToBus(bus.id);
          capacityMap[bus.id] = {
            current: currentCount || 0,
            capacity: capacity || 0,
          };
        }
        setBusCapacityInfo(capacityMap);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const validateAssignForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.student_id) errors.student_id = "Student is required";
    if (!formData.bus_id) errors.bus_id = "Bus is required";
    if (!formData.route_id) errors.route_id = "Route is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateReassignForm = () => {
    const errors: Record<string, string> = {};
    if (!reassignData.new_bus_id)
      errors.new_bus_id = "Bus is required";
    if (!reassignData.new_route_id)
      errors.new_route_id = "Route is required";

    setReassignErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAssignModal = () => {
    setFormData({ student_id: "", bus_id: "", route_id: "" });
    setFormErrors({});
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setFormData({ student_id: "", bus_id: "", route_id: "" });
  };

  const openReassignModal = (assignment: AssignmentWithDetails) => {
    setReassignData({
      assignmentId: assignment.id,
      new_bus_id: assignment.bus_id.toString(),
      new_route_id: assignment.route_id.toString(),
    });
    setReassignErrors({});
    setShowReassignModal(true);
  };

  const closeReassignModal = () => {
    setShowReassignModal(false);
    setReassignData({ assignmentId: 0, new_bus_id: "", new_route_id: "" });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAssignForm()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await assignStudentToBus({
        student_id: parseInt(formData.student_id),
        bus_id: parseInt(formData.bus_id),
        route_id: parseInt(formData.route_id),
      });

      if (error) {
        setErrorMsg(error.message || "Failed to assign student");
      } else if (data) {
        setSuccessMsg("Student assigned successfully!");
        closeAssignModal();
        await loadInitialData();
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

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReassignForm()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { data, error } = await reassignStudent({
        assignmentId: reassignData.assignmentId,
        new_bus_id: parseInt(reassignData.new_bus_id),
        new_route_id: parseInt(reassignData.new_route_id),
      });

      if (error) {
        setErrorMsg(error.message || "Failed to reassign student");
      } else if (data) {
        setSuccessMsg("Student reassigned successfully!");
        closeReassignModal();
        await loadInitialData();
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

  const handleUnassign = async (assignmentId: number) => {
    if (
      !confirm(
        "Are you sure you want to unassign this student? This cannot be undone."
      )
    )
      return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await unassignStudent(assignmentId);
      if (error) {
        setErrorMsg(error.message || "Failed to unassign student");
      } else {
        setSuccessMsg("Student unassigned successfully!");
        await loadInitialData();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }

    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 3000);
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const student = assignment.student as any;
    const bus = assignment.bus as any;
    return (
      student?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      bus?.bus_number?.toString().includes(searchTerm)
    );
  });

  const availableStudents = students.filter(
    (s) => !assignedStudentIds.includes(s.id)
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-100 via-cyan-100 to-blue-100 p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Student Assignments
            </h1>
            <p className="text-sm text-slate-600">Manage student bus assignments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-slate-600 text-white rounded flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={openAssignModal}
              className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2"
            >
              <Plus size={16} /> Assign Student
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student or bus number..."
            className="w-full max-w-md p-2 border rounded bg-white"
          />
        </div>

        <div className="bg-white/70 rounded shadow p-4">
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : filteredAssignments.length === 0 ? (
            <p className="text-center text-slate-600 py-6">No assignments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Class</th>
                    <th className="px-4 py-2 text-left">Bus</th>
                    <th className="px-4 py-2 text-left">Route</th>
                    <th className="px-4 py-2 text-left">Assigned</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => (
                    <tr key={a.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-2">{(a.student as any)?.full_name || "N/A"}</td>
                      <td className="px-4 py-2">{(a.student as any)?.class || "N/A"}</td>
                      <td className="px-4 py-2">{(a.bus as any)?.bus_number || "N/A"}</td>
                      <td className="px-4 py-2">{(a.route as any)?.route_name || "N/A"}</td>
                      <td className="px-4 py-2">
                        {new Date(a.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openReassignModal(a)}
                            className="px-2 py-1 bg-amber-500 text-white text-xs rounded flex items-center gap-1"
                          >
                            <Edit2 size={14} /> Reassign
                          </button>
                          <button
                            onClick={() => handleUnassign(a.id)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Unassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Assign Student to Bus</h3>
                <button onClick={closeAssignModal} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAssign}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Select a student</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.student_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.student_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bus</label>
                  <select
                    value={formData.bus_id}
                    onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Select a bus</option>
                    {buses.map((b) => {
                      const cap = busCapacityInfo[b.id];
                      const isFull = cap && cap.current >= cap.capacity;
                      return (
                        <option key={b.id} value={b.id} disabled={isFull}>
                          {b.bus_number} — {cap?.current ?? 0}/{cap?.capacity ?? b.capacity}
                        </option>
                      );
                    })}
                  </select>
                  {formErrors.bus_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.bus_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                  <select
                    value={formData.route_id}
                    onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Select a route</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.route_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.route_id}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={closeAssignModal}
                    className="px-4 py-2 border rounded text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Assigning..." : "Assign Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reassign Modal */}
        {showReassignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Reassign Student</h3>
                <button onClick={closeReassignModal} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleReassign}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bus</label>
                  <select
                    value={reassignData.new_bus_id}
                    onChange={(e) =>
                      setReassignData({ ...reassignData, new_bus_id: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Select a bus</option>
                    {buses.map((b) => {
                      const cap = busCapacityInfo[b.id];
                      const isFull = cap && cap.current >= cap.capacity;
                      return (
                        <option key={b.id} value={b.id} disabled={isFull}>
                          {b.bus_number} — {cap?.current ?? 0}/{cap?.capacity ?? b.capacity}
                        </option>
                      );
                    })}
                  </select>
                  {reassignErrors.new_bus_id && (
                    <p className="text-xs text-red-600 mt-1">{reassignErrors.new_bus_id}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Route</label>
                  <select
                    value={reassignData.new_route_id}
                    onChange={(e) =>
                      setReassignData({ ...reassignData, new_route_id: e.target.value })
                    }
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="">Select a route</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name}
                      </option>
                    ))}
                  </select>
                  {reassignErrors.new_route_id && (
                    <p className="text-xs text-red-600 mt-1">{reassignErrors.new_route_id}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={closeReassignModal}
                    className="px-4 py-2 border rounded text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Reassigning..." : "Reassign Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications */}
        {successMsg && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="fixed bottom-6 right-6 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
