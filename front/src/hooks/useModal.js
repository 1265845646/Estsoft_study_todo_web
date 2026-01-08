import { useCallback, useMemo, useState } from "react";

export default function useModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("알림");
  const [message, setMessage] = useState("");

  const openModal = useCallback((t, m) => {
    setTitle(t || "알림");
    setMessage(m || "");
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const modalProps = useMemo(
    () => ({
      open,
      title,
      message,
      onClose: closeModal,
    }),
    [open, title, message, closeModal]
  );

  return { modalProps, openModal, closeModal };
}
