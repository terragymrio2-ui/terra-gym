CREATE TABLE announcements (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(100) NOT NULL,
  message    TEXT NOT NULL,
  audience   ENUM('TODOS','VIGENTES','POR_VENCER','VENCIDOS','CON_DEUDA','SIN_CUOTA') NOT NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_announcements_created (created_at),
  CONSTRAINT fk_announcements_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE announcement_recipients (
  announcement_id INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  read_at         DATETIME NULL,
  PRIMARY KEY (announcement_id, user_id),
  KEY idx_ar_user_read (user_id, read_at),
  CONSTRAINT fk_ar_announcement FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  CONSTRAINT fk_ar_user FOREIGN KEY (user_id) REFERENCES users(id)
);