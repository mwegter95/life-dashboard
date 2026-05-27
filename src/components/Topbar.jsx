import { Logo } from './Logo.jsx'
import { Icon } from './Icons.jsx'

export function Topbar({
  dateStr,
  scoreToday, possibleToday, totalScore, currentStreak, level,
  onAdd,
  authSlot,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <Logo height={44} />
        <span className="date">· {dateStr}</span>
      </div>
      <div className="center">
        <span className="stat-pill">
          <span className="label">Today</span>
          <span className="v">
            {scoreToday}
            <span style={{ color: 'var(--muted)' }}>/{possibleToday}</span>
          </span>
        </span>
        <span className="stat-pill gold">
          <span className="label">Total</span>
          <span className="v">{totalScore}</span>
        </span>
        <span className="stat-pill fire">
          <span className="label">Streak</span>
          <span className="v">
            {currentStreak}
            <span style={{ color: 'var(--muted)', fontSize: 11 }}>d</span>
          </span>
        </span>
        <span className="stat-pill">
          <span className="label">Lv</span>
          <span className="v">{level.idx + 1}</span>
        </span>
      </div>
      <div className="right">
        {authSlot}
        <button className="btn primary" onClick={onAdd}>
          <Icon.Plus /> Add habit
        </button>
      </div>
    </header>
  )
}
