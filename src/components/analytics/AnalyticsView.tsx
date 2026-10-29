import React from 'react';
import { useOperational } from '../../context/OperationalContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, Info, BarChart2, CheckCircle, Clock } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { vehicles, drivers, deliveries, metrics, auditLogs } = useOperational();

  // Status distribution data
  const statusData = [
    { name: 'Pending', count: metrics.pendingDeliveries, color: '#A3A3A3' },
    { name: 'Active/In-Transit', count: metrics.activeDeliveries, color: '#FFF21A' },
    { name: 'Delivered', count: metrics.completedDeliveries, color: '#10B981' },
    { name: 'Cancelled', count: metrics.cancelledDeliveries, color: '#EF4444' },
  ];

  // Priority distribution data
  const priorityData = [
    {
      priority: 'Urgent',
      count: deliveries.filter((d) => d.priority === 'urgent').length,
      fill: '#EF4444',
    },
    {
      priority: 'High',
      count: deliveries.filter((d) => d.priority === 'high').length,
      fill: '#F59E0B',
    },
    {
      priority: 'Normal',
      count: deliveries.filter((d) => d.priority === 'normal').length,
      fill: '#3B82F6',
    },
    {
      priority: 'Low',
      count: deliveries.filter((d) => d.priority === 'low').length,
      fill: '#71717A',
    },
  ];

  // Vehicle type distribution
  const vehicleTypeCounts: Record<string, number> = {};
  vehicles.forEach((v) => {
    vehicleTypeCounts[v.vehicle_type] = (vehicleTypeCounts[v.vehicle_type] || 0) + 1;
  });
  const vehicleTypeData = Object.entries(vehicleTypeCounts).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count,
  }));

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Delivery ID', 'Pickup', 'Dropoff', 'Priority', 'Capacity (kg)', 'Status', 'Vehicle', 'Driver', 'Scheduled Time'];
    const rows = deliveries.map((d) => [
      d.id,
      `"${d.pickup_location.replace(/"/g, '""')}"`,
      `"${d.dropoff_location.replace(/"/g, '""')}"`,
      d.priority,
      d.required_capacity,
      d.status,
      d.assigned_vehicle_id || 'Unassigned',
      d.assigned_driver_id || 'Unassigned',
      d.scheduled_time,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `routiq_deliveries_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="bg-[#FFFFFF] p-6 rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#A65BFF] font-black">
            DATA & TELEMETRY ENGINE
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-[#111111] mt-1 tracking-tight">
            OPERATIONAL INTELLIGENCE & ANALYTICS
          </h1>
          <p className="text-xs text-[#45421F] mt-1 font-bold">
            Derived strictly from persisted operational records and transactional database state.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-3 bg-[#111111] hover:bg-[#282828] text-white text-xs font-mono font-black uppercase rounded-lg flex items-center gap-2 border-2 border-[#111111] shadow-[3px_3px_0px_#45421F] transition-transform active:translate-x-0.5 active:translate-y-0.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#FFF21A]" />
          <span>Export Deliveries CSV</span>
        </button>
      </div>

      {/* KPI Definition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-[#45421F]">
              FLEET UTILIZATION
            </span>
            <span className="p-2.5 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-black text-[#111111]">
            {metrics.fleetUtilizationPct}%
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#111111]/10 text-[11px] font-mono text-[#45421F] font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#A65BFF] shrink-0" />
            <span>
              Formula: ({metrics.assignedVehicles} Assigned ÷{' '}
              {vehicles.length - metrics.maintenanceVehicles - metrics.inactiveVehicles} Operable Units) × 100
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-[#45421F]">
              FULFILLMENT RATE
            </span>
            <span className="p-2.5 rounded-lg bg-[#176B38] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-black text-[#176B38]">
            {metrics.completionRatePct}%
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#111111]/10 text-[11px] font-mono text-[#45421F] font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#176B38] shrink-0" />
            <span>
              Formula: ({metrics.completedDeliveries} Delivered ÷ {deliveries.length} Total Deliveries) × 100
            </span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111] relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-black uppercase tracking-wider text-[#45421F]">
              ACTIVE DRIVER ALLOCATION
            </span>
            <span className="p-2.5 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-4xl font-display font-black text-[#A65BFF]">
            {drivers.length > 0
              ? Math.round((metrics.assignedDrivers / drivers.length) * 100)
              : 0}
            %
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#111111]/10 text-[11px] font-mono text-[#45421F] font-bold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#A65BFF] shrink-0" />
            <span>
              {metrics.assignedDrivers} on active routes • {metrics.availableDrivers} on standby • {metrics.unavailableDrivers} unavailable
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
          <h3 className="text-sm font-black font-mono uppercase tracking-wider text-[#111111] mb-4">
            DELIVERY LIFECYCLE DISTRIBUTION
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#111111" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    borderColor: '#111111',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t-2 border-[#111111]/10 text-xs font-mono">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-[#111111]" style={{ backgroundColor: item.color }} />
                <span className="text-[#45421F] font-bold">{item.name}:</span>
                <span className="font-black text-[#111111]">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
          <h3 className="text-sm font-black font-mono uppercase tracking-wider text-[#111111] mb-4">
            ORDER PRIORITY SPECTRUM
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="priority" stroke="#111111" fontSize={11} fontFamily="monospace" fontWeight="bold" />
                <YAxis stroke="#111111" fontSize={11} fontFamily="monospace" fontWeight="bold" allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 242, 26, 0.25)' }}
                  contentStyle={{
                    backgroundColor: '#111111',
                    borderColor: '#111111',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} stroke="#111111" strokeWidth={2}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-4 border-t-2 border-[#111111]/10 text-xs font-mono font-bold text-[#45421F]">
            Urgent and High priority orders receive automatic dispatch recommendation weights in Decision Lab.
          </div>
        </div>
      </div>

      {/* Fleet Mix Breakdown */}
      <div className="p-6 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
        <h3 className="text-sm font-black font-mono uppercase tracking-wider text-[#111111] mb-4">
          FLEET COMPOSITION BY ASSET CLASSIFICATION
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {vehicleTypeData.map((vt) => (
            <div key={vt.type} className="p-4 rounded-xl bg-[#FFF21A]/20 border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
              <span className="text-[10px] font-mono text-[#45421F] font-black block truncate">{vt.type}</span>
              <span className="text-2xl font-black font-mono text-[#111111] mt-1 block">
                {vt.count}
              </span>
              <span className="text-[10px] font-mono text-[#45421F] font-bold">
                {Math.round((vt.count / vehicles.length) * 100)}% of total fleet
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

