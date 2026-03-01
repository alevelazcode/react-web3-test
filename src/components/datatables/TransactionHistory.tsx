import { BlockchainExplorerBtn } from "@components/buttons/BlockchainExplorerBtn";
import { ClipboardCopyBtn } from "@components/buttons/CopyClipboardBtn";
import { CryptoIcon } from "@components/icons/CryptoIcon";
import { TransactionTableIcon } from "@components/TransactionIcon";
import { PercentageVariationText } from "@components/typography/PercentageVariation";
import { HistoricalData } from "@store/wallet.types";
import { formatDateUTC, formatTimeWithMeridian } from "@utils/date";
import { truncateAddr } from "@utils/truncateAddr";
import { Column, ColumnBodyOptions } from "primereact/column";
import {
  DataTable,
  DataTableRowGroupHeaderTemplateType,
} from "primereact/datatable";
import { FC, ReactNode, useMemo } from "react";

interface Props {
  loading: boolean;
  historical: HistoricalData[];
  id?: string;
}

type BodyTemplate =
  | ReactNode
  | ((
      data: HistoricalData & { day: string },
      options: ColumnBodyOptions
    ) => ReactNode);
type HeaderGroupTemplate = DataTableRowGroupHeaderTemplateType<
  (HistoricalData & { day: string })[]
>;

const AmountTemplate: BodyTemplate = rowData => {
  return (
    <div className="flex items-center gap-3">
      <CryptoIcon symbol={rowData.symbol} className="size-7" />
      <div className="flex flex-col">
        <PercentageVariationText value={rowData.amount} format="decimal" />
        <p className="m-0 p-0 font-semibold">{rowData.symbol}</p>
      </div>
    </div>
  );
};
const OperationTemplate: BodyTemplate = rowData => {
  const text = rowData.receive ? "Received" : "Sent";
  return (
    <div className="flex items-center justify-start gap-1">
      <TransactionTableIcon symbol={"ETH"} receive={rowData.receive} />
      <div>
        <p className="m-0 p-0 text-base font-medium capitalize">
          <strong>{text}</strong> {rowData.category}
        </p>
        <p className="text-base">{formatTimeWithMeridian(rowData.date)}</p>
      </div>
    </div>
  );
};
const AddressTemplate: BodyTemplate = rowData => {
  const address = rowData.receive ? rowData.fromAddress : rowData.toAddress;
  const text = Number(address) ? truncateAddr(address) : "Minted";
  return (
    <div className="flex items-center gap-1 ">
      {Number(address) ? <ClipboardCopyBtn text={address} /> : null}
      <p className="m-0 p-0 text-base font-bold">{text}</p>
    </div>
  );
};

const ExplorerTemplate: BodyTemplate = rowData => {
  return (
    <div className="flex justify-end  gap-1">
      <BlockchainExplorerBtn
        className="mr-auto self-end"
        href={rowData.urlExplorer}
      />
    </div>
  );
};
const DayHeaderTemplate: HeaderGroupTemplate = rowData => {
  return (
    <div className="flex items-center">
      <p className="m-0 p-0 text-lg font-semibold">{rowData.day}</p>
    </div>
  );
};
export const TransactionHistoryTable: FC<Props> = ({
  historical,
  loading = false,
  id = "transaction-history",
}) => {
  const historicalWithDay = useMemo(
    () => historical.map(item => ({ ...item, day: formatDateUTC(item.date) })),
    [historical]
  );

  return (
    <DataTable
      id={id}
      value={historicalWithDay}
      sortMode="single"
      rowGroupMode="subheader"
      loading={loading}
      sortField="date"
      // stripedRows={false}
      // size={"small"}
      groupRowsBy="day"
      tableClassName={"custom-datatable"}
      rowClassName={() => "custom-datatable-row"}
      rowGroupHeaderTemplate={DayHeaderTemplate}
      sortOrder={-1}
    >
      <Column
        header="Operation"
        headerClassName="custom-datatable-header"
        body={OperationTemplate}
      />
      <Column
        header="Address"
        headerClassName="custom-datatable-header"
        body={AddressTemplate}
      />
      <Column
        header="Amount"
        headerClassName="custom-datatable-header"
        body={AmountTemplate}
      />
      <Column
        header="Explorer"
        headerClassName="custom-datatable-header"
        body={ExplorerTemplate}
      />
    </DataTable>
  );
};
