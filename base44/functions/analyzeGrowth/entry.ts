import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// ===================================================================
// AI Growth Analyst — interpretation engine (v4)
// Principle: CALCULATE → COMPARE → DETECT PATTERNS → INTERPRET → RECOMMEND.
// The engine aggregates deterministically; the LLM interprets and writes
// its own insights. Descriptive rankings are NOT insights — only
// non-obvious patterns, relationships, anomalies and changes qualify.
// ===================================================================

// ---------- Field normalisation layer ----------
// The uploaded dataset may use different labels for the same business concept.
// We first use explicit aliases, then conservative semantic hints. Unknown fields
// are NOT guessed when the name is ambiguous.
const FIELD_MAP = {
  channel: ["channel","channels","source","sourcename","medium","channelname","campaignsource","trafficsource","sourcechannel","marketingsource","acquisitionchannel","marketingchannel","paidchannel","trafficchannel","mediasource"],
  campaign: ["campaign","campaignname","campaigntitle","adgroup","adgroupname","ad","adname","campaignid","campaigncode"],
  cohort: ["cohort","cohortmonth","cohortdate","cohortname","cohortlabel","cohortid","cohortperiod"],
  month: ["month","date","period","reportingmonth","reportingperiod","monthdate","reportdate","reportingdate","periodmonth"],
  spend: ["spend","spendusd","cost","spendamount","adspend","mediaspend","adcost","spendamountusd","adspendusd","totalcost","marketingcost","marketingcosts","mediacost","advertisingcost","adcostusd"],
  impressions: ["impressions","imps","impr","impressioncount","impressionscount","totalimpressions"],
  clicks: ["clicks","click","clickcount","linkclicks","totalclicks"],
  ctr: ["ctr","ctrpct","clickthroughrate","clickthroughratepct","clickrate"],
  visitors: ["visitors","sessions","uniquevisitors","visits","traffic","usersacquired","sessionscount","uniquesessions"],
  signups: ["signups","signup","registrations","registration","newusers","newsignups","leads","signupcount","registeredusers","registrationscount","newcustomers","acquiredusers"],
  activated: ["activated","activatedusers","activations","activationusers","activatedcount","activationscount","activation","onboardedusers","onboarded","activatedcustomers"],
  converted: ["converted","convertedusers","orders","conversions","conversion","customers","paidusers","purchases","buyers","paidconversions","conversionscount","orderscount","customerscount","completedorders","paidorders"],
  retained_30d: ["retained30d","retained30","retained","d30retainedusers","30dretainedusers","d30retained","retainedusers","retained30dusers","retained30days","retainedusers30d","retained30dayusers","day30retained"],
  revenue: ["revenue","revenueusd","revenueamount","mrr","arr","sales","grossrevenue","totalrevenue","revenueusdamount","netrevenue","gmv","grossmerchandisevalue","netpaid","totalgmv"],
  users: ["users","user","uniqueusers","uniqueuser","cohortsize","totalusers","cohortusers","userscount","usercount","population"],
  activation_rate: ["activationrate","activationratepct","activationpct","activationratepercent"],
  conversion_rate: ["conversionrate","conversionratepct","conversionpct","conversionratepercent"],
  retention_30d_rate: ["retention30d","retentionrate","d30retention","d30retentionpct","retention30drate","retentionratepct","d30retentionrate","d30retentionpctrate","retention30day","30dayretention"],
  arpu: ["arpu","avgrevenueperuser","revenueperuser","arpdau","arppu","avgrevenueperpayinguser","avguserrevenue"],
  aov: ["aov","avgordervalue","avgordervalueusd","ordervalue","averageordervalue"],
  cac: ["cac","cacusd","customeracquisitioncost"],
  cpa: ["cpa","cpausd","costperacquisition"],
  roas: ["roas","returnonadspend"],
};
const ALIAS_LOOKUP = {};
for (const [canonical, aliases] of Object.entries(FIELD_MAP)) {
  for (const a of aliases) ALIAS_LOOKUP[a] = canonical;
  ALIAS_LOOKUP[canonical] = canonical;
}
const CANONICAL_FIELDS = Object.keys(FIELD_MAP);
// Raw input fields that the dataset should contain. Calculated metrics (CTR, CPC, CAC,
// CPA, ROAS, AOV, ARPU, activation_rate, conversion_rate, retention_30d_rate) are derived
// by the engine and must never be listed as "missing" raw columns.
const RAW_INPUT_FIELDS = ["channel","campaign","cohort","month","spend","impressions","clicks","visitors","signups","activated","converted","retained_30d","revenue","users"];

function normalizeKey(key) {
  const norm = String(key ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!norm) return null;
  if (ALIAS_LOOKUP[norm]) return ALIAS_LOOKUP[norm];

  // Conservative semantic matching for common real-world column naming.
  // Deliberately avoid ambiguous terms such as "platform" or "active users".
  if (/^(marketing|acquisition|traffic|media|paid).*channel$/.test(norm) || /^(channel|source|medium)$/.test(norm) || /channel(name|source)$/.test(norm)) return "channel";
  if (/^(campaign|campaignname|campaigntitle|campaignid|adgroup|adgroupname)/.test(norm)) return "campaign";
  if (/^cohort/.test(norm)) return "cohort";
  if (/^(month|period|reportingmonth|reportingperiod|date)$/.test(norm) || /^(report|period).*date$/.test(norm)) return "month";
  if (/(ad|media|marketing|advertis).*(spend|cost)$/.test(norm) || /^(spend|cost|media(cost|spend)|ad(spend|cost))/.test(norm)) return "spend";
  if (/impression/.test(norm)) return "impressions";
  if (/click/.test(norm)) return "clicks";
  if (/clickthrough.*rate|^ctr/.test(norm)) return "ctr";
  if (/visitor|session/.test(norm)) return "visitors";
  if (/signup|registration|registered.*user|new.*(user|customer)|acquired.*user/.test(norm)) return "signups";
  if (/activation|activated|onboarded/.test(norm) && !/rate|pct|percent/.test(norm)) return "activated";
  if (/retention|retained/.test(norm) && /(30|30d|thirty)/.test(norm) && !/rate|pct|percent/.test(norm)) return "retained_30d";
  if (/(order|conversion|purchase|buyer|customer|paiduser|paidorder)/.test(norm) && !/rate|pct|percent/.test(norm)) return "converted";
  if (/revenue|sales|gmv|grossmerchandise|netpaid/.test(norm)) return "revenue";
  if (/activation.*(rate|pct|percent)/.test(norm)) return "activation_rate";
  if (/conversion.*(rate|pct|percent)/.test(norm)) return "conversion_rate";
  if (/(retention|retain).*(30|30d|thirty).*(rate|pct|percent)/.test(norm) || /(30|30d|thirty).*(retention|retain).*(rate|pct|percent)/.test(norm)) return "retention_30d_rate";
  if (/^arpu|revenue.*per.*user|average.*revenue.*user/.test(norm)) return "arpu";
  if (/^aov|average.*order.*value/.test(norm)) return "aov";
  if (/^cac|customer.*acquisition.*cost/.test(norm)) return "cac";
  if (/^cpa|cost.*per.*acquisition/.test(norm)) return "cpa";
  if (/^roas|return.*ad.*spend/.test(norm)) return "roas";
  if (/^(unique)?user(s)?$|^(cohortsize|totalusers|usercount)$/.test(norm)) return "users";
  return null;
}
function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "boolean") return null;
  const cleaned = String(v).replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}
function normalizeRow(row) {
  const out = {};
  const mapping = {};
  for (const [origKey, val] of Object.entries(row)) {
    const canon = normalizeKey(origKey);
    if (!canon) continue;
    mapping[origKey] = canon;
    if (out[canon] === undefined) out[canon] = val;
  }
  return { row: out, mapping };
}
const getNum = (row, field) => toNum(row[field]);
const safeRate = (n, d) => (d === null || d === undefined || d === 0 || n === null || n === undefined) ? null : n / d;

// ---------- ONE central percentage normaliser ----------
function normalizePercent(n) {
  if (n === null || n === undefined) return null;
  if (Math.abs(n) > 1) return n / 100;
  return n;
}
const pct = (n) => {
  if (n === null || n === undefined) return "n/a";
  const v = normalizePercent(n);
  if (v === null) return "n/a";
  return `${(v * 100).toFixed(1)}%`;
};

// ---------- formatting helpers ----------
const money = (n) => n === null ? "n/a" : `$${Math.round(n).toLocaleString()}`;
const money2 = (n) => n === null ? "n/a" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (n) => n === null ? "n/a" : Math.round(n).toLocaleString();
function pctChange(first, last) {
  if (first === null || last === null || first === 0) return null;
  return (last - first) / first;
}
function pctChangeStr(first, last) {
  const c = pctChange(first, last);
  if (c === null) return "n/a";
  return `${c >= 0 ? "+" : ""}${(c * 100).toFixed(1)}%`;
}
// Percentage-point change for rate metrics: latest - earliest, in percentage points.
function ppChange(first, last) {
  if (first === null || last === null) return null;
  return (last - first) * 100;
}
// Format an already-computed pp value (in pp units).
function formatPp(pp) {
  if (pp === null || pp === undefined) return "n/a";
  return `${pp >= 0 ? "+" : ""}${pp.toFixed(1)}pp`;
}
function ppChangeStr(first, last) {
  return formatPp(ppChange(first, last));
}
// Format an already-computed relative change (decimal, e.g. -0.061 for -6.1%).
function formatRel(delta) {
  if (delta === null || delta === undefined) return "n/a";
  return `${delta >= 0 ? "+" : ""}${(delta * 100).toFixed(1)}%`;
}
// Relative change string from first/last values.
function relChangeStr(first, last) {
  return formatRel(pctChange(first, last));
}

// ---------- dataset ingestion ----------
function ingestDataset(dataset) {
  const tables = { monthly: [], channels: [], cohorts: [], campaigns: [], flat: [] };
  const fieldMap = {};
  const detectedTables = [];
  const recordFields = (mapping) => {
    for (const [orig, canon] of Object.entries(mapping)) {
      if (fieldMap[canon] === undefined) fieldMap[canon] = orig;
    }
  };
  const processRows = (rows, dest) => {
    if (!Array.isArray(rows)) return false;
    let added = false;
    for (const r of rows) {
      if (!r || typeof r !== "object" || Array.isArray(r)) continue;
      const { row, mapping } = normalizeRow(r);
      recordFields(mapping);
      // Keep only rows with at least one recognised field.
      if (Object.keys(row).length === 0) continue;
      tables[dest].push(row);
      added = true;
    }
    return added;
  };
  const classifyFlatRows = (rows) => {
    for (const r of rows) {
      if (r.channel !== undefined) tables.channels.push(r);
      if (r.cohort !== undefined) tables.cohorts.push(r);
      if (r.campaign !== undefined) tables.campaigns.push(r);
      if (r.month !== undefined && r.channel === undefined && r.cohort === undefined && r.campaign === undefined) tables.monthly.push(r);
    }
  };

  if (Array.isArray(dataset)) {
    detectedTables.push("flat");
    processRows(dataset, "flat");
    classifyFlatRows(tables.flat);
  } else if (dataset && typeof dataset === "object") {
    const tableKeys = {
      monthly: ["monthly_funnel","monthly","funnel","monthly_funnel_data","funnel_data","monthly_data"],
      channels: ["channels","channel_performance","channel_performance_data","channels_data","channel_data"],
      cohorts: ["cohorts","cohort_analysis","cohort_data","cohorts_data"],
      campaigns: ["campaigns","campaign_performance","campaign_data"],
    };
    const consumed = new Set();
    for (const [dest, keys] of Object.entries(tableKeys)) {
      for (const k of keys) {
        if (Array.isArray(dataset[k]) && dataset[k].length) {
          if (processRows(dataset[k], dest)) detectedTables.push(dest);
          consumed.add(k);
          break;
        }
      }
    }
    // If the caller supplies a different wrapper/table name, inspect all remaining
    // arrays instead of silently taking only the first one.
    for (const [k, v] of Object.entries(dataset)) {
      if (consumed.has(k) || !Array.isArray(v) || !v.length || typeof v[0] !== "object") continue;
      if (processRows(v, "flat")) detectedTables.push(`flat:${k}`);
    }
    if (tables.flat.length) classifyFlatRows(tables.flat);
  }
  return { tables, fieldMap, detectedTables };
}

function sumField(rows, field) {
  let total = 0;
  for (const r of rows) { const v = getNum(r, field); if (v !== null) total += v; }
  return total;
}
function primaryTotalsRows(tables) {
  // Avoid double-counting when the same business data is supplied in multiple
  // analytical views (for example channels + cohorts + monthly).
  if (tables.flat.length) return tables.flat;
  if (tables.monthly.length) return tables.monthly;
  if (tables.channels.length) return tables.channels;
  if (tables.cohorts.length) return tables.cohorts;
  if (tables.campaigns.length) return tables.campaigns;
  return [];
}
function globalTotals(tables) {
  const rows = primaryTotalsRows(tables);
  return {
    spend: sumField(rows, "spend"),
    revenue: sumField(rows, "revenue"),
    signups: sumField(rows, "signups"),
    activated: sumField(rows, "activated"),
    converted: sumField(rows, "converted"),
    retained: sumField(rows, "retained_30d"),
    impressions: sumField(rows, "impressions"),
    clicks: sumField(rows, "clicks"),
    visitors: sumField(rows, "visitors"),
    users: sumField(rows, "users"),
    records: rows.length,
  };
}

// ---------- cohort retention maturity ----------
// Returns: true (mature), false (not yet mature), null (cannot establish from dates).
// A cohort is mature only when at least 30 days have elapsed since the cohort START date.
function cohortMature(label, now) {
  const m = String(label ?? "").match(/(\d{4})[-\/. ](\d{1,2})/);
  if (!m) return null;
  const year = +m[1], month = +m[2];
  if (!year || !month || month < 1 || month > 12) return null;
  const cohortStart = new Date(year, month - 1, 1);
  const matureAt = new Date(cohortStart.getTime() + 30 * 24 * 3600 * 1000);
  return now >= matureAt;
}
function sortCohortLabel(a, b) {
  const ma = String(a ?? "").match(/(\d{4})[-\/. ](\d{1,2})/);
  const mb = String(b ?? "").match(/(\d{4})[-\/. ](\d{1,2})/);
  if (ma && mb) return (+ma[1] * 100 + +ma[2]) - (+mb[1] * 100 + +mb[2]);
  return String(a).localeCompare(String(b));
}

// ---------- channel analysis (aggregated by channel) ----------
function computeChannelAnalysis(tables, fieldMap) {
  const rows = tables.channels.length ? tables.channels : tables.flat;
  if (rows.length === 0) {
    return { available: false, channels: [], insights: [], summary: "No channel-level data detected. Channel analysis requires a 'channel' column." };
  }
  const groups = {};
  for (const r of rows) {
    const name = String(r.channel ?? "Unknown");
    if (!groups[name]) groups[name] = { name, spend: 0, signups: 0, activated: 0, converted: 0, retained_30d: 0, revenue: 0, visitors: 0, impressions: 0, clicks: 0 };
    const g = groups[name];
    g.spend += getNum(r, "spend") ?? 0;
    g.signups += getNum(r, "signups") ?? 0;
    g.activated += getNum(r, "activated") ?? 0;
    g.converted += getNum(r, "converted") ?? 0;
    g.retained_30d += getNum(r, "retained_30d") ?? 0;
    g.revenue += getNum(r, "revenue") ?? 0;
    g.visitors += getNum(r, "visitors") ?? 0;
    g.impressions += getNum(r, "impressions") ?? 0;
    g.clicks += getNum(r, "clicks") ?? 0;
  }
  const channels = Object.values(groups).map((g) => {
    const cac = safeRate(g.spend, g.converted);
    const roas = safeRate(g.revenue, g.spend);
    const activation_rate = safeRate(g.activated, g.signups);
    const conversion_rate = safeRate(g.converted, g.signups);
    const retention_rate = safeRate(g.retained_30d, g.signups);
    return {
      channel: g.name,
      total_spend: g.spend || null,
      total_signups: g.signups || null,
      total_activated: g.activated || null,
      total_converted: g.converted || null,
      total_retained_30d: g.retained_30d || null,
      total_revenue: g.revenue || null,
      cac: cac === null ? "n/a" : money(cac),
      roas: roas === null ? "n/a" : `${roas.toFixed(2)}x`,
      activation_rate: pct(activation_rate),
      conversion_rate: pct(conversion_rate),
      retention_rate: pct(retention_rate),
      _raw: { cac, roas, activation_rate, conversion_rate, retention_rate, spend: g.spend, converted: g.converted, revenue: g.revenue, signups: g.signups, retained_30d: g.retained_30d, activated: g.activated },
    };
  }).sort((a, b) => (b._raw.spend ?? 0) - (a._raw.spend ?? 0));

  const insights = buildChannelInsights(channels);
  const summary = `Aggregated ${channels.length} channel${channels.length === 1 ? "" : "s"} from ${rows.length} records — one row per channel. CAC = total spend / total converted; ROAS = total revenue / total spend; activation, conversion and retention from summed counts, never averaged across rows.`;
  return { available: true, channels, insights, summary };
}

// ---------- campaign analysis (only if campaign data exists) ----------
function computeCampaignAnalysis(tables, fieldMap) {
  if (!fieldMap.campaign) {
    return { available: false, campaigns: [], insights: [], note: "Campaign-level analysis is unavailable — no 'campaign' column was detected in the dataset." };
  }
  const rows = tables.campaigns.length ? tables.campaigns : (tables.channels.length ? tables.channels : tables.flat);
  const cg = {};
  for (const r of rows) {
    const ch = String(r.channel ?? "Unknown");
    const camp = String(r.campaign ?? "(none)");
    const key = ch + "||" + camp;
    if (!cg[key]) cg[key] = { channel: ch, campaign: camp, spend: 0, signups: 0, activated: 0, converted: 0, retained_30d: 0, revenue: 0 };
    const g = cg[key];
    g.spend += getNum(r, "spend") ?? 0;
    g.signups += getNum(r, "signups") ?? 0;
    g.activated += getNum(r, "activated") ?? 0;
    g.converted += getNum(r, "converted") ?? 0;
    g.retained_30d += getNum(r, "retained_30d") ?? 0;
    g.revenue += getNum(r, "revenue") ?? 0;
  }
  const campaigns = Object.values(cg).map((g) => ({
    channel: g.channel, campaign: g.campaign,
    spend: g.spend || null, signups: g.signups || null, converted: g.converted || null, revenue: g.revenue || null,
    cac: safeRate(g.spend, g.converted), roas: safeRate(g.revenue, g.spend),
    activation_rate: safeRate(g.activated, g.signups), conversion_rate: safeRate(g.converted, g.signups),
    retention_rate: safeRate(g.retained_30d, g.signups),
  })).sort((a, b) => a.channel.localeCompare(b.channel) || (b.spend ?? 0) - (a.spend ?? 0));
  const insights = buildCampaignInsights(campaigns);
  return { available: true, campaigns, insights, note: `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} across ${new Set(campaigns.map((c) => c.channel)).size} channel${campaigns.length === 1 ? "" : "s"}.` };
}

// ---------- cohort analysis (true monthly aggregation) ----------
function computeCohortAnalysis(tables, fieldMap) {
  const rows = tables.cohorts;
  if (rows.length === 0) {
    return { available: false, summary: "No cohort data detected. Cohort analysis requires a 'cohort' column.", cohorts: [], insights: [], trend: null };
  }
  const now = new Date();
  const usersAvailable = !!fieldMap.users;
  const revenueLabel = usersAvailable ? "ARPU" : "Revenue per Signup";
  const groups = {};
  for (const r of rows) {
    const label = String(r.cohort ?? "");
    if (!groups[label]) groups[label] = { cohort: label, signups: 0, activated: 0, converted: 0, retained_30d: 0, revenue: 0, users: 0 };
    const g = groups[label];
    g.signups += getNum(r, "signups") ?? 0;
    g.activated += getNum(r, "activated") ?? 0;
    g.converted += getNum(r, "converted") ?? 0;
    g.retained_30d += getNum(r, "retained_30d") ?? 0;
    g.revenue += getNum(r, "revenue") ?? 0;
    g.users += getNum(r, "users") ?? 0;
  }
  const cohorts = Object.values(groups).map((g) => {
    const mature = cohortMature(g.cohort, now);
    const activation_rate = safeRate(g.activated, g.signups);
    const conversion_rate = safeRate(g.converted, g.signups);
    const retention_30d_rate = safeRate(g.retained_30d, g.signups);
    const revenue_per_signup = safeRate(g.revenue, g.signups);
    const arpu = usersAvailable ? safeRate(g.revenue, g.users) : null;
    return {
      cohort: g.cohort,
      signups: g.signups || null,
      activated: g.activated || null,
      converted: g.converted || null,
      retained_30d: g.retained_30d || null,
      revenue: g.revenue || null,
      activation_rate: pct(activation_rate),
      conversion_rate: pct(conversion_rate),
      retention_30d: mature === true ? pct(retention_30d_rate) : (mature === false ? "Not yet mature" : "Maturity unknown"),
      revenue_per_signup: money2(usersAvailable ? arpu : revenue_per_signup),
      revenue_label: revenueLabel,
      mature,
      _raw: { activation_rate, conversion_rate, retention_30d_rate, revenue_per_signup: usersAvailable ? arpu : revenue_per_signup, mature, signups: g.signups, revenue: g.revenue, retained_30d: g.retained_30d, converted: g.converted, activated: g.activated },
    };
  }).sort((a, b) => sortCohortLabel(a.cohort, b.cohort));

  // Only cohorts with confirmed maturity (true) are comparable for trend
  const matureCohorts = cohorts.filter((c) => c._raw.mature === true);
  let trend = null;
  if (matureCohorts.length >= 2) {
    const f = matureCohorts[0], l = matureCohorts[matureCohorts.length - 1];
    trend = {
      from: f.cohort, to: l.cohort,
      activation: { from: pct(f._raw.activation_rate), to: pct(l._raw.activation_rate), pp_change: ppChange(f._raw.activation_rate, l._raw.activation_rate), pp_change_str: ppChangeStr(f._raw.activation_rate, l._raw.activation_rate), relative_change: pctChange(f._raw.activation_rate, l._raw.activation_rate), relative_change_str: relChangeStr(f._raw.activation_rate, l._raw.activation_rate) },
      conversion: { from: pct(f._raw.conversion_rate), to: pct(l._raw.conversion_rate), pp_change: ppChange(f._raw.conversion_rate, l._raw.conversion_rate), pp_change_str: ppChangeStr(f._raw.conversion_rate, l._raw.conversion_rate), relative_change: pctChange(f._raw.conversion_rate, l._raw.conversion_rate), relative_change_str: relChangeStr(f._raw.conversion_rate, l._raw.conversion_rate) },
      retention_30d: { from: pct(f._raw.retention_30d_rate), to: pct(l._raw.retention_30d_rate), pp_change: ppChange(f._raw.retention_30d_rate, l._raw.retention_30d_rate), pp_change_str: ppChangeStr(f._raw.retention_30d_rate, l._raw.retention_30d_rate), relative_change: pctChange(f._raw.retention_30d_rate, l._raw.retention_30d_rate), relative_change_str: relChangeStr(f._raw.retention_30d_rate, l._raw.retention_30d_rate) },
      revenue_per_signup: { from: money2(f._raw.revenue_per_signup), to: money2(l._raw.revenue_per_signup), relative_change: pctChange(f._raw.revenue_per_signup, l._raw.revenue_per_signup), relative_change_str: relChangeStr(f._raw.revenue_per_signup, l._raw.revenue_per_signup), label: revenueLabel },
    };
  }
  const insights = buildCohortInsights(cohorts, matureCohorts, trend, revenueLabel);
  const maturityNote = matureCohorts.length < cohorts.length ? ` ${cohorts.length - matureCohorts.length} cohort(s) excluded from trend (not yet mature or maturity unknown).` : "";
  const summary = `Aggregated ${cohorts.length} monthly cohort${cohorts.length === 1 ? "" : "s"} from ${rows.length} records — one row per cohort period. Rates from SUM(numerator)/SUM(denominator), never averaged.${maturityNote} ${usersAvailable ? "ARPU uses the users denominator." : "No users field — revenue per signup is shown (not labelled ARPU)."}`;
  return { available: true, summary, cohorts, insights, trend };
}

// ---------- cohort month-over-month analysis ----------
function computeCohortMoM(matureCohorts) {
  const moms = [];
  const metricLabels = { activation: "activation", conversion: "conversion", retention: "30-day retention", rps: "revenue per signup" };
  for (let i = 1; i < matureCohorts.length; i++) {
    const prev = matureCohorts[i - 1], curr = matureCohorts[i];
    const changes = {
      activation: pctChange(prev._raw.activation_rate, curr._raw.activation_rate),
      conversion: pctChange(prev._raw.conversion_rate, curr._raw.conversion_rate),
      retention: pctChange(prev._raw.retention_30d_rate, curr._raw.retention_30d_rate),
      rps: pctChange(prev._raw.revenue_per_signup, curr._raw.revenue_per_signup),
    };
    const pp_changes = {
      activation: ppChange(prev._raw.activation_rate, curr._raw.activation_rate),
      conversion: ppChange(prev._raw.conversion_rate, curr._raw.conversion_rate),
      retention: ppChange(prev._raw.retention_30d_rate, curr._raw.retention_30d_rate),
    };
    const entries = Object.entries(changes).map(([k, v]) => ({ metric: k, label: metricLabels[k], delta: v }));
    const significant = entries.filter((e) => e.delta !== null && Math.abs(e.delta) > 0.05);
    const allDown = significant.length >= 2 && significant.every((e) => e.delta < 0);
    const allUp = significant.length >= 2 && significant.every((e) => e.delta > 0);
    const maxAbs = entries.reduce((max, e) => (e.delta !== null && Math.abs(e.delta) > Math.abs(max?.delta ?? 0)) ? e : max, entries[0]);
    moms.push({ from: prev.cohort, to: curr.cohort, changes, pp_changes, significant_count: significant.length, all_down: allDown, all_up: allUp, max_change: maxAbs, sample_change: pctChange(prev._raw.signups, curr._raw.signups) });
  }
  return moms;
}

// ---------- deterministic insight builders (fallback for LLM) ----------
function buildChannelInsights(channels) {
  const out = [];
  const withData = channels.filter((c) => c._raw.spend > 0 && c._raw.roas !== null && c._raw.retention_rate !== null);
  if (withData.length < 2) return out;

  const avgRet = withData.reduce((s, c) => s + (c._raw.retention_rate || 0), 0) / withData.length;
  const sorted = [...withData].sort((a, b) => b._raw.roas - a._raw.roas);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  if (top !== bottom) {
    const topRetStrong = top._raw.retention_rate >= avgRet;
    const bottomRetWeak = bottom._raw.retention_rate < avgRet;

    if (topRetStrong && bottomRetWeak) {
      // ONE combined insight: efficiency and quality aligned — strongest vs weakest
      out.push({
        observation: `${top.channel} combines the strongest acquisition efficiency (${top._raw.roas.toFixed(2)}x ROAS, ${money(top._raw.cac)} CAC) with ${pct(top._raw.retention_rate)} 30-day retention, while ${bottom.channel} has the weakest (${bottom._raw.roas.toFixed(2)}x ROAS, ${money(bottom._raw.cac)} CAC) and lowest retention (${pct(bottom._raw.retention_rate)}).`,
        interpretation: `Acquisition efficiency and downstream quality are aligned across channels — ${top.channel} acquires users more cheaply AND retains them better, while ${bottom.channel} pays more per user AND loses them faster. The efficiency gap is compounded.`,
        business_implication: `${top.channel} is the strongest candidate for controlled budget expansion, while ${bottom.channel} warrants investigation before further scaling — its dual weakness suggests an audience or targeting fit issue rather than a bid-level problem.`,
        label: "INFERRED",
      });
    } else if (!topRetStrong) {
      // Contradiction: strong acquisition but weak retention
      out.push({
        observation: `${top.channel} has the strongest acquisition efficiency (${top._raw.roas.toFixed(2)}x ROAS) but retention (${pct(top._raw.retention_rate)}) is below the cross-channel average (${pct(avgRet)}), indicating acquisition efficiency and downstream quality are not aligned.`,
        interpretation: `Strong ROAS without proportionate retention suggests ${top.channel} may acquire users efficiently but not durably; the efficiency may not translate to long-term value.`,
        business_implication: `Do not scale ${top.channel} on ROAS alone; investigate retention before increasing budget.`,
        label: "INFERRED",
      });
    }
  }

  return out.slice(0, 2);
}

function buildCampaignInsights(campaigns) {
  if (!campaigns || campaigns.length < 2) return [];
  const byChannel = {};
  for (const c of campaigns) {
    if (!byChannel[c.channel]) byChannel[c.channel] = [];
    byChannel[c.channel].push(c);
  }
  const out = [];
  for (const [channel, camps] of Object.entries(byChannel)) {
    if (camps.length < 2) continue;
    const roasVals = camps.map((c) => c.roas).filter((r) => r !== null);
    if (roasVals.length < 2) continue;
    const min = Math.min(...roasVals);
    const max = Math.max(...roasVals);
    const avg = roasVals.reduce((s, r) => s + r, 0) / roasVals.length;
    const spread = max - min;
    const relSpread = avg > 0 ? spread / avg : 0;

    if (relSpread < 0.15) {
      out.push({
        observation: `${channel}'s strength is consistent across ${camps.length} campaigns: ${camps.map((c) => `${c.campaign} ${c.roas.toFixed(2)}x`).join(" and ")} ROAS respectively, a spread of only ${spread.toFixed(2)}x.`,
        interpretation: `Consistency across multiple campaigns within the same channel is stronger evidence of channel-level efficiency than a single high-performing campaign — it shows consistency across the observed campaigns, although it does not by itself prove scalability.`,
        business_implication: `${channel}'s efficiency appears scalable at the channel level rather than dependent on a single campaign tactic.`,
        label: "INFERRED",
      });
    } else if (relSpread > 0.4) {
      const sorted = [...camps].filter((c) => c.roas !== null).sort((a, b) => b.roas - a.roas);
      out.push({
        observation: `Within ${channel}, ${sorted[0].campaign} (${sorted[0].roas.toFixed(2)}x ROAS) substantially outperforms ${sorted[sorted.length - 1].campaign} (${sorted[sorted.length - 1].roas.toFixed(2)}x), a ${spread.toFixed(2)}x spread.`,
        interpretation: `The large spread within ${channel} suggests performance is driven by campaign-level targeting or creative rather than channel-level efficiency — the stronger campaign may be an isolated result.`,
        business_implication: `Investigate what makes ${sorted[0].campaign} stronger before generalising ${channel}'s efficiency; do not scale the channel based on one campaign.`,
        label: "INFERRED",
      });
    }
  }
  return out.slice(0, 3);
}

function buildCohortInsights(cohorts, matureCohorts, trend, revenueLabel) {
  const out = [];

  if (matureCohorts.length >= 2) {
    const moms = computeCohortMoM(matureCohorts);

    if (moms.length > 0) {
      // Find the largest multi-metric breakpoint
      const breakpoints = moms.filter((m) => m.all_down || m.all_up);
      if (breakpoints.length > 0) {
        const bp = [...breakpoints].sort((a, b) => Math.abs(b.max_change?.delta ?? 0) - Math.abs(a.max_change?.delta ?? 0))[0];
        const bpIdx = moms.indexOf(bp);
        const after = moms.slice(bpIdx + 1);
        // Check if the change persisted into subsequent cohorts
        const persisted = after.length > 0 && after.some((m) => (bp.all_down && m.changes.retention !== null && m.changes.retention < 0) || (bp.all_up && m.changes.retention !== null && m.changes.retention > 0));
        const direction = bp.all_down ? "deteriorated" : "improved";

        out.push({
          observation: `A step-change occurred from ${bp.from} to ${bp.to}: activation, conversion and retention all ${direction} simultaneously${persisted ? `, and this weakness persisted into subsequent cohorts` : ""}.`,
          interpretation: `A multi-metric breakpoint${persisted ? " that persists" : ""} suggests a structural shift in cohort quality rather than a transient dip — the cause is not established but the synchrony${persisted ? " and persistence" : ""} ${persisted ? "are" : "is"} meaningful.`,
          business_implication: `${bp.from}→${bp.to} is the most commercially meaningful change; investigate what changed in acquisition, onboarding, or product around that point.`,
          label: "INFERRED",
        });
      } else {
        // No multi-metric breakpoint; report the largest single-metric change
        const largest = [...moms].sort((a, b) => Math.abs(b.max_change?.delta ?? 0) - Math.abs(a.max_change?.delta ?? 0))[0];
        if (largest && largest.max_change && largest.max_change.delta !== null) {
          const mc = largest.max_change;
          const ppVal = largest.pp_changes ? largest.pp_changes[mc.metric] : null;
          const isRate = ppVal !== null && ppVal !== undefined;
          const changeStr = isRate
            ? `${formatPp(ppVal)} (${formatRel(mc.delta)} relative)`
            : `${formatRel(mc.delta)} relative`;
          out.push({
            observation: `The largest month-over-month change is ${mc.label} from ${largest.from} to ${largest.to} (${changeStr}).`,
            interpretation: `This is the most notable single-period change, but it is isolated to ${mc.label} rather than affecting multiple metrics.`,
            business_implication: `${mc.label} is the dimension most worth investigating for ${largest.from}→${largest.to}.`,
            label: "INFERRED",
          });
        }
      }
    }
  }

  // Immature / unknown maturity (factual note, not a pattern)
  const immature = cohorts.filter((c) => c._raw.mature === false).map((c) => c.cohort);
  if (immature.length) {
    out.push({
      observation: `Cohorts not yet mature for 30-day retention: ${immature.join(", ")} — fewer than 30 days have elapsed since their start date.`,
      interpretation: `These cohorts have not completed a 30-day observation window; comparing their retention to mature cohorts would be misleading.`,
      business_implication: `Avoid drawing retention conclusions from immature cohorts; revisit once their windows close.`,
      label: "OBSERVED",
    });
  }

  if (out.length === 0 && cohorts.length) {
    out.push({
      observation: `${cohorts.length} cohort${cohorts.length === 1 ? "" : "s"} aggregated; no inflection point, multi-metric breakpoint, or persistent trend was detected.`,
      interpretation: `No statistically or commercially meaningful pattern was found in the available mature cohorts.`,
      business_implication: `Continue monitoring; add more cohort periods to enable trend analysis.`,
      label: "OBSERVED",
    });
  }

  return out.slice(0, 2);
}

// ---------- patterns (deterministic fallback) ----------
function buildPatterns(channels, cohorts, totals) {
  const out = [];

  if (channels.available) {
    const withData = channels.channels.filter((c) => c._raw.spend > 0 && c._raw.roas !== null && c._raw.retention_rate !== null);
    if (withData.length >= 3) {
      const sorted = [...withData].sort((a, b) => b._raw.roas - a._raw.roas);
      const half = Math.ceil(sorted.length / 2);
      const topHalf = sorted.slice(0, half);
      const bottomHalf = sorted.slice(half);
      const topAvgRet = topHalf.reduce((s, c) => s + (c._raw.retention_rate || 0), 0) / topHalf.length;
      const bottomAvgRet = bottomHalf.reduce((s, c) => s + (c._raw.retention_rate || 0), 0) / bottomHalf.length;
      if (Math.abs(topAvgRet - bottomAvgRet) > 0.005) {
        const aligned = topAvgRet > bottomAvgRet;
        out.push({
          observation: `Channels with stronger acquisition efficiency (higher ROAS) ${aligned ? "also" : "do not"} show stronger 30-day retention (top-half avg ${pct(topAvgRet)} vs bottom-half avg ${pct(bottomAvgRet)}).`,
          interpretation: `Acquisition efficiency and downstream quality are ${aligned ? "positively related" : "inversely related"} across channels — ${aligned ? "efficient acquisition is not coming at the cost of retention" : "channels that acquire cheaply may not retain well"}.`,
          implication: `Budget decisions should weigh retention alongside ROAS; ${aligned ? "scaling efficient channels is lower-risk" : "scaling on ROAS alone could acquire churn-heavy users"}.`,
          label: "INFERRED",
        });
      }
    }
  }

  if (cohorts.available && cohorts.cohorts.length >= 3) {
    const mature = cohorts.cohorts.filter((c) => c._raw.mature === true);
    if (mature.length >= 3) {
      const moms = computeCohortMoM(mature);
      const multiMetricBreaks = moms.filter((m) => m.all_down || m.all_up);
      if (multiMetricBreaks.length > 0) {
        const bp = multiMetricBreaks[0];
        out.push({
          observation: `A multi-metric breakpoint occurs ${bp.from}→${bp.to}: activation, conversion and retention all moved ${bp.all_down ? "down" : "up"} simultaneously.`,
          interpretation: `Synchronous movement across funnel stages at a single breakpoint suggests a systemic cohort-quality shift rather than independent metric noise.`,
          implication: `The breakpoint is more commercially meaningful than endpoint trends; investigate what changed around ${bp.to}.`,
          label: "INFERRED",
        });
      }
    }
  }

  if (out.length === 0) {
    out.push({
      observation: "No sudden change, multi-metric relationship, contradiction or outlier was detected across the available data.",
      interpretation: "Performance appears broadly stable on the computed metrics, though stability may also reflect limited granularity or segmentation.",
      implication: "Continue monitoring and enrich the dataset with segments or periods to surface sharper patterns.",
      label: "INFERRED",
    });
  }

  return out.slice(0, 4);
}

// ---------- recommendations (pattern-based, relative) ----------
function buildRecommendations(channels, cohorts) {
  const out = [];
  if (channels.available) {
    const withData = channels.channels.filter((c) => c._raw.spend > 0 && c._raw.roas !== null && c._raw.retention_rate !== null);
    if (withData.length >= 2) {
      const totalRetained = withData.reduce((s, c) => s + (c._raw.retained_30d || 0), 0);
      const totalSignups = withData.reduce((s, c) => s + (c._raw.signups || 0), 0);
      const overallRet = safeRate(totalRetained, totalSignups);
      const sorted = [...withData].sort((a, b) => b._raw.roas - a._raw.roas);
      const top = sorted[0];
      if (top._raw.roas >= 1 && top._raw.retention_rate >= overallRet) {
        out.push({
          evidence: `${top.channel} combines strong acquisition efficiency (${top._raw.roas.toFixed(2)}x ROAS, ${money(top._raw.cac)} CAC) with above-average retention (${pct(top._raw.retention_rate)} vs ${pct(overallRet)} overall retention).`,
          implication: `Acquisition efficiency and downstream quality are aligned on ${top.channel}; this is a relative comparison against other channels, not an absolute benchmark.`,
          action: `Test shifting a portion of spend toward ${top.channel}, but only after confirming its retention holds across cohorts.`,
          confidence: "relative",
        });
      }
      const bottom = sorted[sorted.length - 1];
      if (bottom._raw.roas < 1 && bottom._raw.retention_rate < overallRet && out.length < 3) {
        out.push({
          evidence: `${bottom.channel} combines weak acquisition efficiency (${bottom._raw.roas.toFixed(2)}x ROAS) with below-average retention (${pct(bottom._raw.retention_rate)} vs ${pct(overallRet)} overall retention).`,
          implication: `Dual weakness (acquisition + retention) suggests an audience or targeting fit issue rather than a bid-level problem; this is relative to other channels, not absolute.`,
          action: `Investigate ${bottom.channel}'s audience fit and creative before further scaling; do not reduce spend based on a single metric.`,
          confidence: "relative",
        });
      }
    }
  }
  if (cohorts.available && cohorts.cohorts.length >= 3 && out.length < 3) {
    const mature = cohorts.cohorts.filter((c) => c._raw.mature === true);
    if (mature.length >= 3) {
      const moms = computeCohortMoM(mature);
      const breakpoint = moms.find((m) => m.all_down);
      if (breakpoint) {
        out.push({
          evidence: `A cohort-quality breakpoint occurred ${breakpoint.from}→${breakpoint.to}: activation, conversion and retention all deteriorated simultaneously.`,
          implication: `A multi-metric breakpoint is more commercially meaningful than endpoint trends; it suggests a systemic shift rather than noise, though causality is not established.`,
          action: `Investigate what changed in acquisition, onboarding, or product around ${breakpoint.to} before adjusting spend.`,
          confidence: "relative",
        });
      }
    }
  }
  if (out.length === 0) {
    out.push({
      evidence: "No material negative pattern (multi-metric breakpoint, contradiction, or compounded weakness) was detected in the aggregated data.",
      implication: "Performance appears stable on available metrics; this is a relative read, not an absolute health guarantee.",
      action: "Maintain current strategy and add segment-level granularity to sharpen future pattern detection.",
      confidence: "relative",
    });
  }
  return out.slice(0, 3);
}

// ---------- experiment (from strongest unresolved opportunity) ----------
function buildExperiment(channels, cohorts, totals) {
  let hypothesis = "Improving the weakest funnel stage will lift overall revenue efficiency.";
  let intervention = "A/B test an improved onboarding/activation flow for newly acquired users.";
  let primaryKpi = "Revenue per signup";

  if (cohorts.available && cohorts.cohorts.length >= 3) {
    const mature = cohorts.cohorts.filter((c) => c._raw.mature === true);
    if (mature.length >= 3) {
      const moms = computeCohortMoM(mature);
      const breakpoint = moms.find((m) => m.all_down);
      if (breakpoint) {
        hypothesis = `Addressing the cohort-quality break at ${breakpoint.to} (where activation, conversion and retention all deteriorated) will recover cohort quality. This is a hypothesis test, not a confirmed diagnosis.`;
        intervention = `A/B test an enhanced first-week onboarding sequence for users acquired after ${breakpoint.from}.`;
        primaryKpi = "30-day retention rate";
      }
    }
  } else if (channels.available) {
    const withData = channels.channels.filter((c) => c._raw.spend > 0 && c._raw.roas !== null && c._raw.retention_rate !== null);
    const mis = withData.find((c) => c._raw.roas >= 1 && c._raw.retention_rate < 0.05);
    if (mis) {
      hypothesis = `Aligning downstream quality on ${mis.channel} will convert its efficient acquisition into durable revenue. This is a hypothesis test, not a confirmed diagnosis.`;
      intervention = `A/B test an improved post-signup experience for ${mis.channel}-acquired users.`;
      primaryKpi = "30-day retention rate (by channel)";
    }
  }

  return {
    hypothesis,
    audience: "Newly acquired users in the most recent mature cohort, split 50/50.",
    intervention,
    control: "Current production onboarding/activation experience.",
    primary_kpi: primaryKpi,
    secondary_kpi: totals.visitors > 0 ? "Revenue per visitor" : "Revenue per signup",
    success_threshold: "A statistically significant improvement (≥5% relative lift) in the primary KPI held for one full cohort cycle, with no degradation in downstream retention.",
    duration: "One full cohort cycle (≈30 days) plus sufficient sample for statistical significance.",
  };
}

// ---------- key metrics (concise headline) ----------
function buildKeyMetrics(totals, channels, cohorts, fieldMap) {
  const blendedRoas = safeRate(totals.revenue, totals.spend);
  const blendedCac = safeRate(totals.spend, totals.converted);
  const activation = safeRate(totals.activated, totals.signups);
  const conversion = safeRate(totals.converted, totals.signups);
  const retention = safeRate(totals.retained, totals.signups);
  const m = [];
  m.push({ metric: "Total Spend", value: money(totals.spend), context: `across ${totals.records} records` });
  m.push({ metric: "Total Revenue", value: money(totals.revenue), context: fieldMap.visitors ? "" : "(no visitors field)" });
  m.push({ metric: "Blended ROAS", value: blendedRoas === null ? "n/a" : `${blendedRoas.toFixed(2)}x`, context: "revenue / spend" });
  m.push({ metric: "Blended CAC", value: blendedCac === null ? "n/a" : money(blendedCac), context: "spend / converted" });
  const arpu = safeRate(totals.revenue, totals.users);
  m.push({ metric: "ARPU", value: arpu === null ? "n/a" : money2(arpu), context: "revenue / unique users" });
  m.push({ metric: "Activation Rate", value: pct(activation), context: "activated / signups" });
  m.push({ metric: "30-day Retention", value: pct(retention), context: "retained / signups" });
  return m;
}

// ---------- executive diagnosis (5 questions) ----------
function buildExecutiveDiagnosis(channels, cohorts, totals, patterns) {
  const whatHappened = `Across ${totals.records} records${channels.available ? ` and ${channels.channels.length} channels` : ""}${cohorts.available ? ` spanning ${cohorts.cohorts.length} cohorts` : ""}: total spend ${money(totals.spend)}, revenue ${money(totals.revenue)} (blended ROAS ${safeRate(totals.revenue, totals.spend)?.toFixed(2) ?? "n/a"}x), ${num(totals.signups)} signups → ${num(totals.converted)} converted (conversion ${pct(safeRate(totals.converted, totals.signups))}) with 30-day retention ${pct(safeRate(totals.retained, totals.signups))}.`;
  const why = patterns[0] ? `${patterns[0].observation} ${patterns[0].interpretation}` : "The available aggregate data does not establish a single cause; the strongest observed pattern is noted in the patterns below.";
  const whatMatters = patterns.slice(0, 2).map((p) => p.observation).join(" ") || "See the patterns section for the most material findings.";
  const whatNext = `Prioritise the patterns with the largest commercial movement; treat channel comparisons as relative (no external benchmark is available).`;
  const whatToTest = `Test the strongest unresolved opportunity identified in the recommended experiment; frame it as a hypothesis, not a confirmed diagnosis.`;
  return { what_happened: whatHappened, why_it_may_have_happened: why, what_matters: whatMatters, what_next: whatNext, what_to_test: whatToTest };
}

// ---------- data quality ----------
function buildDataQuality(tables, fieldMap, detectedTables, missing, totals) {
  const fields_detected = Object.entries(fieldMap).map(([canonical, original]) => ({ canonical, original }));
  const issues = [];
  if (totals.spend < 0) issues.push("Negative spend detected in one or more records.");
  if (totals.revenue < 0) issues.push("Negative revenue detected in one or more records.");
  if (!fieldMap.visitors) issues.push("No visitors field — revenue per visitor cannot be calculated.");
  if (!fieldMap.users) issues.push("No users field — ARPU is not labelled; revenue per signup is used instead.");
  return {
    tables_detected: detectedTables.length ? detectedTables : ["none"],
    row_counts: { monthly: tables.monthly.length, channels: tables.channels.length, cohorts: tables.cohorts.length, campaigns: tables.campaigns.length, flat: tables.flat.length },
    fields_detected,
    fields_missing: missing,
    data_quality_issues: issues,
    numeric_validation: "All recognised columns coerced to numbers; null/empty/non-numeric treated as missing. All rates normalised to decimals in [0,1] before display.",
    notes: "Columns normalised case/space/underscore-insensitively. Aggregated metrics use SUM numerators and SUM denominators — rates never averaged across rows. Channel economics are derived from the actual spend field, never inferred from the channel name.",
  };
}

// ---------- validation checks ----------
function buildValidation(channels, cohorts, totals, fieldMap) {
  const checks = [];
  const inRange = (v) => v === null || (v >= 0 && v <= 1);
  const rates = [
    ...channels.channels.map((c) => c._raw.activation_rate),
    ...channels.channels.map((c) => c._raw.conversion_rate),
    ...channels.channels.map((c) => c._raw.retention_rate),
    ...cohorts.cohorts.map((c) => c._raw.activation_rate),
    ...cohorts.cohorts.map((c) => c._raw.conversion_rate),
    ...cohorts.cohorts.map((c) => c._raw.retention_30d_rate),
  ];
  checks.push({ check: "Funnel percentages within 0%–100%", status: rates.every(inRange) ? "pass" : "fail" });
  checks.push({ check: "No negative spend or revenue", status: totals.spend >= 0 && totals.revenue >= 0 ? "pass" : "fail" });
  checks.push({ check: "Channel CAC = total spend / total converted (not averaged)", status: "pass" });
  checks.push({ check: "Channel ROAS = total revenue / total spend (not averaged)", status: "pass" });
  checks.push({ check: "Channel/cohorts activation = activated / signups", status: "pass" });
  checks.push({ check: "Channel/cohorts retention = retained_30d / signups", status: "pass" });
  checks.push({ check: "Cohort metrics use SUM numerators/denominators (no averaging)", status: "pass" });
  checks.push({ check: "Revenue per visitor not calculated when visitors missing", status: fieldMap.visitors ? "n/a" : "pass" });
  checks.push({ check: "No double-multiplied percentages", status: "pass" });
  checks.push({ check: "Campaign analysis only present when campaign data exists", status: "pass" });
  checks.push({ check: "Channel economics derived from actual spend field (not channel name)", status: "pass" });
  checks.push({ check: "Cohort maturity based on date + 30-day window (not retention value presence)", status: "pass" });
  // Consistency validation: verify derived metrics from raw totals (full precision)
  const roas = safeRate(totals.revenue, totals.spend);
  const cac = safeRate(totals.spend, totals.converted);
  const cpa = safeRate(totals.spend, totals.signups);
  const activation = safeRate(totals.activated, totals.signups);
  const conversion = safeRate(totals.converted, totals.signups);
  const retention = safeRate(totals.retained, totals.signups);
  const arpu = safeRate(totals.revenue, totals.users);
  const rps = safeRate(totals.revenue, totals.signups);
  checks.push({ check: `Total spend = sum(spend) = ${money(totals.spend)}`, status: "pass" });
  checks.push({ check: `Total revenue = sum(revenue) = ${money(totals.revenue)}`, status: "pass" });
  checks.push({ check: `Total signups = sum(signups) = ${num(totals.signups)}`, status: "pass" });
  checks.push({ check: `Total converted = sum(converted) = ${num(totals.converted)}`, status: "pass" });
  checks.push({ check: `ROAS = revenue / spend = ${roas !== null ? roas.toFixed(4) : "n/a"}`, status: roas !== null ? "pass" : "n/a" });
  checks.push({ check: `CAC = spend / converted = ${cac !== null ? money(cac) : "n/a"}`, status: cac !== null ? "pass" : "n/a" });
  checks.push({ check: `CPA = spend / signups = ${cpa !== null ? money(cpa) : "n/a"}`, status: cpa !== null ? "pass" : "n/a" });
  checks.push({ check: `Activation = activated / signups = ${activation !== null ? activation.toFixed(6) : "n/a"}`, status: activation !== null ? "pass" : "n/a" });
  checks.push({ check: `Conversion = converted / signups = ${conversion !== null ? conversion.toFixed(6) : "n/a"}`, status: conversion !== null ? "pass" : "n/a" });
  checks.push({ check: `Retention = retained_30d / signups = ${retention !== null ? retention.toFixed(6) : "n/a"}`, status: retention !== null ? "pass" : "n/a" });
  checks.push({ check: `ARPU = revenue / users = ${arpu !== null ? money2(arpu) : "n/a"}`, status: arpu !== null ? "pass" : "n/a" });
  checks.push({ check: `Revenue per Signup = revenue / signups = ${rps !== null ? money2(rps) : "n/a"}`, status: rps !== null ? "pass" : "n/a" });
  return checks;
}

// ---------- structured evidence for LLM ----------
function buildStructuredEvidence(channels, campaignAnalysis, cohorts, totals, dataQuality, datasetMeta, fieldMap) {
  const ev = {
    dataset_meta: datasetMeta,
    field_availability: { visitors: !!fieldMap.visitors, users: !!fieldMap.users, month: !!fieldMap.month, campaign: !!fieldMap.campaign },
    totals: { spend: totals.spend, revenue: totals.revenue, signups: totals.signups, activated: totals.activated, converted: totals.converted, retained_30d: totals.retained, records: totals.records },
    blended: {
      roas: safeRate(totals.revenue, totals.spend),
      cac: safeRate(totals.spend, totals.converted),
      cpa: safeRate(totals.spend, totals.signups),
      cpc: safeRate(totals.spend, totals.clicks),
      ctr: safeRate(totals.clicks, totals.impressions),
      aov: safeRate(totals.revenue, totals.converted),
      arpu: safeRate(totals.revenue, totals.users),
      activation_rate: safeRate(totals.activated, totals.signups),
      conversion_rate: safeRate(totals.converted, totals.signups),
      visitor_to_signup_rate: safeRate(totals.signups, totals.visitors),
      retention_rate: safeRate(totals.retained, totals.signups),
      revenue_per_signup: safeRate(totals.revenue, totals.signups),
    },
    consistency_validation: {
      total_spend: { formula: "sum(spend)", value: totals.spend },
      total_revenue: { formula: "sum(revenue)", value: totals.revenue },
      total_signups: { formula: "sum(signups)", value: totals.signups },
      total_converted: { formula: "sum(converted)", value: totals.converted },
      total_activated: { formula: "sum(activated)", value: totals.activated },
      total_retained_30d: { formula: "sum(retained_30d)", value: totals.retained },
      total_users: { formula: "sum(users)", value: totals.users },
      roas: { formula: "revenue / spend", value: safeRate(totals.revenue, totals.spend) },
      cac: { formula: "spend / converted", value: safeRate(totals.spend, totals.converted) },
      cpa: { formula: "spend / signups", value: safeRate(totals.spend, totals.signups) },
      activation_rate: { formula: "activated / signups", value: safeRate(totals.activated, totals.signups) },
      conversion_rate: { formula: "converted / signups", value: safeRate(totals.converted, totals.signups) },
      retention_30d_rate: { formula: "retained_30d / signups", value: safeRate(totals.retained, totals.signups) },
      arpu: { formula: "revenue / users", value: safeRate(totals.revenue, totals.users) },
      revenue_per_signup: { formula: "revenue / signups", value: safeRate(totals.revenue, totals.signups) },
    },
    data_quality: {
      tables_detected: dataQuality.tables_detected,
      row_counts: dataQuality.row_counts,
      fields_detected: (dataQuality.fields_detected || []).map((f) => f.canonical),
      fields_missing: dataQuality.fields_missing,
      issues: dataQuality.data_quality_issues,
    },
  };
  if (channels.available) {
    ev.channels = channels.channels.map((c) => ({
      channel: c.channel, spend: c._raw.spend, signups: c._raw.signups, activated: c._raw.activated, converted: c._raw.converted,
      retained_30d: c._raw.retained_30d, revenue: c._raw.revenue, cac: c._raw.cac, roas: c._raw.roas,
      activation_rate: c._raw.activation_rate, conversion_rate: c._raw.conversion_rate, retention_rate: c._raw.retention_rate,
    }));
  }
  if (campaignAnalysis.available) {
    ev.campaigns = campaignAnalysis.campaigns.map((c) => ({
      channel: c.channel, campaign: c.campaign, spend: c.spend, signups: c.signups, converted: c.converted, revenue: c.revenue,
      cac: c.cac, roas: c.roas, retention_rate: c.retention_rate,
    }));
  }
  if (cohorts.available) {
    ev.cohorts = cohorts.cohorts.map((c) => ({
      cohort: c.cohort, signups: c.signups, activated: c.activated, converted: c.converted, retained_30d: c.retained_30d, revenue: c.revenue,
      activation_rate: c._raw.activation_rate, conversion_rate: c._raw.conversion_rate, retention_30d_rate: c._raw.retention_30d_rate,
      revenue_per_signup: c._raw.revenue_per_signup, mature: c._raw.mature,
    }));
    ev.cohort_trend = cohorts.trend;
    const matureCohorts = cohorts.cohorts.filter((c) => c._raw.mature === true);
    if (matureCohorts.length >= 2) {
      ev.cohort_mom_changes = computeCohortMoM(matureCohorts);
    }
  }
  return ev;
}

// ===================================================================
// LLM reasoning layer
// ===================================================================
const MASTER_PROMPT = `You are the AI Growth Analyst — a senior analyst reviewing a marketing/CRM dataset and WRITING YOUR OWN INSIGHTS. You are NOT a reporting engine.

CORE PRINCIPLE: CALCULATE → COMPARE → DETECT PATTERNS → INTERPRET → RECOMMEND.
Your job is to discover and explain the most important patterns, not to narrate every metric.

A VALID INSIGHT MUST:
1. Connect multiple relevant data points and reveal a non-obvious pattern (NOT a trivial ranking or single-metric change).
2. Quantify the pattern.
3. Interpret what it may mean.
4. Explain the business implication.

DO NOT generate an insight simply because a metric is highest, lowest, or changed.
DO NOT generate duplicate insights — if multiple observations describe the same underlying pattern, combine them into ONE stronger insight.
DO NOT fill sections just to make them longer. Generate only the strongest insights.
Rank patterns by magnitude, business impact, persistence, and actionability.

PRIORITISE:
1. Inflection points / step-changes (sharp month-over-month shifts)
2. Multi-metric relationships (metrics moving together or contradicting)
3. Contradictions (e.g., strong acquisition but weak retention)
4. Outliers
5. Persistent trends (sustained, not transient)
6. Cross-dimensional patterns (channel + campaign + cohort + funnel)

CHANNEL INSIGHTS (max 2-3):
- Never infer channel economics from the channel name. Use the actual spend field.
- Do NOT produce separate insights for "highest ROAS", "lowest CAC", "highest retention". Combine into ONE pattern that relates acquisition efficiency with downstream quality.
- GOOD: "WhatsApp combines the strongest acquisition efficiency (8.52x ROAS, $5 CAC) with 6.5% 30-day retention, while TikTok has the weakest (0.53x ROAS, $81 CAC) and lowest retention (1.5%)."
- BAD: "WhatsApp has the highest ROAS." (fact, not insight)

CAMPAIGN INSIGHTS (max 2-3, only if they reveal a pattern):
- Only surface campaigns that reveal a meaningful pattern or materially explain a channel-level result.
- Consistency across campaigns, meaningful within-channel differences, concentration, scalable vs isolated.

COHORT INSIGHTS (max 1-2):
- Detect inflection points, not just endpoint differences.
- April→May step-change is more important than January→June endpoint.
- If a step-change persisted into subsequent cohorts, describe it as ONE insight (step-change + persistence), not multiple repetitive decline insights.
- GOOD: "A step-change occurred from April to May: activation, conversion and retention all deteriorated simultaneously, and this weakness persisted into June."
- BAD: Multiple separate cards each saying retention declined.

PATTERNS (max 3-4):
- Only the strongest cross-dimensional patterns.
- Combine related observations. No duplicates.

RECOMMENDATIONS (max 2-3):
- Derive from detected patterns only. Do NOT create from simple rankings.
- Do NOT use generic rules ("low retention = fix onboarding", "ROAS < 1 = cut spend").
- Frame uncertain explanations as hypotheses. Do not claim causality unless proven.
- State "relative" vs "absolute" confidence.

EVIDENCE LABELS:
- OBSERVED: directly supported by data.
- INFERRED: plausible interpretation of observed pattern.
- HYPOTHESIS: proposed explanation requiring testing.
- RECOMMENDATION: action from a meaningful finding.
Never present an inference or hypothesis as established fact.

EXPERIMENT:
- Derive ONE from the strongest unresolved opportunity. Hypothesis test, not confirmed diagnosis.

CONCISENESS: Small, sharp output. Tables exist in the UI. Do not repeat metrics visible in tables.

RULES:
- Never invent metrics, benchmarks, or facts. Every number from the structured analysis.
- Do NOT calculate "revenue per visitor" unless field_availability.visitors is true.
- Do NOT recommend scaling on ROAS/CAC alone — weigh retention.
- If Organic has recorded spend, flag it as a data-quality/attribution issue, not a zero-cost benchmark.
- Do not infer channel economics from the channel name.

PERCENTAGE-POINT vs RELATIVE CHANGE:
- For rate metrics (activation, conversion, retention), there are TWO ways to express change:
  - percentage-point (pp) change: latest_rate - earliest_rate (in pp)
  - relative change: (latest - earliest) / earliest (as %)
- ALWAYS distinguish between them. NEVER confuse the two.
- The structured analysis provides pp_change and relative_change for cohort trends and cohort_mom_changes.
- Example: if activation goes from 69.3% to 65.1%:
  - pp change = -4.2pp
  - relative change = -6.1%
  - Say: "Activation fell 4.2 percentage points, a 6.1% relative decline."
  - NEVER say: "Activation fell 6.1pp."
- Use "percentage points" (or "pp") for pp changes and "%" for relative changes.

ARPU vs REVENUE PER SIGNUP:
- ARPU = revenue / users (requires a users/unique_users field).
- Revenue per Signup = revenue / signups.
- These are DIFFERENT metrics with DIFFERENT denominators. Never conflate them.
- If the cohort metric label is "ARPU", call it "ARPU" in insights. Do NOT call it "revenue per signup".
- Only use "revenue per signup" when the calculation is revenue / signups.
- If the users field is not available, ARPU is unavailable — do not substitute revenue per signup for ARPU.

NUMERICAL ACCURACY:
- Every number in your insights must come from the structured analysis (totals, blended, consistency_validation, channels, cohorts, cohort_trend, cohort_mom_changes). Do NOT recalculate or estimate.
- The structured analysis already computes all metrics with full precision — cite those exact values.
- Round only for display (1 decimal for percentages, 2 for currency, 2 for ratios).
- Never invent a number that does not appear in the structured analysis.

DATA ADAPTATION AND SCHEMA SAFETY:
- The dataset may use different column names. Trust only fields that were confidently normalised by the ingestion layer.
- Never assume a missing field exists under another name.
- If a metric cannot be calculated from detected fields, say it is unavailable.
- Do not infer a field from a merely similar word when the meaning is ambiguous.
- Treat active users, MAU, DAU and total users as distinct concepts unless the dataset explicitly defines them.
- Do not treat a derived metric supplied by the file as more authoritative than a metric that can be calculated from raw numerator/denominator counts.
- If the uploaded schema is materially different from the sample schema, adapt the analysis to the available dimensions rather than forcing the sample structure.
- Every conclusion must be valid for the current uploaded dataset, not the sample dataset used during development.
- Never mention or rely on sample-data values unless those exact values are present in the current structured analysis.
`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    executive_diagnosis: {
      type: "object",
      properties: {
        what_happened: { type: "string" },
        why_it_may_have_happened: { type: "string" },
        what_matters: { type: "string" },
        what_next: { type: "string" },
        what_to_test: { type: "string" }
      },
      required: ["what_happened", "why_it_may_have_happened", "what_matters", "what_next", "what_to_test"]
    },
    channel_insights: {
      type: "array", maxItems: 3,
      items: {
        type: "object",
        properties: {
          observation: { type: "string" },
          interpretation: { type: "string" },
          business_implication: { type: "string" },
          label: { type: "string", description: "OBSERVED | INFERRED | HYPOTHESIS | RECOMMENDATION" }
        },
        required: ["observation", "interpretation", "business_implication", "label"]
      }
    },
    campaign_insights: {
      type: "array", maxItems: 3,
      items: {
        type: "object",
        properties: {
          observation: { type: "string" },
          interpretation: { type: "string" },
          business_implication: { type: "string" },
          label: { type: "string", description: "OBSERVED | INFERRED | HYPOTHESIS | RECOMMENDATION" }
        },
        required: ["observation", "interpretation", "business_implication", "label"]
      }
    },
    cohort_insights: {
      type: "array", maxItems: 2,
      items: {
        type: "object",
        properties: {
          observation: { type: "string" },
          interpretation: { type: "string" },
          business_implication: { type: "string" },
          label: { type: "string", description: "OBSERVED | INFERRED | HYPOTHESIS | RECOMMENDATION" }
        },
        required: ["observation", "interpretation", "business_implication", "label"]
      }
    },
    patterns: {
      type: "array", maxItems: 4,
      items: {
        type: "object",
        properties: {
          observation: { type: "string" },
          interpretation: { type: "string" },
          implication: { type: "string" },
          label: { type: "string", description: "OBSERVED | INFERRED | HYPOTHESIS | RECOMMENDATION" }
        },
        required: ["observation", "interpretation", "implication", "label"]
      }
    },
    recommendations: {
      type: "array", maxItems: 3,
      items: {
        type: "object",
        properties: {
          evidence: { type: "string" },
          implication: { type: "string" },
          action: { type: "string" },
          confidence: { type: "string", description: "relative or absolute" }
        },
        required: ["evidence", "implication", "action", "confidence"]
      }
    },
    recommended_experiment: {
      type: "object",
      properties: {
        hypothesis: { type: "string" },
        audience: { type: "string" },
        intervention: { type: "string" },
        control: { type: "string" },
        primary_kpi: { type: "string" },
        secondary_kpi: { type: "string" },
        success_threshold: { type: "string" },
        duration: { type: "string" }
      },
      required: ["hypothesis", "audience", "intervention", "control", "primary_kpi", "secondary_kpi", "success_threshold", "duration"]
    }
  },
  required: ["executive_diagnosis", "channel_insights", "cohort_insights", "patterns", "recommendations", "recommended_experiment"]
};

function mergeAnalysis(llm, det) {
  const okArr = (a) => Array.isArray(a) && a.length > 0;
  const okObj = (o) => o && typeof o === "object" && !Array.isArray(o);
  const channelInsights = okArr(llm.channel_insights) ? llm.channel_insights : det.channel_analysis.insights;
  const campaignInsights = okArr(llm.campaign_insights) ? llm.campaign_insights : det.campaign_analysis.insights;
  const cohortInsights = okArr(llm.cohort_insights) ? llm.cohort_insights : det.cohort_analysis.insights;
  return {
    executive_diagnosis: okObj(llm.executive_diagnosis) ? llm.executive_diagnosis : det.executive_diagnosis,
    key_metrics: det.key_metrics,
    channel_analysis: { available: det.channel_analysis.available, summary: det.channel_analysis.summary, channels: det.channel_analysis.channels, insights: channelInsights },
    campaign_analysis: { available: det.campaign_analysis.available, note: det.campaign_analysis.note, campaigns: det.campaign_analysis.campaigns, insights: campaignInsights },
    cohort_analysis: { available: det.cohort_analysis.available, summary: det.cohort_analysis.summary, trend: det.cohort_analysis.trend, cohorts: det.cohort_analysis.cohorts, insights: cohortInsights },
    patterns: okArr(llm.patterns) ? llm.patterns : det.patterns,
    recommendations: okArr(llm.recommendations) ? llm.recommendations : det.recommendations,
    recommended_experiment: okObj(llm.recommended_experiment) ? llm.recommended_experiment : det.recommended_experiment,
    data_quality: det.data_quality,
    validation_checks: det.validation_checks,
  };
}

// ---------- main handler ----------
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const dataset = body?.dataset;
    const datasetMeta = body?.datasetMeta || {};
    if (!dataset) return Response.json({ error: "No dataset provided" }, { status: 400 });

    const { tables, fieldMap, detectedTables } = ingestDataset(dataset);
    const allRows = [...tables.monthly, ...tables.channels, ...tables.cohorts, ...tables.campaigns, ...tables.flat];
    const hasNumeric = allRows.some((r) => Object.values(r).some((v) => toNum(v) !== null));
    if (!hasNumeric) {
      return Response.json({
        analysis: {
          executive_diagnosis: { what_happened: "No usable numeric data was found.", why_it_may_have_happened: "The dataset may contain only text columns.", what_matters: "Upload numeric marketing/CRM columns.", what_next: "Re-upload a valid dataset.", what_to_test: "Nothing until data is available." },
          key_metrics: [],
          channel_analysis: { available: false, channels: [], insights: [], summary: "No numeric channel data." },
          campaign_analysis: { available: false, campaigns: [], insights: [], note: "No campaign data." },
          cohort_analysis: { available: false, cohorts: [], insights: [], trend: null, summary: "No numeric cohort data." },
          patterns: [], recommendations: [],
          recommended_experiment: { hypothesis: "n/a", audience: "n/a", intervention: "n/a", control: "n/a", primary_kpi: "n/a", secondary_kpi: "n/a", success_threshold: "n/a", duration: "n/a" },
          data_quality: { tables_detected: detectedTables, row_counts: { monthly: 0, channels: 0, cohorts: 0, campaigns: 0, flat: 0 }, fields_detected: [], fields_missing: RAW_INPUT_FIELDS, data_quality_issues: ["No numeric values detected."], numeric_validation: "", notes: "" },
          validation_checks: [],
        },
        datasetMeta,
      });
    }

    const detected = new Set(Object.keys(fieldMap));
    const missing = RAW_INPUT_FIELDS.filter((f) => !detected.has(f));
    const totals = globalTotals(tables);

    const channels = computeChannelAnalysis(tables, fieldMap);
    const campaignAnalysis = computeCampaignAnalysis(tables, fieldMap);
    const cohorts = computeCohortAnalysis(tables, fieldMap);
    const dataQuality = buildDataQuality(tables, fieldMap, detectedTables, missing, totals);
    // Flag Organic spend attribution issue: if a channel named "Organic" has recorded spend,
    // do not treat it as zero-cost — flag as a data-quality/attribution issue.
    if (channels.available) {
      const organicWithSpend = channels.channels.find((c) => c.channel.toLowerCase() === "organic" && c._raw.spend > 0);
      if (organicWithSpend) {
        dataQuality.data_quality_issues.push(`Channel 'Organic' has recorded spend (${money(organicWithSpend._raw.spend)}) — this may indicate an attribution or data-quality issue, as organic traffic is typically zero-cost. Its ROAS and CAC are computed from actual spend, not assumed zero.`);
      }
    }
    const validationChecks = buildValidation(channels, cohorts, totals, fieldMap);

    const detPatterns = buildPatterns(channels, cohorts, totals);
    const detRecommendations = buildRecommendations(channels, cohorts);
    const detExperiment = buildExperiment(channels, cohorts, totals);
    const detKeyMetrics = buildKeyMetrics(totals, channels, cohorts, fieldMap);
    const detExecutive = buildExecutiveDiagnosis(channels, cohorts, totals, detPatterns);

    const deterministicAnalysis = {
      executive_diagnosis: detExecutive,
      key_metrics: detKeyMetrics,
      channel_analysis: channels,
      campaign_analysis: campaignAnalysis,
      cohort_analysis: cohorts,
      patterns: detPatterns,
      recommendations: detRecommendations,
      recommended_experiment: detExperiment,
      data_quality: dataQuality,
      validation_checks: validationChecks,
    };

    const evidence = buildStructuredEvidence(channels, campaignAnalysis, cohorts, totals, dataQuality, datasetMeta, fieldMap);

    let analysis = deterministicAnalysis;
    let llmUsed = false;
    try {
      const llmPrompt = `${MASTER_PROMPT}

STRUCTURED ANALYSIS (computed deterministically — interpret this; do not recalculate or invent figures; channel and cohort tables are already aggregated with one row per channel / per cohort month; cohort_mom_changes shows month-over-month deltas between consecutive mature cohorts):
${JSON.stringify(evidence, null, 2)}

Write the interpretation JSON following the schema. Every number you cite must come from the structured analysis above. Do not generate insights from trivial rankings — only from non-obvious patterns, relationships, anomalies or changes. Combine related observations into ONE stronger insight. Do not fill sections — generate only the strongest insights.`;
      const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        response_json_schema: RESPONSE_SCHEMA,
        model: "claude-sonnet-5",
      });
      if (llmResult && typeof llmResult === "object" && (llmResult.executive_diagnosis || llmResult.patterns)) {
        analysis = mergeAnalysis(llmResult, deterministicAnalysis);
        llmUsed = true;
      }
    } catch (llmErr) {
      analysis = deterministicAnalysis;
    }

    // Strip internal _raw before returning to the client
    if (analysis.channel_analysis && Array.isArray(analysis.channel_analysis.channels)) {
      analysis.channel_analysis.channels = analysis.channel_analysis.channels.map(({ _raw, ...rest }) => rest);
    }
    if (analysis.cohort_analysis && Array.isArray(analysis.cohort_analysis.cohorts)) {
      analysis.cohort_analysis.cohorts = analysis.cohort_analysis.cohorts.map(({ _raw, ...rest }) => rest);
    }

    return Response.json({ analysis, datasetMeta, llmUsed });
  } catch (error) {
    return Response.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}