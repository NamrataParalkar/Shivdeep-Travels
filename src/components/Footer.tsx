"use client";

export default function Footer() {
  return (
    <footer className="mt-12 bg-white border-t py-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-xl font-bold text-purple-700">Shivdeep Travels</div>
          <div className="text-sm text-gray-600 mt-2">Trusted School Bus Partner — Safe & timely school transport.</div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800">Quick Links</h4>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li><a href="#dashboard">Dashboard</a></li>
            <li><a href="#track">Track Bus</a></li>
            <li><a href="#contact">Contact Info</a></li>
            <li><a href="#bookings">Other Bookings</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800">Contact</h4>
          <p className="text-sm text-gray-600 mt-2">Phone: +91-XXXXXXXXXX</p>
          <p className="text-sm text-gray-600">Email: contact@shivdeeptravels.com</p>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500 mt-6">
        © {new Date().getFullYear()} Shivdeep Travels. All rights reserved.
      </div>
    </footer>
  );
}
