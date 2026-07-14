"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { 
  FileText, Sparkles, Plus, Trash2, ArrowUp, ArrowDown, Check, X, 
  Download, RefreshCw, ZoomIn, ZoomOut, Briefcase, GraduationCap, 
  Award, Globe, PlusCircle, Layers, Flame, BookOpen, User, Copy, 
  Edit, Eye, AlertCircle, CheckCircle, ChevronRight, FileUp, Star
} from "lucide-react";

interface SectionItem {
  id: string;
  [key: string]: any;
}

interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    address: string;
    role: string;
  };
  objective: string;
  education: SectionItem[];
  experience: SectionItem[];
  projects: SectionItem[];
  skills: SectionItem[];
  certifications: SectionItem[];
  internships: SectionItem[];
  achievements: SectionItem[];
  hackathons: SectionItem[];
  publications: SectionItem[];
  languages: SectionItem[];
  volunteer: SectionItem[];
  references: SectionItem[];
  customSections: SectionItem[];
  sectionOrder: string[];
  template: string;
  zoom: number;
}

interface Version {
  id: string;
  name: string;
  updated_at: string;
}

interface ATSReport {
  score: number;
  readability: number;
  section_completeness: { section: string; score: number; status: string }[];
  keywords_analyzed: number;
  missing_keywords: string[];
  formatting_issues: string[];
  contact_validation: string[];
  skills_gap: string[];
  experience_quality: string;
  suggestions: string[];
}

interface JDReport {
  match_percentage: number;
  ats_match_status: string;
  matching_skills: string[];
  missing_keywords: string[];
  suggested_skills: string[];
  missing_experience: string;
  recommended_certifications: string[];
  recommended_projects: string[];
  overall_evaluation: string;
}

export function ResumeBuilder() {
  const { user } = useAuthStore();
  
  // App views: 'dashboard' | 'builder'
  const [view, setView] = useState<"dashboard" | "builder">("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Unsaved Changes" | "">("Saved");
  const [lastSaved, setLastSaved] = useState<string>("");

  // Core resume and versions state
  const [formData, setFormData] = useState<ResumeData>({
    personal: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      linkedin: "",
      github: "",
      portfolio: "",
      address: "",
      role: "",
    },
    objective: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    internships: [],
    achievements: [],
    hackathons: [],
    publications: [],
    languages: [],
    volunteer: [],
    references: [],
    customSections: [],
    sectionOrder: ["personal", "objective", "education", "experience", "projects", "skills", "certifications"],
    template: "modern",
    zoom: 1.0,
  });

  const [versions, setVersions] = useState<Version[]>([]);
  const [newVersionName, setNewVersionName] = useState("");
  const [showVersionModal, setShowVersionModal] = useState(false);

  // AI & ATS Analyzer State
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "ats" | "jd" | "assistant">("edit");
  const [jdText, setJdText] = useState("");
  const [atsReport, setAtsReport] = useState<ATSReport | null>(null);
  const [jdReport, setJdReport] = useState<JDReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchingJd, setMatchingJd] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // AI Suggestion preview modal
  const [aiSuggestion, setAiSuggestion] = useState<{ fieldPath: string; original: string; suggested: string } | null>(null);

  // Import / Parser State
  const [importText, setImportText] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);

  // Cover Letter & Interview prep results
  const [coverLetter, setCoverLetter] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState("");

  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // Fetch initial data
  useEffect(() => {
    fetchResumeData();
  }, []);

  // Handle auto-save trigger on formData change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    setSaveStatus("Unsaved Changes");
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      triggerSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [formData]);

  const fetchResumeData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/resume");
      if (res.data.resume) {
        setFormData(res.data.resume);
        if (res.data.resume.updated_at) {
          setLastSaved(new Date(res.data.resume.updated_at).toLocaleTimeString());
        }
      }
      if (res.data.versions) {
        setVersions(res.data.versions);
      }
    } catch (err) {
      console.error("Failed to load resume", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerSave = async (silent = true) => {
    if (!silent) setSaving(true);
    setSaveStatus("Saving...");
    try {
      const res = await api.post("/resume", formData);
      setSaveStatus("Saved");
      setLastSaved(new Date(res.data.updated_at).toLocaleTimeString());
    } catch (err) {
      console.error("Failed to auto-save", err);
      setSaveStatus("Unsaved Changes");
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      personal: { ...prev.personal, [e.target.name]: e.target.value }
    }));
  };

  // Section CRUD utilities
  const addArrayItem = (field: keyof ResumeData, defaultItem: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), { ...defaultItem, id: Date.now().toString() }]
    }));
  };

  const updateArrayItem = (field: keyof ResumeData, id: string, key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  };

  const removeArrayItem = (field: keyof ResumeData, id: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter(item => item.id !== id)
    }));
  };

  const moveArrayItem = (field: keyof ResumeData, index: number, direction: "up" | "down") => {
    const list = [...(formData[field] as any[])];
    if (direction === "up" && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setFormData(prev => ({ ...prev, [field]: list }));
  };

  // Save/Restore version controls
  const handleSaveVersion = async () => {
    if (!newVersionName.trim()) return;
    try {
      await api.post("/resume/version", { name: newVersionName });
      setNewVersionName("");
      setShowVersionModal(false);
      fetchResumeData();
      alert("Resume version saved successfully.");
    } catch (err) {
      alert("Failed to save version.");
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to restore this version? All unsaved active changes will be overridden.")) return;
    setLoading(true);
    try {
      await api.post(`/resume/version/${versionId}/restore`);
      fetchResumeData();
      setView("builder");
    } catch (err) {
      alert("Failed to restore version.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this version?")) return;
    try {
      await api.delete(`/resume/version/${versionId}`);
      fetchResumeData();
    } catch (err) {
      alert("Failed to delete version.");
    }
  };

  // ATS Analyzer trigger
  const runATSAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await api.post("/resume/analyze");
      setAtsReport(res.data);
    } catch (err) {
      alert("Failed to analyze resume.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Job Description Matcher trigger
  const runJDMatch = async () => {
    if (!jdText.trim()) return alert("Please enter or paste a Job Description first.");
    setMatchingJd(true);
    try {
      const res = await api.post("/resume/match-jd", { jd_text: jdText });
      setJdReport(res.data);
    } catch (err) {
      alert("Failed to evaluate JD match.");
    } finally {
      setMatchingJd(false);
    }
  };

  // Import Resume Parser trigger
  const handleParseResume = async () => {
    if (!importText.trim()) return alert("Please paste the resume text content.");
    setParsingResume(true);
    try {
      const res = await api.post("/resume/parse", { text: importText });
      setFormData(prev => ({
        ...prev,
        ...res.data,
        personal: { ...prev.personal, ...res.data.personal }
      }));
      setShowImportModal(false);
      setImportText("");
      setView("builder");
      alert("Resume parsed and imported successfully!");
    } catch (err) {
      alert("Failed to parse resume text. Please try again.");
    } finally {
      setParsingResume(false);
    }
  };

  // Reusable AI assistant request
  const requestAISuggestion = async (action: string, content: string, fieldPath: string) => {
    setAiLoading(true);
    try {
      const res = await api.post("/resume/ai-suggest", { action, content });
      setAiSuggestion({
        fieldPath,
        original: content,
        suggested: res.data.result
      });
    } catch (err) {
      alert("AI request failed. Please check your network connection.");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiSuggestion) return;
    const { fieldPath, suggested } = aiSuggestion;
    
    // Path structure: personal.objective OR experience.id.description
    const parts = fieldPath.split(".");
    if (parts.length === 2) {
      const [sec, key] = parts;
      setFormData(prev => ({
        ...prev,
        [sec]: typeof prev[sec as keyof ResumeData] === "object"
          ? { ...(prev[sec as keyof ResumeData] as any), [key]: suggested }
          : suggested
      }));
    } else if (parts.length === 3) {
      const [sec, itemId, key] = parts;
      setFormData(prev => ({
        ...prev,
        [sec]: (prev[sec as keyof ResumeData] as any[]).map((item: any) =>
          item.id === itemId ? { ...item, [key]: suggested } : item
        )
      }));
    }
    setAiSuggestion(null);
  };

  // Generate Cover Letter or Interview Questions
  const generateCoverLetter = async () => {
    if (!jdText.trim()) return alert("Paste a Job Description first to customize the Cover Letter.");
    setAiLoading(true);
    try {
      const res = await api.post("/resume/ai-suggest", { action: "cover_letter", jd_text: jdText });
      setCoverLetter(res.data.result);
    } catch (err) {
      alert("Failed to generate cover letter.");
    } finally {
      setAiLoading(false);
    }
  };

  const generatePrepQuestions = async () => {
    setAiLoading(true);
    try {
      const res = await api.post("/resume/ai-suggest", { action: "interview_prep" });
      setInterviewQuestions(res.data.result);
    } catch (err) {
      alert("Failed to generate interview prep questions.");
    } finally {
      setAiLoading(false);
    }
  };

  // Export controls
  const handlePrint = () => {
    window.print();
  };

  const exportPDF = async () => {
    const element = document.getElementById("resume-preview-sheet");
    if (!element) return;
    setSaving(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin: [0.1, 0.1, 0.1, 0.1],
        filename: `${formData.personal.name.replace(/\s+/g, "_")}_Resume.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      alert("Failed to export PDF.");
    } finally {
      setSaving(false);
    }
  };

  const exportHTML = () => {
    const element = document.getElementById("resume-preview-sheet");
    if (!element) return;
    const fileContent = `<!DOCTYPE html><html><head><title>Resume</title><style>
      body { font-family: sans-serif; background: #fff; color: #333; margin: 40px; }
      ${document.getElementById("resume-styles")?.innerHTML}
    </style></head><body>${element.innerHTML}</body></html>`;
    const blob = new Blob([fileContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${formData.personal.name.replace(/\s+/g, "_")}_Resume.html`;
    link.click();
  };

  // Resume completion calculation
  const getCompletionPercentage = () => {
    let score = 20; // base score for profile setup
    if (formData.personal.name) score += 5;
    if (formData.personal.email) score += 5;
    if (formData.personal.phone) score += 5;
    if (formData.personal.linkedin) score += 5;
    if (formData.objective) score += 10;
    if (formData.education.length > 0) score += 15;
    if (formData.skills.length > 0) score += 15;
    if (formData.projects.length > 0) score += 10;
    if (formData.experience.length > 0) score += 10;
    return Math.min(100, score);
  };

  // Render Section lists
  const renderItemController = (field: keyof ResumeData, index: number) => {
    const list = formData[field] as any[];
    return (
      <div className="flex gap-1">
        <button 
          onClick={() => moveArrayItem(field, index, "up")} 
          disabled={index === 0}
          className="p-1.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-emerald-brand hover:bg-emerald-50 disabled:opacity-40"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => moveArrayItem(field, index, "down")} 
          disabled={index === list.length - 1}
          className="p-1.5 rounded bg-white border border-gray-200 text-gray-400 hover:text-emerald-brand hover:bg-emerald-50 disabled:opacity-40"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Resume templates rendering
  const renderTemplateContent = () => {
    const { personal, objective, education, experience, projects, skills, certifications, internships, achievements, hackathons, publications, languages, volunteer, references, customSections } = formData;
    return (
      <div className={`resume-sheet p-8 font-jakarta text-slate-800 leading-relaxed text-sm`}>
        {/* Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-1">{personal.name || "Your Name"}</h1>
          <p className="text-emerald-brand font-semibold text-base mb-2">{personal.role || "Professional Title"}</p>
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-slate-500 text-xs">
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>{personal.phone}</span>}
            {personal.address && <span>{personal.address}</span>}
            {personal.linkedin && <a href={personal.linkedin} className="hover:underline">{personal.linkedin}</a>}
            {personal.github && <a href={personal.github} className="hover:underline">{personal.github}</a>}
            {personal.portfolio && <a href={personal.portfolio} className="hover:underline">{personal.portfolio}</a>}
          </div>
        </div>

        {/* Objective */}
        {objective && (
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Professional Summary</h2>
            <p className="text-slate-600 text-xs leading-relaxed">{objective}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Professional Experience</h2>
            <div className="space-y-3">
              {experience.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-800 text-xs">{item.role}</h3>
                    <span className="text-slate-500 text-[10px] font-semibold">{item.duration}</span>
                  </div>
                  <div className="text-emerald-brand font-medium text-[11px] mb-1">{item.company}</div>
                  <p className="text-slate-600 text-xs whitespace-pre-wrap">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Academic & Personal Projects</h2>
            <div className="space-y-3">
              {projects.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-bold text-slate-800 text-xs">{item.title}</h3>
                    {item.link && <a href={item.link} className="text-emerald-brand text-[10px] hover:underline font-semibold">{item.link}</a>}
                  </div>
                  {item.technologies && <div className="text-slate-500 text-[10px] font-medium mb-1">Technologies: {item.technologies}</div>}
                  <p className="text-slate-600 text-xs whitespace-pre-wrap">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Skills & Expertise</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((item) => (
                <span key={item.id} className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {item.name} <span className="text-[10px] text-slate-400 font-semibold ml-1">({item.category})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Custom and additional sections */}
        <div className="grid grid-cols-2 gap-4">
          {education.length > 0 && (
            <div className="mb-4 col-span-2">
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Education</h2>
              <div className="space-y-2">
                {education.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{item.degree}</div>
                      <div className="text-slate-500 text-[11px]">{item.institution}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-[10px] font-semibold">{item.year}</div>
                      {item.score && <div className="text-emerald-brand text-[11px] font-bold">Score: {item.score}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certifications.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Certifications</h2>
              <ul className="space-y-1 list-disc pl-4 text-xs text-slate-600">
                {certifications.map(item => (
                  <li key={item.id}>{item.name} - <span className="font-medium text-slate-400">{item.issuer} ({item.year})</span></li>
                ))}
              </ul>
            </div>
          )}

          {languages.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider font-extrabold text-emerald-brand border-b pb-1 mb-2">Languages</h2>
              <div className="flex flex-wrap gap-1.5">
                {languages.map(item => (
                  <span key={item.id} className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-600">{item.name} ({item.level})</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-10 h-10 text-emerald-brand animate-spin" />
        <p className="text-gray-500 text-sm font-semibold">Loading resume workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-6 border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-brand" />
            AI Resume Workspace
          </h2>
          <p className="text-slate-500 text-sm mt-1">Design, analyze, and optimize your ATS resume with Groq AI assistance.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              saveStatus === "Saved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
              saveStatus === "Saving..." ? "bg-blue-50 text-blue-600 border border-blue-100" :
              "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === "Saved" ? "bg-emerald-500" :
                saveStatus === "Saving..." ? "bg-blue-500" : "bg-amber-500"
              }`} />
              {saveStatus} {lastSaved && <span className="text-[10px] font-normal">({lastSaved})</span>}
            </span>
          )}

          {view === "dashboard" ? (
            <button 
              onClick={() => setView("builder")}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-green-gradient shadow-green-glow hover:scale-[1.02] transition-all"
            >
              Enter Resume Builder
            </button>
          ) : (
            <button 
              onClick={() => setView("dashboard")}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {view === "dashboard" ? (
        /* ──── RESUME DASHBOARD VIEW ──── */
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Score card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4">ATS Compatibility Score</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900">{atsReport?.score || 72}</span>
                    <span className="text-slate-400 text-lg font-bold">/ 100</span>
                  </div>
                  <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-gradient" 
                      style={{ width: `${atsReport?.score || 72}%` }}
                    />
                  </div>
                </div>
                <div className="mt-6 border-t pt-4 border-slate-50 flex justify-between items-center">
                  <span className="text-xs text-slate-400">Readability: <strong className="text-slate-700">{atsReport?.readability || 84}%</strong></span>
                  <button 
                    onClick={runATSAnalysis}
                    disabled={analyzing}
                    className="text-xs text-emerald-brand hover:underline font-bold flex items-center gap-1"
                  >
                    {analyzing ? "Analyzing..." : "Run Scanner ✨"}
                  </button>
                </div>
              </div>

              {/* Completion card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-4">Completion Status</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900">{getCompletionPercentage()}%</span>
                  </div>
                  <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-brand" 
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                </div>
                <p className="text-slate-400 text-xs mt-6 border-t pt-4 border-slate-50">
                  Fill in Certifications and Projects to hit 100%.
                </p>
              </div>
            </div>

            {/* Quick Actions & versions */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Resume Draft Versions</h3>
                <button 
                  onClick={() => setShowVersionModal(true)}
                  className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Save Current Draft
                </button>
              </div>

              {versions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No saved drafts yet. Save copies to experiment with templates.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((v) => (
                    <div key={v.id} className="flex justify-between items-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                        <span className="text-[11px] text-slate-400">Created: {new Date(v.updated_at).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleRestoreVersion(v.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
                        >
                          Restore
                        </button>
                        <button 
                          onClick={() => handleDeleteVersion(v.id)}
                          className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick analysis & advice */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-900 text-lg">ATS Scanner Feedback</h3>
            
            {atsReport ? (
              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" /> Strengths & Formatting
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    {atsReport.contact_validation.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>

                {atsReport.missing_keywords.length > 0 && (
                  <div>
                    <h4 className="font-bold text-amber-700 mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Missing Core Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {atsReport.missing_keywords.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-semibold">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Key Advice</h4>
                  <ul className="list-decimal pl-4 space-y-1.5 text-slate-600">
                    {atsReport.suggestions.slice(0, 3).map((sg, i) => <li key={i}>{sg}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                <p>Run the ATS scanner to calculate score and scan for missing keywords or format errors.</p>
              </div>
            )}

            <button 
              onClick={runATSAnalysis}
              disabled={analyzing}
              className="w-full py-3 rounded-xl font-semibold text-white bg-green-gradient flex justify-center items-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? "Analyzing Resume..." : "Run Active Scan"}
            </button>
          </div>
        </div>
      ) : (
        /* ──── ACTIVE RESUME BUILDER WORKSPACE ──── */
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Form editor & tooltabs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full justify-between gap-1 overflow-x-auto">
              {[
                { id: "edit", label: "Edit Resume", icon: Edit },
                { id: "ats", label: "ATS Scanner", icon: ShieldAlert },
                { id: "jd", label: "JD Matcher", icon: Sparkles },
                { id: "assistant", label: "AI tools", icon: Star }
              ].map(t => {
                const Icon = t.icon || Star;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === t.id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* TAB: EDIT RESUME */}
            {activeTab === "edit" && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-base border-b pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-brand" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Full Name</label>
                      <input 
                        type="text" name="name" value={formData.personal.name} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Professional Title / Role</label>
                      <input 
                        type="text" name="role" value={formData.personal.role} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                        placeholder="e.g. Full Stack Engineer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Phone Number</label>
                      <input 
                        type="text" name="phone" value={formData.personal.phone} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">LinkedIn Profile URL</label>
                      <input 
                        type="text" name="linkedin" value={formData.personal.linkedin} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                        placeholder="linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase">GitHub Profile URL</label>
                      <input 
                        type="text" name="github" value={formData.personal.github} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                        placeholder="github.com/..."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase">Address / Location</label>
                      <input 
                        type="text" name="address" value={formData.personal.address} 
                        onChange={handlePersonalChange} className="fi text-xs mt-1 w-full" 
                        placeholder="e.g. Bangalore, India"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Objective */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-brand" /> Professional Summary
                    </h3>
                    <button 
                      onClick={() => requestAISuggestion("summary", formData.objective, "objective")}
                      disabled={aiLoading}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Improve summary
                    </button>
                  </div>
                  <textarea 
                    value={formData.objective} 
                    onChange={e => setFormData({ ...formData, objective: e.target.value })} 
                    className="fi text-xs w-full min-h-[100px] mt-1" 
                    placeholder="Short statement explaining your career goals and key strengths..."
                  />
                </div>

                {/* Education */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-brand" /> Education History
                    </h3>
                    <button 
                      onClick={() => addArrayItem("education", { institution: "", degree: "", year: "", score: "" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.education.map((item, index) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative space-y-3">
                        <div className="flex justify-between items-center">
                          {renderItemController("education", index)}
                          <button 
                            onClick={() => removeArrayItem("education", item.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Institution Name</label>
                            <input 
                              type="text" value={item.institution} 
                              onChange={e => updateArrayItem("education", item.id, "institution", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Degree / Branch</label>
                            <input 
                              type="text" value={item.degree} 
                              onChange={e => updateArrayItem("education", item.id, "degree", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Graduation Year</label>
                            <input 
                              type="text" value={item.year} 
                              onChange={e => updateArrayItem("education", item.id, "year", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">CGPA / Score</label>
                            <input 
                              type="text" value={item.score} 
                              onChange={e => updateArrayItem("education", item.id, "score", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-brand" /> Work Experience
                    </h3>
                    <button 
                      onClick={() => addArrayItem("experience", { role: "", company: "", duration: "", description: "" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add experience
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.experience.map((item, index) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative space-y-3">
                        <div className="flex justify-between items-center">
                          {renderItemController("experience", index)}
                          <button 
                            onClick={() => removeArrayItem("experience", item.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Job Role / Title</label>
                            <input 
                              type="text" value={item.role} 
                              onChange={e => updateArrayItem("experience", item.id, "role", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Company Name</label>
                            <input 
                              type="text" value={item.company} 
                              onChange={e => updateArrayItem("experience", item.id, "company", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400">Duration (Dates)</label>
                            <input 
                              type="text" value={item.duration} 
                              onChange={e => updateArrayItem("experience", item.id, "duration", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-400">Description</label>
                              <button 
                                onClick={() => requestAISuggestion("rewrite", item.description, `experience.${item.id}.description`)}
                                className="text-[10px] font-bold text-emerald-brand hover:underline flex items-center gap-0.5"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> AI Rewrite
                              </button>
                            </div>
                            <textarea 
                              value={item.description} 
                              onChange={e => updateArrayItem("experience", item.id, "description", e.target.value)} 
                              className="fi text-xs w-full min-h-[80px]" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Flame className="w-4 h-4 text-emerald-brand" /> Key Projects
                    </h3>
                    <button 
                      onClick={() => addArrayItem("projects", { title: "", description: "", link: "", technologies: "" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Project
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.projects.map((item, index) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative space-y-3">
                        <div className="flex justify-between items-center">
                          {renderItemController("projects", index)}
                          <button 
                            onClick={() => removeArrayItem("projects", item.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Project Title</label>
                            <input 
                              type="text" value={item.title} 
                              onChange={e => updateArrayItem("projects", item.id, "title", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400">Project Link</label>
                            <input 
                              type="text" value={item.link} 
                              onChange={e => updateArrayItem("projects", item.id, "link", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-bold text-slate-400">Technologies Used</label>
                            <input 
                              type="text" value={item.technologies} 
                              onChange={e => updateArrayItem("projects", item.id, "technologies", e.target.value)} 
                              className="fi text-xs mt-1 w-full" 
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] font-bold text-slate-400">Description</label>
                              <button 
                                onClick={() => requestAISuggestion("rewrite", item.description, `projects.${item.id}.description`)}
                                className="text-[10px] font-bold text-emerald-brand hover:underline flex items-center gap-0.5"
                              >
                                <Sparkles className="w-2.5 h-2.5" /> AI Rewrite
                              </button>
                            </div>
                            <textarea 
                              value={item.description} 
                              onChange={e => updateArrayItem("projects", item.id, "description", e.target.value)} 
                              className="fi text-xs w-full min-h-[80px]" 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-brand" /> Skills List
                    </h3>
                    <button 
                      onClick={() => addArrayItem("skills", { name: "", category: "technical" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Skill
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.skills.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-center p-2 border rounded-xl bg-slate-50 border-slate-100">
                        <input 
                          type="text" value={item.name} 
                          onChange={e => updateArrayItem("skills", item.id, "name", e.target.value)} 
                          className="fi text-xs flex-1" 
                          placeholder="Skill name"
                        />
                        <select 
                          value={item.category} 
                          onChange={e => updateArrayItem("skills", item.id, "category", e.target.value)}
                          className="fi text-xs w-24 bg-white border border-slate-200"
                        >
                          <option value="technical">Technical</option>
                          <option value="tools">Tools</option>
                          <option value="soft">Soft</option>
                        </select>
                        <button 
                          onClick={() => removeArrayItem("skills", item.id)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Star className="w-4 h-4 text-emerald-brand" /> Certifications
                    </h3>
                    <button 
                      onClick={() => addArrayItem("certifications", { name: "", issuer: "", year: "" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.certifications.map((item, index) => (
                      <div key={item.id} className="flex gap-2 items-center p-3 border rounded-xl bg-slate-50 border-slate-100">
                        <input 
                          type="text" value={item.name} 
                          onChange={e => updateArrayItem("certifications", item.id, "name", e.target.value)} 
                          className="fi text-xs flex-1" 
                          placeholder="Certification name"
                        />
                        <input 
                          type="text" value={item.issuer} 
                          onChange={e => updateArrayItem("certifications", item.id, "issuer", e.target.value)} 
                          className="fi text-xs w-28" 
                          placeholder="Issuer"
                        />
                        <input 
                          type="text" value={item.year} 
                          onChange={e => updateArrayItem("certifications", item.id, "year", e.target.value)} 
                          className="fi text-xs w-20" 
                          placeholder="Year"
                        />
                        <button 
                          onClick={() => removeArrayItem("certifications", item.id)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-brand" /> Languages
                    </h3>
                    <button 
                      onClick={() => addArrayItem("languages", { name: "", level: "Fluent" })}
                      className="text-xs font-bold text-emerald-brand hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add language
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.languages.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center p-2 border rounded-xl bg-slate-50 border-slate-100">
                        <input 
                          type="text" value={item.name} 
                          onChange={e => updateArrayItem("languages", item.id, "name", e.target.value)} 
                          className="fi text-xs flex-1" 
                          placeholder="Language"
                        />
                        <select 
                          value={item.level} 
                          onChange={e => updateArrayItem("languages", item.id, "level", e.target.value)}
                          className="fi text-xs w-24 bg-white border border-slate-200"
                        >
                          <option value="Native">Native</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Basic">Basic</option>
                        </select>
                        <button 
                          onClick={() => removeArrayItem("languages", item.id)}
                          className="text-red-500 p-1 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ATS SCANNER */}
            {activeTab === "ats" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-slate-900 text-lg">ATS Optimization</h3>
                  <button 
                    onClick={runATSAnalysis} 
                    disabled={analyzing}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-green-gradient disabled:opacity-50 flex items-center gap-1"
                  >
                    {analyzing ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                    {analyzing ? "Scanning..." : "Trigger Scan"}
                  </button>
                </div>

                {atsReport ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center text-slate-800 font-extrabold text-2xl">
                        {atsReport.score}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">ATS Score Evaluated</h4>
                        <p className="text-slate-400 text-xs">Readability metric: {atsReport.readability}%</p>
                      </div>
                    </div>

                    {/* Completeness list */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Section Completeness</h4>
                      {atsReport.section_completeness.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-slate-700">{item.section}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === "Complete" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }`}>{item.status} ({item.score}%)</span>
                        </div>
                      ))}
                    </div>

                    {/* Skill gap */}
                    {atsReport.skills_gap.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Skills Gaps Identified</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {atsReport.skills_gap.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-xs font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestions */}
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Recommended Upgrades</h4>
                      <ul className="space-y-1.5 pl-4 list-decimal text-slate-600 text-xs leading-relaxed">
                        {atsReport.suggestions.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p>Click "Trigger Scan" to check keywords alignment, formatting problems, and obtain detailed feedback.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: JD MATCHER */}
            {activeTab === "jd" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 text-lg border-b pb-2">Target Job Description Matching</h3>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Paste Job Description Text</label>
                  <textarea 
                    value={jdText} 
                    onChange={e => setJdText(e.target.value)} 
                    className="fi text-xs w-full min-h-[120px]" 
                    placeholder="Paste job details, required experience, skills..."
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={runJDMatch} 
                    disabled={matchingJd}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-green-gradient disabled:opacity-50 flex justify-center items-center gap-1"
                  >
                    {matchingJd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Evaluate Match Index
                  </button>
                  <button 
                    onClick={generateCoverLetter} 
                    disabled={aiLoading || !jdText}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 disabled:opacity-50"
                  >
                    AI Cover Letter
                  </button>
                </div>

                {jdReport && (
                  <div className="space-y-4 border-t pt-4 border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-emerald-brand">{jdReport.match_percentage}%</span>
                      <div>
                        <h4 className="font-bold text-slate-800">{jdReport.ats_match_status}</h4>
                        <p className="text-[10px] text-slate-400">Match score based on requirements</p>
                      </div>
                    </div>

                    {jdReport.missing_keywords.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-1">Missing Keywords in Resume</h4>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {jdReport.missing_keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-semibold">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {jdReport.recommended_projects.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 mb-1">Recommended Project Topics</h4>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {jdReport.recommended_projects.map((proj, i) => <li key={i}>{proj}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {coverLetter && (
                  <div className="space-y-2 border-t pt-4 border-slate-100 text-xs">
                    <h4 className="font-bold text-slate-900">Custom Tailored Cover Letter</h4>
                    <pre className="p-3 bg-slate-50 border rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-600">{coverLetter}</pre>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(coverLetter); alert("Copied to clipboard!"); }}
                      className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 font-bold"
                    >
                      Copy Cover Letter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB: AI TOOLS */}
            {activeTab === "assistant" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-900 text-lg border-b pb-2">Groq AI Helper Hub</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-center" onClick={generatePrepQuestions}>
                    <Sparkles className="w-5 h-5 text-emerald-brand mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-xs">Interview Prep Qs</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Generate interview questions based on resume content</p>
                  </div>
                  <div className="p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-center" onClick={() => setShowImportModal(true)}>
                    <FileUp className="w-5 h-5 text-emerald-brand mx-auto mb-2" />
                    <h4 className="font-bold text-slate-800 text-xs">Import from text</h4>
                    <p className="text-[10px] text-slate-400 mt-1">Paste raw text to parse into fields</p>
                  </div>
                </div>

                {interviewQuestions && (
                  <div className="space-y-2 border-t pt-4 border-slate-100 text-xs">
                    <h4 className="font-bold text-slate-900">Tailored Prep Questions</h4>
                    <pre className="p-3 bg-slate-50 border rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-600">{interviewQuestions}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: Live Resume preview */}
          <div className="lg:col-span-6 space-y-6 sticky top-24">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <select 
                  value={formData.template} 
                  onChange={e => setFormData({ ...formData, template: e.target.value })}
                  className="fi text-xs bg-slate-50 border border-slate-200"
                >
                  <option value="modern">Modern Tech</option>
                  <option value="classic">Classic Professional</option>
                  <option value="minimal">Clean Minimalist</option>
                  <option value="creative">Creative Bold</option>
                </select>
                
                <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, zoom: Math.max(0.6, prev.zoom - 0.1) }))}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-600">{Math.round(formData.zoom * 100)}%</span>
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, zoom: Math.min(1.5, prev.zoom + 0.1) }))}
                    className="p-1 text-slate-500 hover:text-slate-900"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={exportPDF} 
                  disabled={saving}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-green-gradient flex items-center gap-1.5 hover:scale-[1.02] transition-all disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF
                </button>
                <button 
                  onClick={exportHTML}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200"
                >
                  Download HTML
                </button>
              </div>
            </div>

            {/* Resume Sheet Preview Container */}
            <div className="border border-slate-200 rounded-2xl bg-slate-500/10 p-4 max-h-[800px] overflow-y-auto flex justify-center">
              <div 
                id="resume-preview-sheet"
                style={{ 
                  transform: `scale(${formData.zoom})`, 
                  transformOrigin: "top center",
                  width: "100%",
                  maxWidth: "595px", // A4 Width approx
                  minHeight: "842px", // A4 Height approx
                  backgroundColor: "#ffffff",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)"
                }}
                className={`resume-template-${formData.template} bg-white rounded shadow-md overflow-hidden`}
              >
                {renderTemplateContent()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Save Version */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-lg">Save Resume Draft Version</h3>
              <button onClick={() => setShowVersionModal(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Version Tag/Name</label>
              <input 
                type="text" value={newVersionName} 
                onChange={e => setNewVersionName(e.target.value)} 
                className="fi text-xs w-full" 
                placeholder="e.g. SDE Application Draft"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setShowVersionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveVersion}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-green-gradient"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Resume */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-lg">AI Resume Importer</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Paste all text content from your existing resume PDF or DOCX file. The Groq AI model will parse it into structured fields.</p>
              <textarea 
                value={importText} 
                onChange={e => setImportText(e.target.value)} 
                className="fi text-xs w-full min-h-[200px]" 
                placeholder="Paste resume text here..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleParseResume}
                disabled={parsingResume || !importText}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-green-gradient disabled:opacity-50 flex items-center gap-1.5"
              >
                {parsingResume ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Parse Resume text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: AI Suggestion Review & Apply */}
      {aiSuggestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 text-emerald-700">
                <Sparkles className="w-4 h-4" /> Review AI Optimization
              </h3>
              <button onClick={() => setAiSuggestion(null)} className="p-1 rounded hover:bg-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-400 uppercase mb-1">Original Text</h4>
                <div className="p-3 bg-slate-50 border rounded-xl text-slate-600 whitespace-pre-wrap">{aiSuggestion.original}</div>
              </div>
              <div>
                <h4 className="font-bold text-emerald-600 uppercase mb-1 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> AI Recommended Text
                </h4>
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-slate-700 font-medium whitespace-pre-wrap">{aiSuggestion.suggested}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                onClick={() => setAiSuggestion(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                Reject Changes
              </button>
              <button 
                onClick={applyAISuggestion}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-green-gradient"
              >
                Accept & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded print helper CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #resume-preview-sheet, #resume-preview-sheet * {
            visibility: visible;
          }
          #resume-preview-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            transform: scale(1) !important;
            box-shadow: none !important;
          }
        }
      `}} />
    </div>
  );
}

// Reusable alert component placeholder fallback
const ShieldAlert = (props: any) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);
