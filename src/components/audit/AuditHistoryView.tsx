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
      <div className="pb-6 border-b border-[#383838]">
        <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-bold">
          Immutable System Ledger
        </div>
        <h1 className="text-3xl font-display font-bold text-[#FFFFFF] mt-1">
          Operational Audit & Traceability
        </h1>
        <p className="text-xs text-[#A3A3A3] mt-1 font-mono">
          Cryptographically recorded timestamps, actors, and state transitions across all dispatch operations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#202020] p-4 rounded-xl border border-[#383838]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, entity ID, actor..."
            className="w-full bg-[#171717] border border-[#383838] rounded-lg pl-9 pr-4 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A] font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#A3A3A3]" />
          <span className="text-xs font-mono text-[#A3A3A3]">Entity:</span>
          <select
            value={selectedEntityFilter}
            onChange={(e) => setSelectedEntityFilter(e.target.value)}
            className="bg-[#171717] border border-[#383838] rounded-lg px-3 py-2 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
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
      <div className="bg-[#202020] border border-[#383838] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#171717] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#383838]">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383838]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#252525] transition-colors">
                    <td className="py-3 px-4 text-[#A3A3A3] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#A3A3A3]" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#FFFFFF]">
                      <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#383838]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3]">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] ${
                          log.entity_type === 'DELIVERY'
                            ? 'text-yellow-400 bg-yellow-950/40'
                            : log.entity_type === 'VEHICLE'
                            ? 'text-blue-400 bg-blue-950/40'
                            : log.entity_type === 'DRIVER'
                            ? 'text-purple-400 bg-purple-950/40'
                            : 'text-zinc-400 bg-zinc-800'
                        }`}
                      >
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#FFF21A]">{log.entity_id}</td>
                    <td className="py-3 px-4 text-[#A3A3A3]">{log.actor_id || 'system'}</td>
                    <td className="py-3 px-4 text-[#A3A3A3] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#A3A3A3]">
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

