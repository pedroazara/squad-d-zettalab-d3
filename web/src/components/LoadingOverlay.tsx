import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Carregando...',
  size = 'md',
  overlay = true,
  className = ''
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = cn(
    'flex items-center justify-center',
    overlay && 'fixed inset-0 bg-black/50 z-50',
    !overlay && 'w-full h-full',
    className
  );

  const contentClasses = cn(
    'flex flex-col items-center gap-3',
    overlay && 'bg-white rounded-lg p-6 shadow-lg'
  );

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <Loader2 className={`animate-spin text-guarawatch-primary ${sizeClasses[size]}`} />
        <p className="text-guarawatch-muted text-sm font-medium">
          {message}
        </p>
      </div>
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={`animate-spin text-guarawatch-primary ${sizeClasses[size]} ${className}`} />
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  disabled = false,
  loadingText = 'Processando...',
  className = '',
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
        'bg-guarawatch-primary text-white hover:bg-guarawatch-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading ? loadingText : children}
    </button>
  );
};

// Component for loading cards with skeleton
interface LoadingCardProps {
  title?: string;
  lines?: number;
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title,
  lines = 3,
  className = ''
}) => {
  return (
    <div className={cn('bg-white rounded-lg p-6 shadow-sm', className)}>
      {title && (
        <div className="mb-4">
          <div className="h-6 w-32 bg-guarawatch-bg rounded animate-pulse" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-guarawatch-bg rounded animate-pulse',
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
};

// Component for loading tables
interface LoadingTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({
  rows = 10,
  columns = 5,
  className = ''
}) => {
  return (
    <div className={cn('bg-white rounded-lg shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="border-b border-guarawatch-border p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-guarawatch-bg rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-guarawatch-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={cn(
                    'h-4 bg-guarawatch-bg rounded animate-pulse',
                    colIndex === columns - 1 ? 'w-3/4' : 'w-full'
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for loading charts
interface LoadingChartProps {
  height?: number;
  showLegend?: boolean;
  className?: string;
}

export const LoadingChart: React.FC<LoadingChartProps> = ({
  height = 300,
  showLegend = true,
  className = ''
}) => {
  return (
    <div className={cn('bg-white rounded-lg p-6 shadow-sm', className)}>
      <div className="mb-4">
        <div className="h-6 w-32 bg-guarawatch-bg rounded animate-pulse" />
      </div>
      
      {/* Chart Area */}
      <div className="relative">
        <div 
          className="w-full bg-guarawatch-bg rounded animate-pulse"
          style={{ height: `${height}px` }}
        />
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-guarawatch-muted">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-8 bg-guarawatch-bg rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex justify-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 bg-guarawatch-bg rounded animate-pulse" />
              <div className="h-4 w-16 bg-guarawatch-bg rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
