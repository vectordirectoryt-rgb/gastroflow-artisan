import React, { useState } from 'react';
import { Insumo, Receta, Pedido, AppConfig, UnidadInsumo, TipoInsumo } from '../../core/types';
import { formatCOP } from '../../core/utils/formatters';
import { X, MessageSquare, Plus, Trash2 } from 'lucide-react';

/* --- MODAL NUEVO PEDIDO --- */
interface ModalNuevoPedidoProps {
  isOpen: boolean;
  onClose: () => void;
  recetas: Receta[];
  onGuardar: (pedido: Omit<Pedido, 'id' | 'created_at' | 'estado' | 'saldo_pendiente'>) => void;
}

export const ModalNuevoPedido: React.FC<ModalNuevoPedidoProps> = ({
  isOpen,
  onClose,
  recetas,
  onGuardar,
}) => {
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [recetaId, setRecetaId] = useState(recetas[0]?.id || '');
  const [cantidad, setCantidad] = useState(1);
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('14:00');
  const [notas, setNotas] = useState('');

  const recetaSeleccionada = recetas.find((r) => r.id === recetaId);
  const precioUnitario = recetaSeleccionada?.precio_venta || 0;
  const precioTotal = precioUnitario * cantidad;
  const [abono, setAbono] = useState<number>(Math.round(precioTotal * 0.5));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNombre.trim() || !recetaId) return;

    onGuardar({
      cliente_nombre: clienteNombre.trim(),
      cliente_telefono: clienteTelefono.trim(),
      receta_id: recetaId,
      cantidad,
      fecha_entrega: fechaEntrega || new Date().toISOString().split('T')[0],
      hora_entrega: horaEntrega,
      notas: notas.trim(),
      precio_total: precioTotal,
      abono: Number(abono) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tomar Nuevo Encargo / Pedido</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre del Cliente *</label>
              <input
                type="text"
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="ej: María Gómez"
                data-testid="input-pedido-cliente"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp / Teléfono</label>
              <input
                type="text"
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                placeholder="ej: 3101234567"
                data-testid="input-pedido-telefono"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Producto Encargado *</label>
              <select
                value={recetaId}
                onChange={(e) => {
                  setRecetaId(e.target.value);
                  const r = recetas.find((rec) => rec.id === e.target.value);
                  const nuevoTotal = (r?.precio_venta || 0) * cantidad;
                  setAbono(Math.round(nuevoTotal * 0.5));
                }}
                data-testid="select-pedido-receta"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              >
                {recetas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre} ({formatCOP(r.precio_venta)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cantidad *</label>
              <input
                type="number"
                min={1}
                value={cantidad}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value) || 1);
                  setCantidad(val);
                  setAbono(Math.round(precioUnitario * val * 0.5));
                }}
                data-testid="input-pedido-cantidad"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Entrega *</label>
              <input
                type="date"
                required
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                data-testid="input-pedido-fecha"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Estimada</label>
              <input
                type="time"
                value={horaEntrega}
                onChange={(e) => setHoraEntrega(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detalles de Personalización / Notas</label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="ej: Mensaje en chocolate 'Feliz Cumple', sin nueces..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Resumen Financiero del Pedido */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-amber-900">Total a Cobrar:</span>
              <span className="font-black text-amber-950 text-sm">{formatCOP(precioTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-amber-900">Anticipo / Abono Recibido (50% sugerido):</span>
              <input
                type="number"
                value={abono}
                onChange={(e) => setAbono(Number(e.target.value) || 0)}
                data-testid="input-pedido-abono"
                className="w-32 p-1.5 bg-white border border-amber-300 rounded-lg text-right font-bold text-emerald-700"
              />
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-amber-200 text-slate-600">
              <span>Saldo por cobrar al entregar:</span>
              <span className="font-bold text-rose-600">{formatCOP(precioTotal - abono)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-guardar-pedido"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition"
            >
              Guardar Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- MODAL EDITAR INSUMO --- */
interface ModalEditarInsumoProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
  onGuardar: (insumo: Insumo) => void;
}

export const ModalEditarInsumo: React.FC<ModalEditarInsumoProps> = ({
  isOpen,
  onClose,
  insumo,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState(insumo?.nombre || '');
  const [tipo, setTipo] = useState<TipoInsumo>(insumo?.tipo || 'materia_prima');
  const [unidad, setUnidad] = useState<UnidadInsumo>(insumo?.unidad || 'g');
  const [stockActual, setStockActual] = useState(insumo?.stock_actual || 0);
  const [stockMin, setStockMin] = useState(insumo?.stock_min || 0);
  const [costoEmpaque, setCostoEmpaque] = useState(insumo?.costo_empaque || 0);
  const [gramosEmpaque, setGramosEmpaque] = useState(insumo?.gramos_por_empaque || 1000);

  React.useEffect(() => {
    if (insumo) {
      setNombre(insumo.nombre);
      setTipo(insumo.tipo || 'materia_prima');
      setUnidad(insumo.unidad);
      setStockActual(insumo.stock_actual);
      setStockMin(insumo.stock_min);
      setCostoEmpaque(insumo.costo_empaque);
      setGramosEmpaque(insumo.gramos_por_empaque);
    }
  }, [insumo]);

  if (!isOpen || !insumo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({
      ...insumo,
      nombre: nombre.trim(),
      tipo,
      unidad,
      stock_actual: Number(stockActual) || 0,
      stock_min: Number(stockMin) || 0,
      costo_empaque: Number(costoEmpaque) || 0,
      gramos_por_empaque: Math.max(1, Number(gramosEmpaque) || 1),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {insumo.id.startsWith('new_') ? 'Nuevo Insumo' : 'Editar Insumo'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo / Empaque</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Harina de almendras"
              data-testid="input-insumo-nombre"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoInsumo)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="materia_prima">Materia Prima</option>
                <option value="empaque">Empaque / Presentación</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Unidad de Medida</label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value as UnidadInsumo)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="g">Gramos (g)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="l">Litros (l)</option>
                <option value="und">Unidades (und)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Actual</label>
              <input
                type="number"
                value={stockActual}
                onChange={(e) => setStockActual(Number(e.target.value) || 0)}
                data-testid="input-insumo-stock"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                value={stockMin}
                onChange={(e) => setStockMin(Number(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Costo Empaque (COP)</label>
              <input
                type="number"
                value={costoEmpaque}
                onChange={(e) => setCostoEmpaque(Number(e.target.value) || 0)}
                data-testid="input-insumo-costo"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cantidad por Empaque</label>
              <input
                type="number"
                min={1}
                value={gramosEmpaque}
                onChange={(e) => setGramosEmpaque(Number(e.target.value) || 1)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-guardar-insumo"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition"
            >
              Guardar Insumo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- MODAL REGISTRO COMPRA --- */
interface ModalRegistroCompraProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
  onConfirmar: (insumoId: string, cantidadComprada: number, nuevoCosto?: number) => void;
}

export const ModalRegistroCompra: React.FC<ModalRegistroCompraProps> = ({
  isOpen,
  onClose,
  insumo,
  onConfirmar,
}) => {
  const [paquetes, setPaquetes] = useState(1);
  const [nuevoCosto, setNuevoCosto] = useState<number>(insumo?.costo_empaque || 0);

  React.useEffect(() => {
    if (insumo) setNuevoCosto(insumo.costo_empaque);
  }, [insumo]);

  if (!isOpen || !insumo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cantidadUnidades = paquetes * insumo.gramos_por_empaque;
    onConfirmar(insumo.id, cantidadUnidades, nuevoCosto !== insumo.costo_empaque ? nuevoCosto : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-1">+ Entrada por Compra</h3>
        <p className="text-xs text-slate-500 mb-4">{insumo.nombre}</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">¿Cuántos empaques compraste?</label>
            <input
              type="number"
              min={1}
              value={paquetes}
              onChange={(e) => setPaquetes(Math.max(1, Number(e.target.value) || 1))}
              data-testid="input-compra-paquetes"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Sumará: <strong>{paquetes * insumo.gramos_por_empaque} {insumo.unidad}</strong> a bodega.
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Costo por empaque pagado (COP):</label>
            <input
              type="number"
              value={nuevoCosto}
              onChange={(e) => setNuevoCosto(Number(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-confirmar-compra"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
            >
              Confirmar Entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- MODAL REGISTRO MERMA --- */
interface ModalRegistroMermaProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: Insumo | null;
  onConfirmar: (insumo: Insumo, cantidad: number, motivo: string) => void;
}

export const ModalRegistroMerma: React.FC<ModalRegistroMermaProps> = ({
  isOpen,
  onClose,
  insumo,
  onConfirmar,
}) => {
  const [cantidad, setCantidad] = useState(100);
  const [motivo, setMotivo] = useState('quemado / vencido');

  if (!isOpen || !insumo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmar(insumo, Number(cantidad) || 0, motivo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <h3 className="text-base font-bold text-rose-600 mb-1">- Registrar Merma / Desperdicio</h3>
        <p className="text-xs text-slate-500 mb-4">{insumo.nombre}</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Cantidad perdida ({insumo.unidad}):</label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value) || 0)}
              data-testid="input-merma-cantidad"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Motivo o Causa:</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              <option value="quemado">Quemado / Sobrehorneo</option>
              <option value="vencido">Vencido / Dañado</option>
              <option value="caida">Caída / Accidente en mesa</option>
              <option value="prueba">Muestra / Prueba técnica</option>
              <option value="otro">Otro motivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-confirmar-merma"
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
            >
              Registrar Pérdida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- MODAL EDITAR RECETA --- */
interface ModalEditarRecetaProps {
  isOpen: boolean;
  onClose: () => void;
  receta: Receta | null;
  insumos: Insumo[];
  onGuardar: (receta: Receta) => void;
}

export const ModalEditarReceta: React.FC<ModalEditarRecetaProps> = ({
  isOpen,
  onClose,
  receta,
  insumos,
  onGuardar,
}) => {
  const [nombre, setNombre] = useState(receta?.nombre || '');
  const [porcionesBase, setPorcionesBase] = useState(receta?.porciones_base || 1);
  const [precioVenta, setPrecioVenta] = useState(receta?.precio_venta || 0);
  const [tiempoMinutos, setTiempoMinutos] = useState(receta?.tiempo_minutos || 60);
  const [cifPorcentaje, setCifPorcentaje] = useState(receta?.cif_porcentaje || 8);
  const [ingredientes, setIngredientes] = useState(receta?.ingredientes || []);

  React.useEffect(() => {
    if (receta) {
      setNombre(receta.nombre);
      setPorcionesBase(receta.porciones_base);
      setPrecioVenta(receta.precio_venta);
      setTiempoMinutos(receta.tiempo_minutos);
      setCifPorcentaje(receta.cif_porcentaje);
      setIngredientes(receta.ingredientes);
    }
  }, [receta]);

  if (!isOpen || !receta) return null;

  const handleAddIngrediente = () => {
    if (insumos.length > 0) {
      setIngredientes([...ingredientes, { insumo_id: insumos[0].id, cantidad: 100 }]);
    }
  };

  const handleRemoveIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGuardar({
      ...receta,
      nombre: nombre.trim(),
      porciones_base: Number(porcionesBase) || 1,
      precio_venta: Number(precioVenta) || 0,
      tiempo_minutos: Number(tiempoMinutos) || 0,
      cif_porcentaje: Number(cifPorcentaje) || 0,
      ingredientes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {receta.id.startsWith('new_') ? 'Nueva Receta' : 'Editar Receta'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre de la Receta / Preparación</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Torta Selva Negra"
              data-testid="input-receta-nombre"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Porciones</label>
              <input
                type="number"
                min={1}
                value={porcionesBase}
                onChange={(e) => setPorcionesBase(Number(e.target.value) || 1)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Venta</label>
              <input
                type="number"
                value={precioVenta}
                onChange={(e) => setPrecioVenta(Number(e.target.value) || 0)}
                data-testid="input-receta-precio"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tiempo (min)</label>
              <input
                type="number"
                value={tiempoMinutos}
                onChange={(e) => setTiempoMinutos(Number(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">CIF (%)</label>
              <input
                type="number"
                value={cifPorcentaje}
                onChange={(e) => setCifPorcentaje(Number(e.target.value) || 0)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              />
            </div>
          </div>

          {/* Ingredientes */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800">Ingredientes y Empaques</span>
              <button
                type="button"
                onClick={handleAddIngrediente}
                className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Ingrediente
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto p-1">
              {ingredientes.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={ing.insumo_id}
                    onChange={(e) => {
                      const updated = [...ingredientes];
                      updated[idx].insumo_id = e.target.value;
                      setIngredientes(updated);
                    }}
                    className="flex-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidad})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={ing.cantidad}
                    onChange={(e) => {
                      const updated = [...ingredientes];
                      updated[idx].cantidad = Number(e.target.value) || 0;
                      setIngredientes(updated);
                    }}
                    className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right font-bold text-xs"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveIngrediente(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="btn-guardar-receta"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md"
            >
              Guardar Receta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* --- MODAL AJUSTES --- */
interface ModalAjustesProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onGuardar: (config: AppConfig) => void;
}

export const ModalAjustes: React.FC<ModalAjustesProps> = ({
  isOpen,
  onClose,
  config,
  onGuardar,
}) => {
  const [tarifaKwh, setTarifaKwh] = useState(config.tarifaKwh);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-3">⚙️ Configuración del Taller</h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tarifa Electricidad por kWh (COP):</label>
            <input
              type="number"
              value={tarifaKwh}
              onChange={(e) => setTarifaKwh(Number(e.target.value) || 0)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Utilizado para costear minutos de horno eléctrico y batidoras industriales.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onGuardar({ ...config, tarifaKwh });
                onClose();
              }}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- MODAL WHATSAPP --- */
interface ModalWhatsAppProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido | null;
  recetaNombre?: string;
}

export const ModalWhatsApp: React.FC<ModalWhatsAppProps> = ({
  isOpen,
  onClose,
  pedido,
  recetaNombre,
}) => {
  if (!isOpen || !pedido) return null;

  const mensaje = `¡Hola ${pedido.cliente_nombre}! Te escribo de GastroFlow Artisan. 
Te recordamos que tu encargo de ${pedido.cantidad}x ${recetaNombre || 'producto'} está programado para entrega el ${pedido.fecha_entrega} a las ${pedido.hora_entrega || '12:00'}.
Saldo pendiente: ${formatCOP(pedido.saldo_pendiente)}. ¡Nos vemos pronto!`;

  const urlWhatsapp = `https://wa.me/${(pedido.cliente_telefono || '').replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-600" /> Mensaje para Cliente
        </h3>

        <textarea
          readOnly
          rows={5}
          value={mensaje}
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
          >
            Cerrar
          </button>
          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" /> Abrir WhatsApp Web
          </a>
        </div>
      </div>
    </div>
  );
};
