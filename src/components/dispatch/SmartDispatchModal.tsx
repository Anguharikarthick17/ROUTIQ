import React, { useState } from 'react';
import { Delivery } from '../../types';
import { useOperational } from '../../context/OperationalContext';
import { generateDispatchRecommendations } from '../../services/recommendationEngine';
import { vehicleTypeLabel, formatWeight } from '../../lib/utils';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Truck,
  User,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface SmartDispatchModalProps {
  delivery: Delivery | null;
  onClose: () => void;
  onAssigned?: () => void;
}

export const SmartDispatchModal: React.FC<SmartDispatchModalProps> = ({
  delivery,
  onClose,
  onAssigned,
}) => {
  const { vehicles, drivers, assignDelivery } = useOperational();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!delivery) return null;

  // Generate recommendations
  const recommendation = generateDispatchRecommendations(delivery, vehicles, drivers);

  // Set default selections based on best recommendation
  React.useEffect(() => {
    if (recommendation.bestRecommendation) {
      setSelectedVehicleId(recommendation.bestRecommendation.vehicle.id);
      setSelectedDriverId(recommendation.bestRecommendation.driver.id);
    }
  }, [delivery]);

  const handleExecuteDispatch = (vId?: string, dId?: string) => {
    const finalVehicleId = vId || selectedVehicleId;
    const finalDriverId = dId || selectedDriverId;

    if (!finalVehicleId || !finalDriverId) {
      setErrorMessage('Please select both a vehicle and a driver.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = assignDelivery(delivery.id, finalVehicleId, finalDriverId);
    setIsSubmitting(false);

    if (result.success) {
      if (onAssigned) onAssigned();
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#171717] border border-[#383838] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#383838] bg-[#202020]/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#FFF21A] text-[#171717] font-mono text-xs font-bold">
                {delivery.id}
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-[#A3A3A3]">
                Authoritative Dispatch Allocation
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#FFFFFF] mt-1">
              Smart Resource Matching & Allocation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A3A3A3] hover:text-[#FFFFFF] rounded-lg hover:bg-[#383838] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Delivery Profile Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#202020] border border-[#383838]">
            <div>
              <span className="text-[10px] font-mono text-[#A3A3A3] block">REQUIRED PAYLOAD</span>
              <span className="text-sm font-bold font-mono text-[#FFFFFF]">
                {formatWeight(delivery.required_capacity)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#A3A3A3] block">VEHICLE CLASS</span>
              <span className="text-sm font-bold font-mono text-[#FFFFFF]">
                {delivery.required_vehicle_type
                  ? vehicleTypeLabel(delivery.required_vehicle_type)
                  : 'Any Compatible'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#A3A3A3] block">PRIORITY</span>
              <span
                className={`text-xs font-bold font-mono uppercase px-2 py-0.5 rounded inline-block mt-1 ${
                  delivery.priority === 'urgent'
                    ? 'bg-red-950 text-red-400 border border-red-800'
                    : delivery.priority === 'high'
                    ? 'bg-yellow-950 text-[#FFF21A] border border-yellow-800'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {delivery.priority}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#A3A3A3] block">STATUS</span>
              <span className="text-xs font-bold font-mono uppercase text-blue-400">
                {delivery.status}
              </span>
            </div>
          </div>

          {/* AI Recommended Pair */}
          {recommendation.bestRecommendation && (
            <div className="p-5 rounded-lg border-2 border-[#A65BFF]/50 bg-[#A65BFF]/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A65BFF]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A65BFF]">
                    Recommended Dispatch Pairing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A65BFF]/20 border border-[#A65BFF]/40 text-[#A65BFF] font-mono text-xs font-bold">
                  <span>Match Score: {recommendation.bestRecommendation.score}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="p-3 bg-[#171717] rounded border border-[#383838] flex items-center gap-3">
                  <div className="p-2 rounded bg-[#FFF21A]/10 text-[#FFF21A]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#A3A3A3]">
                      {recommendation.bestRecommendation.vehicle.id} •{' '}
                      {recommendation.bestRecommendation.vehicle.registration_number}
                    </div>
                    <div className="text-sm font-bold text-[#FFFFFF]">
                      {vehicleTypeLabel(recommendation.bestRecommendation.vehicle.vehicle_type)} (
                      {formatWeight(recommendation.bestRecommendation.vehicle.capacity)})
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#171717] rounded border border-[#383838] flex items-center gap-3">
                  <div className="p-2 rounded bg-[#A65BFF]/10 text-[#A65BFF]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#A3A3A3]">
                      {recommendation.bestRecommendation.driver.id} • Ready
                    </div>
                    <div className="text-sm font-bold text-[#FFFFFF]">
                      {recommendation.bestRecommendation.driver.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability bullets */}
              <div className="mt-2 space-y-1">
                {recommendation.bestRecommendation.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#A65BFF]/20 flex justify-end">
                <button
                  onClick={() =>
                    handleExecuteDispatch(
                      recommendation.bestRecommendation?.vehicle.id,
                      recommendation.bestRecommendation?.driver.id
                    )
                  }
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#A65BFF] hover:bg-[#A65BFF]/90 text-white font-bold text-xs uppercase font-mono tracking-wider rounded flex items-center gap-2 transition-all shadow-lg shadow-[#A65BFF]/20"
                >
                  <span>Apply Recommended Pair</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Ineligible Warnings or Bottlenecks */}
          {recommendation.ineligibleSummary.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-200/90 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Allocation Constraints & Ineligible Units:</span>
              </div>
              {recommendation.ineligibleSummary.slice(0, 3).map((item, idx) => (
                <div key={idx} className="pl-6 text-[11px] text-[#A3A3A3]">
                  • {item}
                </div>
              ))}
            </div>
          )}

          {/* Manual Selection Fallback */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3]">
              Manual Fleet Asset Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-1">
                  ASSIGN VEHICLE
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.registration_number} ({vehicleTypeLabel(v.vehicle_type)}, {v.capacity}kg) [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-[#A3A3A3] block mb-1">
                  ASSIGN DRIVER
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-[#202020] border border-[#383838] rounded p-2.5 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#FFF21A]"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.id} — {d.name} [{d.availability_status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#383838] bg-[#202020]/50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleExecuteDispatch()}
            disabled={isSubmitting || !selectedVehicleId || !selectedDriverId}
            className="px-5 py-2.5 bg-[#FFF21A] hover:bg-[#fff447] text-[#171717] font-bold text-xs font-mono uppercase tracking-wider rounded transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Validating Concurrency...' : 'Confirm Authoritative Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
};
