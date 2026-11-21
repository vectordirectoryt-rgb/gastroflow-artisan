import React, { useState } from 'react';
import { VistaNavegacion, Insumo, Pedido } from '../core/types';
import { formatCOP } from '../core/utils/formatters';

interface NavbarProps {
  vistaActual: VistaNavegacion;
  onCambiarVista: (vista: VistaNavegacion) => void;
  insumos: Insumo[];
  pedidos: Pedido[];
  onLimpiarDatos: () => void;
  onExportarJSON: () => void;
  onAbrirAjustes: () => void;
  onVerComoCliente: () => void;
  onCerrarSesionAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  onCambiarVista,
  insumos,
  pedidos,
  onExportarJSON,
  onAbrirAjustes,
  onVerComoCliente,
  onCerrarSesionAdmin,
}) => {
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarMenuDatos, setMostrarMenuDatos] = useState(false);

  // Análisis de alertas y faltantes
  const hoyStr = new Date().toISOString().split('T')[0];
  
  // Insumos críticos (stock <= mínimo)
  const alertasStockMinimo = insumos.filter(i => i.stock_actual <= i.stock_min);
  const entregasHoy = pedidos.filter(p => p.fecha_entrega === hoyStr && p.estado !== 'entregado');
  const totalAlertas = alertasStockMinimo.length + entregasHoy.length;

  const tabs: { id: VistaNavegacion; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pedidos', label: 'Libreta de Encargos', icon: '📋' },
    { id: 'cocina', label: 'Preparación y Cocina', icon: '👨‍🍳' },
    { id: 'bodega', label: 'Bodega de Insumos', icon: '📦' },
    { id: 'recetario', label: 'Recetario y Costeo', icon: '📖' },
    { id: 'historial', label: 'Auditoría e Historial', icon: '📑' },
    { id: 'tienda', label: 'Mi Tienda', icon: '🌐' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO GASTROFLOW ARTISAN */}
          <div
            onClick={() => onCambiarVista('dashboard')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#ECEBCF] p-1 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden border border-[#DDDABA]">
              <img
                src="/logo-brownies-josefina-clean.png"
                alt="Los Brownies de Josefina"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="font-extrabold text-xl tracking-tight text-white leading-none flex items-center gap-1.5 whitespace-nowrap">
                <span>GastroFlow</span>
                <span className="text-[#ECEBCF] font-serif italic font-normal text-lg">Artisan</span>
              </h1>
              <span className="text-[11px] font-medium text-[#B6BD90] tracking-wide uppercase mt-0.5 whitespace-nowrap">
                Los Brownies de Josefina
              </span>
            </div>
          </div>

          {/* MENÚ DE NAVEGACIÓN DESKTOP */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Tabs Principales">
            {tabs.map((tab) => {
              const active = vistaActual === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onCambiarVista(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    active
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ACCIONES DERECHA: VER TIENDA, NOTIFICACIONES Y AJUSTES */}
          <div className="flex items-center space-x-2.5">
            {/* BOTÓN VER TIENDA CLIENTE */}
            <button
              onClick={onVerComoCliente}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition"
              title="Ver la tienda exactamente como la ven tus clientes"
            >
              <span>🧁</span>
              <span className="hidden sm:inline">Ver Tienda Online</span>
            </button>

            {/* CAMPANA DE NOTIFICACIONES */}
            <div className="relative">
              <button
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 relative transition-colors"
                title="Centro de Alertas & Entregas"
              >
                <span className="text-base">🔔</span>
                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {totalAlertas}
                  </span>
                )}
              </button>

              {/* POPOVER DE NOTIFICACIONES */}
              {mostrarNotificaciones && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 text-slate-800 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                      <span>🔔</span>
                      <span>Alertas del Taller ({totalAlertas})</span>
                    </h3>
                    <button
                      onClick={() => setMostrarNotificaciones(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto mt-2 space-y-3 text-xs">
                    {entregasHoy.length > 0 && (
                      <div>
                        <div className="font-bold text-rose-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                          <span>🚨</span>
                          <span>Entregas para HOY ({entregasHoy.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {entregasHoy.map((p) => (
                            <div key={p.id} className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                              <div className="flex justify-between font-bold text-rose-900">
                                <span>{p.cliente_nombre}</span>
                                <span>{p.hora_entrega || 'Hoy'}</span>
                              </div>
                              <p className="text-rose-700 text-[11px] mt-0.5">
                                Pendiente: {formatCOP(p.saldo_pendiente)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alertasStockMinimo.length > 0 && (
                      <div>
                        <div className="font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                          <span>⚠️</span>
                          <span>Stock Bajo en Bodega ({alertasStockMinimo.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {alertasStockMinimo.map((i) => (
                            <div key={i.id} className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-bold text-amber-900">{i.nombre}</span>
                                <span className="text-[11px] text-amber-700 block">
                                  Stock: {i.stock_actual} / Mín: {i.stock_min} {i.unidad}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalAlertas === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        <span className="text-2xl block mb-1">🎉</span>
                        ¡Todo en orden en bodega y entregas!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ DE DATOS & COPIA DE SEGURIDAD */}
            <div className="relative">
              <button
                data-testid="btn-menu-datos"
                onClick={() => setMostrarMenuDatos(!mostrarMenuDatos)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Copia de Seguridad & Datos"
              >
                <span>💾</span>
              </button>
              {mostrarMenuDatos && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 text-xs">
                  <button
                    data-testid="btn-exportar-json"
                    onClick={() => {
                      onExportarJSON();
                      setMostrarMenuDatos(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-slate-800 flex items-center space-x-2 transition"
                  >
                    <span>📥</span>
                    <span>Descargar Copia JSON</span>
                  </button>
                </div>
              )}
            </div>

            {/* BOTÓN AJUSTES */}
            <button
              onClick={onAbrirAjustes}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Configuración de Costeo & Gastos Fijos"
            >
              <span>⚙️</span>
            </button>

            {/* BOTÓN CERRAR SESIÓN */}
            <button
              onClick={onCerrarSesionAdmin}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors"
              title="Cerrar Sesión Admin"
            >
              <span className="text-sm">🔒</span>
            </button>
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        <div className="lg:hidden flex overflow-x-auto px-2 py-2 bg-slate-950 border-t border-slate-800 space-x-1 text-xs no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onCambiarVista(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center space-x-1 ${
                vistaActual === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
