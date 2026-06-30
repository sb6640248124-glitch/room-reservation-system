function RoomList() {
  const rooms = [
    "ห้องเรียน 28202",
    "ห้องเรียน 28203",
    "ห้องปฏิบัติการ Sc.203",
    "ห้องประชุมใหญ่",
  ];

  return (
    <div className="room-list">
      {rooms.map((room, i) => (
        <span key={i} className="room-tag">{room}</span>
      ))}
    </div>
  );
}

export default RoomList;
