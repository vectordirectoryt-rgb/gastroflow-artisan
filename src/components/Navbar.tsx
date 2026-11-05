import React, { useState } from 'react';
import { VistaNavegacion, Insumo, Pedido } from '../core/types';
import { Bell, ChefHat, Package, FileText, ClipboardList, BarChart3, History, Settings, Trash2, Download } from 'lucide-react';
import { formatCOP } from '../core/utils/formatters';

interface NavbarProps {
  vistaActual: VistaNavegacion;
  onCambiarVista: (vista: VistaNavegacion) => void;
  insumos: Insumo[];
  pedidos: Pedido[];
  onLimpiarDatos: () => void;
  onExportarJSON: () => void;
  onAbrirAjustes: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActual,
  onCambiarVista,
  insumos,
  pedidos,
  onLimpiarDatos,
  onExportarJSON,
  onAbrirAjustes,
}) => {
  const [mostrarMenuDatos, setMostrarMenuDatos] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Alertas críticas
  const insumosCriticos = insumos.filter((i) => i.stock_actual <= i.stock_min);
  const hoyStr = new Date().toISOString().split('T')[0];
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = manana.toISOString().split('T')[0];

  const entregasHoy = pedidos.filter((p) => p.fecha_entrega === hoyStr && p.estado !== 'entregado');
  const entregasManana = pedidos.filter((p) => p.fecha_entrega === mananaStr && p.estado !== 'entregado');

  const totalAlertas = insumosCriticos.length + entregasHoy.length + entregasManana.length;

  const tabs: { id: VistaNavegacion; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pedidos', label: 'Libreta de Pedidos', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'cocina', label: 'Cocina & Lotes', icon: <ChefHat className="w-4 h-4" /> },
    { id: 'bodega', label: 'Insumos & Precios', icon: <Package className="w-4 h-4" /> },
    { id: 'recetario', label: 'Recetas & Costeo', icon: <FileText className="w-4 h-4" /> },
    { id: 'historial', label: 'Historial & Auditoría', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onCambiarVista('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Gastro<span className="text-amber-600">Flow</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full w-fit">
                Artisan v6.1
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1" aria-label="Tabs Principales">
            {tabs.map((tab) => {
              const active = vistaActual === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onCambiarVista(tab.id)}
                  data-testid={`tab-${tab.id}`}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-amber-50 text-amber-900 border border-amber-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className={active ? 'text-amber-600' : 'text-slate-400'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Notifications & Settings */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                data-testid="btn-notificaciones"
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="Notificaciones urgentes"
              >
                <Bell className="w-5 h-5" />
                {totalAlertas > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalAlertas}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {mostrarNotificaciones && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-600" /> Alertas del Taller
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {totalAlertas} pendientes
                    </span>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2 text-xs">
                    {entregasHoy.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                        <span className="font-bold text-rose-800 block">🚨 Entregas para HOY ({entregasHoy.length})</span>
                        {entregasHoy.map((p) => (
                          <div key={p.id} className="mt-1 text-rose-700">
                            • {p.cliente_nombre} - {p.hora_entrega || 'Todo el día'} ({formatCOP(p.saldo_pendiente)} pendiente)
                          </div>
                        ))}
                      </div>
                    )}

                    {entregasManana.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <span className="font-bold text-amber-800 block">⏰ Entregas para MAÑANA ({entregasManana.length})</span>
                        {entregasManana.map((p) => (
                          <div key={p.id} className="mt-1 text-amber-700">
                            • {p.cliente_nombre} a las {p.hora_entrega || '12:00'} (Hornear hoy con tiempo)
                          </div>
                        ))}
                      </div>
                    )}

                    {insumosCriticos.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-800 block">⚠️ Insumos Críticos ({insumosCriticos.length})</span>
                        {insumosCriticos.map((i) => (
                          <div key={i.id} className="mt-1 text-slate-600">
                            • {i.nombre}: {i.stock_actual} {i.unidad} (Mínimo: {i.stock_min} {i.unidad})
                          </div>
                        ))}
                      </div>
                    )}

                    {totalAlertas === 0 && (
                      <div className="text-center py-6 text-slate-400">
                        🎉 Todo en orden en cocina y bodega. ¡Excelente trabajo!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings & Data Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMostrarMenuDatos(!mostrarMenuDatos)}
                data-testid="btn-menu-datos"
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Datos ⚙️</span>
              </button>

              {mostrarMenuDatos && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                  <button
                    onClick={() => {
                      setMostrarMenuDatos(false);
                      onAbrirAjustes();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ajustes de Costeo (kWh & CIF)</span>
                  </button>
                  <button
                    onClick={() => {
                      setMostrarMenuDatos(false);
                      onExportarJSON();
                    }}
                    data-testid="btn-exportar-json"
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Exportar Copia JSON</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setMostrarMenuDatos(false);
                      if (window.confirm('¿Segura que deseas reiniciar los datos al estado de fábrica?')) {
                        onLimpiarDatos();
                      }
                    }}
                    data-testid="btn-limpiar-todo"
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar Todo (Virgen)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1 border-t border-slate-100 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onCambiarVista(tab.id)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                vistaActual === tab.id ? 'bg-amber-100 text-amber-900 font-bold' : 'text-slate-600 bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
