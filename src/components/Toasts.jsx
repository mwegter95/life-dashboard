export function Toasts({ items }) {
  return (
    <div className="toasts">
      {items.map(t => (
        <div key={t.id} className={'toast' + (t.bonus ? ' bonus' : '')}>
          <span>{t.msg}</span>
          {t.pts != null && <span className="pts">+{t.pts}</span>}
        </div>
      ))}
    </div>
  )
}
