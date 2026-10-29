import { Assignment, AssignmentResult, DeliveryStatus } from '../types';
import { DataStore, globalDataStore } from './dataStore';

export class AssignmentEngine {
  private store: DataStore;

  constructor(customStore?: DataStore) {
    this.store = customStore || globalDataStore;
  }

  /**
   * Authoritative Transactional Assignment
   */
  public assignDelivery(
    deliveryId: string,
    vehicleId: string,
    driverId: string,
    actorId: string = 'dispatcher'
  ): AssignmentResult {
    // 1. Concurrency Row-Level Lock Acquisition
    const lockKeys = [`del:${deliveryId}`, `veh:${vehicleId}`, `drv:${driverId}`];
    const lockAcquired = this.store.acquireLocks(lockKeys);

    if (!lockAcquired) {
      return {
        success: false,
        error_code: 'ASSIGNMENT_CONFLICT',
        message: 'A concurrent transaction is currently locking one or more required resources.',
      };
    }

    try {
      // 2. Validate Delivery
      const delivery = this.store.findDelivery(deliveryId);
      if (!delivery) {
        return {
          success: false,
          error_code: 'DELIVERY_NOT_FOUND',
          message: `Delivery ${deliveryId} does not exist.`,
        };
      }

      if (delivery.status !== 'pending') {
        return {
          success: false,
          error_code: 'DELIVERY_NOT_PENDING',
          message: `Delivery ${deliveryId} is currently '${delivery.status}' and cannot be assigned.`,
        };
      }

      // 3. Validate Vehicle
      const vehicle = this.store.findVehicle(vehicleId);
      if (!vehicle) {
        return {
          success: false,
          error_code: 'VEHICLE_NOT_FOUND',
          message: `Vehicle ${vehicleId} does not exist.`,
        };
      }

      if (vehicle.status !== 'available') {
        return {
          success: false,
          error_code: 'VEHICLE_UNAVAILABLE',
          message: `Vehicle ${vehicleId} (${vehicle.registration_number}) is currently '${vehicle.status}'.`,
        };
      }

      if (vehicle.capacity < delivery.required_capacity) {
        return {
          success: false,
          error_code: 'VEHICLE_CAPACITY_MISMATCH',
          message: `Vehicle capacity (${vehicle.capacity} kg) is insufficient for delivery payload (${delivery.required_capacity} kg).`,
        };
      }

      if (delivery.required_vehicle_type && vehicle.vehicle_type !== delivery.required_vehicle_type) {
        return {
          success: false,
          error_code: 'VEHICLE_CAPACITY_MISMATCH',
          message: `Vehicle type '${vehicle.vehicle_type}' does not match required '${delivery.required_vehicle_type}'.`,
        };
      }

      // 4. Validate Driver
      const driver = this.store.findDriver(driverId);
      if (!driver) {
        return {
          success: false,
          error_code: 'DRIVER_NOT_FOUND',
          message: `Driver ${driverId} does not exist.`,
        };
      }

      if (driver.availability_status !== 'available') {
        return {
          success: false,
          error_code: 'DRIVER_UNAVAILABLE',
          message: `Driver ${driver.name} (${driverId}) is currently '${driver.availability_status}'.`,
        };
      }

      // 5. Active Assignment Conflict Verification
      const activeAssignments = this.store
        .getAssignments()
        .filter((a) => a.status === 'active');

      const vehicleActive = activeAssignments.some((a) => a.vehicle_id === vehicleId);
      if (vehicleActive) {
        return {
          success: false,
          error_code: 'ASSIGNMENT_CONFLICT',
          message: `Vehicle ${vehicleId} is already assigned to an active delivery.`,
        };
      }

      const driverActive = activeAssignments.some((a) => a.driver_id === driverId);
      if (driverActive) {
        return {
          success: false,
          error_code: 'ASSIGNMENT_CONFLICT',
          message: `Driver ${driver.name} (${driverId}) is currently assigned to another delivery.`,
        };
      }

      // 6. Atomic Transaction Commit
      const assignmentId = `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newAssignment: Assignment = {
        id: assignmentId,
        delivery_id: deliveryId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: 'active',
        assigned_at: new Date().toISOString(),
        completed_at: null,
        assigned_by: actorId,
      };

      // Perform all mutations
      this.store.addAssignment(newAssignment);
      this.store.updateVehicle(vehicleId, { status: 'assigned' });
      this.store.updateDriver(driverId, { availability_status: 'assigned' });
      this.store.updateDelivery(deliveryId, {
        status: 'assigned',
        assigned_vehicle_id: vehicleId,
        assigned_driver_id: driverId,
      });

      this.store.addAuditLog(
        'ASSIGN_DELIVERY',
        'DELIVERY',
        deliveryId,
        {
          assignment_id: assignmentId,
          vehicle_id: vehicleId,
          driver_id: driverId,
        },
        actorId
      );

      return {
        success: true,
        assignment_id: assignmentId,
        delivery_id: deliveryId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        message: `Delivery ${deliveryId} successfully assigned to ${vehicle.registration_number} & ${driver.name}.`,
      };
    } finally {
      this.store.releaseLocks(lockKeys);
    }
  }

  /**
   * Complete Delivery and Atomically Release Allocated Resources
   */
  public completeDelivery(deliveryId: string, actorId: string = 'dispatcher'): AssignmentResult {
    const lockKeys = [`del:${deliveryId}`];
    this.store.acquireLocks(lockKeys);

    try {
      const delivery = this.store.findDelivery(deliveryId);
      if (!delivery) {
        return {
          success: false,
          error_code: 'DELIVERY_NOT_FOUND',
          message: `Delivery ${deliveryId} does not exist.`,
        };
      }

      if (delivery.status !== 'assigned' && delivery.status !== 'in_transit') {
        return {
          success: false,
          error_code: 'INVALID_TRANSITION',
          message: `Delivery cannot be marked delivered from status '${delivery.status}'.`,
        };
      }

      const vehicleId = delivery.assigned_vehicle_id;
      const driverId = delivery.assigned_driver_id;

      // Update Delivery
      this.store.updateDelivery(deliveryId, {
        status: 'delivered',
      });

      // Close active assignment FIRST
      const activeAssignment = this.store
        .getAssignments()
        .find((a) => a.delivery_id === deliveryId && a.status === 'active');

      if (activeAssignment) {
        this.store.updateAssignment(activeAssignment.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      }

      // Safe Vehicle Release: Only release if currently 'assigned' AND no other active assignment exists
      if (vehicleId) {
        const vehicle = this.store.findVehicle(vehicleId);
        const otherActiveVehicleAssignments = this.store
          .getAssignments()
          .filter((a) => a.vehicle_id === vehicleId && a.status === 'active' && a.delivery_id !== deliveryId);

        if (vehicle && vehicle.status === 'assigned' && otherActiveVehicleAssignments.length === 0) {
          this.store.updateVehicle(vehicleId, { status: 'available' });
        }
      }

      // Safe Driver Release: Only release if currently 'assigned' AND no other active assignment exists
      if (driverId) {
        const driver = this.store.findDriver(driverId);
        const otherActiveDriverAssignments = this.store
          .getAssignments()
          .filter((a) => a.driver_id === driverId && a.status === 'active' && a.delivery_id !== deliveryId);

        if (driver && driver.availability_status === 'assigned' && otherActiveDriverAssignments.length === 0) {
          this.store.updateDriver(driverId, { availability_status: 'available' });
        }
      }

      this.store.addAuditLog(
        'COMPLETE_DELIVERY',
        'DELIVERY',
        deliveryId,
        {
          released_vehicle_id: vehicleId,
          released_driver_id: driverId,
        },
        actorId
      );

      return {
        success: true,
        delivery_id: deliveryId,
        released_vehicle_id: vehicleId || undefined,
        released_driver_id: driverId || undefined,
        message: `Delivery ${deliveryId} marked delivered. Resources successfully released back to available pool.`,
      };
    } finally {
      this.store.releaseLocks(lockKeys);
    }
  }

  /**
   * Cancel Delivery and Safely Release Any Allocated Resources
   */
  public cancelDelivery(
    deliveryId: string,
    reason: string = 'Cancelled by dispatcher',
    actorId: string = 'dispatcher'
  ): AssignmentResult {
    const lockKeys = [`del:${deliveryId}`];
    this.store.acquireLocks(lockKeys);

    try {
      const delivery = this.store.findDelivery(deliveryId);
      if (!delivery) {
        return {
          success: false,
          error_code: 'DELIVERY_NOT_FOUND',
          message: `Delivery ${deliveryId} does not exist.`,
        };
      }

      if (delivery.status !== 'pending' && delivery.status !== 'assigned') {
        return {
          success: false,
          error_code: 'INVALID_TRANSITION',
          message: `Delivery cannot be cancelled from status '${delivery.status}'.`,
        };
      }

      const vehicleId = delivery.assigned_vehicle_id;
      const driverId = delivery.assigned_driver_id;

      // Update Delivery
      this.store.updateDelivery(deliveryId, {
        status: 'cancelled',
      });

      // Cancel active assignment if exists FIRST
      const activeAssignment = this.store
        .getAssignments()
        .find((a) => a.delivery_id === deliveryId && a.status === 'active');

      if (activeAssignment) {
        this.store.updateAssignment(activeAssignment.id, {
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        });
      }

      // Safe Vehicle Release: Only release if currently 'assigned' AND no other active assignment exists
      if (vehicleId) {
        const vehicle = this.store.findVehicle(vehicleId);
        const otherActiveVehicleAssignments = this.store
          .getAssignments()
          .filter((a) => a.vehicle_id === vehicleId && a.status === 'active' && a.delivery_id !== deliveryId);

        if (vehicle && vehicle.status === 'assigned' && otherActiveVehicleAssignments.length === 0) {
          this.store.updateVehicle(vehicleId, { status: 'available' });
        }
      }

      // Safe Driver Release: Only release if currently 'assigned' AND no other active assignment exists
      if (driverId) {
        const driver = this.store.findDriver(driverId);
        const otherActiveDriverAssignments = this.store
          .getAssignments()
          .filter((a) => a.driver_id === driverId && a.status === 'active' && a.delivery_id !== deliveryId);

        if (driver && driver.availability_status === 'assigned' && otherActiveDriverAssignments.length === 0) {
          this.store.updateDriver(driverId, { availability_status: 'available' });
        }
      }

      this.store.addAuditLog(
        'CANCEL_DELIVERY',
        'DELIVERY',
        deliveryId,
        {
          reason,
          released_vehicle_id: vehicleId,
          released_driver_id: driverId,
        },
        actorId
      );

      return {
        success: true,
        delivery_id: deliveryId,
        released_vehicle_id: vehicleId || undefined,
        released_driver_id: driverId || undefined,
        message: `Delivery ${deliveryId} cancelled and resources released.`,
      };
    } finally {
      this.store.releaseLocks(lockKeys);
    }
  }

  /**
   * Transition Delivery Status (assigned -> in_transit)
   */
  public updateDeliveryStatus(
    deliveryId: string,
    targetStatus: DeliveryStatus,
    actorId: string = 'dispatcher'
  ): AssignmentResult {
    const delivery = this.store.findDelivery(deliveryId);
    if (!delivery) {
      return {
        success: false,
        error_code: 'DELIVERY_NOT_FOUND',
        message: `Delivery ${deliveryId} does not exist.`,
      };
    }

    if (delivery.status === 'assigned' && targetStatus === 'in_transit') {
      this.store.updateDelivery(deliveryId, { status: 'in_transit' });
      this.store.addAuditLog(
        'STATUS_CHANGE',
        'DELIVERY',
        deliveryId,
        { from: 'assigned', to: 'in_transit' },
        actorId
      );
      return {
        success: true,
        delivery_id: deliveryId,
        message: `Delivery ${deliveryId} is now in transit.`,
      };
    }

    return {
      success: false,
      error_code: 'INVALID_TRANSITION',
      message: `Invalid direct status transition from '${delivery.status}' to '${targetStatus}'.`,
    };
  }
}

export const globalAssignmentEngine = new AssignmentEngine();

