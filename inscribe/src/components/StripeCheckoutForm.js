import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button, Typography } from '@mui/material';

// Load your Stripe public key
const stripePromise = loadStripe('your_public_stripe_key');

const CheckoutForm = ({ handleToken }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      console.error('[error]', error);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      handleToken(paymentMethod.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <Button type="submit" variant="contained" color="primary" disabled={!stripe}>
        Pay
      </Button>
    </form>
  );
};

const StripeCheckoutForm = ({ handleToken }) => (
  <Elements stripe={stripePromise}>
    <Typography variant="h6" gutterBottom>
      Complete your purchase
    </Typography>
    <CheckoutForm handleToken={handleToken} />
  </Elements>
);

export default StripeCheckoutForm;
