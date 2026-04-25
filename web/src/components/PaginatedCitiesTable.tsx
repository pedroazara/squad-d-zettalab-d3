import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import type { StateMunicipalityRow } from '@/types/api';

interface PaginatedCitiesTableProps {
  cities: StateMunicipalityRow[];
  loading?: boolean;
}

const ITEMS_PER_PAGE = 15;

export function PaginatedCitiesTable({ cities, loading = false }: PaginatedCitiesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(cities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCities = cities.slice(startIndex, endIndex);

  const getRiskBadgeClass = (risco: number) => {
    if (risco < 30) return 'bg-green-100 text-green-800';
    if (risco < 55) return 'bg-yellow-100 text-yellow-800';
    if (risco < 75) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        items.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }

    return items;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-guarawatch-primary mb-4">
          Cidades do Estado
        </h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-guarawatch-primary"></div>
          <p className="text-guarawatch-muted mt-2">Carregando cidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-heading text-lg font-semibold text-guarawatch-primary">
          Cidades do Estado ({cities.length} cidades)
        </h2>
        <div className="text-sm text-guarawatch-muted">
          Mostrando {startIndex + 1}-{Math.min(endIndex, cities.length)} de {cities.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-guarawatch-primary">Cidade</th>
              <th className="text-left py-3 px-4 font-semibold text-guarawatch-primary">Área Queimada (ha)</th>
              <th className="text-left py-3 px-4 font-semibold text-guarawatch-primary">Score de Risco</th>
              <th className="text-left py-3 px-4 font-semibold text-guarawatch-primary">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentCities.map((city, index) => (
              <tr key={`${city.nome}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-guarawatch-text">{city.nome}</td>
                <td className="py-3 px-4 font-mono text-guarawatch-text">
                  {city.areaQueimada.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskBadgeClass(city.risco)}`}
                  >
                    {city.risco.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    city.areaQueimada > 0 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {city.areaQueimada > 0 ? 'Afetada' : 'Normal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-guarawatch-muted">Nenhuma cidade encontrada para este estado.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>

              {getPaginationItems().map((item, index) => {
                if (item === 'ellipsis') {
                  return (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={item as number}>
                    <PaginationLink
                      isActive={currentPage === item}
                      onClick={() => setCurrentPage(item as number)}
                      className="cursor-pointer"
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
