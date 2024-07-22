import React, { useState, useEffect } from "react";
import {
  AccountId,
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  TransactionResponse,
  TransactionReceipt
} from "@hashgraph/sdk";
import { Button, TextField, Typography, Switch, FormControlLabel, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { Stack } from "@mui/system";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import SendIcon from '@mui/icons-material/Send';
import WordInputBox from '../components/WordInputBox';

// Initialize Hedera Client
const initializeClient = (walletInterface: any) => {
  let client;
  if (!walletInterface) {
    client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID || ""),
      PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "")
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
  isPrivate: boolean;
  submitKey?: string;
}

export default function CreateTopic() {
  const { walletInterface } = useWalletInterface();
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

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
      let newSubmitKey: PrivateKey | null = null;
  
      if (!topicId) {
        // Create a new topic
        const topicCreateTx = new TopicCreateTransaction();
        
        if (isPrivate) {
          newSubmitKey = PrivateKey.generate();
          topicCreateTx.setSubmitKey(newSubmitKey.publicKey);
          console.log("Creating topic with submit key:", newSubmitKey.toString());
        }
  
        const topicCreateSubmit = await topicCreateTx.execute(client);
        const topicCreateReceipt: TransactionReceipt = await topicCreateSubmit.getReceipt(client);
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
  
      // Split message into chunks if necessary
      const splitMessage = (message: string, maxChunkSize: number) => {
        const chunks: string[] = [];
        for (let i = 0; i < message.length; i += maxChunkSize) {
          chunks.push(message.slice(i, i + maxChunkSize));
        }
        return chunks;
      };
  
      const chunks = splitMessage(word, 1000);
  
      // Submit each chunk to the topic
      for (const chunk of chunks) {
        let messageTx = new TopicMessageSubmitTransaction()
          .setTopicId(currentTopicId)
          .setMessage(chunk);
  
        if (isPrivate && newSubmitKey) {
          try {
            console.log("Signing message with submit key:", newSubmitKey.toString());
            messageTx = await messageTx.freezeWith(client);
            messageTx = await messageTx.sign(newSubmitKey);
            console.log("Message signed successfully.");
          } catch (signError) {
            console.error("Error signing message with submit key:", signError);
            setError("Failed to sign message. Please try again.");
            return;
          }
        }
  
        try {
          const messageSubmit = await messageTx.execute(client);
          const messageReceipt = await messageSubmit.getReceipt(client);
  
          if (messageReceipt.status.toString() === "INVALID_SIGNATURE") {
            console.error("Invalid signature for message submission.");
            console.log("Submit key used:", newSubmitKey?.toString());
            console.log("Message transaction details:", messageTx);
            setError("Failed to submit message due to invalid signature. Please check your submit key.");
            return;
          }
  
          console.log("Message submitted to topic:", messageReceipt.status.toString());
        } catch (txError) {
          console.error("Error submitting message to topic:", txError);
          setError("Failed to submit message. Please try again.");
        }
      }
  
      // Add new topic and message to the state
      setTopics([...topics, { topicId: currentTopicId, message: word, isPrivate, submitKey: newSubmitKey ? newSubmitKey.toString() : undefined }]);
  
      // Open the dialog asking if the user wants to send another message
      setOpenDialog(true);
    } catch (err) {
      console.error("Error handling word submission:", err);
      setError("Failed to handle word submission. Please try again.");
    }
  };
  
  

  const handleDialogClose = (sendAnother: boolean) => {
    setOpenDialog(false);
    if (sendAnother) {
      // Reset the state to allow sending another message
      setLastCreatedTopicId(null);
      setSubmitKey(null);
      setIsPrivate(false); // Reset to default private state if needed
    }
  };

  const handlePrivateSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPrivate(event.target.checked);
    // Reset state when switching to/from private topics
    setLastCreatedTopicId(null);
    setSubmitKey(null);
  };

  return (
    <Stack alignItems="center" spacing={6}>
      <Typography variant="h4" color="orange">
        Store your wisdom on the hashgraph
      </Typography>
      {error && <Typography color="red">{error}</Typography>}
      <FormControlLabel
        control={
          <Switch
            checked={isPrivate}
            onChange={handlePrivateSwitchChange}
          />
        }
        label="Create Private Topic"
        sx={{ alignSelf: 'flex-end' }}
      />
      <WordInputBox onWordSubmit={(word) => handleWordSubmit(word, lastCreatedTopicId ?? undefined)} />
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
      <Typography variant="h6" color="orange">
        Created Topics
      </Typography>
      <Stack spacing={2} alignItems="center">
        {topics.map((topic, index) => (
          <Typography key={index} color="white" sx={{ maxWidth: '600px', justifyContent: 'flex-start' }}>
            <strong>Topic ID:</strong> {topic.topicId.toString()} <br />
            <strong>Message:</strong> {topic.message} <br />
            <strong>Private:</strong> {topic.isPrivate ? "Yes" : "No"} <br />
            {topic.isPrivate && <><strong>Submit Key:</strong> {topic.submitKey} <br /></>}
          </Typography>
        ))}
      </Stack>

      <Dialog
        open={openDialog}
        onClose={() => handleDialogClose(false)}
      >
        <DialogTitle>{"Message Sent"}</DialogTitle>
        <DialogContent>
          <Typography>
            Do you want to send another message to the same topic?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)}>No</Button>
          <Button onClick={() => handleDialogClose(true)} autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}





