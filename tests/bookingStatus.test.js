import request from "supertest";
import app from "../server/index.js";
import { pool } from "../server/db.js";

describe("Booking Status API", () => {
  /**
   * ปิด MySQL connection pool หลังจากรัน Test ครบ
   * เพื่อป้องกัน Jest ค้างหรือแจ้ง open handles
   */
  afterAll(async () => {
    await pool.end();
  });

  test("TC-01 Approve booking-2", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-2/status")
      .send({
        status: "approved",
        notes: "Approved by Jest"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-2");
    expect(res.body.status).toBe("approved");
    expect(res.body.notes).toBe("Approved by Jest");
  });

  test("TC-02 Reject booking-2", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-2/status")
      .send({
        status: "rejected",
        notes: "Rejected by Jest"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-2");
    expect(res.body.status).toBe("rejected");
    expect(res.body.notes).toBe("Rejected by Jest");
  });

  test("TC-03 Cancel booking-2", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-2/status")
      .send({
        status: "cancelled",
        notes: "Cancelled by Jest"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-2");
    expect(res.body.status).toBe("cancelled");
    expect(res.body.notes).toBe("Cancelled by Jest");
  });

  test("TC-04 Booking not found", async () => {
    const res = await request(app)
      .put("/api/bookings/not-found/status")
      .send({
        status: "approved",
        notes: "Booking does not exist"
      });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: "Booking not found."
    });
  });

  test("TC-05 Approve booking-3", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-3/status")
      .send({
        status: "approved",
        notes: "Approved booking-3"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-3");
    expect(res.body.status).toBe("approved");
    expect(res.body.notes).toBe("Approved booking-3");
  });

  test("TC-06 Reject booking-3", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-3/status")
      .send({
        status: "rejected",
        notes: "Rejected booking-3"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-3");
    expect(res.body.status).toBe("rejected");
    expect(res.body.notes).toBe("Rejected booking-3");
  });

  test("TC-07 Approve booking without new notes", async () => {
    /*
     * ก่อนทดสอบ TC-07 กำหนด notes เดิมไว้ก่อน
     * เพื่อพิสูจน์ว่า COALESCE(NULL, notes) จะเก็บ notes เดิม
     */
    const prepareRes = await request(app)
      .put("/api/bookings/booking-3/status")
      .send({
        status: "rejected",
        notes: "Existing notes"
      });

    expect(prepareRes.status).toBe(200);

    const res = await request(app)
      .put("/api/bookings/booking-3/status")
      .send({
        status: "approved"
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("booking-3");
    expect(res.body.status).toBe("approved");
    expect(res.body.notes).toBe("Existing notes");
  });

  test("TC-08 Invalid status causes database error", async () => {
    const res = await request(app)
      .put("/api/bookings/booking-3/status")
      .send({
        status: "invalid-status"
      });

    /*
     * โค้ดปัจจุบันไม่มี Validation ก่อน UPDATE
     * MySQL จึงปฏิเสธค่า ENUM ที่ไม่ถูกต้องและเข้า catch block
     */
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to update booking status."
    });
  });
});