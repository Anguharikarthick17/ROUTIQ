import { z } from 'zod';

export const vehicleSchema = z.object({
  id: z.string().min(2, 'Vehicle ID must be at least 2 characters').regex(/^[A-Z0-9-]+$/i, 'Alphanumeric and hyphen only'),
  registration_number: z.string().min(3, 'Registration number is required').toUpperCase(),
  vehicle_type: z.enum(['van', 'truck', 'electric_van', 'cargo_bike', 'refrigerated_truck']),
  capacity: z.number().positive('Capacity must be greater than 0 kg'),
  status: z.enum(['available', 'assigned', 'maintenance', 'inactive']).default('available'),
  notes: z.string().optional(),
});

export const driverSchema = z.object({
  id: z.string().min(2, 'Driver ID must be at least 2 characters').regex(/^[A-Z0-9-]+$/i, 'Alphanumeric and hyphen only'),
  name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  availability_status: z.enum(['available', 'assigned', 'unavailable']).default('available'),
  notes: z.string().optional(),
});

export const deliverySchema = z.object({
  id: z.string().min(2, 'Delivery ID is required'),
  pickup_location: z.string().min(3, 'Pickup location is required'),
  dropoff_location: z.string().min(3, 'Dropoff location is required'),
  pickup_lat: z.number().optional(),
  pickup_lng: z.number().optional(),
  dropoff_lat: z.number().optional(),
  dropoff_lng: z.number().optional(),
  scheduled_time: z.string().min(1, 'Scheduled time is required'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  required_capacity: z.number().positive('Required capacity must be greater than 0 kg'),
  required_vehicle_type: z.enum(['van', 'truck', 'electric_van', 'cargo_bike', 'refrigerated_truck']).optional(),
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']).default('pending'),
});

export const assignmentRequestSchema = z.object({
  delivery_id: z.string().min(1, 'Delivery ID is required'),
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
  driver_id: z.string().min(1, 'Driver ID is required'),
});
