CREATE TABLE membership_plans (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  price         DECIMAL(10,2) NOT NULL,
  duration_days SMALLINT UNSIGNED NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_membership_plans_name (name),
  CONSTRAINT chk_plan_price CHECK (price >= 0),
  CONSTRAINT chk_plan_duration CHECK (duration_days > 0)
);

CREATE TABLE memberships (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  plan_id    INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  status     ENUM('ACTIVA','CANCELADA') NOT NULL DEFAULT 'ACTIVA',
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_memberships_user_end (user_id, end_date),
  KEY idx_memberships_end (end_date),
  CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id),
  CONSTRAINT fk_memberships_creator FOREIGN KEY (created_by) REFERENCES users(id),
  CONSTRAINT chk_membership_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_membership_price CHECK (price >= 0)
);

CREATE TABLE payments (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  membership_id INT UNSIGNED NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  method        ENUM('EFECTIVO','TRANSFERENCIA','TARJETA','MERCADO_PAGO','OTRO') NOT NULL,
  paid_at       DATETIME NOT NULL,
  reference     VARCHAR(100) NULL,
  notes         VARCHAR(255) NULL,
  voided_at     DATETIME NULL,
  void_reason   VARCHAR(255) NULL,
  registered_by INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_membership (membership_id),
  KEY idx_payments_paid_at (paid_at),
  CONSTRAINT fk_payments_membership FOREIGN KEY (membership_id) REFERENCES memberships(id),
  CONSTRAINT fk_payments_registered_by FOREIGN KEY (registered_by) REFERENCES users(id),
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
);