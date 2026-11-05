import React, { useState } from 'react';
import { Merma, Pedido, Insumo } from '../../core/types';
import { formatCOP, formatFecha } from '../../core/utils/formatters';
import { Trash2, CheckCircle2, TrendingUp } from 'lucide-react';

interface HistorialViewProps {
  mermas: Merma[];
  pedidos: Pedido[];
  insumos: Insumo[];
}

export const HistorialView: React.FC<HistorialViewProps> = ({ mermas, pedidos, insumos }) => {
  const [subVista, setSubVista] = useState<'mermas' | 'pedidos' | 'precios'>('mermas');

  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado');

  return (
    <div className="space-y-6" data-testid="historial-view">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historial, Mermas & Auditoría</h1>
        <p className="text-sm text-slate-500">
          Trazabilidad completa de incidentes, entregas finalizadas y fluctuación de costos de proveedores.
        </p>
      </div>

      {/* Tabs de Sub-Vistas */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubVista('mermas')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subVista === 'mermas' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Bitácora de Mermas ({mermas.length})</span>
        </button>

        <button
          onClick={() => setSubVista('pedidos')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subVista === 'pedidos' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pedidos Entregados ({pedidosEntregados.length})</span>
        </button>

        <button
          onClick={() => setSubVista('precios')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            subVista === 'precios' ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Variación de Precios Insumos</span>
        </button>
      </div>

      {/* Contenido según pestaña */}
      {subVista === 'mermas' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Insumo</th>
                <th className="py-3 px-4">Cantidad Desperdiciada</th>
                <th className="py-3 px-4">Motivo / Causa</th>
                <th className="py-3 px-4 text-right">Dinero Perdido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mermas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500">{formatFecha(m.fecha)}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{m.insumo_nombre}</td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.cantidad} {m.unidad}
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">{m.motivo || 'No especificado'}</td>
                  <td className="py-3 px-4 text-right font-black text-rose-600">
                    {formatCOP(m.costo_perdido)}
                  </td>
                </tr>
              ))}
              {mermas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    ✨ No hay mermas registradas. ¡Excelente conservación de ingredientes!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subVista === 'pedidos' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Fecha Entrega</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Cantidad</th>
                <th className="py-3 px-4">Estado Cobro</th>
                <th className="py-3 px-4 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pedidosEntregados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500">{formatFecha(p.fecha_entrega)}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{p.cliente_nombre}</td>
                  <td className="py-3 px-4 text-slate-600">{p.cantidad} und</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Pagado 100%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">
                    {formatCOP(p.precio_total)}
                  </td>
                </tr>
              ))}
              {pedidosEntregados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    📦 Aún no hay pedidos marcados como entregados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subVista === 'precios' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Variación y Alzas de Costo Registradas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insumos.map((i) => (
              <div key={i.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>{i.nombre}</span>
                  <span className="text-amber-700">{formatCOP(i.costo_empaque)}</span>
                </div>
                <div className="mt-2 text-slate-500">
                  {i.historial_precios && i.historial_precios.length > 0 ? (
                    <div className="space-y-1">
                      {i.historial_precios.map((h, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>{formatFecha(h.fecha)}</span>
                          <span className="font-semibold text-slate-700">{formatCOP(h.costo)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Sin alzas de precio registradas</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
