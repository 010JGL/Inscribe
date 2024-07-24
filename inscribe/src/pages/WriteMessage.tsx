import React, { useEffect, useState } from "react";
import { Button, Typography, Stack, TextField, Switch, FormControlLabel, Box } from "@mui/material";
import { Client, TopicId, TopicMessageSubmitTransaction, PrivateKey } from "@hashgraph/sdk";

const WriteMessage = () => {
  const [topicIdInput, setTopicIdInput] = useState("");
  const [message, setMessage] = useState("");
  const [submitKeyInput, setSubmitKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [feedbackTopicId, setFeedbackTopicId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [localTimestamp, setLocalTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        console.log("Initializing Hedera client...");
        const hederaClient = Client.forTestnet();
        hederaClient.setOperator(
          process.env.REACT_APP_MY_ACCOUNT_ID || "",
          process.env.REACT_APP_MY_PRIVATE_KEY || ""
        );
        setClient(hederaClient);
        console.log("Hedera client initialized successfully.");
      } catch (error) {
        console.error("Error initializing Hedera client:", error);
        setError("Failed to initialize Hedera client.");
      }
    };

    initializeClient();
  }, []);

  const handleTopicIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTopicIdInput(event.target.value);
  };

  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSubmitKeyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSubmitKeyInput(event.target.value);
  };

  const handlePrivateSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPrivate(event.target.checked);
  };

  const handleSubmit = async () => {
    try {
      if (!client) throw new Error("Hedera client not initialized.");
      if (!message.trim() || !topicIdInput.trim()) throw new Error("Topic ID and Message are required.");

      const topicId = TopicId.fromString(topicIdInput.trim());
      console.log("Submitting message to topic ID:", topicId.toString());

      let messageTx = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message.trim());

      if (isPrivate) {
        if (!submitKeyInput.trim()) throw new Error("Submit key is required for private topics.");
        const submitKey = PrivateKey.fromString(submitKeyInput.trim());
        const frozenTx = await messageTx.freezeWith(client);
        messageTx = await frozenTx.sign(submitKey);
      }

      const messageSubmit = await messageTx.execute(client);
      const record = await messageSubmit.getRecord(client);
      const consensusTimestamp = record.consensusTimestamp;
      const localTimestamp = new Date(consensusTimestamp.seconds * 1000).toLocaleString();
      console.log("Message submitted successfully. Consensus timestamp:", localTimestamp);

      // Clear inputs after successful submission
      setTopicIdInput("");
      setMessage("");
      setSubmitKeyInput("");
      setFeedbackTopicId(topicId.toString());
      setFeedbackMessage(message.trim());
      setLocalTimestamp(localTimestamp);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit message. Please try again.";
      console.error("Error submitting message:", errorMessage);
      setError(errorMessage);
      setFeedbackTopicId(null);
      setFeedbackMessage(null);
      setLocalTimestamp(null);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center">
      <Stack alignItems="center" spacing={4} sx={{ maxWidth: '600px', width: '100%' }}>
        <Typography variant="h4" color="Orange">
          Write to a Topic
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isPrivate}
              onChange={handlePrivateSwitchChange}
            />
          }
          label="Write to a Private Topic"
          sx={{ alignSelf: 'flex-end' }}
        />
        <TextField
          label="Topic ID"
          multiline
          rows={1}
          value={topicIdInput}
          onChange={handleTopicIdChange}
          fullWidth
          variant="outlined"
          sx={{ marginBottom: 2 }}
        />
        <TextField
          label="Message"
          multiline
          rows={4}
          value={message}
          onChange={handleMessageChange}
          fullWidth
          variant="outlined"
          sx={{ marginBottom: 2 }}
        />
        {isPrivate && (
          <TextField
            label="Submit Key"
            multiline
            rows={2}
            value={submitKeyInput}
            onChange={handleSubmitKeyChange}
            fullWidth
            variant="outlined"
            sx={{ marginBottom: 2 }}
          />
        )}
        {error && <Typography color="error">{error}</Typography>}
        {feedbackTopicId && feedbackMessage && localTimestamp && (
          <Typography color="success.main" sx={{ whiteSpace: 'pre-wrap' }}>
            Message submitted to Topic ID: <span style={{ color: 'white' }}>{feedbackTopicId}</span> at {localTimestamp}.
            <br />
            Message: <span style={{ color: 'white' }}>"{feedbackMessage}"</span>
          </Typography>
        )}
        <Button variant="contained" onClick={handleSubmit}>
          Write to Topic
        </Button>
      </Stack>
    </Box>
  );
};

export default WriteMessage;
