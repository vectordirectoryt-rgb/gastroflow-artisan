import React, { useState } from 'react';
import { Receta, Insumo } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';

interface RecetarioViewProps {
  recetas: Receta[];
  insumos: Insumo[];
  tarifaKwh: number;
  onNuevaReceta: () => void;
  onEditarReceta: (receta: Receta) => void;
}

export const RecetarioView: React.FC<RecetarioViewProps> = ({
  recetas,
  insumos,
  tarifaKwh,
  onNuevaReceta,
  onEditarReceta,
}) => {
  const [escala, setEscala] = useState<Record<string, number>>({});
  const [abiertos, setAbiertos] = useState<Record<string, boolean>>({});
  const [simuladorAbierto, setSimuladorAbierto] = useState<Record<string, boolean>>({});
  const [metaHoraria, setMetaHoraria] = useState<Record<string, number>>({});

  const toggleAcordeon = (id: string) => {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSimulador = (id: string) => {
    setSimuladorAbierto((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const cambiarEscala = (id: string, factor: number) => {
    setEscala((prev) => ({ ...prev, [id]: factor }));
  };

  // Función matemática de costeo exacta de GastroFlow
  const calcularCostosReceta = (receta: Receta, factor: number = 1) => {
    if (!receta) {
      return {
        costoInsumos: 0,
        costoEnergia: 0,
        costoCIF: 0,
        costoTotal: 0,
        remanenteNeto: 0,
        valorHoraReal: 0,
        costoPorUnidad: 0,
        precioPorUnidad: 0,
        gananciaPorUnidad: 0,
        horasTrabajo: 1,
      };
    }

    let costoInsumos = 0;
    (receta.ingredientes || []).forEach((ing) => {
      const ins = insumos.find((i) => i.id === ing.insumo_id);
      if (ins && ins.gramos_por_empaque > 0) {
        const costoUnit = ins.costo_empaque / ins.gramos_por_empaque;
        costoInsumos += ing.cantidad * factor * costoUnit;
      }
    });

    let costoEnergia = 0;
    if (receta.equipos && Array.isArray(receta.equipos)) {
      receta.equipos.forEach((eq) => {
        const horas = (eq.minutos_uso * factor) / 60;
        const kwh = (eq.potencia_watts / 1000) * horas;
        costoEnergia += kwh * (tarifaKwh || 800);
      });
    }

    const cifPorc = receta.cif_porcentaje || 0;
    const costoCIF = (costoInsumos + costoEnergia) * (cifPorc / 100);
    const costoTotal = costoInsumos + costoEnergia + costoCIF;

    // Diferenciación inteligente: Precio Lote vs Precio Unidad
    const porciones = receta.porciones_base || 1;
    let precioLote = receta.precio_venta;

    // Si el usuario ingresó precio por unidad menor que los insumos de todo el lote:
    if (receta.precio_venta < costoTotal && porciones > 1) {
      precioLote = receta.precio_venta * porciones;
    }

    const precioTotalVenta = precioLote * factor;
    const remanenteNeto = precioTotalVenta - costoTotal;
    const horasTrabajo = ((receta.tiempo_minutos || 60) * factor) / 60;
    const valorHoraReal = horasTrabajo > 0 ? remanenteNeto / horasTrabajo : 0;

    const totalUnidades = porciones * factor;
    const costoPorUnidad = totalUnidades > 0 ? Math.round(costoTotal / totalUnidades) : 0;
    const precioPorUnidad = totalUnidades > 0 ? Math.round(precioTotalVenta / totalUnidades) : 0;
    const gananciaPorUnidad = precioPorUnidad - costoPorUnidad;

    return {
      costoInsumos,
      costoEnergia,
      costoCIF,
      costoTotal,
      precioTotalVenta,
      remanenteNeto,
      valorHoraReal,
      horasTrabajo,
      costoPorUnidad,
      precioPorUnidad,
      gananciaPorUnidad,
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="recetario-view">
      {/* CABECERA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Recetario y Costeo</h2>
          <p className="text-sm text-slate-500 mt-1">
            Fichas técnicas dinámicas con porcentajes por ingrediente (% costo y % peso), escala live y retorno horario real.
          </p>
        </div>
        <button
          onClick={onNuevaReceta}
          data-testid="btn-nueva-receta"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center space-x-2 text-sm"
        >
          <span>➕</span>
          <span>Nueva Receta</span>
        </button>
      </div>

      {/* LISTA EN ACORDEÓN COLAPSABLE */}
      <div className="space-y-4">
        {recetas.map((rec) => {
          const factor = escala[rec.id] || 1;
          const costos = calcularCostosReceta(rec, factor);
          const estaAbierto = abiertos[rec.id] || false;
          const simAbierto = simuladorAbierto[rec.id] || false;

          const metaActual = metaHoraria[rec.id] || 25000;
          const horasBase = (rec.tiempo_minutos || 60) / 60;
          const precioVentaSugerido = costos.costoTotal / factor + metaActual * horasBase;
          const diferenciaPrecio = precioVentaSugerido - rec.precio_venta;

          // Cálculo de peso total para porcentajes panaderos / de fórmula
          const pesoTotalGramos = (rec.ingredientes || []).reduce((sum, it) => {
            const itIns = insumos.find((x) => x.id === it.insumo_id);
            return itIns?.unidad === 'g' || itIns?.unidad === 'ml' ? sum + it.cantidad * factor : sum;
          }, 0);

          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
            >
              {/* BARRA RESUMEN DE LA RECETA (CLICK PARA COLAPSAR/EXPANDIR) */}
              <div
                onClick={() => toggleAcordeon(rec.id)}
                className="p-5 bg-white cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl text-slate-400 font-bold w-6 text-center select-none">
                    {estaAbierto ? '▼' : '►'}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{rec.nombre}</h3>
                      {rec.destacado && (
                        <span className="text-[11px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full shadow-xs">
                          ⭐ Favorito
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rendimiento: <strong>{rec.porciones_base} unidad(es)</strong> • {rec.tiempo_minutos} min activos • CIF: {rec.cif_porcentaje || 0}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3" onClick={(e) => e.stopPropagation()}>
                  {/* Desglose Unidad vs Lote */}
                  <div className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl text-xs">
                    <span className="text-[10px] text-amber-900 font-bold block uppercase">Por Unidad:</span>
                    <span className="font-extrabold text-amber-950 text-sm">
                      {formatCOP(costos.precioPorUnidad)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-bold">
                      +{formatCOP(costos.gananciaPorUnidad)} libre
                    </span>
                  </div>

                  {/* Retorno Horario en la Barra (Siempre Positivo y Claro) */}
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Retorno por tu hora:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {formatCOP(costos.valorHoraReal)} / h
                    </span>
                  </div>

                  {/* Precio de Venta Lote */}
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Tanda (x{factor}):</span>
                    <span className="font-extrabold text-slate-900 text-sm">{formatCOP(costos.precioTotalVenta)}</span>
                  </div>

                  {/* Escala Live */}
                  <div className="flex bg-slate-100 rounded-lg p-0.5 space-x-0.5">
                    {[1, 1.5, 2, 3].map((f) => (
                      <button
                        key={f}
                        onClick={() => cambiarEscala(rec.id, f)}
                        className={`px-2 py-0.5 text-xs font-bold rounded ${
                          factor === f ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        x{f}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onEditarReceta(rec)}
                    className="text-xs text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg font-bold transition-colors"
                  >
                    ✏️ Editar
                  </button>
                </div>
              </div>

              {/* CUERPO EXPANDIDO (SOLO SI ESTÁ ABIERTO) */}
              {estaAbierto && (
                <div className="p-6 border-t border-slate-200 bg-slate-50/40 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Columna 1 y 2: Ingredientes y Porcentajes */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Ingredientes y Participación Porcentual (Escala x{factor}):
                      </h4>
                      <span className="text-[11px] text-slate-500 font-semibold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                        Total Insumos: <strong className="text-emerald-700">{formatCOP(costos.costoInsumos)}</strong>
                      </span>
                    </div>

                    {/* TABLA DE INGREDIENTES CON % COSTO Y % PESO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {(rec.ingredientes || []).map((ing, idx) => {
                        const ins = insumos.find((i) => i.id === ing.insumo_id);
                        const cant = ing.cantidad * factor;
                        const costoUnit =
                          ins && ins.gramos_por_empaque > 0 ? ins.costo_empaque / ins.gramos_por_empaque : 0;
                        const costoIng = cant * costoUnit;

                        // Porcentaje en el costo total de insumos
                        const porcCosto =
                          costos.costoInsumos > 0 ? Math.round((costoIng / costos.costoInsumos) * 100) : 0;

                        // Porcentaje en peso de la fórmula
                        const esPeso = ins?.unidad === 'g' || ins?.unidad === 'ml';
                        const porcPeso =
                          esPeso && pesoTotalGramos > 0 ? Math.round((cant / pesoTotalGramos) * 100) : null;

                        return (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {ins?.nombre || 'Insumo no encontrado'}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {cant} {ins?.unidad || ''}
                                </span>
                              </div>
                              <span className="font-black text-slate-900 text-xs">{formatCOP(costoIng)}</span>
                            </div>

                            {/* Píldoras de Porcentajes (% Costo y % Peso) */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px]">
                              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <span>💰</span>
                                <span>{porcCosto}% costo</span>
                              </span>
                              {porcPeso !== null && (
                                <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                  <span>⚖️</span>
                                  <span>{porcPeso}% peso</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rendimiento de Molde & Recortes Sobrantes si está configurado */}
                    {rec.molde_config && (
                      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-amber-950 block">
                            📐 Geometría del Molde & Aprovechamiento de Recortes:
                          </span>
                          <span className="text-amber-800 text-[11px]">
                            Salen <strong>{rec.molde_config.piezas_por_molde} piezas enteras</strong> +{' '}
                            <strong>{rec.molde_config.peso_o_unidades_recorte} bolsitas de recortes</strong> sobrantes.
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-amber-700 block uppercase font-bold">Ingreso Extra Recortes:</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            +{formatCOP(rec.molde_config.peso_o_unidades_recorte * rec.molde_config.precio_recorte)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Columna 3: Desglose Financiero & Simulador de Salario */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 text-xs">
                      <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider border-b border-slate-100 pb-2">
                        Escandallo de la Tanda (x{factor}):
                      </h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Costo Insumos:</span>
                        <span className="font-bold text-slate-800">{formatCOP(costos.costoInsumos)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Consumo Eléctrico:</span>
                        <span className="font-bold text-slate-800">{formatCOP(costos.costoEnergia)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CIF Indirecto ({rec.cif_porcentaje || 0}%):</span>
                        <span className="font-bold text-slate-800">{formatCOP(costos.costoCIF)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-100">
                        <span>Costo Total Producción:</span>
                        <span className="text-rose-600 font-extrabold">{formatCOP(costos.costoTotal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-emerald-800 pt-1">
                        <span>Ganancia Limpia (Bolsillo):</span>
                        <span className="text-emerald-700 font-black text-sm">{formatCOP(costos.remanenteNeto)}</span>
                      </div>
                    </div>

                    {/* SIMULADOR DE SALARIO REAL */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          🎯 Simulador de Salario
                        </span>
                        <button
                          onClick={() => toggleSimulador(rec.id)}
                          className="text-xs text-amber-300 hover:text-white underline"
                        >
                          {simAbierto ? 'Ocultar' : 'Ajustar Meta'}
                        </button>
                      </div>

                      <div className="text-xs">
                        <span className="text-slate-400 block">Tu sueldo por hora actual:</span>
                        <span className="text-xl font-black text-emerald-400">
                          {formatCOP(costos.valorHoraReal)} / hora
                        </span>
                      </div>

                      {simAbierto && (
                        <div className="space-y-3 pt-3 border-t border-slate-700 text-xs">
                          <div>
                            <div className="flex justify-between text-slate-300 mb-1">
                              <span>Meta Salarial por Hora:</span>
                              <strong className="text-amber-400">{formatCOP(metaActual)} / h</strong>
                            </div>
                            <input
                              type="range"
                              min="10000"
                              max="60000"
                              step="2000"
                              value={metaActual}
                              onChange={(e) =>
                                setMetaHoraria({ ...metaHoraria, [rec.id]: Number(e.target.value) })
                              }
                              className="w-full accent-amber-500"
                            />
                          </div>

                          <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                            <span className="text-slate-400 block text-[11px]">Precio sugerido para cumplir tu meta:</span>
                            <span className="text-base font-black text-amber-300">
                              {formatCOP(precioVentaSugerido)}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {diferenciaPrecio > 0
                                ? `(Cobrarías +${formatCOP(diferenciaPrecio)} más que el precio actual)`
                                : `(¡Tu precio actual ya supera tu meta salarial!)`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
