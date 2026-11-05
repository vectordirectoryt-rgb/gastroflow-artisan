import React, { useState } from 'react';
import { Receta, Insumo } from '../../core/types';
import { calculateRecipeCost } from '../../core/utils/calculations';
import { formatCOP } from '../../core/utils/formatters';
import { Plus, Edit2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [simuladorAbiertoId, setSimuladorAbiertoId] = useState<string | null>(null);
  const [metaHoraria, setMetaHoraria] = useState<number>(25000);
  const [margenDeseado, setMargenDeseado] = useState<number>(20);


  return (
    <div className="space-y-6" data-testid="recetario-view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Recetas & Costeo Real</h1>
          <p className="text-sm text-slate-500">
            Escandallos financieros precisos: ingredientes, consumo eléctrico y tu salario real por hora.
          </p>
        </div>
        <button
          onClick={onNuevaReceta}
          data-testid="btn-nueva-receta"
          className="flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Receta</span>
        </button>
      </div>

      {/* Grid de Recetas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recetas.map((receta) => {
          const costeo = calculateRecipeCost(receta, insumos, tarifaKwh);
          const estaAbiertoSimulador = simuladorAbiertoId === receta.id;

          // Cálculo del Simulador
          const horasInvertidas = (receta.tiempo_minutos || 0) / 60;
          const costoManoObraDeseada = metaHoraria * horasInvertidas;
          const costoBaseTotal = costeo.costoDirectoTotal + costoManoObraDeseada;
          const precioSugeridoSimulado =
            margenDeseado < 100
              ? costoBaseTotal / (1 - margenDeseado / 100)
              : costoBaseTotal * 1.5;

          return (
            <div
              key={receta.id}
              data-testid={`card-receta-${receta.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="p-6">
                {/* Cabecera de la receta */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{receta.nombre}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Rinde: <strong className="text-slate-700">{receta.porciones_base} porciones</strong> • {receta.tiempo_minutos} min de trabajo
                    </p>
                  </div>
                  <button
                    onClick={() => onEditarReceta(receta)}
                    data-testid={`btn-editar-receta-${receta.id}`}
                    className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    title="Editar receta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Desglose de Costos Directos */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Ingredientes</span>
                    <span className="font-bold text-slate-800">{formatCOP(costeo.costoIngredientes)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Energía (kWh)</span>
                    <span className="font-bold text-slate-800">{formatCOP(costeo.costoEquipos)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">CIF ({receta.cif_porcentaje}%)</span>
                    <span className="font-bold text-slate-800">{formatCOP(costeo.costoCif)}</span>
                  </div>
                </div>

                {/* CUADRO OSCURO: Radiografía Financiera y Sueldo Real */}
                <div className="mt-4 bg-slate-900 text-white rounded-xl p-4 shadow-inner space-y-3">
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Costo Directo Total:</span>
                    <span className="font-bold text-amber-400 text-sm">
                      {formatCOP(costeo.costoDirectoTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Precio de Venta Actual:</span>
                    <span className="font-bold text-white text-sm">
                      {formatCOP(receta.precio_venta)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Margen Porcentual:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {costeo.margenPorcentual.toFixed(1)}%
                    </span>
                  </div>

                  {/* EL DATO ESTRELLA */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      ★ Tu Sueldo Real por Hora
                    </div>
                    <div className="text-xl font-black text-emerald-400 tracking-tight" data-testid={`sueldo-hora-${receta.id}`}>
                      {formatCOP(costeo.sueldoPorHora)} / hora
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Dinero libre que ganas por cada hora que inviertes batiendo, horneando y decorando este producto.
                    </p>
                  </div>
                </div>

                {/* Acordeón del Simulador "¿Qué pasaría si...?" */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <button
                    onClick={() =>
                      setSimuladorAbiertoId(estaAbiertoSimulador ? null : receta.id)
                    }
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-amber-800 py-1 transition"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      Simulador: ¿A cuánto vender si quiero ganar más?
                    </span>
                    {estaAbiertoSimulador ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {estaAbiertoSimulador && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 uppercase">
                            Meta Sueldo/Hora (COP):
                          </label>
                          <input
                            type="number"
                            value={metaHoraria}
                            onChange={(e) => setMetaHoraria(Number(e.target.value) || 0)}
                            className="w-full mt-1 bg-white border border-amber-300 rounded-lg p-1.5 font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 uppercase">
                            Margen Libre Negocio (%):
                          </label>
                          <input
                            type="number"
                            value={margenDeseado}
                            onChange={(e) => setMargenDeseado(Number(e.target.value) || 0)}
                            className="w-full mt-1 bg-white border border-amber-300 rounded-lg p-1.5 font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">
                          Precio Sugerido Recomendado:
                        </span>
                        <span className="text-base font-black text-amber-900">
                          {formatCOP(precioSugeridoSimulado)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
