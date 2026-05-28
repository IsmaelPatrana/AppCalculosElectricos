import { useStore } from '../store';
import { AWG_TABLE, calculateDemand, calculateAcometida, calculateRegulation } from '../lib/calculations';
import { Activity, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Tooltip } from '../components/Tooltip';

export function Regulacion() {
  const state = useStore();
  const resDemand = calculateDemand(state);
  const resAcometida = calculateAcometida(state, resDemand);
  const res = calculateRegulation(state, resAcometida.iPhase, state.selectedAWG);

  const handleAutoFix = () => {
    // Buscar un calibre que cumpla iterando desde el sugerido
    let currentAwgIdx = AWG_TABLE.findIndex(w => w.awg === state.selectedAWG);
    if (currentAwgIdx === -1) currentAwgIdx = 0;
    
    // Iteramos hacia conductores más gruesos (índices mayores)
    for (let i = currentAwgIdx + 1; i < AWG_TABLE.length; i++) {
      const checkRes = calculateRegulation(state, resAcometida.iPhase, AWG_TABLE[i].awg);
      if (checkRes.statusTotal === 'CUMPLE' && checkRes.statusRamal === 'CUMPLE') {
        state.setField('selectedAWG', AWG_TABLE[i].awg);
        return;
      }
    }
  };

  const needsFix = res.statusTotal === 'NO CUMPLE' || res.statusRamal === 'NO CUMPLE';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Regulación de Voltaje</h2>
        <p className="text-muted-foreground mt-2">
          Verifique que la caída de tensión no supere el límite normativo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold border-b pb-2">Parámetros del Circuito</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Longitud (m) <Tooltip text="Distancia desde el transformador o tablero principal hasta el tablero de distribución (Alimentador)." />
              </label>
              <input 
                type="number" 
                value={state.feederLength} 
                onChange={(e) => state.setField('feederLength', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                FP <Tooltip text="Factor de potencia típico residencial es 0.9" />
              </label>
              <input 
                type="number" 
                step="0.01" max="1" min="0"
                value={state.powerFactor} 
                onChange={(e) => state.setField('powerFactor', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Material <Tooltip text="El aluminio requiere multiplicar la resistencia (R) por ~1.63 debido a su menor conductividad." />
              </label>
              <select 
                value={state.feederMaterial} 
                onChange={(e) => state.setField('feederMaterial', e.target.value as 'cobre' | 'aluminio')}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="cobre">Cobre</option>
                <option value="aluminio">Aluminio</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tubería</label>
              <select 
                value={state.feederConduit} 
                onChange={(e) => state.setField('feederConduit', e.target.value as 'pvc' | 'metal')}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="pvc">PVC</option>
                <option value="metal">Metálica</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Calibre del Conductor (AWG)</label>
            <select 
              value={state.selectedAWG} 
              onChange={(e) => state.setField('selectedAWG', e.target.value)}
              className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            >
              {AWG_TABLE.map(wire => (
                <option key={wire.awg} value={wire.awg}>{wire.awg} AWG</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">El cálculo térmico sugirió {resAcometida.selectedAwg.awg} AWG.</p>
          </div>

          {!state.isCalculated && (
            <button 
              onClick={state.triggerCalculation}
              className="w-full mt-4 py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Zap className="w-6 h-6 fill-current group-hover:scale-110 transition-transform duration-300" /> Calcular Caída de Tensión
            </button>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-center">
          {!state.isCalculated ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-card border rounded-lg border-dashed text-center p-8">
              <Activity className="w-16 h-16 text-muted-foreground/30 animate-pulse mb-4" />
              <h3 className="text-xl font-bold text-muted-foreground mb-2">Resultados Ocultos</h3>
              <p className="text-muted-foreground">Presione Calcular Caída de Tensión para evaluar los parámetros.</p>
            </div>
          ) : (
            <div className={`border-2 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative overflow-hidden text-center
              ${needsFix ? 'border-destructive bg-destructive/5' : 'border-green-500 bg-green-50 dark:bg-green-900/10'}
            `}>
            {needsFix && (
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <AlertTriangle className="w-32 h-32 text-destructive" />
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-4">Regulación de Voltaje</h3>
            
            <div className="flex justify-center items-end gap-2 mb-6">
              <p className={`text-6xl font-black ${needsFix ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                {res.regulationPercent.toFixed(1)}
              </p>
              <span className="text-xl font-bold text-muted-foreground pb-2">%</span>
            </div>

            {needsFix ? (
              <div className="space-y-4">
                <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-md">
                  Peligro: La caída de tensión ({res.deltaV.toFixed(1)}V) excede los límites NTC2050 (3% ramal, 5% alimentador).
                </div>
                <button 
                  onClick={handleAutoFix}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <Zap className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" /> Optimizar Calibre Automáticamente
                </button>
              </div>
            ) : (
              <div className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 text-sm font-bold p-3 rounded-md flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" /> Parámetros Óptimos
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
