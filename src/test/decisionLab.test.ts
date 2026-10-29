import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '../services/dataStore';
import { DecisionLabService } from '../services/decisionLabService';
import { AssignmentEngine } from '../services/assignmentEngine';

describe('ROUTIQ Decision Lab — Unit, What-If, and Conflict Radar Tests (Tests 1-24)', () => {
  let store: DataStore;
  let decisionLab: DecisionLabService;
  let engine: AssignmentEngine;

  beforeEach(() => {
    store = new DataStore();
    store.resetToDefault();
    decisionLab = new DecisionLabService(store);
    engine = new AssignmentEngine(store);
  });

  // Test 1: A valid combination is identified as eligible
  it('Test 1: Valid vehicle-driver combination is identified as eligible with positive score', () => {
    // DEL-201: required_capacity 450, required_vehicle_type electric_van, pending
    // V-101: electric_van, 750kg, available
    // DR-01: available
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-101')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(true);
    expect(evaluation.blocking_reasons.length).toBe(0);
    expect(evaluation.satisfied_criteria.length).toBeGreaterThan(0);
    expect(evaluation.score_breakdown.total).toBeGreaterThan(50);
  });

  // Test 2: An occupied vehicle is rejected with the correct reason
  it('Test 2: An occupied vehicle is rejected and cites the active conflicting delivery', () => {
    // V-103 is occupied by active delivery DEL-202
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-103')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(false);
    expect(evaluation.blocking_reasons.some((r) => r.includes('occupied by active delivery DEL-202') || r.includes('DEL-202'))).toBe(true);
    expect(evaluation.conflicting_delivery_id).toBe('DEL-202');
  });

  // Test 3: An occupied driver is rejected with the correct reason
  it('Test 3: An occupied driver is rejected and cites the active conflicting delivery', () => {
    // DR-03 is occupied by active delivery DEL-202
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-101')!;
    const driver = store.findDriver('DR-03')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(false);
    expect(evaluation.blocking_reasons.some((r) => r.includes('DR-03') && r.includes('occupied by active delivery DEL-202'))).toBe(true);
    expect(evaluation.conflicting_delivery_id).toBe('DEL-202');
  });

  // Test 4: Maintenance and inactive vehicles are rejected
  it('Test 4: Vehicles in maintenance or inactive status are rejected with specific status reason', () => {
    const delivery = store.findDelivery('DEL-201')!;
    const driver = store.findDriver('DR-01')!;

    // V-104 is maintenance
    const maintVehicle = store.findVehicle('V-104')!;
    const maintEval = decisionLab.evaluateCombination(delivery, maintVehicle, driver);
    expect(maintEval.is_eligible).toBe(false);
    expect(maintEval.blocking_reasons.some((r) => r.includes('maintenance'))).toBe(true);

    // V-106 is inactive
    const inactiveVehicle = store.findVehicle('V-106')!;
    const inactiveEval = decisionLab.evaluateCombination(delivery, inactiveVehicle, driver);
    expect(inactiveEval.is_eligible).toBe(false);
    expect(inactiveEval.blocking_reasons.some((r) => r.includes('inactive'))).toBe(true);
  });

  // Test 5: Unavailable drivers are rejected
  it('Test 5: Unavailable drivers (e.g. on leave) are rejected with clear explanation', () => {
    // DR-04 is unavailable (On scheduled medical leave)
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-101')!;
    const driver = store.findDriver('DR-04')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(false);
    expect(evaluation.blocking_reasons.some((r) => r.includes('DR-04') && r.includes('unavailable'))).toBe(true);
  });

  // Test 6: Capacity mismatch is rejected with exact deficit
  it('Test 6: Insufficient vehicle payload capacity is rejected with exact deficit calculation', () => {
    // DEL-201 requires 450 kg
    // V-105 capacity is 150 kg (deficit of 300 kg)
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-105')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(false);
    expect(evaluation.blocking_reasons.some((r) => r.includes('insufficient') && r.includes('150 kg') && r.includes('450 kg'))).toBe(true);
  });

  // Test 7: Vehicle-type mismatch is rejected
  it('Test 7: Vehicle type mismatch is rejected when delivery requires a specific classification', () => {
    // DEL-203 requires 'refrigerated_truck'
    // V-102 is 'truck' (not refrigerated)
    const delivery = store.findDelivery('DEL-203')!;
    const vehicle = store.findVehicle('V-102')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.is_eligible).toBe(false);
    expect(evaluation.blocking_reasons.some((r) => r.includes('classification') || r.includes('refrigerated_truck'))).toBe(true);
  });

  // Test 8: Unknown IDs produce safe validation errors
  it('Test 8: Unknown delivery ID produces safe null state without throwing unhandled exceptions', () => {
    const res = decisionLab.evaluateAllCombinations('DEL-NONEXISTENT');
    expect(res.delivery).toBeNull();
    expect(res.evaluations.length).toBe(0);
    expect(res.topRecommendation).toBeNull();
    expect(res.whyChosenExplanation[0]).toContain('not found');
  });

  // Test 9: Missing route data does not create fabricated claims
  it('Test 9: Missing route telemetry is not fabricated and emits a non-blocking warning', () => {
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-101')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);

    expect(evaluation.score_breakdown.route_distance_score).toBeUndefined();
    expect(evaluation.score_breakdown.route_eta_score).toBeUndefined();
    expect(evaluation.non_blocking_warnings.some((w) => w.includes('Route distance and duration not factored'))).toBe(true);
  });

  // Test 10: Ineligible candidates are excluded from the top feasible recommendation
  it('Test 10: Ineligible candidates are never returned as the top recommended choice', () => {
    // Evaluate DEL-203 (requires refrigerated_truck, 320kg)
    // The only refrigerated_truck in fleet is V-104 which is in MAINTENANCE
    const res = decisionLab.evaluateAllCombinations('DEL-203');

    expect(res.eligibleEvaluations.length).toBe(0);
    expect(res.topRecommendation).toBeNull();
    expect(res.whyChosenExplanation[0]).toContain('No eligible vehicle-driver combination found');
  });

  // Test 11: Recommendation explanations agree with actual constraints and score components
  it('Test 11: Top recommendation explanation reflects actual data values and score components', () => {
    const res = decisionLab.evaluateAllCombinations('DEL-201');

    expect(res.topRecommendation).not.toBeNull();
    const top = res.topRecommendation!;
    expect(top.is_eligible).toBe(true);
    expect(res.whyChosenExplanation.some((e) => e.includes(top.vehicle.id))).toBe(true);
    expect(res.whyChosenExplanation.some((e) => e.includes(`${top.score_breakdown.total}/100`))).toBe(true);
  });

  // Test 12: Equal candidates are not given fabricated superiority
  it('Test 12: Ties between equally suitable candidates are acknowledged without fabricated differences', () => {
    // If two drivers are both available and evaluate with identical vehicle and score
    const delivery = store.findDelivery('DEL-204')!; // cargo_bike, 80kg
    const vehicle = store.findVehicle('V-105')!; // cargo_bike, 150kg
    const dr1 = store.findDriver('DR-01')!; // available
    const dr2 = store.findDriver('DR-02')!; // available

    const eval1 = decisionLab.evaluateCombination(delivery, vehicle, dr1);
    const eval2 = decisionLab.evaluateCombination(delivery, vehicle, dr2);

    expect(eval1.score_breakdown.total).toBe(eval2.score_breakdown.total);
    expect(eval1.is_eligible).toBe(true);
    expect(eval2.is_eligible).toBe(true);
  });

  // Test 13: Stale eligibility data is not presented as guaranteed current availability
  it('Test 13: Freshness timestamp tracks state evaluation and flags potential staleness', () => {
    const delivery = store.findDelivery('DEL-201')!;
    const vehicle = store.findVehicle('V-101')!;
    const driver = store.findDriver('DR-01')!;

    const evaluation = decisionLab.evaluateCombination(delivery, vehicle, driver);
    expect(evaluation.state_freshness.is_stale).toBe(false);
    expect(Date.parse(evaluation.evaluation_timestamp)).toBeGreaterThan(0);
  });

  // Test 14: What-If comparison does not modify delivery records
  it('Test 14: What-If simulation does NOT mutate delivery records', () => {
    const deliveryBefore = JSON.stringify(store.findDelivery('DEL-201'));

    decisionLab.simulateWhatIf('DEL-201', [{ vehicleId: 'V-101', driverId: 'DR-01' }]);

    const deliveryAfter = JSON.stringify(store.findDelivery('DEL-201'));
    expect(deliveryBefore).toBe(deliveryAfter);
  });

  // Test 15: What-If comparison does not modify vehicle or driver statuses
  it('Test 15: What-If simulation does NOT alter vehicle or driver status', () => {
    const vehicleBefore = store.findVehicle('V-101')?.status;
    const driverBefore = store.findDriver('DR-01')?.availability_status;

    decisionLab.simulateWhatIf('DEL-201', [{ vehicleId: 'V-101', driverId: 'DR-01' }]);

    expect(store.findVehicle('V-101')?.status).toBe(vehicleBefore);
    expect(store.findDriver('DR-01')?.availability_status).toBe(driverBefore);
  });

  // Test 16: What-If comparison does not create assignment records
  it('Test 16: What-If simulation does NOT create assignment records in the store', () => {
    const countBefore = store.getAssignments().length;

    decisionLab.simulateWhatIf('DEL-201', [{ vehicleId: 'V-101', driverId: 'DR-01' }]);

    const countAfter = store.getAssignments().length;
    expect(countBefore).toBe(countAfter);
  });

  // Test 17: What-If comparison does not reserve resources
  it('Test 17: What-If simulation proves zero mutations across entire operational database', () => {
    const simResult = decisionLab.simulateWhatIf('DEL-201', [
      { vehicleId: 'V-101', driverId: 'DR-01' },
      { vehicleId: 'V-102', driverId: 'DR-02' },
    ]);

    expect(simResult.isNonMutating).toBe(true);
    expect(simResult.initialHash).toBe(simResult.finalHash);
  });

  // Test 18: What-If uses the exact same business constraints as authoritative assignment rules
  it('Test 18: What-If candidates agree with authoritative eligibility rules', () => {
    // V-103 is occupied, V-101 is available
    const simResult = decisionLab.simulateWhatIf('DEL-201', [
      { vehicleId: 'V-103', driverId: 'DR-01' },
      { vehicleId: 'V-101', driverId: 'DR-01' },
    ]);

    expect(simResult.comparisonCandidates[0].is_eligible).toBe(false);
    expect(simResult.comparisonCandidates[1].is_eligible).toBe(true);
  });

  // Test 19: Occupied vehicles are linked to the correct active deliveries
  it('Test 19: Conflict Radar links occupied vehicles to their active delivery IDs', () => {
    const radar = decisionLab.calculateConflictRadar();

    const occupiedV103 = radar.occupiedVehicles.find((ov) => ov.vehicle.id === 'V-103');
    expect(occupiedV103).toBeDefined();
    expect(occupiedV103?.activeDeliveryId).toBe('DEL-202');
  });

  // Test 20: Occupied drivers are linked to the correct active deliveries
  it('Test 20: Conflict Radar links occupied drivers to their active delivery IDs', () => {
    const radar = decisionLab.calculateConflictRadar();

    const occupiedDR03 = radar.occupiedDrivers.find((od) => od.driver.id === 'DR-03');
    expect(occupiedDR03).toBeDefined();
    expect(occupiedDR03?.activeDeliveryId).toBe('DEL-202');
  });

  // Test 21: Blocked deliveries display grounded explanations
  it('Test 21: Conflict Radar identifies blocked pending deliveries with grounded bottleneck causes', () => {
    const radar = decisionLab.calculateConflictRadar();

    // DEL-203 requires refrigerated_truck, but V-104 is under maintenance
    const blockedDel203 = radar.blockedDeliveries.find((bd) => bd.delivery.id === 'DEL-203');
    expect(blockedDel203).toBeDefined();
    expect(blockedDel203?.rootCause).toContain('maintenance');
  });

  // Test 22: Completing a delivery removes its active resource occupancy
  it('Test 22: Completing an active delivery removes occupied vehicle and driver from Conflict Radar', () => {
    // Initially DEL-202 occupies V-103 and DR-03
    let radar = decisionLab.calculateConflictRadar();
    expect(radar.occupiedVehicles.some((ov) => ov.vehicle.id === 'V-103')).toBe(true);

    // Complete DEL-202
    engine.completeDelivery('DEL-202');

    // Recalculate radar
    radar = decisionLab.calculateConflictRadar();
    expect(radar.occupiedVehicles.some((ov) => ov.vehicle.id === 'V-103')).toBe(false);
    expect(radar.occupiedDrivers.some((od) => od.driver.id === 'DR-03')).toBe(false);
  });

  // Test 23: A resource with another active delivery is not incorrectly marked available
  it('Test 23: Completing a delivery does not override a vehicle in maintenance status', () => {
    // Set V-101 to maintenance
    store.updateVehicle('V-101', { status: 'maintenance' });

    // Ensure V-101 status is maintenance
    expect(store.findVehicle('V-101')?.status).toBe('maintenance');

    // Complete an unrelated delivery
    engine.completeDelivery('DEL-202');

    // V-101 must remain in maintenance!
    expect(store.findVehicle('V-101')?.status).toBe('maintenance');
  });

  // Test 24: Existing data-integrity conflicts are reported without silently mutating records
  it('Test 24: Conflict Radar reports maintenance and unavailable assets without mutating them', () => {
    const radar = decisionLab.calculateConflictRadar();

    expect(radar.maintenanceVehicles.length).toBeGreaterThan(0);
    expect(radar.unavailableDrivers.length).toBeGreaterThan(0);

    // Ensure records remain unchanged
    expect(store.findVehicle('V-104')?.status).toBe('maintenance');
    expect(store.findDriver('DR-04')?.availability_status).toBe('unavailable');
  });
});
