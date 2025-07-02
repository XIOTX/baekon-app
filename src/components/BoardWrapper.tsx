'use client'

import React, { useState, useEffect } from 'react'
import BoardView from './BoardView'
import TldrawBoardView from './TldrawBoardView'

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

interface BoardWrapperProps {
  boxes: Box[];
  zoom: number;
  onBoxMove: (id: string, position: { x: number; y: number }) => void;
  onBoxClick?: (id: string) => void;
  onBoxDelete?: (id: string) => void;
  onConnectionDelete?: (fromId: string, toId: string) => void;
  connectionMode?: boolean;
  selectedBoxForConnection?: string | null;
  selectedBoxId?: string | null;
  section: 'WORK' | 'LIFE';
}

const BoardWrapper: React.FC<BoardWrapperProps> = (props) => {
  const [boardType, setBoardType] = useState<'original' | 'tldraw'>('original')

  useEffect(() => {
    const savedBoardType = localStorage.getItem(`baekon-board-type-${props.section}`)
    if (savedBoardType === 'tldraw' || savedBoardType === 'original') {
      setBoardType(savedBoardType)
    }
  }, [props.section])

  const handleBoardTypeChange = (type: 'original' | 'tldraw') => {
    setBoardType(type)
    localStorage.setItem(`baekon-board-type-${props.section}`, type)
  }

  return (
    <div className="h-full w-full relative">
      <div
        className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: 'rgba(31, 41, 55, 0.95)',
          border: '1px solid rgba(147, 51, 234, 0.5)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <span
          className="text-xs font-medium"
          style={{
            color: '#F1E2FF',
            fontFamily: 'Syne Mono, monospace'
          }}
        >
          Board:
        </span>

        <button
          onClick={() => handleBoardTypeChange('original')}
          className="px-3 py-1 text-xs rounded transition-all"
          style={{
            background: boardType === 'original' ? 'rgba(147, 51, 234, 0.7)' : 'transparent',
            border: boardType === 'original' ? '1px solid #9333ea' : '1px solid rgba(147, 51, 234, 0.3)',
            color: boardType === 'original' ? 'white' : '#9CA3AF',
            fontFamily: 'Syne Mono, monospace'
          }}
        >
          Boxes
        </button>

        <button
          onClick={() => handleBoardTypeChange('tldraw')}
          className="px-3 py-1 text-xs rounded transition-all"
          style={{
            background: boardType === 'tldraw' ? 'rgba(147, 51, 234, 0.7)' : 'transparent',
            border: boardType === 'tldraw' ? '1px solid #9333ea' : '1px solid rgba(147, 51, 234, 0.3)',
            color: boardType === 'tldraw' ? 'white' : '#9CA3AF',
            fontFamily: 'Syne Mono, monospace'
          }}
        >
          Canvas
        </button>
      </div>

      {boardType === 'original' ? (
        <BoardView {...props} />
      ) : (
        <TldrawBoardView
          persistenceKey={`baekon-tldraw-${props.section.toLowerCase()}`}
          className="h-full w-full"
        />
      )}
    </div>
  )
}

export default BoardWrapper
