import { useEffect, useState } from "react";
import axios from "axios";
import MainMenuTabs from "../components/MainMenuTabs";
import "./UserManage.css";

function UserManage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    role: "user",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลผู้ใช้ไม่สำเร็จ", err);
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    const confirmed = window.confirm(
      `ต้องการเปลี่ยนสิทธิ์ของ ${user.full_name} เป็น ${nextRole} ใช่ไหม`
    );

    if (!confirmed) return;

    try {
      await axios.put(`http://localhost:3002/api/users/${user.user_id}/role`, {
        role: nextRole,
      });

      setUsers((current) =>
        current.map((item) =>
          item.user_id === user.user_id ? { ...item, role: nextRole } : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "เปลี่ยนสิทธิ์ไม่สำเร็จ");
    }
  };

  const closeAddForm = (force = false) => {
    if (saving && !force) return;
    setShowAddForm(false);
    setFormError("");
    setNewUser({
      full_name: "",
      email: "",
      password: "",
      phone: "",
      role: "user",
    });
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!newUser.email.endsWith("@lru.ac.th")) {
      setFormError("ต้องใช้ Email @lru.ac.th เท่านั้น");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.post("http://localhost:3002/api/users", newUser);
      setUsers((current) => [res.data.user, ...current]);
      closeAddForm(true);
    } catch (err) {
      setFormError(err.response?.data?.message || "เพิ่มผู้ใช้ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const openPasswordForm = async (user) => {
    try {
      setPasswordLoading(true);
      setPasswordError("");
      setShowPassword(false);
      setPasswordUser(user);

      const res = await axios.get(
        `http://localhost:3002/api/users/${user.user_id}`
      );
      setPasswordValue(res.data.password || "");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "โหลดรหัสผ่านไม่สำเร็จ"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordForm = (force = false) => {
    if (passwordLoading && !force) return;
    setPasswordUser(null);
    setPasswordValue("");
    setShowPassword(false);
    setPasswordError("");
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    if (!passwordValue) {
      setPasswordError("กรุณากรอกรหัสผ่าน");
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError("");
      await axios.put(
        `http://localhost:3002/api/users/${passwordUser.user_id}/password`,
        { password: passwordValue }
      );
      closePasswordForm(true);
      alert("แก้ไขรหัสผ่านสำเร็จ");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "แก้ไขรหัสผ่านไม่สำเร็จ"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <MainMenuTabs />

      <div className="user-container">
        <div className="user-header">
          <h1>จัดการข้อมูลผู้ใช้</h1>

          <button
            type="button"
            className="add-btn"
            onClick={() => setShowAddForm(true)}
          >
            + เพิ่มผู้ใช้
          </button>
        </div>

        <input
          className="search-box"
          type="text"
          placeholder="ค้นหาผู้ใช้..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <table className="user-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>สิทธิ์</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.user_id}>
                  <td>{user.full_name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>ใช้งาน</td>
                  <td>
                    <div className="user-action-buttons">
                      <button
                        className="edit-btn"
                        onClick={() => handleToggleRole(user)}
                      >
                        เปลี่ยนสิทธิ์
                      </button>
                      <button
                        className="password-btn"
                        onClick={() => openPasswordForm(user)}
                      >
                        ดู/แก้รหัสผ่าน
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">ไม่พบข้อมูลผู้ใช้</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <div className="user-modal-backdrop">
          <div className="user-modal" role="dialog" aria-modal="true">
            <div className="user-modal-header">
              <h2>เพิ่มผู้ใช้</h2>
              <button type="button" onClick={closeAddForm} disabled={saving}>
                ปิด
              </button>
            </div>

            <form className="user-form" onSubmit={handleAddUser}>
              <label>
                ชื่อ - นามสกุล
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      full_name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                อีเมล
                <input
                  type="email"
                  placeholder="example@lru.ac.th"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                รหัสผ่าน
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                เบอร์โทร
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                สิทธิ์
                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="user">ผู้ใช้</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </label>

              {formError && <div className="user-form-error">{formError}</div>}

              <div className="user-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeAddForm}
                  disabled={saving}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="add-btn" disabled={saving}>
                  {saving ? "กำลังบันทึก..." : "บันทึกผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="user-modal-backdrop">
          <div className="user-modal password-modal" role="dialog" aria-modal="true">
            <div className="user-modal-header">
              <div>
                <h2>ดูและแก้ไขรหัสผ่าน</h2>
                <p>{passwordUser.full_name} — {passwordUser.email}</p>
              </div>
              <button
                type="button"
                onClick={closePasswordForm}
                disabled={passwordLoading}
              >
                ปิด
              </button>
            </div>

            <form className="user-form" onSubmit={handleUpdatePassword}>
              <label>
                รหัสผ่าน
                <div className="password-input-row">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordValue}
                    onChange={(event) => setPasswordValue(event.target.value)}
                    disabled={passwordLoading}
                    required
                  />
                  <button
                    type="button"
                    className="show-password-btn"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={passwordLoading}
                  >
                    {showPassword ? "ซ่อน" : "แสดง"}
                  </button>
                </div>
              </label>

              {passwordLoading && !passwordValue && (
                <div className="password-loading">กำลังโหลดข้อมูล...</div>
              )}
              {passwordError && (
                <div className="user-form-error">{passwordError}</div>
              )}

              <div className="user-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closePasswordForm}
                  disabled={passwordLoading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="add-btn"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default UserManage;
