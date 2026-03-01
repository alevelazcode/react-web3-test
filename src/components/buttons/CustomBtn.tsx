import { FCC } from "@types";
import { btnClassNames, CustomBtnProps } from "./CustomBtn.types";

export const CustomBtn: FCC<CustomBtnProps> = ({
  className = "",
  children,
  color = "primary",
  ...rest
}) => {
  return (
    <button
      type="button"
      className={`flex justify-center items-center gap-2 leading-tight
      py-2.5 outline-0 ring-0 px-3
      rounded-lg [&:not(:disabled):active]:scale-[0.97]
      origin-center transition-all ease-in-out duration-200
      ${btnClassNames[color as keyof typeof btnClassNames]}
      disabled:text-gray-500 disabled:border-gray-500 disabled:cursor-default disabled:bg-gray-600/20
      ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};
