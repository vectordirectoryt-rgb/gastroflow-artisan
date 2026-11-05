import React, { useState, useEffect } from 'react';
import { VistaNavegacion, Insumo, Receta, Pedido, Merma, AppConfig, EstadoPedido } from './core/types';
import { INITIAL_INSUMOS, INITIAL_RECETAS, INITIAL_CONFIG } from './core/data/seed';
import { safeLoad, safeSave } from './core/storage/localStorage';
import { Navbar } from './components/Navbar';
import { DashboardView } from './features/dashboard/DashboardView';
import { PedidosView } from './features/pedidos/PedidosView';
import { CocinaView } from './features/cocina/CocinaView';
import { BodegaView } from './features/bodega/BodegaView';
import { RecetarioView } from './features/recetario/RecetarioView';
import { HistorialView } from './features/historial/HistorialView';
import {
  ModalNuevoPedido,
  ModalEditarInsumo,
  ModalRegistroCompra,
  ModalRegistroMerma,
  ModalEditarReceta,
  ModalAjustes,
  ModalWhatsApp,
} from './features/modals/Modals';

export const App: React.FC = () => {
  // Estado Principal con Persistencia LocalStorage
  const [vista, setVista] = useState<VistaNavegacion>('dashboard');
  const [insumos, setInsumos] = useState<Insumo[]>(() => safeLoad('gf_insumos', INITIAL_INSUMOS));
  const [recetas, setRecetas] = useState<Receta[]>(() => safeLoad('gf_recetas', INITIAL_RECETAS));
  const [pedidos, setPedidos] = useState<Pedido[]>(() => safeLoad('gf_pedidos', []));
  const [mermas, setMermas] = useState<Merma[]>(() => safeLoad('gf_mermas', []));
  const [config, setConfig] = useState<AppConfig>(() => safeLoad('gf_config', INITIAL_CONFIG));

  // Estados de Modales
  const [modalNuevoPedido, setModalNuevoPedido] = useState(false);
  const [insumoParaEditar, setInsumoParaEditar] = useState<Insumo | null>(null);
  const [insumoParaCompra, setInsumoParaCompra] = useState<Insumo | null>(null);
  const [insumoParaMerma, setInsumoParaMerma] = useState<Insumo | null>(null);
  const [recetaParaEditar, setRecetaParaEditar] = useState<Receta | null>(null);
  const [modalAjustes, setModalAjustes] = useState(false);
  const [pedidoParaWhatsApp, setPedidoParaWhatsApp] = useState<Pedido | null>(null);

  // Sincronización continua con LocalStorage
  useEffect(() => {
    safeSave('gf_insumos', insumos);
  }, [insumos]);

  useEffect(() => {
    safeSave('gf_recetas', recetas);
  }, [recetas]);

  useEffect(() => {
    safeSave('gf_pedidos', pedidos);
  }, [pedidos]);

  useEffect(() => {
    safeSave('gf_mermas', mermas);
  }, [mermas]);

  useEffect(() => {
    safeSave('gf_config', config);
  }, [config]);

  // Manejadores de Negocio
  const handleGuardarNuevoPedido = (
    nuevo: Omit<Pedido, 'id' | 'created_at' | 'estado' | 'saldo_pendiente'>
  ) => {
    const pedidoCreado: Pedido = {
      ...nuevo,
      id: 'ped_' + Date.now(),
      created_at: new Date().toISOString(),
      estado: 'pendiente',
      saldo_pendiente: Math.max(0, nuevo.precio_total - nuevo.abono),
    };
    setPedidos([pedidoCreado, ...pedidos]);
  };

  const handleCambiarEstadoPedido = (id: string, nuevoEstado: EstadoPedido) => {
    setPedidos(
      pedidos.map((p) => {
        if (p.id === id) {
          return { ...p, estado: nuevoEstado };
        }
        return p;
      })
    );
  };

  const handleCobrarResto = (id: string) => {
    setPedidos(
      pedidos.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            abono: p.precio_total,
            saldo_pendiente: 0,
          };
        }
        return p;
      })
    );
  };

  const handleDescontarLoteCocina = (receta: Receta, escala: number) => {
    const insumosDescontados = new Map<string, number>();
    receta.ingredientes.forEach((ing) => {
      insumosDescontados.set(ing.insumo_id, ing.cantidad * escala);
    });

    setInsumos(
      insumos.map((i) => {
        const descuenta = insumosDescontados.get(i.id);
        if (descuenta !== undefined) {
          return {
            ...i,
            stock_actual: i.stock_actual - descuenta,
          };
        }
        return i;
      })
    );
  };

  const handleGuardarInsumo = (insumoActualizado: Insumo) => {
    if (insumos.some((i) => i.id === insumoActualizado.id)) {
      setInsumos(insumos.map((i) => (i.id === insumoActualizado.id ? insumoActualizado : i)));
    } else {
      setInsumos([...insumos, insumoActualizado]);
    }
  };

  const handleConfirmarCompra = (
    insumoId: string,
    cantidadComprada: number,
    nuevoCosto?: number
  ) => {
    setInsumos(
      insumos.map((i) => {
        if (i.id === insumoId) {
          const historial = i.historial_precios || [];
          if (nuevoCosto && nuevoCosto !== i.costo_empaque) {
            historial.push({ fecha: new Date().toISOString(), costo: nuevoCosto });
          }
          return {
            ...i,
            stock_actual: i.stock_actual + cantidadComprada,
            costo_empaque: nuevoCosto || i.costo_empaque,
            historial_precios: historial,
          };
        }
        return i;
      })
    );
  };

  const handleConfirmarMerma = (insumo: Insumo, cantidad: number, motivo: string) => {
    const costoUnitario = insumo.costo_empaque / insumo.gramos_por_empaque;
    const costoPerdido = cantidad * costoUnitario;

    // 1. Descontar del inventario
    setInsumos(
      insumos.map((i) =>
        i.id === insumo.id
          ? { ...i, stock_actual: Math.max(0, i.stock_actual - cantidad) }
          : i
      )
    );

    // 2. Registrar en la bitácora de mermas
    const nuevaMerma: Merma = {
      id: 'mer_' + Date.now(),
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      cantidad,
      unidad: insumo.unidad,
      costo_perdido: Math.round(costoPerdido),
      motivo,
      fecha: new Date().toISOString(),
    };
    setMermas([nuevaMerma, ...mermas]);
  };

  const handleGuardarReceta = (recetaActualizada: Receta) => {
    if (recetas.some((r) => r.id === recetaActualizada.id)) {
      setRecetas(recetas.map((r) => (r.id === recetaActualizada.id ? recetaActualizada : r)));
    } else {
      setRecetas([...recetas, recetaActualizada]);
    }
  };

  const handleLimpiarTodo = () => {
    localStorage.clear();
    setInsumos(INITIAL_INSUMOS);
    setRecetas(INITIAL_RECETAS);
    setPedidos([]);
    setMermas([]);
    setConfig(INITIAL_CONFIG);
  };

  const handleExportarJSON = () => {
    const backup = {
      fecha_exportacion: new Date().toISOString(),
      version: '6.1.0',
      insumos,
      recetas,
      pedidos,
      mermas,
      config,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GastroFlow_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        vistaActual={vista}
        onCambiarVista={setVista}
        insumos={insumos}
        pedidos={pedidos}
        onLimpiarDatos={handleLimpiarTodo}
        onExportarJSON={handleExportarJSON}
        onAbrirAjustes={() => setModalAjustes(true)}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {vista === 'dashboard' && (
          <DashboardView
            insumos={insumos}
            recetas={recetas}
            pedidos={pedidos}
            mermas={mermas}
            tarifaKwh={config.tarifaKwh}
            onIrAPedidos={() => setVista('pedidos')}
            onIrACocina={() => setVista('cocina')}
          />
        )}

        {vista === 'pedidos' && (
          <PedidosView
            pedidos={pedidos}
            recetas={recetas}
            onNuevoPedido={() => setModalNuevoPedido(true)}
            onCambiarEstado={handleCambiarEstadoPedido}
            onCobrarResto={handleCobrarResto}
            onAbrirWhatsApp={(p) => setPedidoParaWhatsApp(p)}
          />
        )}

        {vista === 'cocina' && (
          <CocinaView
            recetas={recetas}
            insumos={insumos}
            onDescontarLote={handleDescontarLoteCocina}
          />
        )}

        {vista === 'bodega' && (
          <BodegaView
            insumos={insumos}
            onNuevoInsumo={() =>
              setInsumoParaEditar({
                id: 'ins_' + Date.now(),
                nombre: '',
                tipo: 'materia_prima',
                unidad: 'g',
                stock_actual: 1000,
                stock_min: 500,
                costo_empaque: 10000,
                gramos_por_empaque: 1000,
              })
            }
            onEditarInsumo={(ins) => setInsumoParaEditar(ins)}
            onRegistrarCompra={(ins) => setInsumoParaCompra(ins)}
            onRegistrarMerma={(ins) => setInsumoParaMerma(ins)}
          />
        )}

        {vista === 'recetario' && (
          <RecetarioView
            recetas={recetas}
            insumos={insumos}
            tarifaKwh={config.tarifaKwh}
            onNuevaReceta={() =>
              setRecetaParaEditar({
                id: 'rec_' + Date.now(),
                nombre: '',
                porciones_base: 1,
                precio_venta: 50000,
                tiempo_minutos: 60,
                cif_porcentaje: 8,
                ingredientes: insumos.slice(0, 3).map((i) => ({ insumo_id: i.id, cantidad: 100 })),
                equipos: [{ nombre: 'Horno Eléctrico', potencia_watts: 2000, minutos_uso: 40 }],
              })
            }
            onEditarReceta={(rec) => setRecetaParaEditar(rec)}
          />
        )}

        {vista === 'historial' && (
          <HistorialView mermas={mermas} pedidos={pedidos} insumos={insumos} />
        )}
      </main>

      {/* Modales Globales */}
      <ModalNuevoPedido
        isOpen={modalNuevoPedido}
        onClose={() => setModalNuevoPedido(false)}
        recetas={recetas}
        onGuardar={handleGuardarNuevoPedido}
      />

      <ModalEditarInsumo
        isOpen={!!insumoParaEditar}
        onClose={() => setInsumoParaEditar(null)}
        insumo={insumoParaEditar}
        onGuardar={handleGuardarInsumo}
      />

      <ModalRegistroCompra
        isOpen={!!insumoParaCompra}
        onClose={() => setInsumoParaCompra(null)}
        insumo={insumoParaCompra}
        onConfirmar={handleConfirmarCompra}
      />

      <ModalRegistroMerma
        isOpen={!!insumoParaMerma}
        onClose={() => setInsumoParaMerma(null)}
        insumo={insumoParaMerma}
        onConfirmar={handleConfirmarMerma}
      />

      <ModalEditarReceta
        isOpen={!!recetaParaEditar}
        onClose={() => setRecetaParaEditar(null)}
        receta={recetaParaEditar}
        insumos={insumos}
        onGuardar={handleGuardarReceta}
      />

      <ModalAjustes
        isOpen={modalAjustes}
        onClose={() => setModalAjustes(false)}
        config={config}
        onGuardar={setConfig}
      />

      <ModalWhatsApp
        isOpen={!!pedidoParaWhatsApp}
        onClose={() => setPedidoParaWhatsApp(null)}
        pedido={pedidoParaWhatsApp}
        recetaNombre={
          recetas.find((r) => r.id === pedidoParaWhatsApp?.receta_id)?.nombre
        }
      />
    </div>
  );
};
export default App;
