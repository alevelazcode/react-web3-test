import { useToast } from "@hooks";
import { FCC } from "@types";
import { copyToClipboard } from "@utils";
import { IconBtn, IconBtnProps } from "./IconBtn";

interface CopyClipboardBtnProps
  extends Omit<IconBtnProps, "onClick" | "text" | "icon"> {
  text: string;
}

export const ClipboardCopyBtn: FCC<CopyClipboardBtnProps> = ({
  text,
  ...rest
}) => {
  const { showError, showSuccess } = useToast();
  const handleCopy = async () => {
    try {
      await copyToClipboard(text);
      showSuccess("Copied to clipboard");
    } catch {
      showError("Failed to copy to clipboard");
    }
  };
  return <IconBtn icon={"pi pi-copy"} onClick={handleCopy} {...rest} />;
};
