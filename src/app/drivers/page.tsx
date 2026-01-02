"use client";
import { useEffect, useState } from "react";
import { Users, Phone, Mail, Award } from "lucide-react";
import { getDrivers, Driver } from "@/lib/drivers";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      console.log("Fetching drivers...");
      const { data, error } = await getDrivers();
      console.log("Drivers response:", { data, error });
      if (error) {
        console.error("Error loading drivers:", error);
        setErrorMsg(`Failed to load drivers: ${error.message || JSON.stringify(error)}`);
      } else if (data) {
        console.log(`Successfully loaded ${data.length} drivers`);
        setDrivers(data);
      } else {
        console.warn("No data returned from getDrivers");
        setErrorMsg("No driver data returned");
      }
    } catch (err) {
      console.error("Unexpected error loading drivers:", err);
      setErrorMsg(`An unexpected error occurred: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-3">Driver Details</h1>
          <p className="text-gray-600 text-lg">
            Meet our experienced and trusted drivers who ensure your safety.
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 mt-4">Loading drivers...</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="bg-white shadow-lg rounded-2xl p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Drivers Available</h2>
            <p className="text-gray-600">
              There are currently no drivers. Please check back later.
            </p>
          </div>
        ) : (
          <>
            {/* Drivers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-blue-500"
                >
                  {/* Driver Badge & Name */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Driver #{driver.id}
                    </span>
                    <h3 className="text-xl font-bold text-blue-700 mt-3">
                      {driver.full_name}
                    </h3>
                  </div>

                  {/* Driver Details Card */}
                  <div className="space-y-3 mb-4">
                    {/* Gender & Age */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Gender & Age</p>
                      <p className="text-sm font-medium text-gray-800">
                        {driver.gender} · {driver.age} years old
                      </p>
                    </div>

                    {/* Experience */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="h-4 w-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-700">Experience</p>
                      </div>
                      <p className="text-sm font-bold text-blue-800">
                        {driver.experience} years
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-green-600" />
                        <p className="text-xs font-semibold text-green-700">Phone</p>
                      </div>
                      <p className="text-sm font-medium text-green-800">
                        {driver.phone}
                      </p>
                    </div>

                    {/* Email */}
                    {driver.email && (
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-purple-600" />
                          <p className="text-xs font-semibold text-purple-700">Email</p>
                        </div>
                        <p className="text-sm font-medium text-purple-800 break-all">
                          {driver.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trust Badge */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-orange-200 text-center">
                    <p className="text-xs text-orange-700 font-semibold">
                      ✓ Verified & Trusted Driver
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 text-center">
              <p className="text-lg font-semibold">
                Total Drivers: <span className="text-2xl font-bold">{drivers.length}</span>
              </p>
              <p className="text-blue-100 mt-2">
                Our dedicated team is committed to your safety and comfort.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
