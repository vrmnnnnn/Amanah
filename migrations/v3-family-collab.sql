-- ============================================================
-- AMANAH v3 — Kolaborasi Keluarga
-- Migration: restructure untuk multi-user family
-- ============================================================
-- JALANKAN INI DI SUPABASE SQL EDITOR
-- (Project: lmzvaxjjtbfqpgmyilmr)
-- ============================================================

-- 1. HAPUS DATA LAMA (user minta hapus semua)
-- ============================================================
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;

-- 2. BUAT TABEL families
-- ============================================================
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BUAT TABEL family_members (1 user = 1 family)
-- ============================================================
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Anggota',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. BUAT TABEL transactions (dengan family_id)
-- ============================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('masuk', 'keluar')),
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ENABLE RLS
-- ============================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES — families
-- ============================================================
-- Siapapun authenticated bisa bikin family
CREATE POLICY "Users can create families"
  ON public.families FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Creator selalu bisa lihat family sendiri (bahkan sebelum jadi member)
CREATE POLICY "Creator can view own family"
  ON public.families FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Member bisa lihat family lewat family_members
CREATE POLICY "Members can view their family"
  ON public.families FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = families.id
      AND fm.user_id = auth.uid()
    )
  );

-- 7. RLS POLICIES — family_members
-- ============================================================
-- Security definer function: cek user adalah member family (bypass RLS di subquery)
CREATE OR REPLACE FUNCTION public.is_family_member(p_family_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = p_family_id AND user_id = auth.uid()
  );
END;
$$;

-- Lihat anggota di family yang sama (pakai function, hindari infinite recursion)
CREATE POLICY "Users can view members in same family"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (public.is_family_member(family_id));

-- Gabung family (insert) — pake invite_code
CREATE POLICY "Users can join family with invite code"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id
    )
  );

-- Hapus anggota (creator atau diri sendiri)
CREATE POLICY "Creator or self can delete member"
  ON public.family_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.created_by = auth.uid()
    )
  );

-- Update role (creator only)
CREATE POLICY "Creator can update member role"
  ON public.family_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.id = family_id AND f.created_by = auth.uid()
    )
  );

-- 8. RLS POLICIES — transactions
-- ============================================================
-- Lihat transaksi di family sendiri
CREATE POLICY "Users can view family transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = transactions.family_id
      AND fm.user_id = auth.uid()
    )
  );

-- Insert transaksi (harus anggota family)
CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = transactions.family_id
      AND fm.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Update transaksi sendiri
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete transaksi sendiri
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. FUNCTION: gabung family via invite code
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_family(p_invite_code TEXT, p_role TEXT DEFAULT 'Anggota')
RETURNS public.family_members AS $$
DECLARE
  v_family_id UUID;
  v_member public.family_members;
BEGIN
  -- Cari family dari kode
  SELECT id INTO v_family_id FROM public.families WHERE upper(invite_code) = upper(p_invite_code);
  
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Kode invite tidak valid';
  END IF;
  
  -- Cek user belum punya family
  IF EXISTS (SELECT 1 FROM public.family_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Kamu sudah terdaftar di sebuah keluarga';
  END IF;
  
  -- Insert member
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family_id, auth.uid(), p_role)
  RETURNING * INTO v_member;
  
  RETURN v_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. INDEXES
-- ============================================================
CREATE INDEX idx_family_members_user ON public.family_members(user_id);
CREATE INDEX idx_family_members_family ON public.family_members(family_id);
CREATE INDEX idx_transactions_family ON public.transactions(family_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);
