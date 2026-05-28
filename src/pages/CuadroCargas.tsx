import { useMemo } from 'react';
import { useStore } from '../store';
import { calculateDemand } from '../lib/calculations';
import { Zap, List } from 'lucide-react';

interface CircuitRow {
  num: number;
  name: string;
  loadVA: number;
  phase: 'L1' | 'L2' | 'L1-L2';
  awg: string;
  breaker: string;
}

export function CuadroCargas() {
  const state = useStore();
  const resDemand = calculateDemand(state);

  const circuits = useMemo(() => {
    const list: Omit<CircuitRow, 'num' | 'phase'>[] = [];
    
    // 1. Circuitos Base a 120V y 15A (Separados semánticamente)
    const atugTotal = resDemand.atug;
    const numAtug = Math.max(1, Math.ceil((atugTotal / 120) / 15));
    const loadPerAtug = Math.round(atugTotal / numAtug);
    
    for (let i = 0; i < numAtug; i++) {
      list.push({ 
        name: 'Alumbrado y Tomas Generales', 
        loadVA: loadPerAtug, 
        awg: '14', 
        breaker: '1x15A' 
      });
    }

    for (let i = 0; i < state.smallAppliances; i++) {
      list.push({ 
        name: 'Pequeños Artefactos (Cocina)', 
        loadVA: 1500, 
        awg: '12', 
        breaker: '1x20A' // La NTC2050 exige 20A para PA
      });
    }

    if (state.hasLaundry) {
      list.push({ 
        name: 'Lavado y Planchado', 
        loadVA: 1500, 
        awg: '12', 
        breaker: '1x20A' // La NTC2050 exige 20A para LP
      });
    }

    // Función auxiliar para determinar breaker de los circuitos restantes
    const restVoltage = state.voltage > 120 ? state.voltage : 120;
    const isDoublePole = state.voltage > 120;
    const polesStr = isDoublePole ? '2x' : '1x';

    function getBreakerAndAwg(va: number, v: number) {
      const current = va / v;
      const sizes = [15, 20, 30, 40, 50, 60, 70, 80, 100];
      const size = sizes.find(s => s >= current) || 100;
      let awg = '12';
      if (size > 40) awg = '6';
      else if (size > 30) awg = '8';
      else if (size > 20) awg = '10';
      else if (size <= 15) awg = '14';
      return { breaker: `${polesStr}${size}A`, awg };
    }

    // 2. Circuitos Restantes (Lavavajillas, Aires, Especiales) asumiendo 220V/240V
    if (state.hasDishwasher) {
      const { breaker, awg } = getBreakerAndAwg(1500, restVoltage);
      list.push({ name: 'Lavavajillas', loadVA: 1500, awg, breaker });
    }

    state.airConditioners.forEach((ac, idx) => {
      const { breaker, awg } = getBreakerAndAwg(ac.powerVA, restVoltage);
      list.push({ name: ac.name || `Aire Acondicionado ${idx + 1}`, loadVA: ac.powerVA, awg, breaker });
    });

    state.specialLoads.forEach((sp, idx) => {
      const { breaker, awg } = getBreakerAndAwg(sp.powerVA, restVoltage);
      list.push({ name: sp.name || `Carga Especial ${idx + 1}`, loadVA: sp.powerVA, awg, breaker });
    });

    let l1Sum = 0;
    let l2Sum = 0;
    const isSinglePhase = state.voltage === 120;
    
    list.sort((a, b) => b.loadVA - a.loadVA);

    return list.map((c, i) => {
      let phase: 'L1' | 'L2' | 'L1-L2' = 'L1';
      if (isSinglePhase) {
        l1Sum += c.loadVA;
      } else {
        if (c.breaker.startsWith('2x')) {
          phase = 'L1-L2';
          l1Sum += c.loadVA / 2;
          l2Sum += c.loadVA / 2;
        } else {
          if (l1Sum <= l2Sum) {
            phase = 'L1';
            l1Sum += c.loadVA;
          } else {
            phase = 'L2';
            l2Sum += c.loadVA;
          }
        }
      }
      return { ...c, num: i + 1, phase };
    });
  }, [state, resDemand]);

  const l1Total = circuits.filter(c => c.phase === 'L1').reduce((acc, c) => acc + c.loadVA, 0) + 
                  circuits.filter(c => c.phase === 'L1-L2').reduce((acc, c) => acc + c.loadVA / 2, 0);
  const l2Total = circuits.filter(c => c.phase === 'L2').reduce((acc, c) => acc + c.loadVA, 0) + 
                  circuits.filter(c => c.phase === 'L1-L2').reduce((acc, c) => acc + c.loadVA / 2, 0);
  const desbalance = l1Total + l2Total > 0 ? Math.abs(l1Total - l2Total) / Math.max(l1Total, l2Total) * 100 : 0;

  // Visual Panel Logic
  const panelRows: { left: CircuitRow | null, right: CircuitRow | null, double: CircuitRow | null }[] = [];
  const l1Circuits = circuits.filter(c => c.phase === 'L1');
  const l2Circuits = circuits.filter(c => c.phase === 'L2');
  const doubleCircuits = circuits.filter(c => c.phase === 'L1-L2');
  
  // Asignar los dobles primero
  doubleCircuits.forEach(c => panelRows.push({ left: null, right: null, double: c }));
  
  // Asignar los sencillos
  const maxSingles = Math.max(l1Circuits.length, l2Circuits.length);
  for(let i=0; i<maxSingles; i++) {
    panelRows.push({
      left: l1Circuits[i] || null,
      right: l2Circuits[i] || null,
      double: null
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tablero Eléctrico Interactivo</h2>
          <p className="text-muted-foreground mt-2">
            Visualización gráfica de los breakers y su distribución en las barras L1 y L2 para lograr el balance de fases.
          </p>
        </div>
        {state.voltage !== 120 && (
          <div className={`px-4 py-2 rounded-lg border flex flex-col items-center shadow-sm ${desbalance > 5 ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20'}`}>
            <span className="text-xs font-bold uppercase tracking-wider">Desbalanceo</span>
            <span className="text-2xl font-black">{desbalance.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {!state.isCalculated ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-card border rounded-lg border-dashed text-center p-8 mt-8">
          <Zap className="w-16 h-16 text-muted-foreground/30 animate-pulse mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground mb-2">Tablero no Generado</h3>
          <p className="text-muted-foreground">Debe calcular la demanda en los pasos anteriores para poder construir el tablero eléctrico.</p>
        </div>
      ) : (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Panel Graphic */}
        <div className="lg:col-span-2 flex flex-col items-center mx-auto w-full max-w-full overflow-x-auto pb-8 mt-4 px-4 sm:px-12">
          <h2 className="text-red-600 font-black text-2xl mb-4 tracking-wider uppercase">Tablero General</h2>
          
          <div className="w-full min-w-[340px] max-w-lg bg-[#7a7774] border-[8px] border-[#5a5754] border-t-[#9a9794] border-l-[#9a9794] p-8 pb-40 relative shadow-2xl rounded-sm">
            
            {/* Labels Fase R y Fase S */}
            <div className="flex justify-center mb-6 relative">
              <span className="text-white font-bold text-xl absolute left-[35%] -translate-x-1/2 drop-shadow-md">Fase R</span>
              <span className="text-white font-bold text-xl absolute left-[65%] -translate-x-1/2 drop-shadow-md">Fase S</span>
            </div>

            {/* Contenedor de las barras principales y breakers */}
            <div className="relative flex justify-center min-h-[300px] w-full">
              
              {/* Barra Fase R */}
              <div className="absolute left-[35%] top-0 bottom-0 w-4 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 border-x border-orange-900 shadow-sm -translate-x-1/2 z-0"></div>
              
              {/* Barra Fase S */}
              <div className="absolute left-[65%] top-0 bottom-0 w-4 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 border-x border-orange-900 shadow-sm -translate-x-1/2 z-0"></div>

              <div className="w-full flex flex-col gap-6 relative z-10 pt-4">
                {panelRows.map((row, idx) => (
                  <div key={idx} className="flex w-full h-8 relative">
                    
                    {/* Breaker Fase R */}
                    {row.left && (
                      <div className="absolute right-[65%] flex items-center justify-end gap-2 w-64" style={{ marginRight: '-2rem' }}>
                        <span className="text-black font-black text-sm drop-shadow-md truncate max-w-[120px]">{row.left.name}</span>
                        <div className="w-24 h-7 bg-gradient-to-b from-white to-gray-200 border border-gray-400 shadow-md flex items-center justify-start px-2 z-10 rounded-sm">
                          <div className="w-5 h-5 bg-gradient-to-b from-gray-200 via-white to-gray-300 border border-gray-400 flex items-center justify-center shadow-inner rounded-sm">
                             <div className="w-2 h-2.5 bg-slate-800 rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Breaker Fase S */}
                    {row.right && (
                      <div className="absolute left-[65%] flex items-center justify-start gap-2 w-64" style={{ marginLeft: '-2rem' }}>
                        <div className="w-24 h-7 bg-gradient-to-b from-white to-gray-200 border border-gray-400 shadow-md flex items-center justify-end px-2 z-10 rounded-sm">
                          <div className="w-5 h-5 bg-gradient-to-b from-gray-200 via-white to-gray-300 border border-gray-400 flex items-center justify-center shadow-inner rounded-sm">
                             <div className="w-2 h-2.5 bg-slate-800 rounded-sm"></div>
                          </div>
                        </div>
                        <span className="text-black font-black text-sm drop-shadow-md truncate max-w-[120px]">{row.right.name}</span>
                      </div>
                    )}

                    {/* Breaker Bipolar (L1-L2) */}
                    {row.double && (
                      <div className="absolute left-[50%] -translate-x-1/2 flex items-center justify-center gap-2 w-full z-20">
                        <span className="text-black font-black text-sm drop-shadow-md truncate max-w-[100px] absolute right-[65%] mr-14">{row.double.name}</span>
                        {/* El breaker doble cruza ambas barras */}
                        <div className="w-[40%] min-w-[180px] h-8 bg-gradient-to-b from-white to-gray-200 border-2 border-gray-500 shadow-lg flex items-center justify-between px-4 rounded-sm">
                          <div className="w-5 h-5 bg-gradient-to-b from-gray-200 via-white to-gray-300 border border-gray-400 flex items-center justify-center shadow-inner rounded-sm">
                             <div className="w-2 h-2.5 bg-slate-800 rounded-sm"></div>
                          </div>
                          <div className="w-5 h-5 bg-gradient-to-b from-gray-200 via-white to-gray-300 border border-gray-400 flex items-center justify-center shadow-inner rounded-sm">
                             <div className="w-2 h-2.5 bg-slate-800 rounded-sm"></div>
                          </div>
                        </div>
                        <span className="text-black font-black text-sm drop-shadow-md truncate max-w-[100px] absolute left-[65%] ml-14">220V</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Zona Inferior: Neutro y Tierra */}
            <div className="absolute bottom-6 left-8 right-8 h-32">
              {/* Neutro */}
              <span className="text-[#1d4ed8] font-black text-xl absolute left-0 top-0 drop-shadow-md">Neutro</span>
              <div className="absolute left-4 top-8 w-4 h-20 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 border border-orange-900 shadow-sm z-10"></div>
              
              {/* Tierra */}
              <span className="text-[#22c55e] font-black text-xl absolute left-40 top-16 drop-shadow-md">Tierra</span>
              <div className="absolute left-16 top-24 w-20 h-4 bg-gradient-to-b from-amber-500 via-orange-600 to-amber-700 border border-orange-900 shadow-sm z-10"></div>
              
              {/* Conexión Neutro - Tierra (Cobre) */}
              <div className="absolute left-6 top-16 w-20 h-2 bg-orange-800 border-y border-orange-900 z-0"></div>
              <div className="absolute left-24 top-16 w-2 h-8 bg-orange-800 border-x border-orange-900 z-0"></div> 
              
              {/* Cable rojo de tierra hacia afuera */}
              <div className="absolute left-[84px] top-26 w-[3px] h-32 bg-red-600 z-0"></div>
            </div>

          </div>
          
          {/* Símbolo de tierra exterior */}
          <div className="relative w-full h-24">
            {/* Codo del cable rojo */}
            <div className="absolute top-10 left-[40px] w-[80px] h-[3px] bg-red-600"></div>
            
            {/* Símbolo GND */}
            <div className="absolute top-10 left-[40px] flex flex-col items-center gap-1 -translate-x-1/2">
              <div className="w-10 h-1 bg-black"></div>
              <div className="w-6 h-1 bg-black"></div>
              <div className="w-2 h-1 bg-black"></div>
            </div>
          </div>
        </div>

        {/* Resumen Sidebar */}
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" /> Carga por Fases
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 rounded-md border border-red-100 dark:border-red-900/30">
                <span className="font-bold">Fase L1</span>
                <span className="font-mono text-lg">{l1Total.toFixed(0)} VA</span>
              </div>
              
              {state.voltage !== 120 && (
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 rounded-md border border-blue-100 dark:border-blue-900/30">
                  <span className="font-bold">Fase L2</span>
                  <span className="font-mono text-lg">{l2Total.toFixed(0)} VA</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              El algoritmo de la aplicación ordenó las cargas de mayor a menor y las asignó dinámicamente a la fase con menor carga, 
              minimizando así el desbalanceo. Un desbalanceo menor al 5% es considerado óptimo en ingeniería eléctrica residencial.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla Detallada de Cuadro de Cargas */}
      <div className="mt-12 bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
        <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <List className="w-5 h-5 text-primary" /> Tabla de Cuadro de Cargas
          </h3>
          <span className="text-sm text-muted-foreground">Total: {circuits.length} circuitos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-6 py-4 text-center border-r">Cto</th>
                <th className="px-6 py-4">Descripción de la Carga</th>
                <th className="px-6 py-4 text-right">Potencia (VA)</th>
                <th className="px-6 py-4 text-center">Fase</th>
                <th className="px-6 py-4 text-center">Protección</th>
                <th className="px-6 py-4 text-center">Conductor</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {circuits.map((c) => (
                <tr key={c.num} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3 font-black text-center border-r text-muted-foreground">{c.num}</td>
                  <td className="px-6 py-3 font-medium">{c.name}</td>
                  <td className="px-6 py-3 text-right font-mono">{c.loadVA}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      c.phase === 'L1' ? 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' : 
                      c.phase === 'L2' ? 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {c.phase}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center font-mono font-semibold">{c.breaker}</td>
                  <td className="px-6 py-3 text-center font-mono text-muted-foreground">{c.awg} AWG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
