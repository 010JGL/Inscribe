import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { Client, TopicInfoQuery, TopicId, StatusError } from "@hashgraph/sdk";
import axios from "axios";
import "./../App.css";

interface TopicInfo {
  topicId: string;
  messages: Array<{
    sequenceNumber: number;
    consensusTimestamp: string;
    message: string;
  }>;
  pdfData?: PDFData;
  tweetData?: TweetData; // Add tweetData field
}

interface PDFData {
  pages: Array<Array<{
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontWeight: string;
    textAlign: string;
    isCapitalized: boolean;
    isPunctuation: boolean;
  }>>;
}

interface TweetData {
  name: string;
  username: string;
  content: string;
  timestamp: string;
}

const SearchTopic = () => {
  const [topicId, setTopicId] = useState<string>("");
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async (topicId: string) => {
    const apiUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
    console.log(`Fetching messages from URL: ${apiUrl}`);
    try {
      const response = await axios.get(apiUrl);
      console.log("Messages fetched:", response.data.messages);
      return response.data.messages.map((msg: any) => ({
        sequenceNumber: msg.chunk_info.number,
        consensusTimestamp: msg.consensus_timestamp,
        message: atob(msg.message), // Decode Base64 message content
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw new Error("Failed to fetch messages.");
    }
  };

  const fetchAndDisplayTweet = (tweetData: TweetData) => {
    const correctTimestamp = tweetData.timestamp.replace('Â·', '·');
  
    return (
      <Card sx={{ padding: 2, marginTop: 2 }}>
        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          {tweetData.name}
        </Typography>
        <Typography variant="subtitle1" sx={{ marginBottom: 2 }}>
          {tweetData.username}
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", marginBottom: 2 }}>
          {tweetData.content}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {correctTimestamp}
        </Typography>
      </Card>
    );
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
      console.log("Topic info retrieved:", info);

      const messages = await fetchMessages(topicId);
      console.log("Messages retrieved:", messages);

      let pdfData: PDFData | undefined = { pages: [] }; // Default to empty pages
      let tweetData: TweetData | undefined;

      for (const msg of messages) {
        try {
          const parsedMessage = JSON.parse(msg.message);
          console.log("Parsed message:", parsedMessage);

          if (parsedMessage.tweetData) {
            tweetData = parsedMessage.tweetData as TweetData;
            break; // Stop after finding the first valid tweet data
          } else if (parsedMessage.instructions) {
            pdfData = parsedMessage.instructions as PDFData;
          }
        } catch (e) {
          console.error("JSON parse error:", e);
          // Continue to check the next message
        }
      }

      console.log("Final PDF data:", pdfData); // Debugging line to verify PDF data

      setTopicInfo({
        topicId: topicIdObj.toString(),
        messages,
        pdfData: pdfData.pages.length > 0 ? pdfData : undefined, // Set PDF data if pages exist
        tweetData: tweetData // Set tweet data if found
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

  const renderPDFData = () => {
    if (!topicInfo || !topicInfo.pdfData) {
      return <Typography>No PDF data available.</Typography>;
    }

    const pages = topicInfo.pdfData.pages;
    console.log("Rendering PDF data:", topicInfo.pdfData); // Debugging line

    return pages.map((page, pageIndex) => (
      <div
        key={pageIndex}
        style={{
          position: "relative",
          border: '1px solid #ddd',
          padding: '10px',
          boxSizing: 'border-box',
          width: '8.5in',  // Standard Letter size width
          height: '11in',  // Standard Letter size height
          overflow: 'hidden',
          backgroundColor: '#fff',  // Ensure a white background for better contrast
        }}
      >
        {page.map((item, itemIndex) => (
          <Typography
            key={itemIndex}
            sx={{
              position: "absolute",
              left: `${item.x}px`,
              top: `${11 * 96 - item.y - item.fontSize}px`, // Adjust positioning for PDF layout
              fontSize: `${item.fontSize}px`,
              fontWeight: item.fontWeight === 'bold' ? 'bold' : 'normal',
              textAlign: item.textAlign as "left" | "center" | "right",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
              textTransform: item.isCapitalized ? 'capitalize' : 'none',
              textDecoration: 'none', // Remove underline
              color: '#000', // Text color set to black
              zIndex: 1,  // Ensure text appears above the background
            }}
          >
            {item.text}
          </Typography>
        ))}
      </div>
    ));
  };

  const formatConsensusTimestamp = (consensusTimestamp: string): string => {
    const milliseconds = parseInt(consensusTimestamp.split(".")[0]) * 1000;
    return new Date(milliseconds).toLocaleString(); // Adjust this based on your locale and format preferences
  };

  const renderMessages = () => {
    if (!topicInfo) return null;

    return topicInfo.messages.map((msg) => (
      <Card key={msg.sequenceNumber} style={{ margin: '10px 0' }}>
        <CardContent>
          <Typography variant="h6">Topic ID: {topicInfo.topicId}</Typography>
          <Typography variant="body1">Timestamp: {formatConsensusTimestamp(msg.consensusTimestamp)}</Typography>
          <Typography variant="body1">Message: {msg.message}</Typography>
        </CardContent>
      </Card>
    ));
  };

  return (
    <Stack spacing={2} alignItems="center">
      <TextField
        label="Topic ID"
        variant="outlined"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleFetchInfo}>
        Fetch Topic Info
      </Button>
      {error && <Typography color="error">{error}</Typography>}
      {topicInfo && topicInfo.tweetData ? (
        fetchAndDisplayTweet(topicInfo.tweetData) // Render tweet data if present
      ) : topicInfo && topicInfo.pdfData ? (
        renderPDFData()
      ) : (
        renderMessages()
      )}
    </Stack>
  );
};

export default SearchTopic;
















