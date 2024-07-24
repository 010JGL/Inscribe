import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import { Client, TopicInfoQuery, TopicId, StatusError } from "@hashgraph/sdk";
import axios from "axios";
import "./../App.css";

interface TopicInfo {
  topicId: string;
  memo: string;
  runningHash: string;
  messages: Array<{
    sequenceNumber: number;
    consensusTimestamp: string;
    message: string;
  }>;
  pdfData?: PDFData;
}

interface PDFData {
  pages: Array<{
    items: Array<{
      text: string;
      x: number;
      y: number;
    }>;
  }>;
}

const SearchTopic = () => {
  const [topicId, setTopicId] = useState("");
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async (topicId: string) => {
    const apiUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
    console.log(`Fetching messages from URL: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    console.log("Messages fetched:", response.data.messages);
    return response.data.messages.map((msg: any) => ({
      sequenceNumber: msg.chunk_info.number,
      consensusTimestamp: msg.consensus_timestamp,
      message: atob(msg.message), // Decode Base64 message content
    }));
  };

  const handleFetchInfo = async () => {
    if (!topicId) {
      setError("Please enter a valid topic ID.");
      return;
    }

    try {
      const clientTestnet = Client.forTestnet();
      const { REACT_APP_MY_ACCOUNT_ID, REACT_APP_MY_PRIVATE_KEY } = process.env;
      if (!REACT_APP_MY_ACCOUNT_ID || !REACT_APP_MY_PRIVATE_KEY) {
        throw new Error("Environment variables for account ID and private key are not set.");
      }

      clientTestnet.setOperator(REACT_APP_MY_ACCOUNT_ID, REACT_APP_MY_PRIVATE_KEY);

      const topicIdObj = TopicId.fromString(topicId);
      const info = await new TopicInfoQuery().setTopicId(topicIdObj).execute(clientTestnet);

      const messages = await fetchMessages(topicId);

      let pdfData: PDFData | undefined = undefined;
      for (const msg of messages) {
        try {
          const parsedMessage = JSON.parse(msg.message);
          if (parsedMessage.pages) {
            pdfData = parsedMessage;
            break;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      setTopicInfo({
        topicId: topicIdObj.toString(),
        memo: info.topicMemo || "",
        runningHash: arrayBufferToHex(info.runningHash),
        messages,
        pdfData,
      });
      setError(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error instanceof StatusError && error.status.toString() === "INVALID_TOPIC_ID") {
          setError("Invalid Topic ID. Please ensure the topic ID is correct and exists on the network.");
        } else {
          setError("Failed to fetch topic info. Please try again.");
        }
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  const arrayBufferToHex = (buffer: ArrayBuffer): string => (
    Array.prototype.map.call(new Uint8Array(buffer), (x: number) =>
      ("00" + x.toString(16)).slice(-2)
    ).join("")
  );

  const formatConsensusTimestamp = (consensusTimestamp: string): string => {
    const milliseconds = parseInt(consensusTimestamp.split(".")[0]) * 1000;
    return new Date(milliseconds).toLocaleString(); // Adjust this based on your locale and format preferences
  };

  return (
    <Stack alignItems="center" spacing={4}>
      <Typography variant="h4" color="orange">
        Search any Topic
      </Typography>
      {error && <Typography color="error" sx={{ marginBottom: 4 }}>{error}</Typography>}
      <TextField
        label="Enter Topic ID"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 400,
          "& .MuiInputBase-root": { color: "inherit" }, // Keep the original color of the input text
        }}
        InputProps={{ style: { fontSize: "1rem" } }} // Adjust text field input style
      />
      <Button variant="contained" color="primary" onClick={handleFetchInfo}>
        Fetch Topic Info
      </Button>
      {topicInfo && !topicInfo.pdfData && (
        <Card sx={{ width: "100%", maxWidth: 600, backgroundColor: "#1e1e1e", color: "#fff" }}>
          <CardContent>
            <Typography variant="h6" color="primary" sx={{ marginBottom: 2 }}>
              Messages
            </Typography>
            {topicInfo.messages.map((msg, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <Typography variant="body1"><strong>Sequence Number:</strong></Typography>
                  <Typography variant="body1"><strong>Timestamp:</strong></Typography>
                  <Typography variant="body1"><strong>Message:</strong></Typography>
                </div>
                <div>
                  <Typography variant="body1">{msg.sequenceNumber}</Typography>
                  <Typography variant="body1">{formatConsensusTimestamp(msg.consensusTimestamp)}</Typography>
                  <Typography variant="body1">{msg.message}</Typography>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {topicInfo && topicInfo.pdfData && (
        <Box sx={{ width: "100%", maxWidth: 600, marginTop: 4, padding: 2, backgroundColor: "#f0f0f0", color: "#000" }}>
          <Typography variant="h6" sx={{ marginBottom: 2 }}>Reconstructed PDF</Typography>
          {topicInfo.pdfData.pages.map((page, pageIndex) => (
            <Box key={pageIndex} sx={{ marginBottom: 4, padding: 2, border: "1px solid #ccc", position: "relative" }}>
              {page.items.map((item, itemIndex) => (
                <Typography
                  key={itemIndex}
                  sx={{ wordWrap: "break-word" }}
                >
                  {item.text}
                </Typography>
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
};

export default SearchTopic;



