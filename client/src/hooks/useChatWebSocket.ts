import { useEffect, useRef, useCallback, useState } from "react";
import { queryClient } from "@/lib/queryClient";

interface WebSocketMessage {
  type: 'new_message';
  conversationId: string;
  message: any;
}

// WebSocket configuration
const WS_CONFIG = {
  maxReconnectAttempts: 5,
  initialReconnectDelay: 1000, // 1 second
  maxReconnectDelay: 30000, // 30 seconds
  reconnectDecay: 1.5, // Exponential backoff multiplier
};

export function useChatWebSocket(conversationId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const calculateReconnectDelay = useCallback(() => {
    const attempt = reconnectAttemptsRef.current;
    const delay = Math.min(
      WS_CONFIG.initialReconnectDelay * Math.pow(WS_CONFIG.reconnectDecay, attempt),
      WS_CONFIG.maxReconnectDelay
    );
    return delay;
  }, []);

  const connect = useCallback(() => {
    if (!conversationId) return;

    // Check if we've exceeded max reconnection attempts
    if (reconnectAttemptsRef.current >= WS_CONFIG.maxReconnectAttempts) {
      console.error(`WebSocket: Max reconnection attempts (${WS_CONFIG.maxReconnectAttempts}) exceeded`);
      setConnectionStatus('disconnected');
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
    
    try {
      setConnectionStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setConnectionStatus('connected');
        // Reset reconnection attempts on successful connection
        reconnectAttemptsRef.current = 0;
        
        ws.send(JSON.stringify({
          type: 'join_conversation',
          conversationId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'new_message' && data.conversationId === conversationId) {
            // Invalidate queries to refresh UI with new message
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/conversations", conversationId, "messages"] 
            });
            queryClient.invalidateQueries({ 
              queryKey: ["/api/chat/conversations"] 
            });
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        setConnectionStatus('disconnected');
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        setConnectionStatus('disconnected');
        wsRef.current = null;

        // Only attempt reconnection if not a normal closure and within retry limit
        if (event.code !== 1000 && reconnectAttemptsRef.current < WS_CONFIG.maxReconnectAttempts) {
          const delay = calculateReconnectDelay();
          reconnectAttemptsRef.current += 1;
          
          console.log(
            `[WebSocket] Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${WS_CONFIG.maxReconnectAttempts})`
          );
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Error creating connection:', error);
      setConnectionStatus('disconnected');
      
      // Retry with exponential backoff
      if (reconnectAttemptsRef.current < WS_CONFIG.maxReconnectAttempts) {
        const delay = calculateReconnectDelay();
        reconnectAttemptsRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    }
  }, [conversationId, calculateReconnectDelay]);

  useEffect(() => {
    if (conversationId) {
      // Reset reconnection counter when conversation changes
      reconnectAttemptsRef.current = 0;
      connect();
    }

    return () => {
      // Cleanup on unmount or conversation change
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Use code 1000 for normal closure (won't trigger reconnection)
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [conversationId, connect]);

  return { connectionStatus };
}
