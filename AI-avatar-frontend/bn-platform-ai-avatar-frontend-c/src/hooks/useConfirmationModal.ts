import { useState } from "react";

export function useConfirmationModal(initialSettings: Record<string, any> = {}) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});
  const [onCancel, setOnCancel] = useState<() => void>(() => () => {});

  const show = (settings: Record<string, any>, onConfirmCb: () => void, onCancelCb: () => void) => {
    setSettings(settings);
    setOnConfirm(() => onConfirmCb);
    setOnCancel(() => onCancelCb);
    setOpen(true);
  };

  const hide = () => setOpen(false);

  return { open, settings, onConfirm, onCancel, show, hide };
}
