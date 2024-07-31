import React, { useState, useEffect } from "react";
import { Client, PrivateKey, TopicId } from "@hashgraph/sdk";
import { Button, TextField, Typography, Switch, FormControlLabel, Stack } from "@mui/material";
import WordInputBox from '../components/WordInputBox';
import { handleWordSubmit } from '../utils/handleWordSubmit';
import { initializeClient } from '../utils/initializeClient';
import { useWalletInterface } from '../services/wallets/useWalletInterface';

export default function CreateTopic() {
  const { walletInterface, isConnected } = useWalletInterface();
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);
  const [networkStatus, setNetworkStatus] = useState<string>("You are on the testnet.");

  useEffect(() => {
    const initialize = async () => {
      try {
        // Set the network based on wallet connection
        const network = isConnected ? 'mainnet' : 'testnet';
        const initializedClient = initializeClient(walletInterface, network);
        setClient(initializedClient);
        setNetworkStatus(isConnected ? "Connected to mainnet." : "You are on the testnet.");
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to initialize Hedera client.";
        console.error(`Failed to initialize Hedera client: ${errorMessage}`);
        setError(null);
      }
    };

    initialize();
  }, [walletInterface, isConnected]);

  const handlePrivateSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsPrivate(event.target.checked);
    setLastCreatedTopicId(null);
    setSubmitKey(null);
  };

  const handleCopySubmitKey = () => {
    if (submitKey) {
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
      <Typography variant="h3" color="orange">
        Store your wisdom on the hashgraph
      </Typography>
      <Typography color="white">{networkStatus}</Typography> {/* Show network status here */}
      
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
      
      <WordInputBox onWordSubmit={(word) => {
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
                <Stack direction="column" alignItems="flex-start" spacing={1}>
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
