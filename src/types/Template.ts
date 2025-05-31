export interface Template {
  name: string;              // 中文名稱
  templateEngName: string;   // 英文代稱（新增）
  bgImage: string;
  fontFamily: string;
  color: {
    buttonPrimary: string;
    buttonSecondary: string;
    fontPrimary: string;
    fontSecondary: string;
  };
  border: {
    style: 'solid' | 'dashed' | 'none';
    radius: number;
  };
}
