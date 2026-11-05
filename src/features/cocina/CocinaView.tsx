import React, { useState } from 'react';
import { Insumo, Receta } from '../../core/types';
import { checkBatchAvailability } from '../../core/utils/calculations';
import { ChefHat, CheckCircle2, AlertOctagon, Flame, ArrowRight } from 'lucide-react';

interface CocinaViewProps {
  recetas: Receta[];
  insumos: Insumo[];
  onDescontarLote: (receta: Receta, escala: number) => void;
}

export const CocinaView: React.FC<CocinaViewProps> = ({ recetas, insumos, onDescontarLote }) => {
  const [recetaSeleccionadaId, setRecetaSeleccionadaId] = useState<string>(recetas[0]?.id || '');
  const [escala, setEscala] = useState<number>(1);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const receta = recetas.find((r) => r.id === recetaSeleccionadaId);
  const { items, todoDisponible } = receta
    ? checkBatchAvailability(receta, insumos, escala)
    : { items: [], todoDisponible: false };

  const handleConfirmar = () => {
    if (!receta) return;
    if (!todoDisponible) {
      if (!window.confirm('⚠️ Faltan ingredientes en bodega. ¿Deseas descontar de todos modos (el stock quedará negativo)?')) {
        return;
      }
    }
    onDescontarLote(receta, escala);
    setMensajeExito(`¡Tanda de "${receta.nombre}" iniciada! Se descontaron los insumos de bodega.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  return (
    <div className="space-y-6" data-testid="cocina-view">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Control de Cocina & Lotes de Producción</h1>
        <p className="text-sm text-slate-500">
          Valida la despensa antes de hornear y descuenta automáticamente los ingredientes de bodega.
        </p>
      </div>

      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Selector de Receta y Escala */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Seleccionar Producto a Cocinar:
            </label>
            <select
              value={recetaSeleccionadaId}
              onChange={(e) => setRecetaSeleccionadaId(e.target.value)}
              data-testid="select-receta-cocina"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
            >
              {recetas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} (Base: {r.porciones_base} porciones)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
              Multiplicador de Tandas:
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEscala(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    escala === val
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validador de Ingredientes */}
      {receta && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <ChefHat className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Pase de Cocina: {receta.nombre} ({escala * receta.porciones_base} porciones)
              </h2>
            </div>
            <div>
              {todoDisponible ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Despensa Lista (100%)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Faltan Ingredientes
                </span>
              )}
            </div>
          </div>

          {/* Tabla de comprobación */}
          <div className="divide-y divide-slate-100">
            {items.map(({ insumo, cantidadRequerida, stockActual, suficiente, faltante }) => (
              <div
                key={insumo.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
              >
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{insumo.nombre}</span>
                  <span className="text-slate-400">
                    Se requieren: <strong className="text-slate-700">{cantidadRequerida} {insumo.unidad}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-slate-400 block">Stock disponible:</span>
                    <span className={`font-bold ${suficiente ? 'text-slate-700' : 'text-rose-600'}`}>
                      {stockActual} {insumo.unidad}
                    </span>
                  </div>

                  <div>
                    {suficiente ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        ✓ Disponible
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        ⚠️ Faltan {faltante} {insumo.unidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón de Confirmación y Descuento */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleConfirmar}
              data-testid="btn-confirmar-lote"
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                todoDisponible
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Confirmar y Descontar Insumos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
