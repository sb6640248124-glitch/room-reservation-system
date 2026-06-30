function Header({ onLogout }) {
  return (
    <div className="header">
      <div className="logo">🏫 ระบบจองห้อง</div>
      <button onClick={() => {
  localStorage.removeItem("user");
  window.location.href = "/login";
}}>
  เข้าสู่ระบบ
</button>

    </div>
  );
}

export default Header;
