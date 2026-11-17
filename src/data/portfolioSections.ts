export interface ChamberConfig {
  index: string;
  id: 'summit' | 'drift' | 'iris' | 'pedestal';
  hudTitle: string;
  sectionTag: string;
  actionLabel: string;
  scrollAt: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  calloutOffsets: {
    primary: [number, number, number];
    secondary: [number, number, number];
  };
  calloutPrimaryTitle: string;
  calloutPrimarySub: string;
  calloutSecondaryTitle: string;
  calloutSecondarySub: string;
}

export const DETAILED_CHAMBERS: ChamberConfig[] = [
  {
    index: '01',
    id: 'summit',
    hudTitle: 'BINARY LEDGER · CH.01',
    sectionTag: 'BLOCKCHAIN // GENESIS MONUMENT',
    actionLabel: 'INSPECT // ABOUT ME',
    scrollAt: 0.0,
    camPos: [0.0, 2.35, 11.4],
    camTarget: [0.0, 1.35, 0.0],
    calloutOffsets: {
      primary: [2.75, 2.85, 0.4],
      secondary: [-2.95, 1.25, 0.8],
    },
    calloutPrimaryTitle: 'BLOCK_SELECTED // ENTER',
    calloutPrimarySub: '28 CHAINED 0/1 BLOCKS · SCROLL TO ENTER',
    calloutSecondaryTitle: 'RANDOM BLOCK LOCK',
    calloutSecondarySub: 'SLOW EXPLOSION · INSIDE BLOCK',
  },
  {
    index: '02',
    id: 'drift',
    hudTitle: 'NEURAL CORE · CH.02',
    sectionTag: 'ABOUT ME // INSIDE CHOSEN BLOCK',
    actionLabel: 'INSPECT // ABOUT ME',
    scrollAt: 0.34,
    camPos: [0.0, 1.56, 0.52],
    camTarget: [0.0, 1.55, 0.0],
    calloutOffsets: {
      primary: [0.05, 1.43, -0.02],
      secondary: [-0.19, 1.67, 0.0],
    },
    calloutPrimaryTitle: 'NEURON_0x0A // a=0.96',
    calloutPrimarySub: 'ABOUT ME · SCROLL TO DIVE NEXT SCENE',
    calloutSecondaryTitle: '31 ROUND NEURONS · 5 LAYERS',
    calloutSecondarySub: 'WEIGHTS w & ENERGY PATHS ACTIVE',
  },
  {
    index: '03',
    id: 'iris',
    hudTitle: 'THE IRIS · CH.03',
    sectionTag: 'BASALT CANYON // PROJECTS & CAREER',
    actionLabel: 'INSPECT // PROJECTS & CAREER',
    scrollAt: 0.68,
    camPos: [0.0, -14.8, -6.0],
    camTarget: [0.0, -24.0, -12.0],
    calloutOffsets: {
      primary: [2.6, -21.8, -11.6],
      secondary: [-2.6, -23.5, -11.8],
    },
    calloutPrimaryTitle: 'CONSENSUS IRIS // GATE_03',
    calloutPrimarySub: 'PROJECTS & EXPERIENCE ARCHIVE',
    calloutSecondaryTitle: 'WORK ARCHIVE',
    calloutSecondarySub: 'SYSTEMS · AI · DISTRIBUTED MESH',
  },
  {
    index: '04',
    id: 'pedestal',
    hudTitle: 'THE PEDESTAL · CH.04',
    sectionTag: 'CONNECTION // BLOCKCHAIN STAGE',
    actionLabel: 'OPEN CONTACT TERMINAL',
    scrollAt: 1.0,
    camPos: [0.0, -49.6, -3.0],
    camTarget: [0.0, -51.35, -12.0],
    calloutOffsets: {
      primary: [2.45, -50.1, -11.5],
      secondary: [-2.55, -51.8, -11.4],
    },
    calloutPrimaryTitle: 'CONNECT // CHANNEL_04',
    calloutPrimarySub: 'DIRECT UPLINK & SOCIAL NODES',
    calloutSecondaryTitle: 'MORPHING LEDGER',
    calloutSecondarySub: '2200 PARTICLES · INTERACTIVE STAGE',
  },
];

