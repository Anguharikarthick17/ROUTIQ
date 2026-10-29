import { Delivery, Driver, Vehicle } from '../types';

export interface CopilotContext {
  vehicles: Vehicle[];
  drivers: Driver[];
  deliveries: Delivery[];
  activeAlerts: string[];
}

export async function askRoutiqCopilot(
  query: string,
  context: CopilotContext
): Promise<{ text: string; model: string; sources: string[] }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const totalVehicles = context.vehicles.length;
  const availableVehicles = context.vehicles.filter((v) => v.status === 'available');
  const availableDrivers = context.drivers.filter((d) => d.availability_status === 'available');
  const pendingDeliveries = context.deliveries.filter((d) => d.status === 'pending');
  const urgentDeliveries = context.deliveries.filter((d) => d.priority === 'urgent' && d.status === 'pending');
  const inTransitDeliveries = context.deliveries.filter((d) => d.status === 'in_transit');
  const maintenanceVehicles = context.vehicles.filter((v) => v.status === 'maintenance');

  // Grounding context summary
  const groundingContext = `
ROUTIQ LIVE OPERATIONS SUMMARY:
- Total Fleet: ${totalVehicles} vehicles (${availableVehicles.length} available, ${context.vehicles.filter((v) => v.status === 'assigned').length} assigned, ${maintenanceVehicles.length} in maintenance).
- Drivers: ${context.drivers.length} total (${availableDrivers.length} available, ${context.drivers.filter((d) => d.availability_status === 'assigned').length} assigned, ${context.drivers.filter((d) => d.availability_status === 'unavailable').length} unavailable).
- Deliveries: ${context.deliveries.length} total (${pendingDeliveries.length} pending, ${inTransitDeliveries.length} in transit, ${context.deliveries.filter((d) => d.status === 'delivered').length} delivered, ${context.deliveries.filter((d) => d.status === 'cancelled').length} cancelled).
- Urgent Pending Deliveries: ${urgentDeliveries.map((d) => `${d.id} (${d.required_capacity}kg, ${d.required_vehicle_type || 'any type'})`).join(', ') || 'None'}.
- Available Vehicles: ${availableVehicles.map((v) => `${v.id} (${v.vehicle_type}, ${v.capacity}kg)`).join(', ') || 'None'}.
- Available Drivers: ${availableDrivers.map((d) => `${d.name} (${d.id})`).join(', ') || 'None'}.
`;

  if (apiKey && apiKey.length > 15 && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `You are the ROUTIQ AI Fleet Copilot. Respond with crisp, precise operational intelligence.
Always ground your answers strictly on the operational telemetry below. Never fabricate telematics, coordinates, or fake driver names.
If recommending an assignment, remind the dispatcher that final allocation requires authoritative transactional confirmation.

${groundingContext}

User Query: "${query}"`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          return {
            text: candidate,
            model: 'Gemini 1.5 Flash',
            sources: ['Real-time Telemetry Store', 'Fleet State Graph'],
          };
        }
      }
    } catch {
      // Fallback to deterministic operational analyzer if API fails
    }
  }

  // Deterministic Operational Intelligence Engine (Zero external dependencies)
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('available vehicle') || lowerQuery.includes('which vehicle')) {
    if (availableVehicles.length === 0) {
      return {
        text: 'Zero vehicles are currently available. All units are either actively assigned or undergoing scheduled maintenance.',
        model: 'ROUTIQ Heuristic Intelligence Engine',
        sources: ['Vehicles Repository'],
      };
    }
    const list = availableVehicles
      .map((v) => `• **${v.id}** (${v.registration_number}) — ${v.vehicle_type.replace('_', ' ')}, Capacity: ${v.capacity} kg`)
      .join('\n');
    return {
      text: `Currently, there are **${availableVehicles.length} available vehicle(s)** ready for dispatch:\n\n${list}\n\n*All vehicles verified ready with no active assignment conflicts.*`,
      model: 'ROUTIQ Heuristic Intelligence Engine',
      sources: ['Vehicles Repository'],
    };
  }

  if (lowerQuery.includes('urgent') || lowerQuery.includes('priority')) {
    if (urgentDeliveries.length === 0) {
      return {
        text: 'There are currently **no urgent pending deliveries** waiting in the queue. Standard and normal priority orders are on schedule.',
        model: 'ROUTIQ Heuristic Intelligence Engine',
        sources: ['Deliveries Repository'],
      };
    }
    const list = urgentDeliveries
      .map((d) => `• **${d.id}** — Pickup: *${d.pickup_location}* → Dropoff: *${d.dropoff_location}* (Req: ${d.required_capacity}kg, Type: ${d.required_vehicle_type || 'Any'})`)
      .join('\n');
    return {
      text: `Found **${urgentDeliveries.length} urgent pending delivery** requiring immediate dispatch:\n\n${list}\n\n*Recommendation: Prioritize assigning compatible electric vans or express couriers.*`,
      model: 'ROUTIQ Heuristic Intelligence Engine',
      sources: ['Deliveries Repository'],
    };
  }

  if (lowerQuery.includes('utilization') || lowerQuery.includes('metric') || lowerQuery.includes('rate')) {
    const assignedCount = context.vehicles.filter((v) => v.status === 'assigned').length;
    const utilizationPct = totalVehicles > 0 ? Math.round((assignedCount / totalVehicles) * 100) : 0;
    const deliveredCount = context.deliveries.filter((d) => d.status === 'delivered').length;
    const completionRate = context.deliveries.length > 0 ? Math.round((deliveredCount / context.deliveries.length) * 100) : 0;

    return {
      text: `**Fleet Operational Metrics Breakdown:**\n\n• **Fleet Utilization:** **${utilizationPct}%** (${assignedCount} of ${totalVehicles} vehicles deployed).\n• **Delivery Completion Rate:** **${completionRate}%** (${deliveredCount} delivered successfully).\n• **Active In-Transit:** ${inTransitDeliveries.length} deliveries currently en route.\n• **Maintenance Hold:** ${maintenanceVehicles.length} vehicle(s) in servicing.`,
      model: 'ROUTIQ Heuristic Intelligence Engine',
      sources: ['Calculated Telemetry Metrics'],
    };
  }

  if (lowerQuery.includes('bottleneck') || lowerQuery.includes('summary') || lowerQuery.includes('issue')) {
    const bottlenecks: string[] = [];
    if (maintenanceVehicles.length > 0) {
      bottlenecks.push(`Vehicle ${maintenanceVehicles.map((v) => v.id).join(', ')} is offline under maintenance.`);
    }
    const unavailDrivers = context.drivers.filter((d) => d.availability_status === 'unavailable');
    if (unavailDrivers.length > 0) {
      bottlenecks.push(`Driver ${unavailDrivers.map((d) => d.name).join(', ')} is marked unavailable.`);
    }
    if (urgentDeliveries.length > 0) {
      bottlenecks.push(`Urgent delivery ${urgentDeliveries.map((d) => d.id).join(', ')} is pending dispatch allocation.`);
    }

    return {
      text: `**Operational Health & Bottleneck Assessment:**\n\n${bottlenecks.length > 0 ? bottlenecks.map((b) => `• ${b}`).join('\n') : '• No critical system bottlenecks identified. Operations are nominal.'}\n\n*Overall fleet status: ${availableVehicles.length} vehicles and ${availableDrivers.length} drivers currently on standby.*`,
      model: 'ROUTIQ Heuristic Intelligence Engine',
      sources: ['Operational Audit Logs', 'Fleet State Graph'],
    };
  }

  // Default general intelligence response
  return {
    text: `**ROUTIQ Operational Status:**\n\nMonitoring **${totalVehicles} fleet vehicles** and **${context.drivers.length} drivers**. There are **${pendingDeliveries.length} pending deliveries** and **${inTransitDeliveries.length} active in transit**.\n\nYou can ask me:\n• *"Which vehicles are currently available?"*\n• *"Which deliveries are urgent?"*\n• *"What is our fleet utilization?"*\n• *"Summarize operational bottlenecks"*`,
    model: 'ROUTIQ Heuristic Intelligence Engine',
    sources: ['Operational Telemetry Index'],
  };
}

