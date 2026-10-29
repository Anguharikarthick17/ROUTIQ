import React, { useState } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { formatDateTime } from '../../lib/utils';
import { Shield, Clock, Search, Filter } from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
  const { auditLogs } = useOperational();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actor_id && log.actor_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEntity =
      selectedEntityFilter === 'ALL' || log.entity_type === selectedEntityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#FFFFFF] p-6 rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
        <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-black">
          IMMUTABLE SYSTEM LEDGER
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-black text-[#111111] mt-1 tracking-tight">
          OPERATIONAL AUDIT & TRACEABILITY
        </h1>
        <p className="text-xs text-[#45421F] mt-1 font-bold">
          Cryptographically recorded timestamps, actors, and state transitions across all dispatch operations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FFFFFF] p-4 rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#45421F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, entity ID, actor..."
            className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg pl-9 pr-4 py-2 text-xs text-[#111111] placeholder-[#45421F]/60 focus:outline-none focus:bg-[#FFF21A]/20 font-mono font-bold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#111111]" />
          <span className="text-xs font-mono font-black text-[#111111]">Entity:</span>
          <select
            value={selectedEntityFilter}
            onChange={(e) => setSelectedEntityFilter(e.target.value)}
            className="bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#111111] focus:outline-none focus:bg-[#FFF21A]/20"
          >
            <option value="ALL">All Entities</option>
            <option value="DELIVERY">Deliveries</option>
            <option value="VEHICLE">Vehicles</option>
            <option value="DRIVER">Drivers</option>
            <option value="SYSTEM">System</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#111111] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b-2 border-[#111111]">
              <tr>
                <th className="py-3.5 px-4 font-black">Timestamp (UTC)</th>
                <th className="py-3.5 px-4 font-black">Action</th>
                <th className="py-3.5 px-4 font-black">Entity Type</th>
                <th className="py-3.5 px-4 font-black">Entity ID</th>
                <th className="py-3.5 px-4 font-black">Actor</th>
                <th className="py-3.5 px-4 font-black">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#111111]/10">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FFF21A]/10 transition-colors">
                    <td className="py-3.5 px-4 text-[#45421F] font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#111111]" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#111111]">
                      <span className="px-2.5 py-1 rounded-md bg-[#FFF21A] text-[#111111] border border-[#111111]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black border border-[#111111] ${
                          log.entity_type === 'DELIVERY'
                            ? 'text-[#111111] bg-[#FFF21A]'
                            : log.entity_type === 'VEHICLE'
                            ? 'text-white bg-[#111111]'
                            : log.entity_type === 'DRIVER'
                            ? 'text-white bg-[#A65BFF]'
                            : 'text-[#111111] bg-[#EEEEEE]'
                        }`}
                      >
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#111111]">{log.entity_id}</td>
                    <td className="py-3.5 px-4 text-[#45421F] font-bold">{log.actor_id || 'system'}</td>
                    <td className="py-3.5 px-4 text-[#45421F] font-medium max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#45421F] font-bold">
                    No audit records match the current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

