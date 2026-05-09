-- WalletHub MySQL Schema
-- NOTE: database creation/USE removed so this file can be loaded into any
-- target database (e.g. Aiven's `defaultdb`). Pass the database name on the
-- mysql CLI instead: `mysql ... defaultdb < schema.sql`

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                          VARCHAR(30)  PRIMARY KEY,
  email                       VARCHAR(255) NOT NULL UNIQUE,
  password_hash               VARCHAR(255) NOT NULL,
  name                        VARCHAR(255) NOT NULL,
  avatar                      MEDIUMTEXT   DEFAULT NULL,
  age                         SMALLINT     DEFAULT NULL,
  gender                      ENUM('male','female') DEFAULT NULL,
  currency                    VARCHAR(10)  NOT NULL DEFAULT 'MNT',
  dark_mode                   TINYINT(1)   NOT NULL DEFAULT 0,
  relationship_status         VARCHAR(20)  NOT NULL DEFAULT 'individual',
  subscription_status         ENUM('active','expired','none') NOT NULL DEFAULT 'none',
  subscription_expires_at     DATETIME     DEFAULT NULL,
  setup_completed             TINYINT(1)   NOT NULL DEFAULT 0,
  created_at                  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── User-scoped finance tables ────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          VARCHAR(30)     PRIMARY KEY,
  user_id     VARCHAR(30)     NOT NULL,
  title       VARCHAR(255)    NOT NULL,
  amount      DECIMAL(18,2)   NOT NULL,
  category    VARCHAR(100)    NOT NULL,
  date        DATE            NOT NULL,
  type        ENUM('income','expense') NOT NULL,
  description TEXT            DEFAULT NULL,
  INDEX idx_tx_user_date (user_id, date),
  CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budgets (
  id       VARCHAR(30)   PRIMARY KEY,
  user_id  VARCHAR(30)   NOT NULL,
  category VARCHAR(100)  NOT NULL,
  amount   DECIMAL(18,2) NOT NULL,
  spent    DECIMAL(18,2) NOT NULL DEFAULT 0,
  month    VARCHAR(2)    NOT NULL,
  year     SMALLINT      NOT NULL,
  INDEX idx_budget_user (user_id),
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id             VARCHAR(30)   PRIMARY KEY,
  user_id        VARCHAR(30)   NOT NULL,
  name           VARCHAR(255)  NOT NULL,
  target_amount  DECIMAL(18,2) NOT NULL,
  current_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  deadline       DATE          NOT NULL,
  image          VARCHAR(500)  DEFAULT NULL,
  created_at     DATE          NOT NULL,
  INDEX idx_goal_user (user_id),
  CONSTRAINT fk_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id         VARCHAR(30)  PRIMARY KEY,
  user_id    VARCHAR(30)  NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT         NOT NULL,
  type       ENUM('info','warning','success') NOT NULL,
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATE         NOT NULL,
  INDEX idx_notif_user (user_id),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Families ──────────────────────────────────────────────
-- `kind` distinguishes a 4-member family from a 2-member couple. Drives
-- which family_role values are allowed and what maxMembers is reported
-- by the API. The idempotent block at the bottom backfills this column
-- on databases that pre-date it.
CREATE TABLE IF NOT EXISTS families (
  id         VARCHAR(30)  PRIMARY KEY,
  owner_id   VARCHAR(30)  NOT NULL,
  name       VARCHAR(255) NOT NULL,
  kind       ENUM('family','couple') NOT NULL DEFAULT 'family',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_family_owner (owner_id),
  CONSTRAINT fk_family_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- One user belongs to exactly one family (owner or member).
-- family_role: relationship within the family (aav/eej/...). Optional until
-- the user picks one. UNIQUE (family_id, family_role) enforces "no two
-- aavs in one family"; NULL is excluded from MySQL UNIQUE so multiple
-- members can be unset simultaneously while picking.
-- IF NOT EXISTS keeps existing memberships intact across migrate runs;
-- the idempotent block at the bottom of this file backfills the
-- family_role column on databases that pre-date it.
CREATE TABLE IF NOT EXISTS family_members (
  id           VARCHAR(30) PRIMARY KEY,
  family_id    VARCHAR(30) NOT NULL,
  user_id      VARCHAR(30) NOT NULL UNIQUE,
  role         ENUM('owner','member') NOT NULL,
  family_role  ENUM('father','mother','older_sister','older_brother','younger_sibling','husband','wife','partner') DEFAULT NULL,
  joined_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fm_family (family_id),
  UNIQUE KEY uk_fm_family_role (family_id, family_role),
  CONSTRAINT fk_fm_family FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE,
  CONSTRAINT fk_fm_user   FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS family_invitations (
  id              VARCHAR(30)  PRIMARY KEY,
  family_id       VARCHAR(30)  NOT NULL,
  invited_email   VARCHAR(255) NOT NULL,
  invited_by      VARCHAR(30)  NOT NULL,
  status          ENUM('pending','accepted','declined','expired','cancelled') NOT NULL DEFAULT 'pending',
  invited_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME     NOT NULL,
  INDEX idx_inv_email_status (invited_email, status),
  INDEX idx_inv_family (family_id),
  CONSTRAINT fk_inv_family   FOREIGN KEY (family_id)  REFERENCES families(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_inviter  FOREIGN KEY (invited_by) REFERENCES users(id)    ON DELETE CASCADE
);

-- ── Drop legacy single-row profile (replaced by users) ────
DROP TABLE IF EXISTS profile;

-- ── Idempotent migrations for older databases ────────────
-- Add family_role to existing family_members tables that pre-date this
-- column. Uses dynamic SQL because ADD COLUMN IF NOT EXISTS is not
-- universally supported in MySQL 5.7.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'family_members'
     AND column_name = 'family_role'
);
SET @ddl := IF(@col_exists = 0,
  "ALTER TABLE family_members
     ADD COLUMN family_role ENUM('father','mother','older_sister','older_brother','younger_sibling','husband','wife','partner') DEFAULT NULL,
     ADD UNIQUE KEY uk_fm_family_role (family_id, family_role)",
  "ALTER TABLE family_members
     MODIFY COLUMN family_role ENUM('father','mother','older_sister','older_brother','younger_sibling','husband','wife','partner') DEFAULT NULL"
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add `kind` to existing families tables that pre-date it. Defaults
-- existing rows to 'family' so legacy households retain 4-member limits.
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'families'
     AND column_name = 'kind'
);
SET @ddl := IF(@col_exists = 0,
  "ALTER TABLE families
     ADD COLUMN kind ENUM('family','couple') NOT NULL DEFAULT 'family' AFTER name",
  "ALTER TABLE families
     MODIFY COLUMN kind ENUM('family','couple') NOT NULL DEFAULT 'family'"
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
