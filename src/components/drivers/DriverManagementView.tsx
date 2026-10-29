import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { Driver, DriverStatus } from '../../types';
import { driverSchema } from '../../types/schemas';
import {
  User,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Ban,
  X,
  Phone,
  ShieldAlert,
} from 'lucide-react';

export const DriverManagementView: React.FC = () => {
  const { drivers, deliveries, assignments, addDriver } = useOperational();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.notes && d.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || d.availability_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (drivers.some((d) => d.id.toUpperCase() === newId.toUpperCase())) {
      setFormError(`Driver ID ${newId} already exists in registry.`);
      return;
    }

    const payload = {
      id: newId.toUpperCase(),
      name: newName,
      phone: newPhone,
      availability_status: 'available' as DriverStatus,
      notes: newNotes,
    };

    const parsed = driverSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.errors[0].message);
      return;
    }

    addDriver(payload);
    setIsAddModalOpen(false);
    setNewId('');
    setNewName('');
    setNewPhone('');
    setNewNotes('');
  };

  const getStatusBadge = (status: DriverStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            <CheckCircle className="w-3.5 h-3.5" /> Standby Available
          </span>
        );
      case 'assigned':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-yellow-950/60 text-[#FFF21A] border border-yellow-800">
            <Clock className="w-3.5 h-3.5" /> Active Route
          </span>
        );
      case 'unavailable':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
            <Ban className="w-3.5 h-3.5" /> Unavailable / Leave
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#383838]">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-bold">
            Personnel Operations
          </div>
          <h1 className="text-3xl font-display font-bold text-[#FFFFFF] mt-1">
            Driver & Dispatch Roster
          </h1>
          <p className="text-xs text-[#A3A3A3] mt-1 font-mono">
            {drivers.length} certified logistics couriers and heavy transport operators.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#A65BFF] hover:bg-[#A65BFF]/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Driver</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#202020] p-4 rounded-xl border border-[#383838]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver name, ID, phone..."
            className="w-full bg-[#171717] border border-[#383838] rounded-lg pl-9 pr-4 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF] font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#A3A3A3]" />
          <span className="text-xs font-mono text-[#A3A3A3]">Availability:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-[#171717] border border-[#383838] rounded-lg px-3 py-2 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF]"
          >
            <option value="ALL">All Drivers</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-[#202020] border border-[#383838] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#171717] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#383838]">
              <tr>
                <th className="py-3 px-4">Driver ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Direct Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Route / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383838]">
              {filteredDrivers.map((driver) => {
                const activeDelivery = deliveries.find(
                  (d) =>
                    d.assigned_driver_id === driver.id &&
                    (d.status === 'assigned' || d.status === 'in_transit')
                );

                return (
                  <tr key={driver.id} className="hover:bg-[#252525] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#A65BFF]">{driver.id}</td>
                    <td className="py-3 px-4 text-[#FFFFFF] font-bold">{driver.name}</td>
                    <td className="py-3 px-4 text-[#A3A3A3]">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#A3A3A3]" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(driver.availability_status)}</td>
                    <td className="py-3 px-4 text-[#A3A3A3] max-w-xs truncate">
                      {activeDelivery ? (
                        <span className="text-yellow-400 font-bold">
                          Assigned to {activeDelivery.id}
                        </span>
                      ) : (
                        driver.notes || '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDriver(driver)}
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

      {/* Inspect Driver Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#383838] w-full max-w-lg rounded-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedDriver(null)}
              className="absolute top-4 right-4 text-[#A3A3A3] hover:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#A65BFF]/10 text-[#A65BFF]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-[#FFFFFF]">
                  {selectedDriver.name} ({selectedDriver.id})
                </h3>
                <p className="text-xs font-mono text-[#A3A3A3]">{selectedDriver.phone}</p>
              </div>
            </div>

            <div className="space-y-3 py-3 border-y border-[#383838] text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Availability Status:</span>
                <div>{getStatusBadge(selectedDriver.availability_status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A3A3A3]">Specialty Notes:</span>
                <span className="text-[#FFFFFF]">{selectedDriver.notes || 'None recorded'}</span>
              </div>
            </div>

            {/* Assignment History for this driver */}
            <div className="mt-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] mb-2">
                Assignment History ({assignments.filter((a) => a.driver_id === selectedDriver.id).length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {assignments
                  .filter((a) => a.driver_id === selectedDriver.id)
                  .map((asgn) => (
                    <div
                      key={asgn.id}
                      className="p-2.5 rounded bg-[#202020] border border-[#383838] text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-[#FFF21A] font-bold">{asgn.delivery_id}</span>
                      <span className="text-[#A3A3A3]">Vehicle: {asgn.vehicle_id}</span>
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
                onClick={() => setSelectedDriver(null)}
                className="px-4 py-2 bg-[#202020] hover:bg-[#282828] border border-[#383838] text-xs font-mono uppercase rounded text-[#FFFFFF]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
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
              Register New Courier / Driver
            </h3>

            {formError && (
              <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#A3A3A3] block mb-1">DRIVER ID (e.g. DR-06)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="DR-06"
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF]"
                />
              </div>

              <div>
                <label className="text-[#A3A3A3] block mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jordan Vance"
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF]"
                />
              </div>

              <div>
                <label className="text-[#A3A3A3] block mb-1">CONTACT PHONE</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 789-0123"
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF]"
                />
              </div>

              <div>
                <label className="text-[#A3A3A3] block mb-1">CERTIFICATIONS / NOTES</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Hazmat certified, cold-chain specialist..."
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-[#FFFFFF] focus:outline-none focus:border-[#A65BFF]"
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
                  className="px-4 py-2 bg-[#A65BFF] text-white font-bold rounded hover:bg-[#A65BFF]/90"
                >
                  Register Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

