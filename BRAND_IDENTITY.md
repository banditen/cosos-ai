# 🌤️ COSOS — Brand Identity Guide

## 🧭 Brand Essence

**Positioning:**  
*The Engine Room That Runs With You.*

**Core Ideas:**
- Real-time awareness
- Intelligent execution
- Quiet power
- Founder partnership
- Modern minimalism

---

## 🎨 Visual Style & Mood

**Overall Feel:**  
Light, airy, and precise — think Apple × Notion × Mission Control.  
It should feel calm, premium, and intelligent — never loud or "AI-hyped."

### Color Palette (Light Theme)

| Role | Color | Description |
|------|-------|-------------|
| **Primary** | `#F8F8F6` | Soft ivory white — elegant base |
| **Accent 1** | `#E6E0D4` | Champagne beige — warmth and sophistication |
| **Accent 2** | `#D3C9FF` | Hints of lavender-gray — signals intelligence and tech |
| **Text** | `#1A1A1A` | Deep graphite — modern, readable contrast |
| **Action / CTA** | `#3B46F1` | Muted electric blue — precision + premium tech energy |

**Usage Guidelines:**
- **Primary (`#F8F8F6`)**: Main background color for all pages
- **Accent 1 (`#E6E0D4`)**: Secondary backgrounds, subtle dividers, card backgrounds
- **Accent 2 (`#D3C9FF`)**: Highlights, badges, subtle tech accents
- **Text (`#1A1A1A`)**: All body text and headings
- **Action (`#3B46F1`)**: Primary buttons, links, interactive elements

---

## 🔠 Typography

### Primary Typefaces

**Headings:** Space Grotesk  
**Body Text:** Figtree (fallback: Inter, system-ui)

**Characteristics:**
- Geometric sans-serifs that blend modern utility with elegance
- Headlines: Thin-to-medium weights with wide spacing → evokes luxury
- Body text: Regular weight, ample line height → calm and readable

### Type Scale (Minimalist Design - Updated)

```
Hero Headline:     2.25rem / 36px (Space Grotesk, font-weight: 500)
H1:                1.875rem / 30px (Space Grotesk, font-weight: 500)
H2:                1.5rem / 24px (Space Grotesk, font-weight: 500)
H3:                1.25rem / 20px (Space Grotesk, font-weight: 500)
Body Large:        1rem / 16px (Figtree, font-weight: 400)
Body:              0.875rem / 14px (Figtree, font-weight: 400)
Body Small:        0.75rem / 12px (Figtree, font-weight: 400)
```

**Design Philosophy:**
- Reduced all font sizes by ~40% for a more minimalist, compact aesthetic
- Smaller typography creates more breathing room and reduces visual noise
- Inspired by modern SaaS dashboards (Supabase, Linear, Vercel)
- Maintains hierarchy while feeling lighter and more refined

### Example Headline Lockup

```
COSOS
The Engine Room That Runs With You.
```

*(COSOS in semi-bold, slightly expanded tracking; subheading in lighter weight.)*

---

## 🪞 Logo / Wordmark

**Logotype:**  
Use **COSOS** (all caps) in the mark for clarity and symmetry.

**Design Notes:**
- The letterforms are naturally balanced (C–S symmetry)
- Consider a slightly customized geometric sans (e.g., modify "O" or "S" to echo motion or flow)
- Optional detail: a subtle connective ligature or continuous underline pulse suggesting "system flow" or "real-time awareness"

---

## ⚙️ Interface Direction (Product UI)

**Layout:**
- Spacious, modular cards and live tiles — like a "founder's cockpit" but clean and minimal
- Generous whitespace
- Clear visual hierarchy

**Animations:**
- Smooth fades and real-time data transitions
- Subtle, not flashy
- Purpose-driven motion

**Tone:**
- Avoid "AI chat" aesthetics
- Instead, feel like a thinking workspace that's already aware
- Clean, professional, intelligent

**Microcopy Examples:**
- "Cosos has prioritized your week based on company performance."
- "3 projects are ahead of schedule. 1 needs your input."
- "Your business, in real time."

**Branding Note:**
- Use "Cosos" (title case) in all user-facing text and copy
- Use "COSOS" (all caps) only in logo, wordmark, and page titles
- This creates a friendly, approachable tone while maintaining brand recognition

---

## 💬 Brand Voice

**Tone:**  
Calm, intelligent, composed — like a trusted Chief of Staff.

**Writing Style:**
- Declarative sentences ("See everything. Decide faster. Move in sync.")
- No buzzwords like "revolutionary" or "disruptive"
- Emphasize clarity, awareness, and momentum
- Short, confident, understated — no marketing fluff

**Voice Characteristics:**
- **Confident but not arrogant**
- **Intelligent but not complex**
- **Helpful but not chatty**
- **Premium but not pretentious**

---

## 🪄 Tagline System

Use these across ads, decks, or product intros:

**Primary:**
- "The Engine Room That Runs With You." (hero)

**Supporting:**
- "Your business, in real time."
- "Awareness that leads to action."
- "Where your tools think together."
- "Run with clarity, not chaos."
- "See everything. Decide faster. Move in sync."

---

## 🎯 Design Principles

1. **Calm over Chaos**: Every design decision should reduce cognitive load
2. **Precision over Flash**: Subtle, purposeful animations and interactions
3. **Awareness over Alerts**: Information should be present, not pushy
4. **Partnership over Tool**: Feel like a trusted advisor, not just software
5. **Modern Minimalism**: Clean, spacious, elegant — never cluttered
6. **Compact Efficiency**: Smaller typography and tighter spacing for maximum information density
7. **Icons over Emojis**: Professional SVG icons (Lucide React) for a polished, consistent look

---

## 📐 Spacing & Layout (Minimalist Design - Updated)

**Base Unit:** 8px

**Common Spacing:**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px
- 4xl: 96px

**Design Philosophy:**
- Tighter spacing throughout for a more compact, efficient feel
- Reduced margins and padding by ~30-50% compared to traditional designs
- More content visible without scrolling
- Cleaner, more focused user experience

**Container Max-Width:**
- Content: 1280px
- Text: 720px

---

## 🎨 Component Styling Guidelines (Updated)

### Buttons
- **Primary**: Background `#3B46F1`, white text, 24px border radius
- **Secondary**: White background, `#1A1A1A` text, subtle border
- **Sizing**: Compact padding (`py-2 px-4`), smaller text (`text-sm`)
- **Hover states**: Subtle opacity or color shift, never jarring
- **Icons**: Use Lucide React icons (never emojis)

### Cards
- Background: `#FFFFFF` or `#E6E0D4`
- Border: Subtle, 1px, `#E6E0D4`
- Border radius: 16px
- Shadow: Minimal, soft
- **Padding**: Reduced to `p-4` for more compact feel

### Input Fields
- Background: `#FFFFFF`
- Border: 1px solid `#E6E0D4`
- Focus: Border color `#3B46F1`
- Border radius: 12px
- **Sizing**: Compact padding (`px-3 py-1.5`), smaller text (`text-sm`)

### Icons
- **Library**: Lucide React (professional SVG icons)
- **Never use emojis** - always use proper icon components
- **Sizing**: Typically `w-4 h-4` or `w-5 h-5` for minimalist feel
- **Color**: Usually `text-action` for primary icons

---

## 🚫 What to Avoid

- ❌ Bright, saturated colors
- ❌ Heavy drop shadows
- ❌ Gradient backgrounds (except very subtle)
- ❌ Overly playful illustrations
- ❌ Marketing buzzwords
- ❌ Cluttered layouts
- ❌ Aggressive animations
- ❌ "AI hype" language
- ❌ **Emojis in UI** - always use proper icon components (Lucide React)
- ❌ Large, oversized typography - keep it minimal and compact
- ❌ Excessive spacing - prefer tighter, more efficient layouts

---

## ✅ Implementation Checklist

- [x] Update global CSS with new color palette
- [x] Implement Space Grotesk and Figtree fonts
- [x] Update all button styles with compact sizing
- [x] Revise all copy to match brand voice
- [x] Update hero section
- [x] Update navigation
- [x] Update all section backgrounds
- [x] Review and update all microcopy
- [x] Ensure consistent spacing throughout (minimalist design)
- [x] Test color contrast for accessibility
- [x] Replace all emojis with Lucide React icons
- [x] Implement minimalist typography scale (reduced sizes)
- [x] Standardize "Cosos" vs "COSOS" usage
- [x] Create complete setup flow with brand-compliant design
- [x] Implement tighter spacing and compact components

