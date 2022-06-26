import { useState } from "react";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import ICalParser from "ical-js-parser";
import "./App.css";
import ConnectWalletButton from "./components/ConnectWalletButton";

const App = () => {
  const backEndURL = process.env.REACT_APP_BACKEND_URL;
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
        if (!(await isRegistered(newAccounts[0]))) {
          const publicKey = await getEncryptionPublicKey(newAccounts[0]);
          registerAccount(newAccounts[0], publicKey);
        }
        setAccounts(newAccounts);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const onPressLogout = () => setAccounts(null);

  const getEncryptionPublicKey = (account) => {
    return ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [account],
    });
  };

  const encrypt = (data) => {
    getEncryptionPublicKey(accounts[0])
      .then((result) => {
        const message = ethUtil.bufferToHex(
          Buffer.from(
            JSON.stringify(
              sigUtil.encrypt({
                publicKey: result,
                data: data,
                version: "x25519-xsalsa20-poly1305",
              })
            ),
            "utf8"
          )
        );
        console.log(result);
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

  const aesDecrypt = ({ iv, cipherText }, aesKey) => {
    const decipher = createDecipheriv(
      "aes-256-cbc",
      Buffer.from(aesKey, "hex"),
      Buffer.from(iv, "hex")
    );
    return Buffer.concat([
      decipher.update(Buffer.from(cipherText, "hex")),
      decipher.final(),
    ]).toString();
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
      .then((response) => response.text())
      .then((data) => console.log(data));
  };

  const fetchCIDs = (walletAddress) => {
    fetch(backEndURL + "ipfsCids/" + walletAddress)
      .then((response) => response.json())
      .then((data) => console.log(data));
  };

  const isRegistered = async (walletAddress) => {
    const response = await fetch(
      backEndURL + "checkRegistered/" + walletAddress
    );
    const isRegistered = await response.text();
    return isRegistered !== null;
  };

  const registerAccount = (walletAddress, publicKey) => {
    const data = {
      walletAddress: walletAddress,
      publicKey: publicKey,
    };
    fetch(backEndURL + "register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Registration Successful:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        {!loading && accounts !== null ? (
          <div>
            <button onClick={() => registerAccount("0x01", "key")}>
              Register
            </button>
            <button
              onClick={() =>
                fetchFromIPFS(
                  "bafybeigr6aklj3xkofv7d55llvf7vgkk47omiiwfppgnsgirkhhx7mca34",
                  "aes"
                )
              }
            >
              Fetch File
            </button>
            <button onClick={() => fetchCIDs(accounts[0])}>Get CIDs</button>
            {/* <button onClick={() => fetchCIDs('asdf')}>Get CIDs</button> */}
            <button onClick={() => console.log(accounts[0])}>
              Current Account
            </button>
            <button onClick={() => encrypt("hello world!")}>Encrypt</button>
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
