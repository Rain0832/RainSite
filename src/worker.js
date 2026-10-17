const ACCOUNT_TAG = "944154643357edaea6daa0f4a6cf5882";
const SITE_TAG = "6b70ae05f6d241ef8c2794ffaf36cbe3";
const GRAPHQL_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const POST_TITLES = {
  "/posts/2026/apple-campus-talk/": "川大 Apple 校园宣讲会",
  "/posts/2026/cloudflare-worker-blog-deploy/": "我的博客建站记录",
  "/posts/2026/hammer-theory/": "锤子理论",
};

const analyticsQuery = `
  query Analytics($accountTag: string!, $siteTag: string!, $since: datetime!, $until: datetime!) {
    viewer {
      accounts(filter: { accountTag: $accountTag }) {
        pageViews: rumPageloadEventsAdaptiveGroups(
          limit: 10000
          filter: {
            siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
          }
        ) {
          count
        }
        topPosts: rumPageloadEventsAdaptiveGroups(
        limit: 10
        filter: {
          siteTag: $siteTag
            datetime_geq: $since
            datetime_lt: $until
            requestPath_like: "/posts/%"
          }
          orderBy: [count_DESC]
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

  const responseText = await response.text();
  let payload;
  try {
    payload = JSON.parse(responseText);
  } catch {
    throw new Error(`Cloudflare Analytics API returned ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`Cloudflare Analytics API returned ${response.status}: ${responseText.slice(0, 500)}`);
  }

  if (payload.errors?.length || !payload.data) {
    throw new Error(`Cloudflare Analytics API returned GraphQL errors: ${JSON.stringify(payload.errors).slice(0, 500)}`);
  }

  const account = payload.data?.viewer?.accounts?.[0];
  if (!account) {
    throw new Error("Cloudflare Analytics account not found");
  }

  return account;
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

  const analytics = await queryAnalytics(
    env.CLOUDFLARE_API_TOKEN,
    analyticsQuery,
    variables,
  );

  return Response.json({
    updatedAt: until,
    last24Hours: {
      pageViews: analytics.pageViews.reduce(
        (total, group) => total + group.count,
        0,
      ),
    },
    topPosts: analytics.topPosts.map((group) => ({
      path: group.dimensions.requestPath,
      title: POST_TITLES[group.dimensions.requestPath] || group.dimensions.requestPath,
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
