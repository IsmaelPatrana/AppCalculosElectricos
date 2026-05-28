import { useStore } from '../store';
import { calculateDemand, calculateAcometida } from '../lib/calculations';
import { Info, Zap } from 'lucide-react';

export function Acometida() {
  const state = useStore();
  const resDemand = calculateDemand(state);
  const res = calculateAcometida(state, resDemand);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alimentador y Neutro</h2>
        <p className="text-muted-foreground mt-2">
          Dimensionamiento del conductor de acometida principal según carga y temperatura (Art 310-16).
        </p>
      </div>

      {!state.isCalculated ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-card border rounded-lg border-dashed text-center p-8">
          <Info className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground mb-4">Parámetros Modificados</h3>
          <p className="text-muted-foreground mb-6">Presione el siguiente botón para recalcular los resultados con los nuevos parámetros.</p>
          <button 
            onClick={state.triggerCalculation}
            className="px-8 py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <Zap className="w-6 h-6 fill-current group-hover:scale-110 transition-transform duration-300" /> Calcular Parámetros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold border-b pb-2">Parámetros del Sistema</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Voltaje del Sistema (V)</label>
              <select 
                value={state.voltage} 
                onChange={(e) => state.setField('voltage', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={120}>120V (1 Fase, 2 Hilos)</option>
                <option value={208}>208V (Trifásico/Bifásico)</option>
                <option value={220}>220V (Bifásico)</option>
                <option value={240}>240V (1 Fase, 3 Hilos split-phase)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temperatura Ambiente (°C)</label>
              <select 
                value={state.temperature} 
                onChange={(e) => state.setField('temperature', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={30}>30°C (Factor 1.00)</option>
                <option value={35}>35°C (Factor 0.94)</option>
                <option value={40}>40°C (Factor 0.88)</option>
                <option value={45}>45°C (Factor 0.82)</option>
              </select>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Info className="w-4 h-4"/> Detalles Internos</h4>
            <div className="flex justify-between text-sm">
              <span>Carga Demandada Base</span>
              <span>{resDemand.demandTotal.toFixed(1)} VA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Carga Equivalente Neutro</span>
              <span>{res.sNeutro.toFixed(1)} VA</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Factor Temp.</span>
              <span>x{res.tempFactor.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Resultados Acometida (Fases)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Corriente de Diseño ($I_F$)</p>
                <p className="text-2xl font-bold">{res.iPhase.toFixed(2)} A</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                <p className="text-sm text-primary">Calibre Mínimo</p>
                <p className="text-2xl font-bold text-primary">{res.selectedAwg.awg} AWG</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ampacidad Tabla 310-16 (75°C)</span>
                <span className="font-medium">{res.selectedAwg.ampacity} A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ampacidad Corregida</span>
                <span className="font-medium">{res.correctedAmpacity.toFixed(2)} A</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Validación</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${res.status === 'CUMPLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {res.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Conductor de Neutro</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Corriente Neutro ($I_N$)</p>
                <p className="text-2xl font-bold">{res.iNeutro.toFixed(2)} A</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                <p className="text-sm text-primary">Calibre Neutro</p>
                <p className="text-2xl font-bold text-primary">{res.selectedNeutroAwg.awg} AWG</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              La corriente del neutro se calcula tomando el Subtotal General (100% + 35%) sumado al 70% de las cargas especiales y motores (Art. 220-22).
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Ducto / Tubería</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Conductores en Ducto</p>
                <p className="text-2xl font-bold">{res.numConductors}</p>
                <p className="text-xs text-muted-foreground mt-1">Fases + Neutro + Tierra</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-lg text-center border border-blue-500/20">
                <p className="text-sm text-blue-600">Diámetro PVC</p>
                <p className="text-2xl font-bold text-blue-600">{res.conduitSize}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Dimensión basada en la Tabla C9 de la NTC 2050 para tubería conduit de PVC rígido (Schedule 40) utilizando conductores THHN.
            </p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
