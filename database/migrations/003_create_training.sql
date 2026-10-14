CREATE TABLE trainer_members (
  trainer_id INT UNSIGNED NOT NULL,
  member_id  INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (trainer_id, member_id),
  KEY idx_trainer_members_member (member_id),
  CONSTRAINT fk_tm_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tm_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE exercises (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120) NOT NULL,
  muscle_group VARCHAR(50)  NOT NULL,
  description  VARCHAR(500) NULL,
  created_by   INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exercises_name (name),
  KEY idx_exercises_group (muscle_group),
  CONSTRAINT fk_exercises_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE training_plans (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  member_id  INT UNSIGNED NOT NULL,
  trainer_id INT UNSIGNED NOT NULL,
  title      VARCHAR(150) NOT NULL,
  objective  VARCHAR(255) NULL,
  notes      TEXT NULL,
  start_date DATE NULL,
  end_date   DATE NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tp_member_active (member_id, is_active),
  KEY idx_tp_trainer (trainer_id),
  CONSTRAINT fk_tp_member FOREIGN KEY (member_id) REFERENCES users(id),
  CONSTRAINT fk_tp_trainer FOREIGN KEY (trainer_id) REFERENCES users(id)
);

CREATE TABLE training_plan_days (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id   INT UNSIGNED NOT NULL,
  name      VARCHAR(100) NOT NULL,
  day_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tpd_plan_order (plan_id, day_order),
  CONSTRAINT fk_tpd_plan FOREIGN KEY (plan_id) REFERENCES training_plans(id) ON DELETE CASCADE
);

CREATE TABLE training_plan_exercises (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  day_id         INT UNSIGNED NOT NULL,
  exercise_id    INT UNSIGNED NOT NULL,
  sets           SMALLINT UNSIGNED NOT NULL,
  reps           VARCHAR(20) NOT NULL,
  rest_seconds   SMALLINT UNSIGNED NULL,
  notes          VARCHAR(255) NULL,
  exercise_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_tpe_day_order (day_id, exercise_order),
  KEY idx_tpe_exercise (exercise_id),
  CONSTRAINT fk_tpe_day FOREIGN KEY (day_id) REFERENCES training_plan_days(id) ON DELETE CASCADE,
  CONSTRAINT fk_tpe_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  CONSTRAINT chk_tpe_sets CHECK (sets > 0)
);