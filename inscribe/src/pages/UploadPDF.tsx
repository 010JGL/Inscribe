import React, { useState, useCallback, useEffect } from "react";
import { Typography, Button, Box, CircularProgress, LinearProgress, Container } from "@mui/material";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { AccountId, Client, PrivateKey, TopicMessageSubmitTransaction, TopicId } from "@hashgraph/sdk";
import SendIcon from "@mui/icons-material/Send";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { handleCreateTopic } from "../components/HandleCreateTopic";
import { initializeClient, splitMessagesIntoChunks, sleep, submitMessageWithRetries } from "../utils/hederaUtils";
import Dropzone from "../components/Dropzone";
import { dropzoneStyle, buttonStyle } from "../config/styles";
import LoadingButton from "../components/LoadingButton";

// Ensure the worker is set up correctly
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

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
      <Typography variant="h4" sx={{ color: 'orange', textAlign: "center" }}>Upload PDF</Typography>
      <Dropzone onDrop={onDrop} />
      <Box sx={{ textAlign: "center", marginBottom: "20px" }}>
        {file && (
          <LoadingButton
            loading={loading}
            onClick={handleUpload}
          >
            Upload PDF
          </LoadingButton>
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




