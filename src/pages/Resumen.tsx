import { useStore } from '../store';
import { calculateDemand, calculateAcometida, calculateRegulation } from '../lib/calculations';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export function Resumen() {
  const state = useStore();
  
  if (!state.isCalculated) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center space-y-4">
        <Activity className="w-16 h-16 text-muted-foreground/30 animate-pulse" />
        <h3 className="text-xl font-bold text-muted-foreground">Esperando Cálculos...</h3>
        <p className="text-muted-foreground max-w-md">
          Por favor presione el botón de <b>"Calcular Resultados"</b> en cualquiera de las pantallas anteriores para generar el resumen del sistema.
        </p>
      </div>
    );
  }

  const resDemand = calculateDemand(state);
  const resAcometida = calculateAcometida(state, resDemand);
  const resReg = calculateRegulation(state, resAcometida.iPhase, state.selectedAWG);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Resumen General</h2>
        <p className="text-muted-foreground mt-2">
          Visión global del sistema eléctrico calculado bajo los parámetros de la NTC2050.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* KPI 1 */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className="p-4 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Demanda Total</h3>
          <p className="text-4xl font-black text-foreground">{resDemand.demandTotal.toFixed(0)} <span className="text-xl">VA</span></p>
          <p className="text-xs text-muted-foreground mt-4 border-t pt-4 w-full">Factor de reducción NTC2050 aplicado.</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className="p-4 bg-blue-500/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Alimentador Principal</h3>
          <p className="text-4xl font-black text-foreground">{resAcometida.selectedAwg.awg} <span className="text-xl">AWG</span></p>
          <p className="text-xs text-muted-foreground mt-4 border-t pt-4 w-full">Corriente de fase: {resAcometida.iPhase.toFixed(1)} A</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
          <div className={`p-4 rounded-full mb-4 group-hover:scale-110 transition-transform ${resReg.statusTotal === 'CUMPLE' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <Activity className={`w-8 h-8 ${resReg.statusTotal === 'CUMPLE' ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Regulación</h3>
          <p className={`text-4xl font-black ${resReg.statusTotal === 'CUMPLE' ? 'text-green-600' : 'text-red-600'}`}>{resReg.regulationPercent.toFixed(1)} <span className="text-xl">%</span></p>
          <p className="text-xs text-muted-foreground mt-4 border-t pt-4 w-full">Límite normativo 5% (Alimentador)</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 mt-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">Detalles Técnicos Extendidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Voltaje de Sistema</p>
            <p className="font-semibold text-base">{state.voltage} V</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Corriente de Diseño</p>
            <p className="font-semibold text-base">{resAcometida.iPhase.toFixed(2)} A</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Sistema Eléctrico</p>
            <p className="font-semibold text-base">{state.voltage === 120 ? 'Monofásico (2 Hilos)' : 'Bifásico/Trifásico (3 Hilos)'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Área Total Evaluada</p>
            <p className="font-semibold text-base">{state.area} m²</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Total de Cargas Específicas</p>
            <p className="font-semibold text-base">
              {state.airConditioners.length + state.specialLoads.length + (state.hasDishwasher ? 1 : 0) + (state.hasLaundry ? 1 : 0)} Cargas
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Tubería Principal</p>
            <p className="font-semibold text-base">{resAcometida.conduitSize} PVC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
