import { Ionicons } from '@expo/vector-icons';

export type VitalTypeKey =
  | 'blood_pressure'
  | 'blood_sugar'
  | 'weight'
  | 'heart_rate'
  | 'oxygen';

export type VitalTypeConfig = {
  key: VitalTypeKey;
  label: string;
  shortLabel: string;
  placeholder: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

export const VITAL_TYPES: VitalTypeConfig[] = [
  {
    key: 'blood_pressure',
    label: 'Blood Pressure',
    shortLabel: 'BP',
    placeholder: '120/80',
    unit: 'mmHg',
    icon: 'heart-outline',
    color: '#F05A2A',
    bg: '#FEF0EB',
  },
  {
    key: 'blood_sugar',
    label: 'Blood Sugar',
    shortLabel: 'Glucose',
    placeholder: '100',
    unit: 'mg/dL',
    icon: 'water-outline',
    color: '#0BA5EC',
    bg: '#E0F2FE',
  },
  {
    key: 'weight',
    label: 'Weight',
    shortLabel: 'Weight',
    placeholder: '70',
    unit: 'kg',
    icon: 'scale-outline',
    color: '#7C3AED',
    bg: '#EDE9FE',
  },
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    shortLabel: 'HR',
    placeholder: '72',
    unit: 'bpm',
    icon: 'pulse-outline',
    color: '#F79009',
    bg: '#FEF3C7',
  },
  {
    key: 'oxygen',
    label: 'Oxygen',
    shortLabel: 'SpO₂',
    placeholder: '98',
    unit: '%',
    icon: 'fitness-outline',
    color: '#0D9B76',
    bg: '#D1FAE5',
  },
];

export function getVitalTypeConfig(type: string): VitalTypeConfig {
  return VITAL_TYPES.find((v) => v.key === type) ?? VITAL_TYPES[0];
}
