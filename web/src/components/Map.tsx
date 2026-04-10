import { cn } from "@/lib/utils";

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
}

const mapBounds = {
  latMin: -35,
  latMax: 5,
  lngMin: -75,
  lngMax: -34,
};

function toMapPercent(lat: number, lng: number) {
  const top = ((mapBounds.latMax - lat) / (mapBounds.latMax - mapBounds.latMin)) * 100;
  const left = ((lng - mapBounds.lngMin) / (mapBounds.lngMax - mapBounds.lngMin)) * 100;
  return { top: `${top}%`, left: `${left}%` };
}

export function MockBrazilMap({
  className,
  highlight = null,
  showFire = true,
  fireHotspots = [],
}: MockBrazilMapProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200" />
      <svg viewBox="0 0 360 450" className="relative block w-full h-full" preserveAspectRatio="xMidYMid meet">
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
        {showFire && fireHotspots.map((hotspot, index) => {
          const { top, left } = toMapPercent(hotspot.lat, hotspot.lng);
          const size = Math.max(10, Math.min(26, hotspot.intensity / 3));
          return (
            <g key={index} transform={`translate(${left}, ${top})`}>
              <circle cx="0" cy="0" r={size} fill="rgba(220,38,38,0.28)" />
              <circle cx="0" cy="0" r={Math.max(4, size / 2)} fill="#DC2626" stroke="#fff" strokeWidth="1.5" />
            </g>
          );
        })}
        {highlight && (() => {
          const { top, left } = toMapPercent(highlight.lat, highlight.lng);
          return (
            <g>
              <circle cx="0" cy="0" r="14" fill="#2563EB" transform={`translate(${left}, ${top})`} opacity="0.9" />
              <circle cx="0" cy="0" r="6" fill="#EFF6FF" transform={`translate(${left}, ${top})`} />
              <text
                x="0"
                y="-18"
                fill="#0F172A"
                fontSize="14"
                textAnchor="middle"
                transform={`translate(${left}, ${top})`}
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
