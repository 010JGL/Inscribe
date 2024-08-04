import React, { useState, useEffect } from "react";
import { AccountId, Client, PrivateKey, TopicId } from "@hashgraph/sdk";
import { Button, TextField, Typography, Switch, FormControlLabel, Stack, Card, CardContent } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import WordInputBox from '../components/WordInputBox';
import { handleWordSubmit } from '../utils/handleWordSubmit';  // Import the function
import { initializeClient } from '../utils/initializeClient';  // Import the function
import { useWalletInterface } from '../services/wallets/useWalletInterface';  // Import the hook

export default function CreateTopic() {
  const { walletInterface } = useWalletInterface();  // Correctly using the hook
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitKey, setSubmitKey] = useState<PrivateKey | null>(null);

  useEffect(() => {
    if (!process.env.REACT_APP_MY_ACCOUNT_ID || !process.env.REACT_APP_MY_PRIVATE_KEY) {
      setError("Environment variables for Hedera account ID or private key are missing.");
      return;
    }
    
    const initialize = async () => {
      try {
        const initializedClient = initializeClient(walletInterface);
        setClient(initializedClient);
      } catch (err) {
        const errorMessage = (err as Error).message || "Failed to initialize Hedera client.";
        setError(`Failed to initialize Hedera client: ${errorMessage}`);
      }
    };

    initialize();
  }, [walletInterface]);

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
      
      {walletInterface && (
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
                const errorMessage = (err as Error).message || "Failed to transfer HBAR.";
                console.error("Error transferring HBAR:", errorMessage);
                setError(`Failed to transfer HBAR. Please try again. ${errorMessage}`);
              }
            }}
          >
            <SendIcon />
          </Button>
        </Stack>
      )}
      
      <Typography variant="h4" color="white">
        Created Topics
      </Typography>
      
      <Stack spacing={2} alignItems="center">
        {topics.map((topic, index) => (
          <Card key={index} sx={{ maxWidth: '600px', width: '100%', backgroundColor: '#3b3b3b' }}>
            <CardContent>
              <Stack spacing={1} alignItems="flex-start" sx={{ overflowWrap: 'break-word' }}>
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
                      alignItems="flex-start"
                      spacing={1}
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
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
