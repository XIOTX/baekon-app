"use client";

import { useEffect, useState } from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
  className?: string;
}

export default function AudioVisualizer({
  audioLevel,
  isRecording,
  className = ""
}: AudioVisualizerProps) {
  const [activeDots, setActiveDots] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    if (!isRecording) {
      setActiveDots([false, false, false, false]);
      return;
    }

    // Map audio level (0-1) to number of active dots (0-4)
    const numActiveDots = Math.ceil(audioLevel * 4);
    const newActiveDots = Array(4).fill(false);

    for (let i = 0; i < numActiveDots; i++) {
      newActiveDots[i] = true;
    }

    setActiveDots(newActiveDots);
  }, [audioLevel, isRecording]);

  const dotPositions = [
    { left: '12px' },
    { left: '32px' },
    { left: '72px' },
    { left: '92px' }
  ];

  return (
    <div
      className={`relative ${className}`}
      style={{ width: '120px', height: '43px' }}
    >
      {dotPositions.map((position, index) => {
        const isActive = activeDots[index];

        return (
          <div
            key={index}
            className={`absolute transition-all duration-150 ${isActive ? 'animate-pulse' : ''}`}
            style={{
              width: '5px',
              height: '5px',
              left: position.left,
              top: '18px',
              background: isActive
                ? 'linear-gradient(0deg, #00FF84 0%, #25FF92 100%)'
                : 'linear-gradient(0deg, rgba(0, 255, 132, 0.3) 0%, rgba(37, 255, 146, 0.3) 100%)',
              boxShadow: isActive
                ? '0px 0px 37px #25FF92 inset, 0px 0px 20px rgba(37, 255, 146, 0.8)'
                : '0px 0px 37px rgba(37, 255, 146, 0.3) inset',
              borderRadius: '9999px',
              border: isActive ? '1px #00FF84 solid' : '1px rgba(0, 255, 132, 0.3) solid',
              transform: isActive ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
}
