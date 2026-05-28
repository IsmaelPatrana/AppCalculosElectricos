import { useStore } from '../store';
import { calculateDemand } from '../lib/calculations';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from '../components/Tooltip';

export function CargaVivienda() {
  const state = useStore();
  const [acName, setAcName] = useState('');
  const [acPower, setAcPower] = useState('');
  const [specialName, setSpecialName] = useState('');
  const [specialPower, setSpecialPower] = useState('');

  const AC_CAPACITIES = [
    { btu: 9000, label: '9.000 BTU (1000 VA)', va: 1000 },
    { btu: 12000, label: '12.000 BTU (1330 VA)', va: 1330 },
    { btu: 18000, label: '18.000 BTU (2000 VA)', va: 2000 },
    { btu: 24000, label: '24.000 BTU (2780 VA)', va: 2780 },
    { btu: 36000, label: '36.000 BTU (4220 VA)', va: 4220 },
    { btu: 48000, label: '48.000 BTU (5560 VA)', va: 5560 },
    { btu: 60000, label: '60.000 BTU (7110 VA)', va: 7110 }
  ];

  const res = calculateDemand(state);
  const chartData = [
    { name: 'Instalada', value: res.totalInstalled },
    { name: 'Demandada', value: res.demandTotal }
  ];

  const handleAddAC = () => {
    if (acName && acPower) {
      state.addLoad('airConditioners', { id: Date.now().toString(), name: acName, powerVA: Number(acPower) });
      setAcName('');
      setAcPower('');
    }
  };

  const handleAddSpecial = () => {
    if (specialName && specialPower) {
      state.addLoad('specialLoads', { id: Date.now().toString(), name: specialName, powerVA: Number(specialPower) });
      setSpecialName('');
      setSpecialPower('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cargas de la Vivienda</h2>
        <p className="text-muted-foreground mt-2">
          Ingrese las cargas y dimensiones para calcular la demanda total según la NTC2050.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Datos Generales</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Área de la vivienda (m²) 
                <Tooltip text="Se estiman 32 VA/m² para alumbrado general (Art. 220-3)" />
              </label>
              <input 
                type="number" 
                value={state.area} 
                onChange={(e) => state.setField('area', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="Ej. 120"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Voltaje del Sistema
                <Tooltip text="Sistemas bifásicos 240V/120V o monofásicos 120V." />
              </label>
              <select 
                value={state.voltage} 
                onChange={(e) => state.setField('voltage', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={120}>120 V (Monofásico)</option>
                <option value={208}>208 V (Bifásico/Trifásico)</option>
                <option value={240}>240 V (Bifásico Residencial)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Circuitos Pequeños Artefactos (1500VA c/u)</label>
              <input 
                type="number" 
                value={state.smallAppliances} 
                onChange={(e) => state.setField('smallAppliances', Number(e.target.value))}
                className="w-full p-2 border rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
                min="2"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={state.hasLaundry} 
                  onChange={(e) => state.setField('hasLaundry', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span>Circuito Lavado (1500VA)</span>
              </label>

              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={state.hasDishwasher} 
                  onChange={(e) => state.setField('hasDishwasher', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
                />
                <span>Lavavajillas (1500VA)</span>
              </label>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Aires Acondicionados</h3>
            <div className="flex flex-wrap gap-2">
              <input 
                placeholder="Nombre (ej. AA Alcoba)" 
                value={acName} onChange={e => setAcName(e.target.value)}
                className="flex-1 min-w-[140px] p-2 border rounded-md text-sm bg-background"
              />
              <select 
                className="p-2 border rounded-md text-sm bg-background min-w-[180px]"
                onChange={(e) => {
                  if(e.target.value) setAcPower(e.target.value);
                }}
                value=""
              >
                <option value="" disabled>BTU Comercial...</option>
                {AC_CAPACITIES.map(ac => (
                  <option key={ac.btu} value={ac.va}>{ac.label}</option>
                ))}
              </select>
              <input 
                type="number" 
                placeholder="VA" 
                value={acPower} onChange={e => setAcPower(e.target.value)}
                className="w-24 p-2 border rounded-md text-sm bg-background"
              />
              <button onClick={handleAddAC} className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 transition-transform">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {state.airConditioners.map(ac => (
              <div key={ac.id} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                <span>{ac.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{ac.powerVA} VA</span>
                  <button onClick={() => state.removeLoad('airConditioners', ac.id)} className="text-destructive hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
            <h3 className="text-lg font-semibold border-b pb-2">Cargas Especiales (Horno, Ducha)</h3>
            <div className="flex gap-2">
              <input 
                placeholder="Nombre (ej. Horno)" 
                value={specialName} onChange={e => setSpecialName(e.target.value)}
                className="flex-1 p-2 border rounded-md text-sm bg-background"
              />
              <input 
                type="number" 
                placeholder="VA" 
                value={specialPower} onChange={e => setSpecialPower(e.target.value)}
                className="w-24 p-2 border rounded-md text-sm bg-background"
              />
              <button onClick={handleAddSpecial} className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 active:scale-95 transition-transform">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {state.specialLoads.map(sp => (
              <div key={sp.id} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                <span>{sp.name}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{sp.powerVA} VA</span>
                  <button onClick={() => state.removeLoad('specialLoads', sp.id)} className="text-destructive hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!state.isCalculated && (
            <button 
              onClick={state.triggerCalculation}
              className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <Zap className="w-6 h-6 fill-current group-hover:scale-110 transition-transform duration-300" /> Calcular Demanda
            </button>
          )}
        </div>

        {/* Chart Column */}
        {state.isCalculated ? (
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold border-b pb-2">Desglose de Cargas NTC 2050</h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <h4 className="font-bold text-primary mb-2">1. Subtotal General (Alumbrado y Artefactos)</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alumbrado General (ATUG)</span>
                    <span className="font-medium">{res.atug} VA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pequeños Artefactos (PA)</span>
                    <span className="font-medium">{res.pa} VA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lavandería (LP)</span>
                    <span className="font-medium">{res.lp} VA</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                    <span>Subtotal 1 (Instalado)</span>
                    <span>{res.subtotal1} VA</span>
                  </div>
                  <div className="flex justify-between text-destructive font-bold pt-1">
                    <span>Subtotal 1 (Con Factor de Demanda)</span>
                    <span>{res.demandSubtotal1.toFixed(1)} VA</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">100% a primeros 3000 VA, 35% al excedente.</p>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border">
                  <h4 className="font-bold text-blue-600 mb-2">2. Subtotal Especial (AA y Motores)</h4>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aires Acondicionados</span>
                    <span className="font-medium">{res.acLoad} VA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cargas Especiales (Estufa, etc)</span>
                    <span className="font-medium">{res.specialLoad} VA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lavavajillas</span>
                    <span className="font-medium">{res.dishwasherLoad} VA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Factor Seguridad (25% mayor motor)</span>
                    <span className="font-medium">+{res.safetyFactor} VA</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-semibold text-blue-700">
                    <span>Subtotal 2 (Sin Factor Demanda)</span>
                    <span>{res.subtotal2.toFixed(1)} VA</span>
                  </div>
                </div>

                <div className="border-t-2 border-primary pt-3 mt-4 flex justify-between text-base font-black text-primary">
                  <span>Carga Total Demandada</span>
                  <span>{res.demandTotal.toFixed(1)} VA</span>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6 shadow-sm h-64 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <h3 className="text-sm font-semibold mb-4 text-center">Instalada vs Demandada</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip cursor={{fill: 'transparent'}} />
                  <Legend />
                  <Bar dataKey="value" radius={[4,4,0,0]} name="Potencia (VA)">
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#94a3b8' : '#2563eb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-card border rounded-lg border-dashed text-center p-8">
            <Zap className="w-16 h-16 text-muted-foreground/30 animate-pulse mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground mb-2">Esperando Datos</h3>
            <p className="text-muted-foreground">Ingrese los parámetros de la vivienda y presione <b>Calcular Demanda</b> para generar el modelo de cargas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
