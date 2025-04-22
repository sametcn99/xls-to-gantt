"use client";

import React, { useCallback } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        mb: 4,
        backgroundColor: 'background.paper',
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
      }}
    >
      <Box
        {...getRootProps()}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          padding: 3,
        }}
      >
        <input {...getInputProps()} />
        <Box 
          component="img"
          src="/file.svg"
          alt="Upload icon"
          sx={{ height: 64, width: 64, mb: 2, opacity: 0.7 }}
        />
        {isDragActive ? (
          <Typography variant="h6" color="primary.main">Dosyayı buraya bırakın...</Typography>
        ) : (
          <>
            <Typography variant="h6" mb={1}>Excel Dosyasını Buraya Sürükleyin</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              veya dosya seçmek için tıklayın (.xlsx, .xls)
            </Typography>
            <Button variant="contained" color="primary">
              Dosya Seç
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default FileUploader;
