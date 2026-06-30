import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./pages/Login.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationLink, setVerificationLink] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setVerificationLink("");

    if (!email.endsWith("@lru.ac.th")) {
      setError("ต้องใช้ Email @lru.ac.th เท่านั้น");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:3002/api/register", {
        name,
        email,
        password,
        phone,
      });

      setMessage(res.data.message);
      setVerificationLink(res.data.verificationLink || "");
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("สมัครสมาชิกไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">Register</div>
          <h2>ลงทะเบียน</h2>
        </div>

        {error && <p className="auth-message error">{error}</p>}
        {message && <p className="auth-message success">{message}</p>}
        {verificationLink && (
          <a className="dev-link" href={verificationLink}>
            เปิดลิงก์ยืนยันสำหรับทดสอบ
          </a>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="icon">ชื่อ</span>
            <input
              type="text"
              placeholder="ชื่อ - นามสกุล"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">อีเมล</span>
            <input
              type="email"
              placeholder="Email (@lru.ac.th)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">รหัสผ่าน</span>
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <span className="icon">โทร</span>
            <input
              type="tel"
              placeholder="เบอร์โทร"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <button className="text-btn" onClick={() => navigate("/login")}>
          กลับไปหน้า Login
        </button>
      </div>
    </div>
  );
}

export default Register;
