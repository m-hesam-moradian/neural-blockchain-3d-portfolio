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
    sectionTag: 'BLOCKCHAIN // IDENTITY & ABOUT',
    actionLabel: 'INSPECT // ABOUT ME',
    scrollAt: 0.0,
    camPos: [0.0, 2.35, 11.4],
    camTarget: [0.0, 1.35, 0.0],
    calloutOffsets: {
      primary: [2.75, 2.85, 0.4],
      secondary: [-2.95, 1.25, 0.8],
    },
    calloutPrimaryTitle: 'BLOCK_SELECTED // ENTER',
    calloutPrimarySub: '28 CHAINED 0/1 BLOCKS · INSPECT',
    calloutSecondaryTitle: 'RANDOM BLOCK LOCK',
    calloutSecondarySub: 'SLOW EXPLOSION · INSIDE BLOCK',
  },
  {
    index: '02',
    id: 'drift',
    hudTitle: 'DEEP NEURAL NET · CH.02',
    sectionTag: 'INSIDE CHOSEN BLOCK // PROJECTS',
    actionLabel: 'EXPLODE CASE STUDY',
    scrollAt: 0.36,
    camPos: [0.0, 1.56, 0.52],
    camTarget: [0.0, 1.55, 0.0],
    calloutOffsets: {
      primary: [0.05, 1.43, -0.02],
      secondary: [-0.19, 1.67, 0.0],
    },
    calloutPrimaryTitle: 'NEURON_0x0A // a=0.96',
    calloutPrimarySub: 'EXPLODE CASE STUDY · ENTER NEURON',
    calloutSecondaryTitle: '31 ROUND NEURONS · 5 LAYERS',
    calloutSecondarySub: 'WEIGHTS w & ENERGY PATHS ACTIVE',
  },
  {
    index: '03',
    id: 'iris',
    hudTitle: 'THE IRIS · CH.03',
    sectionTag: 'BASALT CANYON // EXPERIENCE',
    actionLabel: 'INSPECT // EXPERIENCE',
    scrollAt: 0.68,
    camPos: [0.0, -14.8, -6.0],
    camTarget: [0.0, -24.0, -12.0],
    calloutOffsets: {
      primary: [2.6, -21.8, -11.6],
      secondary: [-2.6, -23.5, -11.8],
    },
    calloutPrimaryTitle: 'CONSENSUS IRIS // GATE_03',
    calloutPrimarySub: 'SCROLL TO TRANSIT PORTAL CORE',
    calloutSecondaryTitle: 'EXPERIENCE ARCHIVE',
    calloutSecondarySub: 'STAFF DISTRIBUTED SYSTEMS',
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

