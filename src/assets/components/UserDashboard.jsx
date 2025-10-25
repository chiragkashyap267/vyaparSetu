import React, { useState, useEffect, useMemo } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, push, onValue, update, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";

// Firebase setup
const auth = getAuth();
const db = getDatabase();

// --- Primary Button Component ---
const PrimaryButton = ({ onClick, children, type = "button", className = "", disabled = false }) => (
  <button type={type} onClick={onClick} className={`btn btn-primary fw-semibold rounded-pill ${className}`} disabled={disabled}>
    {children}
  </button>
);

// --- Status Badge Component ---
const StatusBadge = ({ status, type }) => {
  let color = "bg-secondary";
  if (type === "payment") color = status.includes("Paid") ? "bg-success" : "bg-warning text-dark";
  else if (type === "document") color = status.includes("Collected") ? "bg-info text-dark" : "bg-danger";
  return <span className={`badge rounded-pill px-2 px-md-3 py-1 py-md-2 ${color}`}>{status}</span>;
};

// --- Convert File to Base64 ---
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// --- Registration Modal ---
const RegistrationModal = ({ isOpen, onClose, addRegistration }) => {
  const getCurrentDateTime = () => new Date().toISOString().slice(0, 16);
  const [formData, setFormData] = useState({
    customerName: "",
    shopName: "",
    phone: "",
    email: "",
    gst: "No",
    registrationDateTime: getCurrentDateTime(),
    paymentStatus: "Pending",
    documentStatus: "Pending",
    paymentScreenshot: "",
    otherDocuments: "",
  });

  const [selectedFiles, setSelectedFiles] = useState({ paymentScreenshot: null, otherDocuments: null });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files && files[0] ? files[0] : null;
    setSelectedFiles((prev) => ({ ...prev, [name]: file }));
  };

  const resetForm = () => {
    setFormData({
      customerName: "",
      shopName: "",
      phone: "",
      email: "",
      gst: "No",
      registrationDateTime: getCurrentDateTime(),
      paymentStatus: "Pending",
      documentStatus: "Pending",
      paymentScreenshot: "",
      otherDocuments: "",
    });
    setSelectedFiles({ paymentScreenshot: null, otherDocuments: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const paymentBase64 = await fileToBase64(selectedFiles.paymentScreenshot);
      const documentsBase64 = await fileToBase64(selectedFiles.otherDocuments);
      const dataToSave = { ...formData, paymentScreenshot: paymentBase64, otherDocuments: documentsBase64 };
      await addRegistration(dataToSave);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isSubmittingDisabled = loading;

  return (
    <div className="modal d-block fade show" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content rounded-4 shadow-lg">
          <div className="modal-header bg-primary text-white border-bottom-0">
            <h5 className="modal-title fw-bold">Add New Seller Registration</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Customer Name</label>
                <input type="text" className="form-control rounded-pill" name="customerName" value={formData.customerName} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Shop Name</label>
                <input type="text" className="form-control rounded-pill" name="shopName" value={formData.shopName} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Phone</label>
                <input type="tel" maxLength={10} className="form-control rounded-pill" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Email ID</label>
                <input type="email" className="form-control rounded-pill" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">GST Registered</label>
                <select name="gst" className="form-select rounded-pill" value={formData.gst} onChange={handleChange}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold">Registration Date & Time</label>
                <input type="datetime-local" className="form-control rounded-pill" name="registrationDateTime" value={formData.registrationDateTime} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Payment Status</label>
                <select name="paymentStatus" className="form-select rounded-pill" value={formData.paymentStatus} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="Paid (Offline)">Paid (Offline)</option>
                  <option value="Paid (Online)">Paid (Online)</option>
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Payment Screenshot</label>
                <input type="file" className="form-control rounded-pill" name="paymentScreenshot" onChange={handleFileChange} accept="image/*" />
                <small className="form-text text-muted">{selectedFiles.paymentScreenshot ? `File: ${selectedFiles.paymentScreenshot.name}` : "No file selected."}</small>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Other Documents</label>
                <input type="file" className="form-control rounded-pill" name="otherDocuments" onChange={handleFileChange} />
                <small className="form-text text-muted">{selectedFiles.otherDocuments ? `File: ${selectedFiles.otherDocuments.name}` : "No file selected."}</small>
              </div>

              <div className="col-12 pt-3">
                <PrimaryButton type="submit" className="w-100 py-2" disabled={isSubmittingDisabled}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
export default function UserDashboard({ userEmail }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Track user auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) navigate("/");
      else setUser(currentUser);
    });
    return unsubscribe;
  }, [navigate]);

  // Fetch registrations
  useEffect(() => {
    if (!user) return;
    const registrationsRef = ref(db, `agents/${user.uid}/registrations`);
    return onValue(registrationsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const formatted = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      formatted.sort((a, b) => new Date(b.registrationDateTime) - new Date(a.registrationDateTime));
      setRegistrations(formatted);
    });
  }, [user]);

  const addRegistration = async (reg) => {
    if (!user) return;
    await push(ref(db, `agents/${user.uid}/registrations`), reg);
  };

  const deleteRegistration = async (id) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this registration?")) {
      await remove(ref(db, `agents/${user.uid}/registrations/${id}`));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/");
  };

  const stats = useMemo(() => {
    const total = registrations.length;
    const paid = registrations.filter((r) => r.paymentStatus.includes("Paid")).length;
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [registrations]);

  const displayName = userEmail ? userEmail.split("@")[0] : user?.email?.split("@")[0] || "Agent";

  return (
    <div className="bg-light min-vh-100 font-sans">
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-primary shadow-sm sticky-top">
        <div className="container-fluid d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 py-2">
          <span className="navbar-brand fw-bold fs-5 text-uppercase tracking-wider">VyaparSetu Agent Dashboard</span>
          <div className="d-flex align-items-center gap-3 ms-md-auto">
            <span className="text-white small d-none d-md-inline-block">
              Logged in as: <strong>{displayName}</strong>
            </span>
            <button onClick={handleLogout} className="btn btn-outline-light btn-sm fw-semibold rounded-pill px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4 py-md-5">
        <h4 className="fw-bold text-primary mb-4 text-center text-md-start">Welcome, {displayName}</h4>

        {/* Stats */}
        <div className="row g-3 mb-5 text-center">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 p-4 rounded-3">
              <h6 className="text-muted text-uppercase small mb-2">Total Registrations</h6>
              <h2 className="fw-extrabold text-primary">{stats.total}</h2>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 p-4 rounded-3">
              <h6 className="text-muted text-uppercase small mb-2">Payment Paid</h6>
              <h2 className="fw-extrabold text-success">{stats.paid}</h2>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 p-4 rounded-3">
              <h6 className="text-muted text-uppercase small mb-2">Payment Unpaid</h6>
              <h2 className="fw-extrabold text-danger">{stats.unpaid}</h2>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-3">
          <PrimaryButton onClick={() => setIsModalOpen(true)}>Add New Registration</PrimaryButton>
        </div>

        {/* Registrations Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover align-middle text-center">
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Shop</th>
                <th>Phone</th>
                <th>Email</th>
                <th>GST</th>
                <th>Reg. DateTime</th>
                <th>Payment</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="align-middle">
              {registrations.map((reg, index) => (
                <tr key={reg.id}>
                  <td>{index + 1}</td>
                  <td>{reg.customerName}</td>
                  <td>{reg.shopName}</td>
                  <td>{reg.phone}</td>
                  <td>{reg.email}</td>
                  <td>{reg.gst}</td>
                  <td>{new Date(reg.registrationDateTime).toLocaleString()}</td>
                  <td>
                    <StatusBadge status={reg.paymentStatus} type="payment" />
                    {reg.paymentScreenshot && (
                      <div className="mt-1">
                        <img src={reg.paymentScreenshot} alt="Payment Screenshot" className="img-fluid rounded" style={{ maxWidth: "100px" }} />
                      </div>
                    )}
                  </td>
                  <td>
                    {reg.otherDocuments ? (
                      <div className="mt-1">
                        <img src={reg.otherDocuments} alt="Other Documents" className="img-fluid rounded" style={{ maxWidth: "100px" }} />
                      </div>
                    ) : (
                      <StatusBadge status="Pending" type="document" />
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center">
                      <button className="btn btn-sm btn-danger" onClick={() => deleteRegistration(reg.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && <RegistrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} addRegistration={addRegistration} />}
    </div>
  );
}