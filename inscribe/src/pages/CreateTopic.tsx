import React, { useState, useEffect } from "react";
import {
  AccountId,
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";
import { Button, TextField, Typography } from "@mui/material";
import { Stack } from "@mui/system";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import SendIcon from '@mui/icons-material/Send';
import WordInputBox from '../components/WordInputBox';

// Initialize Hedera Client
const initializeClient = (walletInterface: any) => {
  console.log("Account ID:", process.env.REACT_APP_MY_ACCOUNT_ID);
  console.log("Private Key:", process.env.REACT_APP_MY_PRIVATE_KEY);

  let client;
  if (!walletInterface) {
    client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID || ""),
      process.env.REACT_APP_MY_PRIVATE_KEY || ""
    );
  } else {
    client = Client.forNetwork(walletInterface.network);
    client.setOperator(
      walletInterface.accountId,
      walletInterface.privateKey
    );
  }
  return client;
};

interface TopicInfo {
  topicId: TopicId;
  message: string;
}

export default function WriteTopic() {
  const { walletInterface } = useWalletInterface();
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topics, setTopics] = useState<TopicInfo[]>([]); // State to store created topic IDs and messages
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null); // State to store the last created topic ID

  useEffect(() => {
    if (!process.env.REACT_APP_MY_ACCOUNT_ID || !process.env.REACT_APP_MY_PRIVATE_KEY) {
      setError("Environment variables for Hedera account ID or private key are missing.");
    } else {
      setClient(initializeClient(walletInterface));
    }
  }, [walletInterface]);

  const handleWordSubmit = async (word: string, topicId?: TopicId) => {
    if (error) {
      console.error("Cannot submit word due to configuration error:", error);
      return;
    }

    if (!client) {
      console.error("Hedera client not initialized.");
      return;
    }

    try {
      console.log('Submitted word:', word);

      let currentTopicId: TopicId;

      if (!topicId) {
        // Create a new topic
        const topicCreateTx = new TopicCreateTransaction();
        const topicCreateSubmit = await topicCreateTx.execute(client);
        const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
        const newTopicId: TopicId | null = topicCreateReceipt.topicId;

        if (newTopicId === null) {
          throw new Error("Failed to create topic");
        }

        console.log("New topic created with ID:", newTopicId.toString());
        setLastCreatedTopicId(newTopicId); // Update last created topic ID
        currentTopicId = newTopicId;
      } else {
        currentTopicId = topicId;
      }

      // Submit a message to the topic
      const messageTx = new TopicMessageSubmitTransaction({
        topicId: currentTopicId,
        message: word
      });
      const messageSubmit = await messageTx.execute(client);
      const messageReceipt = await messageSubmit.getReceipt(client);

      console.log("Message submitted to topic:", messageReceipt.status.toString());

      // Add new topic and message to the state
      setTopics([...topics, { topicId: currentTopicId, message: word }]);
    } catch (err) {
      console.error("Error submitting word to topic:", err);
      setError("Failed to submit word. Please try again.");
    }
  };

  return (
    <Stack alignItems="center" spacing={6}>
      <Typography variant="h4" color="white">
        Let's buidl a dApp on Hedera
      </Typography>
      <Typography variant="h6" color="teal">
        Store your wisdom on the hashgraph
      </Typography>
      {error && <Typography color="red">{error}</Typography>}
      <WordInputBox onWordSubmit={(word) => handleWordSubmit(word)} />
      {lastCreatedTopicId && (
        <>
          <Typography variant="h6" color="teal">
            Submit another message to Topic {lastCreatedTopicId.toString()}
          </Typography>
          <WordInputBox onWordSubmit={(word) => handleWordSubmit(word, lastCreatedTopicId)} />
        </>
      )}
      {walletInterface !== null && (
        <>
          <Stack direction='row' gap={2} alignItems='center'>
            <Typography>Transfer</Typography>
            <TextField
              type='number'
              label='amount'
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
              sx={{ maxWidth: '100px' }}
            />
            <Typography>HBAR to</Typography>
            <TextField
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              label='account id or evm address'
            />
            <Button
              variant='contained'
              onClick={async () => {
                try {
                  const txId = await walletInterface.transferHBAR(AccountId.fromString(toAccountId), amount);
                  console.log("Transaction successful with ID:", txId);
                } catch (err) {
                  console.error("Error transferring HBAR:", err);
                  setError("Failed to transfer HBAR. Please try again.");
                }
              }}
            >
              <SendIcon />
            </Button>
          </Stack>
        </>
      )}
      {/* Display created topics and messages */}
      <Typography variant="h6" color="teal">
        Created Topics
      </Typography>
      <Stack spacing={2}>
        {topics.map((topic, index) => (
          <Typography key={index} variant="body1" color="white">
            <strong>Topic {index + 1}:</strong> {topic.topicId.toString()} <br />
            <strong>Message:</strong> {topic.message}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
