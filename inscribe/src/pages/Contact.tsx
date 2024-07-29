import React from 'react';
import { Typography, Box, Link, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Contact = () => {
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('010JGL@GMAIL.COM');
  };

  return (
    <Box
      sx={{ 
        padding: '24px',
        backgroundColor: '#222222',
        color: 'white',
        minHeight: '40vh'
      }}
    >
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center", color:"orange" }}>
        Contact Us
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ marginTop: "50px" }}>
          You can contact us at:
          <Typography variant="h6" sx={{ color: "orange" }}>010JGL@GMAIL.COM</Typography>
        </Typography>
        <Tooltip title="Copy email">
          <IconButton onClick={handleCopyEmail} sx={{ marginLeft: '10px', marginTop: "50px" }}>
            <ContentCopyIcon sx={{ color: 'white' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Typography variant="h6" sx={{ marginTop: "20px", textAlign: "center" }}>
        "Hache" on Twitter: 
        <Link 
          href="https://x.com/010JGL" 
          target="_blank" 
          rel="noopener" 
          sx={{ marginLeft: '5px', color: 'orange' }}
        >
          x.com/010JGL
        </Link>
      </Typography>
      <Typography variant="h5" sx={{ textAlign: "center", marginTop: "80px" }}>
        This project has been brought to you by Hello Future Hackathon 2024
      </Typography>
    </Box>
  );
};

export default Contact;
