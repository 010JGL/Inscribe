import { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import StripeCheckoutForm from './StripeCheckoutForm';

export default function LoginSignUp() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [credits, setCredits] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [openStripeModal, setOpenStripeModal] = useState(false);

  useEffect(() => {
    const storedCredits = localStorage.getItem('credits');
    if (storedCredits) {
      setCredits(parseInt(storedCredits, 10));
    }
  }, []);

  const handleToggle = () => {
    setIsSignUp(!isSignUp);
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleLogin();
    }
  };

  const handleSignUp = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUser = users.find((user: any) => user.email === email);

    if (existingUser) {
      alert('User already exists');
      return;
    }

    const newUser = { email, password, credits: 0 };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('credits', '0');
    console.log('Sign Up successful');
    alert('Sign Up successful');
  };

  const handleLogin = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((user: any) => user.email === email && user.password === password);

    if (!user) {
      console.log('Invalid email or password');
      alert('Invalid email or password');
      return;
    }

    localStorage.setItem('credits', user.credits.toString());
    setCredits(user.credits);
    setLoggedIn(true);
    setShowSnackbar(true);
    console.log('Login successful');
  };

  const handleToken = (token: any) => {
    console.log('Stripe Token:', token);
    addCredits(10); // Simulate adding 10 credits
    setOpenStripeModal(false);
  };

  const addCredits = (amount: number) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((user: any) => user.email === email);

    if (userIndex === -1) {
      alert('User not found');
      return;
    }

    users[userIndex].credits += amount;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('credits', users[userIndex].credits.toString());
    setCredits(users[userIndex].credits);
    alert(`${amount} credits added`);
    console.log(`${amount} credits added`);
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" gutterBottom align="center">
        {isSignUp ? 'Sign Up' : 'Login'}
      </Typography>
      <Grid container spacing={2} direction="column" alignItems="center">
        <Grid item xs={12}>
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </Button>
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={isSignUp} onChange={handleToggle} />}
            label={isSignUp ? 'Switch to Login' : 'Switch to Sign Up'}
          />
        </Grid>
        {loggedIn && (
          <>
            <Grid item xs={12} sx= {{ marginTop: '40px' }}>
              <Typography variant="h6">Credits: {credits}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="secondary" onClick={() => setOpenStripeModal(true)}>
                Buy Credits
              </Button>
            </Grid>
          </>
        )}
      </Grid>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message="Login successful"
      />
      <Dialog open={openStripeModal} onClose={() => setOpenStripeModal(false)}>
        <DialogTitle>Buy Credits</DialogTitle>
        <DialogContent>
          <StripeCheckoutForm handleToken={handleToken} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStripeModal(false)} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
