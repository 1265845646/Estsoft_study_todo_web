import Button from "./Button";

export default function Modal({
  open,
  title = "알림",
  message = "",
  confirmText = "확인",
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__card">
        <h3 className="modal__title">{title}</h3>
        <p className="modal__text">{message}</p>
        <div className="modal__actions">
          <Button variant="primary" onClick={onClose}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
