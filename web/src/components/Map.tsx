import { cn } from "@/lib/utils";

interface MapGeometry {
  id: string;
  coordinates: Array<{ lat: number; lng: number }>;
  fill?: string;
  stroke?: string;
  label?: string;
}

interface MockBrazilMapProps {
  className?: string;
  highlight?: {
    lat: number;
    lng: number;
    label: string;
  } | null;
  showFire?: boolean;
  fireHotspots?: Array<{
    name: string;
    lat: number;
    lng: number;
    intensity: number;
  }>;
  showOverlay?: boolean;
  overlayGeometries?: MapGeometry[];
}

const mapBounds = {
  latMin: -35,
  latMax: 5,
  lngMin: -75,
  lngMax: -34,
};

const viewSize = {
  width: 360,
  height: 450,
};

function toMapPercent(lat: number, lng: number) {
  const top = ((mapBounds.latMax - lat) / (mapBounds.latMax - mapBounds.latMin)) * 100;
  const left = ((lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * 100;
  return { top: `${top}%`, left: `${left}%` };
}

function toMapPoint(lat: number, lng: number) {
  const x = ((lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * viewSize.width;
  const y = ((mapBounds.latMax - lat) / (mapBounds.latMax - mapBounds.latMin)) * viewSize.height;
  return { x, y };
}

function buildPolygonPoints(coordinates: Array<{ lat: number; lng: number }>) {
  return coordinates
    .map((coordinate) => {
      const point = toMapPoint(coordinate.lat, coordinate.lng);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function getCentroid(coordinates: Array<{ lat: number; lng: number }>) {
  const sum = coordinates.reduce(
    (acc, current) => {
      const point = toMapPoint(current.lat, current.lng);
      return { x: acc.x + point.x, y: acc.y + point.y };
    },
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / coordinates.length,
    y: sum.y / coordinates.length,
  };
}

const defaultOverlayGeometries: MapGeometry[] = [
  {
    id: 'amazon-corredor',
    label: 'Corredor Amazônia',
    fill: 'rgba(34, 197, 94, 0.18)',
    stroke: '#22c55e',
    coordinates: [
      { lat: -4.5, lng: -63.5 },
      { lat: -3.0, lng: -59.0 },
      { lat: -7.5, lng: -55.5 },
      { lat: -10.5, lng: -61.0 },
    ],
  },
  {
    id: 'cerrado-zona',
    label: 'Zona de Queimadas',
    fill: 'rgba(251, 191, 36, 0.18)',
    stroke: '#f59e0b',
    coordinates: [
      { lat: -13.5, lng: -54.5 },
      { lat: -15.5, lng: -50.0 },
      { lat: -17.5, lng: -52.5 },
      { lat: -16.0, lng: -57.0 },
    ],
  },
]

export function MockBrazilMap({
  className,
  highlight = null,
  showFire = true,
  fireHotspots = [],
  showOverlay = false,
  overlayGeometries,
}: MockBrazilMapProps) {
  const geometries = showOverlay ? overlayGeometries || defaultOverlayGeometries : [];

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200" />
      <svg viewBox="0 0 360 450" className="relative z-10 block h-full w-full" preserveAspectRatio="xMidYMid meet">
        <path
          d="M80 40 Q40 120 60 210 L45 290 C50 320 80 350 120 380 L170 410 C190 420 220 415 240 400 L280 365 C300 340 320 300 310 260 L290 210 C310 160 280 120 250 90 L200 70 C170 60 140 55 110 60 Z"
          fill="#E5E7EB"
          stroke="#94A3B8"
          strokeWidth="2"
        />
        <g opacity={0.55}>
          <ellipse cx="170" cy="140" rx="70" ry="34" fill="#FCA5A5" />
          <ellipse cx="105" cy="280" rx="52" ry="22" fill="#FECACA" />
          <ellipse cx="250" cy="310" rx="60" ry="26" fill="#FECACA" />
        </g>
        {geometries.map((geometry) => {
          const points = buildPolygonPoints(geometry.coordinates);
          const centroid = getCentroid(geometry.coordinates);
          return (
            <g key={geometry.id} opacity={0.8}>
              <polygon
                points={points}
                fill={geometry.fill}
                stroke={geometry.stroke}
                strokeWidth="2"
                opacity="0.35"
              />
              <text
                x={centroid.x}
                y={centroid.y}
                fill="#ffffff"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
                pointerEvents="none"
              >
                {geometry.label}
              </text>
            </g>
          );
        })}
        {showFire && fireHotspots.map((hotspot, index) => {
          const point = toMapPoint(hotspot.lat, hotspot.lng);
          const size = Math.max(10, Math.min(26, hotspot.intensity / 3));
          return (
            <g key={index} transform={`translate(${point.x}, ${point.y})`}>
              <circle cx="0" cy="0" r={size} fill="rgba(220,38,38,0.28)" />
              <circle cx="0" cy="0" r={Math.max(4, size / 2)} fill="#DC2626" stroke="#fff" strokeWidth="1.5" />
            </g>
          );
        })}
        {highlight && (() => {
          const point = toMapPoint(highlight.lat, highlight.lng);
          return (
            <g>
              <circle cx="0" cy="0" r="14" fill="#2563EB" transform={`translate(${point.x}, ${point.y})`} opacity="0.9" />
              <circle cx="0" cy="0" r="6" fill="#EFF6FF" transform={`translate(${point.x}, ${point.y})`} />
              <text
                x="0"
                y="-18"
                fill="#0F172A"
                fontSize="14"
                textAnchor="middle"
                transform={`translate(${point.x}, ${point.y})`}
              >
                {highlight.label}
              </text>
            </g>
          );
        })()}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 py-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
        Mapa mockado do Brasil com foco de incêndios
      </div>
    </div>
  );
}
