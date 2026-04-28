import { useState } from "react";
import { Bell, CheckCheck, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useGetUnreadNotificationsCount,
  useListDownloads,
  useMarkAllNotificationsRead,
  getGetUnreadNotificationsCountQueryKey,
  getListDownloadsQueryKey,
} from "@workspace/api-client-react";
function formatRelativeKu(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ئێستا";
  if (minutes < 60) return `${minutes} خولەک پێش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} کاتژمێر پێش`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ڕۆژ پێش`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} هەفتە پێش`;
  const months = Math.floor(days / 30);
  return `${months} مانگ پێش`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadData } = useGetUnreadNotificationsCount({
    query: {
      queryKey: getGetUnreadNotificationsCountQueryKey(),
      refetchInterval: 30000,
    },
  });

  const { data: downloads } = useListDownloads({
    query: {
      queryKey: getListDownloadsQueryKey(),
      enabled: open,
    },
  });

  const unreadCount = unreadData?.count ?? 0;

  const markAllReadMutation = useMarkAllNotificationsRead();

  function handleMarkAllRead() {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationsCountQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDownloadsQueryKey() });
      },
    });
  }

  const recentDownloads = downloads?.slice(0, 20) ?? [];
  const unreadDownloads = recentDownloads.filter((d) => !d.isRead);
  const displayDownloads = unreadDownloads.length > 0 ? unreadDownloads : recentDownloads;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          aria-label="ئاگادارییەکان"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 min-w-[17px] h-[17px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-lg rounded-xl border-border/60"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-sm text-foreground">دابەزاندنەکانی تازە</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              هەموو خوێندرانەوە
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[340px]">
          {displayDownloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Download className="h-8 w-8 opacity-30" />
              <p className="text-sm">هیچ دابەزاندنێکی نوێ نییە</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {displayDownloads.map((event) => (
                <li
                  key={event.id}
                  className={`px-4 py-3 flex items-start gap-3 transition-colors ${
                    !event.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug truncate">
                      {event.userName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                      {event.bookTitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {formatRelativeKu(event.downloadedAt)}
                    </p>
                  </div>
                  {!event.isRead && (
                    <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        {unreadCount === 0 && recentDownloads.length > 0 && (
          <div className="px-4 py-2 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground">هەموو خوێندرانەوەن</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
