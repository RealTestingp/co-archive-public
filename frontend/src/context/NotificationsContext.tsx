import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { api } from "../api";

// ── Matches NotificationsController.GetAll() ──
// GET /api/notifications  ->  all UNREAD notifications
export interface AppNotification {
  id: number;
  message: string;
  milestoneType: string; // e.g. "Performance", "Production"
  milestoneCount: number; // e.g. 50
  createdAt: string; // ISO 8601
  isRead: boolean;
  person: {
    firstName: string;
    lastName: string;
  };
}

interface NotificationsValue {
  items: AppNotification[];
  count: number;
  loading: boolean;
  refetch: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | undefined>(
  undefined,
);

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications");
      if (!res.ok) throw new Error();
      const data: AppNotification[] = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // The endpoint only returns unread items, so on success we drop it locally
  // rather than refetching — keeps the badge instant.
  const markAsRead = useCallback(async (id: number) => {
    const previous = items;
    setItems((list) => list.filter((n) => n.id !== id));
    try {
      const res = await api.put(`/api/notifications/${id}/read`, {});
      if (!res.ok) throw new Error();
    } catch {
      setItems(previous); // roll back if the call failed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const markAllAsRead = useCallback(async () => {
    const previous = items;
    setItems([]);
    try {
      const res = await api.put("/api/notifications/read-all", {});
      if (!res.ok) throw new Error();
    } catch {
      setItems(previous);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <NotificationsContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        refetch,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within a <NotificationsProvider>",
    );
  return ctx;
};