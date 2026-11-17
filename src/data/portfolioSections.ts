export interface ChamberConfig {
  index: string;
  id: 'summit' | 'drift' | 'iris' | 'pedestal';
  hudTitle: string;
  sectionTag: string;
  scrollAt: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
}

export const DETAILED_CHAMBERS: ChamberConfig[] = [
  {
    index: '01',
    id: 'summit',
    hudTitle: 'CH.01 // GENESIS',
    sectionTag: 'BLOCKCHAIN MONUMENT',
    scrollAt: 0.0,
    camPos: [0.0, 2.35, 11.4],
    camTarget: [0.0, 1.35, 0.0],
  },
  {
    index: '02',
    id: 'drift',
    hudTitle: 'CH.02 // ABOUT ME',
    sectionTag: 'NEURAL CORE',
    scrollAt: 0.36,
    camPos: [0.0, 1.56, 0.52],
    camTarget: [0.0, 1.55, 0.0],
  },
  {
    index: '03',
    id: 'iris',
    hudTitle: 'CH.03 // WORK',
    sectionTag: 'PROJECTS & EXPERIENCE',
    scrollAt: 0.72,
    camPos: [3.9, -20.8, 0.2],
    camTarget: [3.8, -24.0, -12.0],
  },
  {
    index: '04',
    id: 'pedestal',
    hudTitle: 'CH.04 // CONTACT',
    sectionTag: 'DIRECT UPLINK',
    scrollAt: 1.0,
    camPos: [0.0, -49.6, -3.0],
    camTarget: [0.0, -51.35, -12.0],
  },
];

