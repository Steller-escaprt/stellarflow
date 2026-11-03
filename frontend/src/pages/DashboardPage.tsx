import { useEffect, useMemo, useState, useCallback, type RefObject } from "react";
import { CreateStreamDrawer } from "../components/CreateStreamDrawer";
import { KpiMetricsGrid } from "../components/KpiMetricsGrid";
import { LiveStreamCard } from "../components/LiveStreamCard";
import { EditStartTimeModal } from "../components/EditStartTimeModal";
import { IssueBacklog } from "../components/IssueBacklog";
import { StreamDetailDrawer } from "../components/StreamDetailDrawer";
import { StreamMetricsChart } from "../components/StreamMetricsChart";
import { StreamTimeline } from "../components/StreamTimeline";
import { StreamsTable } from "../components/StreamsTable";
import { useFreighter, type FreighterState } from "../hooks/useFreighter";
import { useMetricsHistory } from "../hooks/useMetricsHistory";
import { defaultStreamFilters, useStreamFilter } from "../hooks/useStreamFilter";
import { useToast } from "../hooks/useToast";
import { useWebSocket } from "../hooks/useWebSocket";
import { useUrlFilters } from "../hooks/useUrlFilters";
import {
  ApiError,
  cancelStream,
  createStream,
  createStreamBatch,
  getWebSocketUrl,
  listOpenIssues,
  listStreams,
  pauseStream,
  resumeStream,
  updateStreamStartAt,
} from "../services/api";
import { ListStreamsFilters } from "../services/api";
import { CreateStreamPayload, OpenIssue, Stream } from "../types/stream";

export interface DashboardPageProps {
  wallet?: FreighterState;
}

export function DashboardPage({ wallet: propWallet }: DashboardPageProps) {
  const walletFromHook = useFreighter();
  const wallet = propWallet || walletFromHook;
  const { showToast } = useToast();
  const { filters: urlFilters, setFilters: setUrlFilters } = useUrlFilters();
  const [detailStreamId, setDetailStreamId] = useState<string | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [issues, setIssues] = useState<OpenIssue[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [editingStream, setEditingStream] = useState<{
    stream: Stream;
    triggerRef: RefObject<HTMLButtonElement | null>;
  } | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalUnfilteredCount, setTotalUnfilteredCount] = useState<number>(0);

  const scrollToCreateStream = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  useEffect(() => {
    const handleOpenCreateEvent = () => setIsCreateOpen(true);
    window.addEventListener("stellarflow:open-create", handleOpenCreateEvent);
    return () => window.removeEventListener("stellarflow:open-create", handleOpenCreateEvent);
  }, []);

  const { filters, filteredStreams, setFilter } = useStreamFilter(streams);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const wsUrl = getWebSocketUrl();
  const { lastMessage } = useWebSocket<{
    eventType?: string;
    type?: string;
    status?: string;
    streamId?: string;
    vestedAmount?: number;
    percentComplete?: number;
  }>(wsUrl);

  const metricsHistory = useMetricsHistory("7d");

  const apiFilters: ListStreamsFilters = useMemo(
    () => ({
      status: filters.status || urlFilters.status,
      sender: filters.sender || urlFilters.sender,
      recipient: filters.recipient || urlFilters.recipient,
      asset: filters.assetCode || urlFilters.asset,
      sort: filters.sort || urlFilters.sort,
      page: filters.page > 1 ? filters.page : (urlFilters.page ?? undefined),
    }),
    [urlFilters, filters],
  );

  const tableFilters: ListStreamsFilters = useMemo(
    () => ({
      status: filters.status,
      sender: filters.sender,
      recipient: filters.recipient,
      asset: filters.assetCode,
      q: "",
    }),
    [filters],
  );

  const refreshUnfilteredCount = useCallback(async () => {
    try {
      const response = await listStreams();
      setTotalUnfilteredCount(response.total);
    } catch {
      // Keep existing total on count refresh failure
    }
  }, []);

  const refreshStreams = useCallback(async (activeFilters: ListStreamsFilters) => {
    try {
      const response = await listStreams(activeFilters);
      setStreams(response.data);
      setCurrentPage(response.page);
      setHasMore(response.data.length < response.total);
      setTotalUnfilteredCount(response.total);
    } catch {
      showToast("Failed to refresh streams", "error");
    }
  }, [showToast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await listStreams({
        ...apiFilters,
        page: nextPage,
      });
      setStreams((prev) => [...prev, ...response.data]);
      setCurrentPage(response.page);
      setHasMore(streams.length + response.data.length < response.total);
      setTotalUnfilteredCount(response.total);
    } catch {
      showToast("Failed to load more streams", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [apiFilters, currentPage, hasMore, loadingMore, showToast, streams.length]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [streamsResponse, issuesData] = await Promise.all([
          listStreams(apiFilters),
          listOpenIssues(),
        ]);
        if (!isMounted) return;

        setStreams(streamsResponse.data);
        setCurrentPage(streamsResponse.page);
        setHasMore(streamsResponse.data.length < streamsResponse.total);
        setTotalUnfilteredCount(streamsResponse.total);
        setIssues(issuesData);
      } catch (err) {
        if (!isMounted) return;
        showToast(
          err instanceof Error ? err.message : "Failed to load dashboard data.",
          "error",
        );
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
          setInitialLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [apiFilters, showToast]);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "stream:progress" && lastMessage.streamId) {
      setStreams((prev) =>
        prev.map((s) => {
          if (s.id !== lastMessage.streamId) return s;
          return {
            ...s,
            progress: {
              ...s.progress,
              vestedAmount: lastMessage.vestedAmount ?? s.progress.vestedAmount,
              percentComplete: lastMessage.percentComplete ?? s.progress.percentComplete,
            },
          };
        }),
      );
      return;
    }

    if (lastMessage.eventType === "StreamCreated") {
      void refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast("A new stream was created on-chain", "info");
    } else if (lastMessage.eventType === "StreamClaimed") {
      void refreshStreams(apiFilters);
      showToast("Stream funds claimed", "info");
    } else if (lastMessage.eventType === "StreamCanceled") {
      void refreshStreams(apiFilters);
      showToast("Stream canceled", "info");
    }
  }, [lastMessage, refreshStreams, refreshUnfilteredCount, showToast, apiFilters]);

  async function handleCreateBatch(payloads: CreateStreamPayload[]) {
    try {
      setFormError(null);
      const res = await createStreamBatch(payloads);
      await refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast(`Successfully created ${res.totalCreated} payroll streams!`, "success");
      setIsCreateOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create payroll batch.";
      setFormError(message);
      showToast(message, "error");
      throw err;
    }
  }

  async function handleCreate(payload: CreateStreamPayload) {
    try {
      setFormError(null);
      await createStream(payload);
      await refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast("Stream created successfully!", "success");
      setIsCreateOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create stream.";
      setFormError(message);
      showToast(message, "error");
      throw err;
    }
  }

  async function handleCancel(streamId: string) {
    try {
      await cancelStream(streamId);
      await refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast("Stream canceled", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(`Cancel failed (${err.statusCode}): ${err.message}`, "error");
        return;
      }
      showToast(err instanceof Error ? err.message : "Failed to cancel stream.", "error");
    }
  }

  async function handlePause(streamId: string) {
    try {
      await pauseStream(streamId);
      await refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast("Stream paused", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(`Pause failed (${err.statusCode}): ${err.message}`, "error");
        return;
      }
      showToast(err instanceof Error ? err.message : "Failed to pause the stream.", "error");
    }
  }

  async function handleResume(streamId: string) {
    try {
      await resumeStream(streamId);
      await refreshStreams(apiFilters);
      void refreshUnfilteredCount();
      showToast("Stream resumed", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(`Resume failed (${err.statusCode}): ${err.message}`, "error");
        return;
      }
      showToast(err instanceof Error ? err.message : "Failed to resume the stream.", "error");
    }
  }

  async function handleUpdateStartTime(streamId: string, nextStartAt: number) {
    try {
      await updateStreamStartAt(streamId, nextStartAt);
      await refreshStreams(apiFilters);
      showToast("Start time updated", "success");
    } catch (err) {
      if (err instanceof ApiError) {
        showToast(`Update failed (${err.statusCode}): ${err.message}`, "error");
        void refreshUnfilteredCount();
        return;
      }
      showToast("Failed to update stream start time", "error");
    }
  }

  if (initialLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-3" />
        <span className="text-sm font-medium text-gray-400">Loading StellarFlow telemetry…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Real-Time KPI Telemetry */}
      <KpiMetricsGrid streams={streams} />

      {/* 2. Trends Chart Section */}
      <section className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📈</span> Stream Metrics & Vesting Velocity
          </h2>
          <span className="text-xs text-gray-400">Past 7 Days</span>
        </div>
        <StreamMetricsChart
          data={metricsHistory.data}
          loading={metricsHistory.loading}
          error={metricsHistory.error}
        />
      </section>

      {/* 3. Stream Controls Header & View Switcher */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Payment Streams</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live second-by-second token flows on the Stellar blockchain
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-1.5 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-[#3E1BDB] to-[#7B61FF] hover:from-[#4b23ff] hover:to-[#8c75ff] shadow-sm transition-all"
            >
              + New Stream
            </button>

            <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-[#7B61FF] text-gray-900 dark:text-white shadow-sm font-semibold"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setViewMode("grid")}
              >
                Cards Grid
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-[#7B61FF] text-gray-900 dark:text-white shadow-sm font-semibold"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
                onClick={() => setViewMode("table")}
              >
                Data Table
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Cards Grid vs Data Table */}
        {viewMode === "grid" ? (
          <div>
            {filteredStreams.length === 0 ? (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl mb-3">
                  🌊
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">No active streams found</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4">
                  Create your first real-time payment stream to start continuous token vesting.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#3E1BDB] to-[#7B61FF] shadow-sm"
                >
                  Create Stream
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStreams.map((stream) => (
                  <LiveStreamCard
                    key={stream.id}
                    stream={stream}
                    onOpenDetail={setDetailStreamId}
                    onCancel={handleCancel}
                    onPause={handlePause}
                    onResume={handleResume}
                    currentAddress={wallet.address}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <StreamsTable
            streams={filteredStreams}
            filters={tableFilters}
            totalStreamCount={totalUnfilteredCount}
            onCreateStream={scrollToCreateStream}
            onFiltersChange={(next) => {
              setFilter("status", next.status ?? defaultStreamFilters.status);
              setFilter("sender", next.sender ?? defaultStreamFilters.sender);
              setFilter("recipient", next.recipient ?? defaultStreamFilters.recipient);
              setFilter("assetCode", next.asset ?? defaultStreamFilters.assetCode);
            }}
            setUrlFilters={setUrlFilters}
            onCancel={handleCancel}
            onPause={handlePause}
            onResume={handleResume}
            onEditStartTime={(stream, triggerRef) =>
              setEditingStream({ stream, triggerRef })
            }
            onOpenStream={setDetailStreamId}
            onLoadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onRefreshStreams={() => refreshStreams(apiFilters)}
          />
        )}
      </section>

      {/* 4. Slide-Over Stream Creation Drawer */}
      <CreateStreamDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
        onCreateBatch={handleCreateBatch}
        walletAddress={wallet.address}
        apiError={formError}
      />

      {/* 5. Issue Backlog & Recent Activity */}
      <IssueBacklog issues={issues} loading={loadingDashboard} />

      <section className="glass-card p-5">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Recent On-Chain Activity</h2>
        <StreamTimeline />
      </section>

      {editingStream && (
        <EditStartTimeModal
          stream={editingStream.stream}
          triggerRef={editingStream.triggerRef}
          onConfirm={handleUpdateStartTime}
          onClose={() => setEditingStream(null)}
        />
      )}

      {detailStreamId && (
        <StreamDetailDrawer
          streamId={detailStreamId}
          onClose={() => setDetailStreamId(null)}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
          signAction={wallet.signAction}
          walletAddress={wallet.address}
        />
      )}
    </div>
  );
}
