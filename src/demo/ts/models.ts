import { Mistake } from '../../main/core';

export type TokenInfo = {
  [key: number]: {
    token: string;
    isDisabled: boolean;
    htmlToken: string;
    helperText: string;
    chunk: any;
    mistakes: Mistake[];
  };
};

export type TokensInfo = {
  [key: number]: TokenInfo;
};

export type About = {
  url: string;
  label: string;
};
