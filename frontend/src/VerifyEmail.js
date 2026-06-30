import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./pages/Login.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("กำลังยืนยันอีเมล...");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setMessage("ไม่พบลิงก์ยืนยันอีเมล");
      return;
    }

    axios
      .get(`http://localhost:3002/api/verify-email?token=${token}`)
      .then((res) => {
        setIsSuccess(true);
        setMessage(res.data.message);
      })
      .catch((err) => {
        setMessage(err.response?.data?.message || "ยืนยันอีเมลไม่สำเร็จ");
      });
  }, [searchParams]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">Verify</div>
          <h2>ยืนยันอีเมล</h2>
        </div>

        <p className={`auth-message ${isSuccess ? "success" : "error"}`}>
          {message}
        </p>

        <button className="login-btn" onClick={() => navigate("/login")}>
          ไปหน้า Login
        </button>
      </div>
    </div>
  );
}

export default VerifyEmail;
