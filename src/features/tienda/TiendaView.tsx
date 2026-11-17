import React, { useState } from 'react';
import { Receta, CategoriaProducto, EmpaqueRegla } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';
import { uploadProductPhotoDB } from '../../services/supabaseService';
import {
  Upload,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Package,
  ExternalLink,
} from 'lucide-react';

interface TiendaViewProps {
  recetas: Receta[];
  onActualizarReceta: (receta: Receta) => Promise<void>;
  onVerComoCliente: () => void;
}

export const TiendaView: React.FC<TiendaViewProps> = ({
  recetas,
  onActualizarReceta,
  onVerComoCliente,
}) => {
  const [subiendoFotoId, setSubiendoFotoId] = useState<string | null>(null);
  const [recetaParaEmpaque, setRecetaParaEmpaque] = useState<Receta | null>(null);

  const handleSubirFoto = async (receta: Receta, file: File) => {
    setSubiendoFotoId(receta.id);
    try {
      const url = await uploadProductPhotoDB(file);
      if (url) {
        await onActualizarReceta({
          ...receta,
          foto_url: url,
        });
      }
    } finally {
      setSubiendoFotoId(null);
    }
  };

  const handleToggleVisible = async (receta: Receta) => {
    const nuevoEstado = !(receta.visible_en_tienda ?? true);
    await onActualizarReceta({
      ...receta,
      visible_en_tienda: nuevoEstado,
    });
  };

  const handleToggleDestacado = async (receta: Receta) => {
    const nuevoEstado = !receta.destacado;
    await onActualizarReceta({
      ...receta,
      destacado: nuevoEstado,
    });
  };

  const handleCambiarCategoria = async (receta: Receta, categoria: CategoriaProducto) => {
    await onActualizarReceta({
      ...receta,
      categoria,
    });
  };

  const handleAjustarStockAnaquel = async (receta: Receta, delta: number) => {
    const nuevoStock = Math.max(0, (receta.stock_anaquel || 0) + delta);
    await onActualizarReceta({
      ...receta,
      stock_anaquel: nuevoStock,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Encabezado del Editor de Tienda */}
      <div className="bg-gradient-to-r from-amber-900 to-amber-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
            Control de Catálogo y Menú Digital
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-amber-50">
            🌐 Mi Tienda — Los Brownies de Josefina
          </h2>
          <p className="text-amber-200/80 text-xs sm:text-sm max-w-xl mt-1">
            Aquí controlas exactamente lo que ven tus clientes en la página web: fotos reales, productos visibles, destacados y stock disponible en vitrina.
          </p>
        </div>

        <button
          onClick={onVerComoCliente}
          className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 whitespace-nowrap self-start md:self-auto"
        >
          <ExternalLink className="w-4 h-4" />
          <span>👁️ Ver como Cliente</span>
        </button>
      </div>

      {/* Lista de Productos para Administrar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-900 font-serif mb-4 flex items-center space-x-2">
          <span>Catálogo de Productos ({recetas.length})</span>
        </h3>

        {recetas.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No tienes recetas creadas todavía. Ve a la pestaña <span className="font-bold text-amber-700">Recetario</span> para crear tu primera receta.
          </div>
        ) : (
          <div className="space-y-4">
            {recetas.map((receta) => {
              const esVisible = receta.visible_en_tienda ?? true;
              const esDestacado = receta.destacado ?? false;
              const subiendoEstaFoto = subiendoFotoId === receta.id;

              return (
                <div
                  key={receta.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    esVisible
                      ? 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                      : 'bg-slate-50/80 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Columna Izquierda: Foto y Nombre */}
                    <div className="flex items-start sm:items-center space-x-4">
                      {/* Subida de Foto */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-amber-50 border border-amber-200 flex-shrink-0 group">
                        {receta.foto_url ? (
                          <img
                            src={receta.foto_url}
                            alt={receta.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-amber-600/40 text-xs text-center p-2">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span>Sin foto</span>
                          </div>
                        )}

                        {/* Overlay para Cambiar Foto */}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[11px] font-bold p-1 text-center">
                          <Upload className="w-4 h-4 mb-1" />
                          <span>{subiendoEstaFoto ? 'Subiendo...' : 'Cambiar foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={subiendoEstaFoto}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.value && e.target.files?.[0];
                              if (file) handleSubirFoto(receta, file);
                            }}
                          />
                        </label>

                        {subiendoEstaFoto && (
                          <div className="absolute inset-0 bg-amber-900/70 flex items-center justify-center text-white text-xs font-bold">
                            Subiendo...
                          </div>
                        )}
                      </div>

                      {/* Información Básica */}
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <select
                            value={receta.categoria || 'brownies'}
                            onChange={(e) =>
                              handleCambiarCategoria(receta, e.target.value as CategoriaProducto)
                            }
                            className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5"
                          >
                            <option value="brownies">Brownies</option>
                            <option value="tortas">Tortas</option>
                            <option value="postres">Postres</option>
                            <option value="otros">Otros</option>
                          </select>

                          {esDestacado && (
                            <span className="text-[11px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-md flex items-center">
                              ⭐ Destacado
                            </span>
                          )}
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                          {receta.nombre}
                        </h4>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                          <span className="font-extrabold text-amber-800 text-sm">
                            {formatCOP(receta.precio_venta)}
                          </span>
                          <span>•</span>
                          <span>{receta.porciones_base} porciones</span>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: Controles de Negocio */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Stock de Anaquel */}
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-2.5 flex items-center space-x-2.5">
                        <div className="text-right">
                          <span className="text-[10px] text-amber-800 font-bold block uppercase">
                            Vitrina / Anaquel
                          </span>
                          <span className="text-sm font-extrabold text-amber-950">
                            {receta.stock_anaquel || 0} listos
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => handleAjustarStockAnaquel(receta, -1)}
                            className="w-7 h-7 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-900 font-bold text-xs flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAjustarStockAnaquel(receta, 1)}
                            className="w-7 h-7 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center justify-center shadow-sm transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Botón de Reglas de Empaque */}
                      <button
                        type="button"
                        onClick={() => setRecetaParaEmpaque(receta)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                        title="Configurar cajas según cantidad"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Empaque ({(receta.empaque_reglas || []).length})</span>
                      </button>

                      {/* Switch Destacado ⭐ */}
                      <button
                        type="button"
                        onClick={() => handleToggleDestacado(receta)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 border ${
                          esDestacado
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                        title="Mostrar en la parte superior como Favorito"
                      >
                        <span>⭐</span>
                        <span>{esDestacado ? 'Destacado' : 'Hacer Destacado'}</span>
                      </button>

                      {/* Switch Visibilidad */}
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(receta)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 border ${
                          esVisible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {esVisible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Oculto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Configurar Reglas de Empaque */}
      {recetaParaEmpaque && (
        <ModalConfiguracionEmpaque
          receta={recetaParaEmpaque}
          onClose={() => setRecetaParaEmpaque(null)}
          onGuardar={async (nuevasReglas) => {
            await onActualizarReceta({
              ...recetaParaEmpaque,
              empaque_reglas: nuevasReglas,
            });
            setRecetaParaEmpaque(null);
          }}
        />
      )}
    </div>
  );
};

// Subcomponente: Modal de Reglas de Empaque
interface ModalConfiguracionEmpaqueProps {
  receta: Receta;
  onClose: () => void;
  onGuardar: (reglas: EmpaqueRegla[]) => Promise<void>;
}

const ModalConfiguracionEmpaque: React.FC<ModalConfiguracionEmpaqueProps> = ({
  receta,
  onClose,
  onGuardar,
}) => {
  const [reglas, setReglas] = useState<EmpaqueRegla[]>(() => receta.empaque_reglas || []);
  const [nuevaMin, setNuevaMin] = useState(1);
  const [nuevaMax, setNuevaMax] = useState(4);
  const [nombreCaja, setNombreCaja] = useState('Caja x 4 unidades');

  const handleAgregarRegla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCaja.trim()) return;

    setReglas([
      ...reglas,
      {
        min_unidades: nuevaMin,
        max_unidades: nuevaMax,
        nombre_caja: nombreCaja.trim(),
      },
    ]);

    setNuevaMin(nuevaMax + 1);
    setNuevaMax(nuevaMax + 4);
    setNombreCaja(`Caja x ${nuevaMax + 4} unidades`);
  };

  const handleEliminarRegla = (index: number) => {
    setReglas(reglas.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 font-serif">
              📦 Reglas de Empaque Automático
            </h3>
            <p className="text-xs text-slate-500">{receta.nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">
            &times;
          </button>
        </div>

        <p className="text-xs text-slate-600 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-200/80">
          Define qué caja se asigna automáticamente cuando un cliente o tú ordenan cierta cantidad de unidades.
        </p>

        {/* Lista de Reglas Actuales */}
        <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
          {reglas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Sin reglas configuradas aún. Agrega una abajo.
            </p>
          ) : (
            reglas.map((reg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <div>
                  <span className="font-bold text-amber-900 mr-2">
                    De {reg.min_unidades} a {reg.max_unidades} und:
                  </span>
                  <span className="text-slate-700 font-medium">{reg.nombre_caja}</span>
                </div>
                <button
                  onClick={() => handleEliminarRegla(idx)}
                  className="text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-50"
                >
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formulario para Agregar Regla */}
        <form onSubmit={handleAgregarRegla} className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Mínimo</label>
              <input
                type="number"
                min="1"
                value={nuevaMin}
                onChange={(e) => setNuevaMin(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Máximo</label>
              <input
                type="number"
                min={nuevaMin}
                value={nuevaMax}
                onChange={(e) => setNuevaMax(parseInt(e.target.value) || nuevaMin)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Nombre de la Caja / Empaque</label>
            <input
              type="text"
              placeholder="Ej. Caja para 4 Brownies"
              value={nombreCaja}
              onChange={(e) => setNombreCaja(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            + Agregar Regla
          </button>
        </form>

        <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onGuardar(reglas)}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md"
          >
            Guardar Reglas
          </button>
        </div>
      </div>
    </div>
  );
};
