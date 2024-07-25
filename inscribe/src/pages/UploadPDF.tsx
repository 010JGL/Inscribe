import React, { useState, useCallback, useEffect } from "react";
import { Typography, Button, Box, CircularProgress, LinearProgress, Container } from "@mui/material";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import { Client, PrivateKey, TopicId } from "@hashgraph/sdk";
import { useWalletInterface } from "../services/wallets/useWalletInterface";
import { handleCreateTopic } from "../components/HandleCreateTopic";
import { initializeClient, splitMessagesIntoChunks, sleep, submitMessageWithRetries } from "../utils/hederaUtils";
import Dropzone from "../components/Dropzone";
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
  const [pdfContent, setPdfContent] = useState<{ text: string; instructions: any } | null>(null);
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
      const content: { text: string; instructions: any } = { text: "", instructions: { pages: [] } };

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageInstructions: any[] = [];

        textContent.items.forEach((item: any) => {
          if (typeof item === "object" && "str" in item) {
            const [fontSize, fontWeight, textAlign] = [item.transform[0], item.fontName.includes('Bold') ? 'bold' : 'normal', determineTextAlignment(item.transform)];

            pageInstructions.push({
              text: item.str,
              x: item.transform[4],
              y: item.transform[5],
              fontSize,
              fontWeight,
              textAlign,
              isCapitalized: item.str === item.str.toUpperCase(),
              isPunctuation: /[.,?!;:]/.test(item.str)
            });
          }
        });

        content.text += `\n\nPage ${pageNum}\n`;
        content.instructions.pages.push(pageInstructions);
      }

      setPdfContent(content);
      setSuccess("File processed successfully");
      setShowTopicSwitch(true);
    } catch (error) {
      console.error("Error processing file:", error);
      setError("Error processing file");
    } finally {
      setLoading(false);
    }
  };

  // Function to determine text alignment based on transform matrix
  const determineTextAlignment = (transform: number[]) => {
    const [a, b] = transform;
    return (Math.abs(b) > 0.5) ? 'center' : 'left';
  };

  useEffect(() => {
    const uploadMessages = async () => {
      if (pdfContent && client && !uploadingMessages) {
        const messages = splitMessagesIntoChunks(JSON.stringify(pdfContent), 8000); // 100KB max chunk size
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

    if (topics.length > 0 && pdfContent && client) {
      uploadMessages();
    }
  }, [topics, pdfContent, client]);

  const handleCreateTopicClick = () => {
    handleCreateTopic(
      client,
      isPrivate,
      JSON.stringify(pdfContent),
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
        {pdfContent && showTopicSwitch && (
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





