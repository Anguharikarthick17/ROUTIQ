import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { Vehicle, VehicleStatus, VehicleType } from '../../types';
import { vehicleSchema } from '../../types/schemas';
import { vehicleTypeLabel, formatWeight } from '../../lib/utils';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban,
  Wrench,
  X,
  ShieldAlert,
} from 'lucide-react';

export const VehicleManagementView: React.FC = () => {
  const { vehicles, deliveries, assignments, addVehicle } = useOperational();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [newId, setNewId] = useState('');
  const [newReg, setNewReg] = useState('');
  const [newType, setNewType] = useState<VehicleType>('van');
  const [newCapacity, setNewCapacity] = useState<number>(1000);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || v.vehicle_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Check duplicate ID
    if (vehicles.some((v) => v.id.toUpperCase() === newId.toUpperCase())) {
      setFormError(`Vehicle ID ${newId} already exists in fleet database.`);
      return;
    }

    // Check duplicate registration
    if (
      vehicles.some(
        (v) => v.registration_number.toUpperCase() === newReg.toUpperCase()
      )
    ) {
      setFormError(`Registration number ${newReg} is already registered.`);
      return;
    }

    const payload = {
      id: newId.toUpperCase(),
      registration_number: newReg.toUpperCase(),
      vehicle_type: newType,
      capacity: Number(newCapacity),
      status: 'available' as VehicleStatus,
      notes: newNotes,
    };

    const parsed = vehicleSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0].message);
      return;
    }

    addVehicle(payload);
    setIsAddModalOpen(false);
    // Reset form
    setNewId('');
    setNewReg('');
    setNewNotes('');
  };

  const getStatusBadge = (status: VehicleStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Available
          </span>
        );
      case 'assigned':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-yellow-950/60 text-[#FFF21A] border border-yellow-800">
            <Clock className="w-3.5 h-3.5" /> Assigned
          </span>
        );
      case 'maintenance':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-800">
            <Wrench className="w-3.5 h-3.5" /> Maintenance
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Ban className="w-3.5 h-3.5" /> Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#383838]">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#FFF21A] font-bold">
            Fleet Asset Registry
          </div>
          <h1 className="text-3xl font-display font-bold text-[#FFFFFF] mt-1">
            Vehicle Fleet Management
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1 font-mono">
            {vehicles.length} registered vehicles across multiple asset classes with strict state guards.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#202020] p-4 rounded-xl border border-[#383838]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle ID, license plate, notes..."
            className="w-full bg-[#171717] border border-[#383838] rounded-lg pl-9 pr-4 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A] font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#A3A3A3]" />
          <span className="text-xs font-mono text-[#A3A3A3]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-[#171717] border border-[#383838] rounded-lg px-3 py-2 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
          >
            <option value="ALL">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#A3A3A3]" />
          <span className="text-xs font-mono text-[#A3A3A3]">Class:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 bg-[#171717] border border-[#383838] rounded-lg px-3 py-2 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="electric_van">Electric Van</option>
            <option value="van">Cargo Van</option>
            <option value="truck">Freight Truck</option>
            <option value="cargo_bike">Cargo Bike</option>
            <option value="refrigerated_truck">Refrigerated Truck</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid / Table */}
      <div className="bg-[#202020] border border-[#383838] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#171717] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#383838]">
              <tr>
                <th className="py-3 px-4">Vehicle ID</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Max Payload</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Active Route / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383838]">
              {filteredVehicles.map((vehicle) => {
                const activeDelivery = deliveries.find(
                  (d) =>
                    d.assigned_vehicle_id === vehicle.id &&
                    (d.status === 'assigned' || d.status === 'in_transit')
                );

                return (
                  <tr key={vehicle.id} className="hover:bg-[#252525] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#FFF21A]">{vehicle.id}</td>
                    <td className="py-3 px-4 text-[#FFFFFF] font-bold">
                      {vehicle.registration_number}
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3]">
                      {vehicleTypeLabel(vehicle.vehicle_type)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                      {formatWeight(vehicle.capacity)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="py-3 px-4 text-[#A3A3A3] max-w-xs truncate">
                      {activeDelivery ? (
                        <span className="text-yellow-400 font-bold">
                          Assigned to {activeDelivery.id} ({activeDelivery.pickup_location.slice(0, 18)}...)
                        </span>
                      ) : (
                        vehicle.notes || '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="px-2.5 py-1 rounded bg-[#171717] hover:bg-[#383838] border border-[#383838] text-xs text-[#FFFFFF] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Vehicle Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#383838] w-full max-w-lg rounded-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#FFF21A]/10 text-[#FFF21A]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-[#FFFFFF]">
                  {selectedVehicle.id} — {selectedVehicle.registration_number}
                </h3>
                <p className="text-xs font-mono text-[#A3A3A3]">
                  {vehicleTypeLabel(selectedVehicle.vehicle_type)} • Payload {formatWeight(selectedVehicle.capacity)}
                </p>
              </div>
            </div>

            <div className="space-y-3 py-3 border-y border-[#383838] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Operational Status:</span>
                <div>{getStatusBadge(selectedVehicle.status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Fleet Notes:</span>
                <span className="text-[#FFFFFF]">{selectedVehicle.notes || 'None recorded'}</span>
              </div>
            </div>

            {/* Assignment History for this vehicle */}
            <div className="mt-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] mb-2">
                Historical Assignments ({assignments.filter((a) => a.vehicle_id === selectedVehicle.id).length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {assignments
                  .filter((a) => a.vehicle_id === selectedVehicle.id)
                  .map((asgn) => (
                    <div
                      key={asgn.id}
                      className="p-2.5 rounded bg-[#202020] border border-[#383838] text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-[#FFF21A] font-bold">{asgn.delivery_id}</span>
                      <span className="text-[#A3A3A3]">Driver: {asgn.driver_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                          asgn.status === 'active'
                            ? 'bg-yellow-950 text-yellow-400'
                            : 'bg-emerald-950 text-emerald-400'
                        }`}
                      >
                        {asgn.status}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-[#202020] hover:bg-[#282828] border border-[#383838] text-xs font-mono uppercase rounded text-[#FFFFFF]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#383838] w-full max-w-md rounded-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-[#FFFFFF] mb-4">
              Register New Fleet Asset
            </h3>

            {formError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#A3A3A3] block mb-1">VEHICLE ID (e.g. V-107)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="V-107"
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#A3A3A3] block mb-1">REGISTRATION NUMBER (Unique License Plate)</label>
                <input
                  type="text"
                  required
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  placeholder="KA-06-TR-7721"
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#A3A3A3] block mb-1">CLASSIFICATION</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as VehicleType)}
                    className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                  >
                    <option value="electric_van">Electric Van</option>
                    <option value="van">Cargo Van</option>
                    <option value="truck">Freight Truck</option>
                    <option value="cargo_bike">Cargo Bike</option>
                    <option value="refrigerated_truck">Refrigerated Truck</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#A3A3A3] block mb-1">PAYLOAD CAPACITY (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#A3A3A3] block mb-1">NOTES</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#202020] text-[#A3A3A3] hover:text-[#FFFFFF] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FFF21A] text-[#171717] font-bold rounded hover:bg-[#fff447]"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
