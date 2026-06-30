import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import MainMenuTabs from "../components/MainMenuTabs";
import "./ReservationList.css";

const statusMeta = {
  pending: { label: "ยังไม่ส่งเอกสาร", className: "pending" },
  processing: { label: "กำลังดำเนินการ", className: "processing" },
  approved: { label: "อนุมัติ", className: "approved" },
  rejected: { label: "ไม่อนุมัติ", className: "rejected" },
  cancelled: { label: "ยกเลิก", className: "cancelled" },
};

const getStatusMeta = (status = "") => {
  const statusText = String(status).trim();
  const normalized = statusText.toLowerCase();

  if (statusMeta[normalized]) return statusMeta[normalized];
  if (statusText.includes("ไม่อนุมัติ")) return statusMeta.rejected;
  if (statusText.includes("อนุมัติ")) return statusMeta.approved;
  if (statusText.includes("ยกเลิก")) return statusMeta.cancelled;
  if (statusText.includes("ดำเนิน")) return statusMeta.processing;

  return { label: statusText || "รอตรวจสอบ", className: "pending" };
};

const hiddenAdminStatuses = [
  "rejected",
  "ไม่อนุมัติ",
  "ปฏิเสธ",
];

const shouldShowInAdminList = (reservation) => {
  const status = String(reservation?.status || "").trim().toLowerCase();
  return !hiddenAdminStatuses.some((hiddenStatus) =>
    status.includes(hiddenStatus.toLowerCase())
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "-";
  return String(value).slice(0, 5);
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function ReservationList() {
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);
  const isAdmin = user?.role === "admin";
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.user_id) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError("");

        const reservationUrl = isAdmin
          ? "https://room-reservation-system-production.up.railway.app/api/reservations"
          : `https://room-reservation-system-production.up.railway.app/api/reservations?user_id=${user.user_id}`;

        const res = await fetch(reservationUrl);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "โหลดรายการจองไม่สำเร็จ");
        }

        const nextReservations = Array.isArray(data) ? data : [];
        setReservations(
          isAdmin
            ? nextReservations.filter(shouldShowInAdminList)
            : nextReservations
        );
      } catch (err) {
        setError(err.message || "โหลดรายการจองไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [isAdmin, navigate, user]);

  const summary = reservations.reduce(
    (acc, item) => {
      const meta = getStatusMeta(item.status);
      acc.total += 1;
      acc[meta.className] = (acc[meta.className] || 0) + 1;
      return acc;
    },
    { total: 0, approved: 0, pending: 0, cancelled: 0 }
  );

  const handleCancel = async (reservationId) => {
    const confirmed = window.confirm("ต้องการยกเลิกรายการจองนี้ใช่ไหม");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `https://room-reservation-system-production.up.railway.app/api/reservations/${reservationId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user.user_id }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "ยกเลิกรายการจองไม่สำเร็จ");
      }

      setReservations((current) =>
        current.map((item) =>
          item.reservation_id === reservationId
            ? { ...item, status: "cancelled" }
            : item
        )
      );
    } catch (err) {
      alert(err.message || "ยกเลิกรายการจองไม่สำเร็จ");
    }
  };

  const handleStatusUpdate = async (reservationId, nextStatus) => {
    const actionLabels = {
      approved: "อนุมัติ",
      rejected: "ไม่อนุมัติ",
      processing: "รับเอกสารแล้ว",
    };
    const label = actionLabels[nextStatus] || "อัปเดตสถานะ";
    const confirmed = window.confirm(`ต้องการ${label}รายการจองนี้ใช่ไหม`);
    if (!confirmed) return;

    try {
      const res = await fetch(
        `https://room-reservation-system-production.up.railway.app/api/reservations/${reservationId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "อัปเดตสถานะไม่สำเร็จ");
      }

      setReservations((current) =>
        current.map((item) =>
          item.reservation_id === reservationId
            ? { ...item, status: nextStatus }
            : item
        )
      );
    } catch (err) {
      alert(err.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleExport = (item) => {
    if (item) {
      handlePrint(item);
      return;
    }

    const rows = [
      ["รายการ", "ข้อมูล"],
      ["ห้อง", item.room_name || item.room_id || "-"],
      ["ประเภทห้อง", item.room_type_name || "-"],
      ["อาคาร", item.building_name || "-"],
      ["ชั้น", item.floor || "-"],
      ["ความจุ", item.capacity || "-"],
      ["วันที่เริ่ม", formatDate(item.start_date)],
      ["วันที่สิ้นสุด", formatDate(item.end_date || item.start_date)],
      ["เวลา", `${formatTime(item.start_time)} - ${formatTime(item.end_time)}`],
      ["จำนวนผู้ใช้", item.user_amount || "-"],
      ["วัตถุประสงค์", item.purpose || "-"],
      ["สถานะ", getStatusMeta(item.status).label],
      ["แจ้งเมื่อ", formatDate(item.created_at)],
    ];
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["\ufeff", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservation-${item.reservation_id || "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async (item) => {
    try {
      const fontResponse = await fetch("/fonts/LeelawUI.ttf");
      const fontBuffer = await fontResponse.arrayBuffer();
      const bytes = new Uint8Array(fontBuffer);
      const chunkSize = 0x8000;
      let binary = "";

      for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
      }

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.addFileToVFS("LeelawUI.ttf", btoa(binary));
      doc.addFont("LeelawUI.ttf", "LeelawUI", "normal");
      doc.setFont("LeelawUI", "normal");
      doc.setFontSize(10);

      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 18;
      let y = 14;
      const text = (value, x, textY, options = {}) =>
        doc.text(String(value || ""), x, textY, options);

      text("แบบฟอร์มขอใช้สถานที่", pageWidth / 2, y, { align: "center" });
      y += 5;
      text(
        "คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏเลย",
        pageWidth / 2,
        y,
        { align: "center" }
      );

      y += 13;
      text(`วันที่ ${formatDate(item.created_at)}`, pageWidth - marginX, y, {
        align: "right",
      });

      y += 12;
      text("เรียน คณบดีคณะวิทยาศาสตร์และเทคโนโลยี", marginX, y);
      y += 10;
      text(`ข้าพเจ้า ${user?.full_name || item.username || "-"}`, marginX, y);
      y += 8;
      text(
        `ขอใช้สถานที่ อาคาร ${item.building_name || "-"} ห้อง ${
          item.room_name || item.room_id || "-"
        } ชั้น ${item.floor || "-"}`,
        marginX,
        y
      );
      y += 8;
      text(
        `จำนวนผู้ใช้ ${item.user_amount || "-"} คน  วันที่ ${formatDate(
          item.start_date
        )} ถึง ${formatDate(item.end_date || item.start_date)}`,
        marginX,
        y
      );
      y += 8;
      text(
        `เวลา ${formatTime(item.start_time)} - ${formatTime(item.end_time)} น.`,
        marginX,
        y
      );

      y += 10;
      text("วัตถุประสงค์", marginX, y);
      y += 4;
      doc.rect(marginX, y, pageWidth - marginX * 2, 24);
      const purposeLines = doc.splitTextToSize(
        item.purpose || "ไม่ได้ระบุ",
        pageWidth - marginX * 2 - 8
      );
      doc.text(purposeLines, marginX + 4, y + 7);

      y += 36;
      const promise =
        "ข้าพเจ้าขอรับรองว่าจะใช้สถานที่ด้วยความระมัดระวัง ดูแลรักษาอุปกรณ์ รักษาความสะอาดเรียบร้อย และส่งคืนสถานที่ให้อยู่ในสภาพเรียบร้อยหลังการใช้งาน";
      doc.text(doc.splitTextToSize(promise, pageWidth - marginX * 2), marginX, y);

      y += 24;
      text(
        "ลงชื่อ ........................................................ ผู้ขอใช้สถานที่",
        pageWidth - marginX,
        y,
        { align: "right" }
      );
      y += 7;
      text(`( ${user?.full_name || item.username || ""} )`, pageWidth - 48, y, {
        align: "center",
      });

      y += 22;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 8;
      text("สำหรับเจ้าหน้าที่", marginX, y);
      text("ความเห็นของคณบดี", pageWidth / 2 + 8, y);
      y += 8;
      text("[  ] อนุญาตให้ใช้สถานที่ได้", marginX, y);
      text("[  ] อนุญาต", pageWidth / 2 + 8, y);
      y += 8;
      text("[  ] ไม่อนุญาตให้ใช้สถานที่ได้", marginX, y);
      text("[  ] ไม่อนุญาต", pageWidth / 2 + 8, y);
      y += 18;
      text("ลงชื่อ ........................................................", marginX, y);
      text("ลงชื่อ ........................................................", pageWidth / 2 + 8, y);

      y += 18;
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 5;
      doc.setFontSize(8);
      text(
        "หมายเหตุ ผู้ขอใช้สถานที่ต้องติดต่อเจ้าหน้าที่ก่อนวันใช้งาน และปฏิบัติตามระเบียบของคณะวิทยาศาสตร์และเทคโนโลยี",
        marginX,
        y
      );

      doc.save(`reservation-${item.reservation_id || "export"}.pdf`);
    } catch (err) {
      alert("สร้างไฟล์ PDF ไม่สำเร็จ");
    }
  };

  const handleEdit = (item) => {
    navigate("/home", {
      state: {
        editReservationId: item.reservation_id,
        reservation: item,
      },
    });
  };

  const handlePrint = (item) => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      alert("กรุณาอนุญาตให้เปิดหน้าต่างใหม่เพื่อพิมพ์เอกสาร");
      return;
    }

    const startDate = formatDate(item.start_date);
    const endDate = formatDate(item.end_date || item.start_date);
    const startTime = formatTime(item.start_time);
    const endTime = formatTime(item.end_time);
    const roomName = item.room_name || `ห้องหมายเลข ${item.room_id || "-"}`;
    const buildingName = item.building_name || "-";
    const userName = item.username || user?.full_name || "";
    const purpose = item.purpose || "-";
    const attendeeCount = item.user_amount || "-";
    const requestDate = formatDate(item.created_at);

    printWindow.document.write(`
      <!doctype html>
      <html lang="th">
        <head>
          <meta charset="utf-8" />
          <title>แบบฟอร์มขอใช้สถานที่</title>
          <style>
            @page { size: A4; margin: 10mm 12mm; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              background: #fff;
              color: #111;
              font-family: "TH Sarabun New", "Sarabun", "Tahoma", sans-serif;
              font-size: 12.5px;
              line-height: 1.32;
            }
            .sheet {
              width: 100%;
              margin: 0 auto;
              background: #fff;
              padding: 0;
            }
            .title {
              text-align: center;
              font-weight: 700;
              line-height: 1.35;
              margin-bottom: 7mm;
            }
            .date-line {
              display: flex;
              justify-content: flex-end;
              align-items: baseline;
              gap: 3mm;
              margin-bottom: 5mm;
            }
            .line {
              display: flex;
              align-items: baseline;
              gap: 3mm;
              margin: 1.7mm 0;
            }
            .line.indent { padding-left: 16mm; }
            .label { white-space: nowrap; }
            .fill {
              flex: 1;
              min-height: 18px;
              border-bottom: 1px dotted #111;
              padding: 0 3mm 1px;
            }
            .fill.short { flex: 0 0 24mm; }
            .fill.medium { flex: 0 0 44mm; }
            .fill.long { flex: 1 1 85mm; }
            .section { margin-top: 4mm; }
            .section-title {
              font-weight: 700;
              margin-bottom: 2mm;
            }
            .purpose-box {
              border: 1px solid #444;
              min-height: 14mm;
              padding: 2.5mm;
            }
            .promise {
              margin: 5mm 0 4mm;
              text-align: center;
            }
            .signature-row {
              display: grid;
              grid-template-columns: 1fr 58mm;
              gap: 18mm;
              margin-top: 3mm;
            }
            .signature { text-align: center; }
            .sign-line {
              display: block;
              height: 7mm;
              border-bottom: 1px dotted #111;
              margin-bottom: 1.5mm;
            }
            .approval-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18mm;
              margin-top: 15mm;
            }
            .approval-box { min-height: 38mm; }
            .checkbox-line { margin: 1.4mm 0; }
            .checkbox {
              display: inline-block;
              width: 11px;
              height: 11px;
              border: 1px solid #111;
              margin-right: 6px;
              vertical-align: -1px;
            }
            .note {
              border-top: 1px solid #111;
              margin-top: 5mm;
              padding-top: 1.5mm;
              font-size: 10px;
            }
            @media print {
              body { background: #fff; }
              .sheet { width: auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <div class="title">
              แบบฟอร์มขอใช้สถานที่<br />
              คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏเลย
            </div>

            <div class="date-line">
              <span class="label">วันที่</span>
              <span class="fill medium">${escapeHtml(requestDate)}</span>
            </div>

            <div class="line">
              <span class="label">เรียน</span>
              <span>คณบดีคณะวิทยาศาสตร์และเทคโนโลยี</span>
            </div>

            <div class="section">
              <div class="line indent">
                <span class="label">ข้าพเจ้า</span>
                <span class="fill long">${escapeHtml(userName)}</span>
                <span class="label">มีความประสงค์ขอใช้สถานที่</span>
              </div>
              <div class="line">
                <span class="label">อาคาร/ห้อง</span>
                <span class="fill long">${escapeHtml(`${buildingName} ${roomName}`)}</span>
                <span class="label">ชั้น</span>
                <span class="fill short">${escapeHtml(item.floor || "-")}</span>
              </div>
              <div class="line">
                <span class="label">จำนวนผู้ใช้</span>
                <span class="fill short">${escapeHtml(attendeeCount)}</span>
                <span class="label">คน</span>
                <span class="label">วันที่</span>
                <span class="fill medium">${escapeHtml(startDate)}</span>
                <span class="label">ถึง</span>
                <span class="fill medium">${escapeHtml(endDate)}</span>
              </div>
              <div class="line">
                <span class="label">เวลา</span>
                <span class="fill medium">${escapeHtml(`${startTime} - ${endTime}`)}</span>
                <span class="label">น.</span>
                <span class="label">วัตถุประสงค์</span>
                <span class="fill long">${escapeHtml(purpose)}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">รายละเอียดเพิ่มเติม</div>
              <div class="purpose-box">${escapeHtml(purpose)}</div>
            </div>

            <p class="promise">
              ข้าพเจ้าขอรับรองว่าจะใช้สถานที่ด้วยความระมัดระวัง ดูแลรักษาอุปกรณ์
              รักษาความสะอาดเรียบร้อย และส่งคืนสถานที่ให้อยู่ในสภาพเรียบร้อยหลังการใช้งาน
            </p>

            <div class="signature-row">
              <div></div>
              <div class="signature">
                จึงเรียนมาเพื่อโปรดพิจารณาอนุญาต
                <span class="sign-line"></span>
                ( ${escapeHtml(userName || "........................................")} )<br />
                ผู้ขอใช้สถานที่
              </div>
            </div>

            <div class="approval-grid">
              <div class="approval-box">
                <strong>สำหรับเจ้าหน้าที่</strong>
                <div class="checkbox-line"><span class="checkbox"></span>อนุญาตให้ใช้สถานที่ได้</div>
                <div class="checkbox-line"><span class="checkbox"></span>ไม่อนุญาตให้ใช้สถานที่ได้</div>
                <div class="line">
                  <span class="label">เนื่องจาก</span>
                  <span class="fill long"></span>
                </div>
                <span class="sign-line"></span>
                <div class="signature">(........................................)<br />ผู้รับผิดชอบสถานที่</div>
              </div>

              <div class="approval-box">
                <strong>ความคิดเห็นของคณบดีคณะวิทยาศาสตร์และเทคโนโลยี</strong>
                <div class="checkbox-line"><span class="checkbox"></span>อนุญาต</div>
                <div class="checkbox-line"><span class="checkbox"></span>ไม่อนุญาต</div>
                <div class="line">
                  <span class="label">เนื่องจาก</span>
                  <span class="fill long"></span>
                </div>
                <span class="sign-line"></span>
                <div class="signature">(........................................)<br />คณบดีคณะวิทยาศาสตร์และเทคโนโลยี</div>
              </div>
            </div>

            <div class="note">
              หมายเหตุ ผู้ขอใช้สถานที่ต้องติดต่อเจ้าหน้าที่ก่อนวันใช้งาน
              และปฏิบัติตามระเบียบของคณะวิทยาศาสตร์และเทคโนโลยี
            </div>
          </main>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`reservation-page ${isAdmin ? "admin-reservation-page" : ""}`}>
      <MainMenuTabs />

      <main className="reservation-shell">
        <section className="reservation-header">
          <div>
            <p className="reservation-kicker">
              {isAdmin ? "รายการคำขอจองทั้งหมด" : "รายการของสมาชิก"}
            </p>
            <h1>{isAdmin ? "รายการจองห้องของแอดมิน" : "รายการจองห้อง"}</h1>
            <p className="reservation-subtitle">
              {isAdmin
                ? "ตรวจสอบรายละเอียดคำขอจองและจัดการสถานะอนุมัติ"
                : `ตรวจสอบสถานะและรายละเอียดการจองของ ${
                    user?.full_name || "สมาชิก"
                  }`}
            </p>
          </div>

          <div className="summary-grid">
            <div>
              <span>{summary.total}</span>
              <p>ทั้งหมด</p>
            </div>
            <div>
              <span>{summary.pending}</span>
              <p>รอตรวจสอบ</p>
            </div>
            <div>
              <span>{summary.approved}</span>
              <p>อนุมัติแล้ว</p>
            </div>
            <div>
              <span>{summary.cancelled}</span>
              <p>ยกเลิก</p>
            </div>
          </div>
        </section>

        {loading && <div className="reservation-state">กำลังโหลดรายการจอง...</div>}

        {!loading && error && (
          <div className="reservation-state error-state">{error}</div>
        )}

        {!loading && !error && reservations.length === 0 && (
          <div className="reservation-state empty-state">
            <h2>ยังไม่มีรายการจอง</h2>
            <p>เมื่อคุณจองห้องแล้ว รายการและสถานะจะแสดงในหน้านี้</p>
            <button onClick={() => navigate("/home")}>ไปจองห้อง</button>
          </div>
        )}

        {!loading && !error && reservations.length > 0 && (
          <div className="reservation-container">
            {reservations.map((item) => {
              const status = getStatusMeta(item.status);
              const canModify = ["pending", "processing"].includes(status.className);

              return (
                <article
                  className={`reservation-card ${
                    isAdmin ? "admin-reservation-card" : ""
                  }`}
                  key={item.reservation_id}
                >
                  <div className={`status-badge ${status.className}`}>
                    {status.label}
                  </div>

                  <div className="reservation-card-content">
                    <p className="room-type">
                      {isAdmin
                        ? `ห้อง ${item.room_name || item.room_id || "-"}`
                        : item.room_type_name || "ห้อง"}
                    </p>
                    <h2>
                      {isAdmin
                        ? item.purpose || "คำขอใช้ห้อง"
                        : item.room_name || `ห้องหมายเลข ${item.room_id || "-"}`}
                    </h2>

                    <div className="reservation-info">
                      {isAdmin && <span>ผู้จอง: {item.username || "-"}</span>}
                      {isAdmin && <span>ห้อง: {item.room_name || "-"}</span>}
                      <span>อาคาร: {item.building_name || "-"}</span>
                      <span>ชั้น: {item.floor || "-"}</span>
                      <span>ความจุ: {item.capacity || "-"} ที่นั่ง</span>
                    </div>

                    <div className="reservation-time">
                      <strong>
                        {formatDate(item.start_date)} -{" "}
                        {formatDate(item.end_date || item.start_date)}
                      </strong>
                      <span>
                        เวลา {formatTime(item.start_time)} - {formatTime(item.end_time)}
                      </span>
                    </div>

                    <p className="detail">
                      วัตถุประสงค์: {item.purpose || "ไม่ได้ระบุ"}
                    </p>
                  </div>

                  <footer className="card-footer">
                    <span>
                      จองเมื่อ {formatDate(item.created_at)}
                      {isAdmin && ` | อัปเดตล่าสุด ${formatDate(item.created_at)}`}
                    </span>
                    <div className="button-group">
                      {isAdmin ? (
                        <>
                          {status.className === "pending" ? (
                            <button
                              type="button"
                              className="receive-doc-btn"
                              onClick={() =>
                                handleStatusUpdate(item.reservation_id, "processing")
                              }
                            >
                              รับเอกสารแล้ว
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="approve-btn"
                                disabled={status.className === "approved"}
                                onClick={() =>
                                  handleStatusUpdate(item.reservation_id, "approved")
                                }
                              >
                                อนุมัติ
                              </button>
                              <button
                                type="button"
                                className="reject-btn"
                                disabled={[
                                  "approved",
                                  "rejected",
                                  "cancelled",
                                ].includes(status.className)}
                                onClick={() =>
                                  handleStatusUpdate(item.reservation_id, "rejected")
                                }
                              >
                                ไม่อนุมัติ
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="export-btn"
                            onClick={() => handleExportPdf(item)}
                          >
                            Export PDF
                          </button>
                          <button
                            type="button"
                            className="print-btn"
                            onClick={() => handlePrint(item)}
                          >
                            Print
                          </button>
                          <button
                            type="button"
                            className="edit-btn"
                            disabled={!canModify}
                            onClick={() => handleEdit(item)}
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            className="cancel-btn"
                            disabled={!canModify}
                            onClick={() => handleCancel(item.reservation_id)}
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ReservationList;
