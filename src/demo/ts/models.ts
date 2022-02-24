import { Mistake } from '../../main/core';

export type TokenInfo = {
  [key: number]: {
    token: string;
    htmlToken: string;
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
