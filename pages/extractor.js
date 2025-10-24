import React, { useState, useMemo } from "react";
import {
  Upload,
  FileText,
  X,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

export default function TableExtractor() {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    filename: "",
    razonSocial: "",
    codigo: "",
    descripcion: "",
    cantidad: "",
    descuento: "",
  });

  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: null,
  });

  const parseTableFromText = (text, filename) => {
    const lines = text.split("\n");
    const rows = [];
    let inTableSection = false;
    let razonSocial = "";

    // First pass: find Razón Social
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("Razón Social")) {
        const match = line.match(/Razón Social\s*:\s*(.+)/);
        if (match) {
          razonSocial = match[1].trim();
          break;
        }
      }
    }

    // Second pass: extract table data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Look for the header line with the dashes before it
      if (
        line.includes("Código") &&
        line.includes("Descripción") &&
        line.includes("Cantidad") &&
        line.includes("Descuento")
      ) {
        inTableSection = true;
        continue;
      }

      // Skip the dashes line after header
      if (inTableSection && line.match(/^-{5,}/)) {
        continue;
      }

      // Parse data rows
      if (inTableSection && line.trim().length > 0) {
        // Stop if we hit another section or end
        if (line.match(/^[*=-]{3,}/) || line.includes("* ")) {
          break;
        }

        // Match pattern: codigo (10 digits) + description + cantidad + descuento
        const match = line.match(/^\s*(\d{10})\s+(.+?)\s+(\d+)\s+([\d.]+)\s*$/);

        if (match) {
          rows.push({
            filename: filename,
            razonSocial: razonSocial,
            codigo: match[1].trim(),
            descripcion: match[2].trim(),
            cantidad: match[3].trim(),
            descuento: match[4].trim(),
          });
        }
      }
    }

    return rows;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    const allRows = [];

    for (const file of files) {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        try {
          const text = await file.text();
          const rows = parseTableFromText(text, file.name);
          allRows.push(...rows);
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
        }
      }
    }

    setTableData(allRows);
    setLoading(false);
    e.target.value = "";
  };

  const clearData = () => {
    setTableData([]);
    setFilters({
      filename: "",
      razonSocial: "",
      codigo: "",
      descripcion: "",
      cantidad: "",
      descuento: "",
    });
    setSortConfig({ key: null, direction: null });
  };

  const handleFilterChange = (column, value) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData.filter((row) => {
      return (
        row.filename.toLowerCase().includes(filters.filename.toLowerCase()) &&
        row.razonSocial
          .toLowerCase()
          .includes(filters.razonSocial.toLowerCase()) &&
        row.codigo.toLowerCase().includes(filters.codigo.toLowerCase()) &&
        row.descripcion
          .toLowerCase()
          .includes(filters.descripcion.toLowerCase()) &&
        row.cantidad.toLowerCase().includes(filters.cantidad.toLowerCase()) &&
        row.descuento.toLowerCase().includes(filters.descuento.toLowerCase())
      );
    });

    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Try to parse as numbers for numeric columns
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        const isNumeric = !isNaN(aNum) && !isNaN(bNum);

        if (isNumeric) {
          return sortConfig.direction === "asc" ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [tableData, filters, sortConfig]);

  const exportToCSV = () => {
    const headers = [
      "Archivo",
      "Razón Social",
      "Código",
      "Descripción",
      "Cantidad",
      "Descuento",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedData.map((row) =>
        [
          `"${row.filename}"`,
          `"${row.razonSocial}"`,
          row.codigo,
          `"${row.descripcion}"`,
          row.cantidad,
          row.descuento,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tabla_extraida_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    if (sortConfig.direction === "asc") {
      return <ArrowUp className="w-4 h-4 text-indigo-600" />;
    }
    if (sortConfig.direction === "desc") {
      return <ArrowDown className="w-4 h-4 text-indigo-600" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-600" />
            Extractor de Tablas
          </h1>
          <p className="text-gray-600 mb-6">
            Sube múltiples archivos .txt para extraer y visualizar tablas con
            Código, Descripción, Cantidad y Descuento
          </p>

          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
              <Upload className="w-5 h-5" />
              <span>Seleccionar Archivos</span>
              <input
                type="file"
                multiple
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {tableData.length > 0 && (
              <>
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Exportar CSV
                </button>
                <button
                  onClick={clearData}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                  Limpiar Datos
                </button>
              </>
            )}
          </div>

          {loading && (
            <div className="mt-4 text-indigo-600 font-medium">
              Procesando archivos...
            </div>
          )}
        </div>

        {tableData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Datos Extraídos ({filteredAndSortedData.length} de{" "}
                {tableData.length} registros)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("filename")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Archivo
                        <SortIcon column="filename" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("razonSocial")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Razón Social
                        <SortIcon column="razonSocial" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("codigo")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Código
                        <SortIcon column="codigo" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("descripcion")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        Descripción
                        <SortIcon column="descripcion" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("cantidad")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors ml-auto"
                      >
                        Cantidad
                        <SortIcon column="cantidad" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("descuento")}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors ml-auto"
                      >
                        Descuento %
                        <SortIcon column="descuento" />
                      </button>
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.filename}
                        onChange={(e) =>
                          handleFilterChange("filename", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black "
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.razonSocial}
                        onChange={(e) =>
                          handleFilterChange("razonSocial", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black "
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.codigo}
                        onChange={(e) =>
                          handleFilterChange("codigo", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.descripcion}
                        onChange={(e) =>
                          handleFilterChange("descripcion", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.cantidad}
                        onChange={(e) =>
                          handleFilterChange("cantidad", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </th>
                    <th className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Filtrar..."
                        value={filters.descuento}
                        onChange={(e) =>
                          handleFilterChange("descuento", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedData.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-indigo-600 font-medium">
                        {row.filename}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {row.razonSocial}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {row.codigo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.descripcion}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {row.cantidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {row.descuento}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tableData.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              No hay datos para mostrar
            </p>
            <p className="text-gray-400 text-sm">
              Sube archivos .txt de CA para comenzar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
