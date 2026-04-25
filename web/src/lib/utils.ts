import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type AreaScale = "ha" | "K ha" | "M ha" | "B ha";

const AREA_SCALE_THRESHOLDS: Array<{ label: AreaScale; divisor: number }> = [
  { label: "B ha", divisor: 1_000_000_000 },
  { label: "M ha", divisor: 1_000_000 },
  { label: "K ha", divisor: 1_000 },
  { label: "ha", divisor: 1 },
];

export const getAreaScale = (valueInHa: number): { label: AreaScale; divisor: number } => {
  const absolute = Math.abs(valueInHa);
  return AREA_SCALE_THRESHOLDS.find((scale) => absolute >= scale.divisor) ?? AREA_SCALE_THRESHOLDS[3];
};

export const formatAreaHa = (valueInHa: number, fractionDigits = 2) => {
  const { label, divisor } = getAreaScale(valueInHa);
  const scaled = valueInHa / divisor;
  return `${scaled.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  })} ${label}`;
};
