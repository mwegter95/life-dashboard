/* Two interlocking ovals — sits in the right edge of a completed daily-habit
   cell to visually link consecutive completions. See README §3-Chain link. */
export function ChainLink({ orient = 'hv', bonus = false }) {
  const Hv = (
    <>
      <ellipse cx="8"  cy="6" rx="6" ry="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="16" cy="6" rx="3" ry="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 13.2 4.6 Q 14 4 13.95 3.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 13.2 7.4 Q 14 8 13.95 8.9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  )
  const Vh = (
    <>
      <ellipse cx="8"  cy="6" rx="3" ry="5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="16" cy="6" rx="6" ry="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M 10.8 4.6 Q 10 4 10.05 3.1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 10.8 7.4 Q 10 8 10.05 8.9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </>
  )
  return (
    <span className={'chain-link' + (bonus ? ' chain-bonus' : '')} aria-hidden="true">
      <svg viewBox="0 0 24 12" width="24" height="12" overflow="visible">
        {orient === 'hv' ? Hv : Vh}
      </svg>
    </span>
  )
}
