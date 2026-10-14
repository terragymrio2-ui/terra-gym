CREATE TABLE attendances (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id       INT UNSIGNED NOT NULL,
  attendance_date DATE NOT NULL,
  checked_in_at   DATETIME NOT NULL,
  registered_by   INT UNSIGNED NOT NULL,
  override        TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_member_day (member_id, attendance_date),
  KEY idx_attendance_date (attendance_date),
  CONSTRAINT fk_att_member FOREIGN KEY (member_id) REFERENCES users(id),
  CONSTRAINT fk_att_registered_by FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE TABLE notification_log (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  membership_id INT UNSIGNED NOT NULL,
  type          ENUM('POR_VENCER_7','POR_VENCER_1','VENCIDA') NOT NULL,
  channel       ENUM('EMAIL','WHATSAPP') NOT NULL,
  status        ENUM('ENVIADA','FALLIDA','ABIERTA') NOT NULL,
  error         VARCHAR(500) NULL,
  sent_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification (membership_id, type, channel),
  KEY idx_notification_user (user_id),
  CONSTRAINT fk_nl_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_nl_membership FOREIGN KEY (membership_id) REFERENCES memberships(id)
);