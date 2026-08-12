// src/components/OnboardGuide.jsx
// First-run guide: "What do you want to do today?" — pick a goal, it opens
// the right thing and shows a short "here's how" with next actions.
import { useState } from 'react'
import { cn } from '../lib/utils'
import { Icon } from './Icon'
import { Modal } from './ui'

const GOALS = [
  {
    id: 'edit',
    icon: 'image',
    title: 'Edit a photo',
    desc: 'Open an image and fix it up',
    action: 'open',
    steps: ['Open / Add Media → pick a photo', 'Run one-click Actions from the Actions tab', 'Type in the search bar: "thinner", "steel", "remove background"…'],
  },
  {
    id: 'fix',
    icon: 'sparkle',
    title: 'Fix / clean an image',
    desc: 'Auto Enhance, Remove BG, retouch, denoise',
    action: 'fix',
    steps: ['Open your photo', 'Use the Quick Pick: Auto Enhance, Remove BG, Denoise…', 'Or search "enhance", "remove background", "denoise"'],
  },
  {
    id: 'collage',
    icon: 'grid',
    title: 'Make a collage',
    desc: 'Grid layouts or copy a reference',
    action: 'collage',
    steps: ['Start from a Template → pick a collage layout', 'Or upload a reference image to copy its layout', 'Add photos → Build Collage → click any photo to Replace/Remove'],
  },
  {
    id: 'template',
    icon: 'shape',
    title: 'Create a template',
    desc: 'Platform size or a custom layout',
    action: 'template',
    steps: ['Start from a Template → platform sizes', 'Add your own size: Export → ＋ Add size', 'Or save a collage layout from a reference image'],
  },
  {
    id: 'export',
    icon: 'export',
    title: 'Export for a platform',
    desc: 'Instagram, YouTube, custom sizes…',
    action: 'export',
    steps: ['Open a template or photo', 'Press ⌘/Ctrl+E or click Export', 'Check the sizes you need → download files or a .zip'],
  },
  {
    id: 'restore',
    icon: 'clock',
    title: 'Restore an old photo',
    desc: 'Creases, scratches, faded tone',
    action: 'restore',
    steps: ['Open the old photo', 'Search "restore" or "old photo" in the search bar', 'Run Restore Old Photo, Repair Creases, Dust & Scratches'],
  },
]

export function OnboardGuide({ open, onClose, onPick, hasProjects }) {
  const [phase, setPhase] = useState('goals') // 'goals' | 'steps'
  const [goal, setGoal] = useState(null)

  const choose = (g) => {
    setGoal(g)
    onPick(g.action)
    setPhase('steps')
  }
  const done = () => {
    try { localStorage.setItem('inkception.onboard', '1') } catch { /* ignore */ }
    setPhase('goals'); setGoal(null); onClose()
  }

  return (
    <Modal open={open} onClose={done} title="Welcome to Inkception" subtitle="What do you want to do today? Everything is free & runs on this device." width="max-w-2xl">
      {phase === 'goals' && (
        <div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => choose(g)}
                className="group flex items-start gap-3 rounded-ink border border-line p-3 text-left transition-colors hover:border-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ink bg-white/10 text-fg transition-colors group-hover:bg-white group-hover:text-black">
                  <Icon name={g.icon} size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-fg">{g.title}</span>
                  <span className="mt-0.5 block text-[10px] text-mute">{g.desc}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-ink border border-line bg-surface-2/50 px-3 py-2">
            <span className="text-[9px] leading-relaxed text-mute">
              {hasProjects ? 'You can always pick a project from your list below, or start fresh above.' : 'Tip: everything is private — no account, no uploads, nothing leaves your browser.'}
            </span>
            <ButtonGhost onClick={done}>Skip</ButtonGhost>
          </div>
        </div>
      )}

      {phase === 'steps' && goal && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <button type="button" onClick={() => setPhase('goals')} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.1em] text-dim transition-colors hover:text-white">
              <Icon name="chevronLeft" size={12} /> Back
            </button>
            <span className="label-xs text-mute">/ pick another goal</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-ink border border-line bg-surface-2/50 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ink bg-white text-black"><Icon name={goal.icon} size={14} /></span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-fg">{goal.title}</div>
              <div className="text-[9px] text-mute">{goal.desc}</div>
            </div>
          </div>
          <ol className="mt-3 space-y-2">
            {goal.steps.map((st, i) => (
              <li key={i} className="flex gap-2.5 text-[11px] leading-relaxed text-fg">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white">{i + 1}</span>
                <span>{st}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center justify-end gap-2 border-t border-line pt-3">
            <ButtonGhost onClick={() => setPhase('goals')}>Pick another</ButtonGhost>
            <button type="button" onClick={done} className="rounded-ink bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[#e8e8e8]">
              Got it — let's start
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

function ButtonGhost({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 rounded-ink border border-line px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-dim transition-colors hover:border-white hover:text-white">
      {children}
    </button>
  )
}
