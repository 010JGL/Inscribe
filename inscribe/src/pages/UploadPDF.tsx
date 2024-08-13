import React, { useState, useCallback, useEffect } from 'react';
import { Typography, Button, CircularProgress, Container } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import * as pdfjsLib from 'pdfjs-dist';
import { AccountId, Client, PrivateKey, TopicCreateTransaction, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import SendIcon from '@mui/icons-material/Send';
import { useWalletInterface } from "../services/wallets/useWalletInterface";

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

const splitMessagesIntoChunks = (message: string, maxChunkSize: number = 1000) => {
  const chunks = [];
  for (let i = 0; i < message.length; i += maxChunkSize) {
    chunks.push(message.slice(i, i + maxChunkSize));
  }
  return chunks;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const submitMessageToHedera = async (message: string, topicId: TopicId, client: Client, submitKey?: PrivateKey) => {
  try {
    const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(message);
    
    // Ensure the transaction is frozen before signing or execution
    await tx.freezeWith(client);

    if (submitKey) {
      await tx.sign(submitKey);
    }

    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    if (receipt.status.toString() !== 'SUCCESS') {
      throw new Error(`Failed to submit message: ${receipt.status.toString()}`);
    }
  } catch (error) {
    console.error('Error in submitMessageToHedera:', error as Error);
    throw error;
  }
};

const submitMessageWithRetries = async (message: string, topicId: TopicId, client: Client, submitKey?: PrivateKey, maxRetries: number = 10) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await submitMessageToHedera(message, topicId, client, submitKey);
      return;
    } catch (error) {
      if ((error as Error).message.includes('429')) {
        console.warn('Rate limit hit, retrying in', 1050 * Math.pow(2, attempt), 'ms');
        await sleep(1050 * Math.pow(2, attempt)); // Exponential backoff
      } else {
        console.error('Unexpected error:', error);
        break;
      }
    }
  }
  console.error('Max retries reached, failed to submit message');
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (!process.env.REACT_APP_MY_ACCOUNT_ID || !process.env.REACT_APP_MY_PRIVATE_KEY) {
      setError("Environment variables for Hedera account ID or private key are missing.");
      return;
    }
    setClient(initializeClient(walletInterface));
  }, [walletInterface]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
    setError(null);
    setSuccess(null);
    setProgress(0);
    setUploadProgress(0);
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
        try {
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
        } catch (error) {
          console.error('Error processing PDF:', error as Error);
          setError('Error processing PDF');
        }
      };

      reader.onerror = (error) => {
        console.error('File reading error:', error as unknown as Error);
        setError('Error reading file');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Unexpected error during file processing:', error as Error);
      setError('Unexpected error during file processing');
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
      let topicCreateTx = new TopicCreateTransaction();
      let submitKey: PrivateKey | undefined;

      if (isPrivate) {
        submitKey = PrivateKey.generate();
        topicCreateTx = topicCreateTx.setSubmitKey(submitKey.publicKey);
        topicCreateTx = topicCreateTx.setAdminKey(submitKey);
      }

      const txResponse = await topicCreateTx.execute(client);
      const receipt = await txResponse.getReceipt(client);
      const topicId = receipt.topicId!;

      setLastCreatedTopicId(topicId);

      if (isPrivate && submitKey) {
        setSuccess(`Private topic created successfully. Submit Key: ${submitKey.toString()}`);
      } else {
        setSuccess('Topic created successfully');
      }

      setTopics(prev => [
        ...prev,
        { topicId, message: pdfText || '', submitKey }
      ]);
    } catch (error) {
      console.error('Error creating topic:', error as Error);
      setError('Error creating topic');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uploadMessages = async () => {
      if (!pdfText || !client || uploadingMessages) return;

      setUploadingMessages(true);
      setUploadProgress(0);
      const messages = splitMessagesIntoChunks(pdfText);
      console.log(`Total messages to upload: ${messages.length}`);

      let messagesUploaded = 0;
      let topicId = lastCreatedTopicId;

      if (!topicId) {
        setError('Failed to create topic');
        setUploadingMessages(false);
        return;
      }

      for (let i = 0; i < messages.length; i += 10) {
        const batchMessages = messages.slice(i, i + 10);

        for (const message of batchMessages) {
          try {
            await submitMessageWithRetries(message, topicId, client, isPrivate ? PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "") : undefined);
            messagesUploaded++;
            setUploadProgress(Math.min((messagesUploaded / messages.length) * 100, 100));
          } catch (error) {
            console.error('Error submitting message:', error as Error);
            setError('Error submitting messages');
            setUploadingMessages(false);
            return;
          }
        }

        // Delay between batches
        await sleep(500); // 0.5 seconds between batches
      }

      setUploadingMessages(false);
      setSuccess('Messages uploaded successfully');
    };

    if (pdfText && lastCreatedTopicId) {
      uploadMessages();
    }
  }, [pdfText, client, lastCreatedTopicId, uploadingMessages, isPrivate]);

  return (
    <Container>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          
        }}
      >
        <div {...getRootProps()} style={{ border: '2px dashed #fff', padding: '50px', borderRadius: '10px', cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <Typography variant="h6" color="white">Drag and drop a PDF file here, or click to select one</Typography>
        </div>
        {file && (
          <div>
            <Typography variant="h6" color="white" mt={2}>Selected file: {file.name}</Typography>
            <Button onClick={handleUpload} variant="contained" color="primary" startIcon={<SendIcon />} style={{ marginTop: '16px' }}>
              Upload and Scan PDF
            </Button>
          </div>
        )}
        {loading && <CircularProgress style={{ marginTop: '16px' }} />}
        {error && <Typography variant="body1" color="red" mt={2}>{error}</Typography>}
        {success && <Typography variant="body1" color="green" mt={2}>{success}</Typography>}
        {showTopicSwitch && !uploadingMessages && !lastCreatedTopicId && (
          <Button onClick={handleCreateTopic} variant="contained" color="secondary" style={{ marginTop: '16px' }}>
            Create Topic
          </Button>
        )}
        {lastCreatedTopicId && (
          <Typography variant="body1" color="white" mt={2}>Created Topic ID: {lastCreatedTopicId.toString()}</Typography>
        )}
        {uploadingMessages && (
          <Typography variant="body1" color="white" mt={2}>
            Uploading Messages: {Math.round(uploadProgress)}%
          </Typography>
        )}
      </div>
    </Container>
  );
};

export default UploadPDF;





















