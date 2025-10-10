/**
 * Utility functions for handling PDF files
 */

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface PDFProcessingResult {
  success: boolean;
  dataUri?: string;
  error?: string;
}

/**
 * Process a PDF file and convert it to a data URI
 * @param file The PDF file to process
 * @returns A promise that resolves to a PDFProcessingResult
 */
export async function processPDFFile(file: File): Promise<PDFProcessingResult> {
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

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
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
    
    // Read as data URL
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