import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const BuiltOn = () => {
  const platforms = [
    {
      name: 'Platform 1',
      description: 'A brief description of Platform 1.',
      icon: 'https://via.placeholder.com/100', // Replace with actual icon URL
      url: 'https://example.com/platform1' // Replace with actual URL
    },
    {
      name: 'Platform 2',
      description: 'A brief description of Platform 2.',
      icon: 'https://via.placeholder.com/100', // Replace with actual icon URL
      url: 'https://example.com/platform2' // Replace with actual URL
    },
    // Add more platforms as needed
  ];

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h3" sx={{ textAlign: 'center', color: 'orange' }} gutterBottom>
        <Box component="span" sx={{ color: 'orange' }}>Built On </Box>
        <Box component="span" sx={{ color: 'white' }}>Hedera</Box>
      </Typography>
      <Grid container spacing={4}>
        {platforms.map((platform, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper sx={{ padding: 2, textAlign: 'center' }}>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={platform.icon} 
                  alt={platform.name} 
                  style={{ width: '100px', height: 'auto', cursor: 'pointer' }} 
                />
              </a>
              <Typography variant="h6" sx={{ marginTop: 2 }}>
                {platform.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1 }}>
                {platform.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default BuiltOn;

