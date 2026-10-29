import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '../services/dataStore';
import { AssignmentEngine } from '../services/assignmentEngine';

describe('ROUTIQ Concurrency and Transaction Safety Tests (Tests 36-40)', () => {
  let store: DataStore;
  let engine: AssignmentEngine;

  beforeEach(() => {
    store = new DataStore();
    store.resetToDefault();
    engine = new AssignmentEngine(store);
  });

  // Test 36: Two concurrent deliveries cannot both commit an assignment using the same vehicle
  it('Test 36: Two concurrent assignment requests cannot both allocate the same vehicle', async () => {
    // Both DEL-201 and a cloned DEL-204 want V-101
    // Simulate simultaneous execution
    const promise1 = new Promise((resolve) => {
      const res = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
      resolve(res);
    });

    const promise2 = new Promise((resolve) => {
      // Second request attempts same vehicle V-101 with DR-02
      const res = engine.assignDelivery('DEL-204', 'V-101', 'DR-02');
      resolve(res);
    });

    const [res1, res2] = await Promise.all([promise1, promise2]) as [any, any];

    // Exactly one must succeed, and one must be rejected
    const successCount = [res1.success, res2.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    const failure = res1.success ? res2 : res1;
    expect(failure.success).toBe(false);
    expect(['VEHICLE_UNAVAILABLE', 'ASSIGNMENT_CONFLICT']).toContain(failure.error_code);

    // Verify only 1 active assignment for V-101 in database
    const activeV101 = store
      .getAssignments()
      .filter((a) => a.vehicle_id === 'V-101' && a.status === 'active');
    expect(activeV101.length).toBe(1);
  });

  // Test 37: Two concurrent deliveries cannot both commit an assignment using the same driver
  it('Test 37: Two concurrent assignment requests cannot both allocate the same driver', async () => {
    // Both DEL-201 (using V-101) and DEL-204 (using V-105) compete for DR-01
    const promise1 = new Promise((resolve) => {
      const res = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
      resolve(res);
    });

    const promise2 = new Promise((resolve) => {
      const res = engine.assignDelivery('DEL-204', 'V-105', 'DR-01');
      resolve(res);
    });

    const [res1, res2] = await Promise.all([promise1, promise2]) as [any, any];

    const successCount = [res1.success, res2.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    const failure = res1.success ? res2 : res1;
    expect(failure.success).toBe(false);
    expect(['DRIVER_UNAVAILABLE', 'ASSIGNMENT_CONFLICT']).toContain(failure.error_code);

    // Verify only 1 active assignment for DR-01
    const activeDR01 = store
      .getAssignments()
      .filter((a) => a.driver_id === 'DR-01' && a.status === 'active');
    expect(activeDR01.length).toBe(1);
  });

  // Test 38: Two simultaneous assignments for the same delivery cannot create duplicate active assignments
  it('Test 38: Simultaneous repeated assignment requests for the same delivery cannot create duplicates', async () => {
    // Send two identical calls for DEL-201
    const promise1 = new Promise((resolve) => {
      resolve(engine.assignDelivery('DEL-201', 'V-101', 'DR-01'));
    });
    const promise2 = new Promise((resolve) => {
      resolve(engine.assignDelivery('DEL-201', 'V-101', 'DR-01'));
    });

    const [res1, res2] = await Promise.all([promise1, promise2]) as [any, any];

    // One succeeds, one fails with DELIVERY_NOT_PENDING or ASSIGNMENT_CONFLICT
    const successCount = [res1.success, res2.success].filter(Boolean).length;
    expect(successCount).toBe(1);

    const failure = res1.success ? res2 : res1;
    expect(failure.success).toBe(false);

    // Ensure database contains exactly one active assignment record for DEL-201
    const activeForDel201 = store
      .getAssignments()
      .filter((a) => a.delivery_id === 'DEL-201' && a.status === 'active');
    expect(activeForDel201.length).toBe(1);
  });

  // Test 39: A rejected transaction leaves no partial writes
  it('Test 39: Rejected assignment leaves zero partial writes (rollback guarantee)', () => {
    const assignmentsCountBefore = store.getAssignments().length;
    const vehicleStatusBefore = store.findVehicle('V-101')?.status;
    const driverStatusBefore = store.findDriver('DR-04')?.availability_status; // unavailable
    const deliveryStatusBefore = store.findDelivery('DEL-201')?.status;

    // Trigger rejected assignment due to driver unavailability
    const res = engine.assignDelivery('DEL-201', 'V-101', 'DR-04');
    expect(res.success).toBe(false);
    expect(res.error_code).toBe('DRIVER_UNAVAILABLE');

    // Verify ZERO mutations occurred:
    expect(store.getAssignments().length).toBe(assignmentsCountBefore);
    expect(store.findVehicle('V-101')?.status).toBe(vehicleStatusBefore);
    expect(store.findDriver('DR-04')?.availability_status).toBe(driverStatusBefore);
    expect(store.findDelivery('DEL-201')?.status).toBe(deliveryStatusBefore);
  });

  // Test 40: Transaction failure preserves the previous database state
  it('Test 40: Simulation of transactional lock conflict preserves previous state intact', () => {
    // Acquire lock on resource simulating an inflight transaction
    store.acquireLocks(['del:DEL-201']);

    const previousStateString = JSON.stringify({
      v: store.getVehicles(),
      d: store.getDrivers(),
      del: store.getDeliveries(),
      asgn: store.getAssignments(),
    });

    const res = engine.assignDelivery('DEL-201', 'V-101', 'DR-01');
    expect(res.success).toBe(false);
    expect(res.error_code).toBe('ASSIGNMENT_CONFLICT');

    const currentStateString = JSON.stringify({
      v: store.getVehicles(),
      d: store.getDrivers(),
      del: store.getDeliveries(),
      asgn: store.getAssignments(),
    });

    expect(previousStateString).toBe(currentStateString);

    store.releaseLocks(['del:DEL-201']);
  });
});

