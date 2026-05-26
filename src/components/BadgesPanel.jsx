import { BADGE_DEFS } from '../lib/badges.js'

export function BadgesPanel({ stats }) {
  const earnedCount = BADGE_DEFS.filter(b => b.check(stats)).length
  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>Badges</h2>
        <span className="sub">{earnedCount}/{BADGE_DEFS.length}</span>
      </div>
      <div className="badges">
        <div className="badges-grid">
          {BADGE_DEFS.map(b => {
            const earned = b.check(stats)
            return (
              <div key={b.id} className={'badge' + (earned ? ' earned' : '')} title={b.name}>
                <span className="glyph">{b.glyph}</span>
                <span className="name">{b.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
