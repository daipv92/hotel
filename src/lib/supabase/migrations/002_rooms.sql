-- Room status enum
CREATE TYPE room_status AS ENUM ('ready', 'occupied', 'dirty');

-- Room types
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(12, 0) NOT NULL DEFAULT 0,
  max_occupancy INT NOT NULL DEFAULT 2,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, code)
);

-- Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 1,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  status room_status NOT NULL DEFAULT 'ready',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, room_number)
);

-- Room status change log
CREATE TABLE room_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  old_status room_status,
  new_status room_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_log ENABLE ROW LEVEL SECURITY;

-- Room types policies
CREATE POLICY "Users can view own hotel room types" ON room_types
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admin can insert room types" ON room_types
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can update room types" ON room_types
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete room types" ON room_types
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Rooms policies
CREATE POLICY "Users can view own hotel rooms" ON rooms
  FOR SELECT USING (
    hotel_id IN (SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can insert rooms" ON rooms
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms" ON rooms
  FOR UPDATE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admin can delete rooms" ON rooms
  FOR DELETE USING (
    hotel_id IN (
      SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Room status log policies
CREATE POLICY "Users can view own hotel room logs" ON room_status_log
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM rooms WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert room logs" ON room_status_log
  FOR INSERT WITH CHECK (
    room_id IN (
      SELECT id FROM rooms WHERE hotel_id IN (
        SELECT hotel_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );
