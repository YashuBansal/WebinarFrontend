import { io, type Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;

  /**
   * Get or create socket connection
   * Uses cookies for authentication (token sent automatically via cookies)
   * Backend extracts userId from token during handshake
   */
  getSocket(): Socket | null {
    // Return existing connection if available and connected
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Create new connection
    // TODO: Replace with environment variable later
    const wsUrl = import.meta.env.VITE_REACT_APP_WORKING_ENVIRONMENT === "development"
      ? import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL_DEVELOPMENT
      : import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL_MAIN_PRODUCTION;
    
    console.log('wsUrl ------------------------- > ', wsUrl);
    const clientApp = 'whatsapp';

    // Socket.IO automatically sends cookies with requests
    // Backend will verify token from cookies and automatically join user to their room
    this.socket = io(wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true, // Important: sends cookies with requests
      auth: {
        clientApp,
      },
    });

    // Log connection - user is automatically joined to room by backend after token verification
    this.socket.on('connect', () => {
      console.log('Socket connected, user authenticated via cookie token');
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });

    // Handle errors
    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current socket instance
   */
  getSocketInstance(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const socketManager = new SocketManager();

