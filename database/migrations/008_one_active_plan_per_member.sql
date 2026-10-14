ALTER TABLE training_plans
  ADD COLUMN active_member_key INT UNSIGNED
    GENERATED ALWAYS AS (CASE WHEN is_active = 1 THEN member_id END) STORED,
  ADD UNIQUE KEY uq_tp_one_active (active_member_key);