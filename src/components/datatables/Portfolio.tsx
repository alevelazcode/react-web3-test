import { CryptoIcon } from "@components/icons/CryptoIcon";
import { PercentageVariationText } from "@components/typography/PercentageVariation";
import { CalculatedPortfolio, usePrices } from "@hooks/usePrices";
import { formatCurrency } from "@utils/formatCurrency";
import { Column, ColumnBodyOptions } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FC, ReactNode, useCallback } from "react";

type RowData = CalculatedPortfolio["wallet"]["balanceWithPrices"][number];
type BodyTemplate =
  | ReactNode
  | ((data: RowData, options: ColumnBodyOptions) => ReactNode);
const tokenTemplate: BodyTemplate = rowData => (
  <div className="flex items-center gap-3">
    <CryptoIcon width={35} height={35} symbol={rowData.symbol} />
    <div className="flex flex-col">
      <p className="m-0 p-0 font-bold ">{rowData.symbol}</p>
      <p className="m-0 p-0 font-medium ">{rowData.name}</p>
    </div>
  </div>
);

const balanceTemplate: BodyTemplate = rowData => (
  <div className="flex flex-col justify-center">
    <p className="m-0 p-0 font-bold ">
      {formatCurrency(rowData.value, "currency", "USD")}
    </p>
    <p className="m-0 p-0 font-medium">
      {formatCurrency(rowData.balance)} {rowData.symbol}
    </p>
  </div>
);

const percentageChange24hTemplate: BodyTemplate = rowData => (
  <div className="flex flex-col justify-center">
    <p className="font-bold">
      {formatCurrency(rowData.price, "currency", "USD")}
    </p>
    <PercentageVariationText value={rowData.percentage24h} />
  </div>
);

export const PortfolioTable: FC = () => {
  const { wallet, totalAmount } = usePrices();

  const percentageOfTotalTemplate: BodyTemplate = useCallback(
    (rowData: RowData) => {
      const percentage = formatCurrency(
        totalAmount > 0 ? rowData.value / totalAmount : 0,
        "percent"
      );
      return <p className="font-semibold">{percentage}</p>;
    },
    [totalAmount]
  );

  return (
    <DataTable
      value={wallet.balanceWithPrices}
      sortMode="multiple"
      tableClassName={"custom-datatable"}
      rowClassName={() => "custom-datatable-row"}
    >
      <Column
        header="Token"
        headerClassName="custom-datatable-header"
        body={tokenTemplate}
      ></Column>
      <Column
        field="balance"
        header="Balance"
        headerClassName="custom-datatable-header"
        sortable
        body={balanceTemplate}
      ></Column>
      <Column
        header="Portfolio %"
        field={"percentage24hr"}
        headerClassName="custom-datatable-header"
        sortable
        body={percentageOfTotalTemplate}
      ></Column>
      <Column
        header="Price (24hr)"
        headerClassName="custom-datatable-header"
        body={percentageChange24hTemplate}
      ></Column>
    </DataTable>
  );
};
