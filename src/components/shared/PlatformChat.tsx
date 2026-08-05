"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { api, getApiUrl } from "@/lib/api";
import { useReconnectingSocket } from "@/hooks/useReconnectingSocket";

type Contact = {
  id: string | number;
  name: string;
  email: string;
  role: string;
};

// The Node API returns full_name + a uuid id, not the name/numeric-id shape
// this chat panel was originally built against — normalize at the boundary
// rather than assuming the raw response already matches Contact.
function toContact(raw: Record<string, unknown>): Contact {
  return {
    id: (raw.id as string | number) ?? (raw._id as string | number),
    name: (raw.full_name as string) || (raw.name as string) || "Unknown",
    email: (raw.email as string) || "",
    role: (raw.role as string) || "",
  };
}

type Message = {
  sender_id?: string | number;
  sender_name?: string;
  sender_role?: string;
  receiver_id?: string | number;
  content: string;
  timestamp?: string;
  isMe?: boolean;
};

const SOCKET_STATUS_DISPLAY: Record<import("@/hooks/useReconnectingSocket").SocketStatus, { label: string; color: string }> = {
  open: { label: "Live", color: "#22c55e" },
  connecting: { label: "Connecting…", color: "#f59e0b" },
  reconnecting: { label: "Reconnecting…", color: "#f59e0b" },
  closed: { label: "Offline", color: "#9ca3af" },
};

export function PlatformChat() {
  const { user, token } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedContactRef = useRef<Contact | null>(null);
  const userIdRef = useRef<string | number | undefined>(user?.id);

  // Keep refs in sync — read from inside the socket's onMessage callback,
  // which is set up once and shouldn't itself change on every render.
  useEffect(() => { selectedContactRef.current = selectedContact; }, [selectedContact]);
  useEffect(() => { userIdRef.current = user?.id; }, [user?.id]);

  const handleIncomingMessage = useCallback((raw: unknown) => {
    const msg = raw as Message;
    const sc = selectedContactRef.current;
    const currentUserId = userIdRef.current;
    // Only show messages from/to the currently selected contact
    const isRelevant = sc && (
      (String(msg.sender_id) === String(sc.id) && String(msg.receiver_id) === String(currentUserId)) ||
      (String(msg.sender_id) === String(currentUserId) && String(msg.receiver_id) === String(sc.id))
    );
    if (!isRelevant) return;
    setMessages((prev) => {
      const exists = prev.find(p => p.timestamp === msg.timestamp && p.content === msg.content && String(p.sender_id) === String(msg.sender_id));
      if (exists) return prev;
      return [...prev, { ...msg, isMe: String(msg.sender_id) === String(currentUserId) }];
    });
  }, []);

  // Token as a WS subprotocol rather than a `?token=` query string — see
  // chatServer.js#authenticate for why (keeps it out of URLs that end up in
  // server access logs / browser history). `useMemo` so the protocols array
  // is referentially stable across renders — useReconnectingSocket
  // reconnects whenever this array's *contents* change, not on every render.
  const wsProtocols = useMemo(() => (token ? [token] : undefined), [token]);
  const wsUrl = useMemo(() => {
    if (!user || !token) return null;
    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
    return getApiUrl().replace(/^http(s)?:/, protocol) + `/chat/ws`;
  }, [user, token]);

  const { status: socketStatus, send: sendSocketMessage } = useReconnectingSocket(wsUrl, wsProtocols, handleIncomingMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch contacts (users from the same college or all for super admin)
  useEffect(() => {
    const isAdmin = user?.role === "super_admin" || user?.role === "institution_admin";
    const fetchContacts = async () => {
      try {
        // GET /users/ is admin-only (403 for everyone else) — picking the
        // right endpoint up front instead of trying it and catching avoids
        // deliberately firing a request every non-admin is guaranteed to
        // get rejected on.
        const res = await api.get(isAdmin ? "/users/" : "/students");
        let allUsers = (res.data as Record<string, unknown>[])
          .map(toContact)
          .filter((c) => String(c.id) !== String(user?.id));

        // Add virtual broadcast contacts for admins
        if (isAdmin) {
          allUsers = [
            { id: -3, name: "📢 Broadcast to Everyone", email: "Sends to all users", role: "broadcast" },
            { id: -2, name: "📢 Broadcast to Faculty", email: "Sends to all faculty", role: "broadcast" },
            { id: -1, name: "📢 Broadcast to Students", email: "Sends to all students", role: "broadcast" },
            ...allUsers
          ];
        }
        setContacts(allUsers);
      } catch {
        setContacts([]);
      }
    };
    if (user) fetchContacts();
  }, [user]);

  // Fetch history when selecting a contact
  useEffect(() => {
    if (!selectedContact) { setMessages([]); return; }
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${selectedContact.id}`);
        const history = (res.data.messages || []).map((m: any) => ({
          ...m,
          isMe: String(m.sender_id) === String(user?.id)
        }));
        setMessages(history);
      } catch {
        setMessages([]);
      }
    };
    fetchHistory();
  }, [selectedContact, user]);

  const handleSend = () => {
    if (!input.trim() || socketStatus !== "open" || !selectedContact) return;

    if (typeof selectedContact.id === "number" && selectedContact.id < 0) {
      // Broadcast mode
      const targets = contacts.filter(c => {
        if (typeof c.id === "number" && c.id < 0) return false; // skip virtual contacts
        if (selectedContact.id === -1) return c.role === "student";
        if (selectedContact.id === -2) return c.role === "faculty";
        if (selectedContact.id === -3) return true; // everyone
        return false;
      });

      targets.forEach(t => {
        sendSocketMessage({ receiver_id: t.id, content: input });
      });

      // Also add it locally so the admin sees what they broadcasted
      setMessages(prev => [...prev, {
        sender_id: user?.id,
        sender_name: user?.name,
        receiver_id: selectedContact.id,
        content: input,
        timestamp: new Date().toISOString(),
        isMe: true
      }]);
    } else {
      // Normal 1-on-1 mode
      sendSocketMessage({ receiver_id: selectedContact.id, content: input });
    }

    setInput("");
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "faculty": return { bg: "#ede9fe", color: "#7c3aed" };
      case "student": return { bg: "#dbeafe", color: "#2563eb" };
      case "hr": return { bg: "#d1fae5", color: "#047857" };
      case "college_admin":
      case "institution_admin": return { bg: "#fef3c7", color: "#b45309" };
      case "super_admin": return { bg: "#fee2e2", color: "#dc2626" };
      case "broadcast": return { bg: "#fce7f3", color: "#db2777" };
      default: return { bg: "#f3f4f6", color: "#6b7280" };
    }
  };

  return (
    <div className="screen active" style={{ padding: "24px 40px", height: "100%", display: "flex", flexDirection: "column" }}>
      <style jsx global>{`
        @keyframes pc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", marginBottom: "4px" }}>Messages</h2>
        <p style={{ color: "var(--muted)", fontSize: "14px" }}>Select a user to start a conversation.</p>
      </div>

      <div style={{ display: "flex", flex: 1, gap: "16px", minHeight: 0, maxHeight: "calc(100vh - 180px)" }}>
        {/* Contact List */}
        <div className="card" style={{ width: "280px", flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px", borderBottom: "1px solid var(--border)" }}>
            <input
              type="text"
              className="fi"
              placeholder="Search users..."
              style={{ marginBottom: 0, fontSize: "13px" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredContacts.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>No contacts found</div>
            )}
            {filteredContacts.map(c => {
              const badge = getRoleBadgeColor(c.role);
              const isSelected = selectedContact?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedContact(c)}
                  style={{
                    padding: "12px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--accent-l, #eef2ff)" : "transparent",
                    borderLeft: isSelected ? "3px solid var(--accent)" : "3px solid transparent",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: badge.bg, color: badge.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                      {c.role === "broadcast" ? "📢" : c.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</div>
                    </div>
                  </div>
                  <span style={{ display: "inline-block", marginTop: "4px", padding: "2px 8px", background: badge.bg, color: badge.color, borderRadius: "4px", fontSize: "10px", fontWeight: 600, textTransform: "capitalize" }}>
                    {c.role.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selectedContact ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "var(--muted)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ marginBottom: "12px", opacity: 0.4 }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <div style={{ fontSize: "15px", fontWeight: 600 }}>Select a contact</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Choose someone from the list to start messaging</div>
            </div>
          ) : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: getRoleBadgeColor(selectedContact.role).bg, color: getRoleBadgeColor(selectedContact.role).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>
                    {selectedContact.role === "broadcast" ? "📢" : selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{selectedContact.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--muted)", textTransform: "capitalize" }}>{selectedContact.role.replace("_", " ")}</div>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }} title={`Connection: ${socketStatus}`}>
                  <span style={{
                    display: "inline-block", width: "7px", height: "7px", borderRadius: "50%",
                    background: SOCKET_STATUS_DISPLAY[socketStatus].color,
                    animation: socketStatus === "reconnecting" || socketStatus === "connecting" ? "pc-pulse 1.2s ease-in-out infinite" : undefined,
                  }}></span>
                  {SOCKET_STATUS_DISPLAY[socketStatus].label}
                </div>
              </div>

              <div style={{ flex: 1, padding: "16px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: "center", color: "var(--muted)", marginTop: "40px", fontSize: "13px" }}>
                    No messages yet. Say hello to {selectedContact.name}!
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.isMe ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                    <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "3px", textAlign: m.isMe ? "right" : "left" }}>
                      {m.sender_name || (m.isMe ? "You" : selectedContact.name)}
                      {m.timestamp && <span style={{ marginLeft: "6px", opacity: 0.6 }}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: m.isMe ? "var(--accent)" : "var(--bg)",
                      color: m.isMe ? "white" : "var(--text)",
                      border: m.isMe ? "none" : "1px solid var(--border)",
                      borderBottomRightRadius: m.isMe ? "4px" : "12px",
                      borderBottomLeftRadius: m.isMe ? "12px" : "4px",
                      fontSize: "14px", lineHeight: 1.5
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="fi"
                  placeholder={socketStatus === "open" ? `Message ${selectedContact.name}...` : SOCKET_STATUS_DISPLAY[socketStatus].label}
                  style={{ marginBottom: 0, fontSize: "14px" }}
                  value={input}
                  disabled={socketStatus !== "open"}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  className="btn btn-p"
                  onClick={handleSend}
                  disabled={socketStatus !== "open" || !input.trim()}
                  style={{ padding: "0 20px", flexShrink: 0, opacity: socketStatus !== "open" ? 0.6 : 1 }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
