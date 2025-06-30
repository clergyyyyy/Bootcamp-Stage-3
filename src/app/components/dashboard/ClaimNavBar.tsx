'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface ClaimNavBarProps {
  siteID: string;
  className?: string;
}

export default function ClaimNavBar({ siteID, className = '' }: ClaimNavBarProps) {
  const [copied, setCopied] = useState(false);
  const url = `https://fanlink-demo.vercel.app/${siteID}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒後重置狀態
    } catch (err) {
      console.error('複製失敗:', err);
      // 備用方案：使用舊的方法
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('備用複製方法也失敗:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={`flex flex-1 justify-between items-center bg-blue-400 border border-blue-500 rounded-xl px-4 py-3 text-white ${className}`}>
      {/* 左側內容 */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-medium">Claim at</span>
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono bg-blue-500 bg-opacity-50 px-2 py-1 rounded truncate hover:bg-opacity-70 transition-colors cursor-pointer"
        >
          {url}
        </a>
      </div>

      {/* 右側複製按鈕 */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ml-3 flex-shrink-0 ${
          copied
            ? 'bg-green-500 text-white'
            : '!bg-blue-500 text-blue-600 !hover:bg-blue-400 active:bg-blue-100'
        }`}
      >
        {copied ? (
          <>
            <Check size={16} />
            Copied!
          </>
        ) : (
          <>
            <Copy size={16} />
            Copy
          </>
        )}
      </button>
    </div>
  );
}