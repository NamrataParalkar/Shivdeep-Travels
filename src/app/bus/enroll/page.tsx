"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getActiveRoutes, RouteWithStops } from "@/lib/routes";
import { createEnrollment, createRouteRequest, getStudentEnrollments } from "@/lib/enrollments";
import { useRouter } from "next/navigation";

type Tab = "select-route" | "request-new";

export default function BusEnrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("select-route");
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  // Enrollment form
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);
  const [enrollError, setEnrollError] = useState("");

  // Route request form
  const [requestedStop, setRequestedStop] = useState("");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Get auth user
        let user = null;
        try {
          const maybe = await supabase.auth.getUser();
          user = maybe?.data?.user ?? null;
        } catch (err) {
          // Fallback - user not available
          user = null;
        }

        if (!user && typeof window !== "undefined") {
          const stored = localStorage.getItem("user");
          if (stored) {
            try {
              const obj = JSON.parse(stored);
              if (obj.authId || obj.id || obj.auth_id) {
                user = { id: obj.authId || obj.id || obj.auth_id, email: obj.email ?? null };
              }
            } catch (e) {
              // ignore
            }
          }
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setAuthUser(user);

        // Fetch student ID
        const { data: studentData } = await supabase
          .from("students")
          .select("id")
          .eq("auth_id", user.id)
          .single();

        if (studentData) {
          setStudentId(studentData.id);
        } else {
          setEnrollError("Student profile not found");
          return;
        }

        // Load active routes
        const { data: routesData } = await getActiveRoutes();
        if (routesData) {
          setRoutes(routesData as RouteWithStops[]);
        }
      } catch (err) {
        console.error(err);
        setEnrollError("Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedRouteId) {
      setEnrollError("Please select a route");
      return;
    }

    setEnrolling(true);
    setEnrollError("");
    try {
      // Prevent duplicate active enrollment (pending or approved)
      try {
        const { data: existing } = await getStudentEnrollments(studentId);
        if (existing && Array.isArray(existing) && existing.length > 0) {
          const active = existing.find((r: any) => r.status === 'pending' || r.status === 'approved');
          if (active) {
            setEnrollError(`You already have an active enrollment (${active.status}).`);
            setEnrolling(false);
            return;
          }
        }
      } catch (err) {
        // ignore and continue - creation will surface errors
      }

      const { data, error } = await createEnrollment({
        student_id: studentId,
        route_id: selectedRouteId,
        remarks: remarks || undefined,
      });

      if (error) {
        setEnrollError(error.message || "Failed to submit enrollment request");
      } else if (data) {
        setEnrollSuccess(true);
        setSelectedRouteId(null);
        setRemarks("");
        // Show confirmation message and wait for admin approval
        setEnrollError("");
      }
    } catch (err) {
      setEnrollError(String(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleRequestRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !requestedStop.trim()) {
      setRequestError("Please enter a stop name");
      return;
    }

    setRequesting(true);
    setRequestError("");
    try {
      const { data, error } = await createRouteRequest({
        student_id: studentId,
        requested_stop: requestedStop,
        area: area || undefined,
        description: description || undefined,
      });

      if (error) {
        setRequestError(error.message || "Failed to submit route request");
      } else if (data) {
        setRequestSuccess(true);
        setRequestedStop("");
        setArea("");
        setDescription("");
        setTimeout(() => {
          setRequestSuccess(false);
          router.push("/profile");
        }, 2000);
      }
    } catch (err) {
      setRequestError(String(err));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-full shadow-sm transition"
            title="Back to Profile"
          >
            <ArrowLeft size={20} /> Back
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Bus Enrollment</h1>
        </div>

        {/* Alerts */}
        {enrollSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 font-semibold">Your enrollment request has been sent to the admin. Please wait for approval.</p>
          </div>
        )}
        {enrollError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">{enrollError}</p>
          </div>
        )}
        {requestSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 font-semibold">Route request submitted successfully! Redirecting...</p>
          </div>
        )}
        {requestError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">{requestError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("select-route")}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === "select-route"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Select Existing Route
            </button>
            <button
              onClick={() => setActiveTab("request-new")}
              className={`pb-4 px-2 font-semibold transition ${
                activeTab === "request-new"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Request New Stop/Route
            </button>
          </div>
        </div>

        {/* Tab Content - Select Route */}
        {activeTab === "select-route" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Routes</h2>

            {routes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No active routes available at the moment.</p>
                <button
                  onClick={() => setActiveTab("request-new")}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Request a new route instead →
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnroll} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Select a Route
                  </label>

                  <div className="space-y-4 mb-6">
                    {routes.map((route) => {
                      const stopsList = route.stops
                        ?.map((s) => s.stop_name)
                        .join(" → ");
                      return (
                        <div
                          key={route.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                            selectedRouteId === route.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-gray-50 hover:border-blue-300"
                          }`}
                          onClick={() => setSelectedRouteId(route.id)}
                        >
                          <div className="flex items-start gap-4">
                            <input
                              type="radio"
                              name="route"
                              value={route.id}
                              checked={selectedRouteId === route.id}
                              onChange={() => setSelectedRouteId(route.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                Route {route.id} - {route.route_name}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {route.start_point} → {route.end_point}
                              </p>
                              {stopsList && (
                                <p className="text-xs text-gray-500 mt-2">
                                  <span className="font-semibold">Stops:</span> {stopsList}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Remarks (Optional)
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={4}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={enrolling || !selectedRouteId}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {enrolling ? "Submitting..." : "Submit Enrollment Request"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab Content - Request New Route */}
        {activeTab === "request-new" && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Request New Stop/Route</h2>
            <p className="text-gray-600 mb-6">
              If a suitable route doesn't exist, submit a request for a new stop or route.
            </p>

            <form onSubmit={handleRequestRoute} className="space-y-6">
              {/* Requested Stop */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Stop Name *
                </label>
                <input
                  type="text"
                  value={requestedStop}
                  onChange={(e) => setRequestedStop(e.target.value)}
                  placeholder="e.g., City Center Mall, Main Square"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Area/Locality */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., Downtown, North District"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more details about why this stop is needed, nearby landmarks, etc."
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={requesting || !requestedStop.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {requesting ? "Submitting..." : "Submit Route Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
