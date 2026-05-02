import { MapData } from '../types';

// Per-map color palettes drive lighting / fog / materials in the renderer.
const palettes = {
  dead_signal: {
    sky: '#05060a',
    fog: '#080a0e',
    ground: '#14171c',
    wall: '#1c2026',
    accent: '#ff3b3b',
    light: '#ffd0a0',
    fogNear: 18,
    fogFar: 90,
  },
  white_hollow: {
    sky: '#9eaab9',
    fog: '#c4ccd8',
    ground: '#dfe6ee',
    wall: '#3a2f24',
    accent: '#6ae3ff',
    light: '#c8d8ee',
    fogNear: 12,
    fogFar: 60,
  },
  black_array: {
    sky: '#02030a',
    fog: '#05060a',
    ground: '#161a20',
    wall: '#0e1015',
    accent: '#ff3b3b',
    light: '#6ae3ff',
    fogNear: 20,
    fogFar: 110,
  },
};

export const NOISLESS_MAPS: Record<string, MapData> = {
  // ==================== MAP 1: DEAD SIGNAL ====================
  dead_signal: {
    id: 'dead_signal',
    name: 'DEAD SIGNAL',
    theme: 'Abandoned Communications Facility',
    description: 'Echo-heavy environment with metal surfaces amplifying footsteps',
    size: { width: 100, depth: 100 },
    ambience: 'Harsh industrial lighting, exposed wiring, metallic clangs',
    soundModifier: 1.3,
    palette: palettes.dead_signal,

    boundary: {
      type: 'concrete_barrier',
      height: 8,
      thickness: 2,
      material: 'reinforced_concrete',
      positions: [
        { x: 0, z: 0, width: 100, depth: 2 },
        { x: 0, z: 98, width: 100, depth: 2 },
        { x: 0, z: 0, width: 2, depth: 100 },
        { x: 98, z: 0, width: 2, depth: 100 },
      ],
    },

    buildings: [
      {
        id: 'main_tower',
        name: 'Communications Tower',
        position: { x: 35, z: 30 },
        dimensions: { width: 26, depth: 22, height: 15 },
        floors: 3,
        material: 'concrete_steel',
        rooms: [
          {
            name: 'Entrance Lobby', floor: 0,
            position: { x: 30, z: 30 }, size: { width: 10, depth: 8 },
            doors: [{ position: 'south', width: 2 }, { position: 'north', width: 1.5 }],
            features: ['broken_reception_desk', 'flickering_overhead_lights'],
            soundSurface: 'tile', lighting: 'flickering',
            tacticalValue: 'medium',
          },
          {
            name: 'Server Room', floor: 0,
            position: { x: 42, z: 30 }, size: { width: 8, depth: 12 },
            doors: [{ position: 'west', width: 1.5 }],
            features: ['humming_servers', 'cable_tangles'],
            soundSurface: 'raised_floor',
            ambientNoise: 0.4, lighting: 'cyan_blink',
          },
          {
            name: 'Security Station', floor: 0,
            position: { x: 30, z: 42 }, size: { width: 8, depth: 8 },
            doors: [{ position: 'south', width: 1.5 }],
            features: ['broken_monitors', 'security_locker'],
            soundSurface: 'carpet', tacticalValue: 'high',
          },
          {
            name: 'Control Room', floor: 1,
            position: { x: 30, z: 30 }, size: { width: 15, depth: 10 },
            doors: [{ position: 'east', width: 1.5 }],
            features: ['large_window', 'defunct_control_panels'],
            soundSurface: 'metal_grating',
            tacticalValue: 'very_high', sightlines: ['courtyard', 'entrance'],
            lighting: 'emergency',
          },
          {
            name: 'Storage Closet', floor: 1,
            position: { x: 46, z: 32 }, size: { width: 4, depth: 6 },
            doors: [{ position: 'west', width: 1 }],
            features: ['shelving'], soundSurface: 'concrete',
            tacticalValue: 'high',
          },
          {
            name: 'Antenna Platform', floor: 2,
            position: { x: 35, z: 35 }, size: { width: 10, depth: 10 },
            doors: [{ position: 'south', width: 1, roofAccess: true }],
            features: ['massive_antenna_array', 'weather_equipment'],
            soundSurface: 'metal_mesh',
            exposed: true, tacticalValue: 'medium',
          },
        ],
        stairwells: [
          { name: 'Main Stairwell', position: { x: 38, z: 38 }, floors: [0, 1, 2], width: 3, soundSurface: 'concrete_stairs', lighting: 'emergency_only' },
        ],
      },

      {
        id: 'warehouse_east',
        name: 'Equipment Warehouse',
        position: { x: 70, z: 38 },
        dimensions: { width: 25, depth: 38, height: 8 },
        floors: 1,
        material: 'corrugated_metal',
        rooms: [
          {
            name: 'Main Storage Bay', floor: 0,
            position: { x: 70, z: 30 }, size: { width: 22, depth: 26 },
            doors: [{ position: 'west', width: 5, type: 'rolling_door' }, { position: 'north', width: 1.5 }],
            features: ['industrial_shelving_units', 'forklifts', 'pallets_of_crates'],
            soundSurface: 'concrete', tacticalValue: 'medium',
          },
          {
            name: 'Loading Dock', floor: 0,
            position: { x: 70, z: 50 }, size: { width: 15, depth: 8 },
            doors: [{ position: 'south', width: 4, type: 'garage_door', open: true }],
            features: ['loading_platform', 'abandoned_truck'],
            soundSurface: 'asphalt', escapeRoute: true,
          },
        ],
      },

      {
        id: 'generator_bunker',
        name: 'Generator Bunker',
        position: { x: 17, z: 70 },
        dimensions: { width: 12, depth: 15, height: 6 },
        floors: 1,
        material: 'reinforced_concrete',
        rooms: [
          {
            name: 'Generator Room', floor: 0,
            position: { x: 17, z: 70 }, size: { width: 12, depth: 15 },
            doors: [{ position: 'north', width: 1.5, type: 'heavy_door' }],
            features: ['massive_diesel_generator', 'fuel_tanks'],
            soundSurface: 'metal_floor',
            ambientNoise: 0.7, tacticalValue: 'high', lighting: 'amber',
            hazard: 'limited_visibility',
          },
        ],
      },

      {
        id: 'admin_building',
        name: 'Administration Building',
        position: { x: 65, z: 75 },
        dimensions: { width: 18, depth: 22, height: 7 },
        floors: 2,
        material: 'brick_concrete',
        rooms: [
          {
            name: 'Hallway', floor: 0,
            position: { x: 60, z: 75 }, size: { width: 3, depth: 18 },
            features: ['flickering_fluorescents', 'bulletin_boards'],
            soundSurface: 'linoleum', lighting: 'flickering',
          },
          {
            name: 'Office 1', floor: 0,
            position: { x: 65, z: 70 }, size: { width: 7, depth: 6 },
            doors: [{ position: 'west', width: 1 }],
            features: ['desks', 'filing_cabinets'], soundSurface: 'carpet',
          },
          {
            name: 'Office 2', floor: 0,
            position: { x: 65, z: 80 }, size: { width: 7, depth: 6 },
            doors: [{ position: 'west', width: 1 }],
            features: ['desks', 'filing_cabinets'], soundSurface: 'carpet',
          },
          {
            name: 'Break Room', floor: 0,
            position: { x: 73, z: 75 }, size: { width: 6, depth: 10 },
            doors: [{ position: 'west', width: 1 }],
            features: ['tables', 'vending_machines'], soundSurface: 'tile',
          },
          {
            name: "Manager's Office", floor: 1,
            position: { x: 65, z: 75 }, size: { width: 10, depth: 12 },
            doors: [{ position: 'west', width: 1 }],
            features: ['large_desk', 'bookshelf'],
            soundSurface: 'hardwood', tacticalValue: 'medium',
            sightlines: ['courtyard', 'main_entrance'],
          },
        ],
        stairwells: [
          { name: 'Office Stairs', position: { x: 62, z: 84 }, floors: [0, 1], width: 2, soundSurface: 'wooden_stairs', lighting: 'dim' },
        ],
      },
    ],

    outdoorZones: [
      {
        name: 'Central Courtyard',
        position: { x: 50, z: 55 }, size: { width: 24, depth: 20 },
        surface: 'cracked_asphalt',
        features: ['overgrown_planters', 'broken_fountain', 'rusted_benches'],
        lighting: 'overhead_floodlights', tacticalValue: 'low',
        soundModifier: 0.8,
      },
      {
        name: 'Northern Perimeter',
        position: { x: 50, z: 12 }, size: { width: 60, depth: 12 },
        surface: 'gravel',
        features: ['chain_link_fence_sections', 'spotlight_towers'],
        lighting: 'minimal', soundSurface: 'gravel', tacticalValue: 'medium',
      },
      {
        name: 'Parking Lot',
        position: { x: 18, z: 50 }, size: { width: 14, depth: 22 },
        surface: 'asphalt',
        features: ['abandoned_vehicles', 'light_posts'],
        lighting: 'streetlights', tacticalValue: 'medium',
      },
    ],

    spawnPoints: {
      prey: { x: 25, z: 25, facing: 'east' },
      hunter: { x: 78, z: 78, facing: 'west' },
    },

    extractionZones: [
      { name: 'Helipad', position: { x: 88, z: 12 }, radius: 4, type: 'primary', cover: 'minimal', risk: 'high' },
      { name: 'Underground Access', position: { x: 12, z: 88 }, radius: 3, type: 'secondary', cover: 'moderate', risk: 'medium' },
    ],

    soundTraps: [
      { position: { x: 52, z: 48 }, type: 'metal_debris', radius: 2, soundLevel: 0.8 },
      { position: { x: 60, z: 32 }, type: 'broken_glass', radius: 3, soundLevel: 0.9 },
      { position: { x: 22, z: 62 }, type: 'chain_link', radius: 2, soundLevel: 0.7 },
    ],
  },

  // ==================== MAP 2: WHITE HOLLOW ====================
  white_hollow: {
    id: 'white_hollow',
    name: 'WHITE HOLLOW',
    theme: 'Abandoned Mountain Research Station',
    description: 'Snow-covered forest with muffled sounds but visible footprints',
    size: { width: 120, depth: 120 },
    ambience: 'Heavy snowfall, wind howling, limited visibility',
    soundModifier: 0.6,
    weatherEffect: 'footprints_visible',
    palette: palettes.white_hollow,

    boundary: {
      type: 'dense_forest_treeline',
      height: 20,
      thickness: 5,
      material: 'impassable_vegetation',
      positions: [
        { x: 0, z: 0, width: 120, depth: 5 },
        { x: 0, z: 115, width: 120, depth: 5 },
        { x: 0, z: 0, width: 5, depth: 120 },
        { x: 115, z: 0, width: 5, depth: 120 },
      ],
    },

    buildings: [
      {
        id: 'main_lodge',
        name: 'Research Lodge',
        position: { x: 60, z: 55 },
        dimensions: { width: 32, depth: 28, height: 10 },
        floors: 2,
        material: 'log_cabin',
        rooms: [
          {
            name: 'Great Hall', floor: 0,
            position: { x: 55, z: 50 }, size: { width: 20, depth: 15 },
            doors: [{ position: 'south', width: 3, type: 'double_doors' }, { position: 'north', width: 1.5 }],
            features: ['stone_fireplace', 'long_wooden_tables', 'antler_chandelier'],
            soundSurface: 'wooden_planks', tacticalValue: 'high',
            lighting: 'natural',
          },
          {
            name: 'Kitchen', floor: 0,
            position: { x: 72, z: 50 }, size: { width: 10, depth: 12 },
            doors: [{ position: 'west', width: 1.5 }],
            features: ['industrial_stove', 'walk_in_freezer'],
            soundSurface: 'tile', ambientNoise: 0.2,
          },
          {
            name: 'Storage Room', floor: 0,
            position: { x: 50, z: 65 }, size: { width: 8, depth: 8 },
            doors: [{ position: 'south', width: 1 }],
            features: ['shelves', 'canned_goods'],
            soundSurface: 'concrete', tacticalValue: 'high',
          },
          {
            name: 'Dormitory', floor: 1,
            position: { x: 55, z: 50 }, size: { width: 25, depth: 12 },
            doors: [{ position: 'south', width: 1 }],
            features: ['rows_of_bunk_beds', 'lockers'],
            soundSurface: 'wooden_floor', tacticalValue: 'medium',
          },
          {
            name: 'Observation Deck', floor: 1,
            position: { x: 72, z: 58 }, size: { width: 8, depth: 12 },
            doors: [{ position: 'west', width: 1 }],
            features: ['telescope', 'panoramic_windows', 'binoculars'],
            soundSurface: 'wooden_floor',
            sightlines: ['entire_compound'], tacticalValue: 'very_high',
            lighting: 'natural',
          },
        ],
        stairwells: [
          { name: 'Main Stairs', position: { x: 68, z: 52 }, floors: [0, 1], width: 2.5, soundSurface: 'wooden_stairs', lighting: 'dark' },
        ],
      },

      {
        id: 'garage_workshop',
        name: 'Vehicle Garage',
        position: { x: 88, z: 32 },
        dimensions: { width: 15, depth: 20, height: 6 },
        floors: 1,
        material: 'metal_siding',
        rooms: [
          {
            name: 'Garage Bay', floor: 0,
            position: { x: 88, z: 32 }, size: { width: 15, depth: 20 },
            doors: [{ position: 'west', width: 8, type: 'garage_door', open: true }],
            features: ['snowmobiles', 'tool_benches', 'fuel_drums'],
            soundSurface: 'oil_stained_concrete',
            ambientNoise: 0.3, tacticalValue: 'medium',
          },
        ],
      },

      {
        id: 'lab_outpost',
        name: 'Research Lab',
        position: { x: 28, z: 80 },
        dimensions: { width: 12, depth: 18, height: 6 },
        floors: 1,
        material: 'prefab_modules',
        rooms: [
          {
            name: 'Laboratory', floor: 0,
            position: { x: 28, z: 75 }, size: { width: 12, depth: 10 },
            doors: [{ position: 'south', width: 1 }],
            features: ['lab_benches', 'microscopes', 'specimen_jars'],
            soundSurface: 'linoleum',
            lighting: 'emergency_battery_powered', tacticalValue: 'medium',
          },
          {
            name: 'Sample Storage', floor: 0,
            position: { x: 28, z: 86 }, size: { width: 12, depth: 5 },
            doors: [{ position: 'north', width: 1 }],
            features: ['refrigerated_units', 'hazmat_suits'],
            soundSurface: 'tile', tacticalValue: 'low',
          },
        ],
      },

      {
        id: 'generator_shed',
        name: 'Power Station',
        position: { x: 95, z: 90 },
        dimensions: { width: 8, depth: 10, height: 5 },
        floors: 1,
        material: 'wood_metal',
        rooms: [
          {
            name: 'Generator', floor: 0,
            position: { x: 95, z: 90 }, size: { width: 8, depth: 10 },
            doors: [{ position: 'west', width: 1.5 }],
            features: ['diesel_generator', 'fuel_tanks'],
            soundSurface: 'concrete', tacticalValue: 'low',
            interactive: 'can_start_generator',
          },
        ],
      },
    ],

    outdoorZones: [
      {
        name: 'Forest Clearing',
        position: { x: 32, z: 35 }, size: { width: 30, depth: 25 },
        surface: 'deep_snow',
        features: ['fallen_logs', 'pine_trees', 'small_creek'],
        lighting: 'moonlight', soundSurface: 'snow', tacticalValue: 'high',
        footprintDuration: 120,
      },
      {
        name: 'Frozen Lake',
        position: { x: 80, z: 80 }, size: { width: 25, depth: 25 },
        surface: 'ice',
        features: ['fishing_hole', 'ice_fishing_shack', 'pressure_cracks'],
        lighting: 'moonlight', soundSurface: 'ice', tacticalValue: 'low',
        hazard: 'thin_ice_in_center',
      },
      {
        name: 'Equipment Yard',
        position: { x: 65, z: 32 }, size: { width: 15, depth: 15 },
        surface: 'packed_snow',
        features: ['snow_plow', 'pallets', 'fuel_drums'],
        lighting: 'spotlight', soundSurface: 'snow_over_gravel', tacticalValue: 'medium',
      },
    ],

    spawnPoints: {
      prey: { x: 30, z: 30, facing: 'northeast' },
      hunter: { x: 95, z: 95, facing: 'southwest' },
    },

    extractionZones: [
      { name: 'Helicopter Landing Pad', position: { x: 105, z: 18 }, radius: 5, type: 'primary', cover: 'minimal', risk: 'very_high', features: ['marked_with_paint', 'wind_sock'] },
      { name: 'Forest Trail Exit', position: { x: 14, z: 105 }, radius: 4, type: 'secondary', cover: 'heavy_trees', risk: 'medium' },
    ],

    environmentalMechanics: {
      footprints: { enabled: true, visibility: 0.9, duration: 120 },
      weather: { snowfall: 'heavy', visibility: 40, soundReduction: 0.4 },
    },
  },

  // ==================== MAP 3: BLACK ARRAY ====================
  black_array: {
    id: 'black_array',
    name: 'BLACK ARRAY',
    theme: 'Offshore Oil Platform',
    description: 'Industrial platform with mechanical ambient noise and vertical gameplay',
    size: { width: 80, depth: 80 },
    ambience: 'Machinery hum, ocean waves, metal creaking, fog horn',
    soundModifier: 1.0,
    platformHeight: 30,
    palette: palettes.black_array,

    boundary: {
      type: 'platform_edge',
      height: 3,
      thickness: 0.5,
      material: 'industrial_railing',
      dropOff: true,
      positions: [
        { x: 0, z: 0, width: 80, depth: 0.5 },
        { x: 0, z: 79.5, width: 80, depth: 0.5 },
        { x: 0, z: 0, width: 0.5, depth: 80 },
        { x: 79.5, z: 0, width: 0.5, depth: 80 },
      ],
    },

    buildings: [
      {
        id: 'control_center',
        name: 'Platform Control Center',
        position: { x: 40, z: 40 },
        dimensions: { width: 18, depth: 22, height: 12 },
        floors: 3,
        material: 'reinforced_steel',
        rooms: [
          {
            name: 'Operations Room', floor: 0,
            position: { x: 38, z: 38 }, size: { width: 15, depth: 12 },
            doors: [{ position: 'south', width: 2, type: 'pressure_door' }, { position: 'east', width: 1.5 }],
            features: ['control_consoles', 'monitor_arrays', 'radar_displays'],
            soundSurface: 'metal_grating',
            ambientNoise: 0.5, lighting: 'emergency_red', tacticalValue: 'very_high',
          },
          {
            name: 'Equipment Locker', floor: 0,
            position: { x: 50, z: 38 }, size: { width: 4, depth: 8 },
            doors: [{ position: 'west', width: 1 }],
            features: ['tool_racks', 'fire_extinguishers'],
            soundSurface: 'metal_floor', tacticalValue: 'medium',
          },
          {
            name: 'Living Quarters', floor: 1,
            position: { x: 38, z: 38 }, size: { width: 12, depth: 15 },
            doors: [{ position: 'south', width: 1 }],
            features: ['bunk_beds', 'personal_lockers', 'porthole_windows'],
            soundSurface: 'metal_floor_with_padding', lighting: 'minimal',
            tacticalValue: 'medium',
          },
          {
            name: 'Mess Hall', floor: 1,
            position: { x: 50, z: 40 }, size: { width: 8, depth: 12 },
            doors: [{ position: 'west', width: 1.5 }],
            features: ['tables', 'vending_machines'], soundSurface: 'metal_floor',
          },
          {
            name: 'Observation Deck', floor: 2,
            position: { x: 40, z: 40 }, size: { width: 14, depth: 14 },
            doors: [{ position: 'south', width: 1 }],
            features: ['360_degree_windows', 'binoculars', 'weather_station'],
            soundSurface: 'metal_grating',
            sightlines: ['entire_platform'], lighting: 'natural',
            tacticalValue: 'very_high', exposed: true,
          },
        ],
        stairwells: [
          { name: 'Central Stairwell', position: { x: 50, z: 48 }, floors: [0, 1, 2], width: 2, soundSurface: 'metal_stairs', lighting: 'dim_emergency' },
        ],
      },

      {
        id: 'drill_tower',
        name: 'Drilling Tower',
        position: { x: 18, z: 60 },
        dimensions: { width: 12, depth: 12, height: 25 },
        floors: 4,
        material: 'industrial_steel_frame',
        rooms: [
          {
            name: 'Drill Floor', floor: 0,
            position: { x: 18, z: 60 }, size: { width: 12, depth: 12 },
            doors: [{ position: 'east', width: 2 }],
            features: ['drill_apparatus', 'heavy_chains', 'control_panels'],
            soundSurface: 'metal_grating', ambientNoise: 0.6,
            hazard: 'rotating_equipment', lighting: 'amber',
          },
          {
            name: 'Mid-Platform 1', floor: 1,
            position: { x: 18, z: 60 }, size: { width: 8, depth: 8 },
            features: ['catwalks', 'valve_stations', 'gauges'],
            soundSurface: 'metal_mesh', exposed: true,
          },
          {
            name: 'Mid-Platform 2', floor: 2,
            position: { x: 18, z: 60 }, size: { width: 6, depth: 6 },
            features: ['catwalks', 'warning_lights', 'cable_runs'],
            soundSurface: 'metal_mesh', exposed: true,
          },
          {
            name: 'Crown Platform', floor: 3,
            position: { x: 18, z: 60 }, size: { width: 4, depth: 4 },
            features: ['pulley_system', 'wind_exposure'],
            soundSurface: 'metal_grating', tacticalValue: 'low',
            exposed: true, sightlines: ['entire_platform'],
          },
        ],
        ladders: [
          { name: 'Tower Ladder', position: { x: 22, z: 62 }, floors: [0, 1, 2, 3], width: 1, climbSpeed: 0.5, soundLevel: 0.8 },
        ],
      },

      {
        id: 'storage_modules',
        name: 'Container Storage',
        position: { x: 62, z: 22 },
        dimensions: { width: 18, depth: 25, height: 6 },
        floors: 1,
        material: 'shipping_containers',
        rooms: [
          {
            name: 'Container Maze', floor: 0,
            position: { x: 62, z: 22 }, size: { width: 18, depth: 25 },
            doors: [{ position: 'west', width: 1.5 }, { position: 'south', width: 1.5 }],
            features: ['stacked_containers', 'narrow_passages', 'cargo_netting'],
            soundSurface: 'metal_containers',
            layout: 'maze_like', tacticalValue: 'very_high', lighting: 'shadow_heavy',
          },
        ],
      },

      {
        id: 'helipad_structure',
        name: 'Helipad Platform',
        position: { x: 62, z: 62 },
        dimensions: { width: 15, depth: 15, height: 3 },
        floors: 1,
        material: 'reinforced_deck',
        rooms: [
          {
            name: 'Landing Pad', floor: 0,
            position: { x: 62, z: 62 }, size: { width: 15, depth: 15 },
            features: ['painted_H_marking', 'landing_lights', 'wind_indicators'],
            soundSurface: 'textured_metal',
            exposed: true, tacticalValue: 'low',
          },
        ],
      },
    ],

    outdoorZones: [
      {
        name: 'Main Deck',
        position: { x: 25, z: 22 }, size: { width: 28, depth: 26 },
        surface: 'non_slip_metal',
        features: ['pipe_runs', 'valve_stations', 'safety_railings'],
        lighting: 'flood_lights', soundSurface: 'metal_deck', tacticalValue: 'medium',
        hazard: 'slippery_when_wet',
      },
      {
        name: 'Lower Catwalk',
        position: { x: 40, z: 32 }, size: { width: 60, depth: 3 },
        surface: 'metal_grating',
        features: ['handrails', 'cable_trays'], lighting: 'minimal',
        soundSurface: 'metal_grating', tacticalValue: 'low',
        viewBelow: 'ocean',
      },
      {
        name: 'Chemical Storage Area',
        position: { x: 18, z: 18 }, size: { width: 10, depth: 10 },
        surface: 'containment_deck',
        features: ['chemical_drums', 'hazard_signs', 'emergency_shower'],
        lighting: 'caution_yellow', soundSurface: 'textured_metal',
        tacticalValue: 'medium', hazard: 'avoid_shooting_drums',
      },
    ],

    spawnPoints: {
      prey: { x: 22, z: 22, facing: 'east' },
      hunter: { x: 65, z: 65, facing: 'west' },
    },

    extractionZones: [
      { name: 'Emergency Boat Davit', position: { x: 6, z: 40 }, radius: 3, type: 'primary', cover: 'minimal', risk: 'very_high', features: ['rescue_boat', 'winch_system'] },
      { name: 'Supply Crane Platform', position: { x: 75, z: 8 }, radius: 4, type: 'secondary', cover: 'crane_housing', risk: 'high' },
    ],

    environmentalMechanics: {
      ambientNoise: { baseline: 0.4 },
      verticalGameplay: true,
      metalSurfaces: 0.9,
    },
  },
};

export const MAP_IDS = ['dead_signal', 'white_hollow', 'black_array'] as const;
