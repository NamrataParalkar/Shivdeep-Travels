# Quick Reference Guide - Admin Dashboard

## File Locations

### Pages
| Module | Path | Color |
|--------|------|-------|
| Dashboard | `/admin/page.tsx` | N/A |
| Manage Students | `/admin/students/page.tsx` | Purple |
| Manage Drivers | `/admin/drivers/page.tsx` | Pink |
| Manage Buses | `/admin/buses/page.tsx` | Yellow |
| Manage Routes | `/admin/routes/page.tsx` | Green |
| Assign Bus to Students | `/admin/assignments/page.tsx` | Orange |
| View Payments | `/admin/payments/page.tsx` | Rose |
| Send Notifications | `/admin/notifications/page.tsx` | Rose/Red |
| View Complaints | `/admin/feedback/page.tsx` | Violet |
| Reports & Analytics | `/admin/reports/page.tsx` | Indigo |
| Admin Settings | `/admin/settings/page.tsx` | Slate |

### Components
| Component | Path | Purpose |
|-----------|------|---------|
| AdminLayout | `/components/admin/AdminLayout.tsx` | Page wrapper with decorative elements |
| AdminPageHeader | `/components/admin/AdminPageHeader.tsx` | Consistent header with back button |
| AdminStatCard | `/components/admin/AdminStatCard.tsx` | Statistics display card |
| AdminTable | `/components/admin/AdminTable.tsx` | Unified table component |
| EmptyState | `/components/admin/EmptyState.tsx` | Empty state message |

## Color Mapping

```typescript
// Use these color strings in components
type ColorType = 'purple' | 'pink' | 'yellow' | 'green' | 'orange' | 'rose' | 'violet' | 'indigo' | 'slate'

// Color assignments by module
const moduleColors = {
  students: 'purple',
  drivers: 'pink',
  buses: 'yellow',
  routes: 'green',
  assignments: 'orange',
  payments: 'rose',
  notifications: 'rose',
  feedback: 'violet',
  reports: 'indigo',
  settings: 'slate'
}
```

## Common Code Patterns

### Auth Check (in all pages)
```tsx
useEffect(() => {
  const userData = localStorage.getItem("user");
  if (userData) {
    const parsed = JSON.parse(userData);
    if (parsed.role === "admin") setAdminName(parsed.full_name);
    else router.push("/login");
  } else router.push("/login");
}, []);
```

### Back Button
```tsx
<button
  onClick={() => router.back()}
  className="flex items-center gap-2 bg-white/70 hover:bg-purple-100 text-purple-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
>
  <ArrowLeft size={20} />
</button>
```

### Search Input
```tsx
<div className="flex-1 relative">
  <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
  <input
    type="text"
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-purple-200 bg-white/80 focus:outline-none focus:border-purple-400"
  />
</div>
```

### Action Button
```tsx
<button
  onClick={() => router.push("/admin/students/add")}
  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-full shadow-md transition"
>
  <Plus size={20} /> Add Student
</button>
```

## Supabase Integration Template

### Fetch Data
```tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*');
      
      if (error) throw error;
      setStudents(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Create Record
```tsx
const handleAdd = async (newData) => {
  const { data, error } = await supabase
    .from('students')
    .insert([newData]);
  
  if (error) {
    console.error('Error:', error);
  } else {
    setStudents([...students, data[0]]);
  }
};
```

### Update Record
```tsx
const handleEdit = async (id, updatedData) => {
  const { data, error } = await supabase
    .from('students')
    .update(updatedData)
    .eq('id', id);
  
  if (error) {
    console.error('Error:', error);
  } else {
    setStudents(students.map(s => s.id === id ? updatedData : s));
  }
};
```

### Delete Record
```tsx
const handleDelete = async (id) => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error:', error);
  } else {
    setStudents(students.filter(s => s.id !== id));
  }
};
```

## Creating New Module Pages

### Step 1: Create Directory
```bash
mkdir src/app/admin/newmodule
```

### Step 2: Create page.tsx
```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";

export default function NewModule() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === "admin") setAdminName(parsed.full_name);
      else router.push("/login");
    } else router.push("/login");

    // TODO: Fetch data from Supabase
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-10">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[COLOR]-300 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[COLOR]-300 rounded-full blur-3xl opacity-30"></div>

      {/* Header */}
      <header className="relative z-10 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/70 hover:bg-[COLOR]-100 text-[COLOR]-700 px-4 py-2 rounded-full shadow-sm transition backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-[COLOR]-600 via-[COLOR]-500 to-[COLOR]-400 bg-clip-text text-transparent">
            Module Title
          </h1>
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-[COLOR]-200 bg-white/80 focus:outline-none focus:border-[COLOR]-400"
            />
          </div>
          <button
            onClick={() => router.push("/admin/module/add")}
            className="flex items-center gap-2 bg-gradient-to-r from-[COLOR]-500 to-[COLOR]-600 hover:from-[COLOR]-600 hover:to-[COLOR]-700 text-white px-6 py-2 rounded-full shadow-md transition"
          >
            <Plus size={20} /> Add New
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">No data found.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            {/* Table or content here */}
          </div>
        )}
      </div>
    </div>
  );
}
```

Replace:
- `[COLOR]` with actual color (purple, pink, yellow, etc.)
- `Module Title` with actual title
- `/admin/module/add` with correct path
- Add table or content as needed

## Common Icons (lucide-react)

```tsx
import {
  Users,           // Students, Drivers
  Bus,             // Buses
  Map,             // Routes
  Route,           // Assignments
  CreditCard,      // Payments
  Bell,            // Notifications
  MessageCircle,   // Feedback
  BarChart3,       // Reports
  Cog,             // Settings
  Plus,            // Add button
  Edit2,           // Edit button
  Trash2,          // Delete button
  Search,          // Search
  ArrowLeft,       // Back button
  LogOut,          // Logout
  UserCircle,      // Profile
  CheckCircle,     // Completed
  Eye,             // View
  Send,            // Send
  Lock,            // Password/Security
} from "lucide-react";
```

## Tailwind Color Classes

Use these for gradients and styling:

```tsx
// Backgrounds
bg-purple-50, bg-purple-100, bg-purple-400, bg-purple-500, bg-purple-600
bg-pink-50, bg-pink-100, bg-pink-400, bg-pink-500, bg-pink-600
bg-yellow-50, bg-yellow-100, bg-yellow-400, bg-yellow-500, bg-yellow-600
bg-green-50, bg-green-100, bg-green-400, bg-green-500, bg-green-600
bg-orange-50, bg-orange-100, bg-orange-400, bg-orange-500, bg-orange-600
bg-rose-50, bg-rose-100, bg-rose-400, bg-rose-500, bg-rose-600
bg-violet-50, bg-violet-100, bg-violet-400, bg-violet-500, bg-violet-600
bg-indigo-50, bg-indigo-100, bg-indigo-400, bg-indigo-500, bg-indigo-600
bg-slate-50, bg-slate-100, bg-slate-400, bg-slate-500, bg-slate-600

// Text
text-purple-600, text-purple-700
text-pink-600, text-pink-700
// ... and so on

// Borders
border-purple-200, border-purple-400
// ... and so on

// Hover states
hover:bg-purple-100, hover:from-purple-600, hover:to-purple-700
// ... and so on
```

## Testing the Dashboard

1. **Local Development:**
   ```bash
   npm run dev
   # Navigate to http://localhost:3000/admin
   ```

2. **Check Authentication:**
   - Ensure you're logged in as admin
   - Try accessing without auth (should redirect to login)

3. **Test Navigation:**
   - Click each module card
   - Use back button
   - Check routing works

4. **Verify Styling:**
   - Check colors match design
   - Verify responsive layout
   - Test hover effects

5. **Console Check:**
   - No TypeScript errors
   - No console warnings
   - Check auth logic

## Performance Tips

- Use React.memo for list items
- Implement pagination for large datasets
- Add loading skeletons instead of spinners
- Use virtualization for long lists
- Debounce search input
- Cache frequently accessed data

## Deployment Checklist

- [ ] All pages render without errors
- [ ] Authentication works correctly
- [ ] All links navigate properly
- [ ] Styling is consistent
- [ ] Responsive design tested
- [ ] No console errors/warnings
- [ ] Environment variables set
- [ ] Supabase tables verified
- [ ] CRUD operations tested
- [ ] Performance optimized

---

**Last Updated:** December 2024
**Version:** 1.0 - Initial Implementation
