function FilterPanel() {
  return (
    <div className="filter-panel">
      <select id="roomType" name="roomType">
        <option value="">-- เลือกประเภทห้อง --</option>
      </select>

      <select id="building" name="building">
        <option value="">-- เลือกอาคาร --</option>
      </select>

      <select id="floor" name="floor">
        <option value="">-- เลือกชั้น --</option>
      </select>

      <select id="day" name="day">
        <option value="">-- เลือกวัน --</option>
      </select>

      <select id="time" name="time">
        <option value="">-- เลือกเวลา --</option>
      </select>
    </div>
  );
}

export default FilterPanel;
