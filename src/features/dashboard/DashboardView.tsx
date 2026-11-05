import React from 'react';
import { Insumo, Receta, Pedido, Merma } from '../../core/types';
import { calculateRecipeCost } from '../../core/utils/calculations';
import { formatCOP } from '../../core/utils/formatters';
import { TrendingUp, DollarSign, AlertTriangle, Sparkles, Award, Clock, ArrowRight } from 'lucide-react';

interface DashboardViewProps {
  insumos: Insumo[];
  recetas: Receta[];
  pedidos: Pedido[];
  mermas: Merma[];
  tarifaKwh: number;
  onIrAPedidos: () => void;
  onIrACocina: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  insumos,
  recetas,
  pedidos,
  mermas,
  tarifaKwh,
  onIrAPedidos,
  onIrACocina,
}) => {
  // 1. Facturación Bruta (pedidos entregados)
  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado');
  const facturacionBruta = pedidosEntregados.reduce((sum, p) => sum + p.precio_total, 0);

  // 2. Costo de Insumos (COGS) de lo vendido
  const recetasMap = new Map(recetas.map((r) => [r.id, r]));
  const costoInsumosVendidos = pedidosEntregados.reduce((sum, p) => {
    const receta = recetasMap.get(p.receta_id);
    if (!receta) return sum;
    const costeo = calculateRecipeCost(receta, insumos, tarifaKwh);
    return sum + costeo.costoIngredientes * p.cantidad;
  }, 0);

  // 3. Pérdidas por Mermas
  const totalMermas = mermas.reduce((sum, m) => sum + m.costo_perdido, 0);

  // 4. Ganancia Real Neta
  const gananciaRealNeta = facturacionBruta - costoInsumosVendidos - totalMermas;

  // 5. Ránkings: Producto Estrella (Mayor sueldo por hora)
  const recetasConCosteo = recetas.map((r) => ({
    receta: r,
    costeo: calculateRecipeCost(r, insumos, tarifaKwh),
  }));

  const productoEstrella = [...recetasConCosteo].sort(
    (a, b) => b.costeo.sueldoPorHora - a.costeo.sueldoPorHora
  )[0];

  // 6. Agenda de entregas de HOY
  const hoyStr = new Date().toISOString().split('T')[0];
  const entregasHoy = pedidos.filter((p) => p.fecha_entrega === hoyStr && p.estado !== 'entregado');

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-view">
      {/* Bienvenida y Resumen del Día */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/15">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">☕ Buenos días, Maestra Pastelera</h1>
            <p className="mt-1 text-amber-100 text-sm max-w-xl">
              Aquí tienes la radiografía financiera y operativa de tu taller. Todo calculado al centavo.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onIrACocina}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-xs transition"
            >
              Pase a Cocina 🔥
            </button>
            <button
              onClick={onIrAPedidos}
              className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-2 rounded-xl text-sm font-semibold shadow-xs transition"
            >
              Ver Encargos 📅
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas KPIs Financieros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facturación */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Facturación Cobrada</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900" data-testid="kpi-facturacion">
            {formatCOP(facturacionBruta)}
          </div>
          <p className="mt-1 text-xs text-slate-500">De pedidos marcados como entregados</p>
        </div>

        {/* Costo Insumos COGS */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Costo Insumos (COGS)</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900" data-testid="kpi-cogs">
            {formatCOP(costoInsumosVendidos)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Materia prima y cajas utilizadas</p>
        </div>

        {/* Pérdidas por Mermas */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pérdidas por Mermas</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600" data-testid="kpi-mermas">
            {formatCOP(totalMermas)}
          </div>
          <p className="mt-1 text-xs text-slate-500">{mermas.length} incidentes registrados</p>
        </div>

        {/* Ganancia Real Neta */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold uppercase tracking-wider">
            <span>Ganancia Real Neta</span>
            <span className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-900" data-testid="kpi-ganancia-neta">
            {formatCOP(gananciaRealNeta)}
          </div>
          <p className="mt-1 text-xs text-amber-700">Libre en bolsillo tras deducir costos</p>
        </div>
      </div>

      {/* Grid de Secciones: Agenda del Día y Producto Estrella */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agenda de Entregas de Hoy (2 columnas en desktop) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">☀️ Agenda de Entregas para Hoy</h2>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold">
              {entregasHoy.length} pedidos hoy
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {entregasHoy.length > 0 ? (
              entregasHoy.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">
                        {p.hora_entrega || 'Hora por definir'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{p.cliente_nombre}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {p.cantidad}x {recetasMap.get(p.receta_id)?.nombre || 'Producto'} • {p.notas || 'Sin notas especiales'}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center sm:text-right space-x-3 sm:space-x-4">
                    <div>
                      <span className="text-xs text-slate-400 block">Saldo pendiente</span>
                      <span className={`text-sm font-bold ${p.saldo_pendiente > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {p.saldo_pendiente > 0 ? formatCOP(p.saldo_pendiente) : 'Pagado 100%'}
                      </span>
                    </div>
                    <button
                      onClick={onIrAPedidos}
                      className="text-xs bg-white text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 px-3 py-1.5 rounded-lg font-medium shadow-xs"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                ☕ No hay entregas programadas para hoy. Día perfecto para horneo o abastecimiento de bodega.
              </div>
            )}
          </div>
        </div>

        {/* Tarjeta Producto Estrella */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Producto Estrella</span>
            </div>
            {productoEstrella ? (
              <>
                <h3 className="mt-3 text-lg font-bold text-white leading-snug">
                  {productoEstrella.receta.nombre}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Es tu preparación más eficiente: la que más dinero libre aporta a tu bolsillo por cada 60 minutos de trabajo.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700 text-xs">
                    <span className="text-slate-400">Sueldo Real por Hora:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {formatCOP(productoEstrella.costeo.sueldoPorHora)} / hr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700 text-xs">
                    <span className="text-slate-400">Margen Porcentual:</span>
                    <span className="text-amber-300 font-bold">
                      {productoEstrella.costeo.margenPorcentual.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs">
                    <span className="text-slate-400">Precio de Venta:</span>
                    <span className="text-white font-bold">
                      {formatCOP(productoEstrella.receta.precio_venta)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-4 text-xs text-slate-400">No hay recetas costeadas aún.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
            <span>¿Quieres optimizarlo más?</span>
            <button onClick={onIrAPedidos} className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1">
              Promover en Pedidos <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
