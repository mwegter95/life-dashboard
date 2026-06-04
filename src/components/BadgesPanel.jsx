import { badgeAwards } from '../lib/badges.js'

export function BadgesPanel({ stats }) {
  const badges = badgeAwards(stats)
  const earnedKinds = badges.filter(b => b.earnedCount > 0).length
  const totalAwards = badges.reduce((sum, b) => sum + b.earnedCount, 0)
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
              <div
                key={b.id}
                className={'badge' + (earned ? ' earned' : '')}
                title={`${b.description} +${b.points} points each.`}
              >
                {earned && <span className="badge-count">×{b.earnedCount}</span>}
                <span className="glyph">{b.glyph}</span>
                <span className="name">{b.name}</span>
                <span className="badge-points">+{b.points}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
