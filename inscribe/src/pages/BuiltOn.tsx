import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

import sauce from "../assets/sauce.png";

const BuiltOn = () => {
  const platforms = [
    {
      name: 'Hedera',
      description: 'The official Website of Hedera Hashgraph',
      icon: 'https://cryptologos.cc/logos/hedera-hbar-logo.svg?v=032',
      url: 'https://hedera.com/',
    },
    {
      name: 'SaucerSwap',
      description: 'A Decentralized exchange built on Hedera',
      icon: sauce,
      url: 'https://www.saucerswap.finance/',
    },
    {
      name: 'HashPack',
      description: 'Gateway to Hedera Dapps, DeFi and NFTs',
      icon: 'https://pbs.twimg.com/media/FUq-AcYVUAAGd3v.jpg:large',
      url: 'https://www.hashpack.app/',
    },
    {
      name: 'Karate Combat',
      description: 'Professional combat league that have an app that runs on Hedera',
      icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQa-GSnD8SW1Nip4zoYbhauMV3rCq9MYRaUkzbVrneqQzMrhjSy7UbaMdPDrt-irr2CX4c&usqp=CAU',
      url: 'https://www.karate.com/',
    },
    {
      name: 'DOVU',
      description: 'Their platform enables organizations to manage green credits efficiently, fostering innovation for environmental impact',
      icon: 'https://images.hedera.com/dovu_logo_white.png?w=638&h=140&auto=compress%2Cformat&fit=crop&dm=1709017857&s=d30de7e1d0b0b2a92374ab46491c71eb',
      url: 'https://dovu.earth/en/',
    },
    {
      name: 'Calaxy',
      description: 'Social platform for creators. Has a built in wallet and other cool features',
      icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQouIOt2cTZGMOLjg46s0R-4vCQwjT1LP6dcgXAWrR5Y0bedQIMKBHS63jmS_jxdO-fxOs&usqp=CAU',
      url: 'https://calaxy.com/',
    },
  ];

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h3" sx={{ textAlign: 'center', color: 'orange' }} gutterBottom>
        <Box component="span" sx={{ color: 'orange' }}>Built On </Box>
        <Box component="span" sx={{ color: 'white' }}>Hedera</Box>
      </Typography>
      <Grid container spacing={4} sx={{ marginTop: '30px' }}>
        {platforms.map((platform, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper sx={{ padding: 2, textAlign: 'center', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <a href={platform.url} target="_blank" rel="noopener noreferrer">
                <img
                  src={platform.icon}
                  alt={platform.name}
                  style={{ width: '120px', height: 'auto', cursor: 'pointer' }}
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
