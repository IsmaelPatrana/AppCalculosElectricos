import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Zap, Building2, Factory, ArrowRight } from 'lucide-react';
import logoPng from '../assets/Logo png.png';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center mb-16 z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <img src={logoPng} alt="Ohm App Logo" className="h-20 md:h-24 mx-auto mb-6 drop-shadow-md" />
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
          Bienvenido a <span className="text-primary">OhmApp</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Seleccione el módulo de cálculo eléctrico normativo con el que desea trabajar hoy.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full z-10">
        
        {/* Module 1: Residencial (Active) */}
        <button 
          onClick={() => navigate('/residencial')}
          className="group relative flex flex-col items-start p-8 bg-card rounded-2xl border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-4 group-hover:translate-x-0">
            <ArrowRight className="text-primary w-6 h-6" />
          </div>
          <div className="bg-primary/10 p-4 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
            <HomeIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Residencial</h2>
          <p className="text-muted-foreground mb-6">
            Cálculo de cargas, acometidas y regulación para viviendas unifamiliares según NTC 2050.
          </p>
          <div className="mt-auto flex items-center gap-2 text-primary font-semibold">
            <Zap className="w-4 h-4 fill-current" /> Iniciar Cálculo
          </div>
        </button>

        {/* Module 2: Comercial (Coming Soon) */}
        <div className="relative flex flex-col items-start p-8 bg-card/50 rounded-2xl border border-dashed opacity-70 grayscale-[50%] transition-all duration-300">
          <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full">
            Próximamente
          </div>
          <div className="bg-muted p-4 rounded-xl mb-6">
            <Building2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Comercial</h2>
          <p className="text-muted-foreground">
            Diseño de locales y centros comerciales con factores de demanda específicos.
          </p>
        </div>

        {/* Module 3: Industrial (Coming Soon) */}
        <div className="relative flex flex-col items-start p-8 bg-card/50 rounded-2xl border border-dashed opacity-70 grayscale-[50%] transition-all duration-300">
          <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full">
            Próximamente
          </div>
          <div className="bg-muted p-4 rounded-xl mb-6">
            <Factory className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Industrial</h2>
          <p className="text-muted-foreground">
            Cálculo de motores, transformadores de distribución y naves industriales.
          </p>
        </div>

      </div>
    </div>
  );
}
