ALTER TABLE membership_plans DROP CHECK chk_plan_duration;

ALTER TABLE membership_plans
  DROP COLUMN duration_days,
  ADD COLUMN duration_months TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER price,
  ADD COLUMN days_per_week   TINYINT UNSIGNED NOT NULL DEFAULT 7 AFTER duration_months,
  ADD CONSTRAINT chk_plan_duration_months CHECK (duration_months BETWEEN 1 AND 24),
  ADD CONSTRAINT chk_plan_days_per_week   CHECK (days_per_week BETWEEN 1 AND 7);