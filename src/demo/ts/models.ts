import { Mistake } from 'plinkorektor-core/lib/correction/Mistake';

export type TokenInfo = {
  [key: number]: {
    token: string;
    isDisabled: boolean;
    htmlToken: string;
    helperText: string;
    mistakes: Mistake[];
  };
};

export type TokensInfo = {
  [key: number]: TokenInfo;
};
