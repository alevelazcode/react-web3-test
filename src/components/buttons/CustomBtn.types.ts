import { ButtonHTMLAttributes } from "react";

export const btnClassNames = {
  primary:
    "border-blue-400 text-blue-400 fill-blue-400 hover:bg-blue-400/10 focus:bg-blue-400/10",
  error:
    "border-rose-700 text-rose-700 fill-rose-700 hover:bg-rose-700/10 focus:bg-rose-700/10",
  success:
    "border-green-500 text-green-500 fill-green-700 hover:bg-green-500/10 focus:bg-green-500/10",
  text:
    "border-neutral-400 text-neutral-400 fill-neutral-400 hover:bg-neutral-400/10 focus:bg-neutral-400/10",
  metamask:
    "border-orange-500 text-orange-500 fill-orange-500 hover:bg-orange-500/10 focus:bg-orange-500/10",
};
export interface CustomBtnProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  color?: keyof typeof btnClassNames;
  loading?: boolean;
}
