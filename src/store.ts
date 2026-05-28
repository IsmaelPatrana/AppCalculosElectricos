import { create } from 'zustand';

export type LoadItem = {
  id: string;
  name: string;
  powerVA: number;
};

export interface ElectricalState {
  // Cargas Residenciales
  area: number;
  smallAppliances: number;
  hasLaundry: boolean;
  hasDishwasher: boolean;
  airConditioners: LoadItem[];
  specialLoads: LoadItem[];
  voltage: number;

  // Acometida
  temperature: number;

  // Regulación
  feederLength: number;
  powerFactor: number;
  feederMaterial: 'cobre' | 'aluminio';
  feederConduit: 'pvc' | 'metal';
  selectedAWG: string;

  // Actions
  isCalculated: boolean;
  setField: (field: keyof ElectricalState, value: unknown) => void;
  triggerCalculation: () => void;
  addLoad: (type: 'airConditioners' | 'specialLoads', load: LoadItem) => void;
  removeLoad: (type: 'airConditioners' | 'specialLoads', id: string) => void;
}

export const useStore = create<ElectricalState>((set) => ({
  area: 100,
  smallAppliances: 2,
  hasLaundry: true,
  hasDishwasher: false,
  airConditioners: [],
  specialLoads: [],
  voltage: 240,
  
  temperature: 30,
  
  feederLength: 20,
  powerFactor: 0.9,
  feederMaterial: 'cobre',
  feederConduit: 'pvc',
  selectedAWG: '12',

  isCalculated: false,
  
  setField: (field, value) => set((state) => ({ 
    ...state, 
    [field]: value,
    isCalculated: false // Resetear cálculos al cambiar un valor
  })),

  triggerCalculation: () => set((state) => ({
    ...state,
    isCalculated: true
  })),
  addLoad: (type, load) => set((state) => ({ ...state, [type]: [...state[type], load] })),
  removeLoad: (type, id) => set((state) => ({ ...state, [type]: state[type].filter(l => l.id !== id) })),
}));
