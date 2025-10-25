import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";
import { app } from "./firebase";

const auth = getAuth(app);
const db = getDatabase(app);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const adminEmails = ["admin@gmail.com", "vyaparadmin@gmail.com"];

  // Save agent email to database - FIXED VERSION
  const saveAgentEmail = async (user) => {
    if (!user?.email) return;
    try {
      const agentRef = ref(db, `agents/${user.uid}`);
      const snapshot = await get(agentRef);
      const existingData = snapshot.val() || {};
      
      // Use set() instead of update() to ensure the data is created if it doesn't exist
      await set(agentRef, { 
        email: user.email,
        mobile: existingData.mobile || "",
        lastLogin: new Date().toISOString(),
        registrations: existingData.registrations || {} // Preserve existing registrations
      });
      console.log(`✅ Email saved for agent: ${user.email}`);
    } catch (error) {
      console.error("Error saving email:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if admin first
      if (adminEmails.includes(user.email)) {
        setLoading(false);
        navigate("/admin");
        return; // Exit here, don't save email or navigate to dashboard
      }

      // Save email for agents (this now properly creates/updates the agent entry)
      await saveAgentEmail(user);

      // Navigate to agent dashboard
      setLoading(false);
      navigate("/dashboard", { state: { userEmail: user.email } });
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100 p-3"
      style={{
        background: "linear-gradient(135deg, #e0f7fa, #80deea)",
      }}
    >
      <div
        className="card shadow-lg p-4 p-md-5"
        style={{
          maxWidth: "400px",
          width: "100%",
          borderRadius: "20px",
          border: "none",
          background: "#ffffffcc",
          backdropFilter: "blur(10px)",
        }}
      >
        <h3
          className="text-center fw-bold mb-4"
          style={{ color: "#0d6efd", letterSpacing: "1px", fontSize: "1.5rem" }}
        >
          VyaparSetu Login
        </h3>

        {error && (
          <div
            className="alert alert-danger rounded-3 py-2"
            style={{ fontSize: "0.9rem" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-3">
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control form-control-lg rounded-pill border-0 shadow-sm"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ background: "#f1f5f9" }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control form-control-lg rounded-pill border-0 shadow-sm"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ background: "#f1f5f9" }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold text-white"
            disabled={loading}
            style={{
              background: loading 
                ? "linear-gradient(135deg, #6c757d, #495057)" 
                : "linear-gradient(135deg, #0d6efd, #6610f2)",
              padding: "12px 0",
              borderRadius: "50px",
              boxShadow: "0 4px 15px rgba(13, 110, 253, 0.4)",
              fontSize: "1.1rem",
              transition: "all 0.3s ease",
              cursor: loading ? "not-allowed" : "pointer"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.boxShadow = "0 6px 20px rgba(13, 110, 253, 0.6)";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.boxShadow = "0 4px 15px rgba(13, 110, 253, 0.4)";
              }
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p
          className="text-center text-muted mt-3"
          style={{ fontSize: "0.85rem" }}
        >
          &copy; 2025 VyaparSetu. Made by Chirag Kashyap Rajput
        </p>
      </div>
    </div>
  );
}