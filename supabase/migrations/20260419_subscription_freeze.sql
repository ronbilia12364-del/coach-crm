-- Add subscription freeze support to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS frozen_at  timestamptz  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frozen_days integer      NOT NULL DEFAULT 0;
