import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    try {
      const res = await fetch("http://localhost:3002/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">Login</div>
          <h2>เข้าสู่ระบบ</h2>
        </div>

        <div className="input-group">
          <span className="icon">@</span>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <span className="icon">*</span>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="login-btn" onClick={handleLogin}>
          เข้าสู่ระบบ
        </button>

        <button
          type="button"
          className="forgot-password-btn"
          onClick={() => navigate("/forgot-password")}
        >
          ลืมรหัสผ่าน?
        </button>

        <div className="register-text">
          ผู้ใช้งานใหม่{" "}
          <span onClick={() => navigate("/register")}>ลงทะเบียน</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
