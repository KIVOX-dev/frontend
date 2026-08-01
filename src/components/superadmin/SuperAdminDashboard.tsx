import React, { useEffect, useState } from "react";
import { api, type ApiRequestConfig } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  status: string;
  institution_id?: string | null;
  department?: string | null;
  preferences?: { plan?: "base" | "pro" } | null;
};

// The dashboard's role dropdowns use the friendlier labels the rest of the
// app already uses ("College Admin", "Recruiter"); the Node API's actual
// role enum is student|faculty|hr|institution_admin|super_admin. Map at the
// API boundary rather than renaming the dropdown values everywhere.
const ROLE_API_VALUE: Record<string, string> = {
  student: "student",
  faculty: "faculty",
  recruiter: "hr",
  college_admin: "institution_admin",
  super_admin: "super_admin",
};

const ROLE_DISPLAY_LABEL: Record<string, string> = {
  institution_admin: "College Admin",
  hr: "Recruiter",
  faculty: "Faculty",
  student: "Student",
  super_admin: "Super Admin",
};

function roleLabel(role: string): string {
  return ROLE_DISPLAY_LABEL[role] || role.replace("_", " ");
}

type Institution = {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  location?: string | null;
  website?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  is_active: boolean;
  created_at: string;
};

const EMPTY_INSTITUTION_FORM = {
  name: "",
  code: "",
  location: "",
  contact_email: "",
  contact_phone: "",
  website: "",
};

type Student = {
  id: string;
  user_id: string;
  roll_number?: string | null;
};

export function SuperAdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "assessments" | "institutions">("pending");
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [sortBy, setSortBy] = useState<"name" | "role" | "status" | "date">("date");

  // Filters — college/role always apply; department only makes sense once
  // narrowed to students, so it's hidden until the role filter is "student".
  const [filterCollege, setFilterCollege] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "", status: "", plan: "base", college_id: "" });

  // Create Modal State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: "", email: "", role: "student", password: "", college_id: "" });
  const [colleges, setColleges] = useState<{id: string, name: string}[]>([]);

  // Institutions tab state
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [isCreatingInstitution, setIsCreatingInstitution] = useState(false);
  const [institutionForm, setInstitutionForm] = useState(EMPTY_INSTITUTION_FORM);
  const [institutionError, setInstitutionError] = useState("");

  // Roll numbers live on a separate `students` collection, joined here by
  // user_id — the /users endpoints never embed them.
  const [students, setStudents] = useState<Student[]>([]);
  const rollNumberByUserId = new Map(students.map((s) => [s.user_id, s.roll_number]));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "pending" ? "/users/pending" : "/users/";
      // Admin views must always reflect the live approval state, not a
      // cached read from moments before someone else's action (e.g. a
      // faculty batch upload creating new pending students).
      const res = await api.get(endpoint, { cache: false } as ApiRequestConfig);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students", { params: { limit: 200 }, cache: false } as ApiRequestConfig);
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const fetchStats = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get("/users/", { cache: false } as ApiRequestConfig),
        api.get("/users/pending", { cache: false } as ApiRequestConfig)
      ]);
      setStats({ total: allRes.data.length, pending: pendingRes.data.length });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
    try {
      const assessRes = await api.get("/tests");
      setAssessments(assessRes.data);
    } catch (err) {
      console.error("Failed to fetch assessments", err);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await api.get("/institutions/public");
      setColleges(res.data);
    } catch (err) {
      console.error("Failed to fetch colleges", err);
    }
  };

  const fetchInstitutions = async () => {
    setInstitutionsLoading(true);
    try {
      const res = await api.get("/institutions", { cache: false } as ApiRequestConfig);
      setInstitutions(res.data);
    } catch (err) {
      console.error("Failed to fetch institutions", err);
    } finally {
      setInstitutionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pending" || activeTab === "all") {
      fetchUsers();
      fetchStudents();
    }
    if (activeTab === "institutions") {
      fetchInstitutions();
    }
    fetchStats();
    fetchColleges();
  }, [activeTab]);

  const handleCreateInstitution = async () => {
    setInstitutionError("");
    if (!institutionForm.name.trim() || !institutionForm.code.trim()) {
      setInstitutionError("Name and code are required.");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: institutionForm.name.trim(),
        code: institutionForm.code.trim(),
      };
      if (institutionForm.location.trim()) payload.location = institutionForm.location.trim();
      if (institutionForm.contact_email.trim()) payload.contact_email = institutionForm.contact_email.trim();
      if (institutionForm.contact_phone.trim()) payload.contact_phone = institutionForm.contact_phone.trim();
      if (institutionForm.website.trim()) payload.website = institutionForm.website.trim();

      await api.post("/institutions", payload);
      setIsCreatingInstitution(false);
      setInstitutionForm(EMPTY_INSTITUTION_FORM);
      fetchInstitutions();
      fetchColleges();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; details?: string[] } } };
      const details = error?.response?.data?.details;
      setInstitutionError(
        (Array.isArray(details) ? details.join(", ") : error?.response?.data?.message) ||
          "Failed to create institution."
      );
    }
  };

  const handleDeleteInstitution = async (id: string) => {
    if (!window.confirm("Delete this institution permanently?")) return;
    try {
      await api.delete(`/institutions/${id}`);
      setInstitutions((prev) => prev.filter((i) => i.id !== id));
      fetchColleges();
    } catch (err) {
      alert("Failed to delete institution");
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await api.put(`/users/${id}/${action}`);
      if (activeTab === "pending") {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        fetchUsers();
      }
      fetchStats();
    } catch (err) {
      alert(`Failed to ${action} user`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user permanently?")) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      fetchStats();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEditFormData({
      name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.status,
      plan: u.preferences?.plan || "base",
      college_id: u.institution_id || ""
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const preferences = editingUser.preferences || {};
      const payload: Record<string, unknown> = {
        full_name: editFormData.name,
        email: editFormData.email,
        role: ROLE_API_VALUE[editFormData.role] || editFormData.role,
        status: editFormData.status,
        preferences: { ...preferences, plan: editFormData.plan },
        institution_id: editFormData.college_id || null,
      };
      await api.put(`/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      console.error("Update failed", err);
      const error = err as { response?: { data?: { message?: string; details?: string[] } } };
      const details = error?.response?.data?.details;
      alert((Array.isArray(details) ? details.join(", ") : error?.response?.data?.message) || "Failed to update user");
    }
  };

  const handleCreateSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        full_name: createFormData.name,
        email: createFormData.email,
        password: createFormData.password,
        role: ROLE_API_VALUE[createFormData.role] || createFormData.role,
      };
      if (createFormData.college_id) payload.institution_id = createFormData.college_id;

      await api.post("/users/", payload);
      setIsCreatingUser(false);
      fetchUsers();
      fetchStats();
      setCreateFormData({ name: "", email: "", role: "student", password: "", college_id: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; details?: string[] } } };
      const details = error?.response?.data?.details;
      alert((Array.isArray(details) ? details.join(", ") : error?.response?.data?.message) || "Failed to create user");
    }
  };

  // Department options are derived from whatever students are currently
  // loaded rather than a fixed catalog — department is free text set at
  // onboarding time (see FacultyUpload), so the real values in use are
  // whatever faculty actually typed/uploaded.
  const departmentOptions = Array.from(
    new Set(
      users
        .filter((u) => u.role === "student" && u.department)
        .map((u) => u.department as string)
    )
  ).sort();

  const filteredUsers = users.filter((u) => {
    if (filterCollege && u.institution_id !== filterCollege) return false;
    if (filterRole && u.role !== filterRole) return false;
    if (filterRole === "student" && filterDepartment && u.department !== filterDepartment) return false;
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === "name") return a.full_name.localeCompare(b.full_name);
    if (sortBy === "role") return a.role.localeCompare(b.role);
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage all portal accounts and requests here. Update, delete, and approve institutions, faculty, and students.</p>
        </div>
        <div className="flex items-center space-x-6 border-l pl-6 border-gray-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button 
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg text-sm font-medium transition-colors border border-red-100 flex items-center space-x-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Platform Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">System Status</p>
            <p className="text-lg font-bold text-gray-900 flex items-center">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Healthy
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          All Users
        </button>
        <button
          onClick={() => setActiveTab("assessments")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "assessments"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Assessments
        </button>
        <button
          onClick={() => setActiveTab("institutions")}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "institutions"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Institutions
        </button>
      </div>

      {activeTab === "pending" || activeTab === "all" ? (
      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">
              {activeTab === "pending" ? "Pending Approvals" : "All Users"} ({sortedUsers.length}{sortedUsers.length !== users.length ? ` of ${users.length}` : ""})
            </h2>
            <div className="flex space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-1.5 border"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="role">Sort by Role</option>
                <option value="status">Sort by Status</option>
              </select>
              <button onClick={() => setIsCreatingUser(true)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                + Add User
              </button>
              <button onClick={fetchUsers} className="text-sm text-blue-600 hover:bg-blue-700 font-medium transition-colors py-1.5">
                Refresh
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-1.5 border"
            >
              <option value="">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                if (e.target.value !== "student") setFilterDepartment("");
              }}
              className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-1.5 border"
            >
              <option value="">All Roles</option>
              {Object.entries(ROLE_DISPLAY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {filterRole === "student" && (
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="text-sm border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-1.5 border"
              >
                <option value="">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}

            {(filterCollege || filterRole) && (
              <button
                onClick={() => { setFilterCollege(""); setFilterRole(""); setFilterDepartment(""); }}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading requests...</div>
        ) : sortedUsers.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {users.length === 0 ? "All caught up!" : "No matching users"}
            </h3>
            <p className="text-gray-500 mt-1">
              {users.length === 0
                ? `There are no ${activeTab === "pending" ? "pending" : ""} accounts to review.`
                : "Try clearing or adjusting the filters above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Roll No.</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.full_name}

                      {u.institution_id && (
                        <div className="text-xs text-gray-400 mt-0.5 font-normal">
                          {colleges.find(c => c.id === u.institution_id)?.name || `Institution: ${u.institution_id}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {u.role === "student" ? (rollNumberByUserId.get(u.id) || "—") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100">
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${
                        u.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        u.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                        'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {activeTab === "pending" ? (
                        <>
                          <button
                            onClick={() => handleAction(u.id, "reject")}
                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(u.id, "approve")}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                          >
                            Approve
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(u)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      ) : activeTab === "assessments" ? (
      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">All Assessments ({assessments.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Difficulty</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Marks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{a.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{a.assessment_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${
                      a.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-100' : 
                      a.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                      'bg-green-50 text-green-700 border-green-100'
                    }`}>
                      {a.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.duration_minutes} min</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{a.total_marks}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No assessments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Institutions ({institutions.length})</h2>
          <div className="flex space-x-3">
            <button onClick={() => setIsCreatingInstitution(true)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
              + Add Institution
            </button>
            <button onClick={fetchInstitutions} className="text-sm text-blue-600 hover:bg-blue-700 font-medium transition-colors py-1.5">
              Refresh
            </button>
          </div>
        </div>

        {institutionsLoading ? (
          <div className="p-12 text-center text-gray-400">Loading institutions...</div>
        ) : institutions.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No institutions yet</h3>
            <p className="text-gray-500 mt-1">Add a college so it can be assigned to users and registrations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inst.name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{inst.code}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{inst.location || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{inst.contact_email || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize border ${
                        inst.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                      }`}>
                        {inst.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteInstitution(inst.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={editFormData.email} 
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  value={editFormData.role} 
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="college_admin">College Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={editFormData.status} 
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">College / Institution</label>
                <select
                  value={editFormData.college_id}
                  onChange={(e) => setEditFormData({...editFormData, college_id: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  <option value="">None (Independent)</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>


            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={createFormData.name} 
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={createFormData.email} 
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={createFormData.password} 
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="Initial password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  value={createFormData.role} 
                  onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="college_admin">College Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <select 
                  value={createFormData.college_id} 
                  onChange={(e) => setCreateFormData({...createFormData, college_id: e.target.value})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                >
                  <option value="">— No Institution —</option>
                  {colleges.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setIsCreatingUser(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSave}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Institution Modal */}
      {isCreatingInstitution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Institution</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={institutionForm.name}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="Example Institute of Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={institutionForm.code}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, code: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="EIT"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={institutionForm.location}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, location: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email (optional)</label>
                <input
                  type="email"
                  value={institutionForm.contact_email}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, contact_email: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="admin@college.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (optional)</label>
                <input
                  type="tel"
                  value={institutionForm.contact_phone}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, contact_phone: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input
                  type="text"
                  value={institutionForm.website}
                  onChange={(e) => setInstitutionForm({ ...institutionForm, website: e.target.value })}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                  placeholder="https://college.edu"
                />
              </div>
              {institutionError && (
                <p className="text-sm text-red-600">{institutionError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => { setIsCreatingInstitution(false); setInstitutionError(""); setInstitutionForm(EMPTY_INSTITUTION_FORM); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInstitution}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Create Institution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
