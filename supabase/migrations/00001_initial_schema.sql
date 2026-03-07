-- ============================================================
-- Hotel Management System - Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. HOTELS
-- ============================================================
create table hotels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. ROLES & PERMISSIONS
-- ============================================================
create type feature_code as enum (
  'dashboard',
  'booking_view',
  'booking_manage',
  'room_config',
  'service_config',
  'guest_manage',
  'finance_income',
  'finance_expense',
  'reports',
  'user_manage',
  'role_manage',
  'hotel_settings'
);

create table roles (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table role_permissions (
  id uuid primary key default uuid_generate_v4(),
  role_id uuid not null references roles(id) on delete cascade,
  feature feature_code not null,
  created_at timestamptz not null default now(),
  unique (role_id, feature)
);

-- ============================================================
-- 3. USERS (linked to auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  hotel_id uuid not null references hotels(id) on delete cascade,
  role_id uuid not null references roles(id) on delete restrict,
  full_name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 4. FLOORS
-- ============================================================
create table floors (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  floor_number int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, floor_number)
);

-- ============================================================
-- 5. ROOM CATEGORIES
-- ============================================================
create table room_categories (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(12,0) not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, name)
);

-- ============================================================
-- 6. PRICING RULES
-- ============================================================
create type pricing_type as enum (
  'hourly',
  'overnight',
  'daily'
);

create table pricing_rules (
  id uuid primary key default uuid_generate_v4(),
  room_category_id uuid not null references room_categories(id) on delete cascade,
  pricing_type pricing_type not null,
  price numeric(12,0) not null,
  min_hours numeric(4,1),
  max_hours numeric(4,1),
  extra_hour_price numeric(12,0),
  overnight_checkin_from time,
  overnight_checkout_before time,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. ROOMS
-- ============================================================
create type room_status as enum (
  'available',
  'occupied',
  'dirty'
);

create table rooms (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  floor_id uuid not null references floors(id) on delete restrict,
  room_category_id uuid not null references room_categories(id) on delete restrict,
  room_number text not null,
  status room_status not null default 'available',
  sort_order int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hotel_id, room_number)
);

-- ============================================================
-- 8. SERVICE CATEGORIES & SERVICES
-- ============================================================
create table service_categories (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create table services (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  category_id uuid references service_categories(id) on delete set null,
  name text not null,
  price numeric(12,0) not null default 0,
  unit text default 'lan',
  is_active boolean not null default true,
  usage_count int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 9. GUESTS
-- ============================================================
create table guests (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  full_name text not null,
  id_number text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_guests_id_number on guests(hotel_id, id_number) where id_number is not null;
create index idx_guests_name on guests(hotel_id, full_name);

-- ============================================================
-- 10. BOOKINGS
-- ============================================================
create type booking_status as enum (
  'reserved',
  'checked_in',
  'checked_out',
  'cancelled'
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete restrict,
  guest_id uuid references guests(id) on delete set null,
  pricing_type pricing_type,
  status booking_status not null default 'checked_in',
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  expected_check_out_at timestamptz,
  guest_name text not null,
  guest_id_number text,
  guest_count int not null default 1,
  room_charge numeric(12,0) not null default 0,
  service_total numeric(12,0) not null default 0,
  discount numeric(12,0) not null default 0,
  total_amount numeric(12,0) not null default 0,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  checked_out_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_room on bookings(room_id, status);
create index idx_bookings_hotel_status on bookings(hotel_id, status);
create index idx_bookings_checkin on bookings(hotel_id, check_in_at);
create index idx_bookings_checkout on bookings(hotel_id, check_out_at);

-- ============================================================
-- 11. BOOKING SERVICES
-- ============================================================
create table booking_services (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  quantity int not null default 1,
  unit_price numeric(12,0) not null,
  total_price numeric(12,0) not null,
  added_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_booking_services_booking on booking_services(booking_id);

-- ============================================================
-- 12. ROOM CHANGE LOG
-- ============================================================
create table room_changes (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  from_room_id uuid not null references rooms(id) on delete restrict,
  to_room_id uuid not null references rooms(id) on delete restrict,
  changed_by uuid references profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now()
);

-- ============================================================
-- 13. FINANCIAL MANAGEMENT
-- ============================================================
create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (hotel_id, name)
);

create type transaction_type as enum ('income', 'expense');

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  hotel_id uuid not null references hotels(id) on delete cascade,
  type transaction_type not null,
  amount numeric(12,0) not null,
  description text not null,
  booking_id uuid references bookings(id) on delete set null,
  expense_category_id uuid references expense_categories(id) on delete set null,
  transaction_date date not null default current_date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transactions_hotel_date on transactions(hotel_id, transaction_date);
create index idx_transactions_type on transactions(hotel_id, type, transaction_date);

-- ============================================================
-- 14. ADDITIONAL INDEXES
-- ============================================================
create index idx_rooms_hotel on rooms(hotel_id);
create index idx_rooms_floor on rooms(floor_id);
create index idx_rooms_category on rooms(room_category_id);
create index idx_rooms_status on rooms(hotel_id, status);
create index idx_services_hotel on services(hotel_id);
create index idx_services_category on services(category_id);
create index idx_profiles_hotel on profiles(hotel_id);

-- ============================================================
-- 15. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to each table explicitly
create trigger set_updated_at before update on hotels for each row execute function update_updated_at();
create trigger set_updated_at before update on roles for each row execute function update_updated_at();
create trigger set_updated_at before update on profiles for each row execute function update_updated_at();
create trigger set_updated_at before update on floors for each row execute function update_updated_at();
create trigger set_updated_at before update on room_categories for each row execute function update_updated_at();
create trigger set_updated_at before update on pricing_rules for each row execute function update_updated_at();
create trigger set_updated_at before update on rooms for each row execute function update_updated_at();
create trigger set_updated_at before update on services for each row execute function update_updated_at();
create trigger set_updated_at before update on guests for each row execute function update_updated_at();
create trigger set_updated_at before update on bookings for each row execute function update_updated_at();
create trigger set_updated_at before update on transactions for each row execute function update_updated_at();

-- ============================================================
-- 16. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table hotels enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table profiles enable row level security;
alter table floors enable row level security;
alter table room_categories enable row level security;
alter table rooms enable row level security;
alter table service_categories enable row level security;
alter table services enable row level security;
alter table guests enable row level security;
alter table bookings enable row level security;
alter table booking_services enable row level security;
alter table room_changes enable row level security;
alter table expense_categories enable row level security;
alter table transactions enable row level security;
alter table pricing_rules enable row level security;

-- Helper functions
create or replace function get_user_hotel_id()
returns uuid as $$
  select hotel_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid() and r.is_admin = true
  );
$$ language sql security definer stable;

create or replace function has_permission(required_feature feature_code)
returns boolean as $$
  select exists (
    select 1 from profiles p
    join roles r on r.id = p.role_id
    left join role_permissions rp on rp.role_id = r.id
    where p.id = auth.uid()
      and (r.is_admin = true or rp.feature = required_feature)
  );
$$ language sql security definer stable;

-- ============================================================
-- RLS POLICIES: hotels
-- ============================================================
create policy hotels_select on hotels for select to authenticated
  using (id = get_user_hotel_id());
create policy hotels_update on hotels for update to authenticated
  using (id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: profiles
-- ============================================================
create policy profiles_select on profiles for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy profiles_update on profiles for update to authenticated
  using (hotel_id = get_user_hotel_id() and (id = auth.uid() or is_admin()));

-- ============================================================
-- RLS POLICIES: roles
-- ============================================================
create policy roles_select on roles for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy roles_insert on roles for insert to authenticated
  with check (hotel_id = get_user_hotel_id() and is_admin());
create policy roles_update on roles for update to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());
create policy roles_delete on roles for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: role_permissions
-- ============================================================
create policy role_permissions_select on role_permissions for select to authenticated
  using (exists (
    select 1 from roles r where r.id = role_id and r.hotel_id = get_user_hotel_id()
  ));
create policy role_permissions_insert on role_permissions for insert to authenticated
  with check (exists (
    select 1 from roles r where r.id = role_id and r.hotel_id = get_user_hotel_id()
  ) and is_admin());
create policy role_permissions_update on role_permissions for update to authenticated
  using (exists (
    select 1 from roles r where r.id = role_id and r.hotel_id = get_user_hotel_id()
  ) and is_admin());
create policy role_permissions_delete on role_permissions for delete to authenticated
  using (exists (
    select 1 from roles r where r.id = role_id and r.hotel_id = get_user_hotel_id()
  ) and is_admin());

-- ============================================================
-- RLS POLICIES: floors
-- ============================================================
create policy floors_select on floors for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy floors_insert on floors for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy floors_update on floors for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy floors_delete on floors for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: room_categories
-- ============================================================
create policy room_categories_select on room_categories for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy room_categories_insert on room_categories for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy room_categories_update on room_categories for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy room_categories_delete on room_categories for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: rooms
-- ============================================================
create policy rooms_select on rooms for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy rooms_insert on rooms for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy rooms_update on rooms for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy rooms_delete on rooms for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: service_categories
-- ============================================================
create policy service_categories_select on service_categories for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy service_categories_insert on service_categories for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy service_categories_update on service_categories for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy service_categories_delete on service_categories for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: services
-- ============================================================
create policy services_select on services for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy services_insert on services for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy services_update on services for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy services_delete on services for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: guests
-- ============================================================
create policy guests_select on guests for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy guests_insert on guests for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy guests_update on guests for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy guests_delete on guests for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: bookings
-- ============================================================
create policy bookings_select on bookings for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy bookings_insert on bookings for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy bookings_update on bookings for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy bookings_delete on bookings for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: expense_categories
-- ============================================================
create policy expense_categories_select on expense_categories for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy expense_categories_insert on expense_categories for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy expense_categories_update on expense_categories for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy expense_categories_delete on expense_categories for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: transactions
-- ============================================================
create policy transactions_select on transactions for select to authenticated
  using (hotel_id = get_user_hotel_id());
create policy transactions_insert on transactions for insert to authenticated
  with check (hotel_id = get_user_hotel_id());
create policy transactions_update on transactions for update to authenticated
  using (hotel_id = get_user_hotel_id());
create policy transactions_delete on transactions for delete to authenticated
  using (hotel_id = get_user_hotel_id() and is_admin());

-- ============================================================
-- RLS POLICIES: booking_services (via booking)
-- ============================================================
create policy booking_services_select on booking_services for select to authenticated
  using (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ));
create policy booking_services_insert on booking_services for insert to authenticated
  with check (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ));
create policy booking_services_update on booking_services for update to authenticated
  using (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ));
create policy booking_services_delete on booking_services for delete to authenticated
  using (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ) and is_admin());

-- ============================================================
-- RLS POLICIES: room_changes (via booking)
-- ============================================================
create policy room_changes_select on room_changes for select to authenticated
  using (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ));
create policy room_changes_insert on room_changes for insert to authenticated
  with check (exists (
    select 1 from bookings b where b.id = booking_id and b.hotel_id = get_user_hotel_id()
  ));

-- ============================================================
-- RLS POLICIES: pricing_rules (via room_category)
-- ============================================================
create policy pricing_rules_select on pricing_rules for select to authenticated
  using (exists (
    select 1 from room_categories rc where rc.id = room_category_id and rc.hotel_id = get_user_hotel_id()
  ));
create policy pricing_rules_insert on pricing_rules for insert to authenticated
  with check (exists (
    select 1 from room_categories rc where rc.id = room_category_id and rc.hotel_id = get_user_hotel_id()
  ) and is_admin());
create policy pricing_rules_update on pricing_rules for update to authenticated
  using (exists (
    select 1 from room_categories rc where rc.id = room_category_id and rc.hotel_id = get_user_hotel_id()
  ) and is_admin());
create policy pricing_rules_delete on pricing_rules for delete to authenticated
  using (exists (
    select 1 from room_categories rc where rc.id = room_category_id and rc.hotel_id = get_user_hotel_id()
  ) and is_admin());

-- ============================================================
-- 17. VIEWS FOR REPORTING
-- ============================================================

-- Daily revenue summary
create or replace view v_daily_revenue as
select
  b.hotel_id,
  date(b.check_out_at) as revenue_date,
  count(*) as total_bookings,
  sum(b.room_charge) as room_revenue,
  sum(b.service_total) as service_revenue,
  sum(b.total_amount) as total_revenue
from bookings b
where b.status = 'checked_out'
  and b.check_out_at is not null
group by b.hotel_id, date(b.check_out_at);

-- Room occupancy view
create or replace view v_room_occupancy as
select
  r.hotel_id,
  r.id as room_id,
  r.room_number,
  r.status,
  f.name as floor_name,
  f.floor_number,
  rc.name as category_name,
  b.id as current_booking_id,
  b.guest_name as current_guest,
  b.check_in_at,
  fb.id as future_booking_id,
  fb.guest_name as future_guest,
  fb.check_in_at as future_check_in
from rooms r
join floors f on f.id = r.floor_id
join room_categories rc on rc.id = r.room_category_id
left join bookings b on b.room_id = r.id and b.status = 'checked_in'
left join lateral (
  select bk.id, bk.guest_name, bk.check_in_at from bookings bk
  where bk.room_id = r.id
    and bk.status = 'reserved'
    and bk.check_in_at > now()
  order by bk.check_in_at
  limit 1
) fb on true;

-- Monthly financial summary
create or replace view v_monthly_finance as
select
  hotel_id,
  date_trunc('month', transaction_date)::date as month,
  type,
  sum(amount) as total_amount,
  count(*) as transaction_count
from transactions
group by hotel_id, date_trunc('month', transaction_date), type;
