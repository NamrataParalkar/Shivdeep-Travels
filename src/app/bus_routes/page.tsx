"use client";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { getActiveRoutes, RouteWithStops } from "@/lib/routes";

export default function BusRoutesPage() {
  const [routes, setRoutes] = useState<RouteWithStops[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadActiveRoutes();
  }, []);

  const loadActiveRoutes = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await getActiveRoutes();
      if (error) {
        console.error("Error loading routes:", error.message || error);
        setErrorMsg("Failed to load bus routes. Please try again later.");
      } else if (data) {
        setRoutes(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-lime-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-3">Bus Routes</h1>
          <p className="text-gray-600 text-lg">
            Explore all available bus routes and plan your journey.
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading bus routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="bg-white shadow-lg rounded-2xl p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Routes Available</h2>
            <p className="text-gray-600">
              There are currently no active bus routes. Please check back later.
            </p>
          </div>
        ) : (
          <>
            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-green-500"
                >
                  {/* Route ID & Name */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Route #{route.id}
                    </span>
                    <h3 className="text-lg font-bold text-green-700 mt-2">
                      {route.route_name}
                    </h3>
                  </div>

                  {/* Route Path */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Full Route Path:</p>
                    <p className="text-sm text-gray-800 leading-relaxed">
                      <span className="font-semibold text-green-700">{route.start_point}</span>
                      {route.stops && route.stops.length > 0 ? (
                        route.stops.map((stop) => (
                          <span key={stop.id}>
                            <span className="text-green-500 mx-1">→</span>
                            <span>{stop.stop_name}</span>
                          </span>
                        ))
                      ) : null}
                      {route.end_point && (
                        <>
                          <span className="text-green-500 mx-1">→</span>
                          <span className="font-semibold text-green-700">{route.end_point}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Route Stops Detailed */}
                  <div className="space-y-3">
                    {route.stops && route.stops.length > 0 ? (
                      route.stops.map((stop, idx) => (
                        <div key={stop.id || idx} className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-semibold text-gray-800">
                              {stop.stop_name}
                            </p>
                          </div>
                          {idx < route.stops.length - 1 && (
                            <div className="text-green-500 text-lg">
                              <ArrowRight size={20} />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-sm">No stops available</p>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      {(route.stops || []).length} {(route.stops || []).length === 1 ? "Stop" : "Stops"}
                    </span>
                    <span className="text-gray-500 text-xs ml-3">
                      {new Date(route.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Card */}
            <div className="bg-white shadow-lg rounded-2xl p-8 border-t-4 border-green-600">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {routes.length} {routes.length === 1 ? "Route" : "Routes"} Available
                </h2>
                <p className="text-gray-600">
                  All routes are currently active and operational. For more information about specific routes, please contact the administration.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm">
            Last updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
