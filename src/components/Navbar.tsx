import React, { useState } from 'react';
import { VistaNavegacion, Insumo, Pedido } from '../core/types';
import { formatCOP } from '../core/utils/formatters';
import {
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Package,
  BookOpen,
  History,
  Store,
  ExternalLink,
  Bell,
  Settings,
  Download,
  RotateCcw,
  LogOut,
  ChevronDown,
} from 'lucide-react';

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
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  onCambiarVista,
  insumos,
  pedidos,
  onLimpiarDatos,
  onExportarJSON,
  onAbrirAjustes,
  onVerComoCliente,
  onCerrarSesionAdmin,
  logoUrl = '/logo-brownies-josefina-clean.png',
}) => {
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarMenuDatos, setMostrarMenuDatos] = useState(false);

  // Análisis de alertas y faltantes
  const hoyStr = new Date().toISOString().split('T')[0];
  
  // Insumos críticos (stock <= mínimo)
  const alertasStockMinimo = insumos.filter(i => i.stock_actual <= i.stock_min);
  const entregasHoy = pedidos.filter(p => p.fecha_entrega === hoyStr && p.estado !== 'entregado');
  const totalAlertas = alertasStockMinimo.length + entregasHoy.length;

  const tabs: { id: VistaNavegacion; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'cocina', label: 'Cocina', icon: <ChefHat className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'bodega', label: 'Bodega', icon: <Package className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'recetario', label: 'Recetas', icon: <BookOpen className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'historial', label: 'Historial', icon: <History className="w-3.5 h-3.5 flex-shrink-0" /> },
    { id: 'tienda', label: 'Catálogo Web', icon: <Store className="w-3.5 h-3.5 flex-shrink-0" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#22221E] border-b border-[#3A3A34] text-[#ECEBCF] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO GASTROFLOW ARTISAN */}
          <div
            onClick={() => onCambiarVista('dashboard')}
            className="flex items-center space-x-3 cursor-pointer select-none group flex-shrink-0"
          >
            <div className="h-10 w-10 rounded-xl bg-[#ECEBCF] p-1 flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden border border-[#DDDABA]">
              <img
                src={logoUrl}
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

          {/* MENÚ DE NAVEGACIÓN DESKTOP (1 sola línea, sin desbordes verticales) */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Tabs Principales">
            {tabs.map((tab) => {
              const active = vistaActual === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onCambiarVista(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    active
                      ? 'bg-[#A472B9] text-white font-black shadow-sm'
                      : 'text-[#ECEBCF]/80 hover:text-white hover:bg-[#2E2E29]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ACCIONES DERECHA: VER TIENDA, NOTIFICACIONES Y AJUSTES */}
          <div className="flex items-center space-x-2">
            {/* BOTÓN VER TIENDA CLIENTE */}
            <button
              onClick={onVerComoCliente}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-[#22221E] bg-[#ECEBCF] hover:bg-[#DDDABA] rounded-lg shadow-sm transition border border-[#DDDABA] whitespace-nowrap"
              title="Ver la tienda exactamente como la ven tus clientes"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#22221E]" />
              <span className="hidden sm:inline">Ver Tienda</span>
            </button>

            {/* CAMPANA DE NOTIFICACIONES */}
            <div className="relative">
              <button
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                className="p-2 rounded-lg bg-[#2E2E29] hover:bg-[#3A3A34] text-[#ECEBCF] relative transition-colors border border-[#3A3A34]"
                title="Centro de Alertas & Entregas"
              >
                <Bell className="w-4 h-4 text-[#ECEBCF]" />
                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#A472B9] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse shadow-xs">
                    {totalAlertas}
                  </span>
                )}
              </button>

              {/* POPOVER DE NOTIFICACIONES */}
              {mostrarNotificaciones && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#DDDABA] z-50 text-[#22221E] p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#DDDABA]/50">
                    <h3 className="font-bold text-sm text-[#22221E] flex items-center space-x-1.5 font-serif">
                      <Bell className="w-4 h-4 text-[#A472B9]" />
                      <span>Alertas del Taller ({totalAlertas})</span>
                    </h3>
                    <button
                      onClick={() => setMostrarNotificaciones(false)}
                      className="text-[#7A6B60] hover:text-[#22221E] text-sm font-bold"
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
                            <div key={i.id} className="p-2 bg-[#ECEBCF]/40 border border-[#DDDABA] rounded-lg flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[#22221E]">{i.nombre}</span>
                                <span className="text-[11px] text-[#5C4D43] block">
                                  Stock: {i.stock_actual} / Mín: {i.stock_min} {i.unidad}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalAlertas === 0 && (
                      <div className="text-center py-6 text-[#7A6B60]">
                        <span className="text-2xl block mb-1">🎉</span>
                        ¡Todo en orden en bodega y entregas!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ UNIFICADO DE TALLER: AJUSTES, BACKUP Y SESIÓN */}
            <div className="relative">
              <button
                data-testid="btn-menu-datos"
                onClick={() => setMostrarMenuDatos(!mostrarMenuDatos)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#2E2E29] hover:bg-[#3A3A34] text-[#ECEBCF] transition-colors border border-[#3A3A34]"
                title="Configuración del taller, respaldo y sesión"
              >
                <Settings className="w-4 h-4 text-[#B6BD90]" />
                <span className="text-xs font-bold hidden sm:inline">Taller</span>
                <ChevronDown className="w-3 h-3 text-[#ECEBCF]/60" />
              </button>

              {mostrarMenuDatos && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#DDDABA] z-50 p-2 text-xs text-[#22221E] divide-y divide-[#DDDABA]/50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onAbrirAjustes();
                        setMostrarMenuDatos(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#ECEBCF]/50 font-bold text-[#22221E] flex items-center space-x-2 transition"
                    >
                      <Settings className="w-4 h-4 text-[#A472B9]" />
                      <span>Ajustes de Costeo & kWh</span>
                    </button>
                    <button
                      data-testid="btn-exportar-json"
                      onClick={() => {
                        onExportarJSON();
                        setMostrarMenuDatos(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#ECEBCF]/50 font-bold text-[#22221E] flex items-center space-x-2 transition"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Descargar Copia JSON</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        if (window.confirm('¿Seguro que deseas restablecer los datos de ejemplo del taller?')) {
                          onLimpiarDatos();
                        }
                        setMostrarMenuDatos(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 font-medium text-rose-700 flex items-center space-x-2 transition"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-500" />
                      <span>Restablecer Datos</span>
                    </button>
                    <button
                      onClick={() => {
                        setMostrarMenuDatos(false);
                        onCerrarSesionAdmin();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 font-bold text-[#22221E] flex items-center space-x-2 transition"
                    >
                      <LogOut className="w-4 h-4 text-slate-500" />
                      <span>Cerrar Sesión Admin</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MENÚ MÓVIL */}
        <div className="lg:hidden flex overflow-x-auto px-2 py-2 bg-[#1A1A17] border-t border-[#3A3A34] space-x-1 text-xs no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onCambiarVista(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold flex items-center space-x-1 ${
                vistaActual === tab.id
                  ? 'bg-[#A472B9] text-white shadow-sm'
                  : 'text-[#ECEBCF]/80 hover:text-white hover:bg-[#2E2E29]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
