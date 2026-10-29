import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Delivery } from '../../types';
import { fetchRoadRoute, RouteResponse } from '../../lib/osrm';
import { Navigation, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface InteractiveRouteMapProps {
  selectedDelivery: Delivery | null;
  allDeliveries?: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  selectedDelivery,
  allDeliveries = [],
  onSelectDelivery,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [37.7749, -122.4194]; // San Francisco base coordinates
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // CartoDB Dark Matter tiles matching Charcoal Black #171717 aesthetic
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Route when selectedDelivery changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteData(null);

    // Create custom pin icons using ROUTIQ brand colors
    const createCustomIcon = (label: string, bg: string, text: string, borderColor = '#111111') => {
      return L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="background-color: ${bg}; color: ${text}; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; font-family: monospace; border: 2px solid ${borderColor}; box-shadow: 2px 2px 0px #111111; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>${label}</span>
          </div>
        `,
        iconSize: [90, 32],
        iconAnchor: [45, 16],
      });
    };

    if (selectedDelivery) {
      const pLat = selectedDelivery.pickup_lat || 37.7749;
      const pLng = selectedDelivery.pickup_lng || -122.4194;
      const dLat = selectedDelivery.dropoff_lat || 37.7892;
      const dLng = selectedDelivery.dropoff_lng || -122.4014;

      const pMarker = L.marker([pLat, pLng], {
        icon: createCustomIcon('PICKUP', '#FFF21A', '#111111', '#111111'),
      }).bindPopup(`<b>Pickup:</b> ${selectedDelivery.pickup_location}`);

      const dMarker = L.marker([dLat, dLng], {
        icon: createCustomIcon('DROPOFF', '#A65BFF', '#FFFFFF', '#111111'),
      }).bindPopup(`<b>Dropoff:</b> ${selectedDelivery.dropoff_location}`);

      markersLayer.addLayer(pMarker);
      markersLayer.addLayer(dMarker);

      // Fetch Real Road Route
      setIsLoadingRoute(true);
      fetchRoadRoute(pLat, pLng, dLat, dLng).then((route) => {
        setIsLoadingRoute(false);
        setRouteData(route);

        if (mapInstanceRef.current) {
          const polyline = L.polyline(route.coordinates, {
            color: '#A65BFF',
            weight: 5,
            opacity: 0.95,
            dashArray: route.isEstimate ? '8, 8' : undefined,
          }).addTo(mapInstanceRef.current);

          routeLayerRef.current = polyline;
          mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
      });
    } else {
      // Show general cluster of all deliveries
      const validDeliveries = allDeliveries.filter((d) => d.pickup_lat && d.pickup_lng);
      if (validDeliveries.length > 0) {
        const bounds: [number, number][] = [];
        validDeliveries.forEach((del) => {
          if (del.pickup_lat && del.pickup_lng) {
            bounds.push([del.pickup_lat, del.pickup_lng]);
            const marker = L.marker([del.pickup_lat, del.pickup_lng], {
              icon: createCustomIcon(del.id, '#FFFFFF', '#111111', '#111111'),
            });
            marker.on('click', () => {
              if (onSelectDelivery) onSelectDelivery(del);
            });
            markersLayer.addLayer(marker);
          }
        });
        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }
  }, [selectedDelivery, allDeliveries, onSelectDelivery]);

  return (
    <div className="relative w-full h-[480px] bg-[#111111] rounded-xl overflow-hidden border-2 border-[#111111] shadow-[4px_4px_0px_#111111]">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Route Telemetry Overlay Panel */}
      {selectedDelivery && (
        <div className="absolute top-4 left-4 z-10 bg-[#FFFFFF] text-[#111111] border-2 border-[#111111] p-4 rounded-xl max-w-sm shadow-[4px_4px_0px_#111111]">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-[#45421F]">
              Route Telemetry
            </span>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#FFF21A] text-[#111111] border border-[#111111] font-black">
              {selectedDelivery.id}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-[#111111] font-medium">
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFF21A] border border-[#111111] mt-1 shrink-0" />
              <span className="truncate">{selectedDelivery.pickup_location}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A65BFF] border border-[#111111] mt-1 shrink-0" />
              <span className="truncate">{selectedDelivery.dropoff_location}</span>
            </div>
          </div>

          {isLoadingRoute ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#111111] font-mono animate-pulse bg-[#FFF21A] p-2 rounded border border-[#111111]">
              <Navigation className="w-3.5 h-3.5 animate-spin text-[#A65BFF]" />
              Calculating road navigation path...
            </div>
          ) : routeData ? (
            <div className="mt-3 pt-3 border-t border-[#111111]/20 grid grid-cols-2 gap-3">
              <div className="bg-[#FFF21A]/30 p-2 rounded border border-[#111111]/15">
                <span className="text-[10px] text-[#45421F] block font-mono font-bold">ROAD DISTANCE</span>
                <span className="text-base font-black font-mono text-[#111111]">
                  {routeData.distanceKm} km
                </span>
              </div>
              <div className="bg-[#FFF21A]/30 p-2 rounded border border-[#111111]/15">
                <span className="text-[10px] text-[#45421F] block font-mono font-bold">ESTIMATED TIME</span>
                <div className="flex items-center gap-1 text-base font-black font-mono text-[#111111]">
                  <Clock className="w-3.5 h-3.5 text-[#A65BFF]" />
                  <span>{routeData.durationMinutes} min</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between text-[10px] font-mono text-[#111111] bg-[#111111] text-[#FFFFFF] px-2.5 py-1.5 rounded border border-[#111111]">
                <span className="flex items-center gap-1.5 text-[#FFF21A] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A65BFF]" />
                  Source: {routeData.source}
                </span>
                <span className="text-[#FFFFFF]">
                  {routeData.isEstimate ? 'Simulated Grid' : 'Real Road Network'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs text-[#8A4B00] font-mono bg-[#FFF21A] p-2 rounded border border-[#8A4B00]">
              <AlertCircle className="w-3.5 h-3.5" />
              Route calculation unavailable
            </div>
          )}
        </div>
      )}

      {/* Standby Help Pill when no delivery selected */}
      {!selectedDelivery && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#FFFFFF] text-[#111111] border-2 border-[#111111] px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-[2px_2px_0px_#111111]">
          <Navigation className="w-3.5 h-3.5 text-[#A65BFF]" />
          Select any delivery to plot street-level turn-by-turn route
        </div>
      )}
    </div>
  );
};

