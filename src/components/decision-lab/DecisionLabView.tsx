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
    <div className="space-y-6 w-full">
      {/* Signature Header */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] p-6 rounded-xl shadow-[4px_4px_0px_#111111] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-[#A65BFF] text-white font-mono text-xs font-black uppercase tracking-wider border border-[#111111] shadow-[2px_2px_0px_#111111]">
              Signature Workstation
            </span>
            <span className="text-xs font-mono font-bold text-[#45421F]">
              Deterministic Optimization & Audit Traceability
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-[#111111] tracking-tight">
            ROUTIQ DECISION LAB
          </h1>
          <p className="text-xs font-mono text-[#45421F] mt-1 max-w-2xl">
            Explain every dispatch decision. Compare allocations in simulation before committing.
          </p>
        </div>

        {/* Freshness & Refresh Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="text-right font-mono text-xs hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStale ? 'bg-[#8A4B00] animate-ping' : 'bg-[#176B38]'
                }`}
              />
              <span className={isStale ? 'text-[#8A4B00] font-black' : 'text-[#45421F] font-bold'}>
                {isStale ? 'State Updated — Re-evaluate' : 'Fresh Evaluation'}
              </span>
            </div>
            <span className="text-[10px] text-[#45421F]">
              Evaluated {formatRelativeTime(evaluatedAt)}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            className={`px-3.5 py-2.5 rounded-lg font-mono text-xs font-black flex items-center gap-2 border-2 border-[#111111] transition-all shadow-[3px_3px_0px_#111111] ${
              isStale
                ? 'bg-[#A65BFF] text-white hover:bg-[#9247E6]'
                : 'bg-[#FFF21A] text-[#111111] hover:bg-[#fff447]'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isStale ? 'animate-spin' : ''}`} />
            <span>Re-evaluate</span>
          </button>
        </div>
      </div>

      {/* Target Delivery Selector & Operational Context Panel */}
      <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl p-5 shadow-[4px_4px_0px_#111111]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-[#111111]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#FFF21A] text-[#111111] border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-black text-[#45421F]">
                Target Shipment
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <select
                  value={selectedDeliveryId}
                  onChange={(e) => {
                    setSelectedDeliveryId(e.target.value);
                    setWhatIfPairs([]);
                  }}
                  className="bg-[#FFFFFF] border-2 border-[#111111] rounded-lg px-3 py-1.5 text-xs font-mono font-black text-[#111111] focus:outline-none focus:bg-[#FFF21A] cursor-pointer shadow-[2px_2px_0px_#111111]"
                >
                  {deliveries.map((del) => (
                    <option key={del.id} value={del.id}>
                      {del.id} [{del.priority.toUpperCase()}] — {del.pickup_location.slice(0, 24)}... ({del.status})
                    </option>
                  ))}
                </select>
                {selectedDelivery && (
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded font-black uppercase border border-[#111111] ${
                      selectedDelivery.status === 'pending'
                        ? 'bg-[#FFF21A] text-[#111111]'
                        : selectedDelivery.status === 'in_transit'
                        ? 'bg-[#A65BFF] text-white'
                        : 'bg-[#EEEEEE] text-[#111111]'
                    }`}
                  >
                    {selectedDelivery.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {selectedDelivery && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-[#FFF21A]/20 p-3 rounded-lg border border-[#111111]/20">
              <div>
                <span className="text-[10px] text-[#45421F] block font-bold">REQUIRED PAYLOAD</span>
                <span className="font-black text-[#111111]">
                  {formatWeight(selectedDelivery.required_capacity)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#45421F] block font-bold">CLASSIFICATION</span>
                <span className="font-black text-[#A65BFF]">
                  {selectedDelivery.required_vehicle_type
                    ? vehicleTypeLabel(selectedDelivery.required_vehicle_type)
                    : 'Any Class'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#45421F] block font-bold">PRIORITY</span>
                <span
                  className={`font-black uppercase ${
                    selectedDelivery.priority === 'urgent'
                      ? 'text-[#B42318]'
                      : selectedDelivery.priority === 'high'
                      ? 'text-[#8A4B00]'
                      : 'text-[#111111]'
                  }`}
                >
                  {selectedDelivery.priority}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#45421F] block font-bold">TIMING WINDOW</span>
                <span className="font-black text-[#111111]">
                  {formatRelativeTime(selectedDelivery.scheduled_time)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Route Locations */}
        {selectedDelivery && (
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 text-[#45421F]">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111111] shrink-0" />
              <span className="text-[#111111] font-bold truncate">{selectedDelivery.pickup_location}</span>
              <span className="text-[#A65BFF] font-black">→</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#A65BFF] shrink-0" />
              <span className="text-[#111111] font-bold truncate">{selectedDelivery.dropoff_location}</span>
            </div>
            {routeCache[`${selectedDelivery.id}:default`] && (
              <span className="text-[11px] px-2.5 py-1 rounded bg-[#111111] text-[#FFF21A] font-bold shrink-0">
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
          className={`p-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-between ${
            commitResult.success
              ? 'bg-[#FFFFFF] text-[#176B38]'
              : 'bg-[#FFFFFF] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
            {commitResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-[#176B38]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-[#B42318]" />
            )}
            <span className="text-[#111111]">{commitResult.message}</span>
          </div>
          <button
            onClick={() => setCommitResult(null)}
            className="text-xs font-mono uppercase font-bold text-[#111111] hover:bg-[#FFF21A] px-2.5 py-1 rounded border border-[#111111]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workstation Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#111111] pb-2">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 border-2 border-[#111111] ${
            activeSubTab === 'matrix'
              ? 'bg-[#111111] text-[#FFF21A] shadow-[3px_3px_0px_#A65BFF]'
              : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFF21A]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Eligibility Matrix ({displayedEvaluations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('whatif')}
          className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 border-2 border-[#111111] ${
            activeSubTab === 'whatif'
              ? 'bg-[#111111] text-[#A65BFF] shadow-[3px_3px_0px_#FFF21A]'
              : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFF21A]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Simulator ({whatIfPairs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('radar')}
          className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 border-2 border-[#111111] ${
            activeSubTab === 'radar'
              ? 'bg-[#111111] text-[#FFF21A] shadow-[3px_3px_0px_#A65BFF]'
              : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFF21A]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Conflict Radar ({conflictRadar.totalConflicts})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ranking')}
          className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 border-2 border-[#111111] ${
            activeSubTab === 'ranking'
              ? 'bg-[#111111] text-[#A65BFF] shadow-[3px_3px_0px_#FFF21A]'
              : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFF21A]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Explainable Ranking</span>
        </button>
      </div>

      {/* SUB-VIEW 1: ELIGIBILITY MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#FFFFFF] p-4 rounded-xl border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#45421F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by vehicle, driver, plate..."
                className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg pl-9 pr-4 py-2 text-xs text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] font-mono shadow-[2px_2px_0px_#111111]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-[#45421F]">Filter:</span>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black border-2 border-[#111111] transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#111111] text-[#FFF21A] shadow-[2px_2px_0px_#A65BFF]'
                    : 'bg-[#FFFFFF] text-[#111111] hover:bg-[#FFF21A]'
                }`}
              >
                All Pairs
              </button>
              <button
                onClick={() => setFilterMode('eligible')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black border-2 border-[#111111] transition-all ${
                  filterMode === 'eligible'
                    ? 'bg-[#176B38] text-white shadow-[2px_2px_0px_#111111]'
                    : 'bg-[#FFFFFF] text-[#176B38] hover:bg-[#176B38]/10'
                }`}
              >
                Eligible Only ({evaluationResult?.eligibleEvaluations.length || 0})
              </button>
              <button
                onClick={() => setFilterMode('ineligible')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black border-2 border-[#111111] transition-all ${
                  filterMode === 'ineligible'
                    ? 'bg-[#B42318] text-white shadow-[2px_2px_0px_#111111]'
                    : 'bg-[#FFFFFF] text-[#B42318] hover:bg-[#B42318]/10'
                }`}
              >
                Ineligible ({evaluationResult?.ineligibleEvaluations.length || 0})
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl overflow-hidden shadow-[4px_4px_0px_#111111]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#111111] text-[#FFFFFF] uppercase text-[10px] tracking-wider border-b-2 border-[#111111]">
                  <tr>
                    <th className="py-3 px-4">Vehicle Candidate</th>
                    <th className="py-3 px-4">Driver Candidate</th>
                    <th className="py-3 px-4">Eligibility</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Primary Determinant / Blocker</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#111111]/15">
                  {displayedEvaluations.length > 0 ? (
                    displayedEvaluations.map((ev) => {
                      const rowKey = `${ev.vehicle.id}:${ev.driver.id}`;
                      const isExpanded = expandedRowKey === rowKey;
                      const isInWhatIf = whatIfPairs.some(
                        (p) => p.vehicleId === ev.vehicle.id && p.driverId === ev.driver.id
                      );

                      return (
                        <React.Fragment key={rowKey}>
                          <tr className="hover:bg-[#FFF21A]/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-black text-[#111111]">
                                {ev.vehicle.id} • {ev.vehicle.registration_number}
                              </div>
                              <div className="text-[10px] text-[#45421F] font-bold">
                                {vehicleTypeLabel(ev.vehicle.vehicle_type)} (
                                {formatWeight(ev.vehicle.capacity)}) [{ev.vehicle.status}]
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-black text-[#111111]">{ev.driver.name}</div>
                              <div className="text-[10px] text-[#45421F] font-bold">
                                {ev.driver.id} • [{ev.driver.availability_status}]
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {ev.is_eligible ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black bg-[#176B38] text-white border border-[#111111]">
                                  <CheckCircle2 className="w-3 h-3" /> Eligible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black bg-[#B42318] text-white border border-[#111111]">
                                  <XCircle className="w-3 h-3" /> Ineligible
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {ev.is_eligible ? (
                                <span className="font-black text-[#111111] text-sm">
                                  {ev.score_breakdown.total}/100
                                </span>
                              ) : (
                                <span className="text-[#888888] text-xs font-bold">0 (Disqualified)</span>
                              )}
                            </td>

                            <td className="py-3 px-4 max-w-sm">
                              {ev.is_eligible ? (
                                <span className="text-[#176B38] font-bold">
                                  {ev.satisfied_criteria[0] || 'Meets all criteria'}
                                </span>
                              ) : (
                                <span className="text-[#B42318] font-bold line-clamp-1">
                                  {ev.blocking_reasons[0]}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() =>
                                  setExpandedRowKey(isExpanded ? null : rowKey)
                                }
                                className="px-2.5 py-1 rounded bg-[#FFFFFF] hover:bg-[#FFF21A] border border-[#111111] text-[10px] font-bold text-[#111111] shadow-[1px_1px_0px_#111111]"
                              >
                                {isExpanded ? 'Hide Details' : 'Explain'}
                              </button>

                              <button
                                onClick={() =>
                                  toggleWhatIfCandidate(ev.vehicle.id, ev.driver.id)
                                }
                                className={`px-2.5 py-1 rounded text-[10px] font-bold border-2 border-[#111111] transition-colors ${
                                  isInWhatIf
                                    ? 'bg-[#A65BFF] text-white shadow-[2px_2px_0px_#111111]'
                                    : 'bg-[#FFFFFF] text-[#A65BFF] hover:bg-[#A65BFF]/10'
                                }`}
                              >
                                {isInWhatIf ? 'In What-If' : '+ What-If'}
                              </button>

                              {ev.is_eligible && (
                                <button
                                  onClick={() => setCommitConfirmPair(ev)}
                                  className="px-3 py-1 rounded bg-[#A65BFF] hover:bg-[#9247E6] text-white font-black text-[10px] uppercase border border-[#111111] shadow-[2px_2px_0px_#111111]"
                                >
                                  Assign
                                </button>
                              )}
                            </td>
                          </tr>

                          {/* Expanded Explanation Drawer */}
                          {isExpanded && (
                            <tr className="bg-[#FFF21A]/10">
                              <td colSpan={6} className="p-4 border-b-2 border-[#111111]/20">
                                <div className="space-y-3 max-w-4xl">
                                  {/* Blocking reasons */}
                                  {ev.blocking_reasons.length > 0 && (
                                    <div className="p-3 rounded-lg bg-[#B42318]/10 border-2 border-[#B42318] space-y-1">
                                      <div className="font-black text-[#B42318] text-xs flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        <span>Blocking Constraints ({ev.blocking_reasons.length}):</span>
                                      </div>
                                      {ev.blocking_reasons.map((reason, i) => (
                                        <div key={i} className="text-[11px] text-[#B42318] font-bold pl-5">
                                          • {reason}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Satisfied criteria */}
                                  {ev.satisfied_criteria.length > 0 && (
                                    <div className="p-3 rounded-lg bg-[#176B38]/10 border-2 border-[#176B38] space-y-1">
                                      <div className="font-black text-[#176B38] text-xs flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Verified Criteria ({ev.satisfied_criteria.length}):</span>
                                      </div>
                                      {ev.satisfied_criteria.map((crit, i) => (
                                        <div key={i} className="text-[11px] text-[#176B38] font-bold pl-5">
                                          ✓ {crit}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Score breakdown if eligible */}
                                  {ev.is_eligible && (
                                    <div className="p-3 rounded-lg bg-[#FFFFFF] border-2 border-[#111111] flex items-center justify-between text-xs font-mono">
                                      <div>
                                        <span className="text-[#45421F] block text-[10px] font-bold">SCORE FORMULA</span>
                                        <span className="font-bold text-[#111111]">
                                          Base: {ev.score_breakdown.base} + Capacity Fit: {ev.score_breakdown.capacity_fit} + Type: {ev.score_breakdown.type_match} + Priority: {ev.score_breakdown.priority_boost} + Eco: {ev.score_breakdown.green_bonus}
                                        </span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-[#45421F] block text-[10px] font-bold">TOTAL SCORE</span>
                                        <span className="font-black text-[#A65BFF] text-base">
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
                      <td colSpan={6} className="py-8 text-center text-[#45421F] font-bold">
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
          <div className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#A65BFF] text-white border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-[#111111]">
                  What-If Comparative Allocation Simulator
                </h3>
                <p className="text-xs font-mono text-[#45421F]">
                  Evaluate trade-offs across candidate pairs in non-mutating preview.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#111111] text-[#FFF21A] text-[10px] font-mono font-black border border-[#111111]">
              SIMULATION MODE — Zero Mutations
            </div>
          </div>

          {whatIfPairs.length === 0 ? (
            <div className="p-12 text-center bg-[#FFFFFF] rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] text-xs font-mono text-[#45421F] space-y-3">
              <Sliders className="w-8 h-8 text-[#A65BFF] mx-auto opacity-70" />
              <p className="font-bold">No candidates added to What-If comparison yet.</p>
              <button
                onClick={() => setActiveSubTab('matrix')}
                className="px-4 py-2.5 bg-[#A65BFF] text-white font-black rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
              >
                Go to Eligibility Matrix & Add Candidates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whatIfSimulation?.comparisonCandidates.map((candidate, idx) => (
                <div
                  key={`${candidate.vehicle.id}:${candidate.driver.id}`}
                  className={`bg-[#FFFFFF] border-2 border-[#111111] rounded-xl p-5 flex flex-col justify-between shadow-[4px_4px_0px_#111111] relative ${
                    candidate.is_eligible
                      ? 'border-[#111111]'
                      : 'border-[#B42318] bg-[#B42318]/5'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b-2 border-[#111111]/15">
                      <span className="text-[10px] font-mono uppercase text-[#45421F] font-black">
                        Option #{idx + 1}
                      </span>
                      {candidate.is_eligible ? (
                        <span className="px-2.5 py-1 rounded bg-[#176B38] text-white text-[10px] font-mono font-black border border-[#111111]">
                          Eligible • Score {candidate.score_breakdown.total}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-[#B42318] text-white text-[10px] font-mono font-black border border-[#111111]">
                          Ineligible
                        </span>
                      )}
                    </div>

                    {/* Asset details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#111111]" />
                        <span className="font-mono text-xs font-black text-[#111111]">
                          {candidate.vehicle.id} ({candidate.vehicle.registration_number})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#45421F] font-bold pl-6">
                        {vehicleTypeLabel(candidate.vehicle.vehicle_type)} • Payload {formatWeight(candidate.vehicle.capacity)}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <User className="w-4 h-4 text-[#A65BFF]" />
                        <span className="font-mono text-xs font-black text-[#111111]">
                          {candidate.driver.name} ({candidate.driver.id})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#45421F] font-bold pl-6">
                        Status: {candidate.driver.availability_status}
                      </div>
                    </div>

                    {/* Trade-off metrics */}
                    <div className="p-3 bg-[#FFF21A]/20 rounded-lg border-2 border-[#111111]/20 space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#45421F] font-bold">Payload Fit:</span>
                        <span className="font-black text-[#111111]">{candidate.capacityFitPct}% utilized</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#45421F] font-bold">Class Match:</span>
                        <span className="font-black text-[#A65BFF]">
                          {selectedDelivery?.required_vehicle_type === candidate.vehicle.vehicle_type
                            ? 'Exact Match'
                            : 'Compatible'}
                        </span>
                      </div>
                      {candidate.score_breakdown.total > 0 && (
                        <div className="flex justify-between border-t border-[#111111]/15 pt-1.5">
                          <span className="text-[#45421F] font-bold">Composite Score:</span>
                          <span className="font-black text-[#111111]">
                            {candidate.score_breakdown.total}/100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Blocking reasons if any */}
                    {!candidate.is_eligible && (
                      <div className="text-[11px] font-mono text-[#B42318] font-bold p-2.5 rounded bg-[#B42318]/10 border border-[#B42318]">
                        {candidate.blocking_reasons[0]}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t-2 border-[#111111]/15 flex items-center justify-between">
                    <button
                      onClick={() =>
                        toggleWhatIfCandidate(candidate.vehicle.id, candidate.driver.id)
                      }
                      className="text-xs font-mono font-bold text-[#45421F] hover:text-[#111111]"
                    >
                      Remove
                    </button>
                    {candidate.is_eligible && (
                      <button
                        onClick={() => setCommitConfirmPair(candidate)}
                        className="px-3.5 py-1.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111]"
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
            <div className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
              <span className="text-[10px] font-mono uppercase text-[#45421F] font-black block">
                Total Constraints
              </span>
              <span className="text-3xl font-display font-black text-[#111111] mt-1 block">
                {conflictRadar.totalConflicts}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
              <span className="text-[10px] font-mono uppercase text-[#45421F] font-black block">
                Occupied Vehicles
              </span>
              <span className="text-3xl font-display font-black text-[#111111] mt-1 block">
                {conflictRadar.occupiedVehicles.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
              <span className="text-[10px] font-mono uppercase text-[#45421F] font-black block">
                Occupied Drivers
              </span>
              <span className="text-3xl font-display font-black text-[#111111] mt-1 block">
                {conflictRadar.occupiedDrivers.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#FFFFFF] border-2 border-[#111111] shadow-[3px_3px_0px_#111111]">
              <span className="text-[10px] font-mono uppercase text-[#45421F] font-black block">
                Blocked Orders
              </span>
              <span className="text-3xl font-display font-black text-[#B42318] mt-1 block">
                {conflictRadar.blockedDeliveries.length}
              </span>
            </div>
          </div>

          {/* Active Conflict Stream */}
          <div className="bg-[#FFFFFF] border-2 border-[#111111] rounded-xl p-5 shadow-[4px_4px_0px_#111111] space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#111111] font-black">
              Constraint & Conflict Registry
            </h3>

            <div className="space-y-3">
              {conflictRadar.conflictItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border-2 border-[#111111] text-xs font-mono space-y-2 ${
                    item.severity === 'high'
                      ? 'bg-[#B42318]/10 text-[#B42318]'
                      : item.severity === 'medium'
                      ? 'bg-[#8A4B00]/10 text-[#8A4B00]'
                      : 'bg-[#FFFFFF] text-[#111111]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#111111]" />
                      <span>{item.title}</span>
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#FFF21A] text-[#111111] border border-[#111111]">
                      {item.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[#45421F] font-medium pl-6">{item.description}</p>

                  <div className="pl-6 pt-1 text-[11px] text-[#111111] font-bold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-[#A65BFF]" />
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
            <div className="p-6 rounded-xl bg-[#FFFFFF] border-3 border-[#A65BFF] shadow-[6px_6px_0px_#111111] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#A65BFF]" />
                  <h3 className="font-display font-black text-xl text-[#111111]">
                    Top Ranked Recommendation
                  </h3>
                </div>
                <div className="px-3.5 py-1.5 rounded-lg bg-[#A65BFF] text-white font-mono text-xs font-black border border-[#111111] shadow-[2px_2px_0px_#111111]">
                  Optimal Match Score: {evaluationResult.topRecommendation.score_breakdown.total}/100
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#FFF21A]/20 rounded-lg border-2 border-[#111111] space-y-1">
                  <span className="text-[10px] font-mono text-[#45421F] font-black">RECOMMENDED ASSET</span>
                  <div className="font-black text-base text-[#111111]">
                    {evaluationResult.topRecommendation.vehicle.id} •{' '}
                    {evaluationResult.topRecommendation.vehicle.registration_number}
                  </div>
                  <div className="text-xs text-[#45421F] font-bold">
                    {vehicleTypeLabel(evaluationResult.topRecommendation.vehicle.vehicle_type)} (
                    {formatWeight(evaluationResult.topRecommendation.vehicle.capacity)})
                  </div>
                </div>

                <div className="p-4 bg-[#FFF21A]/20 rounded-lg border-2 border-[#111111] space-y-1">
                  <span className="text-[10px] font-mono text-[#45421F] font-black">RECOMMENDED DRIVER</span>
                  <div className="font-black text-base text-[#111111]">
                    {evaluationResult.topRecommendation.driver.name} (
                    {evaluationResult.topRecommendation.driver.id})
                  </div>
                  <div className="text-xs text-[#176B38] font-black">Confirmed Available on Duty</div>
                </div>
              </div>

              {/* Step by step why chosen */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black">
                  Why this pair was chosen:
                </h4>
                <div className="space-y-2">
                  {evaluationResult.whyChosenExplanation.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs font-mono text-[#176B38] font-bold">
                      <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#176B38]" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tie explanation if any */}
              {evaluationResult.tieExplanation && (
                <div className="p-3.5 rounded-lg bg-[#FFF21A] border-2 border-[#111111] text-[#111111] text-xs font-mono font-bold">
                  <Info className="w-4 h-4 inline mr-2 text-[#A65BFF]" />
                  <span>{evaluationResult.tieExplanation}</span>
                </div>
              )}

              {/* Why not the others */}
              <div className="space-y-2 pt-4 border-t-2 border-[#111111]/15">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black">
                  Why not the alternatives?
                </h4>
                <div className="space-y-2">
                  {evaluationResult.whyNotOthersExplanations.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[#F8F8F8] border border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono"
                    >
                      <span className="font-black text-[#111111]">
                        {item.vehicle_id} + {item.driver_id}:
                      </span>
                      <span className="text-[#45421F] font-bold">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCommitConfirmPair(evaluationResult.topRecommendation)}
                  className="px-6 py-3 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-mono text-xs font-black uppercase rounded-lg border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex items-center gap-2"
                >
                  <span>Commit Top Recommendation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#FFFFFF] rounded-xl border-2 border-[#111111] shadow-[4px_4px_0px_#111111] text-xs font-mono text-[#45421F]">
              No recommendations feasible for {selectedDelivery?.id}.
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {commitConfirmPair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-md rounded-xl p-6 shadow-[8px_8px_0px_#111111] relative space-y-4 text-[#111111]">
            <h3 className="text-lg font-black font-display text-[#111111]">
              Confirm Authoritative Dispatch Allocation
            </h3>
            <p className="text-xs font-mono text-[#45421F]">
              This will atomically commit row locks on PostgreSQL, assign vehicle{' '}
              <strong className="text-[#111111] underline">{commitConfirmPair.vehicle.id}</strong> and driver{' '}
              <strong className="text-[#A65BFF] underline">{commitConfirmPair.driver.name}</strong> to{' '}
              <strong className="text-[#111111]">{commitConfirmPair.delivery_id}</strong>, and record an immutable audit log.
            </p>

            <div className="p-3.5 bg-[#FFF21A]/30 rounded-lg border-2 border-[#111111] text-xs font-mono font-bold space-y-1">
              <div>Delivery: {commitConfirmPair.delivery_id}</div>
              <div>Vehicle: {commitConfirmPair.vehicle.registration_number}</div>
              <div>Driver: {commitConfirmPair.driver.name}</div>
              <div className="text-[#A65BFF]">Match Score: {commitConfirmPair.score_breakdown.total}/100</div>
            </div>

            <div className="pt-3 flex justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => setCommitConfirmPair(null)}
                className="px-4 py-2 bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] font-bold rounded-lg hover:bg-[#EEEEEE]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecuteCommit(commitConfirmPair)}
                className="px-5 py-2 bg-[#A65BFF] text-white font-black uppercase rounded-lg border-2 border-[#111111] hover:bg-[#9247E6] shadow-[2px_2px_0px_#111111]"
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

