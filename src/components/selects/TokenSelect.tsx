import { CryptoIcon } from "@components/icons/CryptoIcon";
import { UnitNetwork } from "@constants/unitNetwork";
import { useWalletStore } from "@store";
import { DropdownProps } from "primereact/dropdown";
import { FC, ReactNode, useCallback, useMemo } from "react";
import { CustomSelect } from "./Select";
import { SelectProps } from "./Select.types";

type Template = (option: string, props: DropdownProps) => ReactNode;
type TemplateFooter =
  | ReactNode
  | ((props: DropdownProps, hide: () => void) => ReactNode);
type ItemTemplate = (option: string) => ReactNode;
type TokenSelectProps = SelectProps;

const selectedTokenTemplate: Template = (option, props) => {
  if (option) {
    return (
      <div className="align-items-center flex gap-1">
        <CryptoIcon symbol={option} className="size-5" />
        <p>{option}</p>
      </div>
    );
  }
  return <span>{props.placeholder}</span>;
};

const tokenOptionTemplate: ItemTemplate = option => (
  <div className="align-items-center flex gap-1">
    <CryptoIcon symbol={option} className="size-5" />
    <p>{option}</p>
  </div>
);

export const TokenSelect: FC<TokenSelectProps> = ({
  onChange,
  value,
  ...rest
}) => {
  const { contractAddress, network } = useWalletStore(state => state.wallet);
  const defaultValue = useMemo(() => UnitNetwork[network], [network]);
  const tokens = useMemo(
    () => [defaultValue as string].concat(Object.keys(contractAddress)),
    [defaultValue, contractAddress]
  );

  const panelFooterTemplate: TemplateFooter = useCallback(
    () => (
      <div className="px-3 py-2">
        {value ? (
          <p>
            <b>{value}</b> selected.
          </p>
        ) : (
          "No Token selected."
        )}
      </div>
    ),
    [value]
  );

  return (
    <CustomSelect
      options={tokens}
      onChange={onChange}
      defaultValue={defaultValue}
      valueTemplate={selectedTokenTemplate}
      panelFooterTemplate={panelFooterTemplate}
      itemTemplate={tokenOptionTemplate}
      value={value}
      {...rest}
    />
  );
};
