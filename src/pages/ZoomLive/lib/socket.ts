import { io, type Socket } from 'socket.io-client';

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  /**
   * Get or create socket connection
   * Uses cookies for authentication (token sent automatically via cookies)
   * Backend extracts userId from token during handshake
   */
  getSocket(): Socket | null {
    // Return existing connection if available and connected
    if (this.socket) {
      if (this.socket.connected) {
        return this.socket;
      }

      if (this.isConnecting) {
        return this.socket;
      }

      console.log('Socket reconnect requested');
      this.isConnecting = true;
      this.socket.connect();
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    // Create new connection
    const wsUrl = import.meta.env.VITE_REACT_APP_SOCKET_BASE_URL || '/';
    console.log('Socket URL ------------------------- > ', wsUrl);
    const clientApp = 'zoom';

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
      this.isConnecting = false;
      console.log('Socket connected, user authenticated via cookie token');
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason: string) => {
      this.isConnecting = false;
      console.log('Socket disconnected:', reason);
    });

    // Handle errors
    this.socket.on('connect_error', (error: Error) => {
      this.isConnecting = false;
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
      this.isConnecting = false;
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

