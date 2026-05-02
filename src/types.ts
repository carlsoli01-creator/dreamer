export type Side = 'north' | 'south' | 'east' | 'west';

export interface Door {
  position: Side;
  width: number;
  locked?: boolean;
  type?: string;
  open?: boolean;
  roofAccess?: boolean;
}

export interface Room {
  name: string;
  floor: number;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  doors?: Door[];
  features?: string[];
  soundSurface?: string;
  cover?: string[];
  ambientNoise?: number;
  tacticalValue?: 'low' | 'medium' | 'high' | 'very_high';
  lighting?: string;
  sightlines?: string[];
  exposed?: boolean;
  hazard?: string;
  layout?: string;
  interactive?: string;
  openSpace?: boolean;
  escapeRoute?: boolean;
}

export interface Stairwell {
  name: string;
  position: { x: number; z: number };
  floors: number[];
  width: number;
  soundSurface: string;
  lighting: string;
}

export interface Ladder {
  name: string;
  position: { x: number; z: number };
  floors: number[];
  width: number;
  climbSpeed: number;
  soundLevel: number;
}

export interface Building {
  id: string;
  name: string;
  position: { x: number; z: number };
  dimensions: { width: number; depth: number; height: number };
  floors: number;
  material: string;
  rooms: Room[];
  stairwells?: Stairwell[];
  ladders?: Ladder[];
}

export interface OutdoorZone {
  name: string;
  position: { x: number; z: number };
  size: { width: number; depth: number };
  surface: string;
  features?: string[];
  lighting?: string;
  cover?: string[];
  soundSurface?: string;
  tacticalValue?: string;
  soundModifier?: number;
  hazard?: string;
  viewBelow?: string;
  footprintDuration?: number;
}

export interface ExtractionZone {
  name: string;
  position: { x: number; z: number };
  radius: number;
  type: 'primary' | 'secondary';
  cover: string;
  risk: 'low' | 'medium' | 'high' | 'very_high';
  features?: string[];
}

export interface SoundTrap {
  position: { x: number; z: number };
  type: string;
  radius: number;
  soundLevel: number;
}

export interface SpawnPoints {
  prey: { x: number; z: number; facing: string };
  hunter: { x: number; z: number; facing: string };
}

export interface BoundaryWall {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface MapData {
  id: string;
  name: string;
  theme: string;
  description: string;
  size: { width: number; depth: number };
  ambience: string;
  soundModifier: number;
  weatherEffect?: string;
  platformHeight?: number;
  palette: {
    sky: string;
    fog: string;
    ground: string;
    wall: string;
    accent: string;
    light: string;
    fogNear: number;
    fogFar: number;
  };
  boundary: {
    type: string;
    height: number;
    thickness: number;
    material: string;
    positions: BoundaryWall[];
    dropOff?: boolean;
  };
  buildings: Building[];
  outdoorZones: OutdoorZone[];
  spawnPoints: SpawnPoints;
  extractionZones: ExtractionZone[];
  soundTraps?: SoundTrap[];
  environmentalMechanics?: Record<string, any>;
}
