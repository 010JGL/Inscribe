import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom'; // Import Link from react-router-dom
import BuiltOnHedera from "../assets/built-on-hedera.svg";

export default function Footer() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        className='footer'
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}
      >
        <img 
          src={BuiltOnHedera}
          alt='An upper case H with a line through the top and the text Build on Hedera'
          className='builtOnHederaSVG'
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link
            component={RouterLink}
            to="/built-on" // Add route for BuiltOn page
            sx={{ 
              textDecoration: 'none', 
              color: 'white', 
              marginRight: '24px' 
            }}
          >
            Built On <Typography sx={{ color: '#d224ed' }}>Hedera</Typography>
          </Link>
          <Link
            component={RouterLink}
            to="/information"
            sx={{ 
              textDecoration: 'none', 
              color: 'white', 
              marginRight: '24px' 
            }}
          >
            Information
          </Link>
          <Link
            component={RouterLink}
            to="/contact"
            sx={{ 
              textDecoration: 'none', 
              color: 'white', 
              marginRight: '24px' 
            }}
          >
            Contact
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
