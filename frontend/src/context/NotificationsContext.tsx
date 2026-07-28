/* NotificationsContext.tsx
   Milestone notifications, for example an artist reaching their 50th
   performance. Shared by the bell in the navbar and the toast, which is why it
   is context rather than state inside either one. Both need the same list and
   the same unread count, and they must not disagree.

   Mounted once in App, above the routes, so the list survives navigation
   instead of refetching every time the page changes.

   Historical note, and a useful one: this file is the subject of the production
   only bug described in main.tsx. Top level await there made the entry an async
   module, Rollup split shared modules across chunks, and this module ended up
   duplicated in the bundle. The provider and the hook then referenced two
   different context objects, so the lookup at the bottom of this file found
   nothing and threw. The error read as though the provider was missing when it
   was plainly there.
*/
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

/* 50 -> "50th", 1 -> "1st", 22 -> "22nd", 113 -> "113th".
   `milestoneCount` is the milestone being celebrated (a 50th performance), NOT
   a count of anything. Rendered as a bare number next to a name it reads like a
   counter and gets confused with the unread badge, so both the bell panel and
   the toast run it through here. */
export const ordinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

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

  /* Optimistic update. The item is removed from the list immediately, before the
     server has confirmed anything, so the badge count drops the instant the user
     clicks rather than after a round trip.

     previous is captured first so the change can be undone. If the request
     fails, the list is put back exactly as it was and the notification
     reappears, which is the correct outcome since it was never actually marked
     read.

     Refetching instead would be simpler but would make the badge lag behind the
     click, and the endpoint only returns unread items anyway, so removing it
     locally produces the same result. */
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

/* Throwing rather than returning undefined means a component used outside the
   provider fails loudly at the point of the mistake, instead of quietly reading
   undefined and crashing somewhere less obvious later.

   This is the throw that fired during the chunking bug. Worth remembering that
   the message was accurate about the symptom and misleading about the cause:
   the provider existed, it just belonged to a different copy of this module. */
export const useNotifications = (): NotificationsValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within a <NotificationsProvider>",
    );
  return ctx;
};