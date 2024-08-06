import React, { useState, useEffect } from "react";
import {
  Client,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from "@hashgraph/sdk";
import { Button, TextField, Typography, Stack, Card, Switch, FormControlLabel } from "@mui/material";
import { useWalletInterface } from '../services/wallets/useWalletInterface';

export default function SaveTweet() {
  const { walletInterface } = useWalletInterface();
  const [client, setClient] = useState<Client | null>(null);
  const [message, setMessage] = useState("");
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);
  const [topicId, setTopicId] = useState<string>("");
  const [existingSubmitKey, setExistingSubmitKey] = useState<PrivateKey | null>(null);
  const [topicInfo, setTopicInfo] = useState<{ topicId: string, message: string, timestamp: string, submitKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(true);

  useEffect(() => {
    const accountId = process.env.REACT_APP_MY_ACCOUNT_ID;
    const privateKey = process.env.REACT_APP_MY_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      setError("Environment variables for Hedera account ID or private key are missing.");
      return;
    }

    const initialize = async () => {
      try {
        const client = Client.forTestnet();
        client.setOperator(accountId, privateKey);
        setClient(client);
      } catch (err) {
        setError(`Failed to initialize Hedera client: ${(err as Error).message}`);
      }
    };

    initialize();
  }, []);

  const createMessage = () => {
    const tweetData = {
      content: message, // Use the current state of message
    };

    const displayInstructions = {
      nameLine: 1,
      usernameLine: 2,
      tweetLines: 4,
      timestampLine: 5,
      lineSpacing: 1
    };

    return JSON.stringify({ 
      tweetData: {
        content: tweetData.content,
      }, 
      displayInstructions 
    });
  };

  const handleCreateTopic = async () => {
    if (!client) {
      setError("Hedera client is not initialized.");
      return;
    }

    try {
      const newSubmitKey = PrivateKey.generate();
      setSubmitKey(newSubmitKey);

      const messageToSend = createMessage();

      const transaction = await new TopicCreateTransaction()
        .setSubmitKey(newSubmitKey)
        .freezeWith(client)
        .sign(newSubmitKey);

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);
      const topicId = receipt.topicId;

      if (topicId) {
        const submitTransaction = await new TopicMessageSubmitTransaction()
          .setTopicId(topicId)
          .setMessage(messageToSend)
          .freezeWith(client)
          .sign(newSubmitKey);

        const submitResponse = await submitTransaction.execute(client);
        const submitRecord = await submitResponse.getRecord(client);
        const submitTimestamp = submitRecord.consensusTimestamp?.toDate().toISOString();

        setTopicInfo({
          topicId: topicId.toString(),
          message: messageToSend,
          timestamp: submitTimestamp || "N/A",
          submitKey: newSubmitKey.toString()
        });

        setMessage(""); // Clear message after submission
        setError(null);
      }
    } catch (err) {
      setError(`Failed to create topic: ${(err as Error).message}`);
    }
  };

  const handleSendToExistingTopic = async () => {
    if (!client || !topicId || !existingSubmitKey) {
      setError("Hedera client is not initialized, Topic ID, or Submit Key is missing.");
      return;
    }

    try {
      const messageToSend = createMessage(); // Create message with current state

      const submitTransaction = await new TopicMessageSubmitTransaction()
        .setTopicId(TopicId.fromString(topicId))
        .setMessage(messageToSend)
        .freezeWith(client)
        .sign(existingSubmitKey);

      const submitResponse = await submitTransaction.execute(client);
      const submitRecord = await submitResponse.getRecord(client);
      const submitTimestamp = submitRecord.consensusTimestamp?.toDate().toISOString();

      setTopicInfo({
        topicId,
        message: messageToSend,
        timestamp: submitTimestamp || "N/A",
        submitKey: existingSubmitKey.toString()
      });

      setMessage(""); // Clear message after submission
      setError(null);
    } catch (err) {
      setError(`Failed to send message to the existing topic: ${(err as Error).message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Submit Key copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    <Stack alignItems="center" spacing={6} sx={{ padding: 2 }}>
      <Typography variant="h3" color="orange">Save Your Tweet on the Hashgraph</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <FormControlLabel
        control={<Switch checked={isCreatingNew} onChange={() => setIsCreatingNew(!isCreatingNew)} />}
        label="Create New Topic"
      />
      <TextField
        label="Enter your message"
        variant="outlined"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        multiline
        rows={8}
        sx={{ backgroundColor: 'black', color: 'white', mb: 2 }}
      />
      {isCreatingNew ? (
        <Button variant="contained" color="primary" onClick={handleCreateTopic}>Save Tweet</Button>
      ) : (
        <>
          <TextField
            label="Enter Topic ID"
            variant="outlined"
            fullWidth
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            sx={{ backgroundColor: 'black', color: 'white', mb: 2 }}
          />
          <TextField
            label="Enter Submit Key"
            variant="outlined"
            fullWidth
            value={existingSubmitKey?.toString() || ""}
            onChange={(e) => setExistingSubmitKey(PrivateKey.fromString(e.target.value))}
            sx={{ backgroundColor: 'black', color: 'white', mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleSendToExistingTopic}>Send Tweet</Button>
        </>
      )}
      <Typography variant="h6" sx={{ display: 'flex', justifyContent: "flex-end"}}>This feature works with Private Topics only</Typography>
      {topicInfo && (
        <Card sx={{ padding: 3, boxShadow: 3, maxWidth: '600px', mt: 2 }}>
          <Stack spacing={2} alignItems="flex-start">
            <Typography color="primary"><strong>Topic ID:</strong> {topicInfo.topicId}</Typography>
            <Typography color="primary"><strong>Message:</strong> {topicInfo.message}</Typography>
            <Typography color="primary"><strong>Timestamp:</strong> {topicInfo.timestamp}</Typography>
            {isCreatingNew && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography color="primary" sx={{ wordBreak: 'break-all' }}><strong>Submit Key:</strong> {topicInfo.submitKey}</Typography>
                <Button variant="outlined" onClick={() => copyToClipboard(topicInfo.submitKey)}>Copy</Button>
              </Stack>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

