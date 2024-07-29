import { Box, Link } from '@mui/material';
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
  );
}
