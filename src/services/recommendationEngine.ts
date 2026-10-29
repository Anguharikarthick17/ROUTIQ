import { Delivery, Driver, RecommendationScore, Vehicle } from '../types';

export interface DispatchRecommendation {
  delivery: Delivery;
  eligiblePairs: RecommendationScore[];
  ineligibleSummary: string[];
  bestRecommendation?: RecommendationScore;
  canAssign: boolean;
}

export function generateDispatchRecommendations(
  delivery: Delivery,
  vehicles: Vehicle[],
  drivers: Driver[]
): DispatchRecommendation {
  const ineligibleSummary: string[] = [];
  const eligiblePairs: RecommendationScore[] = [];

  // Check delivery status
  if (delivery.status !== 'pending') {
    return {
      delivery,
      eligiblePairs: [],
      ineligibleSummary: [`Delivery status is '${delivery.status}'. Only 'pending' deliveries can be assigned.`],
      canAssign: false,
    };
  }

  // 1. Evaluate vehicles
  const availableVehicles = vehicles.filter((v) => v.status === 'available');
  if (availableVehicles.length === 0) {
    ineligibleSummary.push('No vehicles are currently in "available" status.');
  }

  // 2. Evaluate drivers
  const availableDrivers = drivers.filter((d) => d.availability_status === 'available');
  if (availableDrivers.length === 0) {
    ineligibleSummary.push('No drivers are currently in "available" status.');
  }

  // Check matching combinations
  for (const vehicle of availableVehicles) {
    // Check capacity
    if (vehicle.capacity < delivery.required_capacity) {
      ineligibleSummary.push(
        `Vehicle ${vehicle.id} capacity (${vehicle.capacity} kg) is below required ${delivery.required_capacity} kg.`
      );
      continue;
    }

    // Check vehicle type
    if (delivery.required_vehicle_type && vehicle.vehicle_type !== delivery.required_vehicle_type) {
      ineligibleSummary.push(
        `Vehicle ${vehicle.id} type (${vehicle.vehicle_type}) does not match required ${delivery.required_vehicle_type}.`
      );
      continue;
    }

    // Pair with each available driver
    for (const driver of availableDrivers) {
      let score = 50; // base score
      const reasons: string[] = [];

      // Capacity fit ratio (tight fit = higher efficiency, waste prevention)
      const capacityRatio = delivery.required_capacity / vehicle.capacity;
      const capacityFitPct = Math.round(capacityRatio * 100);

      if (capacityRatio > 0.6 && capacityRatio <= 1.0) {
        score += 25;
        reasons.push(`Optimal capacity utilization (${capacityFitPct}% of ${vehicle.capacity}kg payload)`);
      } else if (capacityRatio <= 0.6) {
        score += 10;
        reasons.push(`Sufficient capacity with headroom (${capacityFitPct}% utilized)`);
      }

      // Exact vehicle type match bonus
      if (delivery.required_vehicle_type && vehicle.vehicle_type === delivery.required_vehicle_type) {
        score += 15;
        reasons.push(`Exact vehicle type match: ${vehicle.vehicle_type.replace('_', ' ')}`);
      }

      // Priority boost
      if (delivery.priority === 'urgent') {
        score += 10;
        reasons.push('Urgent priority delivery prioritization');
      }

      // Electric vehicle green bonus
      if (vehicle.vehicle_type === 'electric_van' || vehicle.vehicle_type === 'cargo_bike') {
        score += 5;
        reasons.push('Zero-emission fleet asset priority');
      }

      eligiblePairs.push({
        vehicle,
        driver,
        score: Math.min(100, score),
        reasons,
        capacityFitPct,
        isEligible: true,
      });
    }
  }

  // Sort eligible pairs by score descending
  eligiblePairs.sort((a, b) => b.score - a.score);

  return {
    delivery,
    eligiblePairs,
    ineligibleSummary: Array.from(new Set(ineligibleSummary)),
    bestRecommendation: eligiblePairs[0],
    canAssign: eligiblePairs.length > 0,
  };
}
