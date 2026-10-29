import { Assignment, AuditLog, Delivery, Driver, Vehicle } from '../types';

export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'V-101',
    registration_number: 'KA-01-EQ-9021',
    vehicle_type: 'electric_van',
    capacity: 750,
    status: 'available',
    notes: 'Eco transit unit, fully charged',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'V-102',
    registration_number: 'KA-01-TR-4412',
    vehicle_type: 'truck',
    capacity: 2500,
    status: 'available',
    notes: 'Heavy freight, lift gate equipped',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'V-103',
    registration_number: 'KA-02-VN-8831',
    vehicle_type: 'van',
    capacity: 1100,
    status: 'assigned',
    notes: 'Currently active on route DEL-202',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'V-104',
    registration_number: 'KA-03-RF-5509',
    vehicle_type: 'refrigerated_truck',
    capacity: 1800,
    status: 'maintenance',
    notes: 'Cooling compressor scheduled maintenance',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'V-105',
    registration_number: 'KA-04-CB-1120',
    vehicle_type: 'cargo_bike',
    capacity: 150,
    status: 'available',
    notes: 'Downtown micro-hub parcel bike',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'V-106',
    registration_number: 'KA-05-VN-3388',
    vehicle_type: 'van',
    capacity: 1200,
    status: 'inactive',
    notes: 'Awaiting insurance renewal',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'DR-01',
    name: 'Marcus Vance',
    phone: '+1 (555) 234-5678',
    availability_status: 'available',
    notes: 'Lead courier, hazardous materials certified',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'DR-02',
    name: 'Elena Rostova',
    phone: '+1 (555) 345-6789',
    availability_status: 'available',
    notes: 'Express delivery specialist',
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'DR-03',
    name: 'Devon Miller',
    phone: '+1 (555) 456-7890',
    availability_status: 'assigned',
    notes: 'Assigned to DEL-202 (In Transit)',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'DR-04',
    name: 'Aaliyah Chen',
    phone: '+1 (555) 567-8901',
    availability_status: 'unavailable',
    notes: 'On scheduled medical leave',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'DR-05',
    name: 'Kofi Mensah',
    phone: '+1 (555) 678-9012',
    availability_status: 'available',
    notes: 'Cold-chain certified heavy transporter',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: 'DEL-201',
    pickup_location: 'Central Logistics Hub, Gate 4',
    dropoff_location: 'Apex Tech Park, Block C',
    pickup_lat: 37.7749,
    pickup_lng: -122.4194,
    dropoff_lat: 37.7892,
    dropoff_lng: -122.4014,
    scheduled_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    priority: 'urgent',
    required_capacity: 450,
    required_vehicle_type: 'electric_van',
    status: 'pending',
    assigned_vehicle_id: null,
    assigned_driver_id: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'DEL-202',
    pickup_location: 'Port Terminal 9',
    dropoff_location: 'Metro Distribution Center',
    pickup_lat: 37.7955,
    pickup_lng: -122.3937,
    dropoff_lat: 37.7648,
    dropoff_lng: -122.4222,
    scheduled_time: new Date(Date.now() + 2700000).toISOString(), // 45 mins from now
    priority: 'high',
    required_capacity: 950,
    required_vehicle_type: 'van',
    status: 'in_transit',
    assigned_vehicle_id: 'V-103',
    assigned_driver_id: 'DR-03',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'DEL-203',
    pickup_location: 'BioPharma Laboratories',
    dropoff_location: 'St. Jude Regional Hospital',
    pickup_lat: 37.758,
    pickup_lng: -122.435,
    dropoff_lat: 37.7845,
    dropoff_lng: -122.441,
    scheduled_time: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
    priority: 'high',
    required_capacity: 320,
    required_vehicle_type: 'refrigerated_truck',
    status: 'pending',
    assigned_vehicle_id: null,
    assigned_driver_id: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'DEL-204',
    pickup_location: 'Urban Artisan Roastery',
    dropoff_location: 'Nordic Bakery & Cafe',
    pickup_lat: 37.769,
    pickup_lng: -122.4467,
    dropoff_lat: 37.7765,
    dropoff_lng: -122.4242,
    scheduled_time: new Date(Date.now() + 18000000).toISOString(), // 5 hours from now
    priority: 'normal',
    required_capacity: 80,
    required_vehicle_type: 'cargo_bike',
    status: 'pending',
    assigned_vehicle_id: null,
    assigned_driver_id: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'DEL-205',
    pickup_location: 'Pacific Electronics Depot',
    dropoff_location: 'Silicon Boulevard Retail Center',
    pickup_lat: 37.76,
    pickup_lng: -122.39,
    dropoff_lat: 37.788,
    dropoff_lng: -122.408,
    scheduled_time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    priority: 'normal',
    required_capacity: 1200,
    required_vehicle_type: 'truck',
    status: 'delivered',
    assigned_vehicle_id: 'V-102',
    assigned_driver_id: 'DR-01',
    created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'DEL-206',
    pickup_location: 'QuickFreight Bay 2',
    dropoff_location: 'Summit Corporate Center',
    pickup_lat: 37.782,
    pickup_lng: -122.411,
    dropoff_lat: 37.791,
    dropoff_lng: -122.402,
    scheduled_time: new Date(Date.now() - 18000000).toISOString(),
    priority: 'low',
    required_capacity: 200,
    required_vehicle_type: 'van',
    status: 'cancelled',
    assigned_vehicle_id: null,
    assigned_driver_id: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asgn-001',
    delivery_id: 'DEL-202',
    vehicle_id: 'V-103',
    driver_id: 'DR-03',
    status: 'active',
    assigned_at: new Date(Date.now() - 3600000).toISOString(),
    completed_at: null,
    assigned_by: 'dispatcher',
  },
  {
    id: 'asgn-002',
    delivery_id: 'DEL-205',
    vehicle_id: 'V-102',
    driver_id: 'DR-01',
    status: 'completed',
    assigned_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    completed_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    assigned_by: 'dispatcher',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    action: 'SEED_INITIALIZE',
    entity_type: 'SYSTEM',
    entity_id: 'GLOBAL',
    details: { message: 'Demonstration fleet logistics state initialized' },
    actor_id: 'system',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'aud-002',
    action: 'ASSIGN_DELIVERY',
    entity_type: 'DELIVERY',
    entity_id: 'DEL-202',
    details: { vehicle_id: 'V-103', driver_id: 'DR-03' },
    actor_id: 'dispatcher',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'aud-003',
    action: 'COMPLETE_DELIVERY',
    entity_type: 'DELIVERY',
    entity_id: 'DEL-205',
    details: { released_vehicle_id: 'V-102', released_driver_id: 'DR-01' },
    actor_id: 'dispatcher',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

const STORAGE_KEYS = {
  VEHICLES: 'routiq_vehicles_v1',
  DRIVERS: 'routiq_drivers_v1',
  DELIVERIES: 'routiq_deliveries_v1',
  ASSIGNMENTS: 'routiq_assignments_v1',
  AUDIT_LOGS: 'routiq_audit_logs_v1',
};

export class DataStore {
  private vehicles: Vehicle[];
  private drivers: Driver[];
  private deliveries: Delivery[];
  private assignments: Assignment[];
  private auditLogs: AuditLog[];
  private lockTable: Set<string> = new Set(); // Simulated transactional row locking

  constructor() {
    this.vehicles = this.loadFromStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    this.drivers = this.loadFromStorage(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    this.deliveries = this.loadFromStorage(STORAGE_KEYS.DELIVERIES, INITIAL_DELIVERIES);
    this.assignments = this.loadFromStorage(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
    this.auditLogs = this.loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined' || !window.localStorage) {
      return JSON.parse(JSON.stringify(fallback));
    }
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch {
      // Fallback
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(this.vehicles));
        localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(this.drivers));
        localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(this.deliveries));
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(this.assignments));
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
      } catch {
        // Storage full or private mode
      }
    }
  }

  public resetToDefault() {
    this.vehicles = JSON.parse(JSON.stringify(INITIAL_VEHICLES));
    this.drivers = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
    this.deliveries = JSON.parse(JSON.stringify(INITIAL_DELIVERIES));
    this.assignments = JSON.parse(JSON.stringify(INITIAL_ASSIGNMENTS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.saveToStorage();
  }

  // Row locking simulation
  public acquireLocks(resourceIds: string[]): boolean {
    for (const id of resourceIds) {
      if (this.lockTable.has(id)) {
        return false;
      }
    }
    for (const id of resourceIds) {
      this.lockTable.add(id);
    }
    return true;
  }

  public releaseLocks(resourceIds: string[]) {
    for (const id of resourceIds) {
      this.lockTable.delete(id);
    }
  }

  // Getters
  public getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getDrivers(): Driver[] {
    return [...this.drivers];
  }

  public getDeliveries(): Delivery[] {
    return [...this.deliveries];
  }

  public getAssignments(): Assignment[] {
    return [...this.assignments];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  // Entity queries
  public findVehicle(id: string): Vehicle | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  public findDriver(id: string): Driver | undefined {
    return this.drivers.find((d) => d.id === id);
  }

  public findDelivery(id: string): Delivery | undefined {
    return this.deliveries.find((d) => d.id === id);
  }

  // Mutations
  public addVehicle(vehicle: Vehicle) {
    this.vehicles.unshift(vehicle);
    this.addAuditLog('CREATE_VEHICLE', 'VEHICLE', vehicle.id, { registration: vehicle.registration_number });
    this.saveToStorage();
  }

  public updateVehicle(id: string, updates: Partial<Vehicle>) {
    const idx = this.vehicles.findIndex((v) => v.id === id);
    if (idx !== -1) {
      this.vehicles[idx] = {
        ...this.vehicles[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.addAuditLog('UPDATE_VEHICLE', 'VEHICLE', id, updates);
      this.saveToStorage();
    }
  }

  public addDriver(driver: Driver) {
    this.drivers.unshift(driver);
    this.addAuditLog('CREATE_DRIVER', 'DRIVER', driver.id, { name: driver.name });
    this.saveToStorage();
  }

  public updateDriver(id: string, updates: Partial<Driver>) {
    const idx = this.drivers.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.drivers[idx] = {
        ...this.drivers[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.addAuditLog('UPDATE_DRIVER', 'DRIVER', id, updates);
      this.saveToStorage();
    }
  }

  public addDelivery(delivery: Delivery) {
    this.deliveries.unshift(delivery);
    this.addAuditLog('CREATE_DELIVERY', 'DELIVERY', delivery.id, {
      pickup: delivery.pickup_location,
      dropoff: delivery.dropoff_location,
    });
    this.saveToStorage();
  }

  public updateDelivery(id: string, updates: Partial<Delivery>) {
    const idx = this.deliveries.findIndex((d) => d.id === id);
    if (idx !== -1) {
      this.deliveries[idx] = {
        ...this.deliveries[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
    }
  }

  public addAssignment(assignment: Assignment) {
    this.assignments.unshift(assignment);
    this.saveToStorage();
  }

  public updateAssignment(id: string, updates: Partial<Assignment>) {
    const idx = this.assignments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.assignments[idx] = { ...this.assignments[idx], ...updates };
      this.saveToStorage();
    }
  }

  public addAuditLog(
    action: string,
    entity_type: AuditLog['entity_type'],
    entity_id: string,
    details?: Record<string, unknown>,
    actor_id: string = 'dispatcher'
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity_type,
      entity_id,
      details,
      actor_id,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.saveToStorage();
  }
}

export const globalDataStore = new DataStore();
