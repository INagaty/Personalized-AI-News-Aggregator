import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous error

    try {
      const res = await axios.post("http://localhost:8000/api/v1/auth/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      history.push("/news");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setError(message);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#8B0000",
        minHeight: "100vh",
        paddingTop: "60px",
      }}
    >
      <div className="auth-container">
        <h2>Sign In</h2>
        <form onSubmit={handleLogin}>
          <input
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
        <p>
          Don’t have an account?{" "}
          <span
            className="link"
            onClick={() => history.push("/")}
            style={{ color: "blue", cursor: "pointer" }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
