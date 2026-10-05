-- VOLTA · esquema PostgreSQL (válido también en Supabase: SQL Editor → pegar → Run)
-- Idempotente: se puede ejecutar varias veces.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() (ya incluido en PG13+, inofensivo)

DO $$ BEGIN
  CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ───────────────────────── users ─────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      varchar(20)  NOT NULL,
  email         varchar(254) NOT NULL,
  password_hash text         NOT NULL,
  last_seen_at  timestamptz,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT users_username_key    UNIQUE (username),   -- crea índice
  CONSTRAINT users_email_key       UNIQUE (email),
  CONSTRAINT users_username_format CHECK (username ~ '^[A-Za-z0-9_.]{3,20}$')
);
-- Unicidad sin distinguir mayúsculas ("Ana" y "ana" son el mismo usuario) + búsqueda por prefijo
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (lower(username));
CREATE INDEX        IF NOT EXISTS users_username_prefix_idx ON users (lower(username) text_pattern_ops);

-- ───────────────────────── friends ─────────────────────────
-- user_id_1 = quien envía la solicitud · user_id_2 = quien la recibe
CREATE TABLE IF NOT EXISTS friends (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1    uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2    uuid          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       friend_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz   NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT friends_not_self CHECK (user_id_1 <> user_id_2)
);
-- Una sola fila por pareja, sin importar quién la inició (A→B y B→A son la misma relación)
CREATE UNIQUE INDEX IF NOT EXISTS friends_pair_uniq
  ON friends (LEAST(user_id_1, user_id_2), GREATEST(user_id_1, user_id_2));
CREATE INDEX IF NOT EXISTS friends_u1_idx ON friends (user_id_1, status);
CREATE INDEX IF NOT EXISTS friends_u2_idx ON friends (user_id_2, status);

-- ───────────────────────── forum_posts ─────────────────────────
CREATE TABLE IF NOT EXISTS forum_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       text        NOT NULL CHECK (char_length(content) <= 1000),
  progress_data jsonb,                                   -- tarjeta de progreso opcional
  created_at    timestamptz NOT NULL DEFAULT now(),
  -- debe haber texto o tarjeta (el texto puede ir vacío si se comparte solo la tarjeta)
  CONSTRAINT forum_posts_has_body CHECK (char_length(btrim(content)) > 0 OR progress_data IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS forum_posts_created_idx ON forum_posts (created_at DESC, id DESC);   -- feed paginado
CREATE INDEX IF NOT EXISTS forum_posts_user_created_idx ON forum_posts (user_id, created_at DESC); -- cooldown

-- ───────────────────────── Seguridad (Supabase) ─────────────────────────
-- Este servidor se conecta con el rol de base de datos (que ignora RLS) y es el ÚNICO
-- que toca las tablas. Activamos RLS sin políticas para que la anon key de Supabase
-- (si la expones en el HTML) NO pueda leer ni escribir nada directamente.
ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
