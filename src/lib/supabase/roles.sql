-- ==============================================================================
-- WeatherGPT Production Role Authorization Schema & RLS Policies
-- ==============================================================================
-- Execute this entire script in your Supabase Dashboard:
-- Supabase Dashboard -> Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create the user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policy: Users can only READ their own role
DROP POLICY IF EXISTS "Allow users to read their own role" ON public.user_roles;
CREATE POLICY "Allow users to read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- IMPORTANT SECURITY RULE:
-- Notice that NO INSERT, UPDATE, OR DELETE policies exist for authenticated users!
-- A normal authenticated client CANNOT alter their role to 'admin' via client-side APIs.

-- 4. Trigger function to automatically grant 'user' role on every new sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ==============================================================================
-- 👑 HOW TO ASSIGN YOUR FIRST ADMIN ACCOUNT SECURELY
-- ==============================================================================
-- Step 1: Sign up the admin email address in WeatherGPT (/login -> Create one).
-- Step 2: In Supabase Dashboard -> SQL Editor, run the command below:
-- (Replace 'admin@weathergpt.com' with the actual email you signed up)
--
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'
-- FROM auth.users
-- WHERE email = 'admin@weathergpt.com'
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
--
-- To verify the role was successfully assigned:
-- SELECT u.email, r.role, r.created_at
-- FROM auth.users u
-- JOIN public.user_roles r ON u.id = r.user_id
-- WHERE u.email = 'admin@weathergpt.com';
-- ==============================================================================
