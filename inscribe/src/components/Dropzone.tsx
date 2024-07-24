import React from "react";
import { Box, Typography } from "@mui/material";
import { useDropzone, DropzoneOptions } from "react-dropzone";

// Define the type for the props
interface DropzoneProps {
  onDrop: (acceptedFiles: File[]) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "application/pdf": [] },
    maxFiles: 1,
  } as DropzoneOptions); // Explicitly specify DropzoneOptions

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed #ccc",
        padding: "20px",
        textAlign: "center",
        marginBottom: "20px",
        borderRadius: "12px",
        width: "80%",
        height: "auto",
        margin: "0 auto",
        minHeight: '300px',
        marginTop: '44px'
      }}
    >
      <input {...getInputProps()} />
      <Typography variant="h6" sx={{ padding: '100px' }}>
        Drag and drop a PDF file here, or click to select a file
      </Typography>
    </Box>
  );
};

export default Dropzone;
