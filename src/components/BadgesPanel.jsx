import { useState } from 'react'
import { badgeAwards } from '../lib/badges.js'
import { Icon } from './Icons.jsx'

export function BadgesPanel({ stats }) {
  const badges = badgeAwards(stats)
  const earnedKinds = badges.filter(b => b.earnedCount > 0).length
  const totalAwards = badges.reduce((sum, b) => sum + b.earnedCount, 0)
  const [popover, setPopover] = useState(null)

  const openBadge = (badge, e) => {
    if (popover?.badge.id === badge.id) {
      setPopover(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    const embedded = root.classList.contains('embedded')
    const styles = getComputedStyle(root)
    const visibleTop = embedded
      ? parseFloat(styles.getPropertyValue('--embed-viewport-top')) || 0
      : 0
    const visibleHeight = embedded
      ? parseFloat(styles.getPropertyValue('--embed-viewport-height')) || window.innerHeight
      : window.innerHeight
    const scrollY = embedded ? window.scrollY : 0
    const popoverW = Math.min(320, window.innerWidth - 24)
    const popoverH = 320
    const minTop = visibleTop + 12
    const maxTop = Math.max(minTop, visibleTop + visibleHeight - popoverH - 12)
    setPopover({
      badge,
      anchor: {
        top: Math.max(minTop, Math.min(rect.bottom + scrollY + 8, maxTop)),
        left: Math.max(12, Math.min(rect.left, window.innerWidth - popoverW - 12)),
      },
    })
  }

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Badges</h2>
        <span className="sub">{earnedKinds}/{badges.length} · {totalAwards} earned</span>
      </div>
      <div className="badges">
        <div className="badges-grid">
          {badges.map(b => {
            const earned = b.earnedCount > 0
            return (
              <button
                type="button"
                key={b.id}
                className={'badge' + (earned ? ' earned' : '')}
                aria-label={`${b.name}: ${b.description}`}
                aria-expanded={popover?.badge.id === b.id}
                onClick={(e) => openBadge(b, e)}
              >
                {earned && <span className="badge-count">×{b.earnedCount}</span>}
                <span className="glyph">{b.glyph}</span>
                <span className="name">{b.name}</span>
                <span className="badge-points">+{b.points}</span>
              </button>
            )
          })}
        </div>
      </div>
      {popover && (
        <BadgePopover
          badge={popover.badge}
          anchor={popover.anchor}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  )
}

function BadgePopover({ badge, anchor, onClose }) {
  return (
    <div
      className="modal-bg modal-bg--popover badge-popover-bg"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal--badge" role="dialog" aria-modal="true" style={anchor}>
        <button className="badge-popover-close" onClick={onClose} aria-label="Close badge details">
          <Icon.X />
        </button>
        <div className={'badge-popover-icon' + (badge.earnedCount ? ' earned' : '')}>
          {badge.glyph}
        </div>
        <div className="badge-popover-copy">
          <span className="badge-popover-kicker">
            {badge.earnedCount ? `Earned ×${badge.earnedCount}` : 'Not earned yet'}
          </span>
          <h3>{badge.name}</h3>
          <p>{badge.description}</p>
        </div>
        <div className="badge-progress">
          <div className="badge-progress-row">
            <span>Progress to next</span>
            <strong>{badge.progress.label}</strong>
          </div>
          <div className="badge-progress-track" aria-hidden="true">
            <span style={{ width: `${badge.progress.percent}%` }} />
          </div>
        </div>
        <div className="badge-popover-reward">
          <span>Reward each time</span>
          <strong>+{badge.points} points</strong>
        </div>
      </div>
    </div>
  )
}
