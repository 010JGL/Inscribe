import React from 'react';
import { Typography, Box, Container, Card } from '@mui/material';

const Information = () => {
  return (
    <Container maxWidth="md" sx={{ marginTop: 2 }}>
      <Typography variant="h3" sx={{ textAlign: 'center', color: 'orange' }} gutterBottom>
        Innovative Services
      </Typography>
      <Card sx={{ backgroundColor: '#3b3b3b', padding: 3, marginBottom: 4, marginTop: 6}}>
        <Typography variant="h4" sx={{ textAlign: 'center', color: 'white' }} gutterBottom>
          Key Features
        </Typography>
        <Box sx={{ color: 'white' }}>
          <Typography variant="body1" paragraph>
            <strong>Secure Data Storage:</strong> Store your messages and data securely on the cutting-edge hashgraph technology.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Dynamic Topic Interaction:</strong> Seamlessly send text to existing topics, whether private or public, enhancing your data organization and accessibility.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>PDF Integration:</strong> Effortlessly upload and store text content in PDF format, streamlining document management and retrieval.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Tweet Preservation:</strong> Capture and archive tweets directly within our system, ensuring valuable social media content is securely stored.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Comprehensive Topic Search:</strong> Utilize our robust search functionality to locate and explore existing topics with ease, facilitating efficient information retrieval.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Favorite Topics:</strong> Bookmark and save topics of interest for quick access and ongoing reference.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Account Management:</strong> Manage your account, purchase credits, and oversee your activities with a user-friendly interface.
          </Typography>
        </Box>
      </Card>
      <Card sx={{ backgroundColor: '#3b3b3b', padding: 3, marginBottom: 4 }}>
      <Typography variant="h4" sx={{ textAlign: 'center', color: 'white' }} gutterBottom>
        About Our Service
      </Typography>
      <Typography variant="body1" paragraph>
        The platform operates on a flexible pay-as-you-go model, offering an economical and intuitive solution for leveraging advanced hashgraph technology. Designed to accommodate both novice and experienced users, our service provides an accessible gateway to the benefits of decentralized data management.
      </Typography>
      <Typography variant="body1" paragraph>
        As we evolve, our commitment is to scale our offerings to support enterprise-level demands. For now, we invite you to explore our toolkit and experience firsthand the simplicity and cost-effectiveness of our hashgraph technology solutions.
      </Typography>
      </Card>
    </Container>
  );
};

export default Information;
