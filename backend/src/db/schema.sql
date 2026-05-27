PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PARKING', 'FAST_TRACK', 'LOUNGE')),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    slot_duration_mins INTEGER NOT NULL CHECK (slot_duration_mins > 0),
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    days_of_week TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT,
    slot_interval_mins INTEGER NOT NULL CHECK (slot_interval_mins > 0),
    created_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    schedule_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    total_capacity INTEGER NOT NULL CHECK (total_capacity >= 0),
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0 AND booked_count <= total_capacity),
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'FULL', 'BLOCKED')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (product_id, date, start_time)
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    booking_ref TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    booked_at TEXT NOT NULL,
    cancelled_at TEXT,
    notes TEXT,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED')),
    created_at TEXT NOT NULL,
    promoted_at TEXT,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (slot_id, position)
);

CREATE INDEX IF NOT EXISTS idx_schedules_product_id
    ON schedules(product_id);

CREATE INDEX IF NOT EXISTS idx_slots_schedule_id
    ON slots(schedule_id);

CREATE INDEX IF NOT EXISTS idx_slots_product_date
    ON slots(product_id, date);

CREATE INDEX IF NOT EXISTS idx_slots_status
    ON slots(status);

CREATE INDEX IF NOT EXISTS idx_bookings_slot_id
    ON bookings(slot_id);

CREATE INDEX IF NOT EXISTS idx_bookings_product_id
    ON bookings(product_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_slot_status_position
    ON waitlist(slot_id, status, position);

CREATE INDEX IF NOT EXISTS idx_waitlist_product_id
    ON waitlist(product_id);