import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  Assignment,
  AssignmentResult,
  AuditLog,
  Delivery,
  DeliveryStatus,
  Driver,
  Vehicle,
} from '../types';
import { globalDataStore } from '../services/dataStore';
import { globalAssignmentEngine } from '../services/assignmentEngine';
import { useAuth } from './AuthContext';

interface OperationalContextType {
  vehicles: Vehicle[];
  drivers: Driver[];
  deliveries: Delivery[];
  assignments: Assignment[];
  auditLogs: AuditLog[];
  metrics: {
    totalVehicles: number;
    availableVehicles: number;
    assignedVehicles: number;
    maintenanceVehicles: number;
    inactiveVehicles: number;
    totalDrivers: number;
    availableDrivers: number;
    assignedDrivers: number;
    unavailableDrivers: number;
    totalDeliveries: number;
    pendingDeliveries: number;
    activeDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    fleetUtilizationPct: number;
    completionRatePct: number;
  };
  assignDelivery: (deliveryId: string, vehicleId: string, driverId: string) => AssignmentResult;
  completeDelivery: (deliveryId: string) => AssignmentResult;
  cancelDelivery: (deliveryId: string, reason?: string) => AssignmentResult;
  updateDeliveryStatus: (deliveryId: string, targetStatus: DeliveryStatus) => AssignmentResult;
  addVehicle: (vehicle: Omit<Vehicle, 'created_at' | 'updated_at'>) => void;
  addDriver: (driver: Omit<Driver, 'created_at' | 'updated_at'>) => void;
  addDelivery: (delivery: Omit<Delivery, 'created_at' | 'updated_at' | 'status' | 'assigned_vehicle_id' | 'assigned_driver_id'>) => void;
  resetDemoData: () => void;
  lastActionResult: AssignmentResult | null;
  clearLastResult: () => void;
}

const OperationalContext = createContext<OperationalContextType | undefined>(undefined);

export const OperationalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => globalDataStore.getVehicles());
  const [drivers, setDrivers] = useState<Driver[]>(() => globalDataStore.getDrivers());
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => globalDataStore.getDeliveries());
  const [assignments, setAssignments] = useState<Assignment[]>(() => globalDataStore.getAssignments());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => globalDataStore.getAuditLogs());
  const [lastActionResult, setLastActionResult] = useState<AssignmentResult | null>(null);

  const refreshState = useCallback(() => {
    setVehicles(globalDataStore.getVehicles());
    setDrivers(globalDataStore.getDrivers());
    setDeliveries(globalDataStore.getDeliveries());
    setAssignments(globalDataStore.getAssignments());
    setAuditLogs(globalDataStore.getAuditLogs());
  }, []);

  const assignDelivery = useCallback(
    (deliveryId: string, vehicleId: string, driverId: string): AssignmentResult => {
      const actorId = user?.email || 'dispatcher';
      const result = globalAssignmentEngine.assignDelivery(deliveryId, vehicleId, driverId, actorId);
      setLastActionResult(result);
      refreshState();
      return result;
    },
    [user, refreshState]
  );

  const completeDelivery = useCallback(
    (deliveryId: string): AssignmentResult => {
      const actorId = user?.email || 'dispatcher';
      const result = globalAssignmentEngine.completeDelivery(deliveryId, actorId);
      setLastActionResult(result);
      refreshState();
      return result;
    },
    [user, refreshState]
  );

  const cancelDelivery = useCallback(
    (deliveryId: string, reason?: string): AssignmentResult => {
      const actorId = user?.email || 'dispatcher';
      const result = globalAssignmentEngine.cancelDelivery(deliveryId, reason, actorId);
      setLastActionResult(result);
      refreshState();
      return result;
    },
    [user, refreshState]
  );

  const updateDeliveryStatus = useCallback(
    (deliveryId: string, targetStatus: DeliveryStatus): AssignmentResult => {
      const actorId = user?.email || 'dispatcher';
      const result = globalAssignmentEngine.updateDeliveryStatus(deliveryId, targetStatus, actorId);
      setLastActionResult(result);
      refreshState();
      return result;
    },
    [user, refreshState]
  );

  const addVehicle = useCallback(
    (v: Omit<Vehicle, 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const newVehicle: Vehicle = {
        ...v,
        created_at: now,
        updated_at: now,
      };
      globalDataStore.addVehicle(newVehicle);
      refreshState();
    },
    [refreshState]
  );

  const addDriver = useCallback(
    (d: Omit<Driver, 'created_at' | 'updated_at'>) => {
      const now = new Date().toISOString();
      const newDriver: Driver = {
        ...d,
        created_at: now,
        updated_at: now,
      };
      globalDataStore.addDriver(newDriver);
      refreshState();
    },
    [refreshState]
  );

  const addDelivery = useCallback(
    (d: Omit<Delivery, 'created_at' | 'updated_at' | 'status' | 'assigned_vehicle_id' | 'assigned_driver_id'>) => {
      const now = new Date().toISOString();
      const newDelivery: Delivery = {
        ...d,
        status: 'pending',
        assigned_vehicle_id: null,
        assigned_driver_id: null,
        created_at: now,
        updated_at: now,
      };
      globalDataStore.addDelivery(newDelivery);
      refreshState();
    },
    [refreshState]
  );

  const resetDemoData = useCallback(() => {
    globalDataStore.resetToDefault();
    refreshState();
    setLastActionResult({
      success: true,
      message: 'Demonstration fleet data successfully restored to canonical baseline.',
    });
  }, [refreshState]);

  const clearLastResult = useCallback(() => {
    setLastActionResult(null);
  }, []);

  // Metrics computation with documented formulas
  const metrics = useMemo(() => {
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
    const assignedVehicles = vehicles.filter((v) => v.status === 'assigned').length;
    const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance').length;
    const inactiveVehicles = vehicles.filter((v) => v.status === 'inactive').length;

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter((d) => d.availability_status === 'available').length;
    const assignedDrivers = drivers.filter((d) => d.availability_status === 'assigned').length;
    const unavailableDrivers = drivers.filter((d) => d.availability_status === 'unavailable').length;

    const totalDeliveries = deliveries.length;
    const pendingDeliveries = deliveries.filter((d) => d.status === 'pending').length;
    const activeDeliveries = deliveries.filter(
      (d) => d.status === 'assigned' || d.status === 'in_transit'
    ).length;
    const completedDeliveries = deliveries.filter((d) => d.status === 'delivered').length;
    const cancelledDeliveries = deliveries.filter((d) => d.status === 'cancelled').length;

    // Fleet utilization = (Assigned Vehicles / Total Non-Maintenance Vehicles) * 100
    const activeFleetBase = totalVehicles - maintenanceVehicles - inactiveVehicles;
    const fleetUtilizationPct =
      activeFleetBase > 0 ? Math.round((assignedVehicles / activeFleetBase) * 100) : 0;

    // Delivery completion rate = (Completed / (Completed + In-Transit + Cancelled + Pending)) * 100
    const completionRatePct =
      totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

    return {
      totalVehicles,
      availableVehicles,
      assignedVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      totalDrivers,
      availableDrivers,
      assignedDrivers,
      unavailableDrivers,
      totalDeliveries,
      pendingDeliveries,
      activeDeliveries,
      completedDeliveries,
      cancelledDeliveries,
      fleetUtilizationPct,
      completionRatePct,
    };
  }, [vehicles, drivers, deliveries]);

  return (
    <OperationalContext.Provider
      value={{
        vehicles,
        drivers,
        deliveries,
        assignments,
        auditLogs,
        metrics,
        assignDelivery,
        completeDelivery,
        cancelDelivery,
        updateDeliveryStatus,
        addVehicle,
        addDriver,
        addDelivery,
        resetDemoData,
        lastActionResult,
        clearLastResult,
      }}
    >
      {children}
    </OperationalContext.Provider>
  );
};

export const useOperational = () => {
  const context = useContext(OperationalContext);
  if (!context) throw new Error('useOperational must be used within an OperationalProvider');
  return context;
};
