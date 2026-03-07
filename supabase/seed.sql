-- ============================================================
-- Seed Data - Hotel Management System
-- Run AFTER creating a user via Supabase Auth
-- Replace <USER_UUID> with the actual auth.users id
-- ============================================================

-- 1. Create hotel
insert into hotels (id, name, address, phone) values
  ('a0000000-0000-0000-0000-000000000001', 'Khach San Mau', '123 Nguyen Hue, TP.HCM', '0901234567');

-- 2. Create roles
insert into roles (id, hotel_id, name, is_admin) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Quan ly', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Le tan', false);

-- 3. Create admin profile
-- Replace <USER_UUID> with the actual auth.users id from: SELECT id, email FROM auth.users;
-- Example: insert into profiles (id, hotel_id, role_id, full_name) values ('<USER_UUID>', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Admin');

-- 4. Receptionist permissions
insert into role_permissions (role_id, feature) values
  ('b0000000-0000-0000-0000-000000000002', 'dashboard'),
  ('b0000000-0000-0000-0000-000000000002', 'booking_view'),
  ('b0000000-0000-0000-0000-000000000002', 'booking_manage'),
  ('b0000000-0000-0000-0000-000000000002', 'guest_manage'),
  ('b0000000-0000-0000-0000-000000000002', 'finance_income');

-- 4. Floors
insert into floors (id, hotel_id, name, floor_number, sort_order) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Tang 1', 1, 1),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Tang 2', 2, 2),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Tang 3', 3, 3);

-- 5. Room categories
insert into room_categories (id, hotel_id, name, base_price, sort_order) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Phong Thuong', 200000, 1),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Phong VIP', 400000, 2),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Phong Deluxe', 600000, 3);

-- 6. Pricing rules
-- Phong Thuong
insert into pricing_rules (room_category_id, pricing_type, price, min_hours, max_hours, extra_hour_price, description) values
  ('d0000000-0000-0000-0000-000000000001', 'hourly', 70000, 1, 4, 30000, 'Gia theo gio (1-4 gio)'),
  ('d0000000-0000-0000-0000-000000000001', 'overnight', 200000, null, null, null, 'Gia qua dem');
insert into pricing_rules (room_category_id, pricing_type, price, overnight_checkin_from, overnight_checkout_before, description) values
  ('d0000000-0000-0000-0000-000000000001', 'daily', 250000, '22:00', '12:00', 'Gia ca ngay');

-- Phong VIP
insert into pricing_rules (room_category_id, pricing_type, price, min_hours, max_hours, extra_hour_price, description) values
  ('d0000000-0000-0000-0000-000000000002', 'hourly', 120000, 1, 4, 50000, 'Gia theo gio (1-4 gio)'),
  ('d0000000-0000-0000-0000-000000000002', 'overnight', 400000, null, null, null, 'Gia qua dem');
insert into pricing_rules (room_category_id, pricing_type, price, overnight_checkin_from, overnight_checkout_before, description) values
  ('d0000000-0000-0000-0000-000000000002', 'daily', 500000, '22:00', '12:00', 'Gia ca ngay');

-- 7. Rooms
insert into rooms (hotel_id, floor_id, room_category_id, room_number, status, sort_order) values
  -- Tang 1
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '101', 'available', 1),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '102', 'available', 2),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '103', 'available', 3),
  -- Tang 2
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', '201', 'available', 4),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '202', 'available', 5),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', '203', 'available', 6),
  -- Tang 3
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', '301', 'available', 7),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '302', 'available', 8),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '303', 'available', 9);

-- 8. Service categories
insert into service_categories (id, hotel_id, name, sort_order) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Do an', 1),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Do uong', 2),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Dich vu khac', 3);

-- 9. Services
insert into services (hotel_id, category_id, name, price, unit) values
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Com suon', 35000, 'phan'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Mi tom', 15000, 'goi'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Nuoc suoi', 10000, 'chai'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Bia', 20000, 'lon'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Nuoc ngot', 15000, 'lon'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Giat ui', 30000, 'kg'),
  ('a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 'Ve sinh phong', 50000, 'lan');

-- 10. Expense categories
insert into expense_categories (hotel_id, name, sort_order) values
  ('a0000000-0000-0000-0000-000000000001', 'Thuc pham', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Do uong', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Dien', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Nuoc', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Khac', 5);
