"use client";

import { useState, useEffect } from "react";

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

interface LifeViewProps {
  userId: string;
  activeView: 'box' | 'board';
  setActiveView: (view: 'box' | 'board') => void;
}

const neonColors = [
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff4500', // Orange Red
  '#00ff00', // Lime
  '#ffff00', // Yellow
  '#ff69b4', // Hot Pink
  '#00bfff', // Deep Sky Blue
  '#9400d3', // Violet
];

export default function LifeView({ userId, activeView, setActiveView }: LifeViewProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBoxTitle, setNewBoxTitle] = useState('');
  const [newBoxContent, setNewBoxContent] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [boardZoom, setBoardZoom] = useState(50);
  const [showGrid, setShowGrid] = useState(true);
  const [connectMode, setConnectMode] = useState(false);
  const [selectedForConnection, setSelectedForConnection] = useState<string | null>(null);
  const [showAddBoxModal, setShowAddBoxModal] = useState(false);
  const [editingBox, setEditingBox] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    fetchBoxes();
  }, [userId]);

  const fetchBoxes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notes?userId=${userId}&section=LIFE`);
      if (response.ok) {
        const fetchedNotes = await response.json();
        const convertedBoxes = fetchedNotes.map((note: any, index: number) => ({
          ...note,
          content: note.content ? note.content.split('\n').filter((line: string) => line.trim()) : [],
          color: neonColors[index % neonColors.length],
          position: { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 },
          connections: []
        }));
        setBoxes(convertedBoxes);
      }
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBox = async (title: string, content?: string) => {
    if (!title.trim()) return;

    try {
      const newBox = {
        title: title,
        content: content || '',
        category: 'General',
        tags: [],
        section: 'LIFE',
        priority: 'MEDIUM',
        archived: false,
        userId
      };

      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBox)
      });

      if (response.ok) {
        setNewBoxTitle('');
        setNewBoxContent('');
        setShowAddBoxModal(false);
        fetchBoxes();
      }
    } catch (error) {
      console.error('Failed to create box:', error);
    }
  };

  const updateBox = async (id: string, updates: Partial<Box>) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        fetchBoxes();
      }
    } catch (error) {
      console.error('Failed to update box:', error);
    }
  };

  const deleteBox = async (id: string) => {
    try {
      const response = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        fetchBoxes();
      }
    } catch (error) {
      console.error('Failed to delete box:', error);
    }
  };

  const addItemToBox = async (boxId: string, item: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box || !item.trim()) return;

    const newContent = [...box.content, item];
    await updateBox(boxId, { content: newContent });
    setNewItemText('');
  };

  const handleBoxClick = (boxId: string) => {
    if (connectMode) {
      if (selectedForConnection && selectedForConnection !== boxId) {
        // Create connection
        const newConnection: Connection = {
          id: `${selectedForConnection}-${boxId}-${Date.now()}`,
          from: selectedForConnection,
          to: boxId
        };
        setConnections(prev => [...prev, newConnection]);
        setSelectedForConnection(null);
        setConnectMode(false);
      } else {
        setSelectedForConnection(boxId);
      }
    }
  };

  const resetBoard = () => {
    setConnections([]);
    setBoardZoom(50);
    // Reset positions
    const resetBoxes = boxes.map((box, index) => ({
      ...box,
      position: { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 }
    }));
    setBoxes(resetBoxes);
  };

  if (activeView === 'box') {
    return (
      <div className="h-full bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20">
          <h1 className="text-2xl font-['Cal_Sans'] font-bold text-cyan-400 mb-2">LIFE BOX</h1>
          <p className="text-gray-400">Organize your thoughts into visual containers – see everything at once</p>
        </div>

        {/* Add Box Section */}
        <div className="p-6 border-b border-purple-500/20">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Type box title and press Enter or click +"
                value={newBoxTitle}
                onChange={(e) => setNewBoxTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createBox(newBoxTitle)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={() => createBox(newBoxTitle)}
              className="w-12 h-12 bg-cyan-600/20 border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-400 hover:bg-cyan-600/30 transition-all"
            >
              <span className="text-xl">+</span>
            </button>
          </div>

          <div className="mt-4">
            <textarea
              placeholder="Initial content (optional)... Press Enter to add box"
              value={newBoxContent}
              onChange={(e) => setNewBoxContent(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  createBox(newBoxTitle, newBoxContent);
                }
              }}
              className="w-full h-20 px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyan-400"
            />
          </div>

          <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
            <span>💡</span> Press Enter to add box, or Ctrl+Enter from content area
          </p>
        </div>

        {/* Boxes Grid */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="bg-gray-800/30 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 transition-all"
                style={{ borderColor: `${box.color}30` }}
              >
                {/* Box Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: box.color }}
                    />
                    <h3 className="font-['Cal_Sans'] font-medium text-white">{box.title}</h3>
                  </div>
                  <div className="flex gap-2 text-gray-400">
                    <button className="hover:text-white">👁</button>
                    <button className="hover:text-white">⚠</button>
                    <button onClick={() => deleteBox(box.id)} className="hover:text-red-400">✕</button>
                  </div>
                </div>

                {/* Box Content */}
                <div className="space-y-2">
                  {box.content.length === 0 ? (
                    <p className="text-gray-500 italic text-sm">Empty box - click edit to add content</p>
                  ) : (
                    box.content.map((item, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: box.color }}
                        />
                        <span className="text-gray-300">{item}</span>
                      </div>
                    ))
                  )}

                  {/* Add Item */}
                  {editingBox === box.id ? (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        placeholder="Add item..."
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addItemToBox(box.id, newItemText);
                            setEditingBox(null);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-gray-700 border border-purple-500/30 rounded text-white text-sm focus:outline-none focus:border-cyan-400"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          addItemToBox(box.id, newItemText);
                          setEditingBox(null);
                        }}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingBox(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingBox(box.id)}
                      className="text-gray-500 text-sm hover:text-cyan-400 mt-2"
                    >
                      Add item...
                    </button>
                  )}
                </div>

                {/* Box Footer */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: box.color }}
                    />
                    <span className="text-gray-500 text-xs">{box.content.length} items</span>
                  </div>
                  <span className="text-gray-500 text-xs">6/13/2025</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Board View (same as WorkView but with LIFE BOX title)
  return (
    <div className="h-full bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-purple-500/20">
        <h1 className="text-2xl font-['Cal_Sans'] font-bold text-cyan-400 mb-2">LIFE BOARD</h1>
        <p className="text-gray-400">Drag boxes to organize your thoughts visually</p>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAddBoxModal(true)}
            className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg text-purple-300 hover:bg-purple-600/30 transition-all"
          >
            + ADD BOX
          </button>

          <button
            onClick={() => setConnectMode(!connectMode)}
            className={`px-4 py-2 border rounded-lg transition-all ${
              connectMode
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : 'bg-gray-600/20 border-gray-500/50 text-gray-300 hover:bg-gray-600/30'
            }`}
          >
            🔗 {connectMode ? 'EXIT CONNECT' : 'CONNECT'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">→</span>
            <span className="text-gray-400">↓</span>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-3 py-2 border rounded transition-all ${
              showGrid
                ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                : 'bg-gray-600/20 border-gray-500/50 text-gray-400'
            }`}
          >
            GRID
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBoardZoom(Math.max(10, boardZoom - 10))}
              className="w-8 h-8 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30"
            >
              −
            </button>
            <span className="text-gray-300 text-sm min-w-[3rem] text-center">{boardZoom}%</span>
            <button
              onClick={() => setBoardZoom(Math.min(200, boardZoom + 10))}
              className="w-8 h-8 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30"
            >
              +
            </button>
          </div>

          <button
            onClick={resetBoard}
            className="px-3 py-2 bg-gray-600/20 border border-gray-500/50 rounded text-gray-300 hover:bg-gray-600/30"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Board Canvas - identical to WorkView but for LIFE */}
      <div className="flex-1 relative overflow-hidden bg-gray-900/30">
        {connectMode && selectedForConnection && (
          <div className="absolute top-4 left-4 z-20 bg-blue-600 text-white px-4 py-2 rounded-lg">
            🔗 Connection Mode Active - Click another box to connect
          </div>
        )}

        <div
          className="w-full h-full relative"
          style={{
            transform: `scale(${boardZoom / 100})`,
            transformOrigin: 'top left',
            backgroundImage: showGrid ? `
              linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
            ` : 'none',
            backgroundSize: '40px 40px'
          }}
        >
          {/* Render connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map((connection) => {
              const fromBox = boxes.find(b => b.id === connection.from);
              const toBox = boxes.find(b => b.id === connection.to);
              if (!fromBox || !toBox) return null;

              const fromCenter = {
                x: (fromBox.position?.x || 0) + 100,
                y: (fromBox.position?.y || 0) + 75
              };
              const toCenter = {
                x: (toBox.position?.x || 0) + 100,
                y: (toBox.position?.y || 0) + 75
              };

              return (
                <g key={connection.id}>
                  <line
                    x1={fromCenter.x}
                    y1={fromCenter.y}
                    x2={toCenter.x}
                    y2={toCenter.y}
                    stroke="#9333ea"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <circle
                    cx={fromCenter.x}
                    cy={fromCenter.y}
                    r="4"
                    fill="#ef4444"
                  />
                  <circle
                    cx={toCenter.x}
                    cy={toCenter.y}
                    r="4"
                    fill="#ef4444"
                  />
                </g>
              );
            })}
          </svg>

          {/* Render boxes */}
          {boxes.map((box) => (
            <div
              key={box.id}
              className={`absolute w-48 bg-gray-800/80 border rounded-lg p-3 cursor-pointer transition-all ${
                selectedForConnection === box.id ? 'ring-2 ring-blue-400' : ''
              }`}
              style={{
                left: box.position?.x || 0,
                top: box.position?.y || 0,
                borderColor: box.color
              }}
              onClick={() => handleBoxClick(box.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-['Cal_Sans'] text-white text-sm font-medium">{box.title}</h3>
                <div className="text-gray-400 text-xs">✕</div>
              </div>

              <div className="text-gray-400 text-xs italic mb-2">Empty</div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: box.color }}
                  />
                  <span className="text-gray-500 text-xs">{box.content.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom instruction bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-center py-2 text-sm">
          💡 Drag boxes to move • Use BOX view to edit content • Zoom with controls above
        </div>
      </div>

      {/* Add Box Modal */}
      {showAddBoxModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-500/50 rounded-lg p-6 w-96">
            <h3 className="text-white font-['Cal_Sans'] mb-4">Enter box title...</h3>
            <input
              type="text"
              placeholder="Box title"
              value={newBoxTitle}
              onChange={(e) => setNewBoxTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-purple-500/30 rounded text-white mb-4"
              autoFocus
            />
            <p className="text-gray-400 text-sm mb-4">💡 Press Enter to create box or Escape to cancel</p>
            <div className="flex gap-2">
              <button
                onClick={() => createBox(newBoxTitle)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
              >
                CREATE
              </button>
              <button
                onClick={() => setShowAddBoxModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
