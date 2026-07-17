import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { api } from "../api";

// ── Data contract (what Dylan's endpoint returns) ──
// GET /api/notifications?withinDays=7  ->  AppNotification[]
export interface AppNotification {
  id: number;
  type: "milestone";
  title: string; // e.g. "La Bohème — Opening Night"
  date: string; // ISO 8601, the date the milestone falls on
  productionId: number; // used to link to /productions/:id
  eventType?: string; // e.g. "Mainstage"
}

interface NotificationsValue {
  items: AppNotification[];
  count: number;
  loading: boolean;
  refetch: () => void;
}

const WITHIN_DAYS = 7;

// Dev-only sample so the bell/toast are visible before the endpoint exists.
// Dates are generated relative to today so they always land "this week".
const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(19, 30, 0, 0);
  return d.toISOString();
};

const MOCK: AppNotification[] = [
  {
    id: 1,
    type: "milestone",
    title: "La Bohème — Opening Night",
    date: daysFromNow(1),
    productionId: 1,
    eventType: "Mainstage",
  },
  {
    id: 2,
    type: "milestone",
    title: "The Magic Flute — Final Performance",
    date: daysFromNow(4),
    productionId: 2,
    eventType: "Mainstage",
  },
  {
    id: 3,
    type: "milestone",
    title: "Emerging Artists Recital",
    date: daysFromNow(6),
    productionId: 3,
    eventType: "Recital",
  },
];

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
      const res = await api.get(`/api/notifications?withinDays=${WITHIN_DAYS}`);
      if (!res.ok) throw new Error();
      const data: AppNotification[] = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      // Endpoint not built yet: show sample data in dev, nothing in prod.
      setItems(import.meta.env.DEV ? MOCK : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <NotificationsContext.Provider
      value={{ items, count: items.length, loading, refetch }}
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