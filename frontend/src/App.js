import { useState } from "react";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import ICalParser from "ical-js-parser";
import "./App.css";
import ConnectWalletButton from "./components/ConnectWalletButton";
import { decrypt } from "@metamask/eth-sig-util";

const App = () => {
  const backEndURL = process.env.REACT_APP_BACKEND_URL;
  const ethUtil = require("ethereumjs-util");
  const sigUtil = require("@metamask/eth-sig-util");
  const ethereum = window.ethereum;
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState(null);
  const [cidList, setCidList] = useState(null);

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
        fetchCIDs(newAccounts[0]);
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

  const decryptKey = async (encryptedKey) => {
    return await ethereum
      .request({
        method: "eth_decrypt",
        params: [encryptedKey, accounts[0]],
      })
      .catch((error) => console.log(error.message));
  };

  const decryptEverything = async () => {
    // cidList.forEach(async (cid) => {

    const cid = cidList[1];
    const encryptedKey = await fetchFromIPFS(cid, "aes");
    const decryptedKey = await decryptKey(encryptedKey);
    console.log(decryptedKey);

    const icsPayload = await fetchFromIPFS(cid, "ics", true);
    console.log(icsPayload);
    const icsFile = aesDecrypt(
      { iv: icsPayload.iv, cipherText: icsPayload.cipherText },
      decryptedKey
    );
    console.log(icsFile);

    // hacky but it's a hackathon
    const element = document.createElement("a");
    const file = new Blob([icsFile], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "eth-cal.ics";
    document.body.appendChild(element);
    element.click();

    // });
  };

  const fetchFromIPFS = async (cid, filename, json = false) => {
    return await fetch("https://ipfs.io/ipfs/" + cid + "/" + filename).then(
      (response) => (json ? response.json() : response.text())
    );
  };

  const fetchCIDs = (walletAddress) => {
    fetch(backEndURL + "ipfsCids/" + walletAddress)
      .then((response) => response.json())
      .then((data) => {
        setCidList(data);
        console.log(data);
      });
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
            {/* <button onClick={() => registerAccount("0x01", "key")}>
              Register
            </button> */}
            {/* <button
              onClick={() =>
                fetchFromIPFS(
                  "bafybeigr6aklj3xkofv7d55llvf7vgkk47omiiwfppgnsgirkhhx7mca34",
                  "aes"
                )
              }
            >
              Fetch File
            </button> */}
            {/* <button onClick={() => fetchCIDs(accounts[0])}>Get CIDs</button> */}
            {/* <button onClick={() => fetchCIDs('asdf')}>Get CIDs</button> */}
            {/* <button onClick={() => console.log(accounts[0])}>
              Current Account
            </button> */}
            {/* <button onClick={() => encrypt("hello world!")}>Encrypt</button> */}
            <button style={downloadBtnStyle} onClick={decryptEverything}>
              Download Calendar
            </button>
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

const downloadBtnStyle = {
  backgroundColor: "#4CAF50",
  marginBottom: "58px",
  cursor: "pointer",
  border: "none",
  borderRadius: "38px",
  color: "white",
  padding: "55px 72px",
  textAlign: "center",
  fontWeight: "bold",
  fontFamily: "Comic Sans MS",
  fontSize: "46px",
};

export default App;
