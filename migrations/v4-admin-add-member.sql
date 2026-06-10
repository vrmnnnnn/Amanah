-- ============================================================
-- AMANAH v4 — Admin Add Member + Regenerate Invite Code
-- JALANKAN INI DI SUPABASE SQL EDITOR
-- (Project: lmzvaxjjtbfqpgmyilmr)
-- ============================================================

-- 1. FUNCTION: Admin add member by email
-- Admin (family creator) bisa langsung menambahkan anggota via email
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_add_member_by_email(
  p_family_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'Anggota'
)
RETURNS public.family_members AS $$
DECLARE
  v_user_id UUID;
  v_member public.family_members;
BEGIN
  -- Cek caller adalah family creator
  IF NOT EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = p_family_id AND f.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Hanya admin keluarga yang bisa menambah anggota';
  END IF;

  -- Cari user dari auth.users via email (SECURITY DEFINER bisa akses auth schema)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(p_email)
    AND deleted_at IS NULL
    AND banned_until IS NULL;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User dengan email tersebut tidak ditemukan atau belum terdaftar di Amanah';
  END IF;

  -- Cek user belum punya family
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User sudah terdaftar di sebuah keluarga';
  END IF;

  -- Insert member
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (p_family_id, v_user_id, p_role)
  RETURNING * INTO v_member;

  RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCTION: Regenerate invite code
-- Admin bisa generate ulang kode invite keluarga
-- ============================================================
CREATE OR REPLACE FUNCTION public.regenerate_invite_code(p_family_id UUID)
RETURNS public.families AS $$
DECLARE
  v_family public.families;
  v_new_code TEXT;
BEGIN
  -- Cek caller adalah family creator
  IF NOT EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.id = p_family_id AND f.created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Hanya admin keluarga yang bisa generate ulang kode';
  END IF;

  -- Generate kode baru yang unik
  LOOP
    v_new_code := upper(substr(md5(gen_random_uuid()::text), 1, 6));
    IF NOT EXISTS (SELECT 1 FROM public.families WHERE invite_code = v_new_code) THEN
      EXIT;
    END IF;
  END LOOP;

  -- Update
  UPDATE public.families
  SET invite_code = v_new_code
  WHERE id = p_family_id
  RETURNING * INTO v_family;

  RETURN v_family;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. GRANT execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_add_member_by_email(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_invite_code(UUID) TO authenticated;
