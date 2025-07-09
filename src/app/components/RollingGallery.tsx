'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useAnimation } from 'framer-motion';
import './RollingGallery.css';

const IMGS = [
'https://i.ibb.co/yc7HZL5V/triples.jpg',
'https://i.ibb.co/MxGnQntL/artms.webp',
'https://i.ibb.co/zWnJC29b/ive.jpg',
'https://i.ibb.co/1Gq0RqDp/newjeans.jpg',
'https://i.ibb.co/sJ99CqYC/adp.webp',
'https://i.ibb.co/35QtkHmh/meovv.jpg',
'https://i.ibb.co/VYGFdQBq/babymonster.jpg',
'https://i.ibb.co/YFT6pY02/fiftyfifty.jpg',
'https://i.ibb.co/KxZwFd7x/twice.png',
'https://i.ibb.co/v4dmskWR/blackpink.jpg',
];

interface RollingGalleryProps {
  autoplay?: boolean;
  pauseOnHover?: boolean;
  images?: string[];
}

const MAX_DT = 50;          // 單幀最大間隔 (ms)
const ROTATION_SPEED = 0.02; // 每毫秒旋轉角度

const RollingGallery: React.FC<RollingGalleryProps> = ({
  autoplay = true,
  pauseOnHover = true,
  images = [],
}) => {
  const imgs = images.length ? images : IMGS;

  /* ---------- RWD ---------- */
  const [isSm, setIsSm] = useState(false);
  useEffect(() => {
    const check = () => setIsSm(window.innerWidth <= 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ---------- 幾何參數 ---------- */
  const cylinderWidth = isSm ? 1100 : 2400;
  const faceCount = imgs.length;
  const faceWidth = (cylinderWidth / faceCount) * 1.5;
  const radius = cylinderWidth / (2 * Math.PI);

  /* ---------- 動畫狀態 ---------- */
  const rotation = useMotionValue(0);
  const controls = useAnimation();
  const rafId = useRef<number>(0);
  const prev = useRef<number>(performance.now());
  const isPlaying = useRef<boolean>(true);

  /* ---------- 內部函式 ---------- */
  const updateRotation = useCallback(
    (dt: number) => {
      if (dt > MAX_DT) dt = MAX_DT;
      const angle = (rotation.get() - dt * ROTATION_SPEED) % 360;
      rotation.set(angle);
      controls.start({ rotateY: angle, transition: { duration: 0.1 } });
    },
    [rotation, controls],
  );

  /** requestAnimationFrame 迴圈 */
  const animate = useCallback(
    (now: number) => {
      const dt = now - prev.current;
      prev.current = now;
      if (isPlaying.current) updateRotation(dt);
      rafId.current = requestAnimationFrame(animate);
    },
    [updateRotation],
  );

  const pause = useCallback(() => {
    isPlaying.current = false;
    cancelAnimationFrame(rafId.current);
  }, []);

  const resume = useCallback(() => {
    isPlaying.current = true;
    prev.current = performance.now();
    rafId.current = requestAnimationFrame(animate);
  }, [animate]);

  /* ---------- Effect: 啟動 & 分頁可視性 ---------- */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) pause();
      else resume();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      pause();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [animate, pause, resume]);

  /* ---------- 滑鼠事件 ---------- */
  const handleMouseEnter = () => {
    if (autoplay && pauseOnHover) pause();
  };

  const handleMouseLeave = () => {
    if (autoplay && pauseOnHover) resume();
  };

  /* ---------- Render ---------- */
  return (
    <div className="gallery-container">
      <div className="gallery-gradient gallery-gradient-left" />
      <div className="gallery-gradient gallery-gradient-right" />
      <div className="gallery-content">
        <motion.div
          className="gallery-track"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ width: cylinderWidth, transformStyle: 'preserve-3d' }}
          animate={controls}
        >
          {imgs.map((url, i) => (
            <div
              key={url}
              className="gallery-item"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${(360 / faceCount) * i}deg) translateZ(${radius}px)`,
              }}
            >
              <Image
                src={url}
                alt={`gallery-${i}`}
                width={faceWidth}
                height={faceWidth}
                className="gallery-img"
                unoptimized
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default RollingGallery;
