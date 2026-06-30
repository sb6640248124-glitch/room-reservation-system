import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./pages/Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      setError("ไม่พบลิงก์สำหรับตั้งรหัสผ่านใหม่");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://room-reservation-system-production.up.railway.app/api/reset-password",
        { token, password }
      );
      setMessage(res.data.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "ตั้งรหัสผ่านใหม่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">Password</div>
          <h2>ตั้งรหัสผ่านใหม่</h2>
        </div>

        {error && <p className="auth-message error">{error}</p>}
        {message && <p className="auth-message success">{message}</p>}

        {!message && (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="icon">*</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="รหัสผ่านใหม่"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span className="icon">*</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              แสดงรหัสผ่าน
            </label>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </form>
        )}

        <button className="text-btn" onClick={() => navigate("/login")}>
          ไปหน้า Login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;
