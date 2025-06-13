import type React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';

interface Box {
  id: string;
  title: string;
  content: string[];
  category?: string;
  color: string;
  position?: { x: number; y: number };
  connections?: string[];
  tags: string[];
  section: 'WORK' | 'LIFE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  archived: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BoardViewProps {
  boxes: Box[];
  zoom: number;
  onBoxMove: (id: string, position: { x: number; y: number }) => void;
  onBoxClick?: (id: string) => void;
  onBoxDelete?: (id: string) => void;
  onConnectionDelete?: (fromId: string, toId: string) => void;
  connectionMode?: boolean;
  selectedBoxForConnection?: string | null;
  selectedBoxId?: string | null;
}

export default function BoardView({
  boxes,
  zoom,
  onBoxMove,
  onBoxClick,
  onBoxDelete,
  onConnectionDelete,
  connectionMode = false,
  selectedBoxForConnection,
  selectedBoxId
}: BoardViewProps) {
  const [draggedBox, setDraggedBox] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, boxId: string) => {
    if (connectionMode) {
      onBoxClick?.(boxId);
      return;
    }

    const box = boxes.find(b => b.id === boxId);
    if (!box?.position) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedBox(boxId);
  }, [connectionMode, onBoxClick, boxes]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedBox || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const scaleValue = zoom / 100;

    const newX = (e.clientX - boardRect.left - dragOffset.x) / scaleValue;
    const newY = (e.clientY - boardRect.top - dragOffset.y) / scaleValue;

    onBoxMove(draggedBox, { x: Math.max(0, newX), y: Math.max(0, newY) });
  }, [draggedBox, dragOffset, onBoxMove, zoom]);

  const handleMouseUp = useCallback(() => {
    setDraggedBox(null);
  }, []);

  useEffect(() => {
    if (draggedBox) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedBox, handleMouseMove, handleMouseUp]);

  const getConnections = () => {
    const connections: { from: Box; to: Box }[] = [];
    boxes.forEach(box => {
      if (box.connections) {
        box.connections.forEach(targetId => {
          const targetBox = boxes.find(b => b.id === targetId);
          if (targetBox) {
            connections.push({ from: box, to: targetBox });
          }
        });
      }
    });
    return connections;
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Background with cross-grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://i.imgur.com/fu1Gj1m.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          zIndex: 0
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(147, 51, 234, 0.8) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.6,
          zIndex: 1
        }}
      />

      {/* Board content */}
      <div
        ref={boardRef}
        className="absolute inset-0 w-full h-full"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          zIndex: 2
        }}
      >
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 3 }}>
          {getConnections().map((connection, index) => {
            const fromPos = connection.from.position || { x: 0, y: 0 };
            const toPos = connection.to.position || { x: 0, y: 0 };

            const fromCenter = {
              x: fromPos.x + 96, // Half of box width (192px / 2)
              y: fromPos.y + 75  // Approximate center height
            };
            const toCenter = {
              x: toPos.x + 96,
              y: toPos.y + 75
            };

            return (
              <g key={`${connection.from.id}-${connection.to.id}-${index}`}>
                {/* Dashed connection line */}
                <line
                  x1={fromCenter.x}
                  y1={fromCenter.y}
                  x2={toCenter.x}
                  y2={toCenter.y}
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                  opacity="0.8"
                  className="cursor-pointer hover:stroke-red-400 transition-colors"
                  onDoubleClick={() => {
                    onConnectionDelete?.(connection.from.id, connection.to.id);
                  }}
                  title="Double-click to delete connection"
                />
                {/* Connection dots */}
                <circle
                  cx={fromCenter.x}
                  cy={fromCenter.y}
                  r="4"
                  fill="#ef4444"
                  className="cursor-pointer"
                  onDoubleClick={() => {
                    onConnectionDelete?.(connection.from.id, connection.to.id);
                  }}
                />
                <circle
                  cx={toCenter.x}
                  cy={toCenter.y}
                  r="4"
                  fill="#ef4444"
                  className="cursor-pointer"
                  onDoubleClick={() => {
                    onConnectionDelete?.(connection.from.id, connection.to.id);
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Boxes */}
        {boxes.map((box) => (
          <div
            key={box.id}
            className={`absolute w-48 rounded-lg p-3 cursor-pointer transition-all select-none ${
              connectionMode && selectedBoxForConnection === box.id ? 'ring-2 ring-blue-400' : ''
            } ${
              selectedBoxId === box.id ? 'ring-2 ring-yellow-400 ring-opacity-75 animate-pulse' : ''
            } ${connectionMode ? 'hover:ring-2 hover:ring-blue-300' : 'hover:scale-105'}`}
            style={{
              left: box.position?.x || 0,
              top: box.position?.y || 0,
              background: selectedBoxId === box.id
                ? 'rgba(31, 41, 55, 0.95)'
                : 'rgba(31, 41, 55, 0.9)',
              border: `2px solid ${box.color}`,
              backdropFilter: 'blur(10px)',
              zIndex: draggedBox === box.id ? 10 : 4,
              boxShadow: selectedBoxId === box.id
                ? `0 0 20px ${box.color}60`
                : undefined
            }}
            onMouseDown={(e) => handleMouseDown(e, box.id)}
          >
            {/* Box Header */}
            <div className="flex items-center justify-between mb-2">
              <h3
                className="font-medium text-sm truncate"
                style={{
                  color: '#F1E2FF',
                  fontFamily: 'Cal Sans, sans-serif',
                  textShadow: '0px 0px 8px rgba(255, 255, 255, 0.5)'
                }}
              >
                {box.title}
              </h3>
              {!connectionMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBoxDelete?.(box.id);
                  }}
                  className="text-gray-400 hover:text-red-400 text-xs transition-colors opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Box Content Preview */}
            <div className="mb-2">
              {box.content.length === 0 ? (
                <div
                  className="text-xs italic opacity-60"
                  style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}
                >
                  Empty
                </div>
              ) : (
                <div className="space-y-1">
                  {box.content.slice(0, 2).map((item, index) => (
                    <div
                      key={index}
                      className="text-xs flex items-start gap-1"
                      style={{ color: '#E5E7EB', fontFamily: 'Syne Mono, monospace' }}
                    >
                      <span style={{ color: box.color }}>•</span>
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                  {box.content.length > 2 && (
                    <div
                      className="text-xs opacity-60"
                      style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}
                    >
                      +{box.content.length - 2} more...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box Footer */}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: box.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}
                >
                  {box.content.length}
                </span>
              </div>
              {box.connections && box.connections.length > 0 && (
                <div
                  className="text-xs flex items-center gap-1"
                  style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}
                >
                  🔗 {box.connections.length}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Bottom instruction bar */}
        <div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-lg"
          style={{
            background: 'rgba(168, 85, 247, 0.9)',
            border: '1px solid #A855F7',
            zIndex: 20
          }}
        >
          <div
            className="text-white text-sm text-center"
            style={{ fontFamily: 'Syne Mono, monospace' }}
          >
            💡 Drag boxes to move • Double-click connections to delete • Use BOX view to edit content • Zoom with controls above
          </div>
        </div>
      </div>
    </div>
  );
}
