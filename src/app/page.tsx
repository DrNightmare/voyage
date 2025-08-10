'use client';

import { useState } from 'react';
import { format, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';
import { parseDocument } from '@/utils/fileParser';

interface TravelDocument {
  id: string;
  file: File;
  displayName: string;
  customDateTime: string; // ISO string
  uploadedAt: Date;
}

export default function Home() {
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [parsingId, setParsingId] = useState<string | null>(null);

  const handleFileAdded = (file: File) => {
    const documentId = crypto.randomUUID();
    
    // Create document entry with default values (today at 10 AM local time)
    const today = new Date();
    const todayAt10AM = setHours(setMinutes(startOfDay(today), 0), 10);
    
    const newDocument: TravelDocument = {
      id: documentId,
      file: file,
      displayName: file.name,
      customDateTime: todayAt10AM.toISOString(),
      uploadedAt: new Date(),
    };

    setDocuments(prev => [...prev, newDocument].sort((a, b) => 
      parseISO(a.customDateTime).getTime() - parseISO(b.customDateTime).getTime()
    ));
  };

  const updateDocument = (id: string, updates: Partial<TravelDocument>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates } : doc
    ).sort((a, b) => 
      parseISO(a.customDateTime).getTime() - parseISO(b.customDateTime).getTime()
    ));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const parseDocumentData = async (doc: TravelDocument) => {
    setParsingId(doc.id);
    
    try {
      const result = await parseDocument(doc.file);
      
      if (result.success && result.data) {
        const updates: Partial<TravelDocument> = {
          displayName: result.data.documentName,
        };
        
        // Update datetime if timestamp was found
        if (result.data.timestamp) {
          updates.customDateTime = result.data.timestamp;
        }
        
        updateDocument(doc.id, updates);
      } else {
        alert(`Failed to parse document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      alert('An error occurred while parsing the document');
    } finally {
      setParsingId(null);
    }
  };



  const formatDateTime = (dateTime: string): string => {
    try {
      const date = parseISO(dateTime);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return dateTime;
    }
  };



  const openFilePreview = (file: File) => {
    if (file.type.includes('image')) {
      setPreviewFile(file);
    } else if (file.type.includes('pdf')) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else {
      // For other file types, try to download or show as text
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Travel Document Timeline
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Organize your travel documents in a beautiful timeline. 
            Upload, edit, and view your documents with ease.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-12">
          <FileUpload 
            onFileAdded={handleFileAdded}
            acceptedFileTypes={[
              'application/pdf',
              'image/jpeg',
              'image/png',
              'image/jpg',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]}
            maxFileSize={25 * 1024 * 1024} // 25MB
          />
        </div>

        {/* Timeline */}
        {documents.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Your Travel Documents ({documents.length})
            </h2>
            
            <div className="space-y-6">
              {documents.map((doc, index) => (
                <div key={doc.id} className="relative">
                  {/* Timeline line */}
                  {index < documents.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  
                  {/* Document Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 ml-12 relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-6 top-6 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        

                        {/* Editable name */}
                        <div className="mb-4">
                          {editingId === doc.id ? (
                            <input
                              type="text"
                              value={doc.displayName}
                              onChange={(e) => updateDocument(doc.id, { displayName: e.target.value })}
                              onBlur={() => setEditingId(null)}
                              onKeyPress={(e) => e.key === 'Enter' && setEditingId(null)}
                              className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 w-full"
                              autoFocus
                            />
                          ) : (
                            <h3 
                              className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => setEditingId(doc.id)}
                            >
                              {doc.displayName}
                            </h3>
                          )}
                        </div>

                                                 {/* Date display */}
                         <div className="mb-4">
                           <h4 className="text-lg font-medium text-gray-900 mb-2">
                             {formatDateTime(doc.customDateTime)}
                           </h4>
                         </div>

                         {/* Editable date */}
                         <div className="mb-4">
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Date
                           </label>
                           <input
                             type="date"
                             value={doc.customDateTime.slice(0, 10)}
                             onChange={(e) => {
                               const currentDateTime = parseISO(doc.customDateTime);
                               const newDate = parseISO(e.target.value);
                               const updatedDateTime = setHours(setMinutes(newDate, currentDateTime.getMinutes()), currentDateTime.getHours());
                               updateDocument(doc.id, { customDateTime: updatedDateTime.toISOString() });
                             }}
                             className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           />
                         </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openFilePreview(doc.file)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          
                          <button
                            onClick={() => parseDocumentData(doc)}
                            disabled={parsingId === doc.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {parsingId === doc.id ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Parsing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Parse
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => setEditingId(doc.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Name
                          </button>
                          
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first travel document above.
              </p>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">{previewFile.name}</h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <Image 
                  src={URL.createObjectURL(previewFile)} 
                  alt={previewFile.name}
                  width={800}
                  height={600}
                  className="max-w-full h-auto"
                  unoptimized
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
