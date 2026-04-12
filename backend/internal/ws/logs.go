package ws

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/theo/pyrunner/internal/database"
	"github.com/theo/pyrunner/internal/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for now
	},
}

// Hub manages WebSocket connections for a script
type Hub struct {
	clients    map[*Client]bool
	broadcast  chan interface{}
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

// Client represents a WebSocket connection
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan interface{}
	closed bool
}

var hubs = make(map[string]*Hub) // script_id -> Hub
var hubsMu sync.RWMutex

// getOrCreateHub returns the hub for a script, creating if necessary
func getOrCreateHub(scriptID string) *Hub {
	hubsMu.Lock()
	defer hubsMu.Unlock()

	if hub, exists := hubs[scriptID]; exists {
		return hub
	}

	hub := &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan interface{}, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}

	go hub.run()
	hubs[scriptID] = hub
	return hub
}

// LogsWebSocketHandler establishes WebSocket connection for log streaming
func LogsWebSocketHandler(c *gin.Context) {
	scriptID := c.Param("id")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	hub := getOrCreateHub(scriptID)

	client := &Client{
		hub:  hub,
		conn: conn,
		send: make(chan interface{}, 256),
	}

	hub.register <- client

	// Send recent logs to new client
	go sendRecentLogs(client, scriptID)

	// Listen for messages
	go client.readPump()
	go client.writePump()
}

// sendRecentLogs sends recent logs to a newly connected client
func sendRecentLogs(client *Client, scriptID string) {
	var logs []models.ScriptLog
	database.DB.
		Where("script_id = ?", scriptID).
		Order("created_at DESC").
		Limit(100).
		Find(&logs)

	// Send in reverse order (oldest first)
	for i := len(logs) - 1; i >= 0; i-- {
		client.send <- gin.H{
			"type":     "log",
			"id":       logs[i].ID,
			"line":     logs[i].Line,
			"level":    logs[i].Level,
			"created_at": logs[i].CreatedAt,
		}
	}
}

// readPump reads messages from client (not much to do here, just keep connection alive)
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			return
		}
	}
}

// writePump writes messages to client
func (c *Client) writePump() {
	defer c.conn.Close()

	for msg := range c.send {
		if err := c.conn.WriteJSON(msg); err != nil {
			return
		}
	}
}

// run handles hub operations
func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					// Client's send channel is full, close it
					go func(c *Client) {
						h.unregister <- c
					}(client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastLog sends a log message to all connected clients for a script
func BroadcastLog(scriptID string, log models.ScriptLog) {
	hubsMu.RLock()
	hub, exists := hubs[scriptID]
	hubsMu.RUnlock()

	if exists {
		hub.broadcast <- gin.H{
			"type":       "log",
			"id":         log.ID,
			"line":       log.Line,
			"level":      log.Level,
			"created_at": log.CreatedAt,
		}
	}
}
