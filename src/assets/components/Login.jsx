import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "./firebase";

const auth = getAuth(app);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const adminEmails = ["admin@gmail.com", "vyaparadmin@gmail.com"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (adminEmails.includes(user.email)) {
        navigate("/admin");
        return;
      }

      navigate("/dashboard", { state: { userEmail: user.email } });
    } catch (err) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
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
              style={{ background: "#f1f5f9" }}
            />
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold text-white"
            style={{
              background: "linear-gradient(135deg, #0d6efd, #6610f2)",
              padding: "12px 0",
              borderRadius: "50px",
              boxShadow: "0 4px 15px rgba(13, 110, 253, 0.4)",
              fontSize: "1.1rem",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) =>
              (e.target.style.boxShadow = "0 6px 20px rgba(13, 110, 253, 0.6)")
            }
            onMouseOut={(e) =>
              (e.target.style.boxShadow = "0 4px 15px rgba(13, 110, 253, 0.4)")
            }
          >
            Login
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
