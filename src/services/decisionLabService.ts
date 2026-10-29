import {
  CombinationEvaluation,
  ConflictItem,
  ConflictRadarData,
  Delivery,
  Driver,
  RouteTelemetry,
  ScoreBreakdown,
  Vehicle,
  WhatIfSimulationResult,
} from '../types';
import { DataStore, globalDataStore } from './dataStore';

export class DecisionLabService {
  private store: DataStore;

  constructor(customStore?: DataStore) {
    this.store = customStore || globalDataStore;
  }

  /**
   * Deterministic Evaluation of a Single Vehicle-Driver Pair against a Delivery
   */
  public evaluateCombination(
    delivery: Delivery,
    vehicle: Vehicle,
    driver: Driver,
    evaluatedAt: string = new Date().toISOString(),
    routeData?: RouteTelemetry
  ): CombinationEvaluation {
    const blocking_reasons: string[] = [];
    const satisfied_criteria: string[] = [];
    const non_blocking_warnings: string[] = [];
    let conflicting_delivery_id: string | undefined = undefined;

    // 1. Delivery Status Guard
    if (delivery.status !== 'pending') {
      blocking_reasons.push(
        `Delivery ${delivery.id} is currently in status '${delivery.status}'. Only 'pending' deliveries can be assigned.`
      );
    } else {
      satisfied_criteria.push(`Delivery ${delivery.id} is in 'pending' status ready for dispatch.`);
    }

    // 2. Vehicle Existence & Status Check
    if (vehicle.status === 'maintenance') {
      blocking_reasons.push(
        `Vehicle ${vehicle.id} (${vehicle.registration_number}) is under scheduled maintenance${
          vehicle.notes ? `: ${vehicle.notes}` : ''
        }.`
      );
    } else if (vehicle.status === 'inactive') {
      blocking_reasons.push(
        `Vehicle ${vehicle.id} (${vehicle.registration_number}) is inactive${
          vehicle.notes ? `: ${vehicle.notes}` : ''
        }.`
      );
    } else if (vehicle.status === 'assigned') {
      // Find the active delivery occupying this vehicle
      const activeAsgn = this.store
        .getAssignments()
        .find((a) => a.vehicle_id === vehicle.id && a.status === 'active');
      const activeDelId = activeAsgn ? activeAsgn.delivery_id : 'another active route';
      conflicting_delivery_id = activeDelId;
      blocking_reasons.push(
        `Vehicle ${vehicle.id} is occupied by active delivery ${activeDelId}.`
      );
    } else if (vehicle.status !== 'available') {
      blocking_reasons.push(
        `Vehicle ${vehicle.id} is currently '${vehicle.status}' (not available).`
      );
    } else {
      satisfied_criteria.push(`Vehicle ${vehicle.id} is available on standby.`);
    }

    // Double check active assignments table for vehicle
    const vehicleInActiveAsgn = this.store
      .getAssignments()
      .find((a) => a.vehicle_id === vehicle.id && a.status === 'active');
    if (vehicleInActiveAsgn && !blocking_reasons.some((r) => r.includes(vehicle.id) && r.includes('occupied'))) {
      conflicting_delivery_id = vehicleInActiveAsgn.delivery_id;
      blocking_reasons.push(
        `Vehicle ${vehicle.id} has an active assignment commitment on ${vehicleInActiveAsgn.delivery_id}.`
      );
    }

    // 3. Driver Existence & Status Check
    if (driver.availability_status === 'unavailable') {
      blocking_reasons.push(
        `Driver ${driver.name} (${driver.id}) is unavailable${
          driver.notes ? `: ${driver.notes}` : ''
        }.`
      );
    } else if (driver.availability_status === 'assigned') {
      const activeAsgn = this.store
        .getAssignments()
        .find((a) => a.driver_id === driver.id && a.status === 'active');
      const activeDelId = activeAsgn ? activeAsgn.delivery_id : 'another active route';
      if (!conflicting_delivery_id) conflicting_delivery_id = activeDelId;
      blocking_reasons.push(
        `Driver ${driver.name} (${driver.id}) is occupied by active delivery ${activeDelId}.`
      );
    } else if (driver.availability_status !== 'available') {
      blocking_reasons.push(
        `Driver ${driver.name} (${driver.id}) is '${driver.availability_status}'.`
      );
    } else {
      satisfied_criteria.push(`Driver ${driver.name} (${driver.id}) is available on active duty.`);
    }

    // Double check active assignments table for driver
    const driverInActiveAsgn = this.store
      .getAssignments()
      .find((a) => a.driver_id === driver.id && a.status === 'active');
    if (driverInActiveAsgn && !blocking_reasons.some((r) => r.includes(driver.name) && r.includes('occupied'))) {
      if (!conflicting_delivery_id) conflicting_delivery_id = driverInActiveAsgn.delivery_id;
      blocking_reasons.push(
        `Driver ${driver.name} has an active assignment commitment on ${driverInActiveAsgn.delivery_id}.`
      );
    }

    // 4. Capacity Compatibility
    const capacityRatio = delivery.required_capacity / (vehicle.capacity || 1);
    const capacityFitPct = Math.round(capacityRatio * 100);

    if (vehicle.capacity < delivery.required_capacity) {
      blocking_reasons.push(
        `Vehicle capacity (${vehicle.capacity} kg) is insufficient for required payload (${delivery.required_capacity} kg; deficit: ${
          delivery.required_capacity - vehicle.capacity
        } kg).`
      );
    } else {
      satisfied_criteria.push(
        `Payload compatibility satisfied: ${delivery.required_capacity} kg fits within ${vehicle.capacity} kg capacity (${capacityFitPct}% payload utilization).`
      );
    }

    // 5. Vehicle Type Compatibility
    if (
      delivery.required_vehicle_type &&
      vehicle.vehicle_type !== delivery.required_vehicle_type
    ) {
      blocking_reasons.push(
        `Vehicle classification '${vehicle.vehicle_type}' does not match required '${delivery.required_vehicle_type}'.`
      );
    } else if (delivery.required_vehicle_type) {
      satisfied_criteria.push(
        `Exact vehicle classification match: ${vehicle.vehicle_type.replace('_', ' ')}.`
      );
    } else {
      satisfied_criteria.push('No specific vehicle classification required; asset accepted.');
    }

    const is_eligible = blocking_reasons.length === 0;

    // 6. Score Breakdown Calculation (Explainable Heuristic)
    let base = is_eligible ? 50 : 0;
    let capacity_fit = 0;
    let type_match = 0;
    let priority_boost = 0;
    let green_bonus = 0;
    let route_distance_score: number | undefined = undefined;
    let route_eta_score: number | undefined = undefined;

    if (is_eligible) {
      // Capacity fit scoring: optimal 60-100% gets max bonus, prevents under-utilization
      if (capacityRatio > 0.6 && capacityRatio <= 1.0) {
        capacity_fit = 25;
      } else if (capacityRatio <= 0.6) {
        capacity_fit = 10;
      }

      // Classification match bonus
      if (
        delivery.required_vehicle_type &&
        vehicle.vehicle_type === delivery.required_vehicle_type
      ) {
        type_match = 15;
      }

      // Priority boost
      if (delivery.priority === 'urgent') {
        priority_boost = 10;
      } else if (delivery.priority === 'high') {
        priority_boost = 5;
      }

      // Zero-emission vehicle bonus
      if (vehicle.vehicle_type === 'electric_van' || vehicle.vehicle_type === 'cargo_bike') {
        green_bonus = 5;
      }

      // Route scoring if genuine routing response provided
      if (routeData && routeData.status === 'loaded') {
        // Distance score: shorter distance gets up to 10 points
        route_distance_score = Math.max(0, Math.min(10, Math.round(10 - routeData.distanceKm * 0.2)));
        // ETA score: faster ETA gets up to 5 points
        route_eta_score = Math.max(0, Math.min(5, Math.round(5 - routeData.durationMinutes * 0.05)));
      } else {
        non_blocking_warnings.push(
          'Route distance and duration not factored in ranking (routing telemetry not requested or provider offline).'
        );
      }
    }

    const routeBonus = (route_distance_score || 0) + (route_eta_score || 0);
    const total = is_eligible
      ? Math.min(100, base + capacity_fit + type_match + priority_boost + green_bonus + routeBonus)
      : 0;

    const score_breakdown: ScoreBreakdown = {
      base,
      capacity_fit,
      type_match,
      priority_boost,
      green_bonus,
      route_distance_score,
      route_eta_score,
      total,
    };

    return {
      delivery_id: delivery.id,
      vehicle_id: vehicle.id,
      driver_id: driver.id,
      vehicle,
      driver,
      is_eligible,
      evaluation_timestamp: evaluatedAt,
      blocking_reasons,
      satisfied_criteria,
      non_blocking_warnings,
      state_freshness: {
        is_stale: false,
        evaluated_at: evaluatedAt,
      },
      score_breakdown,
      route_telemetry: routeData,
      conflicting_delivery_id,
      capacityFitPct,
    };
  }

  /**
   * Evaluate all possible combinations in the fleet for a target delivery
   */
  public evaluateAllCombinations(
    deliveryId: string,
    routeCache?: Record<string, RouteTelemetry>
  ): {
    delivery: Delivery | null;
    evaluations: CombinationEvaluation[];
    eligibleEvaluations: CombinationEvaluation[];
    ineligibleEvaluations: CombinationEvaluation[];
    topRecommendation: CombinationEvaluation | null;
    whyChosenExplanation: string[];
    whyNotOthersExplanations: { vehicle_id: string; driver_id: string; reason: string }[];
    tieExplanation?: string;
  } {
    const delivery = this.store.findDelivery(deliveryId);
    if (!delivery) {
      return {
        delivery: null,
        evaluations: [],
        eligibleEvaluations: [],
        ineligibleEvaluations: [],
        topRecommendation: null,
        whyChosenExplanation: [`Delivery ${deliveryId} was not found in the operational registry.`],
        whyNotOthersExplanations: [],
      };
    }

    const vehicles = this.store.getVehicles();
    const drivers = this.store.getDrivers();
    const evaluatedAt = new Date().toISOString();

    const evaluations: CombinationEvaluation[] = [];

    for (const vehicle of vehicles) {
      for (const driver of drivers) {
        const routeKey = `${delivery.id}:${vehicle.id}`;
        const routeData = routeCache ? routeCache[routeKey] : undefined;
        evaluations.push(
          this.evaluateCombination(delivery, vehicle, driver, evaluatedAt, routeData)
        );
      }
    }

    // Partition into eligible and ineligible
    const eligibleEvaluations = evaluations.filter((e) => e.is_eligible);
    const ineligibleEvaluations = evaluations.filter((e) => !e.is_eligible);

    // Sort eligible by total score descending
    eligibleEvaluations.sort((a, b) => b.score_breakdown.total - a.score_breakdown.total);

    const topRecommendation = eligibleEvaluations.length > 0 ? eligibleEvaluations[0] : null;
    const whyChosenExplanation: string[] = [];
    const whyNotOthersExplanations: { vehicle_id: string; driver_id: string; reason: string }[] = [];
    let tieExplanation: string | undefined = undefined;

    if (topRecommendation) {
      whyChosenExplanation.push(
        `Selected ${topRecommendation.vehicle.id} & ${topRecommendation.driver.name} with score ${topRecommendation.score_breakdown.total}/100.`
      );
      whyChosenExplanation.push(
        `Both vehicle and driver are confirmed available with zero overlapping assignment conflicts.`
      );
      whyChosenExplanation.push(
        `Achieves ${topRecommendation.capacityFitPct}% payload capacity utilization (${delivery.required_capacity} kg of ${topRecommendation.vehicle.capacity} kg limit).`
      );

      if (
        delivery.required_vehicle_type &&
        topRecommendation.vehicle.vehicle_type === delivery.required_vehicle_type
      ) {
        whyChosenExplanation.push(
          `Matches required vehicle classification: ${topRecommendation.vehicle.vehicle_type.replace('_', ' ')}.`
        );
      }

      if (
        topRecommendation.vehicle.vehicle_type === 'electric_van' ||
        topRecommendation.vehicle.vehicle_type === 'cargo_bike'
      ) {
        whyChosenExplanation.push(`Awarded eco-fleet priority for zero-emission transit asset.`);
      }

      // Check if second place has exact same score (tie explanation)
      if (
        eligibleEvaluations.length > 1 &&
        eligibleEvaluations[1].score_breakdown.total === topRecommendation.score_breakdown.total
      ) {
        tieExplanation = `Tied with ${eligibleEvaluations[1].vehicle.id} & ${eligibleEvaluations[1].driver.name} at ${topRecommendation.score_breakdown.total} points. Ranked equally based on identical capacity fit and priority weight; choice may be finalized by driver preference or proximity.`;
      }

      // Explain why other eligible pairs ranked lower
      for (const other of eligibleEvaluations.slice(1)) {
        const diff = topRecommendation.score_breakdown.total - other.score_breakdown.total;
        if (diff > 0) {
          whyNotOthersExplanations.push({
            vehicle_id: other.vehicle.id,
            driver_id: other.driver.id,
            reason: `Scored ${other.score_breakdown.total}/100 (-${diff} pts) due to lower capacity fit (${other.capacityFitPct}% vs ${topRecommendation.capacityFitPct}%).`,
          });
        }
      }

      // Explain ineligible pairs
      for (const inelig of ineligibleEvaluations.slice(0, 8)) {
        whyNotOthersExplanations.push({
          vehicle_id: inelig.vehicle.id,
          driver_id: inelig.driver.id,
          reason: inelig.blocking_reasons[0] || 'Ineligible combination',
        });
      }
    } else {
      whyChosenExplanation.push(
        `No eligible vehicle-driver combination found in the current fleet. All ${evaluations.length} combinations are blocked by capacity, maintenance, or occupancy constraints.`
      );
    }

    return {
      delivery,
      evaluations,
      eligibleEvaluations,
      ineligibleEvaluations,
      topRecommendation,
      whyChosenExplanation,
      whyNotOthersExplanations,
      tieExplanation,
    };
  }

  /**
   * What-If Simulation: Strictly non-mutating preview
   */
  public simulateWhatIf(
    deliveryId: string,
    candidatePairs: { vehicleId: string; driverId: string }[]
  ): WhatIfSimulationResult {
    // Generate state fingerprint before simulation
    const snapshotBefore = JSON.stringify({
      vehicles: this.store.getVehicles(),
      drivers: this.store.getDrivers(),
      deliveries: this.store.getDeliveries(),
      assignments: this.store.getAssignments(),
    });

    const delivery = this.store.findDelivery(deliveryId);
    if (!delivery) {
      return {
        isNonMutating: true,
        initialHash: 'EMPTY',
        finalHash: 'EMPTY',
        evaluations: [],
        comparisonCandidates: [],
        selectedPair: null,
      };
    }

    const comparisonCandidates: CombinationEvaluation[] = [];

    for (const pair of candidatePairs) {
      const vehicle = this.store.findVehicle(pair.vehicleId);
      const driver = this.store.findDriver(pair.driverId);
      if (vehicle && driver) {
        comparisonCandidates.push(
          this.evaluateCombination(delivery, vehicle, driver)
        );
      }
    }

    // Generate state fingerprint after simulation
    const snapshotAfter = JSON.stringify({
      vehicles: this.store.getVehicles(),
      drivers: this.store.getDrivers(),
      deliveries: this.store.getDeliveries(),
      assignments: this.store.getAssignments(),
    });

    const isNonMutating = snapshotBefore === snapshotAfter;

    return {
      isNonMutating,
      initialHash: snapshotBefore.length.toString(),
      finalHash: snapshotAfter.length.toString(),
      evaluations: comparisonCandidates,
      comparisonCandidates,
      selectedPair: comparisonCandidates.find((c) => c.is_eligible) || comparisonCandidates[0] || null,
    };
  }

  /**
   * Conflict Radar: Operational telemetry scan across the entire fleet
   */
  public calculateConflictRadar(): ConflictRadarData {
    const vehicles = this.store.getVehicles();
    const drivers = this.store.getDrivers();
    const deliveries = this.store.getDeliveries();
    const assignments = this.store.getAssignments();

    const activeAssignments = assignments.filter((a) => a.status === 'active');

    // 1. Occupied Vehicles
    const occupiedVehicles: { vehicle: Vehicle; activeDeliveryId: string }[] = [];
    for (const v of vehicles) {
      const activeAsgn = activeAssignments.find((a) => a.vehicle_id === v.id);
      if (activeAsgn || v.status === 'assigned') {
        occupiedVehicles.push({
          vehicle: v,
          activeDeliveryId: activeAsgn ? activeAsgn.delivery_id : 'active route',
        });
      }
    }

    // 2. Occupied Drivers
    const occupiedDrivers: { driver: Driver; activeDeliveryId: string }[] = [];
    for (const d of drivers) {
      const activeAsgn = activeAssignments.find((a) => a.driver_id === d.id);
      if (activeAsgn || d.availability_status === 'assigned') {
        occupiedDrivers.push({
          driver: d,
          activeDeliveryId: activeAsgn ? activeAsgn.delivery_id : 'active route',
        });
      }
    }

    // 3. Maintenance and Inactive Vehicles
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance');
    const inactiveVehicles = vehicles.filter((v) => v.status === 'inactive');

    // 4. Unavailable Drivers
    const unavailableDrivers = drivers.filter((d) => d.availability_status === 'unavailable');

    // 5. Blocked Pending Deliveries (0 eligible pairs in fleet)
    const blockedDeliveries: { delivery: Delivery; rootCause: string }[] = [];
    const pendingDeliveries = deliveries.filter((d) => d.status === 'pending');

    for (const pDel of pendingDeliveries) {
      const evals = this.evaluateAllCombinations(pDel.id);
      if (evals.eligibleEvaluations.length === 0) {
        // Determine root bottleneck cause
        let cause = 'No combination satisfies current constraints';
        const hasCapacityMatch = vehicles.some((v) => v.capacity >= pDel.required_capacity);
        const typeMatchingVehicles = pDel.required_vehicle_type
          ? vehicles.filter((v) => v.vehicle_type === pDel.required_vehicle_type)
          : vehicles;
        const availVehicles = vehicles.filter((v) => v.status === 'available');
        const availDrivers = drivers.filter((d) => d.availability_status === 'available');

        if (pDel.required_vehicle_type && typeMatchingVehicles.length === 0) {
          cause = `No vehicle in fleet matches classification '${pDel.required_vehicle_type}'.`;
        } else if (
          pDel.required_vehicle_type &&
          typeMatchingVehicles.every((v) => v.status === 'maintenance')
        ) {
          cause = `All compatible ${pDel.required_vehicle_type.replace('_', ' ')} vehicles (${typeMatchingVehicles
            .map((v) => v.id)
            .join(', ')}) are currently under scheduled maintenance.`;
        } else if (
          pDel.required_vehicle_type &&
          typeMatchingVehicles.every((v) => v.status === 'assigned')
        ) {
          cause = `All compatible ${pDel.required_vehicle_type.replace('_', ' ')} vehicles are occupied on active deliveries.`;
        } else if (!hasCapacityMatch) {
          cause = `Required payload (${pDel.required_capacity} kg) exceeds maximum fleet vehicle capacity (${Math.max(
            ...vehicles.map((v) => v.capacity)
          )} kg).`;
        } else if (availVehicles.length === 0) {
          cause = 'All compatible fleet vehicles are currently occupied or under maintenance.';
        } else if (availDrivers.length === 0) {
          cause = 'All certified drivers are currently assigned to active routes or on leave.';
        } else {
          cause = `All ${availVehicles.length} available vehicles fail payload or classification requirements.`;
        }

        blockedDeliveries.push({ delivery: pDel, rootCause: cause });
      }
    }

    // 6. Structured Conflict Items
    const conflictItems: ConflictItem[] = [];

    // Add blocked deliveries as high priority
    blockedDeliveries.forEach((bd) => {
      conflictItems.push({
        id: `conf-del-${bd.delivery.id}`,
        type: 'BLOCKED_DELIVERY',
        title: `Pending Delivery ${bd.delivery.id} Blocked`,
        resourceId: bd.delivery.id,
        resourceLabel: `Delivery ${bd.delivery.id}`,
        description: bd.rootCause,
        severity: 'high',
        actionableStep: 'Wait for active vehicles to complete routes, or reclassify order requirements.',
      });
    });

    // Add occupied vehicles
    occupiedVehicles.forEach((ov) => {
      conflictItems.push({
        id: `conf-veh-${ov.vehicle.id}`,
        type: 'OCCUPIED_VEHICLE',
        title: `Vehicle ${ov.vehicle.id} (${ov.vehicle.registration_number}) Occupied`,
        resourceId: ov.vehicle.id,
        resourceLabel: `${ov.vehicle.id} • ${ov.vehicle.registration_number}`,
        description: `Currently assigned to delivery ${ov.activeDeliveryId}. Cannot accept new assignments.`,
        activeDeliveryId: ov.activeDeliveryId,
        severity: 'medium',
        actionableStep: `Track delivery ${ov.activeDeliveryId} to completion to release vehicle back to standby pool.`,
      });
    });

    // Add occupied drivers
    occupiedDrivers.forEach((od) => {
      conflictItems.push({
        id: `conf-drv-${od.driver.id}`,
        type: 'OCCUPIED_DRIVER',
        title: `Driver ${od.driver.name} (${od.driver.id}) Occupied`,
        resourceId: od.driver.id,
        resourceLabel: `${od.driver.name} (${od.driver.id})`,
        description: `Currently driving on delivery ${od.activeDeliveryId}. Cannot be double-booked.`,
        activeDeliveryId: od.activeDeliveryId,
        severity: 'medium',
        actionableStep: `Wait for courier to complete dropoff on delivery ${od.activeDeliveryId}.`,
      });
    });

    // Add maintenance vehicles
    maintenanceVehicles.forEach((mv) => {
      conflictItems.push({
        id: `conf-maint-${mv.id}`,
        type: 'MAINTENANCE_VEHICLE',
        title: `Vehicle ${mv.id} Under Maintenance`,
        resourceId: mv.id,
        resourceLabel: `${mv.id} • ${mv.vehicle_type}`,
        description: mv.notes || 'Scheduled mechanical inspection / servicing in progress.',
        severity: 'info',
        actionableStep: 'Clear maintenance status when mechanic signs off.',
      });
    });

    // Add unavailable drivers
    unavailableDrivers.forEach((ud) => {
      conflictItems.push({
        id: `conf-unavail-${ud.id}`,
        type: 'UNAVAILABLE_DRIVER',
        title: `Driver ${ud.name} Unavailable`,
        resourceId: ud.id,
        resourceLabel: `${ud.name} (${ud.id})`,
        description: ud.notes || 'Off-duty or on scheduled leave.',
        severity: 'info',
        actionableStep: 'Check roster schedule for return date.',
      });
    });

    return {
      totalConflicts: conflictItems.length,
      occupiedVehicles,
      occupiedDrivers,
      maintenanceVehicles,
      inactiveVehicles,
      unavailableDrivers,
      blockedDeliveries,
      conflictItems,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const globalDecisionLabService = new DecisionLabService();
