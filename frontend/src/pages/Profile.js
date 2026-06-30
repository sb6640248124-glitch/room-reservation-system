import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainMenuTabs from "../components/MainMenuTabs";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const storedUser = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storedUser?.user_id) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`https://room-reservation-system-production.up.railway.app/api/users/${storedUser.user_id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "โหลดข้อมูลส่วนตัวไม่สำเร็จ");
        }

        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          password: data.password || "",
          phone: data.phone || "",
        });
      } catch (err) {
        setError(err.message || "โหลดข้อมูลส่วนตัวไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, storedUser]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.password || !form.phone) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await fetch(
        `https://room-reservation-system-production.up.railway.app/api/users/${storedUser.user_id}/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: form.full_name,
            email: form.email,
            password: form.password,
            phone: form.phone,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "บันทึกข้อมูลส่วนตัวไม่สำเร็จ");
      }

      const updatedUser = {
        ...storedUser,
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage(data.message || "บันทึกข้อมูลส่วนตัวสำเร็จ");
    } catch (err) {
      setError(err.message || "บันทึกข้อมูลส่วนตัวไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <MainMenuTabs />

      <main className="profile-shell">
        <section className="profile-header">
          <p>ข้อมูลสมาชิก</p>
          <h1>จัดการข้อมูลส่วนตัว</h1>
          <span>แก้ไขข้อมูลติดต่อที่ใช้ในระบบจองห้อง</span>
        </section>

        <section className="profile-card">
          {loading ? (
            <div className="profile-state">กำลังโหลดข้อมูลส่วนตัว...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                ชื่อ - นามสกุล
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                />
              </label>

              <label>
                อีเมล
                <input type="email" value={form.email} readOnly />
              </label>

              <label>
                รหัสผ่าน
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </label>

              <label>
                เบอร์โทร
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </label>

              {error && <div className="profile-message error">{error}</div>}
              {message && <div className="profile-message success">{message}</div>}

              <div className="profile-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
