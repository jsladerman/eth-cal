import Web3 from "web3";
import { useState } from "react";

import "./App.css";
import ConnectWalletButton from "./components/ConnectWalletButton";
import { isLabelWithInternallyDisabledControl } from "@testing-library/user-event/dist/utils";

const App = () => {
  const ethUtil = require("ethereumjs-util");
  const sigUtil = require("@metamask/eth-sig-util");
  const ethereum = window.ethereum;
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState(null);

  const onPressConnect = async () => {
    setLoading(true);

    try {
      if (window?.ethereum?.isMetaMask) {
        // Desktop browser
        const newAccounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        // const address = Web3.utils.toChecksumAddress(newAccounts[0]);
        setAccounts(newAccounts);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const onPressLogout = () => setAccounts(null);

  const encrypt = () => {
    ethereum
      .request({
        method: "eth_getEncryptionPublicKey",
        params: [accounts[0]], // you must have access to the specified account
      })
      .then((result) => {
        const message = ethUtil.bufferToHex(
          Buffer.from(
            JSON.stringify(
              sigUtil.encrypt({
                publicKey: result,
                data: "hello world!",
                version: "x25519-xsalsa20-poly1305",
              })
            ),
            "utf8"
          )
        );
        setEncryptedMessage(message);
        console.log("Encrypted message: " + message);
      })
      .catch((error) => {
        if (error.code === 4001) {
          // EIP-1193 userRejectedRequest error
          console.log("We can't encrypt anything without the key.");
        } else {
          console.error(error);
        }
      });
  };

  const decrypt = () => {
    ethereum
      .request({
        method: "eth_decrypt",
        params: [encryptedMessage, accounts[0]],
      })
      .then((decryptedMessage) =>
        console.log("Decrypted message: ", decryptedMessage)
      )
      .catch((error) => console.log(error.message));
  };

  const fetchFromIPFS = (cid, filename) => {
    fetch("https://ipfs.io/ipfs/" + cid + "/" + filename)
      // .then((response) => console.log(response))
      .then((response) => response.text())
      .then((data) => console.log(data));
  };

  return (
    <div className="App">
      <header className="App-header">
        {!loading && accounts !== null ? (
          <div>
            <button
              onClick={() =>
                fetchFromIPFS(
                  "bafybeib4ma6xzwgcgdehse4mbz5c6q2h7ubvnwq2jprtv43h5fciligl64",
                  "README.md"
                )
              }
            >
              Fetch File
            </button>
            <button onClick={encrypt}>Encrypt</button>
            <button onClick={decrypt}>Decrypt</button>
          </div>
        ) : null}
        <ConnectWalletButton
          onPressConnect={onPressConnect}
          onPressLogout={onPressLogout}
          loading={loading}
          accounts={accounts}
        />
      </header>
    </div>
  );
};

export default App;
