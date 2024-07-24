import { AppBar, Button, Toolbar, Typography, Grid } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HBARLogo from "../assets/hbar-logo.svg";
import { useWalletInterface } from '../services/wallets/useWalletInterface';
import { WalletSelectionDialog } from './WalletSelectionDialog';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const { accountId, walletInterface } = useWalletInterface();

  const handleConnect = async () => {
    if (accountId) {
      walletInterface.disconnect();
    } else {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (accountId) {
      setOpen(false);
    }
  }, [accountId]);

  return (
    <AppBar position='relative'>
      <Toolbar>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Grid container alignItems="center">
              <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src={HBARLogo} alt='An upper case H with a line through the top' className='hbarLogoImg' />
                <Typography variant="h6" color="white" pl={1} noWrap>
                  Hello Future
                </Typography>
              </Link>
            </Grid>
          </Grid>

          <Grid item>
            <Grid container spacing={2} justifyContent="center">
              <Grid item>
                <Button
                  component={Link}
                  to="/create-topic"
                  variant='contained'
                >
                  Create Topic
                </Button>
              </Grid>
              <Grid item>
                <Button
                  component={Link}
                  to="/write-message"
                  variant='contained'
                >
                  Write Message
                </Button>
              </Grid>
              <Grid item>
                <Button
                  component={Link}
                  to="/upload-pdf"
                  variant='contained'
                >
                  Upload PDF
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Button
              variant='contained'
              onClick={handleConnect}
            >
              {accountId ? `Connected: ${accountId}` : 'Connect Wallet'}
            </Button>
          </Grid>
        </Grid>
      </Toolbar>
      <WalletSelectionDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)} />
    </AppBar>
  );
}
