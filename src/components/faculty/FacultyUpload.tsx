import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/authStore";

type Department = { id: string; name: string; code?: string };

// Sheets in the wild name these columns all sorts of ways ("Roll No.",
// "Reg. Number", "Student Name", "E-mail" …). Match on a normalized key
// (lowercased, punctuation/spaces stripped) against an alias list instead of
// a handful of exact-cased guesses, so column naming/order doesn't matter.
const FIELD_ALIASES: Record<string, string[]> = {
  name: ["name", "fullname", "studentname", "candidatename"],
  email: ["email", "emailid", "emailaddress", "mail", "mailid"],
  roll: [
    "roll", "rollno", "rollnumber", "rollnum", "rollnumb",
    "studentid", "regno", "registrationno", "registrationnumber",
    "enrollmentno", "enrollmentnumber", "admissionno", "admissionnumber", "id",
  ],
  password: ["password", "pwd", "pass"],
  department: ["department", "dept", "branch", "course", "stream"],
  // Deliberately one bucket for both meanings — the backend disambiguates
  // by magnitude (4-digit-or-larger = explicit graduation year, smaller =
  // year of study; see studentOnboarding.js#resolveBatchYear).
  year: [
    "year", "graduationyear", "gradyear", "batch", "batchyear", "passingyear",
    "yearofstudy", "currentyear", "studyyear", "academicyear",
  ],
};

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function extractField(row: Record<string, unknown>, aliases: string[]): string | undefined {
  for (const [rawKey, value] of Object.entries(row)) {
    if (value === undefined || value === null) continue;
    const stringValue = String(value).trim();
    if (!stringValue) continue;
    if (aliases.includes(normalizeKey(rawKey))) return stringValue;
  }
  return undefined;
}

// A CSV's free-text department column ("CSE", "Computer Science") rarely
// matches a real department's name exactly — fall back to a code match
// before giving up, since codes are what people usually type in a hurry.
function resolveDepartmentId(raw: string | undefined, departments: Department[]): string | undefined {
  if (!raw) return undefined;
  const needle = raw.trim().toLowerCase();
  const match = departments.find(
    (d) => d.name.toLowerCase() === needle || (d.code && d.code.toLowerCase() === needle)
  );
  return match?.id;
}

export function FacultyUpload() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    api.get<Department[]>("/departments").then((res) => setDepartments(res.data)).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file) {
      toast.warning("Please select a file");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

      const students = json
        .map((row) => {
          const name = extractField(row, FIELD_ALIASES.name);
          const email = extractField(row, FIELD_ALIASES.email);
          let roll = extractField(row, FIELD_ALIASES.roll);
          // The backend requires a roll/student id per row; if the sheet only
          // has name+email, derive one from the email's local part rather
          // than rejecting the whole row.
          if (!roll && email) roll = email.split("@")[0].toUpperCase();
          const rowYear = extractField(row, FIELD_ALIASES.year);

          const rowDepartment = extractField(row, FIELD_ALIASES.department);

          return {
            name,
            email,
            roll,
            password: extractField(row, FIELD_ALIASES.password),
            department: rowDepartment,
            department_id: resolveDepartmentId(rowDepartment, departments),
            year: rowYear ? parseInt(rowYear, 10) : undefined,
          };
        })
        // Drop rows that are entirely blank (trailing empty spreadsheet rows).
        .filter((s) => s.name || s.email || s.roll);

      const payload = {
        department_id: departmentId || undefined,
        year: year ? parseInt(year) : undefined,
        students,
      };

      const res = await api.post("/students/batch", payload);
      setResult(res.data.message);
      setFile(null);
    } catch (err: unknown) {
      setResult(extractErrorMessage(err, "Upload failed. Please check file format."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Student Batch Onboarding
          </h1>
          <p className="text-gray-500 mt-2">Upload an Excel file to onboard new students securely.</p>
        </div>
      </div>

      <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 p-8">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Department</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Used for any row whose own Department column doesn&apos;t match a department by name or code.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year of Study / Graduation Year</label>
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 3, or 2026"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              A small number (1–6) is treated as current year of study — graduation year is computed from the department&apos;s program length. A 4-digit year (e.g. 2026) is used as-is instead. If left blank here and no department is set yet, it&apos;s computed when the account is approved.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            onChange={handleFileUpload}
            className="hidden" 
            id="file-upload" 
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-lg font-medium text-gray-700">
              {file ? file.name : "Click to select Excel/CSV file"}
            </span>
            <span className="text-sm text-gray-500 mt-1">Make sure columns include Name, Email, and Roll</span>
          </label>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 flex items-start gap-3">
             <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{result}</p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button 
            onClick={processUpload} 
            disabled={!file || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium shadow-xs transition-all focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Upload to Master Console
          </button>
        </div>
      </div>
    </div>
  );
}
