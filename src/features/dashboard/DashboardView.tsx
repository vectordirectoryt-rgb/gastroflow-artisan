import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Insumo, Receta, Pedido, Merma, GastoFijo } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';

interface DashboardViewProps {
  insumos: Insumo[];
  recetas: Receta[];
  pedidos: Pedido[];
  mermas: Merma[];
  gastosFijos: GastoFijo[];
  tarifaKwh: number;
  onIrAPedidos: () => void;
  onIrACocina: () => void;
  onIrATienda: () => void;
  onNuevoPedido: () => void;
  onActualizarPedido: (pedido: Pedido) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  insumos,
  recetas,
  pedidos,
  mermas,
  gastosFijos,
  onIrAPedidos,
  onIrACocina,
  onIrATienda,
  onNuevoPedido,
  onActualizarPedido,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any>(null);
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'ano' | 'historico'>('historico');
  const [tipoGrafico, setTipoGrafico] = useState<'crecimiento' | 'ventas_producto' | 'ingresos_ganancia'>('crecimiento');
  const [metricaProducto, setMetricaProducto] = useState<'unidades' | 'dinero'>('unidades');
  const [filtroAgendaHoy, setFiltroAgendaHoy] = useState<'pendientes' | 'entregados' | 'todos'>('pendientes');

  // 1. MÉTRICAS PRINCIPALES
  const metricas = useMemo(() => {
    const pedidosActivos = pedidos.filter((p) => p.estado === 'pendiente' || p.estado === 'en_preparacion');
    const totalEncargosCOP = pedidosActivos.reduce((sum, p) => sum + p.precio_total, 0);
    const conteoActivos = pedidosActivos.length;

    const saldoPorCobrar = pedidos
      .filter((p) => p.estado !== 'cancelado')
      .reduce((sum, p) => sum + Math.max(0, p.precio_total - p.abono), 0);

    const valorBodega = insumos.reduce((sum, ins) => {
      const unit = ins.gramos_por_empaque > 0 ? ins.costo_empaque / ins.gramos_por_empaque : 0;
      return sum + ins.stock_actual * unit;
    }, 0);

    const totalMermasCOP = (mermas || []).reduce((sum, m) => sum + (m.costo_perdido ?? m.costo_total ?? 0), 0);

    // Gastos fijos activos (publicidad, etc.)
    const gastosActivos = (gastosFijos || []).filter((g) => g.activo);
    const totalGastosFijosCOP = gastosActivos.reduce((sum, g) => sum + g.monto_cop, 0);

    // Stock de anaquel disponible
    const totalAnaquelUnidades = recetas.reduce((sum, r) => sum + (r.stock_anaquel || 0), 0);
    const valorAnaquelCOP = recetas.reduce(
      (sum, r) => sum + (r.stock_anaquel || 0) * (r.precio_venta / (r.porciones_base || 1)),
      0
    );

    return {
      totalEncargosCOP,
      conteoActivos,
      saldoPorCobrar,
      valorBodega,
      totalMermasCOP,
      totalGastosFijosCOP,
      totalAnaquelUnidades,
      valorAnaquelCOP,
    };
  }, [pedidos, insumos, mermas, gastosFijos, recetas]);

  const hoyStr = new Date().toISOString().split('T')[0];

  // Fecha de mañana en formato YYYY-MM-DD
  const mananaStr = useMemo(() => {
    const m = new Date();
    m.setDate(m.getDate() + 1);
    return m.toISOString().split('T')[0];
  }, []);

  // Todos los pedidos programados para hoy (no cancelados)
  const pedidosHoyTodos = useMemo(() => {
    return pedidos.filter((p) => p.fecha_entrega === hoyStr && p.estado !== 'cancelado');
  }, [pedidos, hoyStr]);

  // Pedidos de hoy que faltan por entregar
  const pedidosHoyPorEntregar = useMemo(() => {
    return pedidosHoyTodos.filter((p) => p.estado !== 'entregado');
  }, [pedidosHoyTodos]);

  // Pedidos de hoy ya entregados
  const pedidosHoyEntregados = useMemo(() => {
    return pedidosHoyTodos.filter((p) => p.estado === 'entregado');
  }, [pedidosHoyTodos]);

  // Lista a mostrar en la Agenda de Hoy según pestaña
  const pedidosHoyAMostrar = useMemo(() => {
    if (filtroAgendaHoy === 'pendientes') return pedidosHoyPorEntregar;
    if (filtroAgendaHoy === 'entregados') return pedidosHoyEntregados;
    return pedidosHoyTodos;
  }, [filtroAgendaHoy, pedidosHoyPorEntregar, pedidosHoyEntregados, pedidosHoyTodos]);

  // SISTEMA ANTI-OLVIDOS:
  // 1. Pedidos para HOY que siguen 'pendiente' (¡aún no se han horneado!)
  const pedidosHoySinHornear = useMemo(() => {
    return pedidosHoyTodos.filter((p) => p.estado === 'pendiente');
  }, [pedidosHoyTodos]);

  // 2. Pedidos programados para MAÑANA
  const pedidosManana = useMemo(() => {
    return pedidos.filter((p) => p.fecha_entrega === mananaStr && p.estado !== 'cancelado');
  }, [pedidos, mananaStr]);

  // Entregar pedido directamente desde la Agenda de Hoy
  const handleEntregarDesdeAgenda = (id: string) => {
    const ped = pedidos.find((p) => p.id === id);
    if (!ped) return;
    const saldo = Math.max(0, ped.precio_total - ped.abono);
    if (saldo > 0) {
      if (
        !confirm(
          `Este encargo de ${ped.cliente_nombre} tiene un saldo pendiente de ${formatCOP(
            saldo
          )}. ¿Confirmas entrega y recaudo total?`
        )
      ) {
        return;
      }
    }
    onActualizarPedido({ ...ped, estado: 'entregado', abono: ped.precio_total, saldo_pendiente: 0 });
  };

  // Filtrar pedidos por periodo seleccionado para la gráfica y estadísticas
  const pedidosEnPeriodo = useMemo(() => {
    const ahora = new Date();
    const hoyIso = ahora.toISOString().split('T')[0];

    return pedidos.filter((p) => {
      if (p.estado === 'cancelado') return false;
      if (periodo === 'historico') return true;
      if (!p.fecha_entrega) return true;

      const fEnt = new Date(p.fecha_entrega + 'T12:00:00');
      if (periodo === 'hoy') {
        return p.fecha_entrega === hoyIso;
      }
      if (periodo === 'semana') {
        const diffDias = (ahora.getTime() - fEnt.getTime()) / (1000 * 60 * 60 * 24);
        return diffDias >= -1 && diffDias <= 7;
      }
      if (periodo === 'mes') {
        return fEnt.getMonth() === ahora.getMonth() && fEnt.getFullYear() === ahora.getFullYear();
      }
      if (periodo === 'ano') {
        return fEnt.getFullYear() === ahora.getFullYear();
      }
      return true;
    });
  }, [pedidos, periodo]);

  // Cálculo del Producto Estrella (el más vendido)
  const productoEstrella = useMemo(() => {
    const pool =
      pedidosEnPeriodo.length > 0 ? pedidosEnPeriodo : pedidos.filter((p) => p.estado !== 'cancelado');
    const conteo: Record<string, number> = {};
    const dinero: Record<string, number> = {};

    pool.forEach((p) => {
      conteo[p.receta_id] = (conteo[p.receta_id] || 0) + p.cantidad;
      dinero[p.receta_id] = (dinero[p.receta_id] || 0) + p.precio_total;
    });

    let topId: string | null = null;
    let maxUnidades = -1;
    Object.keys(conteo).forEach((rId) => {
      if (conteo[rId] > maxUnidades) {
        maxUnidades = conteo[rId];
        topId = rId;
      }
    });

    if (!topId || maxUnidades <= 0) return null;
    const receta = recetas.find((r) => r.id === topId);
    if (!receta) return null;

    const totalGeneral = pool.reduce((sum, p) => sum + p.precio_total, 0);
    const totalCOP = dinero[topId] || 0;
    const porcentaje = totalGeneral > 0 ? Math.round((totalCOP / totalGeneral) * 100) : 0;

    return {
      receta,
      unidades: maxUnidades,
      totalCOP,
      porcentaje,
    };
  }, [pedidosEnPeriodo, pedidos, recetas]);

  // Gráfica dinámica Chart.js
  useEffect(() => {
    if (typeof Chart !== 'undefined' && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();

      const ctx = chartRef.current.getContext('2d');

      if (tipoGrafico === 'crecimiento') {
        const ingresosPorFecha: Record<string, number> = {};
        pedidosEnPeriodo.forEach((p) => {
          const f = p.fecha_entrega || 'Sin fecha';
          ingresosPorFecha[f] = (ingresosPorFecha[f] || 0) + p.precio_total;
        });

        let fechasOrdenadas = Object.keys(ingresosPorFecha).sort();
        if (fechasOrdenadas.length === 0) {
          fechasOrdenadas = [hoyStr];
          ingresosPorFecha[hoyStr] = 0;
        }

        const labels = fechasOrdenadas.map((f) => {
          const partes = f.split('-');
          if (partes.length === 3) return partes[2] + '/' + partes[1];
          return f;
        });
        const dataPuntos = fechasOrdenadas.map((f) => ingresosPorFecha[f]);

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Ingresos por Fecha',
                data: dataPuntos,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#b45309',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  title: (context: any) => `Fecha: ${fechasOrdenadas[context[0].dataIndex]}`,
                  label: (context: any) => `Ingreso: ${formatCOP(context.raw)}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (val: any) => '$ ' + (val >= 1000 ? val / 1000 + 'k' : val),
                },
              },
            },
          },
        });
      } else if (tipoGrafico === 'ventas_producto') {
        const ventasPorReceta: Record<string, number> = {};
        const unidadesPorReceta: Record<string, number> = {};
        recetas.forEach((r) => {
          ventasPorReceta[r.id] = 0;
          unidadesPorReceta[r.id] = 0;
        });

        pedidosEnPeriodo.forEach((p) => {
          if (ventasPorReceta[p.receta_id] !== undefined) {
            ventasPorReceta[p.receta_id] += p.precio_total;
            unidadesPorReceta[p.receta_id] += p.cantidad;
          }
        });

        const labels = recetas.map((r) => r.nombre.split(' (')[0].substring(0, 16));
        const dataVentas = recetas.map((r) => Math.round(ventasPorReceta[r.id] || 0));
        const dataUnidades = recetas.map((r) => unidadesPorReceta[r.id] || 0);
        const esUnidades = metricaProducto === 'unidades';

        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: esUnidades ? 'Unidades Horneadas' : 'Ventas en COP',
                data: esUnidades ? dataUnidades : dataVentas,
                backgroundColor: esUnidades ? '#6366f1' : '#f59e0b',
                borderRadius: 8,
                maxBarThickness: 45,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: any) => {
                    const idx = context.dataIndex;
                    if (esUnidades) {
                      const val = context.raw;
                      const cop = formatCOP(dataVentas[idx]);
                      return `${val} unidad${val === 1 ? '' : 'es'} (${cop})`;
                    } else {
                      const unids = dataUnidades[idx];
                      return `Ventas: ${formatCOP(context.raw)} (${unids} unid${unids === 1 ? '' : 'es'})`;
                    }
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (val: any) => {
                    if (esUnidades) return val + ' und';
                    return '$ ' + (val >= 1000 ? val / 1000 + 'k' : val);
                  },
                },
              },
            },
          },
        });
      } else {
        const labels = recetas.map((r) => r.nombre.split(' (')[0].substring(0, 16));
        const ingresos: number[] = [];
        const ganancias: number[] = [];

        recetas.forEach((r) => {
          const peds = pedidosEnPeriodo.filter((p) => p.receta_id === r.id);
          const totalVenta = peds.reduce((sum, p) => sum + p.precio_total, 0);
          const cantTotal = peds.reduce((sum, p) => sum + p.cantidad, 0);

          // Costo unitario proporcional
          const costoUnitario = Math.round(r.precio_venta * 0.35); // Estimado base
          const costoTotalProd = costoUnitario * cantTotal;
          const gananciaLimpia = Math.max(0, totalVenta - costoTotalProd);

          ingresos.push(Math.round(totalVenta));
          ganancias.push(Math.round(gananciaLimpia));
        });

        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Dinero Total',
                data: ingresos,
                backgroundColor: '#3b82f6',
                borderRadius: 6,
                maxBarThickness: 32,
              },
              {
                label: 'Ganancia Limpia',
                data: ganancias,
                backgroundColor: '#10b981',
                borderRadius: 6,
                maxBarThickness: 32,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context: any) => `${context.dataset.label}: ${formatCOP(context.raw)}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (val: any) => '$ ' + (val >= 1000 ? val / 1000 + 'k' : val),
                },
              },
            },
          },
        });
      }
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [recetas, insumos, pedidosEnPeriodo, tipoGrafico, metricaProducto, hoyStr]);

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-view">
      {/* CABECERA DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Panel Financiero & Agenda en Vivo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Control integral de entregas de hoy, margen real y radar operativo del taller.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onIrACocina}
            className="bg-[#ECEBCF]/60 hover:bg-[#ECEBCF] text-[#22221E] font-bold px-3.5 py-2.5 rounded-xl transition text-xs flex items-center space-x-1.5 border border-[#DDDABA]"
          >
            <span>👨‍🍳</span>
            <span>Cocina & Lotes</span>
          </button>
          <button
            onClick={onNuevoPedido}
            className="bg-[#A472B9] hover:bg-[#8C57A3] text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 text-xs sm:text-sm"
          >
            <span>➕</span>
            <span>Nuevo Encargo</span>
          </button>
        </div>
      </div>

      {/* 6 TARJETAS KPI PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Encargos */}
        <div
          data-testid="kpi-facturacion"
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between"
        >
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Encargos</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCOP(metricas.totalEncargosCOP)}</div>
          <div className="text-xs text-amber-700 mt-2 font-medium">
            📋 {metricas.conteoActivos} activos en agenda
          </div>
        </div>

        {/* 2. Saldo por Cobrar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldo por Cobrar</span>
          <div className="text-xl font-extrabold text-blue-600 mt-1">{formatCOP(metricas.saldoPorCobrar)}</div>
          <div className="text-xs text-blue-700 mt-2 font-medium">💵 En calle por recaudar</div>
        </div>

        {/* 3. Valor de Bodega */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor de Bodega</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">{formatCOP(metricas.valorBodega)}</div>
          <div className="text-xs text-emerald-700 mt-2 font-medium">📦 Inversión en estantería</div>
        </div>

        {/* 4. En Anaquel / Vitrina (Listo) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">En Anaquel (Listo)</span>
          <div className="text-xl font-extrabold text-amber-600 mt-1">{metricas.totalAnaquelUnidades} unds</div>
          <div className="text-xs text-amber-800 mt-2 font-medium">🧁 {formatCOP(metricas.valorAnaquelCOP)} listo</div>
        </div>

        {/* 5. Gastos Fijos (Publicidad & Otros) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gastos Fijos Mes</span>
          <div className="text-xl font-extrabold text-purple-700 mt-1">{formatCOP(metricas.totalGastosFijosCOP)}</div>
          <div className="text-xs text-purple-700 mt-2 font-medium">📢 Publicidad & operación</div>
        </div>

        {/* 6. Pérdidas por Merma */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pérdidas Merma</span>
          <div className="text-xl font-extrabold text-rose-600 mt-1">{formatCOP(metricas.totalMermasCOP)}</div>
          <div className="text-xs text-rose-700 mt-2 font-medium">📉 Dinero perdido acumulado</div>
        </div>
      </div>

      {/* ESCUDO ANTI-OLVIDOS: ALERTAS OPERATIVAS DEL TALLER */}
      {(pedidosHoySinHornear.length > 0 || pedidosManana.length > 0) && (
        <div className="space-y-3">
          {/* Alerta 1: Entregas de HOY que todavía NO se han horneado */}
          {pedidosHoySinHornear.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl flex-shrink-0 shadow-sm font-bold">
                  🚨
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                      ¡Alerta Crítica de Cocina!
                    </span>
                    <span className="text-xs text-rose-700 font-bold">
                      {pedidosHoySinHornear.length} {pedidosHoySinHornear.length === 1 ? 'pedido para hoy sigue' : 'pedidos para hoy siguen'} sin preparar
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 font-medium mt-1">
                    Tienes pedidos para entrega hoy que aún están en estado "Pendiente". Pásalos a cocina de inmediato para evitar retrasos con el cliente.
                  </p>
                </div>
              </div>
              <button
                onClick={onIrACocina}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap self-start sm:self-auto"
              >
                👨‍🍳 Ir a Hornear Ahora →
              </button>
            </div>
          )}

          {/* Alerta 2: Radar de Mañana */}
          {pedidosManana.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg flex-shrink-0 font-bold shadow-xs">
                  👀
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full">
                    Radar de Mañana
                  </span>
                  <p className="text-xs text-amber-900 font-medium mt-1">
                    Tienes <strong>{pedidosManana.length} {pedidosManana.length === 1 ? 'encargo programado' : 'encargos programados'}</strong> para mañana ({mananaStr}). Asegúrate de tener los insumos en bodega listos hoy.
                  </p>
                </div>
              </div>
              <button
                onClick={onIrAPedidos}
                className="px-3.5 py-1.5 bg-white text-amber-900 hover:bg-amber-100 border border-amber-300 font-bold text-xs rounded-xl shadow-xs transition whitespace-nowrap self-start sm:self-auto"
              >
                Ver Agenda de Mañana →
              </button>
            </div>
          )}
        </div>
      )}

      {/* AGENDA DE ENTREGAS DE HOY */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">☀️</span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Agenda de Entregas para Hoy ({hoyStr})
              </h3>
              <p className="text-xs text-slate-400">
                {pedidosHoyPorEntregar.length} entregas pendientes • {pedidosHoyEntregados.length} entregadas
              </p>
            </div>
          </div>

          {/* PESTAÑAS DE LA AGENDA DE HOY */}
          <div className="flex bg-slate-100 rounded-xl p-1 space-x-1 text-xs self-start sm:self-auto">
            <button
              onClick={() => setFiltroAgendaHoy('pendientes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filtroAgendaHoy === 'pendientes'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 Por Entregar ({pedidosHoyPorEntregar.length})
            </button>
            <button
              onClick={() => setFiltroAgendaHoy('entregados')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filtroAgendaHoy === 'entregados'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✅ Entregados ({pedidosHoyEntregados.length})
            </button>
            <button
              onClick={() => setFiltroAgendaHoy('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filtroAgendaHoy === 'todos'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({pedidosHoyTodos.length})
            </button>
          </div>
        </div>

        {/* LISTADO DE PEDIDOS DE HOY */}
        <div className="mt-4 space-y-3">
          {pedidosHoyAMostrar.length > 0 ? (
            pedidosHoyAMostrar.map((p) => {
              const rec = recetas.find((r) => r.id === p.receta_id);
              const saldo = Math.max(0, p.precio_total - p.abono);
              const estaEntregado = p.estado === 'entregado';

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    estaEntregado
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl mt-0.5">{estaEntregado ? '✅' : '📦'}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{p.cliente_nombre}</span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            estaEntregado
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {estaEntregado ? 'Entregado' : p.estado === 'en_preparacion' ? 'En Cocina' : 'Pendiente'}
                        </span>
                        {p.origen === 'cliente' && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                            📱 Tienda Web
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.cantidad}x {rec?.nombre || 'Producto'} • Hora: <strong>{p.hora_entrega || 'Todo el día'}</strong> • {p.notas || 'Sin notas'}
                      </p>
                      {p.empaque_sugerido && (
                        <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block font-semibold">
                          📦 {p.empaque_sugerido.nombre_caja}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-auto">
                    <div className="text-right text-xs">
                      <span className="text-slate-400 block font-medium">Saldo</span>
                      <span
                        className={`font-extrabold text-sm ${
                          saldo > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {saldo > 0 ? formatCOP(saldo) : 'Pagado'}
                      </span>
                    </div>

                    {!estaEntregado && (
                      <button
                        onClick={() => handleEntregarDesdeAgenda(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center space-x-1"
                        title="Marcar pedido como entregado"
                      >
                        <span>✓</span>
                        <span>Entregar</span>
                      </button>
                    )}

                    <a
                      href={`https://wa.me/${(p.cliente_telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hola ${p.cliente_nombre}! Te escribo de Los Brownies de Josefina para confirmar tu pedido de ${p.cantidad}x ${rec?.nombre || 'Brownies'} programado para hoy.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
                      title="Contactar por WhatsApp"
                    >
                      💬
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              {filtroAgendaHoy === 'pendientes'
                ? '🎉 ¡No hay entregas pendientes para hoy! Todo entregado o día de producción.'
                : 'No hay pedidos en esta vista para hoy.'}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: GRÁFICO DINÁMICO & PRODUCTO ESTRELLA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO DINÁMICO CHART.JS (2 COLUMNAS) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            {/* TIPO DE GRÁFICO */}
            <div className="flex bg-slate-100 rounded-xl p-1 space-x-1 text-xs">
              <button
                onClick={() => setTipoGrafico('crecimiento')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  tipoGrafico === 'crecimiento'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📈 Crecimiento (Ingreso vs Tiempo)
              </button>
              <button
                onClick={() => setTipoGrafico('ventas_producto')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  tipoGrafico === 'ventas_producto'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🥐 Ventas por Producto
              </button>
              <button
                onClick={() => setTipoGrafico('ingresos_ganancia')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  tipoGrafico === 'ingresos_ganancia'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚖️ Dinero vs Ganancia
              </button>
            </div>

            {/* FILTRO DE PERIODO */}
            <div className="flex bg-slate-100 rounded-xl p-1 space-x-0.5 text-xs">
              {[
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: 'Esta Semana' },
                { id: 'mes', label: 'Este Mes' },
                { id: 'ano', label: 'Este Año' },
                { id: 'historico', label: 'Histórico' },
              ].map((per) => (
                <button
                  key={per.id}
                  onClick={() => setPeriodo(per.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    periodo === per.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {per.label}
                </button>
              ))}
            </div>
          </div>

          {/* TOGGLE SUB-MÉTRICA PARA VENTAS POR PRODUCTO */}
          {tipoGrafico === 'ventas_producto' && (
            <div className="flex justify-end pt-3 text-xs space-x-2">
              <span className="text-slate-400 self-center">Ver métrica en:</span>
              <button
                onClick={() => setMetricaProducto('unidades')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  metricaProducto === 'unidades'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                📦 Unidades
              </button>
              <button
                onClick={() => setMetricaProducto('dinero')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  metricaProducto === 'dinero'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                💰 Dinero ($)
              </button>
            </div>
          )}

          {/* CANVAS DEL GRÁFICO */}
          <div className="h-[280px] w-full mt-4">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* TARJETA PRODUCTO ESTRELLA DECORADA */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 p-6 rounded-2xl shadow-lg border border-amber-300 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 text-amber-300/30 text-8xl pointer-events-none font-serif">
            👑
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">👑</span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-300/80 px-2.5 py-0.5 rounded-full">
                Producto Estrella
              </span>
            </div>

            {productoEstrella ? (
              <div className="mt-4">
                <h4 className="text-xl font-extrabold text-slate-950 leading-tight">
                  {productoEstrella.receta.nombre}
                </h4>
                <p className="text-xs text-amber-950/80 mt-1 font-medium">
                  Tu producto líder en ventas en este período ({periodo}).
                </p>

                <div className="mt-6 space-y-3 bg-white/30 backdrop-blur-xs p-4 rounded-xl border border-white/40">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-950">Unidades vendidas:</span>
                    <span className="font-black text-slate-950 text-base">{productoEstrella.unidades} unds</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-amber-950">Total recaudado:</span>
                    <span className="font-black text-slate-950 text-base">{formatCOP(productoEstrella.totalCOP)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-amber-900/10 pt-2">
                    <span className="font-bold text-amber-950">% de tus ingresos:</span>
                    <span className="font-black text-amber-950 text-base">{productoEstrella.porcentaje}% del total</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-amber-950/70 text-xs font-medium">
                No hay ventas registradas en el período seleccionado para calcular el producto estrella.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-amber-400/40 flex justify-between items-center text-xs">
            <span className="font-bold text-amber-950">¿Quieres impulsarlo?</span>
            <button
              onClick={onIrATienda}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg transition shadow-xs"
            >
              Destacar en Tienda 🌐
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
