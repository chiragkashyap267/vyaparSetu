import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getDatabase, ref, get, remove, update } from "firebase/database";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { app } from "./firebase";
import "../components/Admin.css";

const auth = getAuth(app);
const db = getDatabase(app);

// --- Reusable Button ---
const PrimaryButton = ({ children, onClick, className = "", type = "button" }) => (
  <button
    className={`btn btn-primary fw-bold shadow-sm ${className}`}
    onClick={onClick}
    type={type}
    style={{
      borderRadius: "0.6rem",
      transition: "all 0.3s",
      padding: "0.45rem 1rem",
      letterSpacing: "0.5px",
      fontSize: "0.9rem",
    }}
  >
    {children}
  </button>
);

// --- Status Badge ---
const StatusBadge = ({ status, type, uploaded }) => {
  if (type === "document" && uploaded) return null;
  let bgColor = "bg-secondary",
    textColor = "text-dark";

  if (type === "payment") {
    if (status?.includes("Paid")) {
      bgColor = "bg-success";
      textColor = "text-white";
    } else {
      bgColor = "bg-warning";
      textColor = "text-dark";
    }
  } else if (type === "document") {
    if (status?.includes("Collected")) {
      bgColor = "bg-info";
      textColor = "text-dark";
    } else {
      bgColor = "bg-danger";
      textColor = "text-white";
    }
  }

  return (
    <span
      className={`badge rounded-pill px-2 px-md-3 py-1 fw-bold ${bgColor} ${textColor}`}
      style={{ fontSize: "0.8rem", letterSpacing: "0.5px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}
    >
      {status || "N/A"}
    </span>
  );
};

// --- Helper: open Base64 in new tab ---
const openBase64InNewTab = (base64Data) => {
  try {
    fetch(base64Data)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      });
  } catch (e) {
    alert("Unable to open file.");
  }
};

// --- Helper for PDF clickable links ---
const createPDFLink = (doc, text, x, y, url) => {
  if (!url) return;
  doc.setTextColor(0, 0, 255);
  doc.textWithLink(text, x, y, { url });
};

export default function AdminDashboard() {
  const [agents, setAgents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agentNumbers, setAgentNumbers] = useState({});

  // --- Fetch Agents & Registrations ---
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await get(ref(db, "agents"));
      const data = snapshot.val() || {};
      const currentUser = auth.currentUser;

      const agentList = Object.keys(data).map((uid) => {
        // Use email from DB, fallback to Auth user email if same UID
        const email = data[uid].email || (currentUser?.uid === uid ? currentUser.email : "Unknown");
        const namePart = email ? email.split("@")[0] : "Unknown";
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();

        return {
          id: uid,
          agentName: formattedName,
          email,
          mobile: data[uid].mobile || "",
          registrations: data[uid].registrations
            ? Object.entries(data[uid].registrations).map(([key, value]) => ({
                id: key,
                paymentURL: value.paymentURL || "",
                documentURL: value.documentURL || "",
                ...value,
              }))
            : [],
        };
      });

      setAgents(agentList);
      setAgentNumbers(agentList.reduce((acc, agent) => ({ ...acc, [agent.id]: agent.mobile || "" }), {}));

      const allRegs = agentList.flatMap((a) =>
        a.registrations.map((r) => ({ ...r, agentName: a.agentName, agentEmail: a.email, agentUid: a.id }))
      );
      setRegistrations(allRegs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // --- Logout ---
  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  // --- Delete Registration ---
  const deleteRegistration = async (agentUid, regId) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;
    await remove(ref(db, `agents/${agentUid}/registrations/${regId}`));
    fetchAgents();
  };

  // --- Save Agent Number ---
  const saveAgentNumber = async (agentId) => {
    const number = agentNumbers[agentId];
    if (!number) return alert("Please enter a valid number!");
    setSaving(true);
    await update(ref(db, `agents/${agentId}`), { mobile: number });
    setSaving(false);
    alert("Agent number saved!");
    fetchAgents();
  };

  // --- Export PDF ---
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("VyaparSetu Agents Registrations Report", 40, 40);

    const columns = [
      "Agent",
      "Email",
      "Customer",
      "Shop",
      "Phone",
      "Customer Email",
      "GST",
      "DateTime",
      "Payment",
      "Documents",
    ];

    const rows = registrations.map((r) => [
      r.agentName,
      r.agentEmail || r.agentUid,
      r.customerName,
      r.shopName,
      r.phone,
      r.email || "N/A",
      r.gst || "N/A",
      r.registrationDateTime || "N/A",
      r.paymentURL ? "View Payment" : "N/A",
      r.documentURL ? "View Document" : "N/A",
    ]);

    autoTable(doc, {
      startY: 60,
      head: [columns],
      body: rows,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [63, 81, 181], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
      didDrawCell: (data) => {
        if (data.section === "head") return;
        const reg = registrations[data.row.index];
        if (!reg) return;

        const cell = data.cell;
        const x = cell.x + 2;
        const y = cell.y + cell.height / 2 + 3;

        if (data.column.index === 8 && reg.paymentURL) createPDFLink(doc, "View Payment", x, y, reg.paymentURL);
        if (data.column.index === 9 && reg.documentURL) createPDFLink(doc, "View Document", x, y, reg.documentURL);
      },
    });

    doc.save("VyaparSetu_Registrations.pdf");
  };

  // --- Agent Stats ---
  const agentStats = useMemo(
    () =>
      agents.map((a) => {
        const total = a.registrations.length;
        const paid = a.registrations.filter((r) => r.paymentStatus?.includes("Paid")).length;
        const pending = total - paid;
        return { ...a, total, paid, pending };
      }),
    [agents]
  );

  return (
    <div className="container-fluid py-3 py-md-4 bg-light min-vh-100">
      <h1 className="fw-bold text-primary mb-4 text-center text-md-start">Admin Dashboard</h1>

      {/* Action Buttons */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
        <div className="text-muted small">
          {loading ? "Loading..." : `${agents.length} agents, ${registrations.length} registrations`}
        </div>
        <PrimaryButton className="btn-sm" onClick={exportPDF}>
          Download PDF
        </PrimaryButton>
      </div>

      {/* Agent Stats */}
      <div className="row g-3 mb-4">
        {agentStats.map((agent) => (
          <div key={agent.id} className="col-12 col-sm-6 col-md-4">
            <div className="card shadow-sm p-3 h-100 border-0" style={{ borderRadius: "1rem" }}>
              <h6 className="fw-bold text-capitalize mb-1">{agent.agentName}</h6>
              <p className="mb-1 small">
                {agent.email ? (
                  <a href={`mailto:${agent.email}`} className="text-decoration-none text-primary fw-bold">
                    {agent.email}
                  </a>
                ) : (
                  <span className="text-muted">No Email</span>
                )}
              </p>

              {agent.mobile ? (
                <p className="mb-2 small">
                  <strong>📞 </strong>
                  <a href={`tel:${agent.mobile}`} className="text-decoration-none text-success fw-bold">
                    {agent.mobile}
                  </a>
                </p>
              ) : (
                <div className="d-flex gap-2 mb-2">
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    placeholder="Enter number"
                    value={agentNumbers[agent.id] || ""}
                    onChange={(e) => setAgentNumbers({ ...agentNumbers, [agent.id]: e.target.value })}
                  />
                  <button className="btn btn-sm btn-outline-primary" onClick={() => saveAgentNumber(agent.id)} disabled={saving}>
                    Save
                  </button>
                </div>
              )}

              <p className="mb-1 small">Total Forms: {agent.total}</p>
              <p className="mb-0 small">
                <span className="text-success">Paid: {agent.paid}</span> | <span className="text-warning">Pending: {agent.pending}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Registrations Table */}
      <div className="card shadow-lg p-2 p-md-3 mb-4 border-0" style={{ borderRadius: "1rem" }}>
        <div className="table-responsive rounded">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead className="bg-primary text-white">
              <tr>
                <th>Agent</th>
                <th>Email</th>
                <th>Customer</th>
                <th>Shop</th>
                <th>Phone</th>
                <th>Customer Email</th>
                <th>GST</th>
                <th>DateTime</th>
                <th>Payment</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center text-muted py-3">
                    No data.
                  </td>
                </tr>
              ) : (
                registrations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.agentName}</td>
                    <td>{r.agentEmail || <span className="text-muted">{r.agentUid}</span>}</td>
                    <td>{r.customerName}</td>
                    <td>{r.shopName}</td>
                    <td>{r.phone}</td>
                    <td>{r.email || <span className="text-muted">N/A</span>}</td>
                    <td>{r.gst || <span className="text-muted">N/A</span>}</td>
                    <td>{r.registrationDateTime || <span className="text-muted">N/A</span>}</td>
                    <td>
                      <StatusBadge status={r.paymentStatus} type="payment" />
                      {r.paymentScreenshot && (
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => openBase64InNewTab(r.paymentScreenshot)}>
                            View Payment
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={r.documentStatus} type="document" uploaded={!!r.otherDocuments} />
                      {r.otherDocuments && (
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-success" onClick={() => openBase64InNewTab(r.otherDocuments)}>
                            View Document
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRegistration(r.agentUid, r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-center justify-content-md-start mb-5">
        <PrimaryButton onClick={handleLogout}>Logout</PrimaryButton>
      </div>

      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
    </div>
  );
}