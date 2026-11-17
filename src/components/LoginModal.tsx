import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginExitoso: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginExitoso,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Clave configurada de Josefina
    const claveCorrecta = localStorage.getItem('gf_admin_pin') || 'josefina2024';
    if (password.trim() === claveCorrecta) {
      setError(false);
      setPassword('');
      onLoginExitoso();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-amber-100 text-center animate-in fade-in zoom-in duration-200">
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-amber-950 font-serif mb-1">
          Acceso de Administración
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Ingresa tu contraseña para acceder a la cocina, costos, bodega y estadísticas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Contraseña de la dueña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 text-center tracking-wider ${
                error
                  ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/50'
                  : 'border-slate-200 focus:ring-amber-500 bg-slate-50'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-bold animate-shake">
              Contraseña incorrecta. Inténtalo de nuevo.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Taller</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400 mt-4">
          Contraseña inicial: <span className="font-mono text-slate-600">josefina2024</span>
        </p>
      </div>
    </div>
  );
};

