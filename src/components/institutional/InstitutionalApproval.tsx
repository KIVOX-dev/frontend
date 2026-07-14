import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

type PendingStudent = {
  id: number;
  name: string;
  email: string;
  department: string;
  created_at: string;
};

export function InstitutionalApproval() {
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/users/pending");
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch pending users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      await api.put(`/users/${id}/${action}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(`Failed to ${action} user`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Security & Approvals
          </h1>
          <p className="text-gray-500 mt-2">Master Console for approving student profiles uploaded by Faculty.</p>
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center backdrop-blur-sm">
          <h2 className="font-semibold text-gray-700">Pending Student Approvals ({students.length})</h2>
          <button onClick={fetchStudents} className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors hover:underline">
            Refresh Queue
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 font-medium">Loading requests...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-100 shadow-sm">
              <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500 mt-2 max-w-md">There are no pending students to review. Faculty uploads will appear here securely before they are granted system access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Email</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Department</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Requested</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{student.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700">
                        {student.department || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm font-medium">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleAction(student.id, "reject")}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-medium text-sm transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(student.id, "approve")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                      >
                        Approve Access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
