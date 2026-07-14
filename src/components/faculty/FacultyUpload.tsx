import React, { useState } from "react";
import { api } from "@/lib/api";
import * as XLSX from "xlsx";

export function FacultyUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processUpload = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // Expecting columns: Name, Email, Roll, Password (optional)
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      const payload = {
        department,
        year: year ? parseInt(year) : undefined,
        students: json.map((row) => ({
          name: row.Name || row.name,
          email: row.Email || row.email,
          roll: row.Roll || row.roll || row.StudentId || row.studentId,
          password: row.Password || row.password,
          department: row.Department || row.department,
          year: row.Year || row.year,
        })),
      };

      const res = await api.post("/students/batch", payload);
      setResult(res.data.message);
      setFile(null);
    } catch (err: any) {
      setResult(err.response?.data?.detail || "Upload failed. Please check file format.");
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
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="e.g. Computer Science" 
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Graduation Year</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="e.g. 2026" 
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
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
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Upload to Master Console
          </button>
        </div>
      </div>
    </div>
  );
}
