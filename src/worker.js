const ACCOUNT_TAG = "944154643357edaea6daa0f4a6cf5882";
const SITE_TAG = "6b70ae05f6d241ef8c2794ffaf36cbe3";
const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";

const pageViewsQuery = `
  query PageViews($accountTag: string!, $siteTag: string!, $since: datetime!, $until: datetime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 10000
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
        ) {
          count
        }
      }
    }
  }
`;

const hourlyQuery = `
  query HourlyViews($accountTag: string!, $siteTag: string!, $since: datetime!, $until: datetime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 1000
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
          orderBy: [datetimeHour_ASC]
          groupBy: [datetimeHour]
        ) {
          count
          dimensions {
            datetimeHour
          }
        }
      }
    }
  }
`;

const topPostsQuery = `
  query TopPosts($accountTag: string!, $siteTag: string!, $since: datetime!, $until: datetime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 10
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
            requestPath_like: "/posts/%"
          }
          orderBy: [count_DESC]
          groupBy: [requestPath]
        ) {
          count
          dimensions {
            requestPath
          }
        }
      }
    }
  }
`;

function isoNow() {
  return new Date();
}

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function queryAnalytics(token, query, variables) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Cloudflare Analytics API returned ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length || !payload.data) {
    throw new Error("Cloudflare Analytics API returned an invalid response");
  }

  return payload.data.viewer.accounts[0];
}

async function analyticsResponse(request, env) {
  if (!env.CLOUDFLARE_API_TOKEN) {
    return Response.json({ error: "Analytics is not configured" }, { status: 503 });
  }

  const until = isoNow().toISOString();
  const since = isoHoursAgo(24).toISOString();
  const variables = {
    accountTag: ACCOUNT_TAG,
    siteTag: SITE_TAG,
    since,
    until,
  };

  const [views, hourly, topPosts] = await Promise.all([
    queryAnalytics(env.CLOUDFLARE_API_TOKEN, pageViewsQuery, variables),
    queryAnalytics(env.CLOUDFLARE_API_TOKEN, hourlyQuery, variables),
    queryAnalytics(env.CLOUDFLARE_API_TOKEN, topPostsQuery, variables),
  ]);

  return Response.json({
    updatedAt: until,
    last24Hours: {
      pageViews: views.rumPageloadEventsAdaptiveGroups.reduce(
        (total, group) => total + group.count,
        0,
      ),
    },
    topPosts: topPosts.rumPageloadEventsAdaptiveGroups.map((group) => ({
      path: group.dimensions.requestPath,
      pageViews: group.count,
    })),
    hourly: hourly.rumPageloadEventsAdaptiveGroups.map((group) => ({
      hour: group.dimensions.datetimeHour,
      pageViews: group.count,
    })),
  }, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/analytics") {
      try {
        return await analyticsResponse(request, env);
      } catch (error) {
        console.error("Analytics request failed:", error);
        return Response.json({ error: "Analytics request failed" }, { status: 502 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
