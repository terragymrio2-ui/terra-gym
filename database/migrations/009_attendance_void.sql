ALTER TABLE attendances
  DROP INDEX uq_attendance_member_day,
  ADD COLUMN override_reasons VARCHAR(100) NULL AFTER override,
  ADD COLUMN voided_at DATETIME NULL,
  ADD COLUMN void_reason VARCHAR(255) NULL,
  ADD COLUMN voided_by INT UNSIGNED NULL,
  ADD COLUMN active_date DATE
    GENERATED ALWAYS AS (CASE WHEN voided_at IS NULL THEN attendance_date END) STORED,
  ADD UNIQUE KEY uq_attendance_active (member_id, active_date),
  ADD KEY idx_att_member_date (member_id, attendance_date),
  ADD CONSTRAINT fk_att_voided_by FOREIGN KEY (voided_by) REFERENCES users(id);