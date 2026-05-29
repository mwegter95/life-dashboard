import { useEffect, useRef } from 'react'
import { Icon } from './Icons.jsx'

/* Lightweight confirmation dialog. Reuses the shared .modal styles; the confirm
   button is auto-focused so Enter confirms and Esc (handled by the caller) or
   the backdrop / Cancel dismisses. */
export function ConfirmModal({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onClose,
}) {
  const confirmRef = useRef(null)
  useEffect(() => { confirmRef.current?.focus() }, [])

  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal--confirm" role="alertdialog" aria-modal="true">
        <div className="modal-hd">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close"><Icon.X /></button>
        </div>
        <div className="modal-body">
          {message && <p className="confirm-msg">{message}</p>}
        </div>
        <div className="modal-foot">
          <div />
          <div className="right">
            <button className="btn ghost" onClick={onClose}>{cancelLabel}</button>
            <button
              ref={confirmRef}
              className={'btn' + (danger ? ' danger' : ' primary')}
              onClick={onConfirm}
            >
              {danger && <Icon.Trash />} {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
