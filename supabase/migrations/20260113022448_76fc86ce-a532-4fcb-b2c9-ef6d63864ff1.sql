-- Ensure user_roles has exactly one role per user to avoid .single() failures
-- Keep strongest role when duplicates exist: admin > manager > member

WITH ranked AS (
  SELECT
    id,
    user_id,
    role,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY CASE role
        WHEN 'admin' THEN 1
        WHEN 'manager' THEN 2
        WHEN 'member' THEN 3
        ELSE 99
      END,
      id
    ) AS rn
  FROM public.user_roles
)
DELETE FROM public.user_roles ur
USING ranked r
WHERE ur.id = r.id
  AND r.rn > 1;

-- Enforce one role per user going forward
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_one_role_per_user'
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_one_role_per_user UNIQUE (user_id);
  END IF;
END $$;
