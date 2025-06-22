export interface TextBlockItem {
  id: string;            // 唯一 ID（用於刪除、編輯）
  content: string;       // 文字內容（最多 1000 字）
  title?: string;        // 可選標題（如果 UI 有提供標題欄位）
  order?: number;        // 排序用
}