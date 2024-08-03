import React, { useState, useEffect } from "react";
import { AccountId, Client, PrivateKey, TopicId } from "@hashgraph/sdk";
import { Button, TextField, Typography, Switch, FormControlLabel, Stack } from "@mui/material";
import WordInputBox from '../components/WordInputBox';
import { handleWordSubmit } from '../utils/handleWordSubmit';  // Import the function
import { initializeClient } from '../utils/initializeClient';  // Import the function
import { useWalletInterface } from '../services/wallets/useWalletInterface';  // Import the hook

export default function CreateTopic() {
  const { walletInterface } = useWalletInterface();  // Correctly using the hook
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isMainnet, setIsMainnet] = useState(false);  // New state for mainnet switch
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);

  useEffect(() => {
    if (!process.env.REACT_APP_MY_ACCOUNT_ID || !process.env.REACT_APP_MY_PRIVATE_KEY) {
      setError("Environment variables for Hedera account ID or private key are missing.");
      return;
    }

    console.log(`Initializing client with isMainnet: ${isMainnet}`);
    
    const initialize = async () => {
      try {
        const initializedClient = initializeClient(walletInterface, isMainnet);  // Pass isMainnet flag
        console.log("Client initialized successfully:", initializedClient);
        setClient(initializedClient);
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to initialize Hedera client.";
        console.error(`Failed to initialize Hedera client: ${errorMessage}`);
        setError(`Failed to initialize Hedera client: ${errorMessage}`);
      }
    };

    initialize();
  }, [walletInterface, isMainnet]);

  const handlePrivateSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Private switch changed: ${event.target.checked}`);
    setIsPrivate(event.target.checked);
    setLastCreatedTopicId(null);
    setSubmitKey(null);
  };

  const handleMainnetSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`Mainnet switch changed: ${event.target.checked}`);
    setIsMainnet(event.target.checked);
  };

  const handleCopySubmitKey = () => {
    if (submitKey) {
      console.log("Attempting to copy submit key:", submitKey.toString());
      navigator.clipboard.writeText(submitKey.toString())
        .then(() => console.log("Submit key copied to clipboard."))
        .catch(err => {
          const errorMessage = (err as Error).message || "Failed to copy submit key.";
          console.error("Failed to copy submit key:", errorMessage);
        });
    }
  };

  return (
    <Stack alignItems="center" spacing={6}>
      <Typography variant="h3" color="white">
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
        sx={{ alignSelf: 'center', color: 'white' }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={isMainnet}
            onChange={handleMainnetSwitchChange}
          />
        }
        label="Use Mainnet"
        sx={{ alignSelf: 'center', color: 'white' }}
      />
      
      <WordInputBox onWordSubmit={(word) => {
        console.log("Submitting word:", word);
        handleWordSubmit(
          word,
          lastCreatedTopicId ?? undefined,
          isPrivate,
          client!,
          setTopics,
          setLastCreatedTopicId,
          setSubmitKey,
          setError
        );
      }} />
      
      <Typography variant="h4" color="white">
        Created Topics
      </Typography>
      
      <Stack spacing={2} alignItems="center">
        {topics.map((topic, index) => (
          <Stack key={index} spacing={1} alignItems="flex-start" sx={{ maxWidth: '600px', overflowWrap: 'break-word' }}>
            <Typography color="white">
              <Typography component="span" color="primary" fontWeight="bold">
                Topic ID:
              </Typography> 
              {' '}{topic.topicId.toString()} <br />
              
              <Typography component="span" color="primary" fontWeight="bold">
                Message:
              </Typography> 
              {' '}{topic.message} <br />
              
              <Typography component="span" color="primary" fontWeight="bold">
                Private:
              </Typography> 
              {' '}{topic.isPrivate ? "Yes" : "No"} <br />
              
              {topic.isPrivate && (
                <Stack
                  direction="column"
                  alignItems="flex-start"  // Align items to the start of the vertical axis
                  spacing={1}  // Adjust spacing between items if needed
                >
                  <Typography component="span" color="primary" fontWeight="bold">
                    Submit Key:
                  </Typography>
                  <TextField
                    value={topic.submitKey || ''}
                    variant="outlined"
                    multiline
                    rows={3}
                    InputProps={{ readOnly: true }}
                    sx={{ maxWidth: '100%' }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCopySubmitKey}
                  >
                    Copy Submit Key
                  </Button>
                </Stack>
              )}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}


