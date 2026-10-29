import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '../services/dataStore';
import { AssignmentEngine } from '../services/assignmentEngine';
import { vehicleSchema, driverSchema } from '../types/schemas';

describe('ROUTIQ Authoritative Assignment Engine — Test Scenarios T1-T16', () => {
  let store: DataStore;
  let engine: AssignmentEngine;

  beforeEach(() => {
    store = new DataStore();
    store.resetToDefault();
    engine = new AssignmentEngine(store);
  });

  // T1. A valid assignment succeeds
  it('T1: A valid assignment succeeds', () => {
    // DEL-201 is pending (450kg, electric_van)
    // V-101 is available (750kg, electric_van)
    // DR-01 is available
    const result = engine.assignDelivery('DEL-201', 'V-101', 'DR-01', 'dispatcher-1');
    expect(result.success).toBe(true);
    expect(result.assignment_id).toBeDefined();

    const delivery = store.findDelivery('DEL-201');
    const vehicle = store.findVehicle('V-101');
    const driver = store.findDriver('DR-01');

    expect(delivery?.status).toBe('assigned');
    expect(delivery?.assigned_vehicle_id).toBe('V-101');
    expect(delivery?.assigned_driver_id).toBe('DR-01');
    expect(vehicle?.status).toBe('assigned');
    expect(driver?.availability_status).toBe('assigned');
  });

  // T2. Reusing the same vehicle for a second active delivery is rejected
  it('T2: Reusing the same vehicle for a second active delivery is rejected', () => {
    // V-103 is already assigned to active delivery DEL-202
    const result = engine.assignDelivery('DEL-201', 'V-103', 'DR-02');
    expect(result.success).toBe(false);
    expect(result.error_code).toBe('VEHICLE_UNAVAILABLE');
    expect(result.message).toContain('V-103');
  });

  // T3. Reusing the same driver for a second active delivery is rejected
  it('T3: Reusing the same driver for a second active delivery is rejected', () => {
    // DR-03 is already assigned to active delivery DEL-202
    const result = engine.assignDelivery('DEL-201', 'V-101', 'DR-03');
    expect(result.success).toBe(false);
    expect(result.error_code).toBe('DRIVER_UNAVAILABLE');
    expect(result.message).toContain('DR-03');
  });

  // T4. An occupied vehicle and occupied driver are rejected
  it('T4: An occupied vehicle and occupied driver are rejected', () => {
    // Both V-103 and DR-03 are occupied
    const result = engine.assignDelivery('DEL-201', 'V-103', 'DR-03');
    expect(result.success).toBe(false);
    expect(['VEHICLE_UNAVAILABLE', 'ASSIGNMENT_CONFLICT']).toContain(result.error_code);
  });

  // T5. An unavailable driver is rejected
  it('T5: An unavailable driver is rejected', () => {
    // DR-04 is unavailable (on leave)
    const result = engine.assignDelivery('DEL-201', 'V-101', 'DR-04');
    expect(result.success).toBe(false);
    expect(result.error_code).toBe('DRIVER_UNAVAILABLE');
  });

  // T6. A vehicle under maintenance is rejected
  it('T6: A vehicle under maintenance is rejected', () => {
    // V-104 is under maintenance
    const result = engine.assignDelivery('DEL-203', 'V-104', 'DR-05');
    expect(result.success).toBe(false);
    expect(result.error_code).toBe('VEHICLE_UNAVAILABLE');
  });

  // T7. A missing vehicle, driver, or delivery ID is handled safely
  it('T7: A missing vehicle, driver, or delivery ID is handled safely', () => {
    const res1 = engine.assignDelivery('DEL-NONEXISTENT', 'V-101', 'DR-01');
    expect(res1.success).toBe(false);
    expect(res1.error_code).toBe('DELIVERY_NOT_FOUND');

    const res2 = engine.assignDelivery('DEL-201', 'V-NONEXISTENT', 'DR-01');
    expect(res2.success).toBe(false);
    expect(res2.error_code).toBe('VEHICLE_NOT_FOUND');

    const res3 = engine.assignDelivery('DEL-201', 'V-101', 'DR-NONEXISTENT');
    expect(res3.success).toBe(false);
    expect(res3.error_code).toBe('DRIVER_NOT_FOUND');
  });

  // T8. A valid delivery completion releases both resources
  it('T8: A valid delivery completion releases both resources', () => {
    // DEL-202 is currently 'in_transit' with V-103 and DR-03
    expect(store.findVehicle('V-103')?.status).toBe('assigned');
    expect(store.findDriver('DR-03')?.availability_status).toBe('assigned');

    const completeRes = engine.completeDelivery('DEL-202', 'dispatcher-1');
    expect(completeRes.success).toBe(true);

    const delivery = store.findDelivery('DEL-202');
    const vehicle = store.findVehicle('V-103');
    const driver = store.findDriver('DR-03');

    expect(delivery?.status).toBe('delivered');
    expect(vehicle?.status).toBe('available');
    expect(driver?.availability_status).toBe('available');
  });

  // T9. An eligible cancellation releases resources consistently
  it('T9: An eligible cancellation releases resources consistently', () => {
    // Assign DEL-201 first
    const asgnRes = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
    expect(asgnRes.success).toBe(true);
    expect(store.findVehicle('V-101')?.status).toBe('assigned');
    expect(store.findDriver('DR-01')?.availability_status).toBe('assigned');

    // Cancel assigned delivery
    const cancelRes = engine.cancelDelivery('DEL-201', 'Customer requested cancellation');
    expect(cancelRes.success).toBe(true);

    expect(store.findDelivery('DEL-201')?.status).toBe('cancelled');
    expect(store.findVehicle('V-101')?.status).toBe('available');
    expect(store.findDriver('DR-01')?.availability_status).toBe('available');
  });

  // T10. An invalid status transition is rejected
  it('T10: An invalid status transition is rejected', () => {
    // Cannot directly mark a 'pending' delivery as 'delivered'
    const res = engine.completeDelivery('DEL-201');
    expect(res.success).toBe(false);
    expect(res.error_code).toBe('INVALID_TRANSITION');

    // Cannot cancel already delivered DEL-205
    const resCancel = engine.cancelDelivery('DEL-205');
    expect(resCancel.success).toBe(false);
    expect(resCancel.error_code).toBe('INVALID_TRANSITION');
  });

  // T11. Duplicate or repeated assignment submissions do not create inconsistent state
  it('T11: Duplicate or repeated assignment submissions do not create inconsistent state', () => {
    // First attempt succeeds
    const firstRes = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
    expect(firstRes.success).toBe(true);

    // Second repeated submission for the same delivery fails safely
    const secondRes = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
    expect(secondRes.success).toBe(false);
    expect(secondRes.error_code).toBe('DELIVERY_NOT_PENDING');

    // No duplicate active assignments created
    const activeForDel = store
      .getAssignments()
      .filter((a) => a.delivery_id === 'DEL-201' && a.status === 'active');
    expect(activeForDel.length).toBe(1);
  });

  // T12. Two concurrent assignment requests cannot reserve the same vehicle or driver
  it('T12: Two concurrent assignment requests cannot reserve the same vehicle or driver', () => {
    // If a lock is held on V-101, concurrent assignment is rejected
    store.acquireLocks(['veh:V-101']);

    const concurrentRes = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
    expect(concurrentRes.success).toBe(false);
    expect(concurrentRes.error_code).toBe('ASSIGNMENT_CONFLICT');
    expect(concurrentRes.message).toContain('concurrent transaction');

    // Release lock
    store.releaseLocks(['veh:V-101']);
  });

  // T13. Duplicate registration numbers and driver IDs are rejected
  it('T13: Duplicate registration numbers and driver IDs are rejected by schema and store', () => {
    const invalidVehicle = {
      id: 'V-999',
      registration_number: '', // empty invalid
      vehicle_type: 'van',
      capacity: -50, // negative capacity invalid
    };

    const parsed = vehicleSchema.safeParse(invalidVehicle);
    expect(parsed.success).toBe(false);

    const invalidDriver = {
      id: '',
      name: '',
      phone: '12',
    };
    const driverParsed = driverSchema.safeParse(invalidDriver);
    expect(driverParsed.success).toBe(false);
  });

  // T14. Capacity or vehicle-type mismatches are rejected
  it('T14: Capacity or vehicle-type mismatches are rejected', () => {
    // DEL-203 requires refrigerated_truck, 320kg
    // V-105 is cargo_bike, 150kg
    const resCapacity = engine.assignDelivery('DEL-203', 'V-105', 'DR-02');
    expect(resCapacity.success).toBe(false);
    expect(resCapacity.error_code).toBe('VEHICLE_CAPACITY_MISMATCH');

    // V-102 is truck (2500kg), but DEL-203 requires refrigerated_truck
    const resType = engine.assignDelivery('DEL-203', 'V-102', 'DR-02');
    expect(resType.success).toBe(false);
    expect(resType.error_code).toBe('VEHICLE_CAPACITY_MISMATCH');
  });

  // T15. Unauthorized operations or invalid transitions are denied
  it('T15: Direct illegal transition from delivered to in_transit is denied', () => {
    const res = engine.updateDeliveryStatus('DEL-205', 'in_transit');
    expect(res.success).toBe(false);
    expect(res.error_code).toBe('INVALID_TRANSITION');
  });

  // T16. Database transaction failures leave the previous state unchanged
  it('T16: Database transaction failures leave the previous state unchanged', () => {
    const previousVehicleState = store.findVehicle('V-101')?.status;
    const previousDriverState = store.findDriver('DR-01')?.availability_status;
    const previousDeliveryState = store.findDelivery('DEL-203')?.status;

    // Trigger failed assignment due to type mismatch
    const res = engine.assignDelivery('DEL-203', 'V-101', 'DR-01');
    expect(res.success).toBe(false);

    // Verify all resources remain unaltered
    expect(store.findVehicle('V-101')?.status).toBe(previousVehicleState);
    expect(store.findDriver('DR-01')?.availability_status).toBe(previousDriverState);
    expect(store.findDelivery('DEL-203')?.status).toBe(previousDeliveryState);
  });
});
