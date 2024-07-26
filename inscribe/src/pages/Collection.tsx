import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Card,
  CardContent,
  Grid,
  Pagination,
} from "@mui/material";
import { Client, TopicInfoQuery, TopicId, StatusError } from "@hashgraph/sdk";
import axios from "axios";

interface TopicInfo {
  topicId: string;
  messages: Array<{
    sequenceNumber: number;
    consensusTimestamp: string;
    message: string;
  }>;
  pdfData?: PDFData;
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

const Collection = () => {
  const [topicId, setTopicId] = useState<string>("");
  const [savedTopics, setSavedTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const topicsPerPage = 20;

  useEffect(() => {
    // Load saved topics from local storage when the component mounts
    const savedTopicsFromStorage = localStorage.getItem("savedTopics");
    if (savedTopicsFromStorage) {
      setSavedTopics(JSON.parse(savedTopicsFromStorage));
    }
  }, []);

  const handleAddTopic = () => {
    if (topicId && !savedTopics.includes(topicId)) {
      const newSavedTopics = [...savedTopics, topicId];
      setSavedTopics(newSavedTopics);
      localStorage.setItem("savedTopics", JSON.stringify(newSavedTopics)); // Save to local storage
      setTopicId("");
    }
  };

  const handleFetchInfo = async (topicId: string) => {
    try {
      const clientTestnet = Client.forTestnet();
      const { REACT_APP_MY_ACCOUNT_ID, REACT_APP_MY_PRIVATE_KEY } = process.env;
      if (!REACT_APP_MY_ACCOUNT_ID || !REACT_APP_MY_PRIVATE_KEY) {
        throw new Error("Environment variables for account ID and private key are not set.");
      }

      clientTestnet.setOperator(REACT_APP_MY_ACCOUNT_ID, REACT_APP_MY_PRIVATE_KEY);

      const topicIdObj = TopicId.fromString(topicId);
      const info = await new TopicInfoQuery().setTopicId(topicIdObj).execute(clientTestnet);
      const apiUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages`;
      const response = await axios.get(apiUrl);

      const messages = response.data.messages.map((msg: any) => ({
        sequenceNumber: msg.chunk_info.number,
        consensusTimestamp: msg.consensus_timestamp,
        message: atob(msg.message), // Decode Base64 message content
      }));

      let pdfData: PDFData | undefined = { pages: [] };

      for (const msg of messages) {
        try {
          const parsedMessage = JSON.parse(msg.message);
          if (parsedMessage.instructions) {
            pdfData = parsedMessage.instructions as PDFData;
            break;
          }
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }

      setTopicInfo({
        topicId: topicIdObj.toString(),
        messages,
        pdfData: pdfData.pages.length > 0 ? pdfData : undefined,
      });
      setSelectedTopic(topicId);
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

  const formatConsensusTimestamp = (consensusTimestamp: string): string => {
    const milliseconds = parseInt(consensusTimestamp.split(".")[0]) * 1000;
    return new Date(milliseconds).toLocaleString();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const currentTopics = savedTopics.slice(
    (currentPage - 1) * topicsPerPage,
    currentPage * topicsPerPage
  );

  return (
    <Stack spacing={2} alignItems="center">
      <TextField
        label="Topic ID"
        variant="outlined"
        value={topicId}
        onChange={(e) => setTopicId(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleAddTopic}>
        Add Topic
      </Button>
      <Typography variant="h4" sx={{ color: "white" }}>Collection</Typography>
      <Grid container spacing={2}>
        {currentTopics.map((topic) => (
          <Grid item xs={3} key={topic}>
            <Button
              variant="contained"
              onClick={() => handleFetchInfo(topic)}
              fullWidth
            >
              {topic}
            </Button>
          </Grid>
        ))}
      </Grid>
      {savedTopics.length > topicsPerPage && (
        <Pagination
          count={Math.ceil(savedTopics.length / topicsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          style={{ marginTop: '10px' }}
        />
      )}
      {error && <Typography color="error">{error}</Typography>}
      {selectedTopic && topicInfo && (
        <Card style={{ width: '80%', margin: '20px 0' }}>
          <CardContent>
            <Typography variant="h6">Topic ID: {topicInfo.topicId}</Typography>
            <Typography variant="body1">Messages Count: {topicInfo.messages.length}</Typography>
            {topicInfo.pdfData ? (
              <div>{/* Render your PDF data here, if needed */}</div>
            ) : (
              topicInfo.messages.map((msg) => (
                <Card key={msg.sequenceNumber} style={{ margin: '10px 0' }}>
                  <CardContent>
                    <Typography variant="h6">Topic ID: {topicInfo.topicId}</Typography>
                    <Typography variant="body1">
                      Timestamp: {formatConsensusTimestamp(msg.consensusTimestamp)}
                    </Typography>
                    <Typography variant="body1">Message: {msg.message}</Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

export default Collection;



