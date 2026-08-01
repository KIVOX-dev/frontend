"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";

type Drive = {
  id: string;
  title: string;
  company_name: string;
  location?: string;
  job_type: string;
  status: string;
  application_deadline?: string;
  created_at?: string;
  applicant_count: number;
};

type Application = {
  id: string;
  placement_id: string;
  status: string;
  created_at?: string;
};

type PlacementRecord = {
  id: string;
  student_id: string;
  company_name: string;
  role: string;
  salary_lpa?: number;
  work_type?: string;
  mode?: string;
  location?: string;
  proof_url?: string;
  verification_status: string;
  created_at?: string;
};

const OPEN_STATUSES = ["open", "active"];

const STATUS_BADGE: Record<string, string> = {
  applied: "bb",
  shortlisted: "ba",
  interview: "ba",
  selected: "bg",
  rejected: "br",
  withdrawn: "br",
};

const VERIFICATION_BADGE: Record<string, string> = {
  pending: "ba",
  verified: "bg",
  rejected: "br",
};

const REPORT_FORM_DEFAULT = {
  company_name: "",
  role: "",
  salary_lpa: "",
  work_type: "onsite",
  mode: "campus",
  location: "",
  proof_url: "",
};

export function PlacementOpportunities() {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [records, setRecords] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState(REPORT_FORM_DEFAULT);
  const [reportMsg, setReportMsg] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const load = useCallback(async () => {
    try {
      const [drivesRes, appsRes] = await Promise.all([
        api.get<Drive[]>("/placements/drives"),
        api.get<Application[]>("/placement-applications"),
      ]);
      setDrives(drivesRes.data || []);
      setApplications(appsRes.data || []);

      const profileRes = await api.get<{ id: string }>("/students/profile").catch(() => null);
      if (profileRes?.data?.id) {
        const recordsRes = await api.get<PlacementRecord[]>(`/placement-records/student/${profileRes.data.id}`);
        setRecords(recordsRes.data || []);
      }
    } catch {
      setMsg("Failed to load placement opportunities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applicationByDrive = useMemo(() => {
    const map = new Map<string, Application>();
    for (const app of applications) map.set(app.placement_id, app);
    return map;
  }, [applications]);

  const handleApply = async (drive: Drive) => {
    setBusyId(drive.id);
    setMsg("");
    try {
      const res = await api.post<Application>("/placement-applications", { placement_id: drive.id });
      setApplications((prev) => [...prev, res.data]);
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setBusyId(null);
    }
  };

  const handleWithdraw = async (application: Application) => {
    setBusyId(application.id);
    setMsg("");
    try {
      await api.patch(`/placement-applications/${application.id}/status`, { status: "withdrawn" });
      setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, status: "withdrawn" } : a)));
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Failed to withdraw application.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.company_name.trim() || !reportForm.role.trim() || !reportForm.salary_lpa) {
      setReportMsg("Company, role, and salary are required.");
      return;
    }
    setSubmittingReport(true);
    setReportMsg("");
    try {
      const res = await api.post<PlacementRecord>("/placement-records", {
        company_name: reportForm.company_name.trim(),
        role: reportForm.role.trim(),
        salary_lpa: parseFloat(reportForm.salary_lpa),
        work_type: reportForm.work_type,
        mode: reportForm.mode,
        location: reportForm.location.trim() || undefined,
        proof_url: reportForm.proof_url.trim() || undefined,
      });
      setRecords((prev) => [res.data, ...prev]);
      setShowReportForm(false);
      setReportForm(REPORT_FORM_DEFAULT);
    } catch (err: any) {
      setReportMsg(err.response?.data?.message || "Failed to submit your placement. Please check the details and try again.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const drivesById = useMemo(() => new Map(drives.map((d) => [d.id, d])), [drives]);

  return (
    <div className="screen active" id="screen-placements">
      <div className="hero" style={{ padding: "28px 32px" }}>
        <div className="hero-title" style={{ fontSize: "28px" }}>
          Placement Opportunities
        </div>
        <div className="hero-sub">
          Browse drives your institution has posted and track the status of every application you submit.
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px", margin: "16px 0", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>
          {msg}
        </div>
      )}

      <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
        <div className="ct">Open Drives</div>
        {loading ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>Loading drives...</div>
        ) : drives.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            No placement drives have been posted by your institution yet.
          </div>
        ) : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Company</th>
                <th style={{ padding: "12px 8px" }}>Location</th>
                <th style={{ padding: "12px 8px" }}>Deadline</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {drives.map((d) => {
                const application = applicationByDrive.get(d.id);
                const isOpen = OPEN_STATUSES.includes(d.status);
                const deadlinePassed = d.application_deadline ? new Date(d.application_deadline) < new Date() : false;

                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>{d.title}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{d.company_name}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{d.location || "—"}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>
                      {d.application_deadline ? new Date(d.application_deadline).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${isOpen && !deadlinePassed ? "bg" : "br"}`}>
                        {deadlinePassed ? "Closed" : d.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      {application ? (
                        application.status === "applied" ? (
                          <button
                            className="btn btn-o btn-sm"
                            disabled={busyId === application.id}
                            onClick={() => handleWithdraw(application)}
                          >
                            {busyId === application.id ? "..." : "Withdraw"}
                          </button>
                        ) : (
                          <span className={`badge ${STATUS_BADGE[application.status] || "bb"}`}>{application.status}</span>
                        )
                      ) : isOpen && !deadlinePassed ? (
                        <button className="btn btn-p btn-sm" disabled={busyId === d.id} onClick={() => handleApply(d)}>
                          {busyId === d.id ? "..." : "Apply"}
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
        <div className="ct">My Applications</div>
        {applications.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
            You haven&apos;t applied to any drives yet.
          </div>
        ) : (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Company</th>
                <th style={{ padding: "12px 8px" }}>Applied On</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => {
                const drive = drivesById.get(a.placement_id);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 8px", fontWeight: 500 }}>{drive?.title || "—"}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{drive?.company_name || "—"}</td>
                    <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "12px 8px" }}>
                      <span className={`badge ${STATUS_BADGE[a.status] || "bb"}`}>{a.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: "24px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="ct" style={{ marginBottom: 0 }}>Report Your Placement</div>
          <button className="btn btn-p btn-sm" onClick={() => { setShowReportForm((v) => !v); setReportMsg(""); }}>
            {showReportForm ? "Cancel" : "+ Report Placement"}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", margin: "8px 0 0" }}>
          Got placed outside a drive posted here? Tell your college the company, role, and LPA so it counts toward your placement record.
        </p>

        {showReportForm && (
          <form onSubmit={handleReportSubmit} style={{ marginTop: "18px" }}>
            {reportMsg && (
              <div style={{ padding: "10px", marginBottom: "12px", background: "var(--bg)", borderRadius: "8px", color: "var(--accent)", fontSize: "14px" }}>
                {reportMsg}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label className="lbl">Company</label>
                <input type="text" className="fi" value={reportForm.company_name} onChange={(e) => setReportForm({ ...reportForm, company_name: e.target.value })} required placeholder="e.g. TCS" />
              </div>
              <div>
                <label className="lbl">Role</label>
                <input type="text" className="fi" value={reportForm.role} onChange={(e) => setReportForm({ ...reportForm, role: e.target.value })} required placeholder="e.g. Software Engineer" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label className="lbl">Salary (LPA)</label>
                <input type="number" step="0.1" min="0" className="fi" value={reportForm.salary_lpa} onChange={(e) => setReportForm({ ...reportForm, salary_lpa: e.target.value })} required placeholder="e.g. 6.5" />
              </div>
              <div>
                <label className="lbl">Location</label>
                <input type="text" className="fi" value={reportForm.location} onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })} placeholder="e.g. Bengaluru" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label className="lbl">Work Type</label>
                <select className="fi" value={reportForm.work_type} onChange={(e) => setReportForm({ ...reportForm, work_type: e.target.value })}>
                  <option value="onsite">Onsite</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="lbl">Mode</label>
                <select className="fi" value={reportForm.mode} onChange={(e) => setReportForm({ ...reportForm, mode: e.target.value })}>
                  <option value="campus">Campus</option>
                  <option value="off-campus">Off-Campus</option>
                  <option value="pool">Pool</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label className="lbl">Proof Link (Optional)</label>
              <input type="url" className="fi" value={reportForm.proof_url} onChange={(e) => setReportForm({ ...reportForm, proof_url: e.target.value })} placeholder="Link to offer letter (Drive, etc.)" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-p" disabled={submittingReport}>
                {submittingReport ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        )}

        {records.length > 0 && (
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", marginTop: "20px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                <th style={{ padding: "12px 8px" }}>Company</th>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>LPA</th>
                <th style={{ padding: "12px 8px" }}>Location</th>
                <th style={{ padding: "12px 8px" }}>Verification</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500 }}>{r.company_name}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{r.role}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{r.salary_lpa ?? "—"}</td>
                  <td style={{ padding: "12px 8px", color: "var(--muted)", fontSize: "14px" }}>{r.location || "—"}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span className={`badge ${VERIFICATION_BADGE[r.verification_status] || "bb"}`}>{r.verification_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
