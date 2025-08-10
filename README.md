# Travel Document Timeline

A beautiful, user-friendly web application for organizing travel documents in a timeline format. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Drag & Drop File Upload**: Intuitive drag-and-drop interface for uploading travel documents
- **File Browser Selection**: Traditional file picker for users who prefer clicking
- **Timeline Interface**: Beautiful card-based timeline layout for organizing documents
- **Editable Document Names**: Click to edit document names inline
- **Custom Date/Time**: Set custom dates and times for each document
- **Document Preview**: View images in a modal, PDFs in new tabs, and download other files
- **File Type Icons**: Visual indicators for different file types (PDF, images, documents)
- **File Validation**: Automatic validation of file types and sizes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **TypeScript**: Full type safety throughout the application
- **Production Ready**: ESLint configuration, proper error handling, and modern React patterns

## Supported File Types

### For Upload & Display:
- PDF documents (`application/pdf`)
- Images (JPEG, PNG, JPG)
- Word documents (DOC, DOCX)

### For AI Parsing:
- Text files (`text/plain`)
- PDF documents (`application/pdf`)
- Word documents (DOC, DOCX)
- CSV files (`text/csv`)
- JSON files (`application/json`)

## File Size Limits

- Maximum file size: 25MB per document

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voyage
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles
├── components/
│   └── FileUpload.tsx      # Reusable file upload component
└── ...
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js configuration
- **Build Tool**: Turbopack (development)

## Development

### Code Quality

The project uses ESLint with Next.js configuration for code quality. Run `npm run lint` to check for issues.

### TypeScript

Full TypeScript support with strict type checking. All components and functions are properly typed.

### Component Architecture

- **FileUpload**: Reusable component with drag-and-drop functionality
- **Main Page**: Container component managing timeline state and display
- **Timeline Cards**: Individual document cards with editing capabilities

### User Interface Features

- **Timeline Layout**: Beautiful vertical timeline with connecting lines
- **Inline Editing**: Click to edit document names and dates
- **File Preview**: Modal for images, new tabs for PDFs, download for others
- **File Type Icons**: Visual indicators for different document types
- **Responsive Design**: Works on all device sizes

## Production Deployment

The application is ready for production deployment on platforms like:

- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Any platform supporting Node.js

### Build for Production

```bash
npm run build
npm run start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- File preview functionality
- Document categorization
- Search and filtering
- Cloud storage integration
- User authentication
- Document sharing
- Mobile app version
