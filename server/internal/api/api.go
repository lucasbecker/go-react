package api

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5"
	"github.com/lucasbecker/go-react/internal/store/pgstore"

	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

const (
	NotificationKindMessageCreated          = "message_created"
	NotificationKindMessageRactionIncreased = "message_reaction_increased"
	NotificationKindMessageRactionDecreased = "message_reaction_decreased"
	NotificationKindMessageAnswered         = "message_answered"
)

type NotificationMessageCreated struct {
	Id      string `json:"id"`
	Message string `json:"message"`
}

type NotificationMessageReactionIncreased struct {
	Id    string `json:"id"`
	Count int64  `json:"count"`
}

type NotificationMessageReactionDecreased struct {
	Id    string `json:"id"`
	Count int64  `json:"count"`
}

type NotificationMessageAnswered struct {
	Id string `json:"id"`
}

type Message struct {
	Kind   string `json:"kind"`
	Value  any    `json:"value"`
	RoomId string `json:"-"`
}

type apiHandler struct {
	q           *pgstore.Queries
	r           *chi.Mux
	upgrader    websocket.Upgrader
	subscribers map[string]map[*websocket.Conn]context.CancelFunc
	mu          *sync.Mutex
}

func (h apiHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	h.r.ServeHTTP(w, r)
}

func NewHandler(q *pgstore.Queries) http.Handler {
	a := apiHandler{
		q: q,
		upgrader: websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
			return true
		}},
		subscribers: make(map[string]map[*websocket.Conn]context.CancelFunc),
		mu:          &sync.Mutex{},
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.Recoverer, middleware.Logger)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Context-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Get("/subscribe/{room_id}", a.handleSubscribe)

	r.Route("/api", func(r chi.Router) {
		r.Route("/rooms", func(r chi.Router) {
			r.Post("/", a.handleCreateRoom)
			r.Get("/", a.handleGetRooms)

			r.Route("/{room_id}/messages", func(r chi.Router) {
				r.Post("/", a.handleCreateRoomMessage)
				r.Get("/", a.handleGetRoomMessages)

				r.Route("/{message_id}", func(r chi.Router) {
					r.Get("/", a.handleGetRoomMessage)
					r.Patch("/react", a.handleReactToMessage)
					r.Delete("/react", a.handleRemoveReactFromMessage)
					r.Patch("/answer", a.handleMarkMessageAsAnswered)
				})
			})
		})
	})

	a.r = r

	return a
}

func (h apiHandler) notifyClients(msg Message) {
	h.mu.Lock()
	defer h.mu.Unlock()

	subscribers, ok := h.subscribers[msg.RoomId]

	if !ok || len(subscribers) == 0 {
		return
	}

	for conn, cancel := range subscribers {
		if err := conn.WriteJSON(msg); err != nil {
			slog.Error("failed to send message to client", "error", err)
			cancel()
		}
	}
}

func (h apiHandler) readRoom(
	w http.ResponseWriter,
	r *http.Request,
) (room pgstore.Room, rawRoomId string, roomId uuid.UUID, ok bool) {
	rawRoomId = chi.URLParam(r, "room_id")

	roomId, err := uuid.Parse(rawRoomId)

	if err != nil {
		http.Error(w, "invalid room id", http.StatusBadRequest)
		return pgstore.Room{}, "", uuid.UUID{}, false
	}

	room, err = h.q.GetRoom(r.Context(), roomId)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "room not found", http.StatusBadRequest)
			return pgstore.Room{}, "", uuid.UUID{}, false
		}

		slog.Error("failed to get room", "error", err)
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		return pgstore.Room{}, "", uuid.UUID{}, false
	}

	return room, rawRoomId, roomId, true
}

func (h apiHandler) readMessage(
	w http.ResponseWriter,
	r *http.Request,
) (message pgstore.Message, rawMessageId string, messageId uuid.UUID, ok bool) {
	rawMessageId = chi.URLParam(r, "message_id")

	messageId, err := uuid.Parse(rawMessageId)

	if err != nil {
		http.Error(w, "invalid message id", http.StatusBadRequest)
		return pgstore.Message{}, "", uuid.UUID{}, false
	}

	message, err = h.q.GetMessage(r.Context(), messageId)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			http.Error(w, "message not found", http.StatusBadRequest)
			return pgstore.Message{}, "", uuid.UUID{}, false
		}

		slog.Error("failed to get message", "error", err)
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		return pgstore.Message{}, "", uuid.UUID{}, false
	}

	return message, rawMessageId, messageId, true
}

func sendJSON(w http.ResponseWriter, rawData any) {
	data, _ := json.Marshal(rawData)

	w.Header().Set("Content-Type", "application/json")

	_, _ = w.Write(data)
}

func (h apiHandler) handleSubscribe(w http.ResponseWriter, r *http.Request) {
	_, rawRoomId, _, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	c, err := h.upgrader.Upgrade(w, r, nil)

	if err != nil {
		slog.Warn("failed to upgrade connection", "error", err)
		http.Error(w, "failed to upgrade to websocket connection", http.StatusBadRequest)
		return
	}

	defer c.Close()

	ctx, cancel := context.WithCancel(r.Context())

	h.mu.Lock()
	if _, ok := h.subscribers[rawRoomId]; !ok {
		h.subscribers[rawRoomId] = make(map[*websocket.Conn]context.CancelFunc)
	}
	h.subscribers[rawRoomId][c] = cancel
	slog.Info("new client connected", "room_id", rawRoomId, "client_ip", r.RemoteAddr)
	h.mu.Unlock()

	<-ctx.Done()

	h.mu.Lock()
	delete(h.subscribers[rawRoomId], c)
	h.mu.Unlock()
}

func (h apiHandler) handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	type _body struct {
		Theme string `json:"theme"`
	}

	var body _body

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	roomId, err := h.q.InsertRoom(r.Context(), body.Theme)

	if err != nil {
		slog.Error("failed to insert room", "error", err)
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		return
	}

	type response struct {
		Id string `json:"id"`
	}

	sendJSON(w, response{Id: roomId.String()})
}

func (h apiHandler) handleGetRooms(w http.ResponseWriter, r *http.Request) {
	rooms, err := h.q.GetRooms(r.Context())

	if err != nil {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		slog.Error("failed to get rooms", "error", err)
		return
	}

	if rooms == nil {
		rooms = []pgstore.Room{}
	}

	sendJSON(w, rooms)
}

func (h apiHandler) handleGetRoomMessages(w http.ResponseWriter, r *http.Request) {
	_, _, roomId, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	messages, err := h.q.GetRoomMessages(r.Context(), roomId)

	if err != nil {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		slog.Error("failed to get messages from room", "error", err)
		return
	}

	if messages == nil {
		messages = []pgstore.Message{}
	}

	sendJSON(w, messages)
}

func (h apiHandler) handleCreateRoomMessage(w http.ResponseWriter, r *http.Request) {
	_, rawRoomId, roomId, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	type _body struct {
		Message string `json:"message"`
	}

	var body _body

	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}

	messageId, err := h.q.InsertMessage(r.Context(), pgstore.InsertMessageParams{RoomID: roomId, Message: body.Message})

	if err != nil {
		slog.Error("failed to insert message", "error", err)
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		return
	}

	type response struct {
		Id string `json:"id"`
	}

	sendJSON(w, response{Id: messageId.String()})

	go h.notifyClients(Message{
		Kind:   NotificationKindMessageCreated,
		RoomId: rawRoomId,
		Value: NotificationMessageCreated{
			Id:      messageId.String(),
			Message: body.Message,
		},
	})
}

func (h apiHandler) handleGetRoomMessage(w http.ResponseWriter, r *http.Request) {
	_, _, _, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	message, _, _, ok := h.readMessage(w, r)

	if !ok {
		return
	}

	sendJSON(w, message)
}

func (h apiHandler) handleReactToMessage(w http.ResponseWriter, r *http.Request) {
	_, rawRoomId, _, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	_, rawMessageId, messageId, ok := h.readMessage(w, r)

	if !ok {
		return
	}

	count, err := h.q.ReactToMessage(r.Context(), messageId)

	if err != nil {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		slog.Error("failed to react to message", "error", err)
		return
	}

	type response struct {
		Count int64 `json:"count"`
	}

	sendJSON(w, response{Count: count})

	go h.notifyClients(Message{
		Kind:   NotificationKindMessageRactionIncreased,
		RoomId: rawRoomId,
		Value: NotificationMessageReactionIncreased{
			Id:    rawMessageId,
			Count: count,
		},
	})
}

func (h apiHandler) handleRemoveReactFromMessage(w http.ResponseWriter, r *http.Request) {
	_, rawRoomId, _, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	_, rawMessageId, messageId, ok := h.readMessage(w, r)

	if !ok {
		return
	}

	count, err := h.q.RemoveReactionFromMessage(r.Context(), messageId)

	if err != nil {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		slog.Error("failed to remove reaction from message", "error", err)
		return
	}

	type response struct {
		Count int64 `json:"count"`
	}

	sendJSON(w, response{Count: count})

	go h.notifyClients(Message{
		Kind:   NotificationKindMessageRactionDecreased,
		RoomId: rawRoomId,
		Value: NotificationMessageReactionDecreased{
			Id:    rawMessageId,
			Count: count,
		},
	})
}

func (h apiHandler) handleMarkMessageAsAnswered(w http.ResponseWriter, r *http.Request) {
	_, rawRoomId, _, ok := h.readRoom(w, r)

	if !ok {
		return
	}

	_, rawMessageId, messageId, ok := h.readMessage(w, r)

	if !ok {
		return
	}

	err := h.q.MarkMessageAsAnswered(r.Context(), messageId)

	if err != nil {
		http.Error(w, "something went wrong", http.StatusInternalServerError)
		slog.Error("failed to mark message as answered", "error", err)
		return
	}

	w.WriteHeader(http.StatusOK)

	go h.notifyClients(Message{
		Kind:   NotificationKindMessageAnswered,
		RoomId: rawRoomId,
		Value: NotificationMessageAnswered{
			Id: rawMessageId,
		},
	})
}
