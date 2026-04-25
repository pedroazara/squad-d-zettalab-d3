import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { cn } from '@/lib/utils';

interface MockBrazilMapProps {
  className?: string;
  showFire?: boolean;
  fireHotspots?: Array<{
    name: string;
    lat: number;
    lng: number;
    intensity: number;
  }>;
  firePoints?: Array<{
    lat: number;
    lng: number;
    intensity: number;
    label?: string;
  }>;
  faunaPoints?: Array<{
    lat: number;
    lng: number;
    label?: string;
  }>;
  stateIntensity?: Record<string, number>;
}

const BRAZIL_CENTER: LatLngExpression = [-14.235, -51.9253];
const BRASIL_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAX_FIRE_POINTS_RENDERED = 5000;
const MAX_FAUNA_POINTS_RENDERED = 2500;
let geoJsonCache: any | null = null;
let geoJsonPromise: Promise<any> | null = null;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

function getFireColor(intensity: number) {
  if (intensity >= 80) return '#7f1d1d';
  if (intensity >= 60) return '#b91c1c';
  if (intensity >= 40) return '#dc2626';
  if (intensity >= 20) return '#f97316';
  return '#fb923c';
}

function getStateStyleIntensity() {
  // Always return neutral colors for state boundaries
  return {
    color: '#334155',
    weight: 1,
    fillColor: '#d1d5db',
    fillOpacity: 0.35,
  };
}

export function MockBrazilMap({
  className,
  showFire = true,
  fireHotspots = [],
  firePoints = [],
  faunaPoints = [],
  stateIntensity,
}: MockBrazilMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadGeoJson = async () => {
      if (geoJsonCache) {
        if (mounted) {
          setGeoJsonData(geoJsonCache);
        }
        return;
      }

      if (!geoJsonPromise) {
        geoJsonPromise = fetch('/maps/brazil-states.geojson').then((response) => response.json());
      }
      try {
        const data = await geoJsonPromise;
        geoJsonCache = data;
        if (mounted) {
          setGeoJsonData(data);
        }
      } catch {
        if (mounted) {
          setGeoJsonData(null);
        }
      }
    };

    void loadGeoJson();
    return () => {
      mounted = false;
    };
  }, []);

  const stateIntensityMap = useMemo(() => {
    const out: Record<string, number> = {};

    if (stateIntensity) {
      Object.entries(stateIntensity).forEach(([key, value]) => {
        out[normalizeText(key)] = value;
      });
    }

    return out;
  }, [stateIntensity]);

  const sampledFirePoints = useMemo(() => {
    if (firePoints.length <= MAX_FIRE_POINTS_RENDERED) {
      return firePoints;
    }
    const stride = firePoints.length / MAX_FIRE_POINTS_RENDERED;
    return Array.from({ length: MAX_FIRE_POINTS_RENDERED }, (_, idx) => firePoints[Math.floor(idx * stride)]);
  }, [firePoints]);

  const sampledFaunaPoints = useMemo(() => {
    if (faunaPoints.length <= MAX_FAUNA_POINTS_RENDERED) {
      return faunaPoints;
    }
    const stride = faunaPoints.length / MAX_FAUNA_POINTS_RENDERED;
    return Array.from({ length: MAX_FAUNA_POINTS_RENDERED }, (_, idx) => faunaPoints[Math.floor(idx * stride)]);
  }, [faunaPoints]);

  return (
    <div className={cn('relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50', className)}>
      <MapContainer
        center={BRAZIL_CENTER}
        zoom={4}
        minZoom={3}
        maxZoom={10}
        zoomControl
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer attribution='&copy; OpenStreetMap contributors' url={BRASIL_TILE} />

        {geoJsonData && (
          <GeoJSON
            data={geoJsonData}
            style={(feature) => {
              const props = feature?.properties as { name?: string; sigla?: string } | undefined;
              const key = normalizeText(props?.sigla || props?.name || '');
              return getStateStyleIntensity();
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties as { name?: string; sigla?: string };
              const key = normalizeText(props?.sigla || props?.name || '');
              const intensity = stateIntensityMap[key];
              const suffix = intensity ? ` | Intensidade: ${intensity}` : '';
              layer.bindTooltip(`${props?.name || 'Estado'}${suffix}`, { direction: 'top' });
            }}
          />
        )}

        {showFire && sampledFirePoints.map((point, index) => {
          const color = getFireColor(point.intensity);
          return (
            <CircleMarker
              key={`fire-point-${index}`}
              center={[point.lat, point.lng]}
              radius={2}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.75,
                weight: 0.2,
              }}
            >
              {point.label && <Tooltip>{point.label}</Tooltip>}
            </CircleMarker>
          );
        })}

        {showFire && sampledFirePoints.length === 0 && fireHotspots.map((hotspot, index) => {
          const radius = Math.max(4, Math.min(18, hotspot.intensity / 6));
          const color = getFireColor(hotspot.intensity);
          return (
            <CircleMarker
              key={`${hotspot.name}-${index}`}
              center={[hotspot.lat, hotspot.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.6,
                weight: 1,
              }}
            >
              <Tooltip>
                {hotspot.name} | Intensidade: {hotspot.intensity}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {sampledFaunaPoints.map((point, index) => (
          <CircleMarker
            key={`fauna-point-${index}`}
            center={[point.lat, point.lng]}
            radius={3}
            pathOptions={{
              color: '#0f766e',
              fillColor: '#14b8a6',
              fillOpacity: 0.85,
              weight: 0.4,
            }}
          >
            {point.label && <Tooltip>{point.label}</Tooltip>}
          </CircleMarker>
        ))}

              </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 py-2 text-center text-[11px] uppercase tracking-[0.2em] text-slate-600 bg-white/80">
        Mapa real do Brasil (OpenStreetMap + GeoJSON de estados)
      </div>
    </div>
  );
}
