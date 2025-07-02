# BÆKON App Development Todos

## ✅ COMPLETED - Initial Assessment
- [x] Cloned repo from XIOTX/bækon-app main-box-board-halfway branch
- [x] Read comprehensive AI manual (v26.1) and documentation
- [x] Analyzed current app structure and features
- [x] Understood voice command system and AI integration
- [x] Reviewed perpetual save and undo/redo systems

## ✅ COMPLETED - Tldraw Integration
- [x] Added tldraw package to dependencies
- [x] Created TldrawBoardView with matching BÆKON neon cyberpunk styling
- [x] Created BoardWrapper with 'Boxes' vs 'Canvas' toggle controls
- [x] Updated WorkView and LifeView to use BoardWrapper
- [x] Added section-specific persistence for board type preference
- [x] Preserved all existing BoardView functionality as fallback
- [x] Created new unique branch (tldraw-canvas-implementation)

## 🎯 IMMEDIATE PRIORITIES
- [ ] Address AI date/time confusion issues (user mentioned this is a key problem)
- [ ] Improve AI navigation within the app
- [ ] Set up voice function integration for real-time speech
- [ ] Fix sync between schedule and work/life sections
- [ ] Enable AI to edit/add items via verbal commands

## 🔧 TECHNICAL TASKS
- [ ] Test current AI chat functionality for date parsing issues
- [ ] Review voice command processing for improvements
- [ ] Analyze schedule-to-work/life sync functionality
- [ ] Check AI function calling system reliability

## 📋 CONSTRAINTS & GUIDELINES
- ⚠️ **CRITICAL**: Only work on unique branches, never overwrite existing work
- ⚠️ Be mindful of token limits - keep responses focused
- ⚠️ Don't be verbose - give relevant info only
- ✅ User wants app they can talk to that visually shows thoughts/plans
- ✅ AI should navigate/operate like a human would

## 📖 CURRENT STATE UNDERSTANDING
- App has 4 sections: SCHED, WORK, LIFE, FREEFORM
- Voice commands implemented with Web Speech API
- Hybrid AI system (Claude + GPT-4) available
- localStorage-first with perpetual save
- Box/Board view modes for work/life sections (now with tldraw option)
- Quarter-based scheduling system (4 x 6-hour blocks)
- Authentication bypassed for development

## 🚀 END GOAL
AI agent that can:
- Navigate app via voice commands
- Edit/add/manage items verbally
- Speak back in real time
- Handle dates/times accurately
- Sync across schedule/work/life seamlessly

## 🎨 TLDRAW INTEGRATION STATUS
- ✅ **Working**: Tldraw canvas with BÆKON styling
- ✅ **Working**: Toggle between Boxes and Canvas modes
- ✅ **Working**: Separate persistence per section (WORK/LIFE)
- ✅ **Working**: All original board functionality preserved
- 🔄 **Available**: User can now test both board types
