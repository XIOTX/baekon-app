import type React from 'react';
import { useState, useRef, useCallback } from 'react';

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

interface Connection {
  from: string;
  to: string;
  id: string;
}

interface BoardViewProps {
  boxes: Box[];
  zoom: number;
  onBoxMove: (id: string, position: { x: number; y: number }) => void;
  onConnectionCreate: (from: string, to: string) => void;
  onConnectionDelete: (connectionId: string) => void;
  connections: Connection[];
}

export default function BoardView({
  boxes,
  zoom,
  onBoxMove,
  onConnectionCreate,
  onConnectionDelete,
  connections
}: BoardViewProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent, boxId: string) => {
    if (e.shiftKey) {
      // Shift+click for connecting
      if (isConnecting) {
        if (isConnecting !== boxId) {
          onConnectionCreate(isConnecting, boxId);
        }
        setIsConnecting(null);
        setConnectionPreview(null);
      } else {
        setIsConnecting(boxId);
      }
      return;
    }

    // Regular dragging
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    setIsDragging(boxId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [boxes, isConnecting, onConnectionCreate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isConnecting && !isDragging) {
      // Update connection preview
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (boardRect) {
        setConnectionPreview({
          x: (e.clientX - boardRect.left) / zoom,
          y: (e.clientY - boardRect.top) / zoom
        });
      }
    }

    if (!isDragging) return;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    const newX = (e.clientX - boardRect.left - dragOffset.x) / zoom;
    const newY = (e.clientY - boardRect.top - dragOffset.y) / zoom;

    onBoxMove(isDragging, { x: Math.max(0, newX), y: Math.max(0, newY) });
  }, [isDragging, dragOffset, zoom, onBoxMove, isConnecting]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const getBoxCenter = (box: Box) => {
    return {
      x: (box.position?.x || 0) + 100, // half width
      y: (box.position?.y || 0) + 75   // half height
    };
  };

  const renderConnection = (connection: Connection) => {
    const fromBox = boxes.find(b => b.id === connection.from);
    const toBox = boxes.find(b => b.id === connection.to);

    if (!fromBox || !toBox) return null;

    const fromCenter = getBoxCenter(fromBox);
    const toCenter = getBoxCenter(toBox);

    return (
      <g key={connection.id}>
        <line
          x1={fromCenter.x}
          y1={fromCenter.y}
          x2={toCenter.x}
          y2={toCenter.y}
          stroke="#9333ea"
          strokeWidth="2"
          strokeOpacity="0.6"
          markerEnd="url(#arrowhead)"
        />
        <circle
          cx={(fromCenter.x + toCenter.x) / 2}
          cy={(fromCenter.y + toCenter.y) / 2}
          r="8"
          fill="#9333ea40"
          stroke="#9333ea"
          strokeWidth="1"
          className="cursor-pointer hover:fill-red-500/40"
          onClick={() => onConnectionDelete(connection.id)}
        />
      </g>
    );
  };

  return (
    <div
      ref={boardRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 20 0 L 0 0 0 20" fill="none" stroke="%239333ea" stroke-width="0.5" opacity="0.3"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)" /%3E%3C/svg%3E"),
          linear-gradient(135deg, rgba(75, 85, 99, 0.3), rgba(55, 65, 81, 0.3))
        `,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px, 100% 100%`,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left'
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG for connections */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#9333ea"
              opacity="0.8"
            />
          </marker>
        </defs>

        {/* Render connections */}
        {connections.map(renderConnection)}

        {/* Connection preview */}
        {isConnecting && connectionPreview && (
          <line
            x1={getBoxCenter(boxes.find(b => b.id === isConnecting)!).x}
            y1={getBoxCenter(boxes.find(b => b.id === isConnecting)!).y}
            x2={connectionPreview.x}
            y2={connectionPreview.y}
            stroke="#9333ea"
            strokeWidth="2"
            strokeOpacity="0.4"
            strokeDasharray="5,5"
          />
        )}
      </svg>

      {/* Boxes */}
      {boxes.map((box) => (
        <div
          key={box.id}
          className={`absolute p-3 bg-black/40 border rounded-lg backdrop-blur-sm transition-all duration-200 pointer-events-auto ${
            isDragging === box.id ? 'scale-110 shadow-2xl z-50' : 'hover:scale-105'
          } ${
            isConnecting === box.id ? 'ring-2 ring-purple-400 ring-opacity-60' : ''
          } ${
            isConnecting && isConnecting !== box.id ? 'hover:ring-2 hover:ring-green-400 hover:ring-opacity-60' : ''
          }`}
          style={{
            left: (box.position?.x || 0) / zoom,
            top: (box.position?.y || 0) / zoom,
            borderColor: box.color,
            boxShadow: `0 0 15px ${box.color}40`,
            width: 200 / zoom,
            minHeight: 150 / zoom,
            cursor: isConnecting ? 'crosshair' : isDragging === box.id ? 'grabbing' : 'grab'
          }}
          onMouseDown={(e) => handleMouseDown(e, box.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-['Cal_Sans'] font-medium text-sm" style={{ color: box.color }}>
              {box.title}
            </h4>
            {isConnecting === box.id && (
              <div className="text-xs text-purple-300 font-['Syne_Mono']">
                CONNECTING
              </div>
            )}
          </div>

          <div className="space-y-1">
            {box.content.slice(0, 3).map((line, index) => (
              <div key={index} className="text-xs text-gray-300 font-['Syne_Mono'] flex items-start gap-1">
                <span className="text-purple-400">•</span>
                <span className="line-clamp-1">{line}</span>
              </div>
            ))}
            {box.content.length > 3 && (
              <div className="text-xs text-gray-500 font-['Syne_Mono']">
                +{box.content.length - 3} more...
              </div>
            )}
          </div>

          {/* Connection indicator */}
          {box.connections && box.connections.length > 0 && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{box.connections.length}</span>
            </div>
          )}
        </div>
      ))}

      {/* Instructions */}
      {isConnecting ? (
        <div className="absolute top-4 left-4 bg-purple-900/80 border border-purple-500/50 rounded-lg p-3 pointer-events-none">
          <div className="text-purple-300 font-['Cal_Sans'] text-sm">
            Click another box to connect, or click empty space to cancel
          </div>
        </div>
      ) : (
        <div className="absolute bottom-4 left-4 bg-black/60 border border-purple-500/30 rounded-lg p-3 pointer-events-none">
          <div className="text-purple-300 font-['Syne_Mono'] text-xs space-y-1">
            <div>• Drag to move boxes</div>
            <div>• Shift+click to create connections</div>
            <div>• Click connection midpoint to delete</div>
          </div>
        </div>
      )}
    </div>
  );
}
