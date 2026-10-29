import React, { useState, useEffect, useMemo } from 'react';
import { useOperational } from '../../context/OperationalContext';
import { globalDecisionLabService } from '../../services/decisionLabService';
import {
  CombinationEvaluation,
  ConflictItem,
  Delivery,
  RouteTelemetry,
} from '../../types';
import { vehicleTypeLabel, formatWeight, formatRelativeTime } from '../../lib/utils';
import { fetchRoadRoute } from '../../lib/osrm';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Truck,
  User,
  Activity,
  Layers,
  ArrowRight,
  Clock,
  Navigation,
  Sliders,
  ChevronDown,
  ChevronRight,
  Check,
  Info,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

interface DecisionLabViewProps {
  initialDeliveryId?: string;
}

export const DecisionLabView: React.FC<DecisionLabViewProps> = ({ initialDeliveryId }) => {
  const { deliveries, vehicles, drivers, assignments, assignDelivery } = useOperational();

  // Selected delivery
  const pendingDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === 'pending'),
    [deliveries]
  );

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(() => {
    if (initialDeliveryId && deliveries.some((d) => d.id === initialDeliveryId)) {
      return initialDeliveryId;
    }
    return pendingDeliveries[0]?.id || deliveries[0]?.id || '';
  });

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'whatif' | 'radar' | 'ranking'>(
    'matrix'
  );
  const [filterMode, setFilterMode] = useState<'all' | 'eligible' | 'ineligible'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);

  // What-If comparison selections (up to 3 candidate pairs)
  const [whatIfPairs, setWhatIfPairs] = useState<{ vehicleId: string; driverId: string }[]>([]);

  // Route telemetry cache
  const [routeCache, setRouteCache] = useState<Record<string, RouteTelemetry>>({});
  const [evaluatedAt, setEvaluatedAt] = useState<string>(new Date().toISOString());
  const [isStale, setIsStale] = useState<boolean>(false);
  const [commitConfirmPair, setCommitConfirmPair] = useState<CombinationEvaluation | null>(null);
  const [commitResult, setCommitResult] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const selectedDelivery = useMemo(
    () => deliveries.find((d) => d.id === selectedDeliveryId) || null,
    [deliveries, selectedDeliveryId]
  );

  // Whenever deliveries or assignments mutate, flag data freshness
  useEffect(() => {
    setIsStale(true);
  }, [deliveries, vehicles, drivers, assignments]);

  // Evaluate combinations
  const evaluationResult = useMemo(() => {
    if (!selectedDeliveryId) return null;
    return globalDecisionLabService.evaluateAllCombinations(selectedDeliveryId, routeCache);
  }, [selectedDeliveryId, routeCache, evaluatedAt, vehicles, drivers, deliveries]);

  // Conflict Radar data
  const conflictRadar = useMemo(() => {
    return globalDecisionLabService.calculateConflictRadar();
  }, [vehicles, drivers, deliveries, assignments]);

  // Re-evaluate on manual click
  const handleRefresh = () => {
    setEvaluatedAt(new Date().toISOString());
    setIsStale(false);
  };

  // Pre-load top recommendation into What-If if empty
  useEffect(() => {
    if (evaluationResult?.topRecommendation && whatIfPairs.length === 0) {
      setWhatIfPairs([
        {
          vehicleId: evaluationResult.topRecommendation.vehicle.id,
          driverId: evaluationResult.topRecommendation.driver.id,
        },
      ]);
    }
  }, [evaluationResult?.topRecommendation]);

  // Optional: load OSRM road telemetry for selected delivery
  useEffect(() => {
    if (!selectedDelivery || !selectedDelivery.pickup_lat || !selectedDelivery.dropoff_lat) return;

    const cacheKey = `${selectedDelivery.id}:default`;
    if (!routeCache[cacheKey]) {
      fetchRoadRoute(
        selectedDelivery.pickup_lat,
        selectedDelivery.pickup_lng || -122.4194,
        selectedDelivery.dropoff_lat,
        selectedDelivery.dropoff_lng || -122.4014
      ).then((res) => {
        setRouteCache((prev) => ({
          ...prev,
          [cacheKey]: {
            distanceKm: res.distanceKm,
            durationMinutes: res.durationMinutes,
            source: res.source,
            isEstimate: res.isEstimate,
            status: 'loaded',
          },
        }));
      });
    }
  }, [selectedDelivery]);

  // Filter evaluations
  const displayedEvaluations = useMemo(() => {
    if (!evaluationResult) return [];
    return evaluationResult.evaluations.filter((ev) => {
      const matchesFilter =
        filterMode === 'all' ||
        (filterMode === 'eligible' && ev.is_eligible) ||
        (filterMode === 'ineligible' && !ev.is_eligible);

      const matchesSearch =
        ev.vehicle.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.driver.id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [evaluationResult, filterMode, searchTerm]);

  // What-If simulation candidates
  const whatIfSimulation = useMemo(() => {
    if (!selectedDeliveryId || whatIfPairs.length === 0) return null;
    return globalDecisionLabService.simulateWhatIf(selectedDeliveryId, whatIfPairs);
  }, [selectedDeliveryId, whatIfPairs, vehicles, drivers, deliveries]);

  // Commit actual assignment from Decision Lab
  const handleExecuteCommit = (candidate: CombinationEvaluation) => {
    const res = assignDelivery(candidate.delivery_id, candidate.vehicle.id, candidate.driver.id);
    setCommitResult({
      success: res.success,
      message: res.message,
    });
    setCommitConfirmPair(null);
    setIsStale(false);
  };

  const toggleWhatIfCandidate = (vehicleId: string, driverId: string) => {
    setWhatIfPairs((prev) => {
      const exists = prev.some((p) => p.vehicleId === vehicleId && p.driverId === driverId);
      if (exists) {
        return prev.filter((p) => !(p.vehicleId === vehicleId && p.driverId === driverId));
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), { vehicleId, driverId }];
      }
      return [...prev, { vehicleId, driverId }];
    });
  };

  return (
    <div className="space-y-6">
      {/* Signature Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#383838]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#A65BFF] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#A65BFF]/20">
              Signature Workstation
            </span>
            <span className="text-xs font-mono text-[#A3A3A3]">
              Deterministic Optimization & Audit Traceability
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[#FFFFFF] mt-1 tracking-tight">
            ROUTIQ DECISION LAB
          </h1>
          <p className="text-xs font-mono text-[#A3A3A3] mt-1">
            Explain every dispatch decision. Compare allocations in simulation before committing.
          </p>
        </div>

        {/* Freshness & Refresh Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right font-mono text-xs hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className={`w-2 h-2 rounded-full ${
                  isStale ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className={isStale ? 'text-amber-400 font-bold' : 'text-[#A3A3A3]'}>
                {isStale ? 'State Updated — Re-evaluate' : 'Fresh Evaluation'}
              </span>
            </div>
            <span className="text-[10px] text-[#A3A3A3]">
              Evaluated {formatRelativeTime(evaluatedAt)}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isStale
                ? 'bg-[#FFF21A] text-[#171717] border-[#FFF21A] hover:bg-[#fff447]'
                : 'bg-[#202020] text-[#FFFFFF] border-[#383838] hover:bg-[#282828]'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isStale ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Target Delivery Selector & Operational Context Panel */}
      <div className="bg-[#202020] border border-[#383838] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#383838]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FFF21A]/10 text-[#FFF21A] border border-[#FFF21A]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A3A3A3]">
                Target Shipment
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => {
                    setSelectedDeliveryId(e.target.value);
                    setWhatIfPairs([]);
                  }}
                  className="bg-[#171717] border border-[#383838] rounded px-3 py-1.5 text-xs font-mono font-bold text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                >
                  {deliveries.map((del) => (
                    <option key={del.id} value={del.id}>
                      {del.id} [{del.priority.toUpperCase()}] — {del.pickup_location.slice(0, 24)}... ({del.status})
                    </option>
                  ))}
                </select>
                {selectedDelivery && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      selectedDelivery.status === 'pending'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : selectedDelivery.status === 'in_transit'
                        ? 'bg-[#A65BFF]/20 text-[#A65BFF] border border-[#A65BFF]/30'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {selectedDelivery.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedDelivery && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">REQUIRED PAYLOAD</span>
                <span className="font-bold text-[#FFFFFF]">
                  {formatWeight(selectedDelivery.required_capacity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">CLASSIFICATION</span>
                <span className="font-bold text-[#FFF21A]">
                  {selectedDelivery.required_vehicle_type
                    ? vehicleTypeLabel(selectedDelivery.required_vehicle_type)
                    : 'Any Class'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">PRIORITY</span>
                <span
                  className={`font-bold uppercase ${
                    selectedDelivery.priority === 'urgent'
                      ? 'text-red-400'
                      : selectedDelivery.priority === 'high'
                      ? 'text-yellow-400'
                      : 'text-blue-400'
                  }`}
                >
                  {selectedDelivery.priority}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">TIMING WINDOW</span>
                <span className="font-bold text-[#FFFFFF]">
                  {formatRelativeTime(selectedDelivery.scheduled_time)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Route Locations */}
        {selectedDelivery && (
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 text-[#A3A3A3]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#FFF21A] shrink-0" />
              <span className="text-[#FFFFFF] truncate">{selectedDelivery.pickup_location}</span>
              <span className="text-[#A65BFF]">→</span>
              <span className="w-2 h-2 rounded-full bg-[#A65BFF] shrink-0" />
              <span className="text-[#FFFFFF] truncate">{selectedDelivery.dropoff_location}</span>
            </div>
            {routeCache[`${selectedDelivery.id}:default`] && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#171717] text-[#FFF21A] border border-[#383838] shrink-0">
                Road Route: {routeCache[`${selectedDelivery.id}:default`].distanceKm} km (
                {routeCache[`${selectedDelivery.id}:default`].durationMinutes} min ETA)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Feedback Banner */}
      {commitResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            commitResult.success
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              : 'bg-red-950/40 border-red-800 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono">
            {commitResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            )}
            <span>{commitResult.message}</span>
          </div>
          <button
            onClick={() => setCommitResult(null)}
            className="text-xs font-mono uppercase text-[#A3A3A3] hover:text-[#FFFFFF]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workstation Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#383838] pb-1">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2 rounded-t-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'matrix'
              ? 'bg-[#202020] text-[#FFF21A] border-t-2 border-[#FFF21A]'
              : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Eligibility Matrix ({displayedEvaluations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whatif')}
          className={`px-4 py-2 rounded-t-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'whatif'
              ? 'bg-[#202020] text-[#A65BFF] border-t-2 border-[#A65BFF]'
              : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>What-If Simulator ({whatIfPairs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('radar')}
          className={`px-4 py-2 rounded-t-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'radar'
              ? 'bg-[#202020] text-[#FFF21A] border-t-2 border-[#FFF21A]'
              : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Conflict Radar ({conflictRadar.totalConflicts})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ranking')}
          className={`px-4 py-2 rounded-t-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'ranking'
              ? 'bg-[#202020] text-[#A65BFF] border-t-2 border-[#A65BFF]'
              : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable Ranking</span>
        </button>
      </div>

      {/* SUB-VIEW 1: ELIGIBILITY MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#202020] p-4 rounded-xl border border-[#383838]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by vehicle, driver, plate..."
                className="w-full bg-[#171717] border border-[#383838] rounded-lg pl-9 pr-4 py-2 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A] font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono text-[#A3A3A3]">Filter:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold ${
                  filterMode === 'all'
                    ? 'bg-[#171717] text-[#FFFFFF] border border-[#383838]'
                    : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                }`}
              >
                All Pairs
              </button>
              <button
                onClick={() => setFilterMode('eligible')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold ${
                  filterMode === 'eligible'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                }`}
              >
                Eligible Only ({evaluationResult?.eligibleEvaluations.length || 0})
              </button>
              <button
                onClick={() => setFilterMode('ineligible')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold ${
                  filterMode === 'ineligible'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : 'text-[#A3A3A3] hover:text-[#FFFFFF]'
                }`}
              >
                Ineligible ({evaluationResult?.ineligibleEvaluations.length || 0})
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-[#202020] border border-[#383838] rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#171717] text-[#A3A3A3] uppercase text-[10px] tracking-wider border-b border-[#383838]">
                  <tr>
                    <th className="py-3 px-4">Vehicle Candidate</th>
                    <th className="py-3 px-4">Driver Candidate</th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Primary Determinant / Blocker</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383838]">
                  {displayedEvaluations.length > 0 ? (
                    displayedEvaluations.map((ev) => {
                      const rowKey = `${ev.vehicle.id}:${ev.driver.id}`;
                      const isExpanded = expandedRowKey === rowKey;
                      const isInWhatIf = whatIfPairs.some(
                        (p) => p.vehicleId === ev.vehicle.id && p.driverId === ev.driver.id
                      );

                      return (
                        <React.Fragment key={rowKey}>
                          <tr className="hover:bg-[#252525] transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#FFFFFF]">
                                {ev.vehicle.id} • {ev.vehicle.registration_number}
                              </div>
                              <div className="text-[10px] text-[#A3A3A3]">
                                {vehicleTypeLabel(ev.vehicle.vehicle_type)} (
                                {formatWeight(ev.vehicle.capacity)}) [{ev.vehicle.status}]
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-[#FFFFFF]">{ev.driver.name}</div>
                              <div className="text-[10px] text-[#A3A3A3]">
                                {ev.driver.id} • [{ev.driver.availability_status}]
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {ev.is_eligible ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Eligible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                                  <XCircle className="w-3 h-3" /> Ineligible
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {ev.is_eligible ? (
                                <span className="font-bold text-[#FFF21A] text-sm">
                                  {ev.score_breakdown.total}/100
                                </span>
                              ) : (
                                <span className="text-[#71717A] text-xs">0 (Disqualified)</span>
                              )}
                            </td>

                            <td className="py-3 px-4 max-w-sm">
                              {ev.is_eligible ? (
                                <span className="text-emerald-300">
                                  {ev.satisfied_criteria[0] || 'Meets all criteria'}
                                </span>
                              ) : (
                                <span className="text-red-300 line-clamp-1">
                                  {ev.blocking_reasons[0]}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setExpandedRowKey(isExpanded ? null : rowKey)
                                }
                                className="px-2 py-1 rounded bg-[#171717] hover:bg-[#383838] border border-[#383838] text-[10px] text-[#A3A3A3] hover:text-[#FFFFFF]"
                              >
                                {isExpanded ? 'Hide Details' : 'Explain'}
                              </button>

                              <button
                                onClick={() =>
                                  toggleWhatIfCandidate(ev.vehicle.id, ev.driver.id)
                                }
                                className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                                  isInWhatIf
                                    ? 'bg-[#A65BFF] text-white border-[#A65BFF]'
                                    : 'bg-[#171717] text-[#A65BFF] border-[#383838] hover:border-[#A65BFF]'
                                }`}
                              >
                                {isInWhatIf ? 'In What-If' : '+ What-If'}
                              </button>

                              {ev.is_eligible && (
                                <button
                                  onClick={() => setCommitConfirmPair(ev)}
                                  className="px-2.5 py-1 rounded bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-bold text-[10px] uppercase"
                                >
                                  Assign
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Explanation Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#1a1a1a]">
                              <td colSpan={6} className="p-4 border-b border-[#383838]">
                                <div className="space-y-3 max-w-4xl">
                                  {/* Blocking reasons */}
                                  {ev.blocking_reasons.length > 0 && (
                                    <div className="p-3 rounded bg-red-950/30 border border-red-900/50 space-y-1">
                                      <div className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>Blocking Constraints ({ev.blocking_reasons.length}):</span>
                                      </div>
                                      {ev.blocking_reasons.map((reason, i) => (
                                        <div key={i} className="text-[11px] text-red-200 pl-5">
                                          • {reason}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Satisfied criteria */}
                                  {ev.satisfied_criteria.length > 0 && (
                                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                                      <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Verified Criteria ({ev.satisfied_criteria.length}):</span>
                                      </div>
                                      {ev.satisfied_criteria.map((crit, i) => (
                                        <div key={i} className="text-[11px] text-emerald-200 pl-5">
                                          ✓ {crit}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Score breakdown if eligible */}
                                  {ev.is_eligible && (
                                    <div className="p-3 rounded bg-[#202020] border border-[#383838] flex items-center justify-between text-xs font-mono">
                                      <div>
                                        <span className="text-[#A3A3A3] block text-[10px]">SCORE FORMULA</span>
                                        <span>
                                          Base: {ev.score_breakdown.base} + Capacity Fit: {ev.score_breakdown.capacity_fit} + Type: {ev.score_breakdown.type_match} + Priority: {ev.score_breakdown.priority_boost} + Eco: {ev.score_breakdown.green_bonus}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[#A3A3A3] block text-[10px]">TOTAL SCORE</span>
                                        <span className="font-bold text-[#FFF21A] text-base">
                                          {ev.score_breakdown.total}/100
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#A3A3A3]">
                        No candidate combinations match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: WHAT-IF SIMULATOR */}
      {activeSubTab === 'whatif' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#202020] border border-[#383838] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#A65BFF]/10 text-[#A65BFF]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#FFFFFF]">
                  What-If Comparative Allocation Simulator
                </h3>
                <p className="text-xs font-mono text-[#A3A3A3]">
                  Evaluate trade-offs across candidate pairs in non-mutating preview.
                </p>
              </div>
            </div>
            <div className="px-3 py-1 rounded bg-[#171717] border border-[#383838] text-[10px] font-mono text-[#A65BFF] font-bold">
              SIMULATION MODE — Zero Mutations
            </div>
          </div>

          {whatIfPairs.length === 0 ? (
            <div className="p-12 text-center bg-[#202020] rounded-xl border border-[#383838] text-xs font-mono text-[#A3A3A3] space-y-3">
              <Sliders className="w-8 h-8 text-[#A65BFF] mx-auto opacity-50" />
              <p>No candidates added to What-If comparison yet.</p>
              <button
                onClick={() => setActiveSubTab('matrix')}
                className="px-4 py-2 bg-[#A65BFF] text-white font-bold rounded"
              >
                Go to Eligibility Matrix & Add Candidates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatIfSimulation?.comparisonCandidates.map((candidate, idx) => (
                <div
                  key={`${candidate.vehicle.id}:${candidate.driver.id}`}
                  className={`bg-[#202020] border rounded-xl p-5 flex flex-col justify-between shadow-xl relative ${
                    candidate.is_eligible
                      ? 'border-[#383838] hover:border-[#A65BFF]'
                      : 'border-red-900/50 opacity-80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
                      <span className="text-[10px] font-mono uppercase text-[#A3A3A3] font-bold">
                        Option #{idx + 1}
                      </span>
                      {candidate.is_eligible ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                          Eligible • Score {candidate.score_breakdown.total}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-mono font-bold">
                          Ineligible
                        </span>
                      )}
                    </div>

                    {/* Asset details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#FFF21A]" />
                        <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                          {candidate.vehicle.id} ({candidate.vehicle.registration_number})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#A3A3A3] pl-6">
                        {vehicleTypeLabel(candidate.vehicle.vehicle_type)} • Payload {formatWeight(candidate.vehicle.capacity)}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <User className="w-4 h-4 text-[#A65BFF]" />
                        <span className="font-mono text-xs font-bold text-[#FFFFFF]">
                          {candidate.driver.name} ({candidate.driver.id})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#A3A3A3] pl-6">
                        Status: {candidate.driver.availability_status}
                      </div>
                    </div>

                    {/* Trade-off metrics */}
                    <div className="p-3 bg-[#171717] rounded-lg border border-[#383838] space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#A3A3A3]">Payload Fit:</span>
                        <span className="font-bold text-[#FFFFFF]">{candidate.capacityFitPct}% utilized</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#A3A3A3]">Class Match:</span>
                        <span className="text-[#FFF21A]">
                          {selectedDelivery?.required_vehicle_type === candidate.vehicle.vehicle_type
                            ? 'Exact Match'
                            : 'Compatible'}
                        </span>
                      </div>
                      {candidate.score_breakdown.total > 0 && (
                        <div className="flex justify-between border-t border-[#383838] pt-1">
                          <span className="text-[#A3A3A3]">Composite Score:</span>
                          <span className="font-bold text-[#A65BFF]">
                            {candidate.score_breakdown.total}/100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Blocking reasons if any */}
                    {!candidate.is_eligible && (
                      <div className="text-[11px] font-mono text-red-400 p-2.5 rounded bg-red-950/20 border border-red-900/40">
                        {candidate.blocking_reasons[0]}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-[#383838] flex items-center justify-between">
                    <button
                      onClick={() =>
                        toggleWhatIfCandidate(candidate.vehicle.id, candidate.driver.id)
                      }
                      className="text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF]"
                    >
                      Remove
                    </button>
                    {candidate.is_eligible && (
                      <button
                        onClick={() => setCommitConfirmPair(candidate)}
                        className="px-3 py-1.5 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-mono text-xs font-bold uppercase rounded"
                      >
                        Commit Option
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 3: CONFLICT RADAR */}
      {activeSubTab === 'radar' && (
        <div className="space-y-6">
          {/* Radar Header KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#202020] border border-[#383838]">
              <span className="text-[10px] font-mono uppercase text-[#A3A3A3] block">
                Total Operational Constraints
              </span>
              <span className="text-3xl font-display font-bold text-[#FFF21A] mt-1 block">
                {conflictRadar.totalConflicts}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#202020] border border-[#383838]">
              <span className="text-[10px] font-mono uppercase text-[#A3A3A3] block">
                Occupied Vehicles
              </span>
              <span className="text-3xl font-display font-bold text-[#FFFFFF] mt-1 block">
                {conflictRadar.occupiedVehicles.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#202020] border border-[#383838]">
              <span className="text-[10px] font-mono uppercase text-[#A3A3A3] block">
                Occupied Drivers
              </span>
              <span className="text-3xl font-display font-bold text-[#FFFFFF] mt-1 block">
                {conflictRadar.occupiedDrivers.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#202020] border border-[#383838]">
              <span className="text-[10px] font-mono uppercase text-[#A3A3A3] block">
                Blocked Orders
              </span>
              <span className="text-3xl font-display font-bold text-red-400 mt-1 block">
                {conflictRadar.blockedDeliveries.length}
              </span>
            </div>
          </div>

          {/* Active Conflict Stream */}
          <div className="bg-[#202020] border border-[#383838] rounded-xl p-5 shadow-2xl space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#FFFFFF] font-bold">
              Constraint & Conflict Registry
            </h3>

            <div className="space-y-3">
              {conflictRadar.conflictItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border text-xs font-mono space-y-2 ${
                    item.severity === 'high'
                      ? 'bg-red-950/20 border-red-900/40 text-red-200'
                      : item.severity === 'medium'
                      ? 'bg-yellow-950/20 border-yellow-900/40 text-yellow-200'
                      : 'bg-[#171717] border-[#383838] text-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#FFF21A]" />
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#171717] border border-[#383838]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[#A3A3A3] pl-6">{item.description}</p>

                  <div className="pl-6 pt-1 text-[11px] text-[#FFF21A] flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Actionable step: {item.actionableStep}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: EXPLAINABLE RANKING */}
      {activeSubTab === 'ranking' && (
        <div className="space-y-6">
          {evaluationResult?.topRecommendation ? (
            <div className="p-6 rounded-xl bg-[#202020] border-2 border-[#A65BFF] space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A65BFF]" />
                  <h3 className="font-display font-bold text-lg text-[#FFFFFF]">
                    Top Ranked Recommendation
                  </h3>
                </div>
                <div className="px-3 py-1 rounded bg-[#A65BFF]/20 text-[#A65BFF] font-mono text-xs font-bold border border-[#A65BFF]/40">
                  Optimal Match Score: {evaluationResult.topRecommendation.score_breakdown.total}/100
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#171717] rounded-lg border border-[#383838] space-y-1">
                  <span className="text-[10px] font-mono text-[#A3A3A3]">RECOMMENDED ASSET</span>
                  <div className="font-bold text-sm text-[#FFFFFF]">
                    {evaluationResult.topRecommendation.vehicle.id} •{' '}
                    {evaluationResult.topRecommendation.vehicle.registration_number}
                  </div>
                  <div className="text-xs text-[#FFF21A]">
                    {vehicleTypeLabel(evaluationResult.topRecommendation.vehicle.vehicle_type)} (
                    {formatWeight(evaluationResult.topRecommendation.vehicle.capacity)})
                  </div>
                </div>

                <div className="p-4 bg-[#171717] rounded-lg border border-[#383838] space-y-1">
                  <span className="text-[10px] font-mono text-[#A3A3A3]">RECOMMENDED DRIVER</span>
                  <div className="font-bold text-sm text-[#FFFFFF]">
                    {evaluationResult.topRecommendation.driver.name} (
                    {evaluationResult.topRecommendation.driver.id})
                  </div>
                  <div className="text-xs text-[#A65BFF]">Confirmed Available on Duty</div>
                </div>
              </div>

              {/* Step by step why chosen */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] font-bold">
                  Why this pair was chosen:
                </h4>
                <div className="space-y-1.5">
                  {evaluationResult.whyChosenExplanation.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-mono text-emerald-300">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tie explanation if any */}
              {evaluationResult.tieExplanation && (
                <div className="p-3 rounded bg-blue-950/30 border border-blue-900/50 text-blue-200 text-xs font-mono">
                  <Info className="w-4 h-4 inline mr-2 text-blue-400" />
                  <span>{evaluationResult.tieExplanation}</span>
                </div>
              )}

              {/* Why not the others */}
              <div className="space-y-2 pt-4 border-t border-[#383838]">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] font-bold">
                  Why not the alternatives?
                </h4>
                <div className="space-y-1.5">
                  {evaluationResult.whyNotOthersExplanations.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[#171717] border border-[#383838] flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-[#FFFFFF]">
                        {item.vehicle_id} + {item.driver_id}:
                      </span>
                      <span className="text-[#A3A3A3]">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCommitConfirmPair(evaluationResult.topRecommendation)}
                  className="px-6 py-3 bg-[#A65BFF] hover:bg-[#A65BFF]/90 text-white font-mono text-xs font-bold uppercase rounded shadow-lg shadow-[#A65BFF]/20 flex items-center gap-2"
                >
                  <span>Commit Top Recommendation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#202020] rounded-xl border border-[#383838] text-xs font-mono text-[#A3A3A3]">
              No recommendations feasible for {selectedDelivery?.id}.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {commitConfirmPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#171717] border border-[#383838] w-full max-w-md rounded-xl p-6 shadow-2xl relative space-y-4">
            <h3 className="text-lg font-bold font-display text-[#FFFFFF]">
              Confirm Authoritative Dispatch Allocation
            </h3>
            <p className="text-xs font-mono text-[#A3A3A3]">
              This will atomically commit row locks on PostgreSQL, assign vehicle{' '}
              <strong className="text-[#FFF21A]">{commitConfirmPair.vehicle.id}</strong> and driver{' '}
              <strong className="text-[#A65BFF]">{commitConfirmPair.driver.name}</strong> to{' '}
              <strong className="text-[#FFFFFF]">{commitConfirmPair.delivery_id}</strong>, and record an audit log.
            </p>

            <div className="p-3 bg-[#202020] rounded border border-[#383838] text-xs font-mono space-y-1">
              <div>Delivery: {commitConfirmPair.delivery_id}</div>
              <div>Vehicle: {commitConfirmPair.vehicle.registration_number}</div>
              <div>Driver: {commitConfirmPair.driver.name}</div>
              <div>Match Score: {commitConfirmPair.score_breakdown.total}/100</div>
            </div>

            <div className="pt-3 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setCommitConfirmPair(null)}
                className="px-4 py-2 bg-[#202020] text-[#A3A3A3] hover:text-[#FFFFFF] rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteCommit(commitConfirmPair)}
                className="px-5 py-2 bg-[#FFF21A] text-[#171717] font-bold uppercase rounded hover:bg-[#fff447]"
              >
                Confirm & Commit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
