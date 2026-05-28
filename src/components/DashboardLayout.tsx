import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useStore } from '../store';
import { calculateDemand, calculateAcometida, calculateRegulation } from '../lib/calculations';
import logoPng from '../assets/Logo png.png';
import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Sun, Moon } from 'lucide-react';

export function DashboardLayout() {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const state = useStore();
  const resDemand = calculateDemand(state);
  const resAcometida = calculateAcometida(state, resDemand);
  const resReg = calculateRegulation(state, resAcometida.iPhase, state.selectedAWG);

  return (
    <div className="flex h-screen bg-muted/20 pb-16 md:pb-0">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="bg-card/95 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="flex items-center gap-1 select-none md:hidden">
              <img src={logoPng} alt="Ohm App Logo" className="h-8 object-contain dark:drop-shadow-md" />
            </h1>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-4 bg-muted/50 rounded-full px-4 py-1.5 border">
                <div className="flex items-center gap-2 text-sm font-medium border-r pr-4 border-border">
                  <span className="text-muted-foreground">Demanda:</span>
                  <span className="font-bold">{resDemand.demandTotal.toFixed(0)} VA</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium border-r pr-4 border-border">
                  <span className="text-muted-foreground">Principal:</span>
                  <span className="font-bold">{resAcometida.selectedAwg.awg} AWG</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-muted-foreground">Regulación:</span>
                  {state.isCalculated ? (
                    <span className={`font-bold flex items-center gap-1 ${resReg.statusTotal === 'CUMPLE' ? 'text-green-600' : 'text-destructive'}`}>
                      {resReg.regulationPercent.toFixed(1)}% 
                      {resReg.statusTotal === 'CUMPLE' ? <CheckCircle className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">Pendiente</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsDark(!isDark)}
                className="p-2 border bg-card hover:bg-muted rounded-full transition-colors shadow-sm"
                title="Cambiar Tema"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
