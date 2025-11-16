# COSOS Strategic Pivot: From Blueprint to Prompt-Driven Artifacts

**Date:** 2025-11-16  
**Status:** ✅ APPROVED

---

## 🎯 The Core Insight

**Original approach:** Auto-generate an "Operating System Blueprint" from onboarding answers.

**Problem:** Too vague without full company data. Unclear utility. No immediate action.

**New approach:** User prompts what they need → COSOS generates a specific artifact.

---

## 💡 The Gamma Comparison (Revised)

| Aspect | Gamma | COSOS (Old) | COSOS (New) |
|--------|-------|-------------|-------------|
| **Input** | "Create a pitch deck about X" | 8-screen onboarding | 3 questions + prompt |
| **Output** | Slide deck | Operating System Blueprint | Custom artifact (tracker, analysis, dashboard, etc.) |
| **Immediate Value** | Can present the deck | "Cool visualization... now what?" | Solves specific problem |
| **Next Action** | Edit slides, present | Unclear | Connect tools to activate |
| **WOW Factor** | "It made 20 slides!" | "Nice diagram..." | "It built exactly what I needed!" |

---

## 🔄 What Changed

### Onboarding Flow

**Before:** 8 screens of profiling questions
**After:** 3 screens (welcome, quick context, prompt)

**Key screen:** The Prompt
```
✨ What would you like me to help you with first?

[Large text area]

Examples:
💰 "Track our path to $100k MRR by end of year"
📉 "Figure out why our activation rate dropped"
🎯 "Create a dashboard for our weekly standup"
```

### The WOW Moment

**Before:** Auto-generated blueprint with goals, drivers, rules, workflows
**After:** Specific artifact based on user's prompt

**Example outputs:**
- MRR Growth Tracker (if they ask to track revenue)
- Retention Analysis System (if they're struggling with churn)
- Board Meeting Prep Package (if they need to prepare for board)
- Activation Funnel Monitor (if they want to understand drop-offs)

### The Blueprint's Role

**Before:** Core feature, front-and-center
**After:** Optional output (one of many possible artifacts)

User can still prompt "Create an operating system for my business" and get the blueprint, but it's not forced on everyone.

---

## ✅ Why This Works Better

### 1. User-Driven Value
They tell you what they need → You deliver it
(Not: You guess what they need → They're underwhelmed)

### 2. Flexible Output
Could be:
- A tracker/dashboard
- An analysis/report
- A monitoring system
- A board deck
- A decision framework
- A workflow

### 3. Progressive Enhancement
- **Without integrations:** Smart templates, frameworks, analysis based on their inputs
- **With integrations:** Real data, live monitoring, automated insights

### 4. Clear Next Action
Every output ends with:
- "Connect [tool] to make this live"
- "Answer these questions to go deeper"
- "Tell me more about [X]"

### 5. Immediate Credibility
Specific numbers, timelines, and logic (not vague advice)

---

## 📋 Updated MVP Scope

### Week 1: The Prompt Engine
1. Simple 3-screen onboarding (welcome, context, prompt)
2. Prompt input screen (the key screen)
3. LLM service that generates structured outputs based on prompts
4. Template system for common outputs (tracker, dashboard, analysis)
5. Output rendering (clean, structured display)

### Week 2: Make Outputs Actionable
1. "Connect tools" CTAs on outputs
2. Posthog integration (for product metrics)
3. Stripe integration (for revenue metrics)
4. Update outputs with real data when tools connected

### Week 3: Iteration & Polish
1. Save generated artifacts to dashboard
2. Allow editing/regenerating
3. Add more output templates
4. Improve LLM prompts based on usage

---

## 🎨 Design Principles (Unchanged)

- Minimalist UI (MynaUI icons, no emojis)
- Figtree for body, Space Grotesk for headings
- Smaller font sizes (information density)
- Cofounder tone (proactive, advising)
- Calm, intelligent, premium feel

---

## 📊 Success Metrics

### MVP Success Criteria:
- User completes onboarding in <2 minutes
- Generated artifact feels valuable (qualitative feedback)
- User connects at least 1 integration within 24 hours
- User returns to view artifact within 7 days

### Long-term Success:
- User generates multiple artifacts (shows flexibility)
- User shares artifacts (screenshot, export)
- User connects 2+ integrations (shows commitment)
- User gets value from live data updates

---

## 🚀 Next Steps

1. **Update remaining docs** (ROADMAP, TECHNICAL_SPEC, TECHNICAL_ARCHITECTURE)
2. **Build prompt engine** (LLM service for artifact generation)
3. **Create artifact templates** (MRR tracker, retention analysis, etc.)
4. **Build new onboarding flow** (3 screens)
5. **Test with founders** (validate artifact quality)

---

## 📝 Notes

- Blueprint is NOT dead - it's just one possible output
- Focus on solving specific problems, not building generic systems
- Progressive enhancement: value without integrations, more value with them
- User-driven: they tell us what they need, we build it

