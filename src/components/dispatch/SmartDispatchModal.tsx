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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border-3 border-[#111111] w-full max-w-3xl rounded-xl shadow-[8px_8px_0px_#111111] overflow-hidden flex flex-col max-h-[90vh] text-[#111111]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[#111111] bg-[#FFF21A]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded bg-[#111111] text-[#FFF21A] font-mono text-xs font-black uppercase">
                {delivery.id}
              </span>
              <span className="text-xs uppercase font-mono tracking-wider font-bold text-[#45421F]">
                Authoritative Dispatch Allocation
              </span>
            </div>
            <h2 className="text-2xl font-black font-display text-[#111111]">
              Smart Resource Matching & Allocation
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-[#111111] bg-[#FFFFFF] hover:bg-[#EEEEEE] text-[#111111] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Delivery Profile Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8F8F8] border-2 border-[#111111]">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#45421F] block">REQUIRED PAYLOAD</span>
              <span className="text-sm font-black font-mono text-[#111111]">
                {formatWeight(delivery.required_capacity)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#45421F] block">VEHICLE CLASS</span>
              <span className="text-sm font-black font-mono text-[#111111]">
                {delivery.required_vehicle_type
                  ? vehicleTypeLabel(delivery.required_vehicle_type)
                  : 'Any Compatible'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#45421F] block">PRIORITY</span>
              <span
                className={`text-xs font-black font-mono uppercase px-2 py-0.5 rounded inline-block mt-1 border border-[#111111] ${
                  delivery.priority === 'urgent'
                    ? 'bg-[#B42318] text-white'
                    : delivery.priority === 'high'
                    ? 'bg-[#FFF21A] text-[#111111]'
                    : 'bg-[#EEEEEE] text-[#111111]'
                }`}
              >
                {delivery.priority}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#45421F] block">STATUS</span>
              <span className="text-xs font-black font-mono uppercase text-[#A65BFF]">
                {delivery.status}
              </span>
            </div>
          </div>

          {/* AI Recommended Pair */}
          {recommendation.bestRecommendation && (
            <div className="p-5 rounded-xl border-2 border-[#111111] bg-[#FFF21A]/20 relative overflow-hidden shadow-[3px_3px_0px_#111111]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A65BFF]" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider text-[#111111]">
                    Recommended Dispatch Pairing
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#A65BFF] text-white font-mono text-xs font-black border border-[#111111]">
                  <span>Match Score: {recommendation.bestRecommendation.score}/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                <div className="p-3 bg-[#FFFFFF] rounded-lg border-2 border-[#111111] flex items-center gap-3">
                  <div className="p-2 rounded bg-[#FFF21A] text-[#111111] border border-[#111111]">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#45421F] font-bold">
                      {recommendation.bestRecommendation.vehicle.id} •{' '}
                      {recommendation.bestRecommendation.vehicle.registration_number}
                    </div>
                    <div className="text-sm font-black text-[#111111]">
                      {vehicleTypeLabel(recommendation.bestRecommendation.vehicle.vehicle_type)} (
                      {formatWeight(recommendation.bestRecommendation.vehicle.capacity)})
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FFFFFF] rounded-lg border-2 border-[#111111] flex items-center gap-3">
                  <div className="p-2 rounded bg-[#A65BFF] text-white border border-[#111111]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-[#45421F] font-bold">
                      {recommendation.bestRecommendation.driver.id} • Ready
                    </div>
                    <div className="text-sm font-black text-[#111111]">
                      {recommendation.bestRecommendation.driver.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability bullets */}
              <div className="mt-2 space-y-1">
                {recommendation.bestRecommendation.reasons.map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-mono font-bold text-[#176B38]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#176B38] shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t-2 border-[#111111]/15 flex justify-end">
                <button
                  onClick={() =>
                    handleExecuteDispatch(
                      recommendation.bestRecommendation?.vehicle.id,
                      recommendation.bestRecommendation?.driver.id
                    )
                  }
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-black text-xs uppercase font-mono tracking-wider rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] flex items-center gap-2 transition-all"
                >
                  <span>Apply Recommended Pair</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Ineligible Warnings or Bottlenecks */}
          {recommendation.ineligibleSummary.length > 0 && (
            <div className="p-4 rounded-xl bg-[#8A4B00]/10 border-2 border-[#8A4B00] text-[#8A4B00] text-xs font-mono space-y-1">
              <div className="flex items-center gap-2 font-black mb-1">
                <AlertTriangle className="w-4 h-4 text-[#8A4B00]" />
                <span>Allocation Constraints & Ineligible Units:</span>
              </div>
              {recommendation.ineligibleSummary.slice(0, 3).map((item, idx) => (
                <div key={idx} className="pl-6 text-[11px] text-[#45421F] font-bold">
                  • {item}
                </div>
              ))}
            </div>
          )}

          {/* Manual Selection Fallback */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-black">
              Manual Fleet Asset Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono font-black text-[#45421F] block mb-1">
                  ASSIGN VEHICLE
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-xs text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] cursor-pointer"
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
                <label className="text-xs font-mono font-black text-[#45421F] block mb-1">
                  ASSIGN DRIVER
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full bg-[#FFFFFF] border-2 border-[#111111] rounded-lg p-2.5 text-xs text-[#111111] font-bold focus:outline-none focus:bg-[#FFF21A] cursor-pointer"
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
            <div className="p-3 bg-[#B42318]/10 border-2 border-[#B42318] text-[#B42318] text-xs font-mono font-bold rounded-lg flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B42318] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#111111] bg-[#F8F8F8] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono font-bold text-[#45421F] hover:text-[#111111] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleExecuteDispatch()}
            disabled={isSubmitting || !selectedVehicleId || !selectedDriverId}
            className="px-5 py-2.5 bg-[#A65BFF] hover:bg-[#9247E6] text-white font-black text-xs font-mono uppercase tracking-wider rounded-lg border-2 border-[#111111] shadow-[2px_2px_0px_#111111] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? 'Validating Concurrency...' : 'Confirm Authoritative Allocation'}
          </button>
        </div>
      </div>
    </div>
  );
};

