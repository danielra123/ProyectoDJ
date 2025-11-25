import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';

/**
 * DataTable Component
 *
 * Componente de tabla reutilizable con las siguientes características:
 * - Búsqueda global en todos los campos
 * - Filtros por columna específica
 * - Ordenamiento ascendente/descendente
 * - Paginación configurable
 * - Responsive design
 *
 * @param {Object} props
 * @param {Array} props.data - Array de objetos con los datos
 * @param {Array} props.columns - Configuración de columnas
 *   Ejemplo: [
 *     { key: 'id', header: 'ID', sortable: true, filterable: true },
 *     { key: 'name', header: 'Nombre', sortable: true, filterable: true, render: (value, row) => <span>{value}</span> }
 *   ]
 * @param {number} props.itemsPerPage - Elementos por página (default: 10)
 * @param {boolean} props.searchable - Habilitar búsqueda global (default: true)
 * @param {boolean} props.paginated - Habilitar paginación (default: true)
 * @param {string} props.emptyMessage - Mensaje cuando no hay datos (default: 'No hay datos disponibles')
 */
export default function DataTable({
  data = [],
  columns = [],
  itemsPerPage = 10,
  searchable = true,
  paginated = true,
  emptyMessage = 'No hay datos disponibles'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);

  // Función para obtener valor anidado usando dot notation (ej: 'owner.name')
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Filtrado y búsqueda
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Aplicar búsqueda global
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = getNestedValue(row, col.key);
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Aplicar filtros por columna
    Object.entries(columnFilters).forEach(([key, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter(row => {
          const value = getNestedValue(row, key);
          return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    return filtered;
  }, [data, searchTerm, columnFilters, columns]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = paginated ? sortedData.slice(startIndex, endIndex) : sortedData;

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset a primera página cuando se filtra
  };

  const clearFilter = (key) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp size={16} className="sort-icon" />
    ) : (
      <ChevronDown size={16} className="sort-icon" />
    );
  };

  const hasActiveFilters = Object.keys(columnFilters).length > 0 || searchTerm;

  return (
    <div className="datatable-container">
      {/* Barra de controles superior */}
      <div className="datatable-controls">
        <div className="datatable-controls-left">
          {searchable && (
            <div className="datatable-search">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar en todos los campos..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="datatable-search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="datatable-clear-btn"
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`datatable-filter-toggle ${showFilters ? 'active' : ''}`}
            title="Mostrar/Ocultar filtros"
          >
            <Filter size={18} />
            Filtros
            {Object.keys(columnFilters).length > 0 && (
              <span className="filter-badge">{Object.keys(columnFilters).length}</span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="datatable-clear-all-btn"
              title="Limpiar todos los filtros"
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="datatable-controls-right">
          <span className="datatable-results-count">
            {sortedData.length} {sortedData.length === 1 ? 'resultado' : 'resultados'}
          </span>

          {paginated && (
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="datatable-rows-select"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          )}
        </div>
      </div>

      {/* Filtros por columna */}
      {showFilters && (
        <div className="datatable-column-filters">
          {columns.filter(col => col.filterable).map(col => (
            <div key={col.key} className="datatable-column-filter">
              <label className="filter-label">{col.header}</label>
              <div className="filter-input-wrapper">
                <input
                  type="text"
                  placeholder={`Filtrar ${col.header.toLowerCase()}...`}
                  value={columnFilters[col.key] || ''}
                  onChange={(e) => handleFilterChange(col.key, e.target.value)}
                  className="datatable-filter-input"
                />
                {columnFilters[col.key] && (
                  <button
                    onClick={() => clearFilter(col.key)}
                    className="datatable-clear-btn"
                    title="Limpiar filtro"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="datatable-th-content">
                    {col.header}
                    {col.sortable && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="datatable-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(getNestedValue(row, col.key), row)
                        : getNestedValue(row, col.key) || '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginated && sortedData.length > 0 && totalPages > 1 && (
        <div className="datatable-pagination">
          <div className="pagination-info">
            Mostrando {startIndex + 1} - {Math.min(endIndex, sortedData.length)} de {sortedData.length}
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Primera página"
            >
              <ChevronsLeft size={18} />
            </button>

            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>

            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
              title="Última página"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
