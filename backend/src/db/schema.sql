PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS slotGenerationLocks;
DROP TABLE IF EXISTS waitlist;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS products;

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PARKING', 'FAST_TRACK', 'LOUNGE')),
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity >= 0),
    slotDurationMins INTEGER NOT NULL CHECK (slotDurationMins > 0),
    timezone TEXT NOT NULL,
    isActive INTEGER NOT NULL DEFAULT 1 CHECK (isActive IN (0, 1)),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    daysOfWeek TEXT NOT NULL,
    validFrom TEXT NOT NULL,
    validUntil TEXT,
    slotIntervalMins INTEGER NOT NULL CHECK (slotIntervalMins > 0),
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    scheduleId TEXT NOT NULL,
    productId TEXT NOT NULL,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    totalCapacity INTEGER NOT NULL CHECK (totalCapacity >= 0),
    bookedCount INTEGER NOT NULL DEFAULT 0 CHECK (bookedCount >= 0 AND bookedCount <= totalCapacity),
    status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'FULL', 'BLOCKED')),
    createdAt TEXT NOT NULL,
    FOREIGN KEY (scheduleId) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (productId, date, startTime)
);

CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slotId TEXT NOT NULL,
    productId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    bookingRef TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    bookedAt TEXT NOT NULL,
    cancelledAt TEXT,
    notes TEXT,
    FOREIGN KEY (slotId) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    slotId TEXT NOT NULL,
    productId TEXT NOT NULL,
    customerName TEXT NOT NULL,
    customerEmail TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    status TEXT NOT NULL CHECK (status IN ('WAITING', 'PROMOTED', 'EXPIRED', 'CANCELLED')),
    createdAt TEXT NOT NULL,
    promotedAt TEXT,
    FOREIGN KEY (slotId) REFERENCES slots(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE (slotId, position)
);

CREATE TABLE IF NOT EXISTS slotGenerationLocks (
    productId TEXT PRIMARY KEY,
    fromDate TEXT NOT NULL,
    toDate TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('preview', 'replace')),
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_productId
    ON schedules(productId);

CREATE INDEX IF NOT EXISTS idx_slots_scheduleId
    ON slots(scheduleId);

CREATE INDEX IF NOT EXISTS idx_slots_productDate
    ON slots(productId, date);

CREATE INDEX IF NOT EXISTS idx_slots_status
    ON slots(status);

CREATE INDEX IF NOT EXISTS idx_bookings_slotId
    ON bookings(slotId);

CREATE INDEX IF NOT EXISTS idx_bookings_productId
    ON bookings(productId);

CREATE INDEX IF NOT EXISTS idx_bookings_status
    ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_waitlist_slotStatusPosition
    ON waitlist(slotId, status, position);

CREATE INDEX IF NOT EXISTS idx_waitlist_productId
    ON waitlist(productId);

CREATE INDEX IF NOT EXISTS idx_slotGenerationLocks_expiresAt
    ON slotGenerationLocks(expiresAt);