-- Guests
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  id_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  nationality TEXT DEFAULT 'Viet Nam',
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Booking status
CREATE TYPE booking_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  booking_code TEXT NOT NULL,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  num_guests INT NOT NULL DEFAULT 1,
  status booking_status NOT NULL DEFAULT 'confirmed',
  total_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, booking_code)
);

-- Booking services
CREATE TABLE booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  total_price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;

-- Guests policies
CREATE POLICY "Users can view own hotel guests" ON guests
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can insert guests" ON guests
  FOR INSERT WITH CHECK (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can update guests" ON guests
  FOR UPDATE USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Bookings policies
CREATE POLICY "Users can view own hotel bookings" ON bookings
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can insert bookings" ON bookings
  FOR INSERT WITH CHECK (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can update bookings" ON bookings
  FOR UPDATE USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Booking services policies
CREATE POLICY "Users can view booking services" ON booking_services
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert booking services" ON booking_services
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update booking services" ON booking_services
  FOR UPDATE USING (
    booking_id IN (
      SELECT id FROM bookings WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete booking services" ON booking_services
  FOR DELETE USING (
    booking_id IN (
      SELECT id FROM bookings WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

-- Auto-generate booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
DECLARE
  seq INT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq FROM bookings WHERE hotel_id = NEW.hotel_id;
  NEW.booking_code := 'BK' || to_char(now(), 'YYMMDD') || '-' || lpad(seq::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_code
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_code IS NULL OR NEW.booking_code = '')
  EXECUTE FUNCTION generate_booking_code();
