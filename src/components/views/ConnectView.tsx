import { MetamaskBtn } from "@components/buttons/MetamaskBtn";
import { Container } from "@components/layouts/Container";
import { FCC } from "@types";

export const ConnectWalletView: FCC = () => {
  return (
    <Container className="flex flex-1 flex-col place-items-center items-center justify-center gap-3 py-2">
      <h1 className="m-0 p-0 text-lg font-semibold"> Connect Wallet 👇 </h1>
      <MetamaskBtn className="mx-auto w-64 max-w-full" />
    </Container>
  );
};
