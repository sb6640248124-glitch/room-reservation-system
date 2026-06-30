import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./pages/Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setResetLink("");

    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3002/api/forgot-password",
        { email }
      );
      setMessage(res.data.message);
      setResetLink(res.data.resetLink || "");
    } catch (err) {
      setError(
        err.response?.data?.message || "ดำเนินการลืมรหัสผ่านไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">Reset</div>
          <h2>ลืมรหัสผ่าน</h2>
        </div>

        {error && <p className="auth-message error">{error}</p>}
        {message && <p className="auth-message success">{message}</p>}
        {resetLink && (
          <a className="dev-link" href={resetLink}>
            เปิดลิงก์ตั้งรหัสผ่านสำหรับทดสอบ
          </a>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="icon">@</span>
            <input
              type="email"
              placeholder="Email (@lru.ac.th)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่าน"}
          </button>
        </form>

        <button className="text-btn" onClick={() => navigate("/login")}>
          กลับไปหน้า Login
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;
