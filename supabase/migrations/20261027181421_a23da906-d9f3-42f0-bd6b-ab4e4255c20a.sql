-- Enums
CREATE TYPE public.company_role AS ENUM ('owner', 'admin', 'finance_manager', 'viewer');
CREATE TYPE public.membership_status AS ENUM ('invited', 'active', 'suspended');

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text CHECK (full_name IS NULL OR char_length(full_name) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 200),
  primary_currency char(3) NOT NULL CHECK (primary_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- No INSERT grant: companies are created only through public.create_company()
GRANT SELECT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 3. company_members
CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'viewer',
  status public.membership_status NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_members_company_user_unique UNIQUE (company_id, user_id)
);
CREATE INDEX company_members_user_id_idx ON public.company_members (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Helper functions (always check the calling user; cannot probe other users)
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_company_id uuid, _roles public.company_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id AND user_id = auth.uid()
      AND status = 'active' AND role = ANY(_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_company_with(_other_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members me
    JOIN public.company_members them ON them.company_id = me.company_id
    WHERE me.user_id = auth.uid() AND me.status = 'active' AND them.user_id = _other_user
  );
$$;

-- Create a company and make the caller its active owner, atomically
CREATE OR REPLACE FUNCTION public.create_company(_name text, _primary_currency text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _company_id uuid;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.profiles (id) VALUES (_uid) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.companies (name, primary_currency)
  VALUES (btrim(_name), upper(btrim(_primary_currency)))
  RETURNING id INTO _company_id;
  INSERT INTO public.company_members (company_id, user_id, role, status)
  VALUES (_company_id, _uid, 'owner', 'active');
  RETURN _company_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_company_role(uuid, public.company_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.shares_company_with(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_company(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, public.company_role[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.shares_company_with(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_company(text, text) TO authenticated, service_role;

-- Membership integrity: immutable keys, always keep at least one active owner
CREATE OR REPLACE FUNCTION public.protect_company_membership()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.company_id <> OLD.company_id OR NEW.user_id <> OLD.user_id) THEN
    RAISE EXCEPTION 'company_id and user_id cannot be changed' USING ERRCODE = '42501';
  END IF;

  IF OLD.role = 'owner' AND OLD.status = 'active'
     AND (TG_OP = 'DELETE' OR NEW.role <> 'owner' OR NEW.status <> 'active') THEN
    -- Allow cascades when the company or the user's profile is being deleted
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE id = OLD.company_id)
       OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = OLD.user_id) THEN
      RETURN COALESCE(NEW, OLD);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_id = OLD.company_id AND id <> OLD.id
        AND role = 'owner' AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'A company must keep at least one active owner' USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.protect_company_membership() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER protect_company_membership
BEFORE UPDATE OR DELETE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.protect_company_membership();

-- updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create a profile for every new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, left(NEW.raw_user_meta_data ->> 'full_name', 200))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for any existing users (no data is removed)
INSERT INTO public.profiles (id) SELECT id FROM auth.users ON CONFLICT (id) DO NOTHING;

-- RLS: profiles
CREATE POLICY "Users can view own profile or teammates"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.shares_company_with(id));

CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- RLS: companies
CREATE POLICY "Active members can view their companies"
ON public.companies FOR SELECT TO authenticated
USING (public.is_company_member(id));

CREATE POLICY "Owners and admins can update company"
ON public.companies FOR UPDATE TO authenticated
USING (public.has_company_role(id, ARRAY['owner','admin']::public.company_role[]))
WITH CHECK (public.has_company_role(id, ARRAY['owner','admin']::public.company_role[]));

CREATE POLICY "Owners can delete company"
ON public.companies FOR DELETE TO authenticated
USING (public.has_company_role(id, ARRAY['owner']::public.company_role[]));

-- RLS: company_members
CREATE POLICY "Members can view memberships of their companies"
ON public.company_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_company_member(company_id));

CREATE POLICY "Owners and admins can add members"
ON public.company_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_company_role(company_id, ARRAY['owner','admin']::public.company_role[])
  AND (role <> 'owner' OR public.has_company_role(company_id, ARRAY['owner']::public.company_role[]))
);

CREATE POLICY "Owners and admins can update members"
ON public.company_members FOR UPDATE TO authenticated
USING (
  public.has_company_role(company_id, ARRAY['owner','admin']::public.company_role[])
  AND (role <> 'owner' OR public.has_company_role(company_id, ARRAY['owner']::public.company_role[]))
)
WITH CHECK (
  public.has_company_role(company_id, ARRAY['owner','admin']::public.company_role[])
  AND (role <> 'owner' OR public.has_company_role(company_id, ARRAY['owner']::public.company_role[]))
);

CREATE POLICY "Owners and admins can remove members; users can leave"
ON public.company_members FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR (
    public.has_company_role(company_id, ARRAY['owner','admin']::public.company_role[])
    AND (role <> 'owner' OR public.has_company_role(company_id, ARRAY['owner']::public.company_role[]))
  )
);