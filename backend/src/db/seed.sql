INSERT INTO products (
    id,
    name,
    type,
    description,
    location,
    capacity,
    slotDurationMins,
    timezone,
    isActive,
    createdAt,
    updatedAt
)
SELECT
    'prod_fasttrack',
    'FastTrack',
    'FAST_TRACK',
    'Security fast track lane for departing passengers.',
    'Terminal 1',
    40,
    15,
    'Europe/London',
    1,
    '2026-05-27T00:00:00.000Z',
    '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-products-v1');

INSERT INTO products (
    id,
    name,
    type,
    description,
    location,
    capacity,
    slotDurationMins,
    timezone,
    isActive,
    createdAt,
    updatedAt
)
SELECT
    'prod_parking',
    'Parking',
    'PARKING',
    'Short-stay parking close to the departure hall.',
    'Car Park A',
    120,
    60,
    'Europe/London',
    1,
    '2026-05-27T00:00:00.000Z',
    '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-products-v1');

INSERT INTO schedules (
    id,
    productId,
    startTime,
    endTime,
    daysOfWeek,
    validFrom,
    validUntil,
    slotIntervalMins,
    createdAt,
    updatedAt
)
SELECT
    'sched_fasttrack_weekday',
    'prod_fasttrack',
    '05:00',
    '10:00',
    '[1,2,3,4,5]',
    '2026-05-27',
    NULL,
    15,
    '2026-05-27T00:00:00.000Z',
    '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-schedules-v1');

INSERT INTO schedules (
    id,
    productId,
    startTime,
    endTime,
    daysOfWeek,
    validFrom,
    validUntil,
    slotIntervalMins,
    createdAt,
    updatedAt
)
SELECT
    'sched_parking_daily',
    'prod_parking',
    '00:00',
    '23:00',
    '[0,1,2,3,4,5,6]',
    '2026-05-27',
    NULL,
    60,
    '2026-05-27T00:00:00.000Z',
    '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-schedules-v1');

INSERT INTO seedHistory (key, createdAt)
SELECT 'initial-products-v1', '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-products-v1');

INSERT INTO seedHistory (key, createdAt)
SELECT 'initial-schedules-v1', '2026-05-27T00:00:00.000Z'
WHERE NOT EXISTS (SELECT 1 FROM seedHistory WHERE key = 'initial-schedules-v1');