import { Icon } from './Icons.jsx'

const VARIANTS = [
  { id: 'trophy', glyph: '🏆', kicker: 'Victory unlocked', action: 'Keep building' },
  { id: 'medal', glyph: '🏅', kicker: 'Milestone earned', action: 'Onward' },
  { id: 'starburst', glyph: '✦', kicker: 'A bright little win', action: 'Keep shining' },
  { id: 'victory', glyph: '🎉', kicker: 'Worth celebrating', action: 'Let’s go' },
]

export function CelebrationModal({ celebration, onClose }) {
  const variant = VARIANTS[celebration.variant % VARIANTS.length]
  const { level, awards, rewardPoints, completionPoints } = celebration
  const title = level ? `Level ${level.idx + 1}: ${level.cur.name}` : 'Badge earned!'

  return (
    <div className="modal-bg celebration-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`modal celebration celebration--${variant.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
      >
        <button className="celebration-close" onClick={onClose} aria-label="Close celebration">
          <Icon.X />
        </button>
        <div className="celebration-rays" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>
        <div className="celebration-hero" aria-hidden="true">
          <span className="celebration-glyph">{variant.glyph}</span>
          <span className="celebration-orbit orbit-one">✦</span>
          <span className="celebration-orbit orbit-two">◆</span>
          <span className="celebration-orbit orbit-three">✧</span>
        </div>
        <div className="celebration-copy">
          <span className="celebration-kicker">{variant.kicker}</span>
          <h3 id="celebration-title">{title}</h3>
          <p>
            {level && awards.length
              ? 'A new level and fresh badge rewards, all from showing up.'
              : level
                ? 'Your steady work just carried you into a new level.'
                : 'That check crossed a milestone. Take the win.'}
          </p>
        </div>

        {awards.length > 0 && (
          <div className="celebration-awards">
            {awards.map(award => (
              <div className="celebration-award" key={award.id}>
                <span className="award-glyph">{award.glyph}</span>
                <span className="award-copy">
                  <strong>{award.name}</strong>
                  <span>Badge count ×{award.earnedCount}</span>
                </span>
                <span className="award-points">+{award.pointsEarned}</span>
              </div>
            ))}
          </div>
        )}

        <div className="celebration-score">
          <span className="score-total">+{completionPoints + rewardPoints}</span>
          <span className="score-label">points this check</span>
          {rewardPoints > 0 && (
            <span className="score-breakdown">
              {completionPoints} task + {rewardPoints} badge reward
            </span>
          )}
        </div>

        <button type="button" className="btn primary celebration-action" onClick={onClose}>
          {variant.action}
        </button>
      </div>
    </div>
  )
}
