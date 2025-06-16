// src/types/Template.ts
export type Template = {
  name?: string;
  templateEngName?: string;
  bgImage?: string;
  fontFamily?: string;
  color: {
    fontPrimary: string;
    fontSecondary: string;
    buttonPrimary: string;
    buttonSecondary: string;
  };
  border: {
    radius: number;
    style: string;
  };
};