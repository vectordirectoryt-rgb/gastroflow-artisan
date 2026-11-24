import React, { useState } from 'react';
import { Pedido, Receta, EstadoPedido } from '../../core/types';
import { formatCOP, formatFecha } from '../../core/utils/formatters';
import { Plus, Search, MessageSquare, CheckCircle, Clock, ChefHat, PackageCheck, AlertCircle, Store, MapPin, Gift, Layers } from 'lucide-react';

interface PedidosViewProps {
  pedidos: Pedido[];
  recetas: Receta[];
  onNuevoPedido: () => void;
  onCambiarEstado: (id: string, nuevoEstado: EstadoPedido) => void;
  onCobrarResto: (id: string) => void;
  onAbrirWhatsApp: (pedido: Pedido) => void;
  onIrACocina?: () => void;
}

export const PedidosView: React.FC<PedidosViewProps> = ({
  pedidos,
  recetas,
  onNuevoPedido,
  onCambiarEstado,
  onCobrarResto,
  onAbrirWhatsApp,
  onIrACocina,
}) => {
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const recetasMap = new Map(recetas.map((r) => [r.id, r]));

  // Filtrado de pedidos
  const pedidosFiltrados = pedidos.filter((p) => {
    const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const coincideTexto =
      p.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.notas && p.notas.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideEstado && coincideTexto;
  });

  const getBadgeEstado = (estado: EstadoPedido) => {
    switch (estado) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
      case 'en_preparacion':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <ChefHat className="w-3 h-3" /> En Preparación
          </span>
        );
      case 'terminado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <PackageCheck className="w-3 h-3" /> Terminado / Listo
          </span>
        );
      case 'entregado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Entregado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" data-testid="pedidos-view">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Libreta de Encargos & Pedidos</h1>
          <p className="text-sm text-slate-500">
            Control de fechas prometidas, pagos de anticipo y entrega a clientes.
          </p>
        </div>
        <button
          onClick={onNuevoPedido}
          data-testid="btn-nuevo-pedido"
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Encargo / Pedido</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'en_preparacion', label: 'En Preparación' },
            { id: 'terminado', label: 'Listos' },
            { id: 'entregado', label: 'Entregados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filtroEstado === tab.id
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
            placeholder="Buscar por cliente o detalle..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Grid de Tarjetas de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pedidosFiltrados.map((pedido) => {
          const receta = recetasMap.get(pedido.receta_id);
          const tieneSaldo = pedido.saldo_pendiente > 0;
          const tieneItems = pedido.items && pedido.items.length > 0;

          // Extraer información enriquecida de notas
          const lineasNotas = (pedido.notas || '').split('\n');
          const dedicatoria = pedido.mensaje_tarjeta || lineasNotas.find((l) => l.startsWith('[DEDICATORIA:'))?.replace('[DEDICATORIA:', '').replace(/\]$/, '').trim();
          const entregaStr = pedido.metodo_entrega === 'domicilio'
            ? `Domicilio: ${pedido.direccion_entrega || ''} ${pedido.barrio_entrega ? `(${pedido.barrio_entrega})` : ''}`.trim()
            : pedido.metodo_entrega === 'recoger'
            ? 'Recoger en Taller'
            : lineasNotas.find((l) => l.startsWith('[ENTREGA:'))?.replace('[ENTREGA:', '').replace(/\]$/, '').trim();
          const esModoMixto = pedido.modo_entrega_mixta === 'separado' || (pedido.notas || '').includes('MODO ENTREGA: En 2 Entregas');
          const notasLibres = lineasNotas
            .filter((l) => !l.startsWith('[ITEMS:') && !l.startsWith('[ENTREGA:') && !l.startsWith('[DEDICATORIA:') && !l.startsWith('[MODO ENTREGA:'))
            .join(' ')
            .trim();

          return (
            <div
              key={pedido.id}
              data-testid={`card-pedido-${pedido.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Cabecera de la tarjeta */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{pedido.cliente_nombre}</h3>
                    <p className="text-xs text-slate-500">{pedido.cliente_telefono || 'Sin teléfono'}</p>
                  </div>
                  <div>{getBadgeEstado(pedido.estado)}</div>
                </div>

                {/* Métodos de Entrega y Badges */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {entregaStr && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      {entregaStr.toLowerCase().includes('domicilio') ? (
                        <MapPin className="w-3 h-3 text-[#A472B9]" />
                      ) : (
                        <Store className="w-3 h-3 text-[#B6BD90]" />
                      )}
                      <span>{entregaStr}</span>
                    </span>
                  )}
                  {esModoMixto && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                      <Layers className="w-3 h-3 text-amber-600" />
                      <span>2 Entregas (Vitrina + Horneo)</span>
                    </span>
                  )}
                </div>

                {/* Detalle del producto (Soporta múltiples items o producto individual) */}
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs space-y-2">
                  {tieneItems ? (
                    <div className="space-y-1.5 divide-y divide-amber-200/50">
                      {pedido.items!.map((item, idx) => (
                        <div key={idx} className={`${idx > 0 ? 'pt-1.5' : ''} flex items-start justify-between gap-2`}>
                          <div>
                            <span className="font-bold text-amber-950 block">
                              {item.cantidad}x {item.receta_nombre}
                            </span>
                            {item.detalles_variante && (
                              <span className="text-[10px] text-amber-800/80 block">
                                {item.detalles_variante}
                              </span>
                            )}
                            {item.empaque_sugerido?.nombre_caja && (
                              <span className="text-[9px] text-[#A472B9] font-medium block">
                                📦 {item.empaque_sugerido.nombre_caja}
                              </span>
                            )}
                          </div>
                          <span className="font-black text-amber-900 text-xs flex-shrink-0">
                            {formatCOP(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-amber-950 block">
                        {pedido.cantidad}x {receta?.nombre || 'Producto personalizado'}
                      </span>
                    </div>
                  )}

                  {/* Tarjeta de Regalo / Dedicatoria */}
                  {dedicatoria && (
                    <div className="p-2 bg-white/90 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#A472B9] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-[10px] text-[#A472B9] uppercase">Dedicatoria para tarjeta:</span>
                        <span className="italic">"{dedicatoria}"</span>
                      </div>
                    </div>
                  )}

                  {notasLibres && (
                    <p className="mt-1 text-amber-800 italic text-[11px]">"{notasLibres}"</p>
                  )}

                  {pedido.insumos_descontados ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200">
                      ✓ Insumos descontados de bodega
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                      ⏳ Insumos en bodega sin descontar
                    </span>
                  )}
                </div>

                {/* Fecha y Hora de Entrega */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Fecha entrega:</span>
                    <span className="font-semibold text-slate-800">
                      {formatFecha(pedido.fecha_entrega)} a las {pedido.hora_entrega || '12:00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total encargo:</span>
                    <span className="font-bold text-slate-900">{formatCOP(pedido.precio_total)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Abono inicial:</span>
                    <span className="text-emerald-700 font-semibold">{formatCOP(pedido.abono)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-400">Saldo pendiente:</span>
                    <span
                      data-testid={`saldo-${pedido.id}`}
                      className={`font-bold ${tieneSaldo ? 'text-rose-600' : 'text-emerald-600'}`}
                    >
                      {tieneSaldo ? `Falta cobrar: ${formatCOP(pedido.saldo_pendiente)}` : 'Pagado 100%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2">
                {tieneSaldo && (
                  <button
                    onClick={() => onCobrarResto(pedido.id)}
                    data-testid={`btn-cobrar-${pedido.id}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                  >
                    💰 Cobrar Resto ({formatCOP(pedido.saldo_pendiente)})
                  </button>
                )}

                {onIrACocina && pedido.estado === 'pendiente' && !pedido.insumos_descontados && (
                  <button
                    type="button"
                    onClick={onIrACocina}
                    className="w-full bg-[#ECEBCF] hover:bg-[#DDDABA] text-[#22221E] py-1.5 rounded-lg text-xs font-bold transition border border-[#DDDABA] flex items-center justify-center gap-1.5"
                    title="Ir a mesa de cocina para hornear tanda y descontar insumos de bodega"
                  >
                    <span>👨‍🍳 Pasar a Cocina / Hornear</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAbrirWhatsApp(pedido)}
                    className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg text-xs font-semibold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <select
                    value={pedido.estado}
                    data-testid={`select-estado-${pedido.id}`}
                    onChange={(e) => onCambiarEstado(pedido.id, e.target.value as EstadoPedido)}
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 py-1.5 px-2 focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="pendiente">🟡 Pendiente</option>
                    <option value="en_preparacion">🔥 En Preparación</option>
                    <option value="terminado">📦 Terminado</option>
                    <option value="entregado">✅ Entregado</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}

        {pedidosFiltrados.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No se encontraron encargos</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba cambiando los filtros o registra uno nuevo con el botón superior.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
