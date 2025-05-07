import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

const preferencesList = [
  "technology",
  "sports",
  "business",
  "entertainment",
  "health",
];

const Landing = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState(""); // ✅ NEW
  const [preferences, setPreferences] = useState([]);
  const [error, setError] = useState(""); // ✅ For displaying errors
  const history = useHistory();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // clear previous error

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/signup",
        {
          name,
          email,
          password,
          passwordConfirm,
          preferences,
        }
      );
      alert("Signup successful. Please log in.");
      history.push("/login");
    } catch (err) {
      console.error("Signup failed:", err.response?.data || err.message);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Signup failed. Please try again.";
      setError(message); // ✅ Display meaningful error
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
        />
        <label>Preferences:</label>
        <select
          multiple
          value={preferences}
          onChange={(e) =>
            setPreferences([...e.target.selectedOptions].map((o) => o.value))
          }
        >
          {preferencesList.map((pref) => (
            <option key={pref} value={pref}>
              {pref}
            </option>
          ))}
        </select>
        <button type="submit">Sign Up</button>
      </form>
      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}{" "}
      {/* ✅ Error Display */}
      <p>
        Already have an account?{" "}
        <span
          onClick={() => history.push("/login")}
          className="link"
          style={{ cursor: "pointer", color: "blue" }}
        >
          Sign In
        </span>
      </p>
    </div>
  );
};

export default Landing;
