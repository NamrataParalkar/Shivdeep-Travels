"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "../../lib/registerUser";

const emptyStudent = {
  fullName: "",
  studentClass: "",
  schoolName: "",
  age: "",
  gender: "",
  parentPhone: "",
  email: "",
  password: "",
};

const emptyDriver = {
  fullName: "",
  age: "",
  gender: "",
  experience: "",
  phone: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const [role, setRole] = useState<"student" | "driver">("student");
  const [formData, setFormData] = useState<any>(emptyStudent);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const name = target.name;
    const type = target.type;
    const rawValue = target.value;

    const value =
      type === "number"
        ? rawValue === ""
          ? ""
          : Number(rawValue)
        : rawValue;

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: any = {};

    // Full Name (common) → alphabets & spaces only
    if (!formData.fullName) {
      newErrors.fullName = "Full Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(String(formData.fullName))) {
      newErrors.fullName = "Full Name must contain only letters and spaces";
    }

    if (role === "student") {
      if (!formData.studentClass) newErrors.studentClass = "Class is required";

      if (!formData.schoolName) {
        newErrors.schoolName = "School Name is required";
      } else if (!/^[A-Za-z\s]+$/.test(String(formData.schoolName))) {
        newErrors.schoolName = "School Name must contain only letters and spaces";
      }

      if (
        formData.age === "" ||
        formData.age === null ||
        isNaN(formData.age) ||
        formData.age < 3 ||
        formData.age > 25
      )
        newErrors.age = "Age must be 3–25";

      if (!formData.gender) newErrors.gender = "Select gender";

      if (
        !formData.parentPhone ||
        !/^[1-9][0-9]{9}$/.test(String(formData.parentPhone))
      )
        newErrors.parentPhone = "Enter valid 10-digit Indian mobile number";
    }

    if (role === "driver") {
      if (
        formData.age === "" ||
        formData.age === null ||
        isNaN(formData.age) ||
        formData.age < 18 ||
        formData.age > 65
      )
        newErrors.age = "Age must be 18–65";

      if (!formData.gender) newErrors.gender = "Select gender";

      if (
        formData.experience === "" ||
        formData.experience === null ||
        isNaN(formData.experience) ||
        Number(formData.experience) < 1
      )
        newErrors.experience = "Experience required";

      if (!formData.phone || !/^[1-9][0-9]{9}$/.test(String(formData.phone))) {
        newErrors.phone = "Enter valid 10-digit Indian mobile number";
      }
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.email))) {
      newErrors.email = "Enter valid email";
    }

    if (!formData.password) newErrors.password = "Password is required";
    else if (String(formData.password).length < 6 || String(formData.password).length > 15)
      newErrors.password = "Password must be 6–15 characters long";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const { data, error } = await registerUser(role, formData);
    if (error) {
      const message = (error as any)?.message || JSON.stringify(error);
      alert("❌ Registration failed: " + message);
      console.error("Register error:", error);
    } else {
      alert("✅ Registration successful!");
      setErrors({});
      setFormData(role === "student" ? emptyStudent : emptyDriver);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-white to-fuchsia-200">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-slate-800">Register</h2>
        <p className="text-slate-500 text-center mt-2">Create your account</p>

        {/* Role Selection */}
        <div className="mt-6 flex justify-center gap-3">
          {["student"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r as "student");
                setErrors({});
                setFormData(emptyStudent);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition
                ${role === r
                  ? "bg-fuchsia-600 text-white border-fuchsia-600"
                  : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"}`}
            >
              {r === "student" ? "Student/Parent" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {/* Common */}
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName || ""}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
          />
          {errors.fullName && <p className="text-rose-600 text-sm">{errors.fullName}</p>}

          {/* Student */}
          {role === "student" && (
            <>
              <select
                name="studentClass"
                value={formData.studentClass || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900
                          focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              >
                <option value="">-- Select Class --</option>
                <option value="Playgroup">Playgroup</option>
                <option value="Nursery">Nursery</option>
                <option value="LKG">LKG</option>
                <option value="UKG">UKG</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const num = i + 1;
                  let suffix = "th";
                  if (num === 1) suffix = "st";
                  else if (num === 2) suffix = "nd";
                  else if (num === 3) suffix = "rd";
                  return <option key={num} value={`${num}${suffix}`}>{`${num}${suffix}`}</option>;
                })}
                <option value="Other">Other</option>
              </select>
              {errors.studentClass && <p className="text-rose-600 text-sm">{errors.studentClass}</p>}

              <input
                type="text"
                name="schoolName"
                placeholder="School Name"
                value={formData.schoolName || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
              {errors.schoolName && <p className="text-rose-600 text-sm">{errors.schoolName}</p>}

              <input
                type="number"
                name="age"
                placeholder="Age"
                value={formData.age || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
              {errors.age && <p className="text-rose-600 text-sm">{errors.age}</p>}

              <select
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-rose-600 text-sm">{errors.gender}</p>}

              <input
                type="tel"
                name="parentPhone"
                placeholder="Parent Phone Number"
                value={formData.parentPhone || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
              {errors.parentPhone && <p className="text-rose-600 text-sm">{errors.parentPhone}</p>}

              <input
                type="email"
                name="email"
                placeholder="Email (optional)"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
              />
              {errors.email && <p className="text-rose-600 text-sm">{errors.email}</p>}
            </>
          )}

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Create Password"
              value={formData.password || ""}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && <p className="text-rose-600 text-sm">{errors.password}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white font-bold bg-gradient-to-r from-[#7c3aed] to-[#ec4899]
                       hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
          >
            Register as {role === "student" ? "Student/Parent" : role}
          </button>
        </form>

        <p className="text-center text-slate-600 mt-4">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-fuchsia-700 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
