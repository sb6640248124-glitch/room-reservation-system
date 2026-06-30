const express = require("express");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const router = express.Router();
const db = require("../db");

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
const VERIFICATION_TOKEN_HOURS = 24;

const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

const ensureVerificationColumns = async () => {
  const rows = await runQuery(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME IN (
        'email_verified',
        'email_verification_token',
        'email_verification_expires_at',
        'password_reset_token',
        'password_reset_expires_at'
      )
    `
  );

  const existing = new Set(rows.map((row) => row.COLUMN_NAME));
  const alters = [];
  const shouldVerifyExistingUsers = !existing.has("email_verified");

  if (!existing.has("email_verified")) {
    alters.push("ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0");
  }

  if (!existing.has("email_verification_token")) {
    alters.push("ADD COLUMN email_verification_token VARCHAR(128) NULL");
  }

  if (!existing.has("email_verification_expires_at")) {
    alters.push("ADD COLUMN email_verification_expires_at DATETIME NULL");
  }

  if (!existing.has("password_reset_token")) {
    alters.push("ADD COLUMN password_reset_token VARCHAR(128) NULL");
  }

  if (!existing.has("password_reset_expires_at")) {
    alters.push("ADD COLUMN password_reset_expires_at DATETIME NULL");
  }

  if (alters.length > 0) {
    await runQuery(`ALTER TABLE users ${alters.join(", ")}`);
  }

  if (shouldVerifyExistingUsers) {
    await runQuery(
      `
      UPDATE users
      SET email_verified = 1
      WHERE email_verification_token IS NULL
      `
    );
  }
};

const getMailTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  const hasPlaceholderValue = [SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS].some((value) =>
    String(value || "").startsWith("your-")
  );

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || hasPlaceholderValue) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendVerificationEmail = async ({ email, name, token }) => {
  const verificationLink = `${FRONTEND_BASE_URL}/verify-email?token=${token}`;
  const transporter = getMailTransporter();

  if (!transporter) {
    console.log("Email verification link:", verificationLink);
    return { sent: false, verificationLink };
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "ยืนยันอีเมลสำหรับระบบจองห้อง",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>ยืนยันอีเมลของคุณ</h2>
        <p>สวัสดี ${name || ""}</p>
        <p>กรุณากดปุ่มด้านล่างเพื่อยืนยันอีเมลก่อนเข้าใช้งานระบบจองห้อง</p>
        <p>
          <a href="${verificationLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
            ยืนยันอีเมล
          </a>
        </p>
        <p>ลิงก์นี้จะหมดอายุภายใน ${VERIFICATION_TOKEN_HOURS} ชั่วโมง</p>
      </div>
    `,
  });

  return { sent: true };
};

const sendPasswordResetEmail = async ({ email, name, token }) => {
  const resetLink = `${FRONTEND_BASE_URL}/reset-password?token=${token}`;
  const transporter = getMailTransporter();

  if (!transporter) {
    console.log("Password reset link:", resetLink);
    return { sent: false, resetLink };
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "รีเซ็ตรหัสผ่านระบบจองห้อง",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>ตั้งรหัสผ่านใหม่</h2>
        <p>สวัสดี ${name || ""}</p>
        <p>กดปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้มีอายุ 1 ชั่วโมง</p>
        <p>
          <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#ff7a00;color:#ffffff;text-decoration:none;border-radius:6px;">
            ตั้งรหัสผ่านใหม่
          </a>
        </p>
        <p>หากคุณไม่ได้ขอเปลี่ยนรหัสผ่าน สามารถละเว้นอีเมลฉบับนี้ได้</p>
      </div>
    `,
  });

  return { sent: true };
};

router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  if (!email.endsWith("@lru.ac.th")) {
    return res.status(400).json({ message: "ต้องใช้ Email @lru.ac.th เท่านั้น" });
  }

  try {
    await ensureVerificationColumns();

    const existingUsers = await runQuery(
      "SELECT user_id, full_name, email_verified FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      if (existingUsers[0].email_verified) {
        return res.status(409).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000);

      await runQuery(
        `
        UPDATE users
        SET full_name = ?,
            password = ?,
            phone = ?,
            email_verification_token = ?,
            email_verification_expires_at = ?
        WHERE user_id = ?
        `,
        [name, password, phone, token, expiresAt, existingUsers[0].user_id]
      );

      let emailResult;

      try {
        emailResult = await sendVerificationEmail({ email, name, token });
      } catch (mailErr) {
        console.error("Email send error:", mailErr);
        return res.status(500).json({
          message: "สมัครสมาชิกแล้ว แต่ส่งอีเมลยืนยันไม่สำเร็จ กรุณาตรวจสอบค่า SMTP ใน backend/.env",
        });
      }

      return res.json({
        message: emailResult.sent
          ? "ส่งอีเมลยืนยันตัวตนอีกครั้งแล้ว กรุณาตรวจสอบอีเมล"
          : "สร้างลิงก์ยืนยันใหม่แล้ว แต่ยังไม่ได้ตั้งค่า SMTP ระบบจะแสดงลิงก์ใน console ของ backend",
        emailSent: emailResult.sent,
        verificationLink: process.env.NODE_ENV === "production" ? undefined : emailResult.verificationLink,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000);

    await runQuery(
      `
      INSERT INTO users (
        full_name,
        email,
        password,
        role,
        phone,
        email_verified,
        email_verification_token,
        email_verification_expires_at
      )
      VALUES (?, ?, ?, 'user', ?, 0, ?, ?)
      `,
      [name, email, password, phone, token, expiresAt]
    );

    let emailResult;

    try {
      emailResult = await sendVerificationEmail({ email, name, token });
    } catch (mailErr) {
      console.error("Email send error:", mailErr);
      return res.status(500).json({
        message: "สมัครสมาชิกแล้ว แต่ส่งอีเมลยืนยันไม่สำเร็จ กรุณาตรวจสอบค่า SMTP ใน backend/.env",
      });
    }

    return res.status(201).json({
      message: emailResult.sent
        ? "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน"
        : "สมัครสมาชิกสำเร็จ แต่ยังไม่ได้ตั้งค่า SMTP ระบบจะแสดงลิงก์ยืนยันใน console ของ backend",
      emailSent: emailResult.sent,
      verificationLink: process.env.NODE_ENV === "production" ? undefined : emailResult.verificationLink,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "สมัครสมาชิกไม่สำเร็จ" });
  }
});

router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "ไม่พบ token สำหรับยืนยันอีเมล" });
  }

  try {
    await ensureVerificationColumns();

    const users = await runQuery(
      `
      SELECT user_id
      FROM users
      WHERE email_verification_token = ?
        AND email_verification_expires_at > NOW()
      `,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: "ลิงก์ยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว" });
    }

    await runQuery(
      `
      UPDATE users
      SET email_verified = 1,
          email_verification_token = NULL,
          email_verification_expires_at = NULL
      WHERE user_id = ?
      `,
      [users[0].user_id]
    );

    return res.json({ message: "ยืนยันอีเมลสำเร็จ สามารถเข้าสู่ระบบได้แล้ว" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ยืนยันอีเมลไม่สำเร็จ" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim();

  if (!email) {
    return res.status(400).json({ message: "กรุณากรอกอีเมล" });
  }

  try {
    await ensureVerificationColumns();

    const users = await runQuery(
      "SELECT user_id, full_name, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.json({
        message: "หากพบอีเมลนี้ในระบบ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ให้",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await runQuery(
      `
      UPDATE users
      SET password_reset_token = ?,
          password_reset_expires_at = ?
      WHERE user_id = ?
      `,
      [token, expiresAt, users[0].user_id]
    );

    const emailResult = await sendPasswordResetEmail({
      email: users[0].email,
      name: users[0].full_name,
      token,
    });

    return res.json({
      message: emailResult.sent
        ? "ส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลแล้ว"
        : "สร้างลิงก์ตั้งรหัสผ่านใหม่แล้ว แต่ยังไม่ได้ตั้งค่า SMTP",
      resetLink:
        process.env.NODE_ENV === "production" ? undefined : emailResult.resetLink,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ดำเนินการลืมรหัสผ่านไม่สำเร็จ" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      message: "ข้อมูลสำหรับตั้งรหัสผ่านใหม่ไม่ครบถ้วน",
    });
  }

  try {
    await ensureVerificationColumns();

    const users = await runQuery(
      `
      SELECT user_id
      FROM users
      WHERE password_reset_token = ?
        AND password_reset_expires_at > NOW()
      `,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        message: "ลิงก์ตั้งรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว",
      });
    }

    await runQuery(
      `
      UPDATE users
      SET password = ?,
          password_reset_token = NULL,
          password_reset_expires_at = NULL
      WHERE user_id = ?
      `,
      [password, users[0].user_id]
    );

    return res.json({ message: "ตั้งรหัสผ่านใหม่สำเร็จ" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "ตั้งรหัสผ่านใหม่ไม่สำเร็จ" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
  }

  try {
    await ensureVerificationColumns();

    const results = await runQuery(
      `
      SELECT user_id, full_name, email, role, email_verified
      FROM users
      WHERE email = ? AND password = ?
      `,
      [email, password]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    if (!results[0].email_verified) {
      return res.status(403).json({ message: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ" });
    }

    const { email_verified, ...user } = results[0];
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
