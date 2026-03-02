import { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Radio, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";


interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_system_message: boolean;
  created_at: string;
}

interface MissionChatProps {
  taskId: string;
  taskType: "Beacon" | "Event";
  currentUser: {
    user_id?: string;
    id?: string;
    full_name?: string;
    name?: string;
  };
  onClose: () => void;
}

export const MissionChat = ({
  taskId,
  taskType,
  currentUser,
  onClose,
}: MissionChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Safely extract user ID and Name regardless of how they are saved in localStorage
  const safeUserId = currentUser.user_id || currentUser.id || "";
  const safeUserName = currentUser.full_name || currentUser.name || "Responder";

  // 1. Fetch History & Connect Socket
  useEffect(() => {
    if (!taskId) return;

    // Fetch past messages
    axios
      .get(`${API_BASE_URL}/api/rescue/chat/${taskId}`, {
        headers: getHeaders(),
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Failed to load chat history", err));

    // Connect to Socket
    const newSocket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.emit("join_mission", taskId);

    newSocket.on("receive_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [taskId]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // 3. Send Message
  const handleSend = (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || !socket) return;

    // Aggressively hunt for the user ID and Name
    const safeUserId = currentUser?.user_id || (currentUser as any)?.id || null;
    const safeUserName =
      currentUser?.full_name || (currentUser as any)?.name || "Responder";

    socket.emit("send_message", {
      taskId,
      taskType,
      senderId: safeUserId,
      senderName: safeUserName,
      text,
    });

    setDraft("");
    inputRef.current?.focus();
  };

  // ONLY ONE isOwn DECLARATION HERE
  const isOwn = (msg: Message) => msg.sender_id === safeUserId;

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <motion.div
        layout
        className="relative flex flex-col w-full h-[85vh] sm:h-[75vh] sm:max-w-lg sm:rounded-2xl overflow-hidden border border-white/10 bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-card/80 backdrop-blur-md">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/20 text-primary">
            {taskType === "Beacon" ? (
              <Radio className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {taskType} Chat
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              ID: {taskId ? taskId.split("-")[0] : "Unknown"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              if (msg.is_system_message) {
                return (
                  <motion.div
                    key={msg.message_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center my-4"
                  >
                    <span className="text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-white/5">
                      {msg.message}
                    </span>
                  </motion.div>
                );
              }

              const own = isOwn(msg);
              return (
                <motion.div
                  key={msg.message_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    own ? "ml-auto items-end" : "items-start",
                  )}
                >
                  {!own && (
                    <span className="text-[11px] font-medium text-primary mb-0.5 pl-1">
                      {msg.sender_name}
                    </span>
                  )}
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm",
                      own
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-white/10 text-foreground rounded-bl-md",
                    )}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {formatTime(msg.created_at)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-card/80 backdrop-blur-md"
        >
          <div className="relative flex-1">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted/30 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!draft.trim() || !taskId}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/80 transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};
