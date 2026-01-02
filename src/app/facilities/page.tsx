"use client";
import Image from "next/image";

export default function FacilitiesPage() {
  const facilities = [
    {
      title: "GPS Bus Tracking",
      desc: "Real-time GPS tracking so parents and admin can monitor the exact location of the bus at any time.",
      img: "/images/gps.jpg",
    },
    {
      title: "CCTV Surveillance",
      desc: "High-definition CCTV cameras inside and outside the bus to ensure student safety and constant monitoring.",
      img: "/images/cctv.jpg",
    },
    {
      title: "Fire Safety System",
      desc: "Advanced smoke detectors and fire suppression systems to prevent and control fire hazards.",
      img: "/images/fire-safety.jpg",
    },
    {
      title: "Emergency Alarm",
      desc: "Instant emergency alarm button installed in the bus for quick alerts in case of emergencies.",
      img: "/images/emergency-alarm.jpg",
    },
    {
      title: "First Aid Kit",
      desc: "Fully stocked first aid kit with trained drivers/attendants to handle minor injuries or emergencies.",
      img: "/images/first-aid.jpg",
    },
    {
      title: "Comfortable Seating",
      desc: "Spacious, well-cushioned seating with proper ventilation and air-cooling for a pleasant journey.",
      img: "/images/Seats.jpg",
    },
  ];

  return (
    <div
      className="min-h-screen py-12 px-6
                 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50
                 dark:from-gray-900 dark:via-purple-900 dark:to-gray-800"
    >
      <h1 className="text-4xl md:text-5xl font-extrabold text-center text-purple-700 mb-4 drop-shadow-sm">
        Our Facilities
      </h1>
      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
        We prioritize student safety and comfort with world-class infrastructure
        and technology in every school bus.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {facilities.map((facility, idx) => (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md
                       hover:shadow-2xl transition-transform duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="relative w-full h-56">
              <Image
                src={facility.img}
                alt={facility.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-purple-700 mb-3">
                {facility.title}
              </h2>
              <p className="text-gray-600">{facility.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
