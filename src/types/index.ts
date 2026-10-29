// ROUTIQ Domain Types

export type VehicleType = 'van' | 'truck' | 'electric_van' | 'cargo_bike' | 'refrigerated_truck';
export type VehicleStatus = 'available' | 'assigned' | 'maintenance' | 'inactive';

export interface Vehicle {
  id: string; // e.g. "V-101"
  registration_number: string;
  vehicle_type: VehicleType;
  capacity: number; // in kg
  status: VehicleStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type DriverStatus = 'available' | 'assigned' | 'unavailable';

export interface Driver {
  id: string; // e.g. "DR-01"
  name: string;
  phone: string;
  availability_status: DriverStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type DeliveryPriority = 'low' | 'normal' | 'high' | 'urgent';
export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Delivery {
  id: string; // e.g. "DEL-201"
  pickup_location: string;
  dropoff_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  scheduled_time: string;
  priority: DeliveryPriority;
  required_capacity: number; // in kg
  required_vehicle_type?: VehicleType;
  status: DeliveryStatus;
  assigned_vehicle_id?: string | null;
  assigned_driver_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface Assignment {
  id: string;
  delivery_id: string;
  vehicle_id: string;
  driver_id: string;
  status: AssignmentStatus;
  assigned_at: string;
  completed_at?: string | null;
  assigned_by: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: 'DELIVERY' | 'VEHICLE' | 'DRIVER' | 'ASSIGNMENT' | 'SYSTEM';
  entity_id: string;
  details?: Record<string, unknown>;
  actor_id?: string;
  timestamp: string;
}

export type UserRole = 'dispatcher' | 'fleet_manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization_id?: string;
}

export type AssignmentErrorCode =
  | 'DELIVERY_NOT_FOUND'
  | 'DELIVERY_NOT_PENDING'
  | 'VEHICLE_NOT_FOUND'
  | 'VEHICLE_UNAVAILABLE'
  | 'VEHICLE_CAPACITY_MISMATCH'
  | 'DRIVER_NOT_FOUND'
  | 'DRIVER_UNAVAILABLE'
  | 'ASSIGNMENT_CONFLICT'
  | 'INVALID_TRANSITION'
  | 'UNAUTHORIZED';

export interface AssignmentResult {
  success: boolean;
  error_code?: AssignmentErrorCode;
  message: string;
  assignment_id?: string;
  delivery_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  released_vehicle_id?: string;
  released_driver_id?: string;
}

export interface RecommendationScore {
  vehicle: Vehicle;
  driver: Driver;
  score: number; // 0 to 100
  reasons: string[];
  capacityFitPct: number;
  isEligible: boolean;
  ineligibilityReason?: string;
}
