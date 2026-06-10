# Kindred Bloom — Amanah Full Redesign Plan

## Overview
Transformasi total UI/UX aplikasi Amanah dari desain minimal navy/gold ke **Kindred Bloom** — design system yang hangat, playful, dan family-friendly (seperti PiggyPals/PiggyBank Fun).

## Target Pages (8 core + 1 chat)
| Page | Route | Source Design |
|------|-------|--------------|
| Dashboard | `/home` | `dashboard_keluarga_bahagia` |
| Catat Transaksi | `/catat` | `catat_transaksi_ai` |
| Riwayat | `/riwayat` | `riwayat_transaksi_lengkap` |
| Statistik | `/stats` | `statistik_keuangan_ai_insight` |
| Target Tabungan + Anggota | `/goals` | `target_tabungan_keluarga` |
| Anggaran Bulanan | `/budget` | `anggaran_bulanan` |
| Kalender | `/calendar` | `kalender_keuangan_keluarga` |
| AI Chat | `/ai` | `asisten_ai_piggypals` |
| Profil | `/profile` | (existing, restyle) |

## Design System — Kindred Bloom

### Colors (Material You tokens)
```
--primary: #78555e (dusky rose)
--primary-container: #ffd1dc (soft pink)
--on-primary: #ffffff
--on-primary-container: #7a5761

--secondary: #725477 (dusty plum)
--secondary-container: #fad3fd (lavender)
--on-secondary-container: #77587c

--tertiary: #636037 (olive gold)
--tertiary-container: #e4dfac (warm cream)
--on-tertiary-container: #666239

--error: #ba1a1a
--error-container: #ffdad6

--surface: #f8f9fa
--surface-container: #edeeef
--surface-container-low: #f3f4f5
--surface-container-lowest: #ffffff
--surface-container-high: #e7e8e9
--surface-variant: #e1e3e4

--background: #f8f9fa
--on-surface: #191c1d
--on-surface-variant: #4f4446
--outline: #817476
--outline-variant: #d3c3c5
```

### Typography
- Font: **Nunito Sans** (Google Fonts) — rounded, warm, approachable
- Headline sizes: display-lg (40px), headline-lg (32px), headline-md (24px)
- Body: body-lg (18px), body-md (16px)
- Label: label-lg (14px), label-md (12px)

### Icons
- **Material Symbols** (Google Fonts CDN)
- Weight between 100-700, FILL 0 (outline) or 1 (filled)
- Usage: `<span class="material-symbols-outlined filled">home</span>`

### Border Radius
- DEFAULT: 1rem (16px)
- lg: 2rem (32px)
- xl: 3rem (48px)
- full: 9999px

### Animations (CSS keyframes)
```css
@keyframes springPop { ... }     /* Modal/card entrance */
@keyframes bounce-short { ... }  /* Bottom nav active indicator */
@keyframes pulse-soft { ... }    /* FAB pulsing */
@keyframes floatY { ... }        /* Floating mascot */
@keyframes slideUp { ... }       /* Chat messages */
@keyframes typingBounce { ... }  /* Typing dots */
```

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 1);
  box-shadow: 0 10px 30px rgba(255, 209, 220, 0.3);
}
```

### 3D Buttons
```css
.btn-primary-3d {
  background: var(--primary);
  color: var(--on-primary);
  border-radius: 9999px;
  box-shadow: 0 4px 0 var(--on-primary-fixed-variant);
}
.btn-primary-3d:active {
  box-shadow: none;
  transform: translateY(1px);
}
```

## Component Tree

### Shared Components (Phase 2)
```
components/
├── TopAppBar.tsx          — glass header with app title, avatar, notification bell
├── BottomNav.tsx          — redesigned with Material Symbols, FAB in center
├── GlassCard.tsx          — reusable glassmorphism container
├── CategoryChip.tsx       — horizontal scroll pill selector
├── PiggyMascot.tsx        — floating kawaii piggy with speech bubble
├── ProgressBar.tsx        — themed progress with emoji/icon indicator
├── TransactionCard.tsx    — history item (icon, name, amount, member)
├── SavingsGoalCard.tsx    — goal with progress bar
├── BudgetCategoryCard.tsx — budget item with status (healthy/warning/over)
├── CalendarDay.tsx        — calendar grid cell with dot indicators
├── AIChatBubble.tsx       — user/assistant chat bubble
├── VoiceButton.tsx        — mic FAB with pulse animation
└── SpriteAvatar.tsx       — colored circle avatar with initials or image
```

### Page Components (Phases 3-10)
Each page is self-contained in `pages/`.

## Implementation Order

### Phase 1: Design System Foundation
1. Replace `src/index.css` with Kindred Bloom variables
2. Import Nunito Sans + Material Symbols fonts
3. Define all animations
4. Define utility classes (glass-card, btn-primary-3d, etc.)
5. **⚠️ Preserve shadcn/ui compatibility** — shadcn needs `--background`, `--foreground`, etc.
   - Solution: map Kindred colors INTO shadcn variables
   - `--background: #f8f9fa`, `--foreground: #191c1d`, etc.

### Phase 2: Core Components
Build shared components, each reusable across pages.

### Phase 3-6: Rewrite Existing Pages
Home, Catat, Riwayat → new design, same Supabase queries.

### Phase 7-10: New Pages
Stats, Goals+Anggota, Budget, Calendar, AI Chat.

### Phase 11: Routing
- Update `App.tsx` routes
- Redesign `BottomNav.tsx` (4 tabs + center FAB: Home, Stats, Goals, Family)
- `/profile` stays accessible from TopAppBar avatar

### Phase 12: Verify
- `npm run build` → no errors
- Test on mobile viewport
- Push to GitHub → Vercel auto-deploy

## Key Design Decisions
1. **No dark mode for now** — Kindred Bloom is light-mode-only by design. Disable ThemeProvider.
2. **Keep shadcn/ui** — components that work (button, input, dialog) stay, just restyle.
3. **Supabase queries unchanged** — only UI layer changes.
4. **Voice input stays** — embed existing voice toggle into the new VoiceButton component.
5. **AI features are UI-only** — the "AI Financial Assistant" shows static insights based on data (Pengeluaran naik 18%, etc.). Real AI integration later.
6. **Family management merges into Goals page** — the `target_tabungan_keluarga` design already has family members + goals in one screen.

## Risk Mitigation
- **Breaking shadcn**: Test after every CSS change with `npm run build`
- **Font loading**: Nunito Sans via Google Fonts CDN — have Geist fallback
- **Material Symbols**: Some icon names may differ from lucide-react — map carefully
- **Build size**: Material Symbols CDN is ~30KB extra, acceptable
