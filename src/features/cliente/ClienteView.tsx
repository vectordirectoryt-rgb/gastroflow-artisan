import React, { useState, useMemo, useEffect } from 'react';
import { Receta, Pedido, GrupoVariante, AppConfig, ItemPedido, MetodoEntrega, ModoEntregaMixta } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Cake,
  Heart,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Star,
  Trash2,
  Copy,
  Check,
  MapPin,
  Store,
  Gift,
  X,
  Plus,
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

interface PerfilClienteGuardado {
  nombre: string;
  telefono: string;
  direccion?: string;
  barrio?: string;
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
  const whatsappContacto = config?.branding?.telefonoWhatsApp || '573000000000';
  const nequiNumero = config?.branding?.nequiNumero || '300 000 0000';
  const bancolombiaNumero = config?.branding?.bancolombiaNumero || '000-000000-00';
  const direccionTaller = config?.branding?.direccionTaller || 'Taller Los Brownies de Josefina';
  const porcentajeAnticipo = config?.branding?.porcentajeAnticipo || 50;

  // Estados de navegación
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [recetaParaPedir, setRecetaParaPedir] = useState<Receta | null>(null);
  const [mostrarModalCarrito, setMostrarModalCarrito] = useState(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  // Estados del Carrito
  const [carrito, setCarrito] = useState<ItemPedido[]>(() => {
    try {
      const guardado = localStorage.getItem('gf_carrito');
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('gf_carrito', JSON.stringify(carrito));
    } catch {
      // ignora error en cuotas locales
    }
  }, [carrito]);

  // Estados del Carrusel y Variantes en el modal de producto
  const [carruselIdx, setCarruselIdx] = useState(0);
  const [tamanoId, setTamanoId] = useState('');
  const [formaId, setFormaId] = useState('');
  const [empaqueId, setEmpaqueId] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);

  // Perfil del cliente recordado en localStorage
  const [perfilRecordado, setPerfilRecordado] = useState<PerfilClienteGuardado | null>(() => {
    try {
      const data = localStorage.getItem('gf_cliente_perfil');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  // Formulario de Checkout
  const [clienteNombre, setClienteNombre] = useState(() => perfilRecordado?.nombre || '');
  const [clienteTelefono, setClienteTelefono] = useState(() => perfilRecordado?.telefono || '');
  const [metodoEntrega, setMetodoEntrega] = useState<MetodoEntrega>('domicilio');
  const [direccionEntrega, setDireccionEntrega] = useState(() => perfilRecordado?.direccion || '');
  const [barrioEntrega, setBarrioEntrega] = useState(() => perfilRecordado?.barrio || '');
  const [esRegalo, setEsRegalo] = useState(false);
  const [mensajeTarjeta, setMensajeTarjeta] = useState('');
  const [notas, setNotas] = useState('');
  const [modoEntregaMixta, setModoEntregaMixta] = useState<ModoEntregaMixta>('todo_junto');
  const [copiadoTipo, setCopiadoTipo] = useState<string | null>(null);

  // Fechas de entrega
  const fechaHoyStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const fechaMananaStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [fechaEntrega, setFechaEntrega] = useState(fechaMananaStr);
  const [horaEntrega, setHoraEntrega] = useState('15:00');
  const [enviando, setEnviando] = useState(false);
  const [pedidoExitoso, setPedidoExitoso] = useState<Pedido | null>(null);

  // Toast feedback
  const mostrarNotificacion = (texto: string) => {
    setMensajeToast(texto);
    setTimeout(() => setMensajeToast(null), 3000);
  };

  // Filtrado de recetas visibles
  const recetasVisibles = useMemo(() => {
    return recetas.filter((r) => r.visible_en_tienda !== false);
  }, [recetas]);

  const recetasDestacadas = useMemo(() => {
    return recetasVisibles.filter((r) => r.destacado);
  }, [recetasVisibles]);

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

  // Precio unitario dinámico basado en las opciones elegidas en el modal
  const precioUnitario = useMemo(() => {
    if (!recetaParaPedir) return 0;
    const extraTam = opcionTamano?.precio_adicional || 0;
    const extraForma = opcionForma?.precio_adicional || 0;
    const extraEmp = opcionEmpaque?.precio_adicional || 0;
    return recetaParaPedir.precio_venta + extraTam + extraForma + extraEmp;
  }, [recetaParaPedir, opcionTamano, opcionForma, opcionEmpaque]);

  const totalCalculadoModal = useMemo(() => {
    return precioUnitario * cantidadProducto;
  }, [precioUnitario, cantidadProducto]);

  // Totales del carrito completo
  const totalCarrito = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.subtotal, 0);
  }, [carrito]);

  const totalUnidadesCarrito = useMemo(() => {
    return carrito.reduce((acc, it) => acc + it.cantidad, 0);
  }, [carrito]);

  // Detección inteligente de disponibilidad (Vitrina vs Bajo encargo)
  const analisisDisponibilidad = useMemo(() => {
    if (carrito.length === 0) {
      return { todosEnVitrina: false, algunoBajoEncargo: false, esMixto: false };
    }

    const mapaRecetas = new Map(recetas.map((r) => [r.id, r]));
    let itemsEnVitrina = 0;
    let itemsBajoEncargo = 0;

    for (const item of carrito) {
      const rec = mapaRecetas.get(item.receta_id);
      const stock = rec?.stock_anaquel || 0;
      if (stock >= item.cantidad) {
        itemsEnVitrina += 1;
      } else {
        itemsBajoEncargo += 1;
      }
    }

    return {
      todosEnVitrina: itemsEnVitrina > 0 && itemsBajoEncargo === 0,
      algunoBajoEncargo: itemsBajoEncargo > 0,
      esMixto: itemsEnVitrina > 0 && itemsBajoEncargo > 0,
    };
  }, [carrito, recetas]);

  // Actualizar fecha mínima si hay productos bajo encargo
  useEffect(() => {
    if (analisisDisponibilidad.algunoBajoEncargo && modoEntregaMixta === 'todo_junto') {
      if (fechaEntrega === fechaHoyStr) {
        setFechaEntrega(fechaMananaStr);
      }
    }
  }, [analisisDisponibilidad, modoEntregaMixta, fechaEntrega, fechaHoyStr, fechaMananaStr]);

  const handleAbrirModal = (receta: Receta) => {
    setRecetaParaPedir(receta);
    setCantidadProducto(1);
    setCarruselIdx(0);
    const gruposRec = getGruposVariantes(receta);
    const tam = gruposRec.find((g) => g.tipo === 'tamano')?.opciones[0]?.id || '';
    const for_ = gruposRec.find((g) => g.tipo === 'forma')?.opciones[0]?.id || '';
    const emp = gruposRec.find((g) => g.tipo === 'empaque')?.opciones[0]?.id || '';
    setTamanoId(tam);
    setFormaId(for_);
    setEmpaqueId(emp);
  };

  // Crear objeto ItemPedido a partir de la selección actual del modal
  const generarItemSeleccionado = (): ItemPedido => {
    if (!recetaParaPedir) throw new Error('No hay receta');

    const detalles = [
      opcionTamano?.nombre,
      opcionForma?.nombre,
      opcionEmpaque?.nombre,
    ].filter(Boolean).join(' • ');

    const empaqueFinal = opcionEmpaque
      ? { nombre_caja: opcionEmpaque.nombre, cantidad_cajas: cantidadProducto }
      : undefined;

    return {
      receta_id: recetaParaPedir.id,
      receta_nombre: recetaParaPedir.nombre,
      cantidad: cantidadProducto,
      precio_unitario: precioUnitario,
      subtotal: totalCalculadoModal,
      detalles_variante: detalles || undefined,
      foto_url: slides[carruselIdx]?.url || recetaParaPedir.foto_url,
      empaque_sugerido: empaqueFinal,
    };
  };

  const handleAgregarAlCarrito = () => {
    if (!recetaParaPedir) return;
    const nuevoItem = generarItemSeleccionado();

    setCarrito((prev) => {
      // Si ya existe el mismo producto con idénticas variantes, sumamos cantidad
      const indexExistente = prev.findIndex(
        (it) => it.receta_id === nuevoItem.receta_id && it.detalles_variante === nuevoItem.detalles_variante
      );
      if (indexExistente >= 0) {
        const clon = [...prev];
        const exist = clon[indexExistente];
        const nuevaCant = exist.cantidad + nuevoItem.cantidad;
        clon[indexExistente] = {
          ...exist,
          cantidad: nuevaCant,
          subtotal: exist.precio_unitario * nuevaCant,
        };
        return clon;
      }
      return [...prev, nuevoItem];
    });

    mostrarNotificacion(`✓ ${recetaParaPedir.nombre} agregado al carrito`);
    setRecetaParaPedir(null);
  };

  const handleModificarCantidadCarrito = (index: number, delta: number) => {
    setCarrito((prev) => {
      const copia = [...prev];
      const item = copia[index];
      const nuevaCant = item.cantidad + delta;
      if (nuevaCant <= 0) {
        return copia.filter((_, i) => i !== index);
      }
      copia[index] = {
        ...item,
        cantidad: nuevaCant,
        subtotal: item.precio_unitario * nuevaCant,
      };
      return copia;
    });
  };

  const handleEliminarItemCarrito = (index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  // Copiar datos de cuenta bancaria
  const handleCopiarCuenta = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto.replace(/\s+/g, ''));
    setCopiadoTipo(tipo);
    setTimeout(() => setCopiadoTipo(null), 2500);
  };

  // Enviar pedido completo
  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si viene desde el modal unitario directo, agregamos el item al carrito primero
    let itemsParaEnviar = [...carrito];
    if (itemsParaEnviar.length === 0 && recetaParaPedir) {
      itemsParaEnviar = [generarItemSeleccionado()];
    }

    if (itemsParaEnviar.length === 0 || !clienteNombre.trim() || !clienteTelefono.trim()) {
      return;
    }

    setEnviando(true);

    // Guardar perfil silenciosamente en localStorage para recordar al cliente en su próxima visita
    try {
      const perfilAGuardar: PerfilClienteGuardado = {
        nombre: clienteNombre.trim(),
        telefono: clienteTelefono.trim(),
        direccion: direccionEntrega.trim(),
        barrio: barrioEntrega.trim(),
      };
      localStorage.setItem('gf_cliente_perfil', JSON.stringify(perfilAGuardar));
      setPerfilRecordado(perfilAGuardar);
    } catch {
      // Ignorar errores en almacenamiento local
    }

    const totalFinal = itemsParaEnviar.reduce((acc, it) => acc + it.subtotal, 0);
    const cantidadTotal = itemsParaEnviar.reduce((acc, it) => acc + it.cantidad, 0);

    // Resumen de variantes e items para notas (asegura 100% compatibilidad con Supabase)
    const resumenItems = itemsParaEnviar
      .map((it) => `${it.cantidad}x ${it.receta_nombre} (${it.detalles_variante || 'Estándar'}) = ${formatCOP(it.subtotal)}`)
      .join(' | ');

    const lineasNotas = [
      `[ITEMS: ${resumenItems}]`,
      metodoEntrega === 'domicilio'
        ? `[ENTREGA: Domicilio a ${direccionEntrega.trim()} - Barrio: ${barrioEntrega.trim()}]`
        : `[ENTREGA: Recoger en Taller Josefina]`,
      esRegalo && mensajeTarjeta.trim() ? `[DEDICATORIA: ${mensajeTarjeta.trim()}]` : null,
      analisisDisponibilidad.esMixto
        ? `[MODO ENTREGA: ${modoEntregaMixta === 'separado' ? 'En 2 Entregas (Hoy lo disponible + Mañana lo horneado)' : 'Todo junto'}]`
        : null,
      notas.trim() ? `[NOTAS: ${notas.trim()}]` : null,
    ].filter(Boolean).join('\n');

    const nuevoPedido: Omit<Pedido, 'id' | 'created_at'> = {
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      receta_id: itemsParaEnviar[0]?.receta_id || '',
      cantidad: cantidadTotal,
      items: itemsParaEnviar,
      metodo_entrega: metodoEntrega,
      direccion_entrega: metodoEntrega === 'domicilio' ? direccionEntrega.trim() : undefined,
      barrio_entrega: metodoEntrega === 'domicilio' ? barrioEntrega.trim() : undefined,
      mensaje_tarjeta: esRegalo ? mensajeTarjeta.trim() : undefined,
      modo_entrega_mixta: modoEntregaMixta,
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      fecha_entrega_secundaria: modoEntregaMixta === 'separado' ? fechaMananaStr : undefined,
      notas: lineasNotas,
      precio_total: totalFinal,
      abono: 0,
      saldo_pendiente: totalFinal,
      estado: 'pendiente',
      origen: 'cliente',
      empaque_sugerido: itemsParaEnviar[0]?.empaque_sugerido,
    };

    const exito = await onCrearPedidoCliente(nuevoPedido);
    setEnviando(false);

    if (exito) {
      setPedidoExitoso({
        ...nuevoPedido,
        id: 'ped_' + Date.now(),
        created_at: new Date().toISOString(),
      });
      setCarrito([]);
      setRecetaParaPedir(null);
      setMostrarModalCarrito(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF7] text-[#22221E] flex flex-col font-sans selection:bg-[#A472B9] selection:text-white">
      {/* Toast Notification */}
      {mensajeToast && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-[#22221E] text-[#ECEBCF] px-4 py-2.5 rounded-2xl shadow-2xl border border-[#A472B9]/60 flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <span>{mensajeToast}</span>
          <button onClick={() => setMensajeToast(null)} className="text-[#ECEBCF]/70 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Barra Superior con Identidad de Marca y Acceso Carrito */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DDDABA] shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center">
              <img
                src={logoUrl}
                alt="Los Brownies de Josefina"
                className="h-11 sm:h-16 w-auto object-contain transition-transform hover:scale-105 duration-200"
              />
              <span className="sr-only">Los Brownies de Josefina</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón Carrito en Cabecera */}
            <button
              onClick={() => setMostrarModalCarrito(true)}
              className="relative p-2.5 rounded-xl bg-[#ECEBCF]/60 hover:bg-[#ECEBCF] text-[#22221E] border border-[#DDDABA] transition flex items-center space-x-1.5"
              title="Ver mi carrito"
            >
              <ShoppingBag className="w-4 h-4 text-[#A472B9]" />
              <span className="text-xs font-bold hidden sm:inline">Carrito</span>
              {totalUnidadesCarrito > 0 && (
                <span className="bg-[#A472B9] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalUnidadesCarrito}
                </span>
              )}
            </button>

            {/* Acceso Admin */}
            <button
              onClick={onAbrirLoginAdmin}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs text-[#22221E] bg-[#ECEBCF]/40 hover:bg-[#ECEBCF] rounded-xl transition border border-[#DDDABA]"
              title="Acceso Administración"
            >
              <Lock className="w-3.5 h-3.5 text-[#A472B9]" />
              <span className="hidden md:inline font-bold">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Limpio con Paleta Oficial y Eslogan como Título Principal */}
      <section className="relative overflow-hidden py-10 sm:py-16 bg-[#22221E] text-[#ECEBCF] shadow-lg">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center">
            <div className="lg:col-span-8 text-center lg:text-left space-y-3 sm:space-y-4">
              <div className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-[#B6BD90]/25 text-[#ECEBCF] border border-[#B6BD90]/40 shadow-xs backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#B6BD90]" />
                <span>{subtitulo}</span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight font-serif text-[#ECEBCF] leading-[1.15]">
                {eslogan}
              </h2>

              <p className="text-[#ECEBCF]/85 text-xs sm:text-sm max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Elaboramos cada brownie, torta y postre artesanal desde cero con dedicación. Elige tu favorito y programa tu encargo.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#A472B9]/40 via-[#B6BD90]/30 to-[#98A1D5]/30 rounded-3xl blur-lg opacity-70 group-hover:opacity-100 transition duration-500" />
                <div className="relative w-44 sm:w-56 rounded-3xl overflow-hidden border-2 border-[#DDDABA]/50 shadow-2xl bg-[#22221E] p-2">
                  <div className="relative h-48 sm:h-60 w-full rounded-2xl overflow-hidden bg-[#2D231E]">
                    <img
                      src="/cuchara-chocolate.jpg"
                      alt="Cuchara con chocolate artesanal de Josefina"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#22221E]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 bg-[#22221E]/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#DDDABA]/30 text-center">
                      <p className="text-[9px] font-serif font-bold text-[#ECEBCF] tracking-widest uppercase">
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
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 flex-1">
        {/* Cabecera del Menú y Filtros Deslizables */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#22221E] font-serif">
              Nuestro Menú Artesanal
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4D43] font-medium">
              Escoge tus antojos, arma tu pedido y programa tu entrega
            </p>
          </div>

          {/* Chips de Categorías deslizables horizontalmente en móvil */}
          <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl border border-[#DDDABA] shadow-xs overflow-x-auto max-w-full no-scrollbar">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center space-x-1 ${
                    active
                      ? 'bg-[#A472B9] text-white shadow-xs'
                      : 'text-[#22221E] hover:bg-[#ECEBCF]/60'
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

        {/* CUADRÍCULA MÓVIL EN 2 COLUMNAS (grid-cols-2 en celular) */}
        {recetasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-[#DDDABA] shadow-xs">
            <Cake className="w-10 h-10 text-[#A472B9] mx-auto mb-2" />
            <h4 className="text-base font-bold text-[#22221E] mb-1 font-serif">
              Pronto tendremos delicias en esta sección
            </h4>
            <p className="text-xs text-[#5C4D43]">
              Josefina está horneando nuevas preparaciones en el taller.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {recetasFiltradas.map((receta) => {
              const esFavorito = receta.destacado;
              const tieneStock = (receta.stock_anaquel || 0) > 0;

              return (
                <div
                  key={receta.id}
                  onClick={() => handleAbrirModal(receta)}
                  className={`bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-200 flex flex-col justify-between group shadow-xs hover:shadow-lg cursor-pointer ${
                    esFavorito
                      ? 'border-[#A472B9]/50 hover:border-[#A472B9]'
                      : 'border-[#DDDABA] hover:border-[#A472B9]/60'
                  }`}
                >
                  <div>
                    {/* Contenedor de Imagen Cuadrada con Lazy Loading */}
                    <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#ECEBCF]/60 via-[#F5F4E4] to-[#D6DCBD]/50 mb-2.5 border border-[#DDDABA]/60">
                      {receta.foto_url ? (
                        <img
                          src={receta.foto_url}
                          alt={receta.nombre}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#22221E]/60 p-2 text-center">
                          <Cake className="w-8 h-8 mb-1 text-[#A472B9]" />
                          <span className="text-[10px] font-bold font-serif text-[#22221E]">
                            Josefina
                          </span>
                        </div>
                      )}

                      {/* Badges Flotantes */}
                      {esFavorito && (
                        <span className="absolute top-2 left-2 bg-[#A472B9] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span className="hidden sm:inline">Favorito</span>
                        </span>
                      )}

                      {tieneStock ? (
                        <span className="absolute bottom-2 left-2 bg-[#B6BD90] text-[#22221E] text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs flex items-center">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          <span>{receta.stock_anaquel} hoy</span>
                        </span>
                      ) : (
                        <span className="absolute bottom-2 left-2 bg-[#22221E]/80 backdrop-blur-xs text-[#ECEBCF] text-[9px] font-medium px-2 py-0.5 rounded-full">
                          <span>Bajo encargo</span>
                        </span>
                      )}
                    </div>

                    {/* Nombre y Precio */}
                    <h4 className="text-xs sm:text-sm font-bold text-[#22221E] font-serif line-clamp-2 leading-tight group-hover:text-[#A472B9] transition-colors mb-1">
                      {receta.nombre}
                    </h4>

                    <span className="text-sm sm:text-base font-black text-[#A472B9] block">
                      {formatCOP(receta.precio_venta)}
                    </span>
                  </div>

                  {/* Botón CTA compacto */}
                  <div className="pt-2 mt-2 border-t border-[#DDDABA]/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirModal(receta);
                      }}
                      className="w-full py-2 bg-[#A472B9] hover:bg-[#8C57A3] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-xs active:scale-95"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Encargar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BARRA FLOTANTE INFERIOR DE CARRITO MÓVIL (Solo si hay productos y ningún modal abierto) */}
      {carrito.length > 0 && !recetaParaPedir && !mostrarModalCarrito && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-3 duration-300">
          <button
            onClick={() => setMostrarModalCarrito(true)}
            className="w-full bg-[#22221E] hover:bg-[#33332D] text-[#ECEBCF] p-3.5 rounded-2xl shadow-2xl border-2 border-[#A472B9] flex items-center justify-between transition-all group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#A472B9] text-white flex items-center justify-center font-black text-xs shadow-xs">
                {totalUnidadesCarrito}
              </div>
              <div className="text-left">
                <span className="text-[10px] text-[#B6BD90] font-bold block uppercase tracking-wider">
                  Tu Pedido
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-white">
                  {formatCOP(totalCarrito)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs font-extrabold text-[#ECEBCF] group-hover:translate-x-1 transition-transform">
              <span>Ver Carrito</span>
              <ChevronRight className="w-4 h-4 text-[#A472B9]" />
            </div>
          </button>
        </div>
      )}

      {/* Footer Artesanal */}
      <footer className="bg-[#22221E] text-[#ECEBCF]/90 py-10 mt-12 border-t border-[#3A3A34]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-brownies-josefina-cream.png"
              alt="Los Brownies de Josefina"
              className="h-14 w-auto object-contain opacity-90"
            />
          </div>
          <p className="font-serif text-base font-bold text-[#ECEBCF] mb-1">
            Los Brownies de Josefina
          </p>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#B6BD90] uppercase mb-4">
            {eslogan}
          </p>
          <div className="flex items-center justify-center space-x-1.5 text-xs text-[#ECEBCF]/60">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-[#A472B9] fill-[#A472B9]" />
            <span>para endulzar tus momentos especiales</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: CONFIGURADOR DE PRODUCTO (CARRUSEL & VARIANTES) */}
      {recetaParaPedir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border-2 border-[#DDDABA] my-4 text-[#22221E] max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DDDABA]/60 flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A472B9] bg-[#A472B9]/10 px-2 py-0.5 rounded-md">
                  Encargo en línea • Personaliza tu encargo
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#22221E] font-serif mt-0.5">
                  {recetaParaPedir.nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRecetaParaPedir(null)}
                className="text-[#7A6B60] hover:text-[#22221E] text-2xl font-bold p-1 leading-none"
                aria-label="Cerrar modal"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 flex-1 pt-3">
              {/* CARRUSEL DE PRESENTACIONES CON ETIQUETAS VISIBLES */}
              <div className="relative rounded-2xl overflow-hidden bg-[#22221E] border border-[#DDDABA] shadow-inner">
                <div className="relative h-44 sm:h-52 w-full overflow-hidden flex items-center justify-center">
                  {slides.length > 0 && (
                    <img
                      src={slides[carruselIdx]?.url}
                      alt={slides[carruselIdx]?.etiqueta}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* ETIQUETA VISIBLE DEL CARRUSEL (test selector: carrusel-etiqueta) */}
                  <div className="absolute top-3 left-3 z-10">
                    <span
                      data-testid="carrusel-etiqueta"
                      className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-[#22221E]/90 text-[#ECEBCF] border border-[#DDDABA]/50 shadow-lg backdrop-blur-xs"
                    >
                      <Sparkles className="w-3 h-3 text-[#B6BD90]" />
                      <span>{slides[carruselIdx]?.etiqueta || 'Presentación'}</span>
                    </span>
                  </div>

                  {/* Controles de navegación */}
                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCarruselIdx((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#22221E] flex items-center justify-center shadow-md border border-[#DDDABA] z-10"
                        aria-label="Presentación anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCarruselIdx((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-[#22221E] flex items-center justify-center shadow-md border border-[#DDDABA] z-10"
                        aria-label="Presentación siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Indicadores Dots */}
                  {slides.length > 1 && (
                    <div className="absolute bottom-2.5 inset-x-0 flex items-center justify-center space-x-1 z-10">
                      {slides.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCarruselIdx(idx)}
                          className={`transition-all rounded-full ${
                            carruselIdx === idx ? 'w-4 h-1.5 bg-[#A472B9]' : 'w-1.5 h-1.5 bg-white/70'
                          }`}
                          aria-label={`Ver ${s.etiqueta}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* OPCIONES CONFIGURABLES (TAMAÑO, FORMA, EMPAQUE) */}
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
                            className={`px-3 py-2 rounded-xl text-left border-2 transition-all flex items-center justify-between text-xs font-bold ${
                              seleccionada
                                ? 'border-[#A472B9] bg-[#A472B9] text-white shadow-xs'
                                : 'border-[#DDDABA] bg-[#ECEBCF]/30 hover:bg-[#ECEBCF]/60 text-[#22221E]'
                            }`}
                          >
                            <span>{op.nombre}</span>
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

              {/* CANTIDAD */}
              <div>
                <label className="block text-xs font-bold text-[#22221E] mb-1 uppercase tracking-wider">
                  Cantidad
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setCantidadProducto((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-xl bg-[#ECEBCF] hover:bg-[#DDDABA] text-[#22221E] font-bold text-base flex items-center justify-center border border-[#DDDABA]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center font-bold text-base border-2 border-[#DDDABA] rounded-xl py-1.5 bg-white text-[#22221E]"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidadProducto((prev) => prev + 1)}
                    className="w-9 h-9 rounded-xl bg-[#ECEBCF] hover:bg-[#DDDABA] text-[#22221E] font-bold text-base flex items-center justify-center border border-[#DDDABA]"
                  >
                    +
                  </button>
                  <span className="text-xs text-[#5C4D43] font-medium pl-1">
                    {formatCOP(precioUnitario)} c/u
                  </span>
                </div>
              </div>

              {/* SECCIÓN DIRECTA DE ENCARGO RÁPIDO (Permite encargar directamente o añadir al carrito) */}
              <div className="p-3 bg-[#ECEBCF]/40 rounded-2xl border border-[#DDDABA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5C4D43] font-bold">Subtotal:</span>
                  <span data-testid="total-dinamico" className="text-xl font-black text-[#22221E]">
                    {formatCOP(totalCalculadoModal)}
                  </span>
                </div>
              </div>

              {/* Campos de contacto rápidos para compatibilidad directa */}
              <div className="space-y-2 pt-1 border-t border-[#DDDABA]/50">
                <span className="text-[11px] font-bold text-[#A472B9] uppercase tracking-wide block">
                  Tus datos de contacto (se guardarán para la próxima)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ej. María Gómez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 300 123 4567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Dedicatoria o nota especial (opcional)..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9] resize-none"
                />
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: AÑADIR AL CARRITO O CONFIRMAR DIRECTO */}
            <div className="pt-3 border-t border-[#DDDABA]/60 grid grid-cols-2 gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleAgregarAlCarrito}
                className="py-2.5 bg-[#22221E] hover:bg-[#33332D] text-[#ECEBCF] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-[#B6BD90]" />
                <span>Al Carrito</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmarPedido}
                disabled={enviando}
                className="py-2.5 bg-[#A472B9] hover:bg-[#8C57A3] text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-1.5"
              >
                {enviando ? (
                  <span>Agendando...</span>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Confirmar Encargo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DRAWER COMPLETO DE CARRUTO & CHECKOUT */}
      {mostrarModalCarrito && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 shadow-2xl border-2 border-[#DDDABA] my-4 text-[#22221E] max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
            {/* Header Carrito */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DDDABA]/60 flex-shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#A472B9] bg-[#A472B9]/10 px-2 py-0.5 rounded-md">
                  Resumen de Compra
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#22221E] font-serif mt-0.5">
                  🛒 Tu Carrito ({totalUnidadesCarrito} {totalUnidadesCarrito === 1 ? 'item' : 'items'})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalCarrito(false)}
                className="text-[#7A6B60] hover:text-[#22221E] text-2xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 flex-1 pt-3">
              {/* RECONOCIMIENTO DE CLIENTE RECORDADO */}
              {perfilRecordado?.nombre && (
                <div className="bg-[#B6BD90]/20 p-3 rounded-2xl border border-[#B6BD90]/40 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-[#22221E]">
                      ¡Hola de nuevo, {perfilRecordado.nombre}! 👋
                    </span>
                    <p className="text-[11px] text-[#5C4D43]">
                      Tus datos habituales ya están listos para este encargo.
                    </p>
                  </div>
                </div>
              )}

              {/* LISTA DE ITEMS EN EL CARRITO */}
              {carrito.length === 0 ? (
                <div className="text-center py-10 bg-[#FDFCF7] rounded-2xl border border-dashed border-[#DDDABA]">
                  <ShoppingBag className="w-10 h-10 text-[#A472B9] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#22221E]">Tu carrito está vacío</p>
                  <p className="text-xs text-[#7A6B60] mt-0.5">Explora el menú y agrega tus delicias favoritas.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {carrito.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#FDFCF7] border border-[#DDDABA] rounded-2xl flex items-center justify-between gap-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#ECEBCF] overflow-hidden flex-shrink-0 border border-[#DDDABA]">
                        {item.foto_url && (
                          <img src={item.foto_url} alt={item.receta_nombre} className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-[#22221E] truncate font-serif">
                          {item.receta_nombre}
                        </h4>
                        {item.detalles_variante && (
                          <p className="text-[11px] text-[#7A6B60] truncate">{item.detalles_variante}</p>
                        )}
                        <span className="text-xs font-black text-[#A472B9]">
                          {formatCOP(item.subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleModificarCantidadCarrito(idx, -1)}
                          className="w-7 h-7 bg-white hover:bg-[#ECEBCF] border border-[#DDDABA] rounded-lg text-xs font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1">{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => handleModificarCantidadCarrito(idx, 1)}
                          className="w-7 h-7 bg-[#22221E] text-[#ECEBCF] rounded-lg text-xs font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarItemCarrito(idx)}
                          className="p-1 text-rose-600 hover:text-rose-800 ml-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {carrito.length > 0 && (
                <>
                  {/* FORMULARIO DE CONTACTO */}
                  <div className="space-y-2.5 pt-2 border-t border-[#DDDABA]/50">
                    <span className="text-xs font-bold text-[#22221E] uppercase tracking-wider block">
                      Datos de Contacto
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Ej. María Gómez"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 300 123 4567"
                        value={clienteTelefono}
                        onChange={(e) => setClienteTelefono(e.target.value)}
                        className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] focus:outline-none focus:border-[#A472B9]"
                      />
                    </div>
                  </div>

                  {/* MÉTODO DE ENTREGA: RECOGER VS DOMICILIO */}
                  <div className="space-y-2 pt-2 border-t border-[#DDDABA]/50">
                    <span className="text-xs font-bold text-[#22221E] uppercase tracking-wider block">
                      Método de Entrega
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodoEntrega('recoger')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                          metodoEntrega === 'recoger'
                            ? 'bg-[#22221E] text-[#ECEBCF] border-[#22221E]'
                            : 'bg-white text-[#5C4D43] border-[#DDDABA]'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5 text-[#B6BD90]" />
                        <span>Recoger en Taller</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoEntrega('domicilio')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                          metodoEntrega === 'domicilio'
                            ? 'bg-[#22221E] text-[#ECEBCF] border-[#22221E]'
                            : 'bg-white text-[#5C4D43] border-[#DDDABA]'
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#A472B9]" />
                        <span>Envío a Domicilio</span>
                      </button>
                    </div>

                    {metodoEntrega === 'domicilio' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
                        <input
                          type="text"
                          required
                          placeholder="Dirección exacta (Calle, Carrera, Apto)"
                          value={direccionEntrega}
                          onChange={(e) => setDireccionEntrega(e.target.value)}
                          className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Barrio / Sector / Municipio"
                          value={barrioEntrega}
                          onChange={(e) => setBarrioEntrega(e.target.value)}
                          className="px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E]"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#5C4D43] bg-[#ECEBCF]/30 p-2.5 rounded-xl border border-[#DDDABA]">
                        📍 Dirección del taller: <span className="font-bold">{direccionTaller}</span>.
                      </p>
                    )}
                  </div>

                  {/* DEDICATORIA DE REGALO */}
                  <div className="pt-2 border-t border-[#DDDABA]/50 space-y-2">
                    <button
                      type="button"
                      onClick={() => setEsRegalo(!esRegalo)}
                      className="text-xs font-bold text-[#A472B9] hover:text-[#8C57A3] flex items-center space-x-1.5"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{esRegalo ? '✓ Quitar dedicatoria de regalo' : '🎁 ¿Es un regalo? Agrega una tarjeta con dedicatoria'}</span>
                    </button>

                    {esRegalo && (
                      <textarea
                        rows={2}
                        placeholder="Escribe el mensaje para la tarjeta de dedicatoria..."
                        value={mensajeTarjeta}
                        onChange={(e) => setMensajeTarjeta(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E] resize-none animate-in fade-in duration-200"
                      />
                    )}
                  </div>

                  {/* DISPONIBILIDAD INTELIGENTE & FECHA DE ENTREGA */}
                  <div className="space-y-2 pt-2 border-t border-[#DDDABA]/50">
                    <span className="text-xs font-bold text-[#22221E] uppercase tracking-wider block">
                      Fecha y Horario de Entrega
                    </span>

                    {/* Alerta de Carrito Mixto */}
                    {analisisDisponibilidad.esMixto && (
                      <div className="bg-[#ECEBCF]/60 p-3 rounded-2xl border border-[#DDDABA] space-y-2 text-xs">
                        <div className="font-bold text-[#22221E]">
                          ⚡ Tienes productos listos en vitrina y otros que horneamos frescos:
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-start space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="entrega_mixta"
                              checked={modoEntregaMixta === 'todo_junto'}
                              onChange={() => setModoEntregaMixta('todo_junto')}
                              className="mt-0.5 text-[#A472B9]"
                            />
                            <span className="text-[11px] text-[#22221E]">
                              <strong className="block">Recibir todo junto mañana:</strong>
                              Entrega completa cuando todo esté recién horneado (1 solo viaje).
                            </span>
                          </label>

                          <label className="flex items-start space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="entrega_mixta"
                              checked={modoEntregaMixta === 'separado'}
                              onChange={() => setModoEntregaMixta('separado')}
                              className="mt-0.5 text-[#A472B9]"
                            />
                            <span className="text-[11px] text-[#22221E]">
                              <strong className="block">En 2 entregas por separado:</strong>
                              Lo disponible para HOY y lo horneado para MAÑANA (aplican 2 envíos si es a domicilio).
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4D43] mb-0.5">Fecha</label>
                        <input
                          type="date"
                          required
                          min={analisisDisponibilidad.algunoBajoEncargo && modoEntregaMixta === 'todo_junto' ? fechaMananaStr : fechaHoyStr}
                          value={fechaEntrega}
                          onChange={(e) => setFechaEntrega(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5C4D43] mb-0.5">Hora Aprox.</label>
                        <input
                          type="time"
                          value={horaEntrega}
                          onChange={(e) => setHoraEntrega(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-[#DDDABA] rounded-xl text-xs bg-white text-[#22221E]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RESUMEN FINANCIERO Y ANTICIPO */}
                  <div className="bg-[#22221E] text-[#ECEBCF] p-4 rounded-2xl border border-[#3A3A34] space-y-2">
                    <div className="flex justify-between text-xs text-[#ECEBCF]/80">
                      <span>Total Productos:</span>
                      <span className="font-extrabold text-white text-sm">{formatCOP(totalCarrito)}</span>
                    </div>

                    {porcentajeAnticipo < 100 && (
                      <div className="flex justify-between text-xs pt-1.5 border-t border-white/10 text-[#B6BD90]">
                        <span className="font-bold">Anticipo requerido hoy ({porcentajeAnticipo}%):</span>
                        <span className="font-black text-white text-sm">
                          {formatCOP(Math.round((totalCarrito * porcentajeAnticipo) / 100))}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-xs text-[#ECEBCF]/70">
                      <span>Saldo contraentrega:</span>
                      <span>
                        {formatCOP(
                          porcentajeAnticipo < 100
                            ? totalCarrito - Math.round((totalCarrito * porcentajeAnticipo) / 100)
                            : 0
                        )}
                      </span>
                    </div>
                  </div>

                  {/* DATOS DE PAGO CON COPIADO RÁPIDO */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-[#5C4D43] uppercase tracking-wider block">
                      Cuentas de Transferencia (Copia con 1 Clic):
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleCopiarCuenta(nequiNumero, 'nequi')}
                        className="p-2.5 bg-[#FDFCF7] border border-[#DDDABA] hover:border-[#A472B9] rounded-xl flex items-center justify-between text-left transition"
                      >
                        <div>
                          <span className="text-[10px] text-[#7A6B60] block font-bold">Nequi / Daviplata</span>
                          <span className="font-extrabold text-[#22221E]">{nequiNumero}</span>
                        </div>
                        {copiadoTipo === 'nequi' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#A472B9]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopiarCuenta(bancolombiaNumero, 'banco')}
                        className="p-2.5 bg-[#FDFCF7] border border-[#DDDABA] hover:border-[#A472B9] rounded-xl flex items-center justify-between text-left transition"
                      >
                        <div>
                          <span className="text-[10px] text-[#7A6B60] block font-bold">Bancolombia Ahorros</span>
                          <span className="font-extrabold text-[#22221E]">{bancolombiaNumero}</span>
                        </div>
                        {copiadoTipo === 'banco' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#A472B9]" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* BOTÓN DE CONFIRMAR EN EL CARRITO */}
            {carrito.length > 0 && (
              <div className="pt-3 border-t border-[#DDDABA]/60 flex items-center space-x-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setMostrarModalCarrito(false)}
                  className="px-4 py-2.5 text-[#7A6B60] hover:text-[#22221E] text-xs font-bold"
                >
                  Seguir viendo
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarPedido}
                  disabled={enviando}
                  className="flex-1 py-3 bg-[#A472B9] hover:bg-[#8C57A3] text-white rounded-xl text-xs font-extrabold shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {enviando ? (
                    <span>Registrando tu pedido...</span>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Confirmar Encargo ({formatCOP(totalCarrito)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN EXITOSA & WHATSAPP */}
      {pedidoExitoso && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-[#B6BD90]/50 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 bg-[#B6BD90]/30 text-[#22221E] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black border border-[#B6BD90]">
              ✓
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#22221E] font-serif mb-1">
              ¡Pedido Recibido con Éxito!
            </h3>
            <p className="text-xs sm:text-sm text-[#5C4D43] mb-4">
              Muchas gracias, <span className="font-bold text-[#22221E]">{pedidoExitoso.cliente_nombre}</span>. Tu encargo ya está registrado en el taller de Josefina.
            </p>

            <div className="bg-[#ECEBCF]/35 p-3.5 rounded-2xl border border-[#DDDABA] text-left text-xs space-y-1.5 mb-5">
              <div className="flex justify-between">
                <span className="text-[#5C4D43]">Entrega:</span>
                <span className="font-bold text-[#22221E]">
                  {pedidoExitoso.fecha_entrega} • {pedidoExitoso.hora_entrega}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C4D43]">Modalidad:</span>
                <span className="font-bold text-[#22221E]">
                  {pedidoExitoso.metodo_entrega === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en Taller'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#DDDABA]">
                <span className="font-bold text-[#22221E]">Total:</span>
                <span className="font-black text-[#A472B9] text-sm">{formatCOP(pedidoExitoso.precio_total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/${whatsappContacto}?text=${encodeURIComponent(
                  `¡Hola Josefina! Acabo de hacer el pedido #${pedidoExitoso.id} en la página web a nombre de ${pedidoExitoso.cliente_nombre}.\n\nTotal: ${formatCOP(
                    pedidoExitoso.precio_total
                  )} para entrega el ${pedidoExitoso.fecha_entrega} a las ${pedidoExitoso.hora_entrega}.\n\nAquí te adjunto el comprobante de pago de mi transferencia 🧾👇`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setPedidoExitoso(null)}
                className="w-full py-2 text-[#5C4D43] hover:text-[#22221E] text-xs font-bold transition"
              >
                Cerrar y seguir navegando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
