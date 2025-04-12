# WebRTC File Sharing Application

A real-time peer-to-peer file sharing application built using WebRTC and WebSocket for signaling. The application allows users to share files directly between browsers with progress tracking and a modern dark-themed UI.

## Features

- 🔄 Peer-to-peer file transfer using WebRTC
- 📁 Support for any file type
- 📊 Real-time progress tracking
- 🌙 Modern dark theme interface
- 🔒 Secure direct transfer between peers
- 👥 Multiple user support
- ⚡ Chunked file transfer for better performance

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
node server.js
```

2. Open your browser and navigate to:
```
http://localhost:6888
```

3. The application will automatically assign you a user ID.

### Sending Files

1. Click the "send" button
2. Select the file you want to share
3. Click on a receiver from the available users list
4. Wait for the receiver to accept the request

### Receiving Files

1. Click the "receive" button to make yourself available as a receiver
2. When someone wants to share a file, you'll get a popup notification
3. Click "accept" to receive the file or "decline" to reject
4. The file will automatically download once the transfer is complete

## Technical Details

### Ports Used
- Main Server: 6888
- WebSocket Server: 8895

### Technologies Used

- WebRTC for peer-to-peer communication
- WebSocket for signaling
- Node.js for the backend server
- Native JavaScript for frontend
- HTML5 & CSS3 for UI

### Key Components

- `server.js`: Handles WebSocket signaling and serves static files
- `index.js`: Contains the WebRTC logic and UI interactions
- `index.css`: Styles and dark theme implementation

## Architecture

The application uses a WebSocket server for signaling and WebRTC for the actual file transfer:

1. Signaling Server (WebSocket)
   - User management
   - Connection establishment
   - Peer discovery

2. WebRTC
   - Direct peer-to-peer connection
   - File chunking and transfer
   - Progress tracking

## Limitations

- Maximum 5 concurrent users
- Browser must support WebRTC
- Both peers must be online during transfer

## Error Handling

- Automatic reconnection for lost connections
- Error logging for failed transfers
- Graceful handling of declined transfers

## Browser Support

Works on modern browsers that support WebRTC:
- Chrome (recommended)
- Firefox
- Edge
- Safari

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 