"use client";

import { useState, useEffect } from "react";
import BoardView from "./BoardView";

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

interface LifeViewProps {
  userId: string;
  activeView: 'box' | 'board';
  selectedBoxId?: string | null;
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

export default function LifeView({ userId, activeView, selectedBoxId }: LifeViewProps) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBoxTitle, setNewBoxTitle] = useState('');
  const [newBoxContent, setNewBoxContent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBox, setEditingBox] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Board state
  const [zoom, setZoom] = useState(50);
  const [connectionMode, setConnectionMode] = useState(false);
  const [selectedBoxForConnection, setSelectedBoxForConnection] = useState<string | null>(null);

  useEffect(() => {
    fetchBoxes();
  }, [userId]);

  const fetchBoxes = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notes?userId=${userId}&section=LIFE`);
      if (response.ok) {
        const fetchedNotes = await response.json();
        const convertedBoxes = fetchedNotes.map((note: any, index: number) => ({
          ...note,
          content: note.content ? note.content.split('\n').filter((line: string) => line.trim()) : [],
          color: neonColors[index % neonColors.length],
          position: note.position || { x: (index % 4) * 250 + 100, y: Math.floor(index / 4) * 200 + 100 },
          connections: note.connections || []
        }));
        setBoxes(convertedBoxes);
      }
    } catch (error) {
      console.error('Failed to fetch boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBox = async () => {
    if (!newBoxTitle.trim() || !userId) return;

    try {
      const newBox = {
        title: newBoxTitle,
        content: newBoxContent,
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
        setShowCreateForm(false);
        await fetchBoxes();
      } else {
        const errorData = await response.json();
        console.error('Failed to create box:', errorData);
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

  const addContentItem = (boxId: string, content: string) => {
    const box = boxes.find(b => b.id === boxId);
    if (box) {
      const updatedContent = [...box.content, content];
      updateBox(boxId, { content: updatedContent.join('\n') });
    }
  };

  const handleBoxMove = (id: string, position: { x: number; y: number }) => {
    updateBox(id, { position });
  };

  const handleConnection = (fromId: string, toId: string) => {
    const fromBox = boxes.find(b => b.id === fromId);
    if (fromBox) {
      const connections = fromBox.connections || [];
      if (!connections.includes(toId)) {
        updateBox(fromId, { connections: [...connections, toId] });
      }
    }
  };

  const handleConnectionDelete = (fromId: string, toId: string) => {
    const fromBox = boxes.find(b => b.id === fromId);
    if (fromBox && fromBox.connections) {
      const updatedConnections = fromBox.connections.filter(id => id !== toId);
      updateBox(fromId, { connections: updatedConnections });
    }
  };

  if (activeView === 'board') {
    return (
      <div className="h-full w-full relative overflow-hidden">
        {/* Board Header */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#00FFFF', fontFamily: 'Cal Sans, sans-serif', textShadow: '0px 0px 12px rgba(0, 255, 255, 0.8)' }}>
              LIFE BOARD
            </h1>
            <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}>
              Drag boxes to organize your thoughts visually
            </p>
          </div>

          {/* Board Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#F1E2FF',
                fontFamily: 'Cal Sans, sans-serif'
              }}
            >
              + ADD BOX
            </button>

            <button
              onClick={() => {
                setConnectionMode(!connectionMode);
                setSelectedBoxForConnection(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                connectionMode ? 'bg-blue-600 text-white' : ''
              }`}
              style={{
                background: connectionMode ? '#3B82F6' : 'rgba(255, 255, 255, 0.1)',
                border: `1px solid ${connectionMode ? '#3B82F6' : 'rgba(255, 255, 255, 0.2)'}`,
                color: connectionMode ? '#FFFFFF' : '#F1E2FF',
                fontFamily: 'Cal Sans, sans-serif'
              }}
            >
              {connectionMode ? '🔗 EXIT CONNECT' : '🔗 CONNECT'}
            </button>

            <div className="flex items-center gap-1">
              <button onClick={() => setZoom(Math.max(10, zoom - 10))} className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#F1E2FF' }}>-</button>
              <span className="px-2 text-xs" style={{ color: '#F1E2FF', fontFamily: 'Syne Mono, monospace' }}>GRID</span>
              <button onClick={() => setZoom(Math.min(100, zoom + 10))} className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#F1E2FF' }}>+</button>
              <span className="px-2 text-xs" style={{ color: '#F1E2FF', fontFamily: 'Syne Mono, monospace' }}>{zoom}%</span>
              <button onClick={() => setZoom(50)} className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#F1E2FF' }}>RESET</button>
            </div>
          </div>
        </div>

        {/* Connection Mode Indicator */}
        {connectionMode && (
          <div className="absolute top-20 left-4 z-30 p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.9)', border: '1px solid #3B82F6' }}>
            <div className="text-sm font-medium" style={{ color: '#FFFFFF', fontFamily: 'Cal Sans, sans-serif' }}>
              🔗 Connection Mode Active
            </div>
            <div className="text-xs mt-1" style={{ color: '#E5E7EB', fontFamily: 'Syne Mono, monospace' }}>
              {selectedBoxForConnection ? 'Click another box to connect' : 'Click a box to start connecting'}
            </div>
          </div>
        )}

        {/* Board View */}
        <BoardView
          boxes={boxes}
          zoom={zoom}
          onBoxMove={handleBoxMove}
          onBoxClick={(id) => {
            if (connectionMode) {
              if (!selectedBoxForConnection) {
                setSelectedBoxForConnection(id);
              } else if (selectedBoxForConnection !== id) {
                handleConnection(selectedBoxForConnection, id);
                setSelectedBoxForConnection(null);
                setConnectionMode(false);
              }
            }
          }}
          connectionMode={connectionMode}
          selectedBoxForConnection={selectedBoxForConnection}
          onBoxDelete={deleteBox}
          onConnectionDelete={handleConnectionDelete}
          selectedBoxId={selectedBoxId}
        />

        {/* Create Box Form */}
        {showCreateForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg border border-purple-500 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4" style={{ color: '#F1E2FF', fontFamily: 'Cal Sans, sans-serif' }}>Create New Box</h3>

              <input
                type="text"
                placeholder="Enter box title..."
                value={newBoxTitle}
                onChange={(e) => setNewBoxTitle(e.target.value)}
                className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded text-white"
                autoFocus
              />

              <textarea
                placeholder="Initial content (optional)... Press Enter to add box"
                value={newBoxContent}
                onChange={(e) => setNewBoxContent(e.target.value)}
                className="w-full p-3 mb-4 bg-gray-700 border border-gray-600 rounded text-white h-24 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    createBox();
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false);
                  }
                }}
              />

              <div className="flex gap-2">
                <button
                  onClick={createBox}
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  style={{ fontFamily: 'Cal Sans, sans-serif' }}
                >
                  CREATE
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  style={{ fontFamily: 'Cal Sans, sans-serif' }}
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

  // Box View
  return (
    <div className="h-full w-full p-4 relative">
      {/* Background */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundImage: 'url(https://i.imgur.com/fu1Gj1m.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
          zIndex: 0
        }}
      />

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#00FFFF', fontFamily: 'Cal Sans, sans-serif', textShadow: '0px 0px 12px rgba(0, 255, 255, 0.8)' }}>
            LIFE BOX
          </h1>
          <p className="text-sm mb-4" style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}>
            Organize your thoughts into visual containers - see everything at once
          </p>

          {/* Create Box Form */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type box title and press Enter or click +"
                value={newBoxTitle}
                onChange={(e) => setNewBoxTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBoxTitle.trim()) {
                    createBox();
                  }
                }}
                className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400"
                style={{ fontFamily: 'Syne Mono, monospace' }}
              />
              <button
                onClick={createBox}
                disabled={!newBoxTitle.trim()}
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl transition-colors disabled:opacity-50"
                style={{
                  background: newBoxTitle.trim() ? '#00FFFF' : 'rgba(255, 255, 255, 0.1)',
                  color: newBoxTitle.trim() ? '#000' : '#666',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                +
              </button>
            </div>

            <textarea
              placeholder="Initial content (optional)... Press Enter to add box"
              value={newBoxContent}
              onChange={(e) => setNewBoxContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && newBoxTitle.trim()) {
                  createBox();
                }
              }}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 h-20 resize-none"
              style={{ fontFamily: 'Syne Mono, monospace' }}
            />

            <div className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}>
              💡 Press Enter to add box, or Ctrl+Enter from content area
            </div>
          </div>
        </div>

        {/* Boxes Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8" style={{ color: '#00FFFF', fontFamily: 'Syne Mono, monospace' }}>
              Loading boxes...
            </div>
          ) : boxes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📦</div>
              <div className="text-lg mb-2" style={{ color: '#00FFFF', fontFamily: 'Cal Sans, sans-serif' }}>
                No boxes yet
              </div>
              <div className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}>
                Create your first box above to get started
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boxes.map((box) => (
                <div
                  key={box.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                    selectedBoxId === box.id ? 'ring-2 ring-yellow-400 ring-opacity-75 animate-pulse' : ''
                  }`}
                  style={{
                    background: selectedBoxId === box.id
                      ? 'rgba(31, 41, 55, 0.95)'
                      : 'rgba(31, 41, 55, 0.8)',
                    borderColor: box.color,
                    borderLeftWidth: '4px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: selectedBoxId === box.id
                      ? `0 0 20px ${box.color}60`
                      : undefined
                  }}
                >
                  {/* Box Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: box.color }}
                      />
                      {editingBox === box.id ? (
                        <input
                          type="text"
                          value={box.title}
                          onChange={(e) => updateBox(box.id, { title: e.target.value })}
                          onBlur={() => setEditingBox(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') setEditingBox(null);
                          }}
                          className="bg-transparent text-white font-medium"
                          style={{ fontFamily: 'Cal Sans, sans-serif' }}
                          autoFocus
                        />
                      ) : (
                        <h3
                          className="font-medium cursor-pointer"
                          style={{ color: '#F1E2FF', fontFamily: 'Cal Sans, sans-serif' }}
                          onClick={() => setEditingBox(box.id)}
                        >
                          {box.title}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingBox(box.id)}
                        className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#F1E2FF' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteBox(box.id)}
                        className="text-xs px-2 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Box Content */}
                  <div className="space-y-1 mb-3">
                    {box.content.length === 0 ? (
                      <div
                        className="text-sm italic opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}
                        onClick={() => setEditingContent(box.id)}
                      >
                        Empty box - click to add content
                      </div>
                    ) : (
                      box.content.map((item, index) => (
                        <div
                          key={index}
                          className="text-sm flex items-start gap-2 group hover:bg-gray-700/30 p-1 rounded transition-colors"
                          style={{ color: '#E5E7EB', fontFamily: 'Syne Mono, monospace' }}
                        >
                          <span style={{ color: box.color }}>•</span>
                          {editingContent === `${box.id}-${index}` ? (
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const newContent = [...box.content];
                                newContent[index] = e.target.value;
                                updateBox(box.id, { content: newContent.join('\n') });
                              }}
                              onBlur={() => setEditingContent('')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingContent('');
                                } else if (e.key === 'Escape') {
                                  setEditingContent('');
                                }
                              }}
                              className="flex-1 bg-transparent text-white focus:outline-none focus:bg-gray-800/50 px-1 rounded"
                              style={{ fontFamily: 'Syne Mono, monospace' }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex-1 cursor-pointer hover:bg-gray-800/30 px-1 rounded"
                              onClick={() => setEditingContent(`${box.id}-${index}`)}
                            >
                              {item}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              const newContent = box.content.filter((_, i) => i !== index);
                              updateBox(box.id, { content: newContent.join('\n') });
                            }}
                            className="opacity-0 group-hover:opacity-60 hover:opacity-100 text-red-400 text-xs px-1 transition-opacity"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Item */}
                  <div className="pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <input
                      type="text"
                      placeholder="Add item..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          addContentItem(box.id, e.currentTarget.value.trim());
                          e.currentTarget.value = '';
                        }
                      }}
                      className="w-full text-xs bg-transparent text-white placeholder-gray-500 focus:outline-none"
                      style={{ fontFamily: 'Syne Mono, monospace' }}
                    />
                  </div>

                  {/* Box Footer */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: box.color }}
                      />
                      <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Syne Mono, monospace' }}>
                        {box.content.length} item{box.content.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="text-xs" style={{ color: '#6B7280', fontFamily: 'Syne Mono, monospace' }}>
                      {new Date(box.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
