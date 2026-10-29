import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { Delivery, DeliveryPriority, DeliveryStatus, VehicleType } from '../../types';
import { deliverySchema } from '../../types/schemas';
import { vehicleTypeLabel, formatWeight, formatRelativeTime } from '../../lib/utils';
import { SmartDispatchModal } from '../dispatch/SmartDispatchModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Navigation,
  XCircle,
  Truck,
  ArrowRight,
  MapPin,
  X,
  ShieldAlert,
} from 'lucide-react';

interface DeliveryManagementViewProps {
  onPlotRouteOnMap?: (delivery: Delivery) => void;
  onOpenDecisionLab?: (deliveryId: string) => void;
}

export const DeliveryManagementView: React.FC<DeliveryManagementViewProps> = ({
  onPlotRouteOnMap,
  onOpenDecisionLab,
}) => {
  const {
    deliveries,
    vehicles,
    drivers,
    completeDelivery,
    cancelDelivery,
    updateDeliveryStatus,
    addDelivery,
  } = useOperational();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [dispatchTargetDelivery, setDispatchTargetDelivery] = useState<Delivery | null>(null);

  // New Delivery Form State
  const [newId, setNewId] = useState('');
  const [newPickup, setNewPickup] = useState('');
  const [newDropoff, setNewDropoff] = useState('');
  const [newPriority, setNewPriority] = useState<DeliveryPriority>('normal');
  const [newCapacity, setNewCapacity] = useState<number>(300);
  const [newVehicleType, setNewVehicleType] = useState<VehicleType | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.assigned_vehicle_id && d.assigned_vehicle_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.assigned_driver_id && d.assigned_driver_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (deliveries.some((d) => d.id.toUpperCase() === newId.toUpperCase())) {
      setFormError(`Delivery ID ${newId} already exists.`);
      return;
    }

    const payload = {
      id: newId.toUpperCase(),
      pickup_location: newPickup,
      dropoff_location: newDropoff,
      pickup_lat: 37.7749 + (Math.random() - 0.5) * 0.04,
      pickup_lng: -122.4194 + (Math.random() - 0.5) * 0.04,
      dropoff_lat: 37.7892 + (Math.random() - 0.5) * 0.04,
      dropoff_lng: -122.4014 + (Math.random() - 0.5) * 0.04,
      scheduled_time: new Date(Date.now() + 7200000).toISOString(),
      priority: newPriority,
      required_capacity: Number(newCapacity),
      required_vehicle_type: newVehicleType ? (newVehicleType as VehicleType) : undefined,
    };

    const parsed = deliverySchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0].message);
      return;
    }

    addDelivery(payload);
    setIsAddModalOpen(false);
    setNewId('');
    setNewPickup('');
    setNewDropoff('');
  };

  const getPriorityBadge = (priority: DeliveryPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-[#B42318] text-white border border-[#111111]">
            Urgent
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-[#FFF21A] text-[#111111] border border-[#111111]">
            High
          </span>
        );
      case 'normal':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-[#FFFFFF] text-[#111111] border border-[#111111]">
            Normal
          </span>
        );
      case 'low':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#EEEEEE] text-[#555555] border border-[#111111]">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFF21A] text-[#111111] border border-[#111111]">
            <Clock className="w-3 h-3 text-[#8A4B00]" /> Pending Dispatch
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFFFFF] text-[#111111] border border-[#111111]">
            <Truck className="w-3 h-3 text-[#111111]" /> Allocated
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#A65BFF] text-white border border-[#111111]">
            <Navigation className="w-3 h-3" /> In Transit
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#176B38] text-white border border-[#111111]">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#B42318] text-white border border-[#111111]">
            <XCircle className="w-3 h-3" /> Cancelled
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
              Fulfillment Queue
            </span>
            <span className="text-xs font-mono font-bold text-[#45421F]">
              Autonomous Order Lifecycle Engine
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[#111111]">
            Deliveries & Dispatch Orders
          </h1>
          <p className="text-xs text-[#45421F] mt-1 font-mono">
            {deliveries.length} orders tracked through authoritative state machine transitions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
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
            placeholder="Search order ID, location, driver, vehicle..."
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
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black text-[#111111]">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="flex-1 bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-2 text-xs font-mono font-black text-[#111111] focus:outline-none focus:bg-[#FFF21A] shadow-[2px_2px_0px_#111111] cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111111] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b-2 border-[#111111]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Pickup → Destination</th>
                <th className="py-3 px-4">Payload Req</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Allocated Asset</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/15">
              {filteredDeliveries.map((delivery) => {
                const assignedVehicle = vehicles.find((v) => v.id === delivery.assigned_vehicle_id);
                const assignedDriver = drivers.find((d) => d.id === delivery.assigned_driver_id);

                return (
                  <tr key={delivery.id} className="hover:bg-[#FFF21A]/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-black text-[#111111]">{delivery.id}</div>
                      <div className="text-[10px] text-[#45421F] font-bold">
                        {formatRelativeTime(delivery.scheduled_time)}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(delivery.priority)}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate font-black text-[#111111]">
                        {delivery.pickup_location}
                      </div>
                      <div className="text-[#45421F] font-medium truncate text-[11px] flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-[#A65BFF] shrink-0" />
                        <span>{delivery.dropoff_location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-black text-[#111111]">
                        {formatWeight(delivery.required_capacity)}
                      </div>
                      <div className="text-[10px] text-[#45421F] font-bold">
                        {delivery.required_vehicle_type
                          ? vehicleTypeLabel(delivery.required_vehicle_type)
                          : 'Any Type'}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(delivery.status)}</td>
                    <td className="py-3 px-4 text-[#45421F]">
                      {assignedVehicle && assignedDriver ? (
                        <div className="space-y-0.5">
                          <div className="text-[#111111] font-black">
                            {assignedVehicle.id} ({assignedVehicle.registration_number})
                          </div>
                          <div className="text-[10px] text-[#A65BFF] font-bold">{assignedDriver.name}</div>
                        </div>
                      ) : (
                        <span className="text-[#888888] italic font-bold">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      {/* Map inspection button */}
                      {onPlotRouteOnMap && (
                        <button
                          onClick={() => onPlotRouteOnMap(delivery)}
                          className="p-1.5 rounded bg-[#FFFFFF] hover:bg-[#FFF21A] border border-[#111111] text-[#111111] transition-colors shadow-[1px_1px_0px_#111111]"
                          title="Plot road route on map"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#111111]" />
                        </button>
                      )}

                      {/* State transitions */}
                      {delivery.status === 'pending' && (
                        <>
                          {onOpenDecisionLab && (
                            <button
                              onClick={() => onOpenDecisionLab(delivery.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#A65BFF] hover:bg-[#9247E6] text-white border border-[#111111] text-xs font-black font-mono shadow-[2px_2px_0px_#111111]"
                              title="Inspect full candidate matrix in Decision Lab"
                            >
                              Decision Lab
                            </button>
                          )}
                          <button
                            onClick={() => setDispatchTargetDelivery(delivery)}
                            className="px-2.5 py-1 rounded-lg bg-[#FFF21A] hover:bg-[#fff447] text-[#111111] font-black text-xs uppercase border border-[#111111] shadow-[2px_2px_0px_#111111]"
                          >
                            Quick Assign
                          </button>
                          <button
                            onClick={() => cancelDelivery(delivery.id, 'Cancelled from queue')}
                            className="px-2 py-1 rounded bg-[#FFFFFF] hover:bg-[#B42318]/10 border border-[#B42318] text-[#B42318] text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {delivery.status === 'assigned' && (
                        <>
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                            className="px-3 py-1 rounded-lg bg-[#A65BFF] hover:bg-[#9247E6] text-white font-black text-xs border border-[#111111] shadow-[2px_2px_0px_#111111]"
                          >
                            Start Transit
                          </button>
                          <button
                            onClick={() => cancelDelivery(delivery.id, 'Cancelled during assignment')}
                            className="px-2 py-1 rounded bg-[#FFFFFF] hover:bg-[#B42318]/10 border border-[#B42318] text-[#B42318] text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {delivery.status === 'in_transit' && (
                        <button
                          onClick={() => completeDelivery(delivery.id)}
                          className="px-3 py-1 rounded-lg bg-[#176B38] hover:bg-[#12582D] text-white font-black text-xs flex items-center gap-1 inline-flex border border-[#111111] shadow-[2px_2px_0px_#111111]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {(delivery.status === 'delivered' || delivery.status === 'cancelled') && (
                        <span className="text-[10px] text-[#888888] uppercase font-mono font-bold">
                          Completed / Finalized
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Dispatch Modal Trigger */}
      {dispatchTargetDelivery && (
        <SmartDispatchModal
          delivery={dispatchTargetDelivery}
          onClose={() => setDispatchTargetDelivery(null)}
          onAssigned={() => {
            if (onPlotRouteOnMap) onPlotRouteOnMap(dispatchTargetDelivery);
          }}
        />
      )}

      {/* Add Delivery Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-lg rounded-xl p-6 shadow-[8px_8px_0px_#111111] relative text-[#111111]">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-[#111111] hover:bg-[#FFF21A] text-[#111111]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black font-display text-[#111111] mb-4">
              Create New Delivery Order
            </h3>

            {formError && (
              <div className="p-3 bg-[#B42318]/10 border-2 border-[#B42318] text-[#B42318] text-xs font-mono font-bold rounded-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#45421F] font-black block mb-1">ORDER ID (e.g. DEL-207)</label>
                  <input
                    type="text"
                    required
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="DEL-207"
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                  />
                </div>
                <div>
                  <label className="text-[#45421F] font-black block mb-1">PRIORITY</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as DeliveryPriority)}
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">PICKUP LOCATION</label>
                <input
                  type="text"
                  required
                  value={newPickup}
                  onChange={(e) => setNewPickup(e.target.value)}
                  placeholder="e.g. 500 Howard St, San Francisco, CA"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">DROPOFF LOCATION</label>
                <input
                  type="text"
                  required
                  value={newDropoff}
                  onChange={(e) => setNewDropoff(e.target.value)}
                  placeholder="e.g. 1000 Sansome St, San Francisco, CA"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#45421F] font-black block mb-1">REQUIRED PAYLOAD (kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                  />
                </div>
                <div>
                  <label className="text-[#45421F] font-black block mb-1">VEHICLE REQUIREMENT</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value as VehicleType)}
                    className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] cursor-pointer"
                  >
                    <option value="">Any Compatible Class</option>
                    <option value="electric_van">Electric Van</option>
                    <option value="van">Cargo Van</option>
                    <option value="truck">Freight Truck</option>
                    <option value="cargo_bike">Cargo Bike</option>
                    <option value="refrigerated_truck">Refrigerated Truck</option>
                  </select>
                </div>
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
                  Create Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

