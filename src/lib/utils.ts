import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (Math.abs(diffMins) < 1) return 'Just now';
    if (diffMins > 0) {
      if (diffMins < 60) return `In ${diffMins}m`;
      const hours = Math.round(diffMins / 60);
      if (hours < 24) return `In ${hours}h`;
      return `In ${Math.round(hours / 24)}d`;
    } else {
      const pastMins = Math.abs(diffMins);
      if (pastMins < 60) return `${pastMins}m ago`;
      const hours = Math.round(pastMins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.round(hours / 24)}d ago`;
    }
  } catch {
    return isoString;
  }
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${kg} kg`;
}

export function vehicleTypeLabel(type: string): string {
  const map: Record<string, string> = {
    electric_van: 'Electric Van',
    van: 'Cargo Van',
    truck: 'Freight Truck',
    cargo_bike: 'Cargo Bike',
    refrigerated_truck: 'Refrigerated Truck',
  };
  return map[type] || type;
}

