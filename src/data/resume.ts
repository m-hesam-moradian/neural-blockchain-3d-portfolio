/**
 * ============================================================================
 * SINGLE-FILE RESUME & PORTFOLIO CONFIGURATION
 * ============================================================================
 * Edit ONLY this file to update all personal info, bio, portrait photo,
 * projects, experience, and contact details across the entire 3D website.
 *
 * HOW TO ADD YOUR FACE IMAGE:
 * 1. Place your image inside the `/public/` folder (e.g. `/public/profile.jpg`)
 * 2. Set `avatarUrl: '/profile.jpg'` below (or paste an image URL).
 *    Leave `avatarUrl: ''` to display the procedural cyan wireframe hologram.
 * ============================================================================
 */

export interface ResumeCapability {
  code: string;
  label: string;
  value: string;
}

export interface ResumeProject {
  id: string;
  title: string;
  category: string;
  year: string;
  latency: string;
  throughput: string;
  efficiency: string;
  summary: string;
  stack: string;
}

export interface ResumeExperience {
  period: string;
  role: string;
  company: string;
  detail: string;
  stack: string;
}

export interface ResumeTelemetryRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ResumeData {
  identity: {
    name: string;
    role: string;
    manifesto: string;
    location: string;
    availability: string;
    avatarUrl: string;
    avatarCaption: string;
    email: string;
    githubUrl: string;
    linkedinUrl: string;
  };
  about: {
    headline: string;
    summary: string;
    telemetry: ResumeTelemetryRow[];
    capabilities: ResumeCapability[];
  };
  projects: ResumeProject[];
  experience: ResumeExperience[];
}

export const RESUME_DATA: ResumeData = {
  identity: {
    name: 'Alex Mercer',
    role: 'Applied AI & Distributed Systems Engineer',
    manifesto:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Engineering neural inference pipelines, decentralized consensus lattices, and tactile spatial interfaces.',
    location: 'San Francisco · Remote Worldwide',
    availability: 'OPEN FOR ARCHITECT / STAFF ROLES',
    avatarUrl: '', // Drop photo in /public/profile.jpg and set '/profile.jpg'
    avatarCaption: 'SUBJECT_01 // BIOMETRIC_MESH',
    email: 'hello@alexmercer.example',
    githubUrl: 'https://github.com/m-hesam-moradian',
    linkedinUrl: 'https://linkedin.com',
  },
  about: {
    headline: 'Obsidian Architecture & Neural Consensus',
    summary:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    telemetry: [
      { label: 'CLEARANCE', value: 'STAFF SYSTEMS ARCH', highlight: true },
      { label: 'LOCATION', value: 'SF / REMOTE GLOBAL' },
      { label: 'RUNTIME', value: 'AI + WEB3 + WEBGL' },
      { label: 'UPTIME', value: '99.98% PRODUCTION' },
    ],
    capabilities: [
      {
        code: 'SYS_01',
        label: 'NEURAL RUNTIME',
        value: 'PyTorch · CUDA · TensorRT · Quantization',
      },
      {
        code: 'SYS_02',
        label: 'PROTOCOL MESH',
        value: 'Rust · libp2p · Zero-Knowledge · Consensus',
      },
      {
        code: 'SYS_03',
        label: 'SPATIAL WEBGL',
        value: 'Three.js · GLSL · WebGPU · Procedural Geo',
      },
    ],
  },
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
};
