/**
 * Built-in task templates the user can enable with one tap.
 * Seasonal dates are reasonable defaults for a temperate northern-hemisphere
 * climate; users can edit them after adding.
 */
export const TEMPLATES = [
  {
    templateId: 'furnace-filter',
    name: 'Replace furnace filter',
    schedule: { type: 'interval', every: 90, unit: 'days' },
    notes: 'Check the airflow arrow on the filter frame when installing.',
    supplies: 'Filter size: 16x25x1 (check yours)'
  },
  {
    templateId: 'smoke-co-test',
    name: 'Test smoke & CO detectors',
    schedule: { type: 'interval', every: 1, unit: 'months' },
    notes: 'Press and hold the test button on each detector.',
    supplies: ''
  },
  {
    templateId: 'smoke-batteries',
    name: 'Replace smoke detector batteries',
    schedule: { type: 'interval', every: 1, unit: 'years' },
    notes: 'Replace detectors entirely every 10 years.',
    supplies: '9V or AA batteries (check detector)',
    seasons: ['fall']
  },
  {
    templateId: 'gutters',
    name: 'Clean gutters',
    schedule: { type: 'seasonal', dates: [{ month: 4, day: 15 }, { month: 11, day: 1 }] },
    notes: 'Spring and fall, after most leaves have dropped.',
    supplies: 'Ladder, gloves, gutter scoop'
  },
  {
    templateId: 'water-heater',
    name: 'Flush water heater',
    schedule: { type: 'interval', every: 1, unit: 'years' },
    notes: 'Turn off power/gas first. Drain until water runs clear.',
    supplies: 'Garden hose'
  },
  {
    templateId: 'dryer-vent',
    name: 'Clean dryer vent',
    schedule: { type: 'interval', every: 1, unit: 'years' },
    notes: 'Clean the full duct to the outside, not just the lint trap.',
    supplies: 'Dryer vent brush kit'
  },
  {
    templateId: 'hvac-service',
    name: 'HVAC service',
    schedule: { type: 'interval', every: 1, unit: 'years' },
    notes: 'Schedule a professional tune-up before cooling season.',
    supplies: '',
    seasons: ['spring']
  },
  {
    templateId: 'weatherstripping',
    name: 'Check window & door weatherstripping',
    schedule: { type: 'seasonal', dates: [{ month: 10, day: 1 }] },
    notes: 'Look for drafts, gaps and cracked seals.',
    supplies: 'Weatherstripping tape, caulk'
  },
  {
    templateId: 'faucet-winterize',
    name: 'Winterize outdoor faucets',
    schedule: { type: 'seasonal', dates: [{ month: 10, day: 15 }] },
    notes: 'Disconnect hoses, shut interior valve, drain the line.',
    supplies: 'Faucet covers'
  },
  {
    templateId: 'sump-pump',
    name: 'Test sump pump',
    schedule: { type: 'seasonal', dates: [{ month: 3, day: 15 }] },
    notes: 'Pour a bucket of water into the pit and confirm it pumps out.',
    supplies: '5-gallon bucket'
  },
  {
    templateId: 'fridge-coils',
    name: 'Clean refrigerator coils',
    schedule: { type: 'interval', every: 6, unit: 'months' },
    notes: 'Unplug first. Coils are usually behind the kick plate or on the back.',
    supplies: 'Coil brush, vacuum'
  }
];
