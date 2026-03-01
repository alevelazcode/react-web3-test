import { Container } from "@components/layouts/Container";
import { MainLayout } from "@components/layouts/MainLayout";
import { HomeView } from "@components/tabs/Home";
import { ConnectWalletView } from "@components/views/ConnectView";
import { NotSupportMetamask } from "@components/views/NotSupportMetamask";
import { useMetamask } from "@hooks/useMetamask";
import { PriceProvider } from "@providers/PriceProvider";
import { useWalletStore } from "@store";
import { ProgressSpinner } from "primereact/progressspinner";

const MetamaskSupported = () => {
  const { address } = useWalletStore(state => state.wallet);
  const { loading } = useMetamask();

  return loading ? (
    <Container className="flex min-h-full w-full flex-1 items-center justify-end">
      <ProgressSpinner />
    </Container>
  ) : address ? (
    <PriceProvider>
      <HomeView />
    </PriceProvider>
  ) : (
    <ConnectWalletView />
  );
};

function App() {
  const { metamaskSupported } = useWalletStore(state => state.wallet);
  return (
    <MainLayout>
      {!metamaskSupported ? <NotSupportMetamask /> : <MetamaskSupported />}
    </MainLayout>
  );
}

export default App;
