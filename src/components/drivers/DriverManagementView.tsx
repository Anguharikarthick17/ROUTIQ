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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#176B38] text-white border border-[#111111]">
            <CheckCircle className="w-3.5 h-3.5" /> Standby Available
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#FFF21A] text-[#111111] border border-[#111111]">
            <Clock className="w-3.5 h-3.5" /> Active Route
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EEEEEE] text-[#555555] border border-[#111111]">
            <Ban className="w-3.5 h-3.5" /> Unavailable / Leave
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
              Personnel Operations
            </span>
            <span className="text-xs font-mono font-bold text-[#45421F]">
              Courier Duty Roster & Certification Tracking
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[#111111]">
            Driver & Dispatch Roster
          </h1>
          <p className="text-xs text-[#45421F] mt-1 font-mono">
            {drivers.length} certified logistics couriers and heavy transport operators.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center gap-2 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register Driver</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FFFFFF] p-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
        <div className="relative">
          <Search className="w-4 h-4 text-[#45421F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search driver name, ID, phone..."
            className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg pl-9 pr-4 py-2 text-xs text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] font-mono shadow-[2px_2px_0px_#111111]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#111111]" />
          <span className="text-xs font-mono font-black text-[#111111]">Availability:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-2 text-xs font-mono font-black text-[#111111] focus:outline-none focus:bg-[#FFF21A] shadow-[2px_2px_0px_#111111] cursor-pointer"
          >
            <option value="ALL">All Drivers</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111111] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b-2 border-[#111111]">
              <tr>
                <th className="py-3 px-4">Driver ID</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Direct Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Route / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111111]/15">
              {filteredDrivers.map((driver) => {
                const activeDelivery = deliveries.find(
                  (d) =>
                    d.assigned_driver_id === driver.id &&
                    (d.status === 'assigned' || d.status === 'in_transit')
                );

                return (
                  <tr key={driver.id} className="hover:bg-[#FFF21A]/20 transition-colors">
                    <td className="py-3 px-4 font-black text-[#111111]">{driver.id}</td>
                    <td className="py-3 px-4 text-[#111111] font-black">{driver.name}</td>
                    <td className="py-3 px-4 text-[#45421F]">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Phone className="w-3.5 h-3.5 text-[#111111]" />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(driver.availability_status)}</td>
                    <td className="py-3 px-4 text-[#45421F] max-w-xs truncate">
                      {activeDelivery ? (
                        <span className="text-[#A65BFF] font-black">
                          Assigned to {activeDelivery.id}
                        </span>
                      ) : (
                        driver.notes || '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedDriver(driver)}
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

      {/* Inspect Driver Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-lg rounded-xl p-6 shadow-[8px_8px_0px_#111111] relative text-[#111111]">
            <button
              onClick={() => setSelectedDriver(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-[#111111] hover:bg-[#FFF21A] text-[#111111]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black font-display text-[#111111]">
                  {selectedDriver.name} ({selectedDriver.id})
                </h3>
                <p className="text-xs font-mono font-bold text-[#45421F]">{selectedDriver.phone}</p>
              </div>
            </div>

            <div className="space-y-3 py-3 border-y-2 border-[#111111]/15 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-[#45421F] font-bold">Availability Status:</span>
                <div>{getStatusBadge(selectedDriver.availability_status)}</div>
              </div>
              <div className="flex justify-between">
                <span className="text-[#45421F] font-bold">Specialty Notes:</span>
                <span className="text-[#111111] font-black">{selectedDriver.notes || 'None recorded'}</span>
              </div>
            </div>

            {/* Assignment History for this driver */}
            <div className="mt-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black mb-2">
                Assignment History ({assignments.filter((a) => a.driver_id === selectedDriver.id).length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {assignments
                  .filter((a) => a.driver_id === selectedDriver.id)
                  .map((asgn) => (
                    <div
                      key={asgn.id}
                      className="p-2.5 rounded-lg bg-[#F8F8F8] border border-[#111111] text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-[#111111] font-black">{asgn.delivery_id}</span>
                      <span className="text-[#45421F] font-bold">Vehicle: {asgn.vehicle_id}</span>
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
                onClick={() => setSelectedDriver(null)}
                className="px-5 py-2 bg-[#111111] hover:bg-[#222222] text-[#FFF21A] font-black text-xs font-mono uppercase rounded-lg border border-[#111111]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
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
              Register New Courier / Driver
            </h3>

            {formError && (
              <div className="p-3 bg-[#B42318]/10 border-2 border-[#B42318] text-[#B42318] text-xs font-mono font-bold rounded-lg mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDriver} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-[#45421F] font-black block mb-1">DRIVER ID (e.g. DR-06)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="DR-06"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Jordan Vance"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">CONTACT PHONE</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1 (555) 789-0123"
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A]"
                />
              </div>

              <div>
                <label className="text-[#45421F] font-black block mb-1">CERTIFICATIONS / NOTES</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Hazmat certified, cold-chain specialist..."
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

