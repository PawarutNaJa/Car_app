import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ------------------------------------------------------------------
// Mappers: DB row (snake_case) <-> frontend shape (camelCase, matches types.ts)
// ------------------------------------------------------------------
const toVehicle = (r) => ({
  id: r.id,
  modelTh: r.model_th,
  modelEn: r.model_en,
  plateNumber: r.plate_number,
  type: r.type,
  capacity: r.capacity,
  status: r.status,
  driverNameTh: r.driver_name_th,
  driverNameEn: r.driver_name_en,
  driverPhone: r.driver_phone,
  fuelTypeTh: r.fuel_type_th,
  fuelTypeEn: r.fuel_type_en,
});

const toBooking = (r) => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  userId: r.user_id,
  userName: r.user_name,
  userRole: r.user_role,
  userPhone: r.user_phone,
  purpose: r.purpose,
  destination: r.destination,
  startDate: r.start_date,
  endDate: r.end_date,
  startTime: String(r.start_time).slice(0, 5),
  endTime: String(r.end_time).slice(0, 5),
  passengers: r.passengers,
  status: r.status,
  notes: r.notes || undefined,
  createdAt: new Date(r.created_at).toISOString(),
});

const toNotification = (r) => ({
  id: r.id,
  userId: r.user_id || undefined,
  titleTh: r.title_th,
  titleEn: r.title_en,
  messageTh: r.message_th,
  messageEn: r.message_en,
  type: r.type,
  read: !!r.is_read,
  createdAt: new Date(r.created_at).toISOString(),
});

const toUser = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  role: r.role,
});

const newId = (prefix) => `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e4)}`;

// ==================================================================
// AUTH
// ==================================================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'This email is already registered.' });
    }
    const id = newId('user');
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name.trim(), email.toLowerCase().trim(), phone.trim(), role, passwordHash]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    res.status(201).json(toUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    res.json(toUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// ==================================================================
// VEHICLES
// ==================================================================

app.get('/api/vehicles', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
  res.json(rows.map(toVehicle));
});

app.post('/api/vehicles', async (req, res) => {
  try {
    const v = req.body;
    const id = newId('vehicle');
    await pool.query(
      `INSERT INTO vehicles
        (id, model_th, model_en, plate_number, type, capacity, status,
         driver_name_th, driver_name_en, driver_phone, fuel_type_th, fuel_type_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, v.modelTh, v.modelEn, v.plateNumber, v.type, v.capacity, v.status || 'available',
       v.driverNameTh, v.driverNameEn, v.driverPhone, v.fuelTypeTh, v.fuelTypeEn]
    );
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.status(201).json(toVehicle(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vehicle.' });
  }
});

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const v = req.body;
    const { id } = req.params;
    await pool.query(
      `UPDATE vehicles SET
        model_th = ?, model_en = ?, plate_number = ?, type = ?, capacity = ?, status = ?,
        driver_name_th = ?, driver_name_en = ?, driver_phone = ?, fuel_type_th = ?, fuel_type_en = ?
       WHERE id = ?`,
      [v.modelTh, v.modelEn, v.plateNumber, v.type, v.capacity, v.status,
       v.driverNameTh, v.driverNameEn, v.driverPhone, v.fuelTypeTh, v.fuelTypeEn, id]
    );
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found.' });
    res.json(toVehicle(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update vehicle.' });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete vehicle.' });
  }
});

// ==================================================================
// BOOKINGS
// ==================================================================

app.get('/api/bookings', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
  res.json(rows.map(toBooking));
});

// Create a booking. Mirrors the previous frontend logic: also creates the
// "request submitted" notification for the user and a "new request" notification for admins.
app.post('/api/bookings', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const b = req.body;
    const id = newId('booking');

    await conn.beginTransaction();

    await conn.query(
      `INSERT INTO bookings
        (id, vehicle_id, user_id, user_name, user_role, user_phone, purpose, destination,
         start_date, end_date, start_time, end_time, passengers, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, b.vehicleId, b.userId, b.userName, b.userRole, b.userPhone, b.purpose, b.destination,
       b.startDate, b.endDate, b.startTime, b.endTime, b.passengers, b.notes || null]
    );

    const [vehicleRows] = await conn.query('SELECT plate_number FROM vehicles WHERE id = ?', [b.vehicleId]);
    const plate = vehicleRows[0]?.plate_number || '';

    const userNotiId = newId('noti-u');
    const adminNotiId = newId('noti-a');

    await conn.query(
      `INSERT INTO notifications (id, user_id, title_th, title_en, message_th, message_en, type, is_read)
       VALUES (?, ?, ?, ?, ?, ?, 'info', 0)`,
      [userNotiId, b.userId,
       'ยื่นคำขอจองคิวรถสำเร็จ', 'Booking Request Submitted',
       `คุณได้ยื่นคำขอจองรถ ${plate} เพื่อเดินทางไป "${b.destination}" เรียบร้อยแล้ว ขณะนี้อยู่ระหว่างรอผู้ดูแลระบบตรวจสอบ`,
       `Your booking request for ${plate} to "${b.destination}" has been submitted and is pending administrator approval.`]
    );

    await conn.query(
      `INSERT INTO notifications (id, user_id, title_th, title_en, message_th, message_en, type, is_read)
       VALUES (?, 'admin-1', ?, ?, ?, ?, 'info', 0)`,
      [adminNotiId,
       `คำขอจองคิวรถใหม่ (${plate})`, `New booking request (${plate})`,
       `${b.userName} ได้ส่งยื่นข้อคำขอจองใช้รถ มุ่งหน้าสู่ "${b.destination}" วัตถุประสงค์เพื่อ "${b.purpose}"`,
       `${b.userName} submitted a request to travel to "${b.destination}" for "${b.purpose}"`]
    );

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.status(201).json(toBooking(rows[0]));
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking.' });
  } finally {
    conn.release();
  }
});

// Update booking status (approve / reject / cancel). Mirrors previous frontend
// logic: creates a notification for the booking owner and flips the vehicle's
// busy/available status when relevant.
app.put('/api/bookings/:id/status', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'approved' | 'rejected' | 'cancelled'

    await conn.beginTransaction();

    const [existingRows] = await conn.query('SELECT * FROM bookings WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Booking not found.' });
    }
    const booking = existingRows[0];

    await conn.query('UPDATE bookings SET status = ?, notes = COALESCE(?, notes) WHERE id = ?', [status, notes || null, id]);

    const [vehicleRows] = await conn.query('SELECT * FROM vehicles WHERE id = ?', [booking.vehicle_id]);
    const plate = vehicleRows[0]?.plate_number || '';

    const titleTh = status === 'approved' ? 'อนุมัติการจองพาหนะแล้ว' : status === 'rejected' ? 'ปฏิเสธคำขอจองคิวรถ' : 'คำขอจองรถยกเลิกแล้ว';
    const titleEn = status === 'approved' ? 'Booking Request Approved' : status === 'rejected' ? 'Booking Request Rejected' : 'Booking Cancelled';
    const msgTh = status === 'approved'
      ? `การจองใช้ยานพาหนะเลขทะเบียน ${plate} เพื่อเดินทางไป "${booking.destination}" ได้รับการพิจารณาอนุมัติเรียบร้อยโดยผู้จัดระบบ พนักงานขับรถจะติดต่อคุณโดยเร็ว`
      : `การจองใช้ยานพาหนะเลขอักษร ${plate} ได้รับการปฏิเสธ เนื่องจาก: "${notes || 'ข้อมูลยังไม่เพียงพอ'}"`;
    const msgEn = status === 'approved'
      ? `Your booking for vehicle ${plate} to "${booking.destination}" is approved. Our driver will contact you shortly.`
      : `Your booking for vehicle ${plate} was rejected due to: "${notes || 'No reason provided'}"`;

    await conn.query(
      `INSERT INTO notifications (id, user_id, title_th, title_en, message_th, message_en, type, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [newId('noti'), booking.user_id, titleTh, titleEn, msgTh, msgEn,
       status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning']
    );

    // Flip vehicle busy/available status, same rule as the old frontend logic
    const today = new Date().toISOString().split('T')[0];
    if (status === 'approved' && booking.start_date <= today && booking.end_date >= today) {
      await conn.query('UPDATE vehicles SET status = "busy" WHERE id = ?', [booking.vehicle_id]);
    } else if ((status === 'cancelled' || status === 'rejected') && vehicleRows[0]?.status === 'busy') {
      await conn.query('UPDATE vehicles SET status = "available" WHERE id = ?', [booking.vehicle_id]);
    }

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM bookings WHERE id = ?', [id]);
    res.json(toBooking(rows[0]));
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking status.' });
  } finally {
    conn.release();
  }
});

// ==================================================================
// NOTIFICATIONS
// ==================================================================

app.get('/api/notifications', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
  res.json(rows.map(toNotification));
});

app.put('/api/notifications/mark-all-read', async (req, res) => {
  const { userId } = req.body;
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  res.status(204).end();
});

app.delete('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Car booking API listening on http://localhost:${PORT}`);
});
