import { Icon } from './Icons.jsx'

export function Checkbox({
  done, onClick, variant = 'check', showBonus = false, disabled = false, size,
}) {
  const cls = [
    'checkbox',
    done ? 'done' : '',
    variant === 'star' ? 'star' : '',
    variant === 'sticker' ? 'sticker' : '',
    showBonus ? 'with-bonus' : '',
    disabled ? 'disabled' : '',
  ].filter(Boolean).join(' ')
  const style = size ? { width: size, height: size } : undefined
  const Glyph = variant === 'check' ? Icon.Check : Icon.Star
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled} aria-pressed={done}>
      <Glyph />
    </button>
  )
}
