import { NavLink, Link } from 'react-router-dom';
import { Home, Zap, ShieldCheck, Activity, List, FileText } from 'lucide-react';
import logoPng from '../assets/Logo png.png';

const menuItems = [
  { name: 'Cargas', path: '/residencial', icon: Zap, exact: true },
  { name: 'Acometida', path: '/residencial/acometida', icon: ShieldCheck },
  { name: 'Regulación', path: '/residencial/regulacion', icon: Activity },
  { name: 'Resumen', path: '/residencial/resumen', icon: Home },
  { name: 'Tablero', path: '/residencial/cuadro', icon: List },
  { name: 'Reporte PDF', path: '/residencial/pdf', icon: FileText },
];

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r hidden md:flex flex-col h-full sticky top-0">
        <div className="p-6 border-b flex flex-col items-start justify-center">
          <Link to="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <img src={logoPng} alt="Ohm App Logo" className="h-12 object-contain dark:drop-shadow-md" />
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
              }`
            }
          >
            <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t z-50 flex items-center justify-around px-2 pb-safe">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Indicador superior activo */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-md shadow-sm" />
                )}
                
                {/* Contenedor del ícono con fondo sutil */}
                <div className={`p-1.5 rounded-full transition-all duration-300 mt-1 ${isActive ? 'bg-primary/10' : ''}`}>
                  <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                </div>
                
                {/* Texto */}
                <span className={`text-[10px] truncate w-full text-center px-1 mb-1 transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
