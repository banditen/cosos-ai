# COSOS Onboarding Strategy: Prompt to WOW

## 1. What the onboarding should actually focus on

**Founders don't want generic systems — they want specific solutions.**

Your user is not looking for another dashboard. They have a specific problem they need solved RIGHT NOW.

So the onboarding should:

**Get just enough context → Let them PROMPT what they need → Generate it in 10 seconds.**

The mental shift:
- COSOS is not "a system you configure."
- COSOS is "tell me what you need, I'll build it for you."

**Gamma → "Create your deck."**
**COSOS → "Tell me what you need help with."**

This is the killer framing.

---

## 2. The Prompt to WOW experience

🧨 **The WOW is NOT "auto-generated blueprint."**
Too vague without full company data.

🧨 **The WOW is NOT "connect your tools first."**
That's friction before value.

🧨 **The WOW IS:**

**"Tell me what you need → COSOS builds it for you in 10 seconds"**

### What matters most:

- The founder describes their ACTUAL need (not generic onboarding questions)
- COSOS generates a SPECIFIC artifact (tracker, analysis, dashboard, framework)
- The output is immediately useful (not abstract)
- Clear next action (connect tools to make it live, or answer more questions)

**This becomes the "holy shit" moment.**

---

## 3. The product concept clarifying everything

You need this framing locked in your head:

**COSOS = "What do you need help with?" → AI builds the exact thing you need.**

In other words:

- **User describes their need** (in natural language)
- **COSOS generates a specific solution** (tracker, analysis, system, report)
- **User gets immediate value** (even without integrations)
- **User connects tools** (to make it live with real data)

**THIS is where the magic is.**

---

## 4. The COSOS onboarding screens (Simplified, prompt-driven)

**Goal:** Get minimal context → Let user prompt their need → Generate specific artifact

### Screen 1 — Welcome

```
👋 Welcome to Cosos

I'm your AI operating partner. I help founders like you:
• Track what matters
• Catch problems early
• Make better decisions

Let's start by understanding your business.

[Continue →]
```

**Design:** Clean, minimal, friendly tone. No friction.

---

### Screen 2 — What stage are you at?

**Visual:**
- Large, centered question (like Gamma)
- Card-based options with icons
- Clean, spacious layout
- Back button in bottom left

**Copy:**
```
What stage are you at?

[Card with icon: Pre-launch]
[Card with icon: Early revenue]
[Card with icon: Seed]
[Card with icon: Series A]
[Card with icon: Series B+]

← Back
```

**Design notes:**
- Cards arranged in grid (2-3 per row)
- Icons from MynaUI (building, rocket, chart, etc.)
- Hover state on cards (subtle lift + border highlight)
- Auto-advance on selection (no "Continue" button)
- Back button subtle in bottom left

---

### Screen 3 — What's your primary goal?

**Visual:**
- Same layout as Screen 2
- Card-based options with icons
- More options (6-7 cards)

**Copy:**
```
What's your primary goal right now?

[Card with icon: Find product-market fit]
[Card with icon: Grow revenue]
[Card with icon: Improve retention]
[Card with icon: Ship faster]
[Card with icon: Raise funding]
[Card with icon: Reduce chaos]
[Card with icon: Other]

← Back
```

**Design notes:**
- If "Other" selected, show text input modal or next screen
- Auto-advance on selection
- Same card styling as Screen 2

---

### Screen 4 — What's your biggest challenge? (Optional)

**Visual:**
- Large text area centered
- Optional field (can skip)
- Minimal, clean

**Copy:**
```
What's your biggest challenge right now?

[Large text area]
Placeholder: "Optional - helps me give better recommendations..."

[Continue →]  [Skip →]

← Back
```

**Design notes:**
- Text area is large and inviting
- "Skip" button is subtle (not prominent)
- "Continue" button appears after typing
- Can also skip entirely

---

### Screen 5 — The Prompt (THE KEY SCREEN)

```
✨ What would you like me to help you with first?

Be specific - the more detail you give me, the better I can help.

[Large text area - inviting, prominent]

Examples:
💰 "Track our path to $100k MRR by end of year"
📉 "Figure out why our activation rate dropped last month"
🎯 "Create a dashboard for our weekly team standup"
📊 "Analyze our customer feedback and find patterns"
🚀 "Monitor our product velocity and flag bottlenecks"
📋 "Help me prepare for our board meeting next week"

Or just tell me what's on your mind:
"We're struggling with..."
"I need to understand..."
"I'm worried about..."

[Generate →]
```

**Why this is the killer screen:**
- User-driven (they tell you what they need)
- Flexible (any problem, any format)
- Examples guide them (but don't limit them)
- Feels conversational (not form-filling)

**Design notes:**
- Large, inviting text area (like Gamma's prompt)
- Examples in lighter text (inspiration, not prescription)
- "Generate" button is prominent, exciting
- Maybe add: "Or choose from templates ↓" link below

---

### Screen 4 — Generation (Loading state)

```
[Animated loading - clean, minimal]

Building your [artifact type]...

⚡️ Analyzing your request
⚡️ Generating structure
⚡️ Adding intelligence
⚡️ Almost ready...
```

**Timing:** 5-10 seconds (feels fast, builds anticipation)

---

### Screen 5 — The WOW (Generated Artifact)

**The user sees their custom-generated artifact.**

**Example 1:** If they prompted "Track our path to $100k MRR"

```
📊 Your MRR Growth Tracker

CURRENT STATE:
├─ MRR: $15,000 (you mentioned early revenue stage)
├─ Estimated growth rate: ~20% MoM (typical for seed stage)
└─ Runway: Unknown (connect Stripe to track)

TARGET:
└─ $100,000 MRR by Q4 2025 (6 months)

THE PATH:
Month 1: $15k → $20.5k (+37% needed)
Month 2: $20.5k → $28k (+37%)
Month 3: $28k → $38k (+37%)
Month 4: $38k → $52k (+37%)
Month 5: $52k → $71k (+37%)
Month 6: $71k → $97k (+37%)

⚠️ REALITY CHECK:
Typical seed-stage growth is 20% MoM.
You need 37% MoM - that's nearly 2x the norm.

🎯 WHAT I'M MONITORING:
✓ New MRR (from new customers)
✓ Expansion MRR (from upgrades)
✓ Churned MRR (lost customers)
✓ Net MRR growth rate

🚨 I'LL ALERT YOU WHEN:
• Growth rate falls below 30% MoM
• Churn rate exceeds 5%
• You're trending to miss next month's target by >10%

[Connect Stripe to activate live tracking →]
[Save to dashboard →]
[Generate something else →]
```

**Example 2:** If they prompted "We're struggling with retention"

```
🔍 Retention Analysis & Monitoring System

WHAT I NEED TO UNDERSTAND:
To help you with retention, I need to know:

1. When do users typically churn?
   □ Within first week (activation problem)
   □ After 30 days (value realization problem)
   □ After 90 days (competitive/pricing problem)
   □ Random (need to analyze patterns)

2. What type of product are you?
   □ Daily use (Slack, Notion)
   □ Weekly use (project management)
   □ Monthly use (billing, analytics)

3. Do you have any data on why users leave?
   □ Yes, we have exit surveys
   □ Yes, we track feature usage
   □ No, we're flying blind

[Answer these questions →]

OR

[Connect Posthog + Intercom now and I'll analyze your data →]

WHAT I'LL BUILD FOR YOU:
Once I have this info, I'll create:
✓ Retention cohort tracker (Day 1, 7, 30, 90)
✓ Churn risk scoring (which users are likely to leave)
✓ Usage pattern analysis (healthy vs churned users)
✓ Early warning system (alert before they churn)

[Save to dashboard →]
[Generate something else →]
```

**Why this works:**
- Specific to their actual request
- Shows intelligence (real numbers, logic, analysis)
- Clear next action (connect tools OR answer more questions)
- Immediate value (even without integrations)

---

## 💥 So what is the actual "Prompt to WOW"?

**It is this:**

**User describes what they need → COSOS generates a specific, actionable artifact in 10 seconds**

### This artifact:

- Solves their ACTUAL problem (not generic)
- Shows real intelligence (numbers, logic, frameworks)
- Works without integrations (smart templates)
- Gets better with integrations (real data)
- Has clear next actions (connect tools, answer questions, use it)

**And they got exactly what they asked for.**

---

## This is:

**COSOS = "Tell me what you need, I'll build it for you"**

**In 10 seconds.**