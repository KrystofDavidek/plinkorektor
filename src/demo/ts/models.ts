import { Correction } from 'plinkorektor-core/lib/correction/Correction';

export type MistakeType = {
  mistake: string;
  helperText: string;
  description: string;
  corrections: Correction[];
};

export type MistakeInfo = {
  [key: number]: MistakeType;
};
