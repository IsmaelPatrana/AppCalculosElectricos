import type { ElectricalState } from '../store';

export const AWG_TABLE = [
  { awg: '14', ampacity: 15, area: 2.08, rl: 10.4, xl: 0.190 },
  { awg: '12', ampacity: 20, area: 3.31, rl: 6.56, xl: 0.177 },
  { awg: '10', ampacity: 30, area: 5.26, rl: 4.13, xl: 0.165 },
  { awg: '8', ampacity: 50, area: 8.37, rl: 2.61, xl: 0.155 },
  { awg: '6', ampacity: 65, area: 13.3, rl: 1.64, xl: 0.150 },
  { awg: '4', ampacity: 85, area: 21.2, rl: 1.04, xl: 0.140 },
  { awg: '2', ampacity: 115, area: 33.6, rl: 0.65, xl: 0.135 },
  { awg: '1/0', ampacity: 150, area: 53.5, rl: 0.39, xl: 0.144 },
];

export const TEMP_CORRECTION = [
  { temp: 30, factor: 1.00 },
  { temp: 35, factor: 0.94 },
  { temp: 40, factor: 0.88 },
  { temp: 45, factor: 0.82 },
];

export function getTempFactor(temp: number) {
  if (temp <= 30) return 1.00;
  if (temp <= 35) return 0.94;
  if (temp <= 40) return 0.88;
  return 0.82;
}

// NTC 2050 Tabla C9 aproximada para PVC Schedule 40 con THHN
const PVC_SCH40_THHN_FILL: Record<string, number[]> = {
  '14': [13, 24, 39, 69, 94, 154],
  '12': [10, 18, 29, 51, 70, 114],
  '10': [6, 11, 18, 32, 44, 73],
  '8': [3, 5, 9, 16, 22, 36],
  '6': [2, 4, 6, 11, 15, 26],
  '4': [1, 2, 4, 7, 10, 16],
  '2': [1, 1, 3, 5, 7, 12],
  '1/0': [1, 1, 2, 4, 5, 9]
};
const CONDUIT_SIZES = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"'];

function getConduitSize(awg: string, numConductors: number) {
  const row = PVC_SCH40_THHN_FILL[awg];
  if (!row) return 'No definido';
  for (let i = 0; i < row.length; i++) {
    if (numConductors <= row[i]) {
      return CONDUIT_SIZES[i];
    }
  }
  return '> 2"';
}

export function calculateDemand(state: ElectricalState) {
  // Subtotal 1 (ATUG + PA + LP)
  const atug = state.area * 32;
  const pa = state.smallAppliances * 1500;
  const lp = state.hasLaundry ? 1500 : 0;
  const subtotal1 = atug + pa + lp;
  
  let demandSubtotal1 = subtotal1;
  if (subtotal1 > 3000) {
    demandSubtotal1 = 3000 + (subtotal1 - 3000) * 0.35;
  }

  // Subtotal 2 (Especiales + AA)
  const dishwasherLoad = state.hasDishwasher ? 1500 : 0;
  const acLoad = state.airConditioners.reduce((acc, curr) => acc + curr.powerVA, 0);
  const specialLoad = state.specialLoads.reduce((acc, curr) => acc + curr.powerVA, 0);
  
  const allSpecialEquip = [...state.airConditioners, ...state.specialLoads];
  if (state.hasDishwasher) {
    allSpecialEquip.push({ id: 'dw', name: 'Lavavajillas', powerVA: 1500 });
  }

  let largestMotor = 0;
  if (allSpecialEquip.length > 0) {
    largestMotor = Math.max(...allSpecialEquip.map(eq => eq.powerVA));
  }
  
  const safetyFactor = largestMotor * 0.25;
  const subtotal2 = acLoad + specialLoad + dishwasherLoad + safetyFactor;

  const totalInstalled = subtotal1 + subtotal2 - safetyFactor;
  const demandTotal = demandSubtotal1 + subtotal2;

  return {
    atug,
    pa,
    lp,
    subtotal1,
    demandSubtotal1,
    acLoad,
    specialLoad,
    dishwasherLoad,
    largestMotor,
    safetyFactor,
    subtotal2,
    totalInstalled,
    demandTotal
  };
}

export function calculateAcometida(state: ElectricalState, resDemand: ReturnType<typeof calculateDemand>) {
  const iPhase = resDemand.demandTotal / state.voltage;
  
  // Phase AWG
  const tempFactor = getTempFactor(state.temperature);
  let selectedAwg = AWG_TABLE[AWG_TABLE.length - 1]; 
  
  for (const wire of AWG_TABLE) {
    const correctedAmpacity = wire.ampacity * tempFactor;
    if (correctedAmpacity >= iPhase) {
      selectedAwg = wire;
      break;
    }
  }

  const correctedAmpacity = selectedAwg.ampacity * tempFactor;
  const status = iPhase <= correctedAmpacity ? 'CUMPLE' : 'NO CUMPLE';

  // Neutro (Subtotal 1 FD + 0.7 * Subtotal 2)
  const sNeutro = resDemand.demandSubtotal1 + 0.7 * resDemand.subtotal2;
  const iNeutro = sNeutro / state.voltage;
  
  let selectedNeutroAwg = AWG_TABLE[AWG_TABLE.length - 1];
  for (const wire of AWG_TABLE) {
    if ((wire.ampacity * tempFactor) >= iNeutro) {
      selectedNeutroAwg = wire;
      break;
    }
  }

  // Conduit Size
  // Fases (1 para 120V, 2 para bifásico, 3 para trifásico)
  // Para fines residenciales en Colombia (240V split-phase = 2 Fases + 1 Neutro) (120V = 1 Fase + 1 Neutro)
  const activePhases = state.voltage === 120 ? 1 : 2; 
  const numConductors = activePhases + 1 /* neutro */ + 1 /* tierra */; 
  const conduitSize = getConduitSize(selectedAwg.awg, numConductors);

  return {
    iPhase,
    tempFactor,
    selectedAwg,
    correctedAmpacity,
    status,
    sNeutro,
    iNeutro,
    selectedNeutroAwg,
    numConductors,
    conduitSize
  };
}

export function calculateRegulation(state: ElectricalState, iPhase: number, awgStr: string) {
  const wire = AWG_TABLE.find(w => w.awg === awgStr) || AWG_TABLE[1];
  const theta = Math.acos(state.powerFactor);
  const rl = state.feederMaterial === 'aluminio' ? wire.rl * 1.63 : wire.rl;
  const xl = wire.xl;
  const zef = rl * Math.cos(theta) + xl * Math.sin(theta);
  const L_km = state.feederLength / 1000;
  const deltaV = zef * 2 * L_km * iPhase;
  const regulationPercent = (deltaV / state.voltage) * 100;
  
  return {
    zef,
    deltaV,
    regulationPercent,
    statusRamal: regulationPercent <= 3 ? 'CUMPLE' : 'NO CUMPLE',
    statusTotal: regulationPercent <= 5 ? 'CUMPLE' : 'NO CUMPLE'
  };
}

export function calculateCircuits(iPhase: number) {
  return Math.ceil(iPhase / 15);
}
