import React, { useState } from 'react';
import { Insumo } from '../../core/types';
import { getInsumoCostoUnitario } from '../../core/utils/calculations';
import { formatCOP } from '../../core/utils/formatters';
import { Plus, Search, ShoppingBag, Trash2, Edit2 } from 'lucide-react';

interface BodegaViewProps {
  insumos: Insumo[];
  onNuevoInsumo: () => void;
  onEditarInsumo: (insumo: Insumo) => void;
  onRegistrarCompra: (insumo: Insumo) => void;
  onRegistrarMerma: (insumo: Insumo) => void;
}

export const BodegaView: React.FC<BodegaViewProps> = ({
  insumos,
  onNuevoInsumo,
  onEditarInsumo,
  onRegistrarCompra,
  onRegistrarMerma,
}) => {
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const insumosFiltrados = insumos.filter((i) => {
    const coincideTexto = i.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo =
      filtroTipo === 'todos' ||
      (filtroTipo === 'materia_prima' && (!i.tipo || i.tipo === 'materia_prima')) ||
      (filtroTipo === 'empaque' && i.tipo === 'empaque');
    return coincideTexto && coincideTipo;
  });

  // Ordenar para mostrar primero agotados y críticos
  const insumosOrdenados = [...insumosFiltrados].sort((a, b) => {
    const criticoA = a.stock_actual <= a.stock_min ? 1 : 0;
    const criticoB = b.stock_actual <= b.stock_min ? 1 : 0;
    return criticoB - criticoA;
  });

  return (
    <div className="space-y-6" data-testid="bodega-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bodega, Insumos & Empaques</h1>
          <p className="text-sm text-slate-500">
            Control de materias primas, costos de presentación y alertas de inventario.
          </p>
        </div>
        <button
          onClick={onNuevoInsumo}
          data-testid="btn-nuevo-insumo"
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Insumo</span>
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          {[
            { id: 'todos', label: 'Todos los Insumos' },
            { id: 'materia_prima', label: 'Materias Primas' },
            { id: 'empaque', label: 'Empaques' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filtroTipo === tab.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Insumo</th>
                <th className="py-3.5 px-4">Estado Stock</th>
                <th className="py-3.5 px-4">Stock Actual</th>
                <th className="py-3.5 px-4">Mínimo</th>
                <th className="py-3.5 px-4">Costo Empaque</th>
                <th className="py-3.5 px-4">Costo Unitario</th>
                <th className="py-3.5 px-4 text-right">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insumosOrdenados.map((insumo) => {
                const costoUnitario = getInsumoCostoUnitario(insumo);
                const agotado = insumo.stock_actual <= 0;
                const bajo = !agotado && insumo.stock_actual <= insumo.stock_min;

                return (
                  <tr key={insumo.id} className="hover:bg-slate-50/70 transition" data-testid={`row-insumo-${insumo.id}`}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{insumo.nombre}</span>
                        {insumo.tipo === 'empaque' && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                            Empaque
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {agotado ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          🔴 Agotado
                        </span>
                      ) : bajo ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          🟡 Stock Bajo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          🟢 Óptimo
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {insumo.stock_actual} {insumo.unidad}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {insumo.stock_min} {insumo.unidad}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatCOP(insumo.costo_empaque)} / {insumo.gramos_por_empaque} {insumo.unidad}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCOP(costoUnitario)} / {insumo.unidad}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onRegistrarCompra(insumo)}
                          data-testid={`btn-compra-${insumo.id}`}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                          title="Registrar Compra / Reposición"
                        >
                          <ShoppingBag className="w-3 h-3" /> + Compra
                        </button>

                        <button
                          onClick={() => onRegistrarMerma(insumo)}
                          data-testid={`btn-merma-${insumo.id}`}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 flex items-center gap-1 transition"
                          title="Registrar Merma / Accidente"
                        >
                          <Trash2 className="w-3 h-3" /> - Merma
                        </button>

                        <button
                          onClick={() => onEditarInsumo(insumo)}
                          data-testid={`btn-editar-${insumo.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          title="Editar detalles"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
