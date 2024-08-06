import { AppBar, Button, Toolbar, Typography, Grid, Menu, MenuItem, IconButton, Box } from '@mui/material';
import { useEffect, useState, MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import HBARLogo from "../assets/hbar-logo.svg";
import { useWalletInterface } from '../services/wallets/useWalletInterface';
import { WalletSelectionDialog } from './WalletSelectionDialog';
import MenuIcon from '@mui/icons-material/Menu';
import { useUserContext } from '../contexts/UserContext';

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { accountId, walletInterface } = useWalletInterface();
  const { user, setUser } = useUserContext();

  const handleConnect = async () => {
    if (accountId) {
      walletInterface.disconnect();
    } else {
      setOpen(true);
    }
  };

  const handleMenuClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setUser({ email: '', credits: 0 });
    localStorage.removeItem('credits');
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
            <Grid container spacing={2} justifyContent="center" alignItems="center">
              <Grid item sx={{ display: 'flex', flexDirection: 'row', marginRight: '60px' }}>
                <Typography variant="h5" color="orange" pr={1}>Inscribe</Typography>
                <IconButton
                  edge="end"
                  color="primary"
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  onClick={handleMenuClick}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  id="simple-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem component={Link} to="/create-topic" onClick={handleMenuClose}>Create Topic</MenuItem>
                  <MenuItem component={Link} to="/write-message" onClick={handleMenuClose}>Write Message</MenuItem>
                  <MenuItem component={Link} to="/upload-pdf" onClick={handleMenuClose}>Upload PDF</MenuItem>
                  <MenuItem component={Link} to="/save-tweet" onClick={handleMenuClose}>Save Tweet</MenuItem>
                </Menu>
              </Grid>
              <Grid item>
                <Button
                  component={Link}
                  to="/search"
                  variant='contained'
                >
                  Search
                </Button>
              </Grid>
              <Grid item>
                <Button
                  component={Link}
                  to="/collection"
                  variant='contained'
                >
                  Collection
                </Button>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <Box display="flex" alignItems="center">
              {user.email && (
                <Typography variant="h6" color="white" pr={2}>
                  Credits: {user.credits}
                </Typography>
              )}
              <Button
                variant='contained'
                onClick={handleConnect}
              >
                {accountId ? `Connected: ${accountId}` : 'Connect Wallet'}
              </Button>
              {user.email ? (
                <Button
                  variant='outlined'
                  sx={{ marginLeft: "20px" }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant='outlined'
                  sx={{ marginLeft: "20px" }}
                >
                  Login
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Toolbar>
      <WalletSelectionDialog open={open} setOpen={setOpen} onClose={() => setOpen(false)} />
    </AppBar>
  );
}
