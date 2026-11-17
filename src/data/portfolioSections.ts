export interface ChamberConfig {
  index: string;
  id: 'summit' | 'drift' | 'iris' | 'pedestal';
  hudTitle: string;
  sectionTag: string;
  actionLabel: string;
  scrollAt: number;
  chamberY: number;
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
    hudTitle: 'OBSIDIAN LATTICE · CH.01',
    sectionTag: 'SUMMIT // IDENTITY & ABOUT',
    actionLabel: 'INSPECT // ABOUT ME',
    scrollAt: 0.0,
    chamberY: 0,
    camPos: [0, 2.1, 10.6],
    camTarget: [0, 0.75, 0],
    calloutOffsets: {
      primary: [2.5, 2.35, 0.6],
      secondary: [-2.6, 0.6, 0.9],
    },
    calloutPrimaryTitle: 'ALEX MERCER // NODE_00',
    calloutPrimarySub: 'SYSTEMS & AI ARCHITECT · CLICK TO INSPECT',
    calloutSecondaryTitle: 'BASALT LATTICE CORE',
    calloutSecondarySub: '27 OBSIDIAN BLOCKS · PURE CYAN CORTEX',
  },
  {
    index: '02',
    id: 'drift',
    hudTitle: 'THE DRIFT · CH.02',
    sectionTag: 'CRYSTAL MATRIX // PROJECTS & EXPERIENCE',
    actionLabel: 'INSPECT // PROJECTS',
    scrollAt: 0.34,
    chamberY: -28,
    camPos: [0.3, -27.2, 8.6],
    camTarget: [0, -28.0, 0],
    calloutOffsets: {
      primary: [1.9, -26.5, 0.5],
      secondary: [-2.2, -29.0, 0.4],
    },
    calloutPrimaryTitle: 'PORTFOLIO_CH_02 // PROJECTS',
    calloutPrimarySub: 'SYSTEM ARCHITECTURE · CLICK TO EXPAND',
    calloutSecondaryTitle: 'EXPERIENCE TIMELINE',
    calloutSecondarySub: '3 ROLES INDEXED · DISTRIBUTED AI',
  },
  {
    index: '03',
    id: 'iris',
    hudTitle: 'THE IRIS · CH.03',
    sectionTag: 'BASALT CANYON // PORTAL TRANSIT',
    actionLabel: 'INSPECT // EXPERIENCE',
    scrollAt: 0.62,
    chamberY: -56,
    camPos: [0.0, -50.8, 7.6],
    camTarget: [0.0, -56.0, 0.0],
    calloutOffsets: {
      primary: [2.5, -54.8, 0.6],
      secondary: [-2.5, -56.6, 0.5],
    },
    calloutPrimaryTitle: 'CONSENSUS IRIS // GATE_03',
    calloutPrimarySub: 'SCROLL TO TRANSIT PORTAL CORE',
    calloutSecondaryTitle: 'EXPERIENCE ARCHIVE',
    calloutSecondarySub: 'STAFF DISTRIBUTED SYSTEMS · CLICK',
  },
  {
    index: '04',
    id: 'pedestal',
    hudTitle: 'THE PEDESTAL · CH.04',
    sectionTag: 'CONNECTION // BLOCKCHAIN STAGE',
    actionLabel: 'OPEN CONTACT TERMINAL',
    scrollAt: 1.0,
    chamberY: -84,
    camPos: [0.0, -81.9, 8.4],
    camTarget: [0.0, -83.4, 0.0],
    calloutOffsets: {
      primary: [2.4, -82.1, 0.5],
      secondary: [-2.4, -84.0, 0.6],
    },
    calloutPrimaryTitle: 'CONNECT // CHANNEL_04',
    calloutPrimarySub: 'DIRECT UPLINK & SOCIAL NODES',
    calloutSecondaryTitle: 'MORPHING LEDGER',
    calloutSecondarySub: '2200 PARTICLES · INTERACTIVE STAGE',
  },
];

export const PLACEHOLDER_PORTFOLIO = {
  name: 'Alex Mercer',
  role: 'Applied AI & Distributed Systems Engineer',
  manifesto:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Engineering neural inference pipelines, decentralized consensus lattices, and tactile spatial interfaces.',
  email: 'hello@alexmercer.example',
  location: 'San Francisco · Remote Worldwide',
  about: {
    headline: 'Obsidian Architecture & Neural Consensus',
    summary:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    capabilities: [
      { label: 'NEURAL RUNTIME', value: 'PyTorch · CUDA · TensorRT · Quantization' },
      { label: 'PROTOCOL MESH', value: 'Rust · libp2p · Zero-Knowledge · Consensus' },
      { label: 'SPATIAL WEBGL', value: 'Three.js · GLSL · WebGPU · Procedural Geo' },
    ],
  },
  experience: [
    {
      period: '2024 — PRESENT',
      role: 'Staff Distributed Systems Engineer',
      company: 'Lorem Lattice Labs',
      detail:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Reduced cross-node state finality latency by 42% across 180+ validator clusters.',
      stack: 'Rust · TypeScript · WebGL · libp2p',
    },
    {
      period: '2021 — 2024',
      role: 'Senior ML Infrastructure Engineer',
      company: 'Ipsum Neural Core',
      detail:
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Built deterministic embedding retrieval serving 14M+ queries daily.',
      stack: 'Python · PyTorch · C++ · CUDA',
    },
    {
      period: '2019 — 2021',
      role: 'Creative Technologist',
      company: 'Dolor Spatial Studio',
      detail:
        'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Shipped real-time 3D WebGL systems maintaining 60fps.',
      stack: 'Three.js · GLSL · React · WebAudio',
    },
  ],
  projects: [
    {
      id: 'SYNAPSE_CHAIN',
      title: 'SynapseChain Runtime',
      category: 'DISTRIBUTED AI',
      year: '2026',
      latency: '1.2ms',
      throughput: '125,000 req/sec',
      efficiency: '99.9%',
      summary:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Verifiable quantized neural inference routed across decentralized peer nodes.',
      stack: 'Rust / WebGL / CUDA / Solidity',
    },
    {
      id: 'OBSIDIAN_MESH',
      title: 'Obsidian Mesh Explorer',
      category: 'SPATIAL TELEMETRY',
      year: '2025',
      latency: '0.8ms',
      throughput: '60fps @ 25k edges',
      efficiency: '99.7%',
      summary:
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur in real-time 3D.',
      stack: 'Three.js / GLSL / TypeScript / WebSockets',
    },
    {
      id: 'PRISM_CONSENSUS',
      title: 'Consensus Prism SDK',
      category: 'PROTOCOL ENGINE',
      year: '2024',
      latency: '18ms finality',
      throughput: '42,000 tx/sec',
      efficiency: '99.98%',
      summary:
        'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      stack: 'Go / gRPC / Protobuf / Rust',
    },
  ],
};
