import styles from "../styles/ConnectWallet.module.css";

const ConnectWalletButton = ({
  onPressLogout,
  onPressConnect,
  loading,
  accounts,
}) => {
  return (
    <div>
      {!loading && accounts !== null ? (
        <button onClick={onPressLogout} className={styles["connect-wallet"]}>
          Disconnect
        </button>
      ) : loading ? (
        <button
          className={`${styles["connect-wallet"]} ${styles["connect-button-loading"]}`}
          disabled
        >
          <div>Loading...</div>
        </button>
      ) : (
        <button onClick={onPressConnect} className={styles["connect-wallet"]}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWalletButton;
