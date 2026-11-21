import React, { useState, useEffect, useCallback } from 'react';
import {
  VistaNavegacion,
  ModoApp,
  Insumo,
  Receta,
  Pedido,
  Merma,
  GastoFijo,
  AppConfig,
  EstadoPedido,
} from './core/types';
import { INITIAL_INSUMOS, INITIAL_RECETAS, INITIAL_CONFIG, INITIAL_PEDIDOS } from './core/data/seed';
import { safeLoad, safeSave } from './core/storage/localStorage';
import {
  getInsumosDB,
  upsertInsumoDB,
  getRecetasDB,
  upsertRecetaDB,
  getPedidosDB,
  createPedidoDB,
  updatePedidoEstadoDB,
  updatePedidoCobroDB,
  getMermasDB,
  createMermaDB,
  getGastosFijosDB,
  getConfigDB,
  saveConfigDB,
  subscribeToTableRealtime,
} from './services/supabaseService';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { ClienteView } from './features/cliente/ClienteView';
import { TiendaView } from './features/tienda/TiendaView';
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
  // Modo de visualización: 'cliente' (público) o 'admin' (dueña)
  const [modoApp, setModoApp] = useState<ModoApp>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modo') === 'admin' || params.get('admin') === 'true') {
        return 'admin';
      }
    }
    return localStorage.getItem('gf_admin_session') === 'true' ? 'admin' : 'cliente';
  });

  const [modalLoginOpen, setModalLoginOpen] = useState(false);

  // Navegación dentro del panel admin
  const [vista, setVista] = useState<VistaNavegacion>('dashboard');

  // Estado Principal
  const [insumos, setInsumos] = useState<Insumo[]>(() => safeLoad('gf_insumos', INITIAL_INSUMOS));
  const [recetas, setRecetas] = useState<Receta[]>(() => safeLoad('gf_recetas', INITIAL_RECETAS));
  const [pedidos, setPedidos] = useState<Pedido[]>(() => safeLoad('gf_pedidos', INITIAL_PEDIDOS));
  const [mermas, setMermas] = useState<Merma[]>(() => safeLoad('gf_mermas', []));
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>(() => safeLoad('gf_gastos_fijos', []));
  const [config, setConfig] = useState<AppConfig>(() => safeLoad('gf_config', INITIAL_CONFIG));

  // Estados de Modales
  const [modalNuevoPedido, setModalNuevoPedido] = useState(false);
  const [insumoParaEditar, setInsumoParaEditar] = useState<Insumo | null>(null);
  const [insumoParaCompra, setInsumoParaCompra] = useState<Insumo | null>(null);
  const [insumoParaMerma, setInsumoParaMerma] = useState<Insumo | null>(null);
  const [recetaParaEditar, setRecetaParaEditar] = useState<Receta | null>(null);
  const [modalAjustes, setModalAjustes] = useState(false);
  const [pedidoParaWhatsApp, setPedidoParaWhatsApp] = useState<Pedido | null>(null);

  // ============================================================
  // CARGA INICIAL Y SINCRONIZACIÓN DESDE SUPABASE CLOUD
  // ============================================================
  const cargarDatosNube = useCallback(async () => {
    try {
      const [insumosCloud, recetasCloud, pedidosCloud, mermasCloud, gastosCloud, configCloud] =
        await Promise.all([
          getInsumosDB(),
          getRecetasDB(),
          getPedidosDB(),
          getMermasDB(),
          getGastosFijosDB(),
          getConfigDB(),
        ]);

      if (insumosCloud.length > 0) setInsumos(insumosCloud);
      if (recetasCloud.length > 0) setRecetas(recetasCloud);
      if (pedidosCloud.length > 0) {
        setPedidos((prev) => {
          const localOnly = prev.filter((p) => p.id.startsWith('ped_') || p.id === 'temp');
          const cloudIds = new Set(pedidosCloud.map((p) => p.id));
          return [...pedidosCloud, ...localOnly.filter((p) => !cloudIds.has(p.id))];
        });
      }
      if (mermasCloud.length > 0) setMermas(mermasCloud);
      if (gastosCloud.length > 0) setGastosFijos(gastosCloud);
      if (configCloud) setConfig(configCloud);
    } catch (e) {
      console.warn('Operando con caché local:', e);
    }
  }, []);

  useEffect(() => {
    cargarDatosNube();
  }, [cargarDatosNube]);

  // Suscripción Realtime a cambios en Supabase (todos los celulares se actualizan solos)
  useEffect(() => {
    const unsubPedidos = subscribeToTableRealtime('pedidos', () => {
      getPedidosDB().then((p) => {
        if (p.length > 0) setPedidos(p);
      });
    });

    const unsubRecetas = subscribeToTableRealtime('recetas', () => {
      getRecetasDB().then((r) => {
        if (r.length > 0) setRecetas(r);
      });
    });

    const unsubInsumos = subscribeToTableRealtime('insumos', () => {
      getInsumosDB().then((i) => {
        if (i.length > 0) setInsumos(i);
      });
    });

    return () => {
      unsubPedidos();
      unsubRecetas();
      unsubInsumos();
    };
  }, []);

  // Respaldo continuo en LocalStorage (Offline Resilience)
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
    safeSave('gf_gastos_fijos', gastosFijos);
  }, [gastosFijos]);
  useEffect(() => {
    safeSave('gf_config', config);
  }, [config]);

  // ============================================================
  // MANEJADORES DE NEGOCIO
  // ============================================================
  const handleLoginExitoso = () => {
    localStorage.setItem('gf_admin_session', 'true');
    setModoApp('admin');
    setModalLoginOpen(false);
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('gf_admin_session');
    setModoApp('cliente');
  };

  const handleCrearPedidoCliente = async (
    nuevo: Omit<Pedido, 'id' | 'created_at'>
  ): Promise<boolean> => {
    try {
      const pedidoCreado = await createPedidoDB(nuevo);
      if (pedidoCreado) {
        setPedidos((prev) => [pedidoCreado, ...prev]);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleGuardarNuevoPedidoAdmin = async (
    nuevo: Omit<Pedido, 'id' | 'created_at' | 'estado' | 'saldo_pendiente'>
  ) => {
    const pedidoAInsertar: Omit<Pedido, 'id' | 'created_at'> = {
      ...nuevo,
      estado: 'pendiente',
      origen: 'admin',
      saldo_pendiente: Math.max(0, nuevo.precio_total - nuevo.abono),
    };

    const creado = await createPedidoDB(pedidoAInsertar);
    if (creado) {
      setPedidos((prev) => [creado, ...prev]);
    } else {
      const fallback: Pedido = {
        ...pedidoAInsertar,
        id: 'ped_' + Date.now(),
        created_at: new Date().toISOString(),
      };
      setPedidos((prev) => [fallback, ...prev]);
    }
  };

  const handleCambiarEstadoPedido = async (id: string, nuevoEstado: EstadoPedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );
    await updatePedidoEstadoDB(id, nuevoEstado);
  };

  const handleActualizarPedido = async (pedidoActualizado: Pedido) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === pedidoActualizado.id ? pedidoActualizado : p))
    );
    await updatePedidoEstadoDB(pedidoActualizado.id, pedidoActualizado.estado);
    if (pedidoActualizado.abono !== undefined) {
      await updatePedidoCobroDB(
        pedidoActualizado.id,
        pedidoActualizado.abono,
        pedidoActualizado.saldo_pendiente || 0
      );
    }
  };

  const handleCobrarResto = async (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, abono: p.precio_total, saldo_pendiente: 0 } : p
      )
    );
    await updatePedidoCobroDB(id, pedido.precio_total, 0);
  };

  const handleDescontarLoteCocina = async (receta: Receta, escala: number) => {
    const insumosDescontados = new Map<string, number>();
    receta.ingredientes.forEach((ing) => {
      insumosDescontados.set(ing.insumo_id, ing.cantidad * escala);
    });

    const nuevosInsumos = insumos.map((i) => {
      const descuenta = insumosDescontados.get(i.id);
      if (descuenta !== undefined) {
        const actualizado = { ...i, stock_actual: i.stock_actual - descuenta };
        upsertInsumoDB(actualizado);
        return actualizado;
      }
      return i;
    });
    setInsumos(nuevosInsumos);

    // Sumar porciones al stock de anaquel de venta inmediata
    const nuevasPorciones = (receta.stock_anaquel || 0) + escala * receta.porciones_base;
    const recetaActualizada = { ...receta, stock_anaquel: nuevasPorciones };
    await handleGuardarReceta(recetaActualizada);
  };

  const handleGuardarInsumo = async (insumoActualizado: Insumo) => {
    if (insumos.some((i) => i.id === insumoActualizado.id)) {
      setInsumos(insumos.map((i) => (i.id === insumoActualizado.id ? insumoActualizado : i)));
    } else {
      setInsumos([...insumos, insumoActualizado]);
    }
    await upsertInsumoDB(insumoActualizado);
  };

  const handleGuardarReceta = async (recetaActualizada: Receta) => {
    if (recetas.some((r) => r.id === recetaActualizada.id)) {
      setRecetas(recetas.map((r) => (r.id === recetaActualizada.id ? recetaActualizada : r)));
    } else {
      setRecetas([...recetas, recetaActualizada]);
    }
    await upsertRecetaDB(recetaActualizada);
  };

  const handleConfirmarCompra = async (
    insumoId: string,
    cantidadComprada: number,
    nuevoCosto?: number
  ) => {
    const insumoTarget = insumos.find((i) => i.id === insumoId);
    if (!insumoTarget) return;

    const historial = insumoTarget.historial_precios || [];
    if (nuevoCosto && nuevoCosto !== insumoTarget.costo_empaque) {
      historial.push({ fecha: new Date().toISOString(), costo: nuevoCosto });
    }

    const insumoActualizado: Insumo = {
      ...insumoTarget,
      stock_actual: insumoTarget.stock_actual + cantidadComprada,
      costo_empaque: nuevoCosto || insumoTarget.costo_empaque,
      historial_precios: historial,
    };

    setInsumos(insumos.map((i) => (i.id === insumoId ? insumoActualizado : i)));
    await upsertInsumoDB(insumoActualizado);
  };

  const handleConfirmarMerma = async (
    insumoId: string,
    cantidad: number,
    motivo: string
  ) => {
    const insumo = insumos.find((i) => i.id === insumoId);
    if (!insumo) return;

    const costoGramo =
      insumo.gramos_por_empaque > 0 ? insumo.costo_empaque / insumo.gramos_por_empaque : 0;
    const costoPerdido = Math.round(costoGramo * cantidad);

    const nuevaMerma: Omit<Merma, 'id'> = {
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      cantidad,
      unidad: insumo.unidad,
      costo_perdido: costoPerdido,
      motivo,
      fecha: new Date().toISOString().split('T')[0],
    };

    await createMermaDB(nuevaMerma);
    setMermas([
      { ...nuevaMerma, id: 'merm_' + Date.now() },
      ...mermas,
    ]);

    // Descontar del stock de bodega
    const insumoActualizado = {
      ...insumo,
      stock_actual: Math.max(0, insumo.stock_actual - cantidad),
    };
    setInsumos(insumos.map((i) => (i.id === insumo.id ? insumoActualizado : i)));
    await upsertInsumoDB(insumoActualizado);
  };

  const handleLimpiarTodo = () => {
    window.localStorage.clear();
    setInsumos(INITIAL_INSUMOS);
    setRecetas(INITIAL_RECETAS);
    setPedidos([]);
    setMermas([]);
    setGastosFijos([]);
    setConfig(INITIAL_CONFIG);
  };

  const handleExportarJSON = () => {
    const backup = { insumos, recetas, pedidos, mermas, gastosFijos, config };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GastroFlow_Backup_Josefina_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // RENDERIZADO: MODO CLIENTE vs MODO ADMIN
  // ============================================================
  if (modoApp === 'cliente') {
    return (
      <>
        <ClienteView
          recetas={recetas}
          onCrearPedidoCliente={handleCrearPedidoCliente}
          onAbrirLoginAdmin={() => setModalLoginOpen(true)}
        />

        <LoginModal
          isOpen={modalLoginOpen}
          onClose={() => setModalLoginOpen(false)}
          onLoginExitoso={handleLoginExitoso}
        />
      </>
    );
  }

  // MODO ADMIN (Dueña)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        vistaActual={vista}
        onCambiarVista={setVista}
        insumos={insumos}
        pedidos={pedidos}
        onLimpiarDatos={handleLimpiarTodo}
        onExportarJSON={handleExportarJSON}
        onAbrirAjustes={() => setModalAjustes(true)}
        onVerComoCliente={() => setModoApp('cliente')}
        onCerrarSesionAdmin={handleCerrarSesion}
      />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {vista === 'dashboard' && (
          <DashboardView
            insumos={insumos}
            recetas={recetas}
            pedidos={pedidos}
            mermas={mermas}
            gastosFijos={gastosFijos}
            tarifaKwh={config.tarifaKwh}
            onIrAPedidos={() => setVista('pedidos')}
            onIrACocina={() => setVista('cocina')}
            onIrATienda={() => setVista('tienda')}
            onNuevoPedido={() => setModalNuevoPedido(true)}
            onActualizarPedido={handleActualizarPedido}
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
            pedidos={pedidos}
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
                categoria: 'brownies',
                porciones_base: 16,
                precio_venta: 7000,
                tiempo_minutos: 45,
                cif_porcentaje: 8,
                stock_anaquel: 0,
                visible_en_tienda: true,
                destacado: false,
                ingredientes: insumos.slice(0, 3).map((i) => ({ insumo_id: i.id, cantidad: 100 })),
                equipos: [{ nombre: 'Horno Eléctrico', potencia_watts: 2000, minutos_uso: 30 }],
              })
            }
            onEditarReceta={(rec) => setRecetaParaEditar(rec)}
          />
        )}

        {vista === 'historial' && (
          <HistorialView mermas={mermas} pedidos={pedidos} insumos={insumos} />
        )}

        {vista === 'tienda' && (
          <TiendaView
            recetas={recetas}
            onActualizarReceta={handleGuardarReceta}
            onVerComoCliente={() => setModoApp('cliente')}
          />
        )}
      </main>

      {/* Modales Globales */}
      <ModalNuevoPedido
        isOpen={modalNuevoPedido}
        onClose={() => setModalNuevoPedido(false)}
        recetas={recetas}
        onGuardar={handleGuardarNuevoPedidoAdmin}
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
        onConfirmar={(insumo, cant, mot) => handleConfirmarMerma(insumo.id, cant, mot)}
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
        onGuardar={async (nuevaConfig) => {
          setConfig(nuevaConfig);
          await saveConfigDB(nuevaConfig);
        }}
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
