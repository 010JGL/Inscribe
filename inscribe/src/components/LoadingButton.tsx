import React from "react";
import { Button, CircularProgress } from "@mui/material";

// Define the props type
interface LoadingButtonProps {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, onClick, children }) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    disabled={loading}
    sx={{ marginBottom: '20px' }}
  >
    {loading ? <CircularProgress size={24} /> : children}
  </Button>
);

export default LoadingButton;

