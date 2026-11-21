import React, { useState } from 'react';
import { Receta, CategoriaProducto, EmpaqueRegla, FotoPresentacion, AppConfig, ThemeBranding } from '../../core/types';
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
  Palette,
  Camera,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TiendaViewProps {
  recetas: Receta[];
  onActualizarReceta: (receta: Receta) => Promise<void>;
  onVerComoCliente: () => void;
  config?: AppConfig;
  onActualizarConfig?: (config: AppConfig) => Promise<void>;
}

export const TiendaView: React.FC<TiendaViewProps> = ({
  recetas,
  onActualizarReceta,
  onVerComoCliente,
  config,
  onActualizarConfig,
}) => {
  const [subiendoFotoId, setSubiendoFotoId] = useState<string | null>(null);
  const [recetaParaFotos, setRecetaParaFotos] = useState<Receta | null>(null);
  const [recetaParaEmpaque, setRecetaParaEmpaque] = useState<Receta | null>(null);
  const [mostrarPersonalizacion, setMostrarPersonalizacion] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [guardandoBranding, setGuardandoBranding] = useState(false);

  // Estados locales de branding
  const brandingActual: ThemeBranding = config?.branding || {
    logoUrl: '/logo-brownies-josefina-clean.png',
    eslogan: 'Encuentra aquí el amor más dulce',
    subtitulo: 'Repostería & Chocolatería Artesanal',
    paletaId: 'josefina',
    tipografiaId: 'serif',
  };

  const [esloganLocal, setEsloganLocal] = useState(brandingActual.eslogan || 'Encuentra aquí el amor más dulce');
  const [subtituloLocal, setSubtituloLocal] = useState(brandingActual.subtitulo || 'Repostería & Chocolatería Artesanal');
  const [paletaLocal, setPaletaLocal] = useState(brandingActual.paletaId || 'josefina');
  const [tipografiaLocal, setTipografiaLocal] = useState(brandingActual.tipografiaId || 'serif');

  const handleSubirLogo = async (file: File) => {
    setGuardandoBranding(true);
    try {
      const url = await uploadProductPhotoDB(file);
      if (url && onActualizarConfig && config) {
        await onActualizarConfig({
          ...config,
          branding: {
            ...brandingActual,
            logoUrl: url,
          },
        });
      }
    } finally {
      setGuardandoBranding(false);
    }
  };

  const handleGuardarTextosBranding = async () => {
    if (!onActualizarConfig || !config) return;
    setGuardandoBranding(true);
    try {
      await onActualizarConfig({
        ...config,
        branding: {
          ...brandingActual,
          eslogan: esloganLocal.trim(),
          subtitulo: subtituloLocal.trim(),
          paletaId: paletaLocal,
          tipografiaId: tipografiaLocal,
        },
      });
    } finally {
      setGuardandoBranding(false);
    }
  };

  const handleSubirFotoPrincipal = async (receta: Receta, file: File) => {
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

  const recetasFiltradas = recetas.filter((r) => {
    if (filtroCategoria === 'todos') return true;
    if (filtroCategoria === 'favoritos') return r.destacado;
    return (r.categoria || 'brownies') === filtroCategoria;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Encabezado del Editor de Catálogo en Paleta Josefina */}
      <div className="bg-[#22221E] text-[#ECEBCF] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#3A3A34] flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#A472B9]/20 text-[#A472B9] border border-[#A472B9]/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Control de Catálogo y Menú Digital
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
            Catálogo Web — Los Brownies de Josefina
          </h2>
          <p className="text-[#ECEBCF]/75 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
            Personaliza cómo ven tus clientes los productos, las fotos de cada presentación o empaque, el logo y los colores oficiales de la tienda en línea.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMostrarPersonalizacion(!mostrarPersonalizacion)}
            className="px-4 py-2.5 bg-[#2E2E29] hover:bg-[#3A3A34] text-[#ECEBCF] font-bold text-xs rounded-xl border border-[#3A3A34] shadow-sm transition flex items-center space-x-2"
          >
            <Palette className="w-4 h-4 text-[#B6BD90]" />
            <span>{mostrarPersonalizacion ? 'Ocultar Estética' : '🎨 Personalizar Estética'}</span>
            {mostrarPersonalizacion ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onVerComoCliente}
            className="px-4 py-2.5 bg-[#A472B9] hover:bg-[#925ea7] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center space-x-2 whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver Tienda en Vivo</span>
          </button>
        </div>
      </div>

      {/* PANEL EXPANDIBLE: PERSONALIZACIÓN DE MARCA, LOGO, COLORES Y TIPOGRAFÍA */}
      {mostrarPersonalizacion && (
        <div className="bg-white rounded-3xl border border-[#DDDABA] shadow-lg p-6 sm:p-8 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-[#DDDABA]/50 mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ECEBCF] flex items-center justify-center text-[#22221E]">
                <Palette className="w-5 h-5 text-[#A472B9]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#22221E] font-serif">
                  Identidad Visual & Estilo de la Tienda
                </h3>
                <p className="text-xs text-[#7A6B60]">
                  Edita el logo, el eslogan y la paleta de colores para que refleje fielmente la marca.
                </p>
              </div>
            </div>
            {guardandoBranding && (
              <span className="text-xs font-bold text-[#A472B9] animate-pulse">Guardando cambios...</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Logo de la Tienda */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider">
                Logo de la Tienda
              </label>
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-2xl bg-[#ECEBCF] border border-[#DDDABA] p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                  <img
                    src={brandingActual.logoUrl || '/logo-brownies-josefina-clean.png'}
                    alt="Logo actual"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="cursor-pointer px-3 py-1.5 bg-[#22221E] hover:bg-[#3A3A34] text-[#ECEBCF] text-xs font-bold rounded-lg transition inline-flex items-center space-x-1 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir nuevo logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSubirLogo(file);
                      }}
                    />
                  </label>
                  {brandingActual.logoUrl !== '/logo-brownies-josefina-clean.png' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (onActualizarConfig && config) {
                          await onActualizarConfig({
                            ...config,
                            branding: { ...brandingActual, logoUrl: '/logo-brownies-josefina-clean.png' },
                          });
                        }
                      }}
                      className="text-[11px] text-[#7A6B60] hover:text-[#22221E] underline text-left"
                    >
                      Restablecer original
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Eslogan y Subtítulo */}
            <div className="space-y-2 md:col-span-2">
              <div>
                <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider mb-1">
                  Eslogan Principal
                </label>
                <input
                  type="text"
                  value={esloganLocal}
                  onChange={(e) => setEsloganLocal(e.target.value)}
                  onBlur={handleGuardarTextosBranding}
                  placeholder="Ej. Encuentra aquí el amor más dulce"
                  className="w-full px-3 py-2 bg-[#FDFCF7] border border-[#DDDABA] rounded-xl text-xs font-medium text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider mb-1">
                  Subtítulo / Especialidad
                </label>
                <input
                  type="text"
                  value={subtituloLocal}
                  onChange={(e) => setSubtituloLocal(e.target.value)}
                  onBlur={handleGuardarTextosBranding}
                  placeholder="Ej. Repostería & Chocolatería Artesanal"
                  className="w-full px-3 py-2 bg-[#FDFCF7] border border-[#DDDABA] rounded-xl text-xs font-medium text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                />
              </div>
            </div>

            {/* 3. Paleta de Colores & Tipografía */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider mb-1">
                  Paleta de Colores
                </label>
                <select
                  value={paletaLocal}
                  onChange={(e) => {
                    const val = (e.target.value as ThemeBranding['paletaId']) || 'josefina';
                    setPaletaLocal(val);
                    if (onActualizarConfig && config) {
                      onActualizarConfig({
                        ...config,
                        branding: { ...brandingActual, paletaId: val },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#FDFCF7] border border-[#DDDABA] rounded-xl text-xs font-bold text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                >
                  <option value="josefina">Josefina Clásica (Crema & Malva)</option>
                  <option value="pastel">Rosa Pastel & Chocolate</option>
                  <option value="caramelo">Caramelo & Moka</option>
                  <option value="menta">Menta Fresca & Cacao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider mb-1">
                  Estilo de Tipografía
                </label>
                <select
                  value={tipografiaLocal}
                  onChange={(e) => {
                    const val = (e.target.value as ThemeBranding['tipografiaId']) || 'serif';
                    setTipografiaLocal(val);
                    if (onActualizarConfig && config) {
                      onActualizarConfig({
                        ...config,
                        branding: { ...brandingActual, tipografiaId: val },
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#FDFCF7] border border-[#DDDABA] rounded-xl text-xs font-bold text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                >
                  <option value="serif">Serif Repostera Clásica (Playfair)</option>
                  <option value="sans">Sans Moderna Limpia (Inter)</option>
                  <option value="clasica">Elegante Boutique (Cinzel)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS POR CATEGORÍA EN EL CATÁLOGO */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#DDDABA] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'favoritos', label: '⭐ Favoritos' },
            { id: 'brownies', label: 'Brownies' },
            { id: 'tortas', label: 'Tortas' },
            { id: 'postres', label: 'Postres' },
            { id: 'otros', label: 'Otros' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filtroCategoria === cat.id
                  ? 'bg-[#22221E] text-[#ECEBCF] shadow-xs'
                  : 'bg-[#ECEBCF]/40 text-[#5C4D43] hover:bg-[#ECEBCF] hover:text-[#22221E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-[#7A6B60]">
          Mostrando {recetasFiltradas.length} de {recetas.length} productos
        </span>
      </div>

      {/* CUADRÍCULA DE PRODUCTOS (Fiel a la estética visual del cliente) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recetasFiltradas.map((receta) => {
          const esVisible = receta.visible_en_tienda ?? true;
          const esDestacado = receta.destacado ?? false;
          const subiendoEstaFoto = subiendoFotoId === receta.id;
          const cantFotos = receta.fotos_presentacion?.length || (receta.foto_url ? 1 : 0);
          const cantReglasEmpaque = receta.empaque_reglas?.length || 0;

          return (
            <div
              key={receta.id}
              className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                esVisible
                  ? 'bg-white border-[#DDDABA] hover:border-[#A472B9] hover:shadow-lg shadow-sm'
                  : 'bg-[#FDFCF7] border-dashed border-[#DDDABA] opacity-60'
              }`}
            >
              {/* Imagen Superior con Overlay y Badges */}
              <div className="relative h-48 bg-[#ECEBCF]/60 overflow-hidden group">
                {receta.foto_url ? (
                  <img
                    src={receta.foto_url}
                    alt={receta.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#7A6B60] text-xs">
                    <ImageIcon className="w-8 h-8 mb-1 text-[#A472B9]/50" />
                    <span>Sin foto principal</span>
                  </div>
                )}

                {/* Badges Flotantes */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <select
                    value={receta.categoria || 'brownies'}
                    onChange={(e) =>
                      handleCambiarCategoria(receta, e.target.value as CategoriaProducto)
                    }
                    className="text-[11px] font-bold bg-[#22221E]/80 backdrop-blur-xs text-[#ECEBCF] rounded-lg px-2 py-0.5 border border-white/20 uppercase"
                  >
                    <option value="brownies">Brownie</option>
                    <option value="tortas">Torta</option>
                    <option value="postres">Postre</option>
                    <option value="otros">Otro</option>
                  </select>

                  {esDestacado && (
                    <span className="text-[11px] bg-[#A472B9] text-white font-extrabold px-2 py-0.5 rounded-lg shadow-xs flex items-center space-x-1">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Destacado</span>
                    </span>
                  )}
                </div>

                {/* Botón flotante para cambiar foto de portada */}
                <label className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center space-x-1 backdrop-blur-xs shadow-md">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{subiendoEstaFoto ? 'Subiendo...' : 'Cambiar Portada'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={subiendoEstaFoto}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSubirFotoPrincipal(receta, file);
                    }}
                  />
                </label>
              </div>

              {/* Contenido del Producto */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-[#22221E] text-base leading-snug font-serif">
                      {receta.nombre}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-base font-black text-[#A472B9]">
                      {formatCOP(receta.precio_venta)}
                    </span>
                    <span className="text-xs text-[#7A6B60]">
                      • {receta.porciones_base} porciones base
                    </span>
                  </div>
                </div>

                {/* Stock de Vitrina / Anaquel */}
                <div className="p-3 bg-[#ECEBCF]/30 rounded-2xl border border-[#DDDABA]/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#5C4D43] uppercase block tracking-wider">
                      Stock en Vitrina
                    </span>
                    <span className="text-xs font-black text-[#22221E]">
                      {receta.stock_anaquel || 0} listos para despacho
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleAjustarStockAnaquel(receta, -1)}
                      className="w-7 h-7 bg-white hover:bg-[#ECEBCF] border border-[#DDDABA] rounded-lg text-[#22221E] font-bold text-xs flex items-center justify-center transition shadow-2xs"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAjustarStockAnaquel(receta, 1)}
                      className="w-7 h-7 bg-[#22221E] hover:bg-[#3A3A34] text-[#ECEBCF] rounded-lg font-bold text-xs flex items-center justify-center transition shadow-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Botones de Gestión de Galería y Empaques */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecetaParaFotos(receta)}
                    className="p-2.5 rounded-xl border border-[#DDDABA] bg-white hover:bg-[#ECEBCF]/40 text-[#22221E] text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    title="Subir y etiquetar fotos para el carrusel (formas, empaques, presentaciones)"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#A472B9]" />
                    <span>Galería ({cantFotos})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecetaParaEmpaque(receta)}
                    className="p-2.5 rounded-xl border border-[#DDDABA] bg-white hover:bg-[#ECEBCF]/40 text-[#22221E] text-xs font-bold transition flex items-center justify-center space-x-1.5"
                    title="Configurar cajas y empaques según cantidad"
                  >
                    <Package className="w-3.5 h-3.5 text-[#B6BD90]" />
                    <span>Empaques ({cantReglasEmpaque})</span>
                  </button>
                </div>

                {/* Switches de Visibilidad y Destacado */}
                <div className="flex items-center justify-between pt-3 border-t border-[#DDDABA]/50">
                  <button
                    type="button"
                    onClick={() => handleToggleDestacado(receta)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                      esDestacado
                        ? 'bg-[#A472B9] text-white border-[#A472B9] shadow-xs'
                        : 'bg-white text-[#7A6B60] border-[#DDDABA] hover:bg-[#ECEBCF]/30'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${esDestacado ? 'fill-current' : ''}`} />
                    <span>{esDestacado ? 'Favorito' : 'Hacer Favorito'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleVisible(receta)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                      esVisible
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {esVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-600" />
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

      {/* MODAL 1: GESTIÓN DE FOTOS DE PRESENTACIÓN PARA EL CARRUSEL */}
      {recetaParaFotos && (
        <ModalGestionFotosPresentacion
          receta={recetaParaFotos}
          onClose={() => setRecetaParaFotos(null)}
          onGuardar={async (nuevasFotos) => {
            await onActualizarReceta({
              ...recetaParaFotos,
              fotos_presentacion: nuevasFotos,
            });
            setRecetaParaFotos(null);
          }}
        />
      )}

      {/* MODAL 2: REGLAS DE EMPAQUE */}
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

// =====================================================================
// SUBCOMPONENTE: MODAL DE GESTIÓN DE FOTOS Y PRESENTACIONES DEL CARRUSEL
// =====================================================================
interface ModalGestionFotosProps {
  receta: Receta;
  onClose: () => void;
  onGuardar: (fotos: FotoPresentacion[]) => Promise<void>;
}

const ETIQUETAS_SUGERIDAS = [
  'Cuadrado Clásico',
  'Forma de Corazón',
  'Empaque Individual',
  'Cajita de Regalo con Moño',
  'Decoración Especial',
  'Porción Familiar',
];

const ModalGestionFotosPresentacion: React.FC<ModalGestionFotosProps> = ({
  receta,
  onClose,
  onGuardar,
}) => {
  const [fotos, setFotos] = useState<FotoPresentacion[]>(() => {
    if (receta.fotos_presentacion && receta.fotos_presentacion.length > 0) {
      return [...receta.fotos_presentacion];
    }
    // Si no tiene fotos de presentación, cargar la foto base como primera
    if (receta.foto_url) {
      return [{ url: receta.foto_url, etiqueta: 'Presentación Principal', tipo: 'general' }];
    }
    return [];
  });

  const [subiendo, setSubiendo] = useState(false);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'forma' | 'empaque' | 'tamano' | 'general'>('general');

  const handleSubirNuevaFoto = async (file: File) => {
    setSubiendo(true);
    try {
      const url = await uploadProductPhotoDB(file);
      if (url) {
        const etiquetaFinal = nuevaEtiqueta.trim() || 'Presentación Especial';
        setFotos((prev) => [
          ...prev,
          {
            url,
            etiqueta: etiquetaFinal,
            tipo: nuevoTipo,
          },
        ]);
        setNuevaEtiqueta('');
      }
    } finally {
      setSubiendo(false);
    }
  };

  const handleActualizarEtiqueta = (idx: number, texto: string) => {
    setFotos((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, etiqueta: texto } : f))
    );
  };

  const handleEliminarFoto = (idx: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#DDDABA] max-h-[90vh] flex flex-col justify-between">
        <div className="flex items-start justify-between pb-4 border-b border-[#DDDABA]/50">
          <div>
            <h3 className="text-xl font-extrabold text-[#22221E] font-serif flex items-center space-x-2">
              <Camera className="w-5 h-5 text-[#A472B9]" />
              <span>Galería del Carrusel & Presentaciones</span>
            </h3>
            <p className="text-xs text-[#7A6B60] mt-0.5">{receta.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7A6B60] hover:text-[#22221E] text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-[#5C4D43] my-4 bg-[#ECEBCF]/40 p-3.5 rounded-2xl border border-[#DDDABA]">
          Estas son las fotos y etiquetas que verán los clientes en el carrusel interactivo al pedir este producto (ej. formas, tamaños o empaques de regalo).
        </p>

        {/* LISTADO DE FOTOS ACTUALES */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {fotos.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#7A6B60] bg-[#FDFCF7] rounded-2xl border border-dashed border-[#DDDABA]">
              No hay fotos en la galería todavía. Sube una con el botón inferior.
            </div>
          ) : (
            fotos.map((foto, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-3 p-3 bg-[#FDFCF7] border border-[#DDDABA] rounded-2xl"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#ECEBCF] flex-shrink-0 border border-[#DDDABA]">
                  <img src={foto.url} alt={foto.etiqueta} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-[#A472B9] uppercase">
                      Foto #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={foto.etiqueta}
                      onChange={(e) => handleActualizarEtiqueta(idx, e.target.value)}
                      placeholder="Etiqueta visible (ej. Porción Cuadrada)"
                      className="flex-1 px-2.5 py-1 text-xs border border-[#DDDABA] rounded-lg bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                    />
                  </div>

                  {/* Chips de sugerencia rápida */}
                  <div className="flex flex-wrap gap-1">
                    {ETIQUETAS_SUGERIDAS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleActualizarEtiqueta(idx, sug)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[#ECEBCF]/60 hover:bg-[#ECEBCF] text-[#5C4D43] transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleEliminarFoto(idx)}
                  className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition"
                  title="Eliminar de la galería"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* SUBIR NUEVA FOTO */}
        <div className="pt-4 border-t border-[#DDDABA]/50 space-y-3">
          <h4 className="text-xs font-bold text-[#22221E] uppercase tracking-wider">
            + Agregar Nueva Foto a la Galería
          </h4>

          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value as 'forma' | 'empaque' | 'tamano' | 'general')}
              className="px-2.5 py-2 text-xs border border-[#DDDABA] rounded-xl bg-[#FDFCF7] text-[#22221E] font-bold focus:outline-none focus:border-[#A472B9]"
            >
              <option value="general">Foto General</option>
              <option value="forma">Forma (ej. Corazón)</option>
              <option value="empaque">Empaque / Caja</option>
              <option value="tamano">Tamaño / Porción</option>
            </select>

            <input
              type="text"
              placeholder="Etiqueta (ej. Cajita de Regalo x 4)"
              value={nuevaEtiqueta}
              onChange={(e) => setNuevaEtiqueta(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-[#DDDABA] rounded-xl bg-[#FDFCF7] text-[#22221E] focus:outline-none focus:border-[#A472B9]"
            />

            <label className="cursor-pointer px-4 py-2 bg-[#22221E] hover:bg-[#3A3A34] text-[#ECEBCF] text-xs font-bold rounded-xl transition inline-flex items-center justify-center space-x-1.5 shadow-xs whitespace-nowrap">
              <Upload className="w-4 h-4 text-[#B6BD90]" />
              <span>{subiendo ? 'Subiendo foto...' : 'Seleccionar Foto'}</span>
              <input
                type="file"
                accept="image/*"
                disabled={subiendo}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSubirNuevaFoto(file);
                }}
              />
            </label>
          </div>

          {/* Chips de sugerencia para la nueva foto */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-[#7A6B60]">Sugerencias rápidas:</span>
            {ETIQUETAS_SUGERIDAS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setNuevaEtiqueta(sug)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-[#ECEBCF]/70 hover:bg-[#ECEBCF] text-[#5C4D43] font-bold transition border border-[#DDDABA]"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* BOTONES DE CIERRE Y GUARDADO */}
        <div className="pt-4 flex justify-end space-x-3 border-t border-[#DDDABA]/50 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#7A6B60] hover:text-[#22221E] text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onGuardar(fotos)}
            className="px-5 py-2.5 bg-[#A472B9] hover:bg-[#925ea7] text-white rounded-xl text-xs font-extrabold shadow-md transition"
          >
            Guardar Galería ({fotos.length} fotos)
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================================
// SUBCOMPONENTE: MODAL DE REGLAS DE EMPAQUE
// =====================================================================
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DDDABA]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-extrabold text-[#22221E] font-serif">
              📦 Reglas de Empaque Automático
            </h3>
            <p className="text-xs text-[#7A6B60]">{receta.nombre}</p>
          </div>
          <button onClick={onClose} className="text-[#7A6B60] hover:text-[#22221E] text-2xl font-bold">
            &times;
          </button>
        </div>

        <p className="text-xs text-[#5C4D43] mb-4 bg-[#ECEBCF]/40 p-3 rounded-xl border border-[#DDDABA]">
          Define qué caja se asigna automáticamente cuando un cliente encarga cierta cantidad de unidades.
        </p>

        {/* Lista de Reglas Actuales */}
        <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
          {reglas.length === 0 ? (
            <p className="text-xs text-[#7A6B60] text-center py-4 bg-[#FDFCF7] rounded-xl border border-dashed border-[#DDDABA]">
              Sin reglas configuradas aún. Agrega una abajo.
            </p>
          ) : (
            reglas.map((reg, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#FDFCF7] border border-[#DDDABA] rounded-xl text-xs"
              >
                <div>
                  <span className="font-extrabold text-[#22221E] mr-2">
                    De {reg.min_unidades} a {reg.max_unidades} und:
                  </span>
                  <span className="text-[#5C4D43] font-medium">{reg.nombre_caja}</span>
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
        <form onSubmit={handleAgregarRegla} className="space-y-3 pt-3 border-t border-[#DDDABA]/50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#22221E] mb-0.5">Mínimo</label>
              <input
                type="number"
                min="1"
                value={nuevaMin}
                onChange={(e) => setNuevaMin(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-1.5 border border-[#DDDABA] rounded-lg text-xs bg-[#FDFCF7] text-[#22221E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#22221E] mb-0.5">Máximo</label>
              <input
                type="number"
                min={nuevaMin}
                value={nuevaMax}
                onChange={(e) => setNuevaMax(parseInt(e.target.value) || nuevaMin)}
                className="w-full px-2.5 py-1.5 border border-[#DDDABA] rounded-lg text-xs bg-[#FDFCF7] text-[#22221E]"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#22221E] mb-0.5">Nombre de la Caja / Empaque</label>
            <input
              type="text"
              placeholder="Ej. Caja para 4 Brownies"
              value={nombreCaja}
              onChange={(e) => setNombreCaja(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#DDDABA] rounded-lg text-xs bg-[#FDFCF7] text-[#22221E]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-[#22221E] hover:bg-[#3A3A34] text-[#ECEBCF] rounded-xl text-xs font-bold transition shadow-xs"
          >
            + Agregar Regla
          </button>
        </form>

        <div className="pt-4 flex justify-end space-x-2 border-t border-[#DDDABA]/50 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[#7A6B60] hover:text-[#22221E] text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onGuardar(reglas)}
            className="px-5 py-2 bg-[#A472B9] hover:bg-[#925ea7] text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            Guardar Reglas
          </button>
        </div>
      </div>
    </div>
  );
};
