import React, { useState, useMemo } from 'react';
import { Receta, Pedido } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';
import { Sparkles, ShoppingBag, Clock, CheckCircle2, Lock, Cake, Heart, ChevronRight, MessageCircle } from 'lucide-react';

interface ClienteViewProps {
  recetas: Receta[];
  onCrearPedidoCliente: (pedido: Omit<Pedido, 'id' | 'created_at'>) => Promise<boolean>;
  onAbrirLoginAdmin: () => void;
}

export const ClienteView: React.FC<ClienteViewProps> = ({
  recetas,
  onCrearPedidoCliente,
  onAbrirLoginAdmin,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [recetaParaPedir, setRecetaParaPedir] = useState<Receta | null>(null);

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

  const recetasFiltradas = useMemo(() => {
    if (categoriaSeleccionada === 'todos') return recetasVisibles;
    return recetasVisibles.filter((r) => (r.categoria || 'brownies') === categoriaSeleccionada);
  }, [recetasVisibles, categoriaSeleccionada]);

  // Cálculo de empaque sugerido si la receta tiene reglas
  const empaqueSugerido = useMemo(() => {
    if (!recetaParaPedir || !recetaParaPedir.empaque_reglas || recetaParaPedir.empaque_reglas.length === 0) {
      return null;
    }
    const regla = recetaParaPedir.empaque_reglas.find(
      (reg) => cantidad >= reg.min_unidades && cantidad <= reg.max_unidades
    );
    if (regla) {
      return { nombre_caja: regla.nombre_caja, cantidad_cajas: 1 };
    }
    return null;
  }, [recetaParaPedir, cantidad]);

  const totalCalculado = useMemo(() => {
    if (!recetaParaPedir) return 0;
    return recetaParaPedir.precio_venta * cantidad;
  }, [recetaParaPedir, cantidad]);

  const handleConfirmarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recetaParaPedir || !clienteNombre.trim() || !clienteTelefono.trim()) return;

    setEnviando(true);
    const nuevoPedido: Omit<Pedido, 'id' | 'created_at'> = {
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      receta_id: recetaParaPedir.id,
      cantidad,
      fecha_entrega: fechaEntrega,
      hora_entrega: horaEntrega,
      notas: notas.trim(),
      precio_total: totalCalculado,
      abono: 0,
      saldo_pendiente: totalCalculado,
      estado: 'pendiente',
      origen: 'cliente',
      empaque_sugerido: empaqueSugerido || undefined,
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 text-slate-800 flex flex-col">
      {/* Barra Superior Elegante */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-600/20 text-2xl">
              🍫
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-950 font-serif">
                Los Brownies de Josefina
              </h1>
              <p className="text-xs text-amber-700 font-medium">
                Repostería & Chocolatería Artesanal
              </p>
            </div>
          </div>

          <button
            onClick={onAbrirLoginAdmin}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-amber-800/60 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 rounded-lg transition-colors border border-amber-200/50"
            title="Acceso Administración"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Taller / Admin</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-300" />
            Recetas Horneadas con Amor & Cacao Real
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-serif mb-4 text-amber-50">
            El verdadero sabor del Brownie Melcochudo
          </h2>
          <p className="text-amber-100/90 text-sm sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
            Elaboramos cada delicia desde cero, con ingredientes seleccionados y la receta secreta de Josefina. Elige tu favorito y pídelo recién salido del horno.
          </p>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        {/* Sección de Destacados si existen */}
        {recetasDestacadas.length > 0 && categoriaSeleccionada === 'todos' && (
          <section className="mb-14">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-xl">⭐</span>
              <h3 className="text-xl font-bold text-amber-950 font-serif">
                Favoritos de la Casa
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recetasDestacadas.map((receta) => (
                <div
                  key={receta.id}
                  className="bg-white rounded-3xl p-5 border-2 border-amber-200/80 shadow-md shadow-amber-900/5 hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-amber-100 mb-4">
                      {receta.foto_url ? (
                        <img
                          src={receta.foto_url}
                          alt={receta.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-amber-700/60 bg-gradient-to-br from-amber-100 to-amber-200">
                          <Cake className="w-12 h-12 mb-1" />
                          <span className="text-xs font-semibold">Los Brownies de Josefina</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" /> Favorito
                      </span>
                      {(receta.stock_anaquel || 0) > 0 && (
                        <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {receta.stock_anaquel} listos para hoy
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 mb-1 font-serif group-hover:text-amber-800 transition-colors">
                      {receta.nombre}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Porción de {receta.porciones_base} {receta.porciones_base > 1 ? 'unidades' : 'unidad'} artesanal
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Precio</span>
                      <span className="text-xl font-extrabold text-amber-700">
                        {formatCOP(receta.precio_venta)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setRecetaParaPedir(receta);
                        setCantidad(1);
                      }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center space-x-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Pedir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtros de Categorías */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h3 className="text-2xl font-black text-amber-950 font-serif">
              Nuestro Menú Artesanal
            </h3>
            <p className="text-sm text-slate-500">
              Escoge lo que más se te antoje y programa tu entrega
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-amber-100/60 p-1.5 rounded-2xl border border-amber-200/60 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'brownies', label: 'Brownies' },
              { id: 'tortas', label: 'Tortas' },
              { id: 'postres', label: 'Postres' },
              { id: 'otros', label: 'Otros' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaSeleccionada(cat.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                  categoriaSeleccionada === cat.id
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-900/70 hover:text-amber-900 hover:bg-white/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catálogo en Grid */}
        {recetasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-amber-200">
            <Cake className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-slate-700 mb-1">
              Pronto tendremos delicias en esta sección
            </h4>
            <p className="text-sm text-slate-400">
              Josefina está perfeccionando nuevas recetas en el horno.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recetasFiltradas.map((receta) => (
              <div
                key={receta.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-amber-50 mb-4">
                    {receta.foto_url ? (
                      <img
                        src={receta.foto_url}
                        alt={receta.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-amber-600/50 bg-gradient-to-br from-amber-50 to-amber-100/60">
                        <Cake className="w-10 h-10 mb-1" />
                        <span className="text-xs font-medium">Receta Artesanal</span>
                      </div>
                    )}

                    {(receta.stock_anaquel || 0) > 0 ? (
                      <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5" />
                        {receta.stock_anaquel} disponibles ya
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow-sm flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-amber-300" />
                        Bajo encargo
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-1">
                    {receta.categoria || 'brownies'}
                  </span>
                  <h4 className="text-base font-bold text-slate-800 mb-1 font-serif group-hover:text-amber-800 transition-colors">
                    {receta.nombre}
                  </h4>
                  <p className="text-xs text-slate-400 mb-3">
                    {receta.porciones_base} {receta.porciones_base > 1 ? 'porciones' : 'porción'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Precio</span>
                    <span className="text-lg font-black text-amber-800">
                      {formatCOP(receta.precio_venta)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setRecetaParaPedir(receta);
                      setCantidad(1);
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center space-x-1"
                  >
                    <span>Encargar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer Artesanal */}
      <footer className="bg-amber-950 text-amber-200/80 py-10 mt-16 border-t border-amber-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="font-serif text-lg font-bold text-amber-100 mb-2">
            Los Brownies de Josefina
          </p>
          <p className="text-xs text-amber-300/70 max-w-md mx-auto mb-6">
            Elaboración artesanal bajo pedido. Garantizamos frescura inigualable y la máxima calidad en cada bocado.
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-amber-400/50">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 inline mx-0.5" />
            <span>para endulzar tus momentos especiales</span>
          </div>
        </div>
      </footer>

      {/* Modal de Pedido para el Cliente */}
      {recetaParaPedir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-100 my-8">
            <div className="flex items-start justify-between mb-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Encargo en línea
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-amber-950 font-serif mt-1">
                  {recetaParaPedir.nombre}
                </h3>
              </div>
              <button
                onClick={() => setRecetaParaPedir(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmarPedido} className="space-y-4">
              {/* Cantidad */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ¿Cuántas unidades deseas?
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center font-bold text-lg border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center"
                  >
                    +
                  </button>

                  {empaqueSugerido && (
                    <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl font-medium">
                      📦 Empaque: {empaqueSugerido.nombre_caja}
                    </span>
                  )}
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. María Gómez"
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 300 123 4567"
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fecha y Hora de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Entrega Deseada *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora Aproximada
                  </label>
                  <input
                    type="time"
                    value={horaEntrega}
                    onChange={(e) => setHoraEntrega(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notas especiales */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dedicatoria o Notas Especiales
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Tarjeta de cumpleaños para Juan, o instrucciones de entrega..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                />
              </div>

              {/* Resumen Total */}
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-800 font-semibold block">Total a pagar:</span>
                  <span className="text-2xl font-black text-amber-950">
                    {formatCOP(totalCalculado)}
                  </span>
                </div>
                <div className="text-right text-xs text-amber-700">
                  <span className="block font-medium">Pago contra entrega</span>
                  <span className="text-[11px] text-amber-600">o coordinar por WhatsApp</span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setRecetaParaPedir(null)}
                  className="flex-1 py-3 text-slate-500 hover:text-slate-700 font-bold text-sm rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-[2] py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {enviando ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Confirmar Encargo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Exitosa */}
      {pedidoExitoso && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ✓
            </div>
            <h3 className="text-2xl font-black text-slate-900 font-serif mb-2">
              ¡Pedido Recibido con Éxito!
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Muchas gracias, <span className="font-bold text-slate-800">{pedidoExitoso.cliente_nombre}</span>. Josefina ya tiene tu encargo agendado en el taller.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Fecha de entrega:</span>
                <span className="font-bold text-slate-800">{pedidoExitoso.fecha_entrega} {pedidoExitoso.hora_entrega}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cantidad:</span>
                <span className="font-bold text-slate-800">{pedidoExitoso.cantidad} unidades</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total:</span>
                <span className="font-black text-amber-700">{formatCOP(pedidoExitoso.precio_total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`https://wa.me/573000000000?text=${encodeURIComponent(
                  `Hola Josefina! Acabo de hacer el pedido de ${pedidoExitoso.cantidad} de ${
                    recetas.find((r) => r.id === pedidoExitoso.receta_id)?.nombre || 'Brownies'
                  } para el ${pedidoExitoso.fecha_entrega}. Mi nombre es ${pedidoExitoso.cliente_nombre}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirmar por WhatsApp</span>
              </a>

              <button
                onClick={() => setPedidoExitoso(null)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 text-xs font-semibold"
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
