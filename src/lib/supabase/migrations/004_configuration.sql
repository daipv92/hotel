-- Pricing type enum
CREATE TYPE pricing_type AS ENUM ('hourly', 'daily');

-- Service category enum
CREATE TYPE service_category AS ENUM ('food', 'drink', 'clean', 'other');

-- ============================================================
-- Floors
-- ============================================================
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor_number INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, floor_number)
);

ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hotel floors" ON floors
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admin can insert floors" ON floors
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update floors" ON floors
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete floors" ON floors
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Pricing Rules
-- ============================================================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  pricing_type pricing_type NOT NULL,
  price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  start_hour INT CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour INT CHECK (end_hour >= 0 AND end_hour <= 23),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pricing_rules_room_type ON pricing_rules(room_type_id);

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hotel pricing rules" ON pricing_rules
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admin can insert pricing rules" ON pricing_rules
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update pricing rules" ON pricing_rules
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete pricing rules" ON pricing_rules
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- Services
-- ============================================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  category service_category NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_category ON services(category);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hotel services" ON services
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admin can insert services" ON services
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update services" ON services
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete services" ON services
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
