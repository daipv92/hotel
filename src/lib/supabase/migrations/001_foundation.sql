-- Hotels table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'receptionist' CHECK (role IN ('admin', 'receptionist')),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own hotel
CREATE POLICY "Users can view own hotel" ON hotels
  FOR SELECT USING (
    id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Users can only see profiles in their hotel
CREATE POLICY "Users can view profiles in same hotel" ON profiles
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles p WHERE p.id = auth.uid())
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin can manage hotel
CREATE POLICY "Admin can update hotel" ON hotels
  FOR UPDATE USING (
    id IN (
      SELECT hotel_id FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, hotel_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'receptionist'),
    (NEW.raw_user_meta_data->>'hotel_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
