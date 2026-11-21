import React, { useState, useMemo, useEffect } from 'react';
import { Receta, Insumo, Pedido } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';

interface CocinaViewProps {
  pedidos: Pedido[];
  recetas: Receta[];
  insumos: Insumo[];
  onDescontarLote: (receta: Receta, escala: number, esParaAnaquel?: boolean) => Promise<boolean> | boolean;
  onCambiarEstadoPedido?: (id: string, nuevoEstado: any, insumosDescontados?: boolean) => void;
  onIrABodega?: (insumo: Insumo) => void;
}

export const CocinaView: React.FC<CocinaViewProps> = ({
  pedidos,
  recetas,
  insumos,
  onDescontarLote,
  onCambiarEstadoPedido,
}) => {
  const [subVista, setSubVista] = useState<'mesa_trabajo' | 'abastecimiento' | 'anaquel'>('mesa_trabajo');
  const [filtroFecha, setFiltroFecha] = useState<'todos' | 'hoy' | 'manana' | 'semana'>('todos');
  const [filtroEstadoCocina, setFiltroEstadoCocina] = useState<'pendientes' | 'en_proceso'>('pendientes');
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string>(() => recetas[0]?.id || '');
  const [pedidosSeleccionadosIds, setPedidosSeleccionadosIds] = useState<string[]>(() => {
    const firstRec = recetas[0]?.id;
    if (!firstRec) return [];
    const pend = pedidos.filter((p) => p.estado === 'pendiente' && p.receta_id === firstRec);
    return pend.length > 0 ? [pend[0].id] : [];
  });
  const [pesajeCheck, setPesajeCheck] = useState<Record<string, boolean>>({});
  const [alertaExito, setAlertaExito] = useState<string | null>(null);

  // Estados para Hornear para Anaquel
  const [recetaAnaquelId, setRecetaAnaquelId] = useState<string>(recetas[0]?.id || '');
  const [tandasAnaquel, setTandasAnaquel] = useState<number>(1);

  // 1. Pedidos PENDIENTES por hornear
  const pedidosPorHornear = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'pendiente');
  }, [pedidos]);

  // 2. Pedidos en preparación
  const pedidosEnPreparacion = useMemo(() => {
    return pedidos.filter((p) => p.estado === 'en_preparacion');
  }, [pedidos]);

  // Si se cargan recetas desde la nube y no había seleccionada
  useEffect(() => {
    if (!recetaSeleccionadaId && recetas.length > 0) {
      setRecetaSeleccionadaId(recetas[0].id);
    }
  }, [recetas]);

  // Filtrado por fecha
  const pedidosParaMostrar = useMemo(() => {
    const pool = filtroEstadoCocina === 'pendientes' ? pedidosPorHornear : pedidosEnPreparacion;
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().split('T')[0];

    return pool.filter((p) => {
      if (filtroFecha === 'todos') return true;
      if (!p.fecha_entrega) return true;
      if (filtroFecha === 'hoy') return p.fecha_entrega === hoyStr;
      if (filtroFecha === 'manana') return p.fecha_entrega === mananaStr;
      if (filtroFecha === 'semana') {
        const fPed = new Date(p.fecha_entrega + 'T12:00:00');
        const diff = (fPed.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= -1 && diff <= 7;
      }
      return true;
    });
  }, [filtroEstadoCocina, pedidosPorHornear, pedidosEnPreparacion, filtroFecha]);

  // Agrupación por receta
  const recetasConPedidos = useMemo(() => {
    const mapa: Record<string, Pedido[]> = {};
    pedidosParaMostrar.forEach((p) => {
      if (!mapa[p.receta_id]) mapa[p.receta_id] = [];
      mapa[p.receta_id].push(p);
    });

    return recetas
      .filter((r) => mapa[r.id] && mapa[r.id].length > 0)
      .map((r) => ({
        receta: r,
        pedidos: mapa[r.id],
      }));
  }, [recetas, pedidosParaMostrar]);

  // Auto-selección de primera receta
  useEffect(() => {
    if (recetasConPedidos.length > 0) {
      const existe = recetasConPedidos.some((item) => item.receta.id === recetaSeleccionadaId);
      if (!existe) {
        const primerReceta = recetasConPedidos[0];
        setRecetaSeleccionadaId(primerReceta.receta.id);
        setPedidosSeleccionadosIds(primerReceta.pedidos.map((p) => p.id));
        setPesajeCheck({});
      }
    } else {
      setRecetaSeleccionadaId('');
      setPedidosSeleccionadosIds([]);
    }
  }, [recetasConPedidos, recetaSeleccionadaId]);

  const recetaActual = recetas.find((r) => r.id === recetaSeleccionadaId);
  const grupoActual = recetasConPedidos.find((item) => item.receta.id === recetaSeleccionadaId);
  const pedidosDeEstaReceta = grupoActual ? grupoActual.pedidos : [];

  const handleSeleccionarReceta = (recetaId: string) => {
    setRecetaSeleccionadaId(recetaId);
    const grupo = recetasConPedidos.find((item) => item.receta.id === recetaId);
    if (grupo) {
      setPedidosSeleccionadosIds(grupo.pedidos.map((p) => p.id));
    } else {
      setPedidosSeleccionadosIds([]);
    }
    setPesajeCheck({});
    setAlertaExito(null);
  };

  const handleTogglePedido = (pedidoId: string) => {
    if (pedidosSeleccionadosIds.includes(pedidoId)) {
      setPedidosSeleccionadosIds(pedidosSeleccionadosIds.filter((id) => id !== pedidoId));
    } else {
      setPedidosSeleccionadosIds([...pedidosSeleccionadosIds, pedidoId]);
    }
    setPesajeCheck({});
  };

  const handleSeleccionarTodosDeReceta = () => {
    setPedidosSeleccionadosIds(pedidosDeEstaReceta.map((p) => p.id));
    setPesajeCheck({});
  };

  const pedidosSeleccionados = pedidosDeEstaReceta.filter((p) => pedidosSeleccionadosIds.includes(p.id));
  const cantidadTotalTanda = pedidosSeleccionados.reduce((sum, p) => sum + p.cantidad, 0);

  // Validación de stock para la tanda
  const validacionStockTanda = useMemo(() => {
    if (!recetaActual || cantidadTotalTanda === 0) {
      return { faltantes: [], hayFaltantes: false, ingredientesEscalados: [] };
    }

    const faltantes: any[] = [];
    const ingredientesEscalados = (recetaActual.ingredientes || []).map((ing) => {
      const ins = insumos.find((i) => i.id === ing.insumo_id);
      const cantidadRequerida = ing.cantidad * cantidadTotalTanda;
      const stockActual = ins?.stock_actual || 0;
      const falta = Math.max(0, cantidadRequerida - stockActual);

      if (falta > 0) {
        faltantes.push({
          insumo: ins,
          insumo_id: ing.insumo_id,
          nombre: ins?.nombre || 'Insumo desconocido',
          unidad: ins?.unidad || 'g',
          requerido: cantidadRequerida,
          stockActual,
          falta,
        });
      }

      return {
        insumo: ins,
        cantidadRequerida,
        stockActual,
        falta,
        unidad: ins?.unidad || 'g',
      };
    });

    return {
      faltantes,
      hayFaltantes: faltantes.length > 0,
      ingredientesEscalados,
    };
  }, [recetaActual, cantidadTotalTanda, insumos]);

  // Confirmar Tanda: Descuenta y mueve a 'en_preparacion'
  const handleConfirmarTanda = () => {
    if (!recetaActual || cantidadTotalTanda === 0) return;
    if (validacionStockTanda.hayFaltantes) {
      alert('No es posible iniciar la preparación: materia prima insuficiente en Bodega.');
      return;
    }

    // Descontar insumos garantizando que son para pedidos (no inflan stock_anaquel)
    onDescontarLote(recetaActual, cantidadTotalTanda, false);

    // Mover pedidos a 'en_preparacion' marcando insumos_descontados = true
    if (onCambiarEstadoPedido) {
      pedidosSeleccionadosIds.forEach((id) => onCambiarEstadoPedido(id, 'en_preparacion', true));
    }

    setAlertaExito(
      `¡Tanda de "${recetaActual.nombre}" iniciada! Se descontaron los insumos de bodega y los ${pedidosSeleccionados.length} encargos pasaron a "En Preparación".`
    );
    setPedidosSeleccionadosIds([]);
    setPesajeCheck({});
    setTimeout(() => setAlertaExito(null), 6000);
  };

  // Hornear para Anaquel / Vitrina directa
  const recetaParaAnaquel = recetas.find((r) => r.id === recetaAnaquelId) || recetas[0];
  const validacionStockAnaquel = useMemo(() => {
    if (!recetaParaAnaquel) return { faltantes: [], hayFaltantes: false, items: [] };
    const faltantes: any[] = [];
    const items = (recetaParaAnaquel.ingredientes || []).map((ing) => {
      const ins = insumos.find((i) => i.id === ing.insumo_id);
      const requerido = ing.cantidad * tandasAnaquel;
      const stock = ins?.stock_actual || 0;
      const falta = Math.max(0, requerido - stock);
      if (falta > 0) faltantes.push({ insumo: ins, falta });
      return { insumo: ins, requerido, stock, falta, unidad: ins?.unidad || 'g' };
    });
    return { faltantes, hayFaltantes: faltantes.length > 0, items };
  }, [recetaParaAnaquel, tandasAnaquel, insumos]);

  const handleConfirmarHorneoAnaquel = () => {
    if (!recetaParaAnaquel) return;
    if (validacionStockAnaquel.hayFaltantes) {
      alert('Faltan insumos en bodega para hornear esta tanda de anaquel.');
      return;
    }

    // Descontar insumos sumando a anaquel para venta libre
    onDescontarLote(recetaParaAnaquel, tandasAnaquel, true);
    const piezasHorneadas = tandasAnaquel * (recetaParaAnaquel.porciones_base || 1);
    setAlertaExito(
      `🎉 ¡Tanda para vitrina horneada! Se sumaron +${piezasHorneadas} unidades de "${recetaParaAnaquel.nombre}" a tu stock de venta inmediata.`
    );
    setTimeout(() => setAlertaExito(null), 6000);
  };

  // Consolidado de compras global
  const consolidadoCompras = useMemo(() => {
    const mapa: Record<string, number> = {};
    pedidosPorHornear.forEach((p) => {
      const rec = recetas.find((r) => r.id === p.receta_id);
      if (rec) {
        (rec.ingredientes || []).forEach((ing) => {
          mapa[ing.insumo_id] = (mapa[ing.insumo_id] || 0) + ing.cantidad * p.cantidad;
        });
      }
    });

    return Object.keys(mapa).map((insumoId) => {
      const ins = insumos.find((i) => i.id === insumoId);
      const cantidadTotalNecesaria = mapa[insumoId];
      const stockActual = ins?.stock_actual || 0;
      const deficit = Math.max(0, cantidadTotalNecesaria - stockActual);

      const tamanoEmpaque = ins?.gramos_por_empaque || 1000;
      const paquetesComprar = deficit > 0 ? Math.ceil(deficit / tamanoEmpaque) : 0;
      const cantidadComprada = paquetesComprar * tamanoEmpaque;
      const sobranteProyectado = stockActual + cantidadComprada - cantidadTotalNecesaria;
      const costoEstimadoCOP = paquetesComprar * (ins?.costo_empaque || 0);

      return {
        insumo: ins,
        cantidadTotalNecesaria,
        stockActual,
        deficit,
        paquetesComprar,
        sobranteProyectado,
        costoEstimadoCOP,
      };
    });
  }, [pedidosPorHornear, recetas, insumos]);

  const presupuestoTotalCompras = consolidadoCompras.reduce((acc, c) => acc + c.costoEstimadoCOP, 0);

  const handleCopiarListaCompras = () => {
    let texto = `🛒 *LISTA DE COMPRAS - LOS BROWNIES DE JOSEFINA*\n`;
    texto += `Para abastecer ${pedidosPorHornear.length} encargos pendientes por hornear:\n\n`;
    consolidadoCompras
      .filter((c) => c.paquetesComprar > 0)
      .forEach((c) => {
        texto += `• *${c.insumo?.nombre}*: Comprar ${c.paquetesComprar} paq. (${formatCOP(c.costoEstimadoCOP)})\n`;
      });
    texto += `\n💰 *Presupuesto Estimado:* ${formatCOP(presupuestoTotalCompras)}`;
    navigator.clipboard.writeText(texto);
    alert('¡Lista de compras copiada al portapapeles! Puedes pegarla directamente en WhatsApp.');
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="cocina-view">
      {/* CABECERA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Preparación y Cocina</h2>
          <p className="text-sm text-slate-500 mt-1">
            Pesaje exacto en mesa con tandas individuales o combinadas vs Abastecimiento global.
          </p>
        </div>

        {/* SELECTOR DE SUB-VISTAS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubVista('mesa_trabajo')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              subVista === 'mesa_trabajo' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>⚖️</span>
            <span>Mesa de Trabajo</span>
          </button>
          <button
            onClick={() => setSubVista('anaquel')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              subVista === 'anaquel' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🧁</span>
            <span>Hornear para Anaquel</span>
          </button>
          <button
            onClick={() => setSubVista('abastecimiento')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              subVista === 'abastecimiento' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🛒</span>
            <span>Abastecimiento Global</span>
          </button>
        </div>
      </div>

      {alertaExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <span className="text-xl">✅</span>
            <span>{alertaExito}</span>
          </div>
          <button onClick={() => setAlertaExito(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* MODO 1: MESA DE TRABAJO (TANDAS) */}
      {subVista === 'mesa_trabajo' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => {
                  setFiltroEstadoCocina('pendientes');
                  setPedidosSeleccionadosIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  filtroEstadoCocina === 'pendientes' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🔥 Por Hornear</span>
                <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px]">
                  {pedidosPorHornear.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setFiltroEstadoCocina('en_proceso');
                  setPedidosSeleccionadosIds([]);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  filtroEstadoCocina === 'en_proceso' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>👨‍🍳 Ya en Preparación</span>
                <span className="bg-indigo-500 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                  {pedidosEnPreparacion.length}
                </span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500">Fecha:</span>
              <div className="flex space-x-1">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: 'hoy', label: 'Hoy' },
                  { id: 'manana', label: 'Mañana' },
                  { id: 'semana', label: 'Esta Semana' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFiltroFecha(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      filtroFecha === f.id ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GRID: IZQUIERDA RECETAS / DERECHA BÁSCULA DIGITAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Encargos */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Recetas con Encargos ({recetasConPedidos.length}):
                </span>
                <div className="space-y-1.5">
                  {recetasConPedidos.length > 0 ? (
                    recetasConPedidos.map(({ receta, pedidos: peds }) => (
                      <button
                        key={receta.id}
                        onClick={() => handleSeleccionarReceta(receta.id)}
                        className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                          recetaSeleccionadaId === receta.id
                            ? 'bg-amber-50 border-amber-300 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block">{receta.nombre}</span>
                          <span className="text-[11px] text-slate-500">
                            {peds.length} encargos ({peds.reduce((s, p) => s + p.cantidad, 0)} unidades)
                          </span>
                        </div>
                        <span className="text-amber-600 font-bold text-sm">➔</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      No hay encargos en este estado y filtro de fecha.
                    </p>
                  )}
                </div>
              </div>

              {/* Lista de Encargos para la Receta Seleccionada */}
              {recetaActual && pedidosDeEstaReceta.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">
                      Encargos a preparar ({pedidosSeleccionados.length} seleccionados):
                    </span>
                    <button
                      onClick={handleSeleccionarTodosDeReceta}
                      className="text-[11px] text-amber-800 hover:underline font-bold"
                    >
                      Seleccionar Todos
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {pedidosDeEstaReceta.map((p) => {
                      const estaMarcado = pedidosSeleccionadosIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleTogglePedido(p.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                            estaMarcado
                              ? 'bg-amber-100/70 border-amber-300'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-slate-900">{p.cliente_nombre}</span>
                            <span className="text-slate-500 block text-[11px]">
                              {p.cantidad} unidad(es) • Entrega: {p.fecha_entrega} {p.hora_entrega || ''}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={estaMarcado}
                            onChange={() => {}}
                            className="rounded text-amber-600"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Báscula Digital & Pesaje */}
            <div className="lg:col-span-7">
              {recetaActual && cantidadTotalTanda > 0 ? (
                <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-md space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md inline-block mb-1">
                        Báscula Digital de Mesa
                      </span>
                      <h3 className="text-lg font-black text-slate-900">{recetaActual.nombre}</h3>
                      <p className="text-xs text-slate-500">
                        Total por hornear: <strong>{cantidadTotalTanda} unidad(es)</strong> ({pedidosSeleccionados.length} encargos combinados)
                      </p>
                    </div>

                    {validacionStockTanda.hayFaltantes ? (
                      <span className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1.5 rounded-xl border border-rose-200">
                        ⚠️ Insumos Insuficientes
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
                        ✓ Despensa Lista (100%)
                      </span>
                    )}
                  </div>

                  {/* LISTA DE PESAJE CON CHECKBOXES */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Ingredientes a pesar en mesa:
                    </span>
                    <div className="divide-y divide-slate-100">
                      {validacionStockTanda.ingredientesEscalados.map((item, idx) => {
                        const checkeado = !!pesajeCheck[idx];
                        const suficiente = item.falta === 0;

                        return (
                          <div
                            key={idx}
                            onClick={() => setPesajeCheck((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                            className={`py-2.5 px-3 rounded-xl flex items-center justify-between cursor-pointer transition ${
                              checkeado ? 'bg-emerald-50/60 line-through text-slate-400' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={checkeado}
                                onChange={() => {}}
                                className="w-4 h-4 text-emerald-600 rounded"
                              />
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs block">
                                  {item.insumo?.nombre || 'Insumo'}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  En bodega: {item.stockActual} {item.unidad}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-sm font-black text-slate-900">
                                {item.cantidadRequerida} {item.unidad}
                              </span>
                              {!suficiente && (
                                <span className="block text-[10px] text-rose-600 font-bold">
                                  Faltan {item.falta} {item.unidad}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* BOTÓN CONFIRMAR Y HORNEAR TANDA (BLOQUEADO SI FALTA STOCK) */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {validacionStockTanda.hayFaltantes && (
                        <p className="text-xs text-rose-600 font-bold">
                          Candado activo: Faltan insumos en bodega.
                        </p>
                      )}
                    </div>

                    <button
                      data-testid="btn-confirmar-lote"
                      onClick={handleConfirmarTanda}
                      disabled={validacionStockTanda.hayFaltantes}
                      className={`px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition flex items-center space-x-2 ${
                        validacionStockTanda.hayFaltantes
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      <span>🔥</span>
                      <span>Confirmar y Hornear Tanda</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Selecciona una receta y al menos un encargo en la columna izquierda para abrir la mesa de pesaje.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODO 2: HORNEAR PARA ANAQUEL / VITRINA */}
      {subVista === 'anaquel' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
              Producción Directa para Vitrina
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Horneo Libre sin Encargo Previo
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Prepara tandas para tener producto listo en anaquel y vender de inmediato por unidad o caja.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Producto a Hornear:</label>
              <select
                value={recetaAnaquelId}
                onChange={(e) => setRecetaAnaquelId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm"
              >
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} (Tanda base: {r.porciones_base} unds • En vitrina: {r.stock_anaquel || 0} listos)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Número de Tandas a Hornear:</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 5].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTandasAnaquel(t)}
                    className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
                      tandasAnaquel === t ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t} tanda{t > 1 ? 's' : ''} ({t * (recetaParaAnaquel?.porciones_base || 1)} unds)
                  </button>
                ))}
              </div>
            </div>

            {/* Comprobación de Insumos */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Insumos a descontar de bodega:</span>
              <div className="space-y-1 text-xs">
                {validacionStockAnaquel.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600">{item.insumo?.nombre}:</span>
                    <span className={`font-bold ${item.falta > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {item.requerido} {item.unidad} (Disp: {item.stock} {item.unidad})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmarHorneoAnaquel}
              disabled={validacionStockAnaquel.hayFaltantes}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 ${
                validacionStockAnaquel.hayFaltantes
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>🧁</span>
              <span>
                Hornear y Sumar +{tandasAnaquel * (recetaParaAnaquel?.porciones_base || 1)} Unidades a Vitrina
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODO 3: ABASTECIMIENTO GLOBAL */}
      {subVista === 'abastecimiento' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Consolidado Inteligente de Compras</h3>
              <p className="text-xs text-slate-500">
                Calcula paquetes enteros comerciales para surtir exactamente los {pedidosPorHornear.length} encargos pendientes por hornear.
              </p>
            </div>
            <button
              onClick={handleCopiarListaCompras}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <span>📋</span>
              <span>Copiar para WhatsApp</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {consolidadoCompras.map((c, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex justify-between items-start font-bold">
                  <span className="text-slate-900">{c.insumo?.nombre}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      c.paquetesComprar > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {c.paquetesComprar > 0 ? `Comprar ${c.paquetesComprar} paq.` : 'Suficiente'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Requerido pedidos:</span>
                    <strong className="text-slate-700">{c.cantidadTotalNecesaria} {c.insumo?.unidad}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock actual bodega:</span>
                    <strong className="text-slate-700">{c.stockActual} {c.insumo?.unidad}</strong>
                  </div>
                  {c.paquetesComprar > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Costo estimado:</span>
                      <span>{formatCOP(c.costoEstimadoCOP)}</span>
                    </div>
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
