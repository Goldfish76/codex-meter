(function () {
  "use strict";

  const createReportService = ({
    chatGptClient,
    config,
    domain,
    getPageLocale,
    pageHref,
    reportRepository,
    translate,
  }) => {
    const labelFromPath = (path) => {
      const raw = path
        .join(".")
        .replaceAll("_", " ")
        .replace(/\bwindow\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();
      if (/secondary/i.test(path.join("."))) return translate("limits.secondary");
      if (/primary/i.test(path.join("."))) return translate("limits.primary");
      return raw || translate("limits.fallback");
    };

    // Plan-covered usage gets credits: 0 in the daily usage counts. This endpoint
    // (it feeds the official "by source" chart) still splits each day by model. Its
    // values are relative to the busiest day of the requested range, not to the
    // weekly limit, so only the per-day model shares are used.
    const fetchModelSharesByDate = async (startDate, endDate, token) => {
      try {
        const breakdown = await chatGptClient.apiGet(
          `/backend-api/wham/usage/daily-token-usage-breakdown?start_date=${startDate}&end_date=${endDate}&group_by=day`,
          token,
        );
        if (!Array.isArray(breakdown?.data)) return null;
        return new Map(
          breakdown.data
            .filter((item) => item?.date && Array.isArray(item.models))
            .map((item) => [item.date, item.models]),
        );
      } catch {
        return null;
      }
    };

    const buildReport = async () => {
      const token = chatGptClient.getBootstrapToken();
      if (!token) throw new Error(translate("noToken"));

      const now = new Date();
      const endDate = domain.localDate(domain.addDays(now, 1));
      const startDate = domain.localDate(domain.addDays(now, -config.LOOKBACK_DAYS));
      const usage = await chatGptClient.apiGet("/backend-api/wham/usage", token);
      const windows = domain.extractLimitWindows(usage?.rate_limit || {}, {
        labelFromPath,
        locale: getPageLocale(),
      });
      const primaryWindow = windows[0] || null;
      const cycleStartDate = primaryWindow?.cycleStart || startDate;
      const dailyData = await chatGptClient.apiGet(
        `/backend-api/wham/analytics/daily-workspace-usage-counts?start_date=${startDate}&end_date=${endDate}&group_by=day`,
        token,
      );
      const modelSharesByDate = await fetchModelSharesByDate(startDate, endDate, token);
      const dailyList = (Array.isArray(dailyData?.data) ? dailyData.data : []).map((item) => {
        const models = modelSharesByDate?.get(item?.date);
        const estimated =
          models &&
          domain.estimateDailyCredits(item.totals, models, {
            rates: config.CREDIT_RATES,
            speedMultipliers: config.INCLUDED_SPEED_MULTIPLIERS,
          });
        return estimated == null ? item : { ...item, totals: { ...(item.totals || {}), estimated_credits: estimated } };
      });
      const currentCycleList = dailyList.filter(
        (item) => item?.date && new Date(`${item.date}T00:00:00`) >= new Date(`${cycleStartDate}T00:00:00`),
      );
      const historyList = dailyList.filter(
        (item) => item?.date && new Date(`${item.date}T00:00:00`) < new Date(`${cycleStartDate}T00:00:00`),
      );

      return {
        id: `${Date.now()}`,
        capturedAt: now.toISOString(),
        capturedAtLocal: now.toLocaleString(getPageLocale()),
        pageUrl: pageHref(),
        startDate,
        endDate,
        cycleStartDate,
        windows,
        primaryWindow,
        currentCycleList,
        historyList,
        dailyList,
        currentStats: domain.getStats(currentCycleList),
        historyStats: domain.getStats(historyList),
        totalStats: domain.getStats(dailyList),
      };
    };

    const refreshReport = async () => {
      const report = await buildReport();
      await reportRepository.save(report);
      return report;
    };

    return {
      buildReport,
      refreshReport,
    };
  };

  window.CodexMeterReportService = {
    createReportService,
  };
})();
