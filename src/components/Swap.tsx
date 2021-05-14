import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TokenListContainer } from "@solana/spl-token-registry";
import { Provider } from "@project-serum/anchor";
import { Swap as SwapClient } from "@project-serum/swap";
import {
  makeStyles,
  Card,
  Button,
  Paper,
  Typography,
  TextField,
} from "@material-ui/core";
import { Info, ExpandMore } from "@material-ui/icons";
import {
  MintContextProvider,
  SwapContextProvider,
  TokenListContextProvider,
  SerumDexContextProvider,
  useSwapContext,
  useTokenList,
  useOwnedTokenAccount,
  useMint,
} from "./Context";
import TokenDialog from "./TokenDialog";
import SettingsButton from "./SettingsDialog";

const useStyles = makeStyles(() => ({
  card: {
    width: "450px",
    borderRadius: "10px",
    border: "solid 1pt #e0e0e0",
  },
  cardContent: {
    marginLeft: "6px",
    marginRight: "6px",
    marginBottom: "6px",
  },
  tab: {
    width: "50%",
  },
  settingsButton: {
    padding: 0,
  },
  swapButton: {
    width: "100%",
    borderRadius: "15px",
  },
  swapToFromButton: {
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  auxilliaryLabel: {
    marginTop: "10px",
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    marginLeft: "5px",
    marginRight: "5px",
  },
}));

export default function Swap({
  style,
  provider,
  tokenList,
}: {
  style?: any;
  provider: Provider;
  tokenList: TokenListContainer;
}) {
  const swapClient = new SwapClient(provider, tokenList);
  return (
    <MintContextProvider provider={provider}>
      <SwapContextProvider swapClient={swapClient}>
        <TokenListContextProvider tokenList={tokenList}>
          <SerumDexContextProvider provider={provider}>
            <SwapInner style={style} />
          </SerumDexContextProvider>
        </TokenListContextProvider>
      </SwapContextProvider>
    </MintContextProvider>
  );
}

function SwapInner({ style }: { style?: any }) {
  const styles = useStyles();
  return (
    <div style={style}>
      <Card className={styles.card}>
        <SwapHeader />
        <div className={styles.cardContent}>
          <SwapFromForm />
          <SwapToFromButton />
          <SwapToForm />
          <AuxilliaryLabel />
          <SwapButton />
        </div>
      </Card>
    </div>
  );
}

function SwapHeader() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        margin: "8px",
      }}
    >
      <Typography
        style={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        Swap
      </Typography>
      <SettingsButton />
    </div>
  );
}

function AuxilliaryLabel() {
  const styles = useStyles();

  const { fromMint, toMint, fromAmount, toAmount } = useSwapContext();
  const toPrice = (fromAmount / toAmount).toFixed(6); // TODO: decimals per mint type.

  const tokenList = useTokenList();
  let fromTokenInfo = tokenList.filter(
    (t) => t.address === fromMint.toString()
  )[0];
  let toTokenInfo = tokenList.filter((t) => t.address === toMint.toString())[0];

  return (
    <div className={styles.auxilliaryLabel}>
      <Typography color="textSecondary"></Typography>
      <div style={{ display: "flex" }}>
        <div
          style={{
            marginRight: "10px",
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          {fromAmount !== 0 && toAmount !== 0
            ? `1 ${toTokenInfo.symbol} = ${toPrice} ${fromTokenInfo.symbol}`
            : `-`}
        </div>
        <Info />
      </div>
    </div>
  );
}

export function SwapToFromButton() {
  const styles = useStyles();
  const { swapToFromMints } = useSwapContext();
  return (
    <Button className={styles.swapToFromButton} onClick={swapToFromMints}>
      ⇅
    </Button>
  );
}

function SwapFromForm() {
  const { fromMint, setFromMint, fromAmount, setFromAmount } = useSwapContext();
  return (
    <SwapTokenForm
      mint={fromMint}
      setMint={setFromMint}
      amount={fromAmount}
      setAmount={setFromAmount}
    />
  );
}

function SwapToForm() {
  const { toMint, setToMint, toAmount, setToAmount } = useSwapContext();
  return (
    <SwapTokenForm
      mint={toMint}
      setMint={setToMint}
      amount={toAmount}
      setAmount={setToAmount}
    />
  );
}

function SwapTokenForm({
  mint,
  setMint,
  amount,
  setAmount,
}: {
  mint: PublicKey;
  setMint: (m: PublicKey) => void;
  amount: number;
  setAmount: (a: number) => void;
}) {
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const tokenAccount = useOwnedTokenAccount(mint);
  const mintAccount = useMint(mint);

  return (
    <Paper elevation={0} variant="outlined" style={{ borderRadius: "10px" }}>
      <div
        style={{
          height: "50px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <TokenButton mint={mint} onClick={() => setShowTokenDialog(true)} />
        <TextField
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          style={{
            display: "flex",
            justifyContent: "center",
            flexDirection: "column",
          }}
        />
      </div>
      <div style={{ marginLeft: "10px", height: "30px" }}>
        <Typography color="textSecondary" style={{ fontSize: "14px" }}>
          {tokenAccount && mintAccount
            ? `Balance: ${(
                tokenAccount.account.amount.toNumber() /
                10 ** mintAccount.decimals
              ).toFixed(mintAccount.decimals)}`
            : `-`}
        </Typography>
      </div>
      <TokenDialog
        setMint={setMint}
        open={showTokenDialog}
        onClose={() => setShowTokenDialog(false)}
      />
    </Paper>
  );
}

function TokenButton({
  mint,
  onClick,
}: {
  mint: PublicKey;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} style={{ width: "116px" }}>
      <TokenIcon mint={mint} style={{ width: "25px", borderRadius: "13px" }} />
      <TokenName mint={mint} />
      <ExpandMore />
    </Button>
  );
}

export function TokenIcon({ mint, style }: { mint: PublicKey; style: any }) {
  const tokenList = useTokenList();
  let tokenInfo = tokenList.filter((t) => t.address === mint.toString())[0];
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      {tokenInfo.logoURI ? (
        <img alt="token logo" style={style} src={tokenInfo.logoURI} />
      ) : (
        <div style={style}></div>
      )}
    </div>
  );
}

function TokenName({ mint }: { mint: PublicKey }) {
  const tokenList = useTokenList();
  let tokenInfo = tokenList.filter((t) => t.address === mint.toString())[0];
  return (
    <Typography style={{ marginLeft: "5px" }}>{tokenInfo.symbol}</Typography>
  );
}

function SwapButton() {
  const styles = useStyles();
  const { fromMint, toMint, fromAmount, minExpectedAmount } = useSwapContext();

  const sendSwapTransaction = async () => {
    console.log("sending swap");
  };
  return (
    <Button
      variant="contained"
      className={styles.swapButton}
      onClick={sendSwapTransaction}
    >
      Swap
    </Button>
  );
}
