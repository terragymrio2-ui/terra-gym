ALTER TABLE training_plans
  MODIFY COLUMN member_id INT UNSIGNED NULL,
  ADD COLUMN source_template_id INT UNSIGNED NULL AFTER trainer_id,
  ADD COLUMN revision INT UNSIGNED NOT NULL DEFAULT 1,
  ADD KEY idx_tp_source (source_template_id),
  ADD CONSTRAINT fk_tp_source FOREIGN KEY (source_template_id)
    REFERENCES training_plans(id) ON DELETE SET NULL;

ALTER TABLE training_plan_exercises
  ADD COLUMN block ENUM(
    'ENTRADA_EN_CALOR','MOVILIDAD','PRINCIPAL','ACCESORIOS','CORE','CARDIO','ENFRIAMIENTO'
  ) NOT NULL DEFAULT 'PRINCIPAL' AFTER exercise_id,
  ADD COLUMN intensity VARCHAR(30) NULL AFTER rest_seconds,
  ADD COLUMN suggested_weight DECIMAL(6,2) NULL AFTER intensity;