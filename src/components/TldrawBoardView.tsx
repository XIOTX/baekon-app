'use client'

import React from 'react'
import { Tldraw, TldrawEditorConfig } from 'tldraw'
import 'tldraw/tldraw.css'

interface TldrawBoardViewProps {
  className?: string
  persistenceKey?: string
}

const TldrawBoardView: React.FC<TldrawBoardViewProps> = ({
  className = "",
  persistenceKey = "baekon-tldraw-board"
}) => {
  return (
    <div className={`h-full w-full relative ${className}`}>
      {/* Background with cross-grid pattern - matching original BoardView */}
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

      {/* Tldraw container with custom styling */}
      <div className="absolute inset-0 w-full h-full">
        <style jsx global>{`
          /* Custom tldraw styling to match BÆKON neon theme */
          .tl-container {
            background: transparent !important;
            font-family: 'Cal Sans', 'Syne Mono', monospace !important;
          }

          /* Canvas background */
          .tl-background {
            background: transparent !important;
          }

          /* Grid styling */
          .tl-grid {
            stroke: rgba(147, 51, 234, 0.3) !important;
            stroke-width: 1 !important;
          }

          /* UI panels styling */
          .tl-ui-panel,
          .tl-toolbar,
          .tl-toolbar__inner {
            background: rgba(31, 41, 55, 0.95) !important;
            border: 1px solid rgba(147, 51, 234, 0.5) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 8px !important;
          }

          /* Button styling */
          .tl-button {
            color: #F1E2FF !important;
            background: rgba(31, 41, 55, 0.8) !important;
            border: 1px solid rgba(147, 51, 234, 0.3) !important;
            transition: all 0.2s ease !important;
          }

          .tl-button:hover {
            background: rgba(147, 51, 234, 0.4) !important;
            border-color: rgba(147, 51, 234, 0.8) !important;
            box-shadow: 0 0 10px rgba(147, 51, 234, 0.3) !important;
          }

          .tl-button[data-state="selected"] {
            background: rgba(147, 51, 234, 0.7) !important;
            border-color: #9333ea !important;
            box-shadow: 0 0 15px rgba(147, 51, 234, 0.5) !important;
          }

          /* Text styling */
          .tl-text,
          .tl-text-input {
            color: #F1E2FF !important;
            font-family: 'Syne Mono', monospace !important;
            text-shadow: 0px 0px 8px rgba(255, 255, 255, 0.5) !important;
          }

          /* Shape styling defaults */
          .tl-shape {
            filter: drop-shadow(0 0 8px rgba(147, 51, 234, 0.3)) !important;
          }

          /* Menu styling */
          .tl-menu,
          .tl-dropdown__content {
            background: rgba(31, 41, 55, 0.95) !important;
            border: 1px solid rgba(147, 51, 234, 0.5) !important;
            backdrop-filter: blur(10px) !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 32px rgba(147, 51, 234, 0.2) !important;
          }

          .tl-menu__item {
            color: #F1E2FF !important;
            font-family: 'Syne Mono', monospace !important;
          }

          .tl-menu__item:hover {
            background: rgba(147, 51, 234, 0.3) !important;
          }

          /* Icon styling */
          .tl-icon {
            color: #F1E2FF !important;
            filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.3)) !important;
          }

          /* Minimap styling */
          .tl-minimap {
            background: rgba(31, 41, 55, 0.9) !important;
            border: 1px solid rgba(147, 51, 234, 0.5) !important;
            border-radius: 8px !important;
          }

          /* Selection styling */
          .tl-selection-bg {
            fill: rgba(147, 51, 234, 0.1) !important;
            stroke: #9333ea !important;
            stroke-width: 2 !important;
          }

          .tl-selection-fg {
            stroke: #9333ea !important;
            stroke-width: 2 !important;
          }

          /* Handles styling */
          .tl-handle {
            fill: #9333ea !important;
            stroke: #F1E2FF !important;
            stroke-width: 2 !important;
          }

          .tl-handle:hover {
            fill: #A855F7 !important;
            filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)) !important;
          }

          /* Scrollbars */
          .tl-container ::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }

          .tl-container ::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.3) !important;
          }

          .tl-container ::-webkit-scrollbar-thumb {
            background: rgba(147, 51, 234, 0.6) !important;
            border-radius: 4px !important;
          }

          .tl-container ::-webkit-scrollbar-thumb:hover {
            background: rgba(147, 51, 234, 0.8) !important;
          }
        `}</style>

        <Tldraw persistenceKey={persistenceKey} />
      </div>

      {/* Bottom instruction bar - matching original */}
      <div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-lg pointer-events-none"
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
          💡 Infinite canvas • Draw, write, and organize freely • Use tools on the left • Double-click to edit text
        </div>
      </div>
    </div>
  )
}

export default TldrawBoardView
