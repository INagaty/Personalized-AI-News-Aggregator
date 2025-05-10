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
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState("");
  const history = useHistory();

  const handleSelectPreference = (pref) => {
    if (!preferences.includes(pref)) {
      setPreferences([...preferences, pref]);
    }
  };

  const handleRemovePreference = (pref) => {
    setPreferences(preferences.filter((p) => p !== pref));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/v1/auth/signup", {
        name,
        email,
        password,
        passwordConfirm,
        preferences,
      });
      alert("Signup successful. Please log in.");
      history.push("/login");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Signup failed. Please try again.";
      setError(message);
    }
  };

  return (
    <div style={styles.signupWrapper}>
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

          <div className="dropdown">
            <div
              className="dropdown-header"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              Select Preferences ▾
            </div>
            {dropdownOpen && (
              <div className="dropdown-options">
                {preferencesList.map((pref) => (
                  <div
                    key={pref}
                    onClick={() => handleSelectPreference(pref)}
                    className="dropdown-item"
                  >
                    {pref}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="selected-preferences">
            {preferences.map((pref) => (
              <span key={pref} className="tag">
                {pref}{" "}
                <span onClick={() => handleRemovePreference(pref)}>✕</span>
              </span>
            ))}
          </div>

          <button type="submit">Sign Up</button>
        </form>
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        <p>
          Already have an account?{" "}
          <span onClick={() => history.push("/login")} className="link">
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  signupWrapper: {
    backgroundColor: "#8B0000", // Dark red
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default Landing;
