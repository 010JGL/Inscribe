import React, { useState, useCallback, useEffect } from 'react';
import { Typography, Button, CircularProgress, LinearProgress, Container } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { AccountId, Client, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import SendIcon from '@mui/icons-material/Send';
import { useWalletInterface } from "../services/wallets/useWalletInterface";

// Your component logic here


// Ensure the worker is set up correctly
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const initializeClient = (walletInterface: any) => {
  const client = walletInterface
    ? Client.forNetwork(walletInterface.network).setOperator(walletInterface.accountId, walletInterface.privateKey)
    : Client.forTestnet().setOperator(
        AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID || ""),
        PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "")
      );
  return client;
};

const splitMessagesIntoChunks = (message: string, maxChunkSize: number = 100000) => {
  const chunks = [];
  for (let i = 0; i < message.length; i += maxChunkSize) {
    chunks.push(message.slice(i, i + maxChunkSize));
  }
  return chunks;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const submitMessageToHedera = async (message: string, topicId: TopicId, client: Client, submitKey?: PrivateKey) => {
  console.log('Submitting message to topic:', topicId.toString());
  const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(message);

  if (submitKey) {
    // Freeze the transaction first
    await tx.freezeWith(client);
    // Sign the transaction with the submit key
    await tx.sign(submitKey);
  }

  const txResponse = await tx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log('Message submit receipt:', receipt.status.toString());
};

const submitMessageWithRetries = async (message: string, topicId: TopicId, client: Client, submitKey?: PrivateKey, maxRetries: number = 10) => {
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      await submitMessageToHedera(message, topicId, client, submitKey);
      console.log('Message submitted successfully');
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('Rate limit hit, retrying...');
        await sleep(1000 * Math.pow(2, attempts)); // Exponential backoff
      } else {
        console.error('Unexpected error:', error);
        break;
      }
    }
  }
  console.error('Max attempts reached, failed to submit message');
};

const UploadPDF = () => {
  const { walletInterface } = useWalletInterface();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [showTopicSwitch, setShowTopicSwitch] = useState(false);
  const [uploadingMessages, setUploadingMessages] = useState(false);
  const [topics, setTopics] = useState<{ topicId: TopicId; message: string; submitKey?: PrivateKey }[]>([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);

  useEffect(() => {
    if (!process.env.REACT_APP_MY_ACCOUNT_ID || !process.env.REACT_APP_MY_PRIVATE_KEY) {
      setError("Environment variables for Hedera account ID or private key are missing.");
    } else {
      setClient(initializeClient(walletInterface));
    }
  }, [walletInterface]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
    setSuccess(null);
    setProgress(0);
    setShowTopicSwitch(false);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const pdfData = new Uint8Array(reader.result as ArrayBuffer);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const numPages = pdf.numPages;

        let extractedText = '';

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter((item: any) => typeof item === 'object' && 'str' in item)
            .map((item: any) => item.str)
            .join(' ');
          extractedText += pageText + '\n';

          setProgress(Math.min((pageNum / numPages) * 100, 100));
        }

        setPdfText(extractedText);
        setSuccess('File processed successfully');
        setShowTopicSwitch(true);
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error);
        setError('Error reading file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!client) {
      setError('Client is not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize transaction
      let topicCreateTx = new TopicCreateTransaction();

      // Set submit key and admin key only if the topic is private
      let submitKey: PrivateKey | undefined;

      if (isPrivate) {
        submitKey = PrivateKey.generate();
        topicCreateTx = topicCreateTx.setSubmitKey(submitKey.publicKey);
        topicCreateTx = topicCreateTx.setAdminKey(submitKey);
        console.log("Generated submit key:", submitKey.toString());
      }

      // Execute the transaction
      const txResponse = await topicCreateTx.execute(client);
      const receipt = await txResponse.getReceipt(client);
      const topicId = receipt.topicId!;

      setLastCreatedTopicId(topicId);

      if (isPrivate && submitKey) {
        setSuccess(`Private topic created successfully. Submit Key: ${submitKey.toString()}`);
      } else {
        setSuccess('Topic created successfully');
      }

      // Add the topic to the list of topics
      setTopics(prev => [
        ...prev,
        { topicId, message: pdfText || '', submitKey }
      ]);
    } catch (error) {
      console.error('Error creating topic:', error);
      setError('Error creating topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uploadMessages = async () => {
      if (pdfText && client && !uploadingMessages) {
        const messages = splitMessagesIntoChunks(pdfText, 8000); // 100KB max chunk size
        console.log(`Total messages to upload: ${messages.length}`);
        messages.forEach((msg, index) => console.log(`Message ${index + 1} size: ${msg.length}`));
  
        setUploadingMessages(true);
        let currentIndex = 0;
  
        while (currentIndex < messages.length) {
          const chunkMessages = messages.slice(currentIndex, currentIndex + 100); // Upload 100 messages at a time
          await handleCreateTopic(); // Create a new topic
          const currentTopicId = lastCreatedTopicId;
  
          if (currentTopicId) {
            for (const message of chunkMessages) {
              await submitMessageWithRetries(message, currentTopicId, client, isPrivate ? PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "") : undefined);
              setProgress(prev => Math.min(prev + (100 / messages.length), 100));
              await sleep(10000); // Wait 10 seconds between messages
            }
  
            setTopics(prev => [
              ...prev,
              { topicId: currentTopicId, message: pdfText || '', submitKey: isPrivate ? PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "") : undefined }
            ]);
  
            currentIndex += chunkMessages.length;
          } else {
            setError('Failed to create topic');
            break;
          }
        }
  
        setUploadingMessages(false);
        setSuccess('Messages uploaded successfully');
      }
    };
  
    uploadMessages();
  }, [pdfText, client, lastCreatedTopicId, uploadingMessages, isPrivate]);

  return (
    <Container>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
        }}
      >
        <div {...getRootProps()} style={{ border: '2px dashed #fff', padding: '50px', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}>
          <input {...getInputProps()} />
          <Typography variant="h6">Drop a PDF file here, or click to select one</Typography>
        </div>

        {file && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Typography variant="body1" color="textPrimary">Selected file: {file.name}</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpload}
              startIcon={<SendIcon />}
              disabled={loading}
              style={{ marginTop: '10px' }}
            >
              {loading ? 'Processing...' : 'Upload PDF'}
            </Button>
          </div>
        )}

        {loading && (
          <div style={{ marginTop: '20px' }}>
            <CircularProgress />
            <Typography variant="body1" color="textPrimary">Processing...</Typography>
          </div>
        )}

        {progress > 0 && !loading && (
          <div style={{ marginTop: '20px', width: '100%', maxWidth: '600px' }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body1" color="textPrimary">Progress: {Math.round(progress)}%</Typography>
          </div>
        )}

        {error && (
          <Typography variant="body1" color="error" style={{ marginTop: '20px' }}>
            {error}
          </Typography>
        )}

        {success && (
          <Typography variant="body1" color="success" style={{ marginTop: '20px' }}>
            {success}
          </Typography>
        )}

        {showTopicSwitch && (
          <div style={{ marginTop: '20px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTopic}
              startIcon={<SendIcon />}
              disabled={loading || !pdfText}
            >
              Create Topic
            </Button>
          </div>
        )}

        {topics.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Typography variant="h6" color="textPrimary">Uploaded Topics:</Typography>
            {topics.map((topic, index) => (
              <Typography key={index} variant="body1" color="textPrimary">
                Topic ID: {topic.topicId.toString()} {topic.submitKey ? `Submit Key: ${topic.submitKey.toString()}` : ''}
              </Typography>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default UploadPDF;





