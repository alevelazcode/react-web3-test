import { AppError, showError } from "@utils";
import { useCallback, useState } from "react";

export const useModal = <T>() => {
  const [resolve, setResolve] = useState<(r: T) => void>();
  const [reject, setReject] = useState<(e: AppError) => void>();
  const [open, setOpen] = useState<boolean>(false);
  const [title = "Sign", setTitle] = useState<string>();

  const onError = useCallback(
    (error = "Error") => {
      showError(error);
      reject?.(new AppError(error));
      setOpen(false);
      setTitle(undefined);
    },
    [reject]
  );

  const onSuccess = useCallback(
    (data: T) => {
      resolve?.(data);
      setOpen(false);
      setTitle(undefined);
    },
    [resolve]
  );
  const invoke = useCallback((title?: string) => {
    return new Promise<T>((_resolve, _reject) => {
      if (title) setTitle(title);
      setOpen(true);
      setResolve(() => _resolve);
      setReject(() => _reject);
    });
  }, []);
  return {
    invoke,
    open,
    title,
    setOpen,
    onSuccess,
    onError,
  };
};

export type InvokeModal<T = unknown> = ReturnType<typeof useModal<T>>["invoke"];
