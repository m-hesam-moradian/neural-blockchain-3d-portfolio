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

export interface ResumeKeySkill {
  name: string;
  color: string; // Hex accent color for the orbiting planet & helical ribbon trail
}

export interface ResumeStageFigureInfo {
  label: string;
  title: string;
  description: string;
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
    phone: string;
    githubHandle: string;
    githubUrl: string;
    linkedinHandle: string;
    linkedinUrl: string;
  };
  about: {
    headline: string;
    summary: string;
    telemetry: ResumeTelemetryRow[];
    capabilities: ResumeCapability[];
  };
  /** Dynamic key skills rendered as orbiting planets in CH.03 (count & colors auto-adapt) */
  keySkills: ResumeKeySkill[];
  /** Descriptive captions for the 4 contact-linked 3D figures on the CH.04 Pedestal */
  stageFigures: {
    email: ResumeStageFigureInfo;
    github: ResumeStageFigureInfo;
    linkedin: ResumeStageFigureInfo;
    contact: ResumeStageFigureInfo;
  };
  projects: ResumeProject[];
  experience: ResumeExperience[];
}

export const RESUME_DATA: ResumeData = {
  identity: {
    name: 'Alex Mercer',
    role: 'Applied AI & Distributed Systems Engineer',
    manifesto: 'Neural inference pipelines & decentralized consensus architectures.',
    location: 'San Francisco · Remote',
    availability: 'Open for Roles',
    avatarUrl: '', // Drop photo in /public/profile.jpg and set '/profile.jpg'
    avatarCaption: 'ID_01',
    email: 'hello@alexmercer.example',
    phone: '+1 (415) 555-0194',
    githubHandle: '@m-hesam-moradian',
    githubUrl: 'https://github.com/m-hesam-moradian',
    linkedinHandle: 'in/alex-mercer-systems',
    linkedinUrl: 'https://linkedin.com',
  },
  about: {
    headline: 'Obsidian Architecture & Neural Consensus',
    summary:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Building low-latency quantized inference engines, zero-knowledge consensus protocols, and real-time 3D WebGL systems.',
    telemetry: [
      { label: 'LEVEL', value: 'STAFF ARCHITECT', highlight: true },
      { label: 'FOCUS', value: 'AI + WEB3 + WEBGL' },
      { label: 'UPTIME', value: '99.98% PROD' },
    ],
    capabilities: [
      {
        code: '01',
        label: 'NEURAL RUNTIME',
        value: 'PyTorch · CUDA · TensorRT',
      },
      {
        code: '02',
        label: 'PROTOCOL MESH',
        value: 'Rust · libp2p · ZK-Consensus',
      },
      {
        code: '03',
        label: 'SPATIAL WEBGL',
        value: 'Three.js · GLSL · WebGPU',
      },
    ],
  },
  keySkills: [
    { name: 'AI / PyTorch', color: '#00FFFF' },
    { name: 'Rust Systems', color: '#D8FFFF' },
    { name: 'Three.js / GLSL', color: '#00D4E8' },
    { name: 'ZK Consensus', color: '#8A929A' },
    { name: 'CUDA Inference', color: '#00FFFF' },
    { name: 'TypeScript', color: '#FFFFFF' },
  ],
  stageFigures: {
    email: {
      label: 'Email',
      title: 'Direct Email',
      description: 'Send inquiries, architecture briefs, or role opportunities directly via email.',
    },
    github: {
      label: 'GitHub',
      title: 'GitHub Repositories',
      description: 'Explore open-source AI runtimes, distributed consensus protocols, and WebGL tools.',
    },
    linkedin: {
      label: 'LinkedIn',
      title: 'LinkedIn Profile',
      description: 'Connect for engineering leadership, advisory roles, and systems architecture.',
    },
    contact: {
      label: 'Phone & Form',
      title: 'Phone & Direct Message',
      description: 'Reach out directly by phone or send an instant message from this stage.',
    },
  },
  projects: [
    {
      id: 'SYNAPSE_CHAIN',
      title: 'SynapseChain Runtime',
      category: 'DISTRIBUTED AI',
      year: '2026',
      latency: '1.2ms',
      throughput: '125k req/s',
      efficiency: '99.9%',
      summary: 'Verifiable quantized neural inference across decentralized peer nodes.',
      stack: 'Rust · WebGL · CUDA',
    },
    {
      id: 'OBSIDIAN_MESH',
      title: 'Obsidian Mesh Explorer',
      category: 'SPATIAL TELEMETRY',
      year: '2025',
      latency: '0.8ms',
      throughput: '60fps @ 25k',
      efficiency: '99.7%',
      summary: 'Real-time 3D WebGL telemetry visualizer for high-throughput graphs.',
      stack: 'Three.js · GLSL · TS',
    },
    {
      id: 'PRISM_CONSENSUS',
      title: 'Consensus Prism SDK',
      category: 'PROTOCOL ENGINE',
      year: '2024',
      latency: '18ms',
      throughput: '42k tx/s',
      efficiency: '99.98%',
      summary: 'Deterministic state finality toolkit for multi-region validator clusters.',
      stack: 'Go · gRPC · Rust',
    },
  ],
  experience: [
    {
      period: '2024 — NOW',
      role: 'Staff Systems Engineer',
      company: 'Lorem Lattice Labs',
      detail: 'Cut cross-node finality latency 42% across 180+ validator clusters.',
      stack: 'Rust · TS · WebGL',
    },
    {
      period: '2021 — 2024',
      role: 'Senior ML Infra Engineer',
      company: 'Ipsum Neural Core',
      detail: 'Built deterministic embedding retrieval serving 14M+ daily queries.',
      stack: 'Python · PyTorch · CUDA',
    },
    {
      period: '2019 — 2021',
      role: 'Creative Technologist',
      company: 'Dolor Spatial Studio',
      detail: 'Shipped interactive 60fps 3D spatial interfaces and GPU shaders.',
      stack: 'Three.js · GLSL · React',
    },
  ],
};
