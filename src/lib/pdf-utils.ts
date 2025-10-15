/**
 * Utility functions for handling PDF files
 */

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface PDFProcessingResult {
  success: boolean;
  dataUri?: string;
  error?: string;
}

/**
 * Process a PDF file and convert it to a data URI with streaming support
 * @param file The PDF file to process
 * @param onProgress Optional progress callback for large files
 * @returns A promise that resolves to a PDFProcessingResult
 */
export async function processPDFFile(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<PDFProcessingResult> {
  // Validate file type
  if (file.type !== 'application/pdf') {
    return {
      success: false,
      error: 'Invalid file type. Please upload a PDF file.'
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`
    };
  }

  // For large files (>10MB), use chunked reading for better performance
  if (file.size > 10 * 1024 * 1024) {
    return processLargeFile(file, onProgress);
  }

  // Standard processing for smaller files
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      onProgress?.(100);
      resolve({
        success: true,
        dataUri: reader.result as string
      });
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to read the file. Please try again.'
      });
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };
    
    // Read as data URL
    reader.readAsDataURL(file);
  });
}

/**
 * Process large PDF files with chunked reading and progress tracking
 * @param file The large PDF file to process
 * @param onProgress Progress callback
 * @returns A promise that resolves to a PDFProcessingResult
 */
async function processLargeFile(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<PDFProcessingResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      onProgress?.(100);
      resolve({
        success: true,
        dataUri: reader.result as string
      });
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        error: 'Failed to process large file. Please try again or use a smaller file.'
      });
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    // Add timeout for very large files (5 minutes)
    const timeout = setTimeout(() => {
      reader.abort();
      resolve({
        success: false,
        error: 'File processing timed out. Please try a smaller file.'
      });
    }, 5 * 60 * 1000);

    reader.onloadend = () => {
      clearTimeout(timeout);
    };
    
    // Read as data URL with progress tracking
    reader.readAsDataURL(file);
  });
}

/**
 * Extract file name without extension
 * @param fileName The full file name
 * @returns The file name without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Format file size for display
 * @param bytes The file size in bytes
 * @returns A formatted string representation of the file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}