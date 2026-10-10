import { DiscordSDK } from "@discord/embedded-app-sdk";
import "./style.css";

const timezoneSelect = document.querySelector("#timezone");
const previewTime = document.querySelector("#previewTime");
const previewZone = document.querySelector("#previewZone");
const showButton = document.querySelector("#showButton");
const status = document.querySelector("#status");

let discordSdk;
let authenticated = false;
let updateTimer = null;

const fallbackZones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney"
];

function availableZones() {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return fallbackZones;
  }
}

function browserZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function addOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  timezoneSelect.append(option);
}

function populateTimezones() {
  timezoneSelect.innerHTML = "";
  addOption("__current__", `Use my current timezone (${browserZone()})`);

  for (const zone of availableZones()) {
    addOption(zone, zone.replaceAll("_", " "));
  }

  const saved = localStorage.getItem("localTime.timezone");
  if (saved && [...timezoneSelect.options].some((o) => o.value === saved)) {
    timezoneSelect.value = saved;
  } else {
    timezoneSelect.value = "__current__";
  }

  const savedFormat = localStorage.getItem("localTime.clockFormat");
  if (savedFormat === "24") {
    document.querySelector('input[name="clock"][value="24"]').checked = true;
  }
}

function selectedZone() {
  return timezoneSelect.value === "__current__"
    ? browserZone()
    : timezoneSelect.value;
}

function uses24Hour() {
  return document.querySelector('input[name="clock"]:checked').value === "24";
}

function timeParts() {
  const zone = selectedZone();
  const now = new Date();

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    hour12: !uses24Hour(),
    timeZoneName: "short"
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "shortOffset"
  });

  const parts = timeFormatter.formatToParts(now);
  const zoneName = parts.find((p) => p.type === "timeZoneName")?.value || zone;
  const time = parts
    .filter((p) => p.type !== "timeZoneName")
    .map((p) => p.value)
    .join("")
    .trim();

  const offsetParts = offsetFormatter.formatToParts(now);
  const rawOffset =
    offsetParts.find((p) => p.type === "timeZoneName")?.value || "GMT";

  const utcOffset = rawOffset
    .replace(/^GMT$/, "UTC")
    .replace(/^GMT/, "UTC")
    .replace("-", "−");

  return {
    time,
    zoneName,
    date: dateFormatter.format(now),
    utcOffset
  };
}

function updatePreview() {
  const { time, zoneName, date, utcOffset } = timeParts();
  previewTime.textContent = `${time} ${zoneName}`;
  previewZone.textContent = `${date} · ${utcOffset}`;
}

async function publishPresence() {
  if (!authenticated) return;

  const { time, zoneName, date, utcOffset } = timeParts();

  await discordSdk.commands.setActivity({
    activity: {
      type: 0,
      details: `${time} ${zoneName}`,
      state: `${date} · ${utcOffset}`
    }
  });

  status.textContent = "Your local time is showing on your Discord profile.";
}

async function setupDiscord() {
  const configResponse = await fetch("/api/config");
  if (!configResponse.ok) {
    throw new Error("Could not load app configuration.");
  }

  const { clientId } = await configResponse.json();
  if (!clientId) {
    throw new Error("Missing Discord Application ID.");
  }

  discordSdk = new DiscordSDK(clientId);
  await discordSdk.ready();

  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "rpc.activities.write"]
  });

  const response = await fetch("/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  if (!response.ok) {
    throw new Error("Could not exchange Discord authorization code.");
  }

  const { access_token } = await response.json();

  const auth = await discordSdk.commands.authenticate({ access_token });
  if (!auth) {
    throw new Error("Discord authentication failed.");
  }

  authenticated = true;
  showButton.disabled = false;
  status.textContent = "Connected. Choose your timezone and publish it.";
}

timezoneSelect.addEventListener("change", () => {
  localStorage.setItem("localTime.timezone", timezoneSelect.value);
  updatePreview();
});

document.querySelectorAll('input[name="clock"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    localStorage.setItem("localTime.clockFormat", radio.value);
    updatePreview();
  });
});

showButton.addEventListener("click", async () => {
  showButton.disabled = true;
  status.textContent = "Updating Discord…";

  try {
    await publishPresence();
    clearInterval(updateTimer);

    updateTimer = setInterval(() => {
      publishPresence().catch(console.error);
    }, 60_000);
  } catch (error) {
    console.error(error);
    status.textContent = "Could not update your Discord presence.";
  } finally {
    showButton.disabled = false;
  }
});

populateTimezones();
updatePreview();
setInterval(updatePreview, 15_000);

setupDiscord().catch((error) => {
  console.error(error);
  status.textContent = "Could not connect to Discord. Check the app configuration.";
});
