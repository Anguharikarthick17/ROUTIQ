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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#176B38] text-white border border-[#111111]">
            <CheckCircle className="w-3.5 h-3.5" /> Available
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFF21A] text-[#111111] border border-[#111111]">
            <Clock className="w-3.5 h-3.5" /> Assigned
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#8A4B00] text-white border border-[#111111]">
            <Wrench className="w-3.5 h-3.5" /> Maintenance
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EEEEEE] text-[#555555] border border-[#111111]">
            <Ban className="w-3.5 h-3.5" /> Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] p-6 rounded-xl shadow-[4px_4px_0px_#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-[#FFF21A] text-[#111111] font-mono text-[10px] font-black uppercase tracking-wider border border-[#111111]">
              Fleet Asset Registry
            </span>
            <span className="text-xs font-mono font-bold text-[#45421F]">
              Real-Time Asset Inventory & Telemetry
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[#111111]">
            Vehicle Fleet Management
          </h1>
          <p className="text-xs text-[#45421F] mt-1 font-mono">
            {vehicles.length} registered vehicles across multiple asset classes with strict state guards.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FFFFFF] p-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#45421F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle ID, license plate, notes..."
            className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg pl-9 pr-4 py-2 text-xs text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] font-mono shadow-[2px_2px_0px_#111111]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#111111]" />
          <span className="text-xs font-mono font-black text-[#111111]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-2 text-xs font-mono font-black text-[#111111] focus:outline-none focus:bg-[#FFF21A] shadow-[2px_2px_0px_#111111] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#111111]" />
          <span className="text-xs font-mono font-black text-[#111111]">Class:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-2 text-xs font-mono font-black text-[#111111] focus:outline-none focus:bg-[#FFF21A] shadow-[2px_2px_0px_#111111] cursor-pointer"
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
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111111] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b-2 border-[#111111]">
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
            <tbody className="divide-y divide-[#111111]/15">
              {filteredVehicles.map((vehicle) => {
                const activeDelivery = deliveries.find(
                  (d) =>
                    d.assigned_vehicle_id === vehicle.id &&
                    (d.status === 'assigned' || d.status === 'in_transit')
                );

                return (
                  <tr key={vehicle.id} className="hover:bg-[#FFF21A]/20 transition-colors">
                    <td className="py-3 px-4 font-black text-[#111111]">{vehicle.id}</td>
                    <td className="py-3 px-4 text-[#111111] font-black">
                      {vehicle.registration_number}
                    </td>
                    <td className="py-3 px-4 text-[#45421F] font-bold">
                      {vehicleTypeLabel(vehicle.vehicle_type)}
                    </td>
                    <td className="py-3 px-4 font-black text-[#111111]">
                      {formatWeight(vehicle.capacity)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(vehicle.status)}</td>
                    <td className="py-3 px-4 text-[#45421F] max-w-xs truncate">
                      {activeDelivery ? (
                        <span className="text-[#A65BFF] font-black">
                          Assigned to {activeDelivery.id} ({activeDelivery.pickup_location.slice(0, 18)}...)
                        </span>
                      ) : (
                        vehicle.notes || '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="px-3 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#FFF21A] border-2 border-[#111111] text-xs font-black text-[#111111] shadow-[2px_2px_0px_#111111] transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-lg rounded-xl p-6 shadow-[8px_8px_0px_#111111] relative text-[#111111]">
            <button
              onClick={() => setSelectedVehicle(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-[#111111] hover:bg-[#FFF21A] text-[#111111]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-display text-[#111111]">
                  {selectedVehicle.id} — {selectedVehicle.registration_number}
                </h3>
                <p className="text-xs font-mono font-bold text-[#45421F]">
                  {vehicleTypeLabel(selectedVehicle.vehicle_type)} • Payload {formatWeight(selectedVehicle.capacity)}
                </p>
              </div>
            </div>

            <div className="space-y-3 py-3 border-y-2 border-[#111111]/15 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#45421F] font-bold">Operational Status:</span>
                <div>{getStatusBadge(selectedVehicle.status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#45421F] font-bold">Fleet Notes:</span>
                <span className="text-[#111111] font-black">{selectedVehicle.notes || 'None recorded'}</span>
              </div>
            </div>

            {/* Assignment History for this vehicle */}
            <div className="mt-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black mb-2">
                Historical Assignments ({assignments.filter((a) => a.vehicle_id === selectedVehicle.id).length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {assignments
                  .filter((a) => a.vehicle_id === selectedVehicle.id)
                  .map((asgn) => (
                    <div
                      key={asgn.id}
                      className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#111111] text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-[#111111] font-black">{asgn.delivery_id}</span>
                      <span className="text-[#45421F] font-bold">Driver: {asgn.driver_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded uppercase font-black border border-[#111111] ${
                          asgn.status === 'active'
                            ? 'bg-[#FFF21A] text-[#111111]'
                            : 'bg-[#176B38] text-white'
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
                className="px-5 py-2 bg-[#111111] hover:bg-[#222222] text-[#FFF21A] font-black text-xs font-mono uppercase rounded-lg border border-[#111111]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-md rounded-xl p-6 shadow-[8px_8px_0px_#111111] relative text-[#111111]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-[#111111] hover:bg-[#FFF21A] text-[#111111]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black font-display text-[#111111] mb-4">
              Register New Fleet Asset
            </h3>

            {formError && (
              <div className="p-3 bg-[#B42318]/10 border-2 border-[#B42318] text-[#B42318] text-xs font-mono font-bold rounded-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#45421F] font-black block mb-1">VEHICLE ID (e.g. V-107)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="V-107"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">REGISTRATION NUMBER (Unique License Plate)</label>
                <input
                  type="text"
                  required
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  placeholder="KA-06-TR-7721"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#45421F] font-black block mb-1">CLASSIFICATION</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as VehicleType)}
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] cursor-pointer"
                  >
                    <option value="electric_van">Electric Van</option>
                    <option value="van">Cargo Van</option>
                    <option value="truck">Freight Truck</option>
                    <option value="cargo_bike">Cargo Bike</option>
                    <option value="refrigerated_truck">Refrigerated Truck</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#45421F] font-black block mb-1">PAYLOAD CAPACITY (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">NOTES</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] font-bold rounded-lg hover:bg-[#EEEEEE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-black rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
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

