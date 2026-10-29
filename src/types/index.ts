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
  score: number;
  reasons: string[];
  capacityFitPct: number;
  isEligible: boolean;
  ineligibilityReason?: string;
}

export interface ScoreBreakdown {
  base: number;
  capacity_fit: number;
  type_match: number;
  priority_boost: number;
  green_bonus: number;
  route_distance_score?: number;
  route_eta_score?: number;
  total: number;
}

export interface RouteTelemetry {
  distanceKm: number;
  durationMinutes: number;
  source: 'OSRM' | 'Simulated Network Geometry' | 'Unavailable';
  isEstimate: boolean;
  status: 'loaded' | 'loading' | 'failed' | 'not_requested';
}

export interface CombinationEvaluation {
  delivery_id: string;
  vehicle_id: string;
  driver_id: string;
  vehicle: Vehicle;
  driver: Driver;
  is_eligible: boolean;
  evaluation_timestamp: string;
  blocking_reasons: string[];
  satisfied_criteria: string[];
  non_blocking_warnings: string[];
  state_freshness: {
    is_stale: boolean;
    evaluated_at: string;
  };
  score_breakdown: ScoreBreakdown;
  route_telemetry?: RouteTelemetry;
  conflicting_delivery_id?: string; // ID of active delivery occupying vehicle or driver
  capacityFitPct: number;
}

export interface DecisionLabWorkspaceState {
  selectedDeliveryId: string | null;
  evaluations: CombinationEvaluation[];
  topRecommendation: CombinationEvaluation | null;
  whyChosenExplanation: string[];
  whyNotOthersExplanations: { vehicle_id: string; driver_id: string; reason: string }[];
  evaluatedAt: string;
  isStale: boolean;
  isLoading: boolean;
}

export interface ConflictItem {
  id: string;
  type: 'OCCUPIED_VEHICLE' | 'OCCUPIED_DRIVER' | 'MAINTENANCE_VEHICLE' | 'INACTIVE_VEHICLE' | 'UNAVAILABLE_DRIVER' | 'BLOCKED_DELIVERY' | 'CAPACITY_MISMATCH';
  title: string;
  resourceId: string;
  resourceLabel: string;
  description: string;
  activeDeliveryId?: string;
  severity: 'high' | 'medium' | 'info';
  actionableStep: string;
}

export interface ConflictRadarData {
  totalConflicts: number;
  occupiedVehicles: { vehicle: Vehicle; activeDeliveryId: string }[];
  occupiedDrivers: { driver: Driver; activeDeliveryId: string }[];
  maintenanceVehicles: Vehicle[];
  inactiveVehicles: Vehicle[];
  unavailableDrivers: Driver[];
  blockedDeliveries: { delivery: Delivery; rootCause: string }[];
  conflictItems: ConflictItem[];
  generatedAt: string;
}

export interface WhatIfSimulationResult {
  isNonMutating: boolean;
  initialHash: string;
  finalHash: string;
  evaluations: CombinationEvaluation[];
  comparisonCandidates: CombinationEvaluation[];
  selectedPair: CombinationEvaluation | null;
}


