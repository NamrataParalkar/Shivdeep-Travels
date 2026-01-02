"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Edit2, Trash2, X, Check, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  getStudents,
  createStudent,
  updateStudent,
  enrollStudent,
  suspendStudent,
  deleteStudent,
  Student,
} from "@/lib/students";
import { getEnrollments, approveEnrollment, rejectEnrollment } from "@/lib/enrollments";

type ActiveTab = "manage" | "enrollments";

export default function ManageStudentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("manage");
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authId, setAuthId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "enrolled" | "not_enrolled" | "suspended"
  >("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Enrollment approval
  const [approvingEnrollmentId, setApprovingEnrollmentId] = useState<number | null>(null);
  const [rejectingEnrollmentId, setRejectingEnrollmentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    class: "",
    school_name: "",
    age: "",
    gender: "",
    phone: "",
    parent_phone: "",
    email: "",
    enrollment_status: "enrolled" as "not_enrolled" | "enrolled" | "suspended",
  });

  useEffect(() => {
    // Get current admin's auth ID
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user?.id) {
          setAuthId(data.user.id);
        }
      } catch (err) {
        console.error("Failed to get auth user:", err);
      }
    })();

    loadStudents();
    loadEnrollments();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await getStudents();
      if (error) {
        console.error("Error loading students:", error);
        setErrorMsg("Failed to load students");
      } else if (data) {
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      const { data, error } = await getEnrollments("pending");
      if (error) {
        try {
          console.error("Error loading enrollments:", JSON.stringify(error));
        } catch (e) {
          console.error("Error loading enrollments:", error);
        }
        setErrorMsg(error.message || (error.raw ? JSON.stringify(error.raw) : JSON.stringify(error)));
      } else if (data) {
        setEnrollments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.full_name || !formData.full_name.trim()) errors.full_name = "Full name is required";
    if (!formData.class || !formData.class.trim()) errors.class = "Class is required";
    if (!formData.school_name || !formData.school_name.trim()) errors.school_name = "School name is required";
    if (!formData.age || formData.age === "") errors.age = "Age is required";
    if (!formData.gender) errors.gender = "Gender is required";
    if (!formData.parent_phone || !formData.parent_phone.trim())
      errors.parent_phone = "Parent phone is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      full_name: "",
      class: "",
      school_name: "",
      age: "",
      gender: "",
      phone: "",
      parent_phone: "",
      email: "",
      enrollment_status: "enrolled",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditingId(student.id);
    setFormData({
      full_name: student.full_name || "",
      class: student.class || "",
      school_name: student.school_name || "",
      age: student.age ? student.age.toString() : "",
      gender: student.gender || "",
      phone: student.phone || "",
      parent_phone: student.parent_phone || "",
      email: student.email || "",
      enrollment_status: student.enrollment_status || "enrolled",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      full_name: "",
      class: "",
      school_name: "",
      age: "",
      gender: "",
      phone: "",
      parent_phone: "",
      email: "",
      enrollment_status: "enrolled",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (editingId) {
        const { data, error } = await updateStudent(editingId, {
          full_name: formData.full_name,
          class: formData.class,
          school_name: formData.school_name,
          age: parseInt(formData.age),
          gender: formData.gender as "Male" | "Female" | "Other",
          phone: formData.phone || undefined,
          parent_phone: formData.parent_phone,
          email: formData.email || undefined,
          enrollment_status: formData.enrollment_status,
        });
        if (error) {
          setErrorMsg(error.message || "Failed to update student");
        } else if (data) {
          setSuccessMsg("Student updated successfully!");
          closeModal();
          await loadStudents();
        }
      } else {
        const { data, error } = await createStudent({
          full_name: formData.full_name,
          class: formData.class,
          school_name: formData.school_name,
          age: parseInt(formData.age),
          gender: formData.gender as "Male" | "Female" | "Other",
          phone: formData.phone || undefined,
          parent_phone: formData.parent_phone,
          email: formData.email || undefined,
          enrollment_status: formData.enrollment_status,
        });
        if (error) {
          setErrorMsg(error.message || "Failed to create student");
        } else if (data) {
          setSuccessMsg("Student added successfully!");
          closeModal();
          await loadStudents();
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

  const handleEnroll = async (id: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await enrollStudent(id);
      if (error) {
        setErrorMsg(error.message || "Failed to enroll student");
      } else {
        setSuccessMsg("Student enrolled successfully!");
        await loadStudents();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const handleSuspend = async (id: number) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { error } = await suspendStudent(id);
      if (error) {
        setErrorMsg(error.message || "Failed to suspend student");
      } else {
        setSuccessMsg("Student suspended successfully!");
        await loadStudents();
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
    if (!confirm("Are you sure you want to delete this student?")) return;

    setErrorMsg("");
    setSuccessMsg("");
    try {
      const { success, error } = await deleteStudent(id);
      if (error) {
        setErrorMsg(error.message || "Failed to delete student");
      } else if (success) {
        setSuccessMsg("Student deleted successfully!");
        await loadStudents();
      }
    } catch (err) {
      setErrorMsg(String(err));
    }
    setTimeout(() => {
      setSuccessMsg("");
      setErrorMsg("");
    }, 2000);
  };

  const handleApproveEnrollment = async (enrollmentId: number) => {
    setApprovingEnrollmentId(enrollmentId);
    try {
      const { error } = await approveEnrollment(enrollmentId, authId || undefined);
      if (error) {
        setErrorMsg(error.message || "Failed to approve enrollment");
      } else {
        setSuccessMsg("Enrollment approved!");
        await loadEnrollments();
        await loadStudents();
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setApprovingEnrollmentId(null);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 2000);
    }
  };

  const handleRejectEnrollment = async (enrollmentId: number) => {
    setRejectingEnrollmentId(enrollmentId);
    try {
      const { error } = await rejectEnrollment(enrollmentId, authId || undefined);
      if (error) {
        setErrorMsg(error.message || "Failed to reject enrollment");
      } else {
        setSuccessMsg("Enrollment rejected!");
        await loadEnrollments();
      }
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setRejectingEnrollmentId(null);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 2000);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parent_phone.includes(searchTerm);

    const matchesStatus =
      filterStatus === "all" || student.enrollment_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
            Enrolled
          </span>
        );
      case "not_enrolled":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
            Not Enrolled
          </span>
        );
      case "suspended":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
            Suspended
          </span>
        );
      default:
        return null;
    }
  };
  return (
    <div
      className="min-h-screen relative overflow-hidden 
      bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 
      p-10"
    >
      {/* Decorative glowing circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 rounded-full blur-3xl opacity-30"></div>

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
            className="flex items-center gap-2 bg-white/70 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Manage Students
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-blue-200">
          <button
            onClick={() => setActiveTab("manage")}
            className={`pb-3 px-2 font-semibold transition ${
              activeTab === "manage"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Students List
          </button>
          <button
            onClick={() => setActiveTab("enrollments")}
            className={`pb-3 px-2 font-semibold transition relative ${
              activeTab === "enrollments"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Bus Enrollments
            {enrollments.filter((e) => e.status === "pending").length > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {enrollments.filter((e) => e.status === "pending").length}
              </span>
            )}
          </button>
        </div>

        {/* Controls - only show for manage tab */}
        {activeTab === "manage" && (
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-64">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-blue-200 bg-white/80 focus:outline-none focus:border-blue-400"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
              {(
                [
                  { label: "All", value: "all" },
                  { label: "Enrolled", value: "enrolled" },
                  { label: "Not Enrolled", value: "not_enrolled" },
                  { label: "Suspended", value: "suspended" },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-2 rounded-full font-semibold transition ${
                    filterStatus === filter.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white/60 text-gray-700 hover:bg-white/80"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-2 rounded-full shadow-md transition"
            >
              <Plus size={20} /> Add Student
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="relative z-10">
        {/* MANAGE TAB */}
        {activeTab === "manage" && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-600 mb-4">
                  {searchTerm
                    ? "No students match your search."
                    : "No students found."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={openCreate}
                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition"
              >
                <Plus size={20} /> Add First Student
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-100 to-cyan-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      School Name
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Age
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Parent Phone
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-t border-gray-200 hover:bg-blue-50 transition"
                    >
                      <td className="px-6 py-4 text-gray-700 font-semibold">
                        {student.full_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.class}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.school_name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.age}</td>
                      <td className="px-6 py-4 text-gray-600">{student.gender}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {student.parent_phone}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(student.enrollment_status)}
                      </td>
                      <td className="px-6 py-4 flex gap-3">
                        {student.enrollment_status === "not_enrolled" && (
                          <button
                            onClick={() => handleEnroll(student.id)}
                            className="text-green-500 hover:text-green-700 transition text-sm font-semibold"
                            title="Enroll"
                          >
                            Enroll
                          </button>
                        )}
                        {student.enrollment_status === "enrolled" && (
                          <button
                            onClick={() => handleSuspend(student.id)}
                            className="text-red-500 hover:text-red-700 transition text-sm font-semibold"
                            title="Suspend"
                          >
                            Suspend
                          </button>
                        )}
                        {student.enrollment_status === "suspended" && (
                          <button
                            onClick={() => handleEnroll(student.id)}
                            className="text-green-500 hover:text-green-700 transition text-sm font-semibold"
                            title="Re-enroll"
                          >
                            Re-enroll
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(student)}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
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

        {/* ENROLLMENTS TAB */}
        {activeTab === "enrollments" && (
          <>
            {enrollments.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-600">No pending bus enrollment requests.</p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-100 to-cyan-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Student Name
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Class
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Phone
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Route
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Remarks
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-gray-800 font-semibold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="border-t border-gray-200 hover:bg-blue-50 transition"
                        >
                          <td className="px-6 py-4 text-gray-700 font-semibold">
                            {enrollment.students?.full_name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {enrollment.students?.student_class || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {enrollment.students?.phone || enrollment.students?.parent_phone || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="text-sm font-semibold">
                              {enrollment.routes?.route_name || "Unknown"} (ID: {enrollment.route_id})
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {enrollment.remarks ? enrollment.remarks.substring(0, 50) + "..." : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                enrollment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : enrollment.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            {enrollment.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApproveEnrollment(enrollment.id)}
                                  disabled={approvingEnrollmentId === enrollment.id}
                                  className="text-green-600 hover:text-green-800 transition disabled:opacity-50 flex items-center gap-1"
                                  title="Approve"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => handleRejectEnrollment(enrollment.id)}
                                  disabled={rejectingEnrollmentId === enrollment.id}
                                  className="text-red-600 hover:text-red-800 transition disabled:opacity-50 flex items-center gap-1"
                                  title="Reject"
                                >
                                  <XCircle size={18} />
                                </button>
                              </>
                            )}
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
              <h2 className="text-2xl font-bold text-gray-800">
                {editingId ? "Edit Student" : "Add Student"}
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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="e.g., John Doe"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formErrors.full_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Class *
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  placeholder="e.g., 10-A"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formErrors.class && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.class}</p>
                )}
              </div>

              {/* School Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  School Name *
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) =>
                    setFormData({ ...formData, school_name: e.target.value })
                  }
                  placeholder="e.g., Central School"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formErrors.school_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.school_name}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                  placeholder="e.g., 14"
                  min="3"
                  max="25"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formErrors.age && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.gender && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>
                )}
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Phone *
                </label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_phone: e.target.value })
                  }
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formErrors.parent_phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {formErrors.parent_phone}
                  </p>
                )}
              </div>

              {/* Student Phone (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student Phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="e.g., 9876543210"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="e.g., john@example.com"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Enrollment Status (only for edit) */}
              {editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enrollment Status
                  </label>
                  <select
                    value={formData.enrollment_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enrollment_status: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="not_enrolled">Not Enrolled</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="suspended">Suspended</option>
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
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition font-semibold disabled:opacity-50"
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
