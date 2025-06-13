# 🤖 Hybrid AI System - Claude + GPT-4 Duo

## Overview
BÆKON now supports a hybrid AI system that combines Claude and GPT-4 for optimal performance by leveraging each model's strengths.

## How It Works

### 🧠 **Claude (Reasoning Engine)**
**Best For:**
- Complex date/time parsing and reasoning
- Multi-step scheduling logic
- Calendar conflict analysis
- Detailed planning and analysis
- Precise instruction following

**Example Tasks:**
- "Schedule something for December" → Claude ensures it's December 2025
- "Move all my Tuesday meetings to Wednesday" → Claude analyzes conflicts
- "When am I free next week?" → Claude reasons through availability

### ⚡ **GPT-4 (Execution Engine)**
**Best For:**
- Function calling and API execution
- Creative conversational responses
- Code generation and technical tasks
- Natural language responses
- Real-time interaction

**Example Tasks:**
- Actually creating the calendar events
- Generating natural responses to user
- Executing database operations
- Creative suggestions and brainstorming

## Architecture Flow

```
User Input → Task Analysis → Route to Best AI(s)

📊 COMPLEX REASONING TASKS:
User → Claude (analyze & plan) → GPT-4 (execute) → User

🎨 CREATIVE TASKS:
User → GPT-4 (respond) → User

⚙️ SIMPLE TASKS:
User → GPT-4 (execute) → User
```

## Implementation

### 1. **Task Analysis**
The system automatically detects what type of task the user is requesting:

```typescript
// Reasoning patterns (→ Claude first)
- /schedule.*for.*december/i
- /next.*week.*meeting/i
- /every.*tuesday/i
- /when.*am.*i.*free/i

// Creative patterns (→ GPT-4)
- /how.*should.*i/i
- /suggest.*something/i
- /brainstorm/i
```

### 2. **Hybrid Reasoning Flow**
For complex scheduling:

1. **Claude analyzes** the request with calendar context
2. **Claude outputs** structured JSON with parsing and actions
3. **GPT-4 executes** the planned actions via function calls
4. **User gets** both reasoning and execution

### 3. **Environment Setup**
Required environment variables:
```bash
OPENAI_API_KEY=sk-proj-...          # For GPT-4 execution
ANTHROPIC_API_KEY=sk-ant-...        # For Claude reasoning
```

## Usage

### Test Endpoint
```bash
POST /api/chat-hybrid
{
  "message": "Schedule a meeting for December 15th",
  "userId": "user_id",
  "context": {...}
}
```

### Response Format
```json
{
  "response": "I've scheduled your meeting for December 15th, 2025",
  "reasoning": "Claude's step-by-step analysis...",
  "actions": [
    {
      "function": "create_event",
      "params": {...},
      "confidence": 0.95
    }
  ],
  "hybridUsed": true
}
```

## Integration Options

### Option 1: Replace Current AI
Replace calls to `/api/chat` with `/api/chat-hybrid`

### Option 2: A/B Test
Add toggle in UI to test hybrid vs GPT-4 only

### Option 3: Smart Routing
Use hybrid for complex tasks, keep GPT-4 for simple ones

## Benefits

✅ **Better Date Parsing**: Claude's superior reasoning prevents Dec 2024 vs 2025 issues
✅ **Reliable Execution**: GPT-4's proven function calling for actual operations
✅ **Best of Both**: Each AI handles what it's naturally good at
✅ **Fallback Graceful**: Falls back to GPT-4 if Claude unavailable
✅ **Transparent**: User sees reasoning + execution separately

## Current Status

- ✅ **Core system built**
- ✅ **Test endpoint ready**
- ⏳ **Need Claude API key**
- ⏳ **Integration with main chat**
- ⏳ **UI indicators for hybrid mode**

## Next Steps

1. **Get Claude API key** from Anthropic
2. **Test hybrid endpoint** with scheduling requests
3. **Compare results** vs GPT-4 only
4. **Integrate into main chat** if results are better
5. **Add UI indicators** showing which AI(s) are thinking
