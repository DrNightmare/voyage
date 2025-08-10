'use client';

import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onFileAdded: (file: File) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileAdded,
  acceptedFileTypes = ['*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`,
      };
    }

    // Check file type if not accepting all files
    if (acceptedFileTypes[0] !== '*' && !acceptedFileTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported`,
      };
    }

    return { isValid: true };
  }, [acceptedFileTypes, maxFileSize]);

  const handleFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      
      try {
        const validation = validateFile(file);
        if (!validation.isValid) {
          alert(`File validation failed: ${validation.error}`);
          return;
        }

        onFileAdded(file);
      } catch (error) {
        console.error('Error processing file:', error);
        alert('An error occurred while processing the file. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [onFileAdded, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept={acceptedFileTypes.join(',')}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className={`w-12 h-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Drop your file here' : 'Upload your travel document'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop a file here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supported formats: {acceptedFileTypes[0] === '*' ? 'All files' : acceptedFileTypes.join(', ')}
              <br />
              Max size: {Math.round(maxFileSize / (1024 * 1024))}MB
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
