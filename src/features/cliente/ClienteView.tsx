import React, { useState, useMemo } from 'react';
import { Receta, Pedido, GrupoVariante, AppConfig } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';
import {
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Lock,
  Cake,
  Heart,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Star,
} from 'lucide-react';

interface ClienteViewProps {
  recetas: Receta[];
  onCrearPedidoCliente: (pedido: Omit<Pedido, 'id' | 'created_at'>) => Promise<boolean>;
  onAbrirLoginAdmin: () => void;
  config?: AppConfig;
}

interface SlideInfo {
  url: string;
  etiqueta: string;
}

function getSlidesParaReceta(receta: Receta): SlideInfo[] {
  if (receta.fotos_presentacion && receta.fotos_presentacion.length > 0) {
    return receta.fotos_presentacion.map((f) => ({ url: f.url, etiqueta: f.etiqueta }));
  }

  const baseFoto = receta.foto_url || '/cuchara-chocolate.jpg';
  const esTorta = receta.categoria === 'tortas';

  if (esTorta) {
    return [
      { url: baseFoto, etiqueta: 'Porción Tradicional' },
      { url: '/cuchara-chocolate.jpg', etiqueta: 'Decoración Especial' },
      { url: baseFoto, etiqueta: 'Caja Pastelera' },
    ];
  }

  return [
    { url: baseFoto, etiqueta: 'Cuadrado Clásico' },
    { url: '/cuchara-chocolate.jpg', etiqueta: 'Forma de Corazón' },
    { url: baseFoto, etiqueta: 'Empaque Individual' },
    { url: '/cuchara-chocolate.jpg', etiqueta: 'Cajita de Regalo' },
  ];
}

function getGruposVariantes(receta: Receta): GrupoVariante[] {
  if (receta.grupos_variantes && receta.grupos_variantes.length > 0) {
    return receta.grupos_variantes;
  }

  if (receta.categoria === 'otros') {
    return [];
  }

  if (receta.categoria === 'tortas') {
    return [
      {
        id: 'tamano',
        titulo: 'Tamaño de Torta',
        tipo: 'tamano',
        opciones: [
          { id: 'torta_med', nombre: 'Mediana (6 - 8 porciones)', precio_adicional: 0, foto_idx: 0 },
          { id: 'torta_fam', nombre: 'Familiar (10 - 12 porciones)', precio_adicional: 28000, foto_idx: 1 },
        ],
      },
      {
        id: 'empaque',
        titulo: 'Presentación & Empaque',
        tipo: 'empaque',
        opciones: [
          { id: 'emp_std', nombre: 'Caja Pastelera Estándar', precio_adicional: 0, foto_idx: 2 },
          { id: 'emp_reg', nombre: 'Caja de Lujo Celebración', precio_adicional: 6000, foto_idx: 1 },
        ],
      },
    ];
  }

  // Brownies y postres artesanales
  const baseP = receta.precio_venta || 6000;
  return [
    {
      id: 'tamano',
      titulo: 'Tamaño / Cantidad de Porciones',
      tipo: 'tamano',
      opciones: [
        { id: 'tam_ind', nombre: 'Individual (1 und)', precio_adicional: 0, foto_idx: 0 },
        { id: 'tam_caja4', nombre: 'Caja x 4 unds', precio_adicional: Math.round(baseP * 3 * 0.95), foto_idx: 3 },
        { id: 'tam_caja6', nombre: 'Caja x 6 unds', precio_adicional: Math.round(baseP * 5 * 0.9), foto_idx: 3 },
      ],
    },
    {
      id: 'forma',
      titulo: 'Forma del Brownie',
      tipo: 'forma',
      opciones: [
        { id: 'forma_cuad', nombre: 'Cuadrado Clásico', precio_adicional: 0, foto_idx: 0 },
        { id: 'forma_cor', nombre: 'Forma de Corazón', precio_adicional: 2000, foto_idx: 1 },
      ],
    },
    {
      id: 'empaque',
      titulo: 'Presentación / Empaque',
      tipo: 'empaque',
      opciones: [
        { id: 'emp_ind', nombre: 'Empaque Individual', precio_adicional: 0, foto_idx: 2 },
        { id: 'emp_regalo', nombre: 'Cajita de Regalo con Moño', precio_adicional: 3500, foto_idx: 3 },
      ],
    },
  ];
}

export const ClienteView: React.FC<ClienteViewProps> = ({
  recetas,
  onCrearPedidoCliente,
  onAbrirLoginAdmin,
  config,
}) => {
  const logoUrl = config?.branding?.logoUrl || '/logo-brownies-josefina.png';
  const eslogan = config?.branding?.eslogan || 'Encuentra aquí el amor más dulce';
  const subtitulo = config?.branding?.subtitulo || 'Repostería & Chocolatería Artesanal';
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [recetaParaPedir, setRecetaParaPedir] = useState<Receta | null>(null);

  // Estados del Carrusel y Variantes
  const [carruselIdx, setCarruselIdx] = useState(0);
  const [tamanoId, setTamanoId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [empaqueId, setEmpaqueId] = useState('');

  // Formulario de encargo
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [fechaEntrega, setFechaEntrega] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [horaEntrega, setHoraEntrega] = useState('15:00');
  const [notas, setNotas] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState<Pedido | null>(null);

  // Filtrado de recetas visibles
  const recetasVisibles = useMemo(() => {
    return recetas.filter((r) => r.visible_en_tienda !== false);
  }, [recetas]);

  const recetasDestacadas = useMemo(() => {
    return recetasVisibles.filter((r) => r.destacado);
  }, [recetasVisibles]);

  // Filtro unificado sin duplicación de secciones
  const recetasFiltradas = useMemo(() => {
    if (categoriaSeleccionada === 'todos') return recetasVisibles;
    if (categoriaSeleccionada === 'favoritos') return recetasDestacadas;
    return recetasVisibles.filter((r) => (r.categoria || 'brownies') === categoriaSeleccionada);
  }, [recetasVisibles, recetasDestacadas, categoriaSeleccionada]);

  // Slides y Grupos de Variantes para la receta abierta
  const slides = useMemo(() => {
    return recetaParaPedir ? getSlidesParaReceta(recetaParaPedir) : [];
  }, [recetaParaPedir]);

  const grupos = useMemo(() => {
    return recetaParaPedir ? getGruposVariantes(recetaParaPedir) : [];
  }, [recetaParaPedir]);

  // Variantes seleccionadas activas
  const opcionTamano = useMemo(() => {
    const grupo = grupos.find((g) => g.tipo === 'tamano');
    return grupo?.opciones.find((o) => o.id === tamanoId) || grupo?.opciones[0];
  }, [grupos, tamanoId]);

  const opcionForma = useMemo(() => {
    const grupo = grupos.find((g) => g.tipo === 'forma');
    return grupo?.opciones.find((o) => o.id === formaId) || grupo?.opciones[0];
  }, [grupos, formaId]);

  const opcionEmpaque = useMemo(() => {
    const grupo = grupos.find((g) => g.tipo === 'empaque');
    return grupo?.opciones.find((o) => o.id === empaqueId) || grupo?.opciones[0];
  }, [grupos, empaqueId]);

  // Precio unitario dinámico basado en las opciones elegidas
  const precioUnitario = useMemo(() => {
    if (!recetaParaPedir) return 0;
    const extraTam = opcionTamano?.precio_adicional || 0;
    const extraForma = opcionForma?.precio_adicional || 0;
    const extraEmp = opcionEmpaque?.precio_adicional || 0;
    return recetaParaPedir.precio_venta + extraTam + extraForma + extraEmp;
  }, [recetaParaPedir, opcionTamano, opcionForma, opcionEmpaque]);

  // Total calculado dinámicamente con cantidad
  const totalCalculado = useMemo(() => {
    return precioUnitario * cantidad;
  }, [precioUnitario, cantidad]);

  const handleAbrirModal = (receta: Receta) => {
    setRecetaParaPedir(receta);
    setCantidad(1);
    setCarruselIdx(0);
    const gruposRec = getGruposVariantes(receta);
    const tam = gruposRec.find((g) => g.tipo === 'tamano')?.opciones[0]?.id || '';
    const for_ = gruposRec.find((g) => g.tipo === 'forma')?.opciones[0]?.id || '';
    const emp = gruposRec.find((g) => g.tipo === 'empaque')?.opciones[0]?.id || '';
    setTamanoId(tam);
    setFormaId(for_);
    setEmpaqueId(emp);
  };

  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recetaParaPedir || !clienteNombre.trim() || !clienteTelefono.trim()) return;

    setEnviando(true);

    // Resumen de variantes para guardar en notas y mantener compatibilidad total con Supabase
    const detallesVariantes = [
      opcionTamano ? `Tamaño: ${opcionTamano.nombre}` : null,
      opcionForma ? `Forma: ${opcionForma.nombre}` : null,
      opcionEmpaque ? `Empaque: ${opcionEmpaque.nombre}` : null,
    ].filter(Boolean).join(' | ');

    const notasCompletas = detallesVariantes
      ? `[Variantes: ${detallesVariantes}]${notas.trim() ? '\n' + notas.trim() : ''}`
      : notas.trim();

    const empaqueFinal = opcionEmpaque
      ? { nombre_caja: opcionEmpaque.nombre, cantidad_cajas: cantidad }
      : undefined;

    const nuevoPedido: Omit<Pedido, 'id' | 'created_at'> = {
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      receta_id: recetaParaPedir.id,
      cantidad,
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      notas: notasCompletas,
      precio_total: totalCalculado,
      abono: 0,
      saldo_pendiente: totalCalculado,
      estado: 'pendiente',
      origen: 'cliente',
      empaque_sugerido: empaqueFinal,
    };

    const exito = await onCrearPedidoCliente(nuevoPedido);
    setEnviando(false);
    if (exito) {
      setPedidoExitoso({
        ...nuevoPedido,
        id: 'temp',
        created_at: new Date().toISOString(),
      });
      setRecetaParaPedir(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#22221E] flex flex-col font-sans selection:bg-[#A472B9] selection:text-white">
      {/* Barra Superior Elegante con Identidad de Marca */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DDDABA] shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Logo Oficial de Los Brownies de Josefina */}
            <div className="flex items-center">
              <img
                src={logoUrl}
                alt="Los Brownies de Josefina"
                className="h-14 sm:h-16 w-auto object-contain transition-transform hover:scale-105 duration-200"
              />
              <span className="sr-only">Los Brownies de Josefina</span>
            </div>
          </div>

          <button
            onClick={onAbrirLoginAdmin}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs text-[#22221E] bg-[#ECEBCF]/60 hover:bg-[#ECEBCF] rounded-xl transition-all border border-[#DDDABA] shadow-xs hover:shadow-sm"
            title="Acceso Administración"
          >
            <Lock className="w-3.5 h-3.5 text-[#A472B9]" />
            <span className="hidden sm:inline font-bold">Taller / Admin</span>
          </button>
        </div>
      </header>

      {/* Hero Banner Limpio con Paleta Oficial y Eslogan como Título Principal */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-[#22221E] text-[#ECEBCF] shadow-lg">
        {/* Fondo con la imagen de la cuchara con chocolate integrada estéticamente */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/cuchara-chocolate.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-center scale-110 opacity-20 filter blur-[2px] mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#22221E] via-[#22221E]/95 to-[#22221E]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,189,144,0.15),transparent_60%)]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna de Texto: ESLOGAN OFICIAL COMO TÍTULO PRINCIPAL */}
            <div className="lg:col-span-8 text-center lg:text-left space-y-4">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-[#B6BD90]/25 text-[#ECEBCF] border border-[#B6BD90]/40 shadow-sm backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#B6BD90]" />
                <span>{subtitulo}</span>
              </div>

              {/* TÍTULO PRINCIPAL: EL ESLOGAN OFICIAL DEL MANUAL */}
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight font-serif text-[#ECEBCF] leading-[1.12]">
                {eslogan}
              </h2>

              <p className="text-[#ECEBCF]/90 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Elaboramos cada brownie, torta y postre artesanal desde cero con dedicación. Elige tu favorito y programa tu encargo.
              </p>
            </div>

            {/* Columna Visual: Tarjeta Estética con la Foto Oficial de la Cuchara de Chocolate */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#A472B9]/40 via-[#B6BD90]/30 to-[#98A1D5]/30 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500" />

                <div className="relative w-56 sm:w-64 rounded-3xl overflow-hidden border-2 border-[#DDDABA]/50 shadow-2xl bg-[#22221E] p-2.5">
                  <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden bg-[#2D231E]">
                    <img
                      src="/cuchara-chocolate.jpg"
                      alt="Cuchara con chocolate artesanal de Josefina"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#22221E]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 bg-[#22221E]/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#DDDABA]/30 text-center">
                      <p className="text-[10px] font-serif font-bold text-[#ECEBCF] tracking-widest uppercase">
                        Los Brownies de Josefina
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {/* Cabecera del Menú y Filtro Unificado */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#22221E] font-serif">
              Nuestro Menú Artesanal
            </h3>
            <p className="text-sm text-[#5C4D43] font-medium">
              Escoge lo que más se te antoje y programa tu entrega fresca
            </p>
          </div>

          {/* Filtros de Categorías con Paleta Oficial y Pestaña de Favoritos */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 bg-white p-1.5 rounded-2xl border border-[#DDDABA] shadow-sm overflow-x-auto max-w-full">
            {[
              { id: 'todos', label: 'Todos', badge: recetasVisibles.length },
              { id: 'favoritos', label: '⭐ Favoritos', badge: recetasDestacadas.length },
              { id: 'brownies', label: 'Brownies', badge: undefined },
              { id: 'tortas', label: 'Tortas', badge: undefined },
              { id: 'postres', label: 'Postres', badge: undefined },
              { id: 'otros', label: 'Otros', badge: undefined },
            ].map((cat) => {
              const active = categoriaSeleccionada === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSeleccionada(cat.id)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    active
                      ? 'bg-[#A472B9] text-white shadow-sm'
                      : 'text-[#22221E] hover:text-[#22221E] hover:bg-[#ECEBCF]/60'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.badge !== undefined && cat.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-[#ECEBCF] text-[#22221E]'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Catálogo en Grid Unificado */}
        {recetasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#DDDABA] shadow-xs">
            <Cake className="w-12 h-12 text-[#A472B9] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-[#22221E] mb-1 font-serif">
              Pronto tendremos delicias en esta sección
            </h4>
            <p className="text-sm text-[#5C4D43]">
              Josefina está horneando nuevas preparaciones en el taller.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recetasFiltradas.map((receta) => {
              const esFavorito = receta.destacado;
              const tieneStock = (receta.stock_anaquel || 0) > 0;

              return (
                <div
                  key={receta.id}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-xl ${
                    esFavorito
                      ? 'border-[#A472B9]/50 hover:border-[#A472B9] bg-gradient-to-b from-[#FFFDF9] to-white'
                      : 'border-[#DDDABA] hover:border-[#A472B9]/70'
                  }`}
                >
                  <div>
                    {/* Contenedor de Imagen de la Receta */}
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#ECEBCF]/60 via-[#F5F4E4] to-[#D6DCBD]/50 mb-4 border border-[#DDDABA]/60">
                      {receta.foto_url ? (
                        <img
                          src={receta.foto_url}
                          alt={receta.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#22221E]/70 p-4 text-center">
                          <Cake className="w-12 h-12 mb-1.5 text-[#A472B9]" />
                          <span className="text-xs font-bold text-[#22221E] font-serif">
                            Los Brownies de Josefina
                          </span>
                          <span className="text-[10px] text-[#5C4D43] font-medium">
                            Repostería Artesanal
                          </span>
                        </div>
                      )}

                      {/* Badge Favorito de la Casa */}
                      {esFavorito && (
                        <span className="absolute top-3 left-3 bg-[#A472B9] text-white text-xs font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                          <Star className="w-3 h-3 fill-white" />
                          <span>Favorito</span>
                        </span>
                      )}

                      {/* Badge de Disponibilidad / Stock */}
                      {tieneStock ? (
                        <span className="absolute bottom-3 left-3 bg-[#B6BD90] text-[#22221E] text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center border border-[#9FA773]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#22221E]" />
                          <span>{receta.stock_anaquel} disponibles hoy</span>
                        </span>
                      ) : (
                        <span className="absolute bottom-3 left-3 bg-[#22221E]/80 backdrop-blur-sm text-[#ECEBCF] text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-[#B6BD90]" />
                          <span>Bajo encargo</span>
                        </span>
                      )}
                    </div>

                    {/* Categoría en Lila Lavanda Oficial */}
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#22221E] bg-[#98A1D5]/25 border border-[#98A1D5]/40 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
                      {receta.categoria || 'brownies'}
                    </span>

                    <h4 className="text-lg font-bold text-[#22221E] mb-1 font-serif group-hover:text-[#A472B9] transition-colors leading-snug">
                      {receta.nombre}
                    </h4>

                    <p className="text-xs text-[#5C4D43] mb-3 font-medium">
                      Porción base: {receta.porciones_base} {receta.porciones_base > 1 ? 'porciones' : 'porción'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#DDDABA]/60 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[11px] text-[#7A6B60] block font-semibold">Desde</span>
                      <span className="text-xl font-black text-[#22221E]">
                        {formatCOP(receta.precio_venta)}
                      </span>
                    </div>

                    {/* Botón CTA en Rosa Malva Oficial */}
                    <button
                      onClick={() => handleAbrirModal(receta)}
                      className="px-5 py-2.5 bg-[#A472B9] hover:bg-[#8C57A3] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Encargar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Artesanal con Identidad de Marca */}
      <footer className="bg-[#22221E] text-[#ECEBCF]/90 py-12 mt-16 border-t border-[#3A3A34]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-brownies-josefina-cream.png"
              alt="Los Brownies de Josefina"
              className="h-16 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>

          <p className="font-serif text-lg font-bold text-[#ECEBCF] mb-1">
            Los Brownies de Josefina
          </p>
          <p className="text-xs font-semibold tracking-[0.25em] text-[#B6BD90] uppercase mb-3">
            {eslogan}
          </p>
          <p className="text-xs text-[#ECEBCF]/70 max-w-md mx-auto mb-6">
            Elaboración artesanal bajo encargo con ingredientes de alta calidad para garantizar frescura incomparable.
          </p>

          <div className="flex items-center justify-center space-x-1.5 text-xs text-[#ECEBCF]/60">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[#A472B9] fill-[#A472B9] inline mx-0.5" />
            <span>para endulzar tus momentos especiales</span>
          </div>
        </div>
      </footer>

      {/* Modal Interactivo de Pedido con Carrusel Etiquetado y Precio Dinámico */}
      {recetaParaPedir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-2 border-[#DDDABA] my-6 text-[#22221E] max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DDDABA]/60 flex-shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A472B9] bg-[#A472B9]/10 px-2.5 py-0.5 rounded-md">
                  Encargo en línea
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#22221E] font-serif mt-0.5">
                  {recetaParaPedir.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecetaParaPedir(null)}
                className="text-[#7A6B60] hover:text-[#22221E] text-2xl font-bold leading-none p-1 transition-colors"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 flex-1 pt-3">
              {/* CARRUSEL DE PRESENTACIONES CON ETIQUETAS CLARAS */}
              <div className="relative rounded-2xl overflow-hidden bg-[#22221E] border-2 border-[#DDDABA] shadow-inner">
                <div className="relative h-48 sm:h-56 w-full overflow-hidden flex items-center justify-center">
                  {slides.length > 0 && (
                    <img
                      src={slides[carruselIdx]?.url}
                      alt={slides[carruselIdx]?.etiqueta}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* ETIQUETA VISIBLE CLARA DEL CARRUSEL */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      data-testid="carrusel-etiqueta"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#22221E]/90 text-[#ECEBCF] border border-[#DDDABA]/50 shadow-lg backdrop-blur-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#B6BD90]" />
                      <span>{slides[carruselIdx]?.etiqueta || 'Presentación'}</span>
                    </span>
                  </div>

                  {/* Botones de navegación Anterior / Siguiente */}
                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCarruselIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
                        }
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#22221E] flex items-center justify-center shadow-md border border-[#DDDABA] transition-transform active:scale-90 z-10"
                        aria-label="Presentación anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCarruselIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#22221E] flex items-center justify-center shadow-md border border-[#DDDABA] transition-transform active:scale-90 z-10"
                        aria-label="Presentación siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Indicadores de Puntos (Dots) */}
                  {slides.length > 1 && (
                    <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-1.5 z-10">
                      {slides.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCarruselIdx(idx)}
                          className={`transition-all rounded-full ${
                            carruselIdx === idx ? 'w-5 h-2 bg-[#A472B9]' : 'w-2 h-2 bg-white/70 hover:bg-white'
                          }`}
                          aria-label={`Ver ${s.etiqueta}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SELECTORES DE OPCIONES CONFIGURABLES CON PRECIO DINÁMICO */}
              {grupos.map((grupo) => {
                let valorActual = '';
                let setValor: (id: string) => void = () => {};

                if (grupo.tipo === 'tamano') {
                  valorActual = tamanoId;
                  setValor = (id: string) => {
                    setTamanoId(id);
                    const op = grupo.opciones.find((o) => o.id === id);
                    if (op && op.foto_idx !== undefined && op.foto_idx < slides.length) {
                      setCarruselIdx(op.foto_idx);
                    }
                  };
                } else if (grupo.tipo === 'forma') {
                  valorActual = formaId;
                  setValor = (id: string) => {
                    setFormaId(id);
                    const op = grupo.opciones.find((o) => o.id === id);
                    if (op && op.foto_idx !== undefined && op.foto_idx < slides.length) {
                      setCarruselIdx(op.foto_idx);
                    }
                  };
                } else if (grupo.tipo === 'empaque') {
                  valorActual = empaqueId;
                  setValor = (id: string) => {
                    setEmpaqueId(id);
                    const op = grupo.opciones.find((o) => o.id === id);
                    if (op && op.foto_idx !== undefined && op.foto_idx < slides.length) {
                      setCarruselIdx(op.foto_idx);
                    }
                  };
                }

                return (
                  <div key={grupo.id} className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#22221E] uppercase tracking-wider">
                      {grupo.titulo}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {grupo.opciones.map((op) => {
                        const seleccionada = valorActual === op.id;
                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() => setValor(op.id)}
                            className={`px-3 py-2.5 rounded-xl text-left border-2 transition-all flex items-center justify-between text-xs font-bold ${
                              seleccionada
                                ? 'border-[#A472B9] bg-[#A472B9] text-white shadow-sm'
                                : 'border-[#DDDABA] bg-[#ECEBCF]/30 hover:bg-[#ECEBCF]/60 text-[#22221E]'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                  seleccionada ? 'border-white bg-white' : 'border-[#DDDABA]'
                                }`}
                              >
                                {seleccionada && <span className="w-1.5 h-1.5 rounded-full bg-[#A472B9]" />}
                              </span>
                              <span>{op.nombre}</span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold ${
                                seleccionada ? 'text-[#ECEBCF]' : 'text-[#7A6B60]'
                              }`}
                            >
                              {op.precio_adicional > 0 ? `+${formatCOP(op.precio_adicional)}` : 'Incluido'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* CANTIDAD DE UNIDADES */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-[#22221E] mb-1 uppercase tracking-wider">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-[#ECEBCF] hover:bg-[#DDDABA] text-[#22221E] font-bold text-lg flex items-center justify-center transition-colors border border-[#DDDABA]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center font-bold text-lg border-2 border-[#DDDABA] rounded-xl py-2 focus:ring-2 focus:ring-[#A472B9] focus:outline-none bg-white text-[#22221E]"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-[#ECEBCF] hover:bg-[#DDDABA] text-[#22221E] font-bold text-lg flex items-center justify-center transition-colors border border-[#DDDABA]"
                  >
                    +
                  </button>
                  <div className="text-xs text-[#5C4D43] font-medium pl-1">
                    <span>{formatCOP(precioUnitario)} c/u</span>
                  </div>
                </div>
              </div>

              {/* DATOS DEL CLIENTE PARA EL ENCARGO */}
              <div className="space-y-3 pt-2 border-t border-[#DDDABA]/60">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#A472B9]">
                  Datos para tu entrega
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#22221E] mb-1">
                      Tu Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. María Gómez"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-[#DDDABA] rounded-xl text-sm focus:ring-2 focus:ring-[#A472B9] focus:outline-none bg-white text-[#22221E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#22221E] mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 300 123 4567"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-[#DDDABA] rounded-xl text-sm focus:ring-2 focus:ring-[#A472B9] focus:outline-none bg-white text-[#22221E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#22221E] mb-1">
                      Fecha Deseada *
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaEntrega}
                      onChange={(e) => setFechaEntrega(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-[#DDDABA] rounded-xl text-sm focus:ring-2 focus:ring-[#A472B9] focus:outline-none bg-white text-[#22221E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#22221E] mb-1">
                      Hora Aproximada
                    </label>
                    <input
                      type="time"
                      value={horaEntrega}
                      onChange={(e) => setHoraEntrega(e.target.value)}
                      className="w-full px-3.5 py-2.5 border-2 border-[#DDDABA] rounded-xl text-sm focus:ring-2 focus:ring-[#A472B9] focus:outline-none bg-white text-[#22221E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#22221E] mb-1">
                    Dedicatoria o Notas Especiales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Dedicatoria para tarjeta de regalo o instrucciones de entrega..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full px-3.5 py-2 border-2 border-[#DDDABA] rounded-xl text-sm focus:ring-2 focus:ring-[#A472B9] focus:outline-none resize-none bg-white text-[#22221E]"
                  />
                </div>
              </div>

              {/* RESUMEN TOTAL CON PRECIO DINÁMICO */}
              <div className="bg-[#ECEBCF]/40 p-4 rounded-2xl border-2 border-[#DDDABA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#5C4D43] font-bold block uppercase tracking-wide">
                    Resumen de tu pedido:
                  </span>
                  <div className="text-xs text-[#22221E] font-semibold">
                    {[opcionTamano?.nombre, opcionForma?.nombre, opcionEmpaque?.nombre]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7A6B60] block font-semibold">
                    Total a pagar ({cantidad} und{cantidad > 1 ? 's' : ''}):
                  </span>
                  <span data-testid="total-dinamico" className="text-2xl font-black text-[#22221E]">
                    {formatCOP(totalCalculado)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-4 border-t border-[#DDDABA]/60 flex items-center space-x-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setRecetaParaPedir(null)}
                className="flex-1 py-3 text-[#5C4D43] hover:text-[#22221E] font-bold text-sm rounded-xl transition-colors bg-[#ECEBCF]/30 hover:bg-[#ECEBCF]/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarPedido}
                disabled={enviando}
                className="flex-[2] py-3 bg-[#A472B9] hover:bg-[#8C57A3] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {enviando ? (
                  <span>Registrando...</span>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Confirmar Encargo ({formatCOP(totalCalculado)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Exitosa */}
      {pedidoExitoso && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#B6BD90]/50 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-[#B6BD90]/30 text-[#22221E] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black border border-[#B6BD90]">
              ✓
            </div>
            <h3 className="text-2xl font-black text-[#22221E] font-serif mb-2">
              ¡Pedido Recibido con Éxito!
            </h3>
            <p className="text-sm text-[#5C4D43] mb-6">
              Muchas gracias, <span className="font-bold text-[#22221E]">{pedidoExitoso.cliente_nombre}</span>. Josefina ya tiene tu encargo agendado en el taller.
            </p>

            <div className="bg-[#ECEBCF]/35 p-4 rounded-2xl border border-[#DDDABA] text-left text-xs space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-[#5C4D43]">Fecha de entrega:</span>
                <span className="font-bold text-[#22221E]">
                  {pedidoExitoso.fecha_entrega} {pedidoExitoso.hora_entrega}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C4D43]">Cantidad:</span>
                <span className="font-bold text-[#22221E]">{pedidoExitoso.cantidad} unidades</span>
              </div>
              {pedidoExitoso.empaque_sugerido && (
                <div className="flex justify-between">
                  <span className="text-[#5C4D43]">Empaque:</span>
                  <span className="font-bold text-[#22221E]">
                    {pedidoExitoso.empaque_sugerido.nombre_caja}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm pt-1 border-t border-[#DDDABA]">
                <span className="font-bold text-[#22221E]">Total:</span>
                <span className="font-black text-[#A472B9]">{formatCOP(pedidoExitoso.precio_total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/573000000000?text=${encodeURIComponent(
                  `Hola Josefina! Acabo de hacer el pedido de ${pedidoExitoso.cantidad} de ${
                    recetas.find((r) => r.id === pedidoExitoso.receta_id)?.nombre || 'Brownies'
                  } para el ${pedidoExitoso.fecha_entrega} a las ${pedidoExitoso.hora_entrega}. Mi nombre es ${pedidoExitoso.cliente_nombre}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setPedidoExitoso(null)}
                className="w-full py-2.5 text-[#5C4D43] hover:text-[#22221E] text-xs font-bold transition-colors"
              >
                Cerrar y seguir viendo el menú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
