-- Ashley Photography — initial schema.
--
-- Conventions, carried over from the sister sites so a query written for one
-- reads the same on the others:
--
--   * Every id is a CHAR(36) UUID minted in Node, never AUTO_INCREMENT — rows are
--     created by the dashboard and by the seed script, and neither should have to
--     ask the database what an id turned out to be.
--   * Every timestamp is an INT of unix seconds. MariaDB's DATETIME carries no
--     zone, and Hostinger does not promise which zone the server runs in.
--   * Structured content (a section's fields, a session's details, a guide's
--     letter) is LONGTEXT holding JSON, validated in Node against the field
--     definitions in shared/. Adding a field is a change to shared/, not a
--     migration.
--   * utf8mb4_unicode_ci, because this is MariaDB 11.8 and the MySQL 8
--     `utf8mb4_0900_*` collations do not exist there.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

/* ------------------------------------------------------------------ *
 * Accounts
 * ------------------------------------------------------------------ */

CREATE TABLE users (
  id            CHAR(36)     NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  display_name  VARCHAR(120) NULL,
  role          ENUM('owner', 'editor') NOT NULL DEFAULT 'editor',
  avatar_url    VARCHAR(512) NULL,
  bio           TEXT         NULL,
  created_at    INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  last_login_at INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE user_sessions (
  token_hash VARCHAR(64)  NOT NULL,
  user_id    CHAR(36)     NOT NULL,
  expires_at INT UNSIGNED NOT NULL,
  created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  user_agent VARCHAR(255) NULL,
  PRIMARY KEY (token_hash),
  KEY idx_user_sessions_user (user_id),
  KEY idx_user_sessions_expires (expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ip           VARCHAR(45)     NOT NULL,
  attempted_at INT UNSIGNED    NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_login_attempts_ip (ip, attempted_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Settings
 *
 * One row per settings group, JSON in `value`: `site` (name, contact, nav,
 * footer), `pricing` (rate card, add-ons, booking), `policy` (retouching,
 * weather, reschedules), `library` (vendors and locations), `inquiry` (form
 * options). Each is edited on its own dashboard screen.
 * ------------------------------------------------------------------ */

CREATE TABLE settings (
  `key`      VARCHAR(64)  NOT NULL,
  `value`    LONGTEXT     NOT NULL,
  updated_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (`key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Pages
 *
 * `page_key` marks the pages the router reaches by name — home, sessions,
 * portfolio, guides, blog. They keep their slug and cannot be deleted.
 * ------------------------------------------------------------------ */

CREATE TABLE pages (
  id               CHAR(36)     NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  page_key         VARCHAR(40)  NULL,
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  og_image         VARCHAR(512) NULL,
  noindex          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  published_at     INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pages_slug (slug),
  UNIQUE KEY uq_pages_key (page_key),
  KEY idx_pages_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Taxonomy
 *
 * `portfolio` categories are the portfolio filters — Seniors, Engagements,
 * Celebrations and so on. A session type points at one, which is how a session
 * page knows which albums are "sessions like yours".
 * ------------------------------------------------------------------ */

CREATE TABLE terms (
  id          CHAR(36)     NOT NULL,
  kind        ENUM('category', 'tag') NOT NULL,
  applies_to  ENUM('post', 'portfolio') NOT NULL,
  slug        VARCHAR(190) NOT NULL,
  name        VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  swatch      VARCHAR(20)  NOT NULL DEFAULT 'accent',
  position    SMALLINT     NOT NULL DEFAULT 0,
  created_at  INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_terms_slug (kind, applies_to, slug),
  KEY idx_terms_lookup (applies_to, kind, position)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Blog
 * ------------------------------------------------------------------ */

CREATE TABLE posts (
  id               CHAR(36)     NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  subtitle         VARCHAR(255) NULL,
  excerpt          VARCHAR(600) NULL,
  featured_image   VARCHAR(768) NULL,
  featured_alt     VARCHAR(255) NULL,
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  author_id        CHAR(36)     NULL,
  category_id      CHAR(36)     NULL,
  template         VARCHAR(40)  NULL,
  featured         TINYINT(1)   NOT NULL DEFAULT 0,
  reading_minutes  SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  og_image         VARCHAR(768) NULL,
  noindex          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  published_at     INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_posts_slug (slug),
  KEY idx_posts_status_date (status, published_at),
  KEY idx_posts_category (category_id),
  KEY idx_posts_author (author_id),
  KEY idx_posts_featured (featured, published_at),
  CONSTRAINT fk_posts_author FOREIGN KEY (author_id)
    REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_posts_category FOREIGN KEY (category_id)
    REFERENCES terms (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Session types — Senior Pictures, Graduation, Engagements…
 *
 * Called `session_types` in the database so it can never be confused with
 * `user_sessions`; the dashboard calls them Sessions. `details` holds the copy
 * and photographs, `packages` the tier ladder. The public page itself is built
 * from sections like any other page.
 * ------------------------------------------------------------------ */

CREATE TABLE session_types (
  id                    CHAR(36)     NOT NULL,
  slug                  VARCHAR(190) NOT NULL,
  title                 VARCHAR(255) NOT NULL,
  status                ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  position              SMALLINT     NOT NULL DEFAULT 0,
  portfolio_category_id CHAR(36)     NULL,
  guide_id              CHAR(36)     NULL,
  private_pricing       TINYINT(1)   NOT NULL DEFAULT 0,
  details               LONGTEXT     NOT NULL,
  packages              LONGTEXT     NOT NULL,
  meta_title            VARCHAR(255) NULL,
  meta_description      VARCHAR(500) NULL,
  og_image              VARCHAR(768) NULL,
  noindex               TINYINT(1)   NOT NULL DEFAULT 0,
  created_at            INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at            INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  published_at          INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_session_types_slug (slug),
  KEY idx_session_types_status (status, position),
  CONSTRAINT fk_session_types_category FOREIGN KEY (portfolio_category_id)
    REFERENCES terms (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Albums — the portfolio. One real shoot each.
 *
 * `photos` is a JSON array of media URLs, in display order. `shoot_date` is an
 * ISO date used for sorting; `date_label` is what the page prints ("June 2022"),
 * kept separately because a month is often all anybody remembers.
 * ------------------------------------------------------------------ */

CREATE TABLE albums (
  id               CHAR(36)     NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  category_id      CHAR(36)     NULL,
  featured         TINYINT(1)   NOT NULL DEFAULT 0,
  shoot_date       VARCHAR(10)  NULL,
  date_label       VARCHAR(80)  NULL,
  cover            VARCHAR(768) NULL,
  story            TEXT         NULL,
  location         VARCHAR(255) NULL,
  conditions       VARCHAR(255) NULL,
  requests         VARCHAR(500) NULL,
  photos           LONGTEXT     NOT NULL,
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  noindex          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  published_at     INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_albums_slug (slug),
  KEY idx_albums_status_date (status, shoot_date),
  KEY idx_albums_category (category_id),
  CONSTRAINT fk_albums_category FOREIGN KEY (category_id)
    REFERENCES terms (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Guides — the prep guide a client is sent on booking.
 *
 * `details` holds the masthead and the opening letter; the chapters are
 * sections, so a chapter is a widget and its blocks are the widgets after it.
 * ------------------------------------------------------------------ */

CREATE TABLE guides (
  id               CHAR(36)     NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  status           ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  position         SMALLINT     NOT NULL DEFAULT 0,
  session_type_id  CHAR(36)     NULL,
  details          LONGTEXT     NOT NULL,
  meta_title       VARCHAR(255) NULL,
  meta_description VARCHAR(500) NULL,
  noindex          TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at       INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  published_at     INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_guides_slug (slug),
  KEY idx_guides_status (status, position),
  CONSTRAINT fk_guides_session FOREIGN KEY (session_type_id)
    REFERENCES session_types (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

ALTER TABLE session_types
  ADD CONSTRAINT fk_session_types_guide FOREIGN KEY (guide_id)
    REFERENCES guides (id) ON DELETE SET NULL;

CREATE TABLE term_links (
  term_id     CHAR(36) NOT NULL,
  object_type ENUM('post', 'portfolio') NOT NULL,
  object_id   CHAR(36) NOT NULL,
  PRIMARY KEY (term_id, object_type, object_id),
  KEY idx_term_links_object (object_type, object_id),
  CONSTRAINT fk_term_links_term FOREIGN KEY (term_id)
    REFERENCES terms (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Sections — the page builder
 * ------------------------------------------------------------------ */

CREATE TABLE sections (
  id          CHAR(36)     NOT NULL,
  host_type   ENUM('page', 'post', 'session', 'album', 'guide') NOT NULL,
  host_id     CHAR(36)     NOT NULL,
  widget_type VARCHAR(40)  NOT NULL,
  position    SMALLINT     NOT NULL DEFAULT 0,
  hidden      TINYINT(1)   NOT NULL DEFAULT 0,
  content     LONGTEXT     NOT NULL,
  styles      LONGTEXT     NOT NULL,
  created_at  INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at  INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_sections_host (host_type, host_id, position)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Media
 *
 * A photograph is stored as a set of WebP renditions rather than one file,
 * because that is what the site's Photo component renders: a srcset across the
 * widths, the average colour behind it while it loads, and a 20px blur-up.
 *
 *   url      the 1440px rendition — a plain, usable image URL anywhere
 *   prefix   append `-<width>.webp` for any rendition
 *   widths   JSON array of the widths that exist
 *   color    average colour
 *   lqip     data URI of the ~20px placeholder
 *
 * Photographs that ship with the site under /photos have rows too, with a
 * local prefix and an empty r2_key, so the library offers them alongside
 * uploads.
 * ------------------------------------------------------------------ */

CREATE TABLE media (
  id         CHAR(36)     NOT NULL,
  r2_key     VARCHAR(512) NULL,
  url        VARCHAR(768) NOT NULL,
  prefix     VARCHAR(768) NULL,
  widths     VARCHAR(120) NULL,
  color      VARCHAR(40)  NULL,
  lqip       TEXT         NULL,
  filename   VARCHAR(255) NOT NULL,
  mime       VARCHAR(100) NOT NULL,
  bytes      INT UNSIGNED NOT NULL DEFAULT 0,
  width      SMALLINT UNSIGNED NULL,
  height     SMALLINT UNSIGNED NULL,
  alt        VARCHAR(255) NULL,
  folder     VARCHAR(80)  NULL,
  created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_url (url),
  KEY idx_media_created (created_at),
  KEY idx_media_folder (folder)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

/* ------------------------------------------------------------------ *
 * Inquiries — what the contact form sends
 * ------------------------------------------------------------------ */

CREATE TABLE inquiries (
  id          CHAR(36)     NOT NULL,
  name        VARCHAR(160) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(60)  NULL,
  session     VARCHAR(160) NULL,
  tier        VARCHAR(200) NULL,
  timeframe   VARCHAR(160) NULL,
  location    VARCHAR(300) NULL,
  heard_from  VARCHAR(160) NULL,
  message     TEXT         NOT NULL,
  source_path VARCHAR(255) NULL,
  read_at     INT UNSIGNED NULL,
  emailed     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_inquiries_created (created_at),
  KEY idx_inquiries_unread (read_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE redirects (
  id         CHAR(36)     NOT NULL,
  from_path  VARCHAR(255) NOT NULL,
  to_path    VARCHAR(255) NOT NULL,
  created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_redirects_from (from_path)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
