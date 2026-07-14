import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  status: string;
  college_id?: number | null;
  preferences?: { plan?: "base" | "pro" } | null;
};

export function SuperAdminDashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "assessments">("pending");
  const [users, setUsers] = useState<User[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [sortBy, setSortBy] = useState<"name" | "role" | "status" | "date">("date");

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", role: "", status: "", plan: "base", college_id: "" });

  // Create Modal State
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: "", email: "", role: "student", password: "", college_id: "" });
  const [colleges, setColleges] = useState<{id: number, name: string}[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "pending" ? "/users/pending" : "/users/";
      const res = await api.get(endpoint);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        api.get("/users/"),
        api.get("/users/pending")
      ]);
      setStats({ total: allRes.data.length, pending: pendingRes.data.length });
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
    try {
      const assessRes = await api.get("/assessments/");
      setAssessments(assessRes.data);
    } catch (err) {
      console.error("Failed to fetch assessments", err);
    }
  };

  const fetchColleges = async () => {
    try {
      const res = await api.get("/colleges/");
      setColleges(res.data);
    } catch (err) {
      console.error("Failed to fetch colleges", err);
    }
  };

  useEffect(() => {
    if (activeTab === "pending" || activeTab === "all") {
      fetchUsers();
    }
    fetchStats();
    fetchColleges();
  }, [activeTab]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
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

  const handleDelete = async (id: number) => {
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
      name: u.name, 
      email: u.email, 
      role: u.role, 
      status: u.status,
      plan: u.preferences?.plan || "base",
      college_id: u.college_id ? String(u.college_id) : ""
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const preferences = editingUser.preferences || {};
      const payload: any = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        status: editFormData.status,
        preferences: { ...preferences, plan: editFormData.plan },
        college_id: editFormData.college_id ? parseInt(editFormData.college_id) : null
      };
      await api.put(`/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update user");
    }
  };

  const handleCreateSave = async () => {
    try {
      await api.post("/users/", {
        ...createFormData,
        college_id: createFormData.college_id ? parseInt(createFormData.college_id) : undefined
      });
      setIsCreatingUser(false);
      fetchUsers();
      fetchStats();
      setCreateFormData({ name: "", email: "", role: "student", password: "", college_id: "" });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create user");
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
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
      </div>

      {activeTab !== "assessments" ? (
      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
            {activeTab === "pending" ? "Pending Approvals" : "All Users"} ({users.length})
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

        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading requests...</div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-1">There are no {activeTab === "pending" ? "pending" : ""} accounts to review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
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
                      {u.name}

                      {u.college_id && (
                        <div className="text-xs text-gray-400 mt-0.5 font-normal">
                          {colleges.find(c => c.id === u.college_id)?.name || `College ID: ${u.college_id}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 capitalize border border-blue-100">
                        {u.role.replace("_", " ")}
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
      ) : (
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
    </div>
  );
}
