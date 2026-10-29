-- ROUTIQ Seed Data
-- Migration 004: Realistic Demonstration Dataset

-- 1. Insert Vehicles (diverse fleet types, capacities, and states)
INSERT INTO public.vehicles (id, registration_number, vehicle_type, capacity, status, notes) VALUES
('V-101', 'KA-01-EQ-9021', 'electric_van', 750, 'available', 'Eco transit unit, fully charged'),
('V-102', 'KA-01-TR-4412', 'truck', 2500, 'available', 'Heavy freight, lift gate equipped'),
('V-103', 'KA-02-VN-8831', 'van', 1100, 'assigned', 'Currently active on route DEL-202'),
('V-104', 'KA-03-RF-5509', 'refrigerated_truck', 1800, 'maintenance', 'Cooling compressor scheduled maintenance'),
('V-105', 'KA-04-CB-1120', 'cargo_bike', 150, 'available', 'Downtown micro-hub parcel bike'),
('V-106', 'KA-05-VN-3388', 'van', 1200, 'inactive', 'Awaiting insurance renewal')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Drivers
INSERT INTO public.drivers (id, name, phone, availability_status, notes) VALUES
('DR-01', 'Marcus Vance', '+1 (555) 234-5678', 'available', 'Lead courier, hazardous materials certified'),
('DR-02', 'Elena Rostova', '+1 (555) 345-6789', 'available', 'Express delivery specialist'),
('DR-03', 'Devon Miller', '+1 (555) 456-7890', 'assigned', 'Assigned to DEL-202 (In Transit)'),
('DR-04', 'Aaliyah Chen', '+1 (555) 567-8901', 'unavailable', 'On scheduled leave'),
('DR-05', 'Kofi Mensah', '+1 (555) 678-9012', 'available', 'Cold-chain logistics certified')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Deliveries (with geographic coordinates for realistic map routing)
INSERT INTO public.deliveries (
    id, pickup_location, dropoff_location,
    pickup_lat, pickup_lng, dropoff_lat, dropoff_lng,
    scheduled_time, priority, required_capacity, required_vehicle_type, status,
    assigned_vehicle_id, assigned_driver_id
) VALUES
(
    'DEL-201', 'Central Logistics Hub, Gate 4', 'Apex Tech Park, Block C',
    37.7749, -122.4194, 37.7892, -122.4014,
    NOW() + INTERVAL '2 hours', 'urgent', 450, 'electric_van', 'pending',
    NULL, NULL
),
(
    'DEL-202', 'Port Terminal 9', 'Metro Distribution Center',
    37.7955, -122.3937, 37.7648, -122.4222,
    NOW() + INTERVAL '45 minutes', 'high', 950, 'van', 'in_transit',
    'V-103', 'DR-03'
),
(
    'DEL-203', 'BioPharma Laboratories', 'St. Jude Regional Hospital',
    37.7580, -122.4350, 37.7845, -122.4410,
    NOW() + INTERVAL '3 hours', 'high', 320, 'refrigerated_truck', 'pending',
    NULL, NULL
),
(
    'DEL-204', 'Urban Artisan Roastery', 'Nordic Bakery & Cafe',
    37.7690, -122.4467, 37.7765, -122.4242,
    NOW() + INTERVAL '5 hours', 'normal', 80, 'cargo_bike', 'pending',
    NULL, NULL
),
(
    'DEL-205', 'Pacific Electronics Depot', 'Silicon Boulevard Retail Center',
    37.7600, -122.3900, 37.7880, -122.4080,
    NOW() - INTERVAL '3 hours', 'normal', 1200, 'truck', 'delivered',
    'V-102', 'DR-01'
),
(
    'DEL-206', 'QuickFreight Bay 2', 'Summit Corporate Center',
    37.7820, -122.4110, 37.7910, -122.4020,
    NOW() - INTERVAL '5 hours', 'low', 200, 'van', 'cancelled',
    NULL, NULL
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Initial Active and Historical Assignments
INSERT INTO public.assignments (delivery_id, vehicle_id, driver_id, status, assigned_at, completed_at, assigned_by)
VALUES
('DEL-202', 'V-103', 'DR-03', 'active', NOW() - INTERVAL '1 hour', NULL, 'dispatcher'),
('DEL-205', 'V-102', 'DR-01', 'completed', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '3 hours', 'dispatcher');

-- 5. Insert Sample Audit Logs
INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, details, timestamp)
VALUES
('SEED_INITIALIZE', 'SYSTEM', 'GLOBAL', 'system', '{"message": "Demo logistics state initialized"}', NOW() - INTERVAL '6 hours'),
('ASSIGN_DELIVERY', 'DELIVERY', 'DEL-202', 'dispatcher', '{"vehicle_id": "V-103", "driver_id": "DR-03"}', NOW() - INTERVAL '1 hour'),
('COMPLETE_DELIVERY', 'DELIVERY', 'DEL-205', 'dispatcher', '{"released_vehicle_id": "V-102", "released_driver_id": "DR-01"}', NOW() - INTERVAL '3 hours');
