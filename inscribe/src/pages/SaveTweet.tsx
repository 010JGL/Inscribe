import React, { useState, useEffect } from "react";
import { Client, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import { Button, TextField, Typography, Stack, Card } from "@mui/material";
import { useWalletInterface } from '../services/wallets/useWalletInterface';

export default function SaveTweet() {
  const { walletInterface } = useWalletInterface();
  const [client, setClient] = useState<Client | null>(null);
  const [message, setMessage] = useState("");
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);
  const [topicInfo, setTopicInfo] = useState<{ topicId: string, message: string, timestamp: string, submitKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const errorMessage = (err as Error).message || "Failed to initialize Hedera client.";
        setError(`Failed to initialize Hedera client: ${errorMessage}`);
      }
    };

    initialize();
  }, []);

  const handleCreateTopic = async () => {
    if (!client) {
      setError("Hedera client is not initialized.");
      return;
    }
  
    try {
      const newSubmitKey = PrivateKey.generate();
      setSubmitKey(newSubmitKey);
  
      const tweetData = {
        name: "Leemon Baird",
        username: "@leemonbaird",
        content: "The current turmoil we are seeing reinforces the importance of getting the basics right. Distributed ledgers need governance that is responsible, decentralized, and transparent. Governance should be by well-known, diverse parties acting as checks and balances on each other.",
        timestamp: "8:59 PM · Nov 18, 2022"
      };
  
      const displayInstructions = {
        nameLine: 1,
        usernameLine: 2,
        tweetLines: 5,
        timestampLine: 7,
        lineSpacing: 1
      };
  
      const message = JSON.stringify({ tweetData, displayInstructions });
  
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
          .setMessage(message)
          .freezeWith(client)
          .sign(newSubmitKey);
  
        const submitResponse = await submitTransaction.execute(client);
        const submitRecord = await submitResponse.getRecord(client);
        const submitTimestamp = submitRecord.consensusTimestamp?.toDate().toISOString();
  
        setTopicInfo({
          topicId: topicId.toString(),
          message,
          timestamp: submitTimestamp || "N/A",
          submitKey: newSubmitKey.toString()
        });
  
        setMessage("");
        setError(null);
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "Failed to create topic.";
      setError(`Failed to create topic: ${errorMessage}`);
    }
  };
  
  

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Submit Key copied to clipboard!");
    }, (err) => {
      console.error("Failed to copy text: ", err);
    });
  };

  return (
    <Stack alignItems="center" spacing={6} sx={{ padding: 2 }}>
      <Typography variant="h3" color="orange">
        Save Your Tweet on the Hashgraph
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField
        label="Enter your message"
        variant="outlined"
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        multiline
        rows={5}
        sx={{ backgroundColor: 'black', color: 'white', mb: 2 }}
      />
      <Button variant="contained" color="primary" onClick={handleCreateTopic}>
        Save Tweet
      </Button>
      <Typography variant="h6" sx={{ display: 'flex', justifyContent: "flex-end"}}>This feature works with Private Topics only</Typography>
      {topicInfo && (
        <Card sx={{ padding: 3, boxShadow: 3, maxWidth: '600px', mt: 2 }}>
          <Stack spacing={2} alignItems="flex-start">
            <Typography color="primary">
              <strong>Topic ID:</strong> {topicInfo.topicId}
            </Typography>
            <Typography color="primary">
              <strong>Message:</strong> {topicInfo.message}
            </Typography>
            <Typography color="primary">
              <strong>Timestamp:</strong> {topicInfo.timestamp}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography color="primary" sx={{ wordBreak: 'break-all' }}>
                <strong>Submit Key:</strong> {topicInfo.submitKey}
              </Typography>
              <Button variant="outlined" onClick={() => copyToClipboard(topicInfo.submitKey)}>
                Copy
              </Button>
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
