import React, { useState, useCallback, useEffect } from "react";
import { Typography, Button, Box, CircularProgress,LinearProgress, Container } from "@mui/material";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { AccountId, Client, PrivateKey, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import SendIcon from "@mui/icons-material/Send";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { handleCreateTopic } from "../components/HandleCreateTopic";

// Ensure the worker is set up correctly
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

// Helper Functions
const initializeClient = (walletInterface: any) => 
  walletInterface
    ? Client.forNetwork(walletInterface.network).setOperator(
        walletInterface.accountId,
        walletInterface.privateKey
      )
    : Client.forTestnet().setOperator(
        AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID || ""),
        PrivateKey.fromString(process.env.REACT_APP_MY_PRIVATE_KEY || "")
      );

const splitMessagesIntoChunks = (message: string, maxChunkSize: number = 100000) => 
  message.match(new RegExp(`.{1,${maxChunkSize}}`, 'g')) || [];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const submitMessageToHedera = async (
  message: string,
  topicId: TopicId,
  client: Client,
  submitKey?: PrivateKey
) => {
  const tx = new TopicMessageSubmitTransaction().setTopicId(topicId).setMessage(message);
  if (submitKey) await tx.freezeWith(client).sign(submitKey);
  const txResponse = await tx.execute(client);
  console.log("Message submit receipt:", (await txResponse.getReceipt(client)).status.toString());
};

const submitMessageWithRetries = async (
  message: string,
  topicId: TopicId,
  client: Client,
  submitKey?: PrivateKey,
  maxRetries: number = 10
) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await submitMessageToHedera(message, topicId, client, submitKey);
      console.log("Message submitted successfully");
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes("429")) {
        console.warn("Rate limit hit, retrying...");
        await sleep(1000 * Math.pow(2, attempt)); // Exponential backoff
      } else {
        console.error("Unexpected error:", error);
        break;
      }
    }
  }
  console.error("Max attempts reached, failed to submit message");
};

// Component
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
  const [topics, setTopics] = useState<
    { topicId: TopicId; message: string; submitKey?: PrivateKey }[]
  >([]);
  const [lastCreatedTopicId, setLastCreatedTopicId] = useState<TopicId | null>(null);

  useEffect(() => {
    if (process.env.REACT_APP_MY_ACCOUNT_ID && process.env.REACT_APP_MY_PRIVATE_KEY) {
      setClient(initializeClient(walletInterface));
    } else {
      setError("Environment variables for Hedera account ID or private key are missing.");
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
    accept: { "application/pdf": [] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return setError("No file selected");

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const pdfData = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
      const numPages = pdf.numPages;
      const metadata: any = { pages: [] };

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageMetadata = { items: textContent.items.map((item: any) =>
          typeof item === "object" && "str" in item ? { text: item.str, x: item.transform[4], y: item.transform[5] } : null
        ).filter((item: any) => item !== null) };

        metadata.pages.push(pageMetadata);
      }

      setPdfText(JSON.stringify(metadata));
      setSuccess("File processed successfully");
      setShowTopicSwitch(true);
    } catch (error) {
      console.error("Error processing file:", error);
      setError("Error processing file");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const uploadMessages = async () => {
      if (pdfText && client && !uploadingMessages) {
        const messages = splitMessagesIntoChunks(pdfText, 8000); // 100KB max chunk size
        setUploadingMessages(true);

        for (let i = 0; i < messages.length; i += 100) {
          await Promise.all(
            messages.slice(i, i + 100).map(async (message, index) => {
              const topic = topics[i + index];
              if (topic) {
                await submitMessageWithRetries(message, topic.topicId, client, topic.submitKey);
                setProgress(Math.min(100, ((i + index + 1) / messages.length) * 100));
              } else {
                console.error("Topic not found for message:", message);
              }
            })
          );
          await sleep(500); // Short pause to avoid rate limiting
        }

        setUploadingMessages(false);
        console.log("All messages uploaded successfully");
      }
    };

    if (topics.length > 0 && pdfText && client) {
      uploadMessages();
    }
  }, [topics, pdfText, client]);

  const handleCreateTopicClick = () => {
    handleCreateTopic(
      client,
      isPrivate,
      pdfText,
      setTopics,
      setLastCreatedTopicId,
      setSuccess,
      setError,
      setLoading
    );
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ color: 'orange', textAlign: "center", }}>Upload PDF</Typography>
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed #ccc",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
          borderRadius: "12px", // Rounded corners
          width: "80%", // Maximum width of 70% of the screen
          height: "auto", // Height is 2.5 times the padding (20px * 2.5)
          margin: "0 auto", // Center align
          minHeight: '300px',
          marginTop: '44px'
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h6" sx={{ padding: '100px' }}>Drag and drop a PDF file here, or click to select a file</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
        {file && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SendIcon />}
            onClick={handleUpload}
            disabled={loading}
            sx={{ marginBottom: '20px' }}
          >
            {loading ? <CircularProgress size={24} /> : "Upload PDF"}
          </Button>
        )}
        {success && <Typography color="success" sx={{ marginBottom: '20px' }}>{success}</Typography>}
        {error && <Typography color="error" sx={{ marginBottom: '20px' }}>{error}</Typography>}
        {pdfText && showTopicSwitch && (
          <>
            <Typography variant="h6" sx={{ marginBottom: '20px', color: 'orange' }}>Create Topic:</Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateTopicClick}
              disabled={loading}
              sx={{ marginBottom: '20px' }}
            >
              {loading ? <CircularProgress size={24} /> : "Create Topic"}
            </Button>
          </>
        )}
        {uploadingMessages && <LinearProgress sx={{ width: '100%', marginTop: '20px' }} />}
        {success && lastCreatedTopicId && (
          <Box>
            <Typography variant="h5" sx={{ marginTop: '20px', color: 'green' }}>
              Topic created successfully!
            </Typography>
            <Typography variant="h6" sx={{ marginTop: '20px' }}>
              ID: {lastCreatedTopicId.toString()}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
  
  
  
};

export default UploadPDF;


