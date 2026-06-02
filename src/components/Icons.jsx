/* Inline 16×16 SVG icons, ported from the prototype's `Icon` object. */
export const Icon = {
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3.5,8 6.8,11.3 12.5,5.2" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.6l1.94 4.27 4.66.5-3.5 3.13 1 4.6L8 11.9 3.9 14.1l1-4.6L1.4 6.37l4.66-.5L8 1.6z" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2z" />
      <line x1="10" y1="4" x2="12" y2="6" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M3 4.5h10M6 4.5V3a1 1 0 011-1h2a1 1 0 011 1v1.5M5 4.5l.5 8a1 1 0 001 1h3a1 1 0 001-1l.5-8" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="3.1" />
      <path d="M8 1.4v1.7M8 12.9v1.7M1.4 8h1.7M12.9 8h1.7M3.4 3.4l1.2 1.2M11.4 11.4l1.2 1.2M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.3 9.9a5.6 5.6 0 0 1-7.2-7.2 5.7 5.7 0 1 0 7.2 7.2z" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  EyeSlash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2l12 12M6.7 6.8A2 2 0 0 0 9.2 9.3M4.2 4.3C2.6 5.3 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1.1M8.8 3.1C8.5 3 8.3 3 8 3c-4.5 0-7 5-7 5s.7 1.3 2 2.5M12.5 6c.9.9 1.8 2 2.5 2 0 0-2.5 5-7 5" />
    </svg>
  ),
}
