import { levelFor } from '../lib/levels.js'

export function StatsPanel({
  scoreToday, scoreYesterday, scoreThisWeek, scoreLastWeek,
  totalScore, bestDay, longestStreak, possibleToday,
}) {
  const lvl = levelFor(totalScore)
  const delta = scoreToday - scoreYesterday
  const weekDelta = scoreThisWeek - scoreLastWeek
  return (
    <div className="panel">
      <div className="score-card">
        <div className="row">
          <span className="level-line">
            <span className="mono">Lv.{lvl.idx + 1}</span> · <span className="level-name">{lvl.cur.name}</span>
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{totalScore} pts</span>
        </div>
        <div className="pts">
          {scoreToday}
          <span style={{ fontSize: 18, color: 'var(--muted)', marginLeft: 6 }}>/{possibleToday}</span>
        </div>
        <div className={'delta' + (delta < 0 ? ' neg' : '')}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} vs yesterday
        </div>
        <div className="level-bar"><div className="fill" style={{ width: lvl.pct + '%' }} /></div>
        <div className="to-next">
          {lvl.next
            ? `${lvl.next.threshold - totalScore} pts to ${lvl.next.name}`
            : 'Max level — keep going.'}
        </div>
      </div>
      <div className="metrics">
        <div className="m">
          <div className="label">This week</div>
          <div className="v mono">{scoreThisWeek}<span className="unit">pts</span></div>
          <div className={'compare' + (weekDelta >= 0 ? ' pos' : ' neg')}>
            {weekDelta >= 0 ? '▲' : '▼'} {Math.abs(weekDelta)} vs last
          </div>
        </div>
        <div className="m">
          <div className="label">Best day</div>
          <div className="v mono gold">{bestDay}<span className="unit">pts</span></div>
          <div className="compare">all-time high</div>
        </div>
        <div className="m">
          <div className="label">Longest streak</div>
          <div className="v mono fire">{longestStreak}<span className="unit">d</span></div>
          <div className="compare">don't break the chain</div>
        </div>
        <div className="m">
          <div className="label">Total</div>
          <div className="v">{totalScore}</div>
          <div className="compare">lifetime points</div>
        </div>
      </div>
    </div>
  )
}
