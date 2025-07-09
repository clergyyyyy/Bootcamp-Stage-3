'use client';
import React, { useEffect, useState, useRef } from 'react';

interface ZoomParallaxProps {
  /** 圖標的 src 路徑 */
  iconSrc?: string;
  /** 背景圖片的 src 路徑 */
  backgroundSrc?: string;
  /** 圖標的 alt 文字 */
  iconAlt?: string;
  /** 圖標尺寸 */
  iconSize?: number;
  /** 容器高度 */
  height?: number;
}

const ZoomParallax: React.FC<ZoomParallaxProps> = ({
  iconSrc = '/logo.svg',
  backgroundSrc = '/Login.jpg',
  iconAlt = 'Growing Icon',
  iconSize = 120,
  height = 700,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerTop = rect.top;
      const containerBottom = rect.bottom;
      const windowHeight = window.innerHeight;
      
      // 計算組件在視窗中的可見比例
      let progress = 0;
      
      if (containerTop <= windowHeight && containerBottom >= 0) {
        // 組件在視窗範圍內
        if (containerTop <= 0 && containerBottom >= windowHeight) {
          // 組件完全覆蓋視窗時，progress = 1（縮放完成）
          progress = 1;
        } else if (containerTop > 0) {
          // 組件從下方進入視窗
          const visibleHeight = Math.min(containerBottom, windowHeight) - containerTop;
          progress = visibleHeight / windowHeight;
        } else {
          // 組件從上方離開視窗
          const visibleHeight = containerBottom;
          progress = Math.min(1, (windowHeight - visibleHeight + height) / height);
        }
      } else if (containerTop > windowHeight) {
        // 組件在視窗下方，還沒開始進入
        progress = 0;
      } else if (containerBottom < 0) {
        // 組件已經完全滾動過去了
        progress = 1;
      }

      // 確保 progress 在 0-1 之間
      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress);
    };

    // 初始計算
    handleScroll();
    
    // 添加滾動監聽
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [height]);


  const iconOpacity = scrollProgress <= 0.7 ? 1 : Math.max(0, 1 - ((scrollProgress - 0.5) / 0.5));
  const backgroundScale = 1.5 - (scrollProgress * 0.5);
  const backgroundOpacity = Math.max(0.3, Math.min(1, scrollProgress * 2 + 0.3));
  const overlayOpacity = scrollProgress <= 0.6 ? 1 - (scrollProgress / 0.6) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* 黑色背景 */}
      <div className="absolute inset-0 bg-black" />
      
      {/* 背景圖片 */}
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${backgroundScale})`,
          opacity: backgroundOpacity,
          transformOrigin: 'center center',
          zIndex: 1,
        }}
      >
        <img
          src={backgroundSrc}
          alt="Background"
          className="w-full h-full object-cover"
          style={{ 
            objectFit: 'cover',
            display: 'block',
            minWidth: '100%',
            minHeight: '100%'
          }}
          onLoad={() => console.log('Background image loaded:', backgroundSrc)}
          onError={() => console.error('Background image failed to load:', backgroundSrc)}
        />
      </div>

      {/* 黑色遮罩層 */}
      <div 
        className="absolute inset-0 bg-black transition-opacity duration-200 ease-out"
        style={{
          opacity: overlayOpacity,
          zIndex: 2,
        }}
      />

      {/* Growing Wrapper Icon */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 3 }}>
        <div
          className="transition-opacity duration-100"
          style={{
            opacity: iconOpacity,
            transform: 'translateZ(0)',
          }}
        >
          <img
            src={iconSrc}
            alt={iconAlt}
            className="object-contain"
            style={{ 
              width: `${iconSize}px`, 
              height: `${iconSize}px`,
              objectFit: 'contain'
            }}
          />
        </div>
      </div>

      {/* 測試用
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-white/80 px-3 py-2 rounded text-sm font-mono" style={{ zIndex: 10 }}>
          Progress: {Math.round(scrollProgress * 100)}%
          <br />
          Icon Opacity: {Math.round(iconOpacity * 100)}%
          <br />
          BG Scale: {Math.round(backgroundScale * 100)}%
          <br />
          BG Opacity: {Math.round(backgroundOpacity * 100)}%
          <br />
          Overlay Opacity: {Math.round(overlayOpacity * 100)}%
          <br />
          BG Source: {backgroundSrc}
        </div>
      )} */}
    </div>
  );
};

export { ZoomParallax };