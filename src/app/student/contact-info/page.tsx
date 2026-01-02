"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { getAllContacts, ContactInfo } from "@/lib/contactInfo";

export default function StudentContactInfoPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "student" || parsed.role === "parent") {
        setStudentName(parsed.full_name || parsed.name || "Student");
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
        setErrorMsg("Failed to load contact information. Please try again.");
      } else if (data) {
        setContacts(data);
      }
    } catch (err) {
      console.error("Unexpected error loading contacts:", String(err));
      setErrorMsg("Unexpected error loading contacts. Please refresh.");
    } finally {
      setLoading(false);
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
                Contact Information
              </h1>
              <p className="text-sm text-slate-500">Get in touch with us</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">Welcome, {studentName}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-spin mx-auto"></div>
              <p className="text-slate-600">Loading contact information...</p>
            </div>
          </div>
        ) : contacts.length === 0 ? (
          /* Empty State */
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-slate-600 font-medium">No contact information available</p>
              <p className="text-sm text-slate-500 mt-1">Check back soon!</p>
            </div>
          </div>
        ) : (
          /* Contacts Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-yellow-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-yellow-500/5 transition-all duration-300"></div>

                <div className="relative p-6">
                  {/* Name */}
                  <h3 className="text-lg font-bold text-slate-800 mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
                    {contact.name}
                  </h3>

                  {/* Contact Details */}
                  <div className="space-y-3">
                    {/* Phone */}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-purple-50 transition-colors duration-200 group/phone"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Phone</p>
                          <p className="text-sm font-semibold text-slate-800 group-hover/phone:text-purple-600 transition-colors duration-200">
                            {contact.phone}
                          </p>
                        </div>
                      </a>
                    )}

                    {/* Email */}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-pink-50 transition-colors duration-200 group/email"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 mb-1">Email</p>
                          <p className="text-sm font-semibold text-slate-800 group-hover/email:text-pink-600 transition-colors duration-200 truncate">
                            {contact.email}
                          </p>
                        </div>
                      </a>
                    )}

                    {/* No contact info fallback */}
                    {!contact.phone && !contact.email && (
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-sm text-slate-500 italic">No contact details available</p>
                      </div>
                    )}
                  </div>

                  {/* Border accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
