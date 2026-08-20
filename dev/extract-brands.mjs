import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as simpleIcons from "simple-icons";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ id: string, name: string, aliases: string[], category: string, slug: string, fallback?: string, hex?: string }[]} */
const META = [
  { id: "netflix", name: "Netflix", aliases: ["nflx", "netflix premium", "netflix standard"], category: "streaming", slug: "netflix" },
  { id: "spotify", name: "Spotify", aliases: ["spotify premium", "spoty"], category: "streaming", slug: "spotify" },
  { id: "youtube", name: "YouTube", aliases: ["youtube premium", "youtube go", "yt premium"], category: "streaming", slug: "youtube" },
  { id: "youtubemusic", name: "YouTube Music", aliases: ["yt music"], category: "streaming", slug: "youtubemusic" },
  { id: "appletv", name: "Apple TV+", aliases: ["apple tv", "apple tv plus", "appletv+"], category: "streaming", slug: "appletv" },
  { id: "applemusic", name: "Apple Music", aliases: ["itunes"], category: "streaming", slug: "applemusic" },
  { id: "hbomax", name: "Max", aliases: ["hbo", "hbo max", "max hbo"], category: "streaming", slug: "hbomax" },
  { id: "twitch", name: "Twitch", aliases: ["twitch turbo"], category: "streaming", slug: "twitch" },
  { id: "crunchyroll", name: "Crunchyroll", aliases: [], category: "streaming", slug: "crunchyroll" },
  { id: "paramountplus", name: "Paramount+", aliases: ["paramount plus", "paramount"], category: "streaming", slug: "paramountplus" },
  { id: "soundcloud", name: "SoundCloud", aliases: ["sound cloud"], category: "streaming", slug: "soundcloud" },
  { id: "audible", name: "Audible", aliases: [], category: "streaming", slug: "audible" },
  { id: "dazn", name: "DAZN", aliases: [], category: "streaming", slug: "dazn" },
  { id: "viaplay", name: "Viaplay", aliases: [], category: "streaming", slug: "viaplay" },
  { id: "showtime", name: "Showtime", aliases: ["paramount showtime"], category: "streaming", slug: "showtime" },
  { id: "disneyplus", name: "Disney+", aliases: ["disney plus", "disney", "disneyplus"], category: "streaming", slug: "disneyplus", hex: "113CCF" },
  { id: "primevideo", name: "Prime Video", aliases: ["amazon prime", "prime", "amazon prime video", "amazon video"], category: "streaming", slug: "primevideo", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/amazonprime.svg", hex: "00A8E1" },
  { id: "hulu", name: "Hulu", aliases: [], category: "streaming", slug: "hulu", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/hulu.svg", hex: "1CE783" },
  { id: "adobe", name: "Adobe", aliases: ["creative cloud", "adobe cc", "photoshop", "adobe photoshop", "illustrator"], category: "software", slug: "adobe", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/adobe.svg", hex: "FF0000" },
  { id: "microsoft365", name: "Microsoft 365", aliases: ["office 365", "microsoft office", "ms365", "m365", "office365", "microsoft"], category: "software", slug: "microsoft", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/microsoft.svg", hex: "5E5E5E" },
  { id: "icloud", name: "iCloud", aliases: ["icloud+", "icloud plus", "apple icloud"], category: "software", slug: "icloud" },
  { id: "googledrive", name: "Google One", aliases: ["google drive", "google storage", "gdrive", "google one"], category: "software", slug: "googledrive" },
  { id: "notion", name: "Notion", aliases: [], category: "software", slug: "notion" },
  { id: "figma", name: "Figma", aliases: [], category: "software", slug: "figma" },
  { id: "chatgpt", name: "ChatGPT", aliases: ["openai", "chat gpt", "gpt plus", "chatgpt plus"], category: "software", slug: "openai", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@11.15.0/icons/openai.svg", hex: "412991" },
  { id: "anthropic", name: "Claude", aliases: ["anthropic", "claude pro", "claude ai"], category: "software", slug: "anthropic" },
  { id: "perplexity", name: "Perplexity", aliases: ["perplexity ai"], category: "software", slug: "perplexity" },
  { id: "github", name: "GitHub", aliases: ["github pro", "gh pro"], category: "software", slug: "github" },
  { id: "githubcopilot", name: "GitHub Copilot", aliases: ["copilot", "gh copilot"], category: "software", slug: "githubcopilot" },
  { id: "gitlab", name: "GitLab", aliases: [], category: "software", slug: "gitlab" },
  { id: "dropbox", name: "Dropbox", aliases: [], category: "software", slug: "dropbox" },
  { id: "1password", name: "1Password", aliases: ["onepassword", "1 password"], category: "software", slug: "1password" },
  { id: "bitwarden", name: "Bitwarden", aliases: [], category: "software", slug: "bitwarden" },
  { id: "lastpass", name: "LastPass", aliases: ["last pass"], category: "software", slug: "lastpass" },
  { id: "dashlane", name: "Dashlane", aliases: [], category: "software", slug: "dashlane" },
  { id: "slack", name: "Slack", aliases: [], category: "software", slug: "slack", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/slack.svg", hex: "4A154B" },
  { id: "zoom", name: "Zoom", aliases: ["zoom pro"], category: "software", slug: "zoom" },
  { id: "canva", name: "Canva", aliases: ["canva pro"], category: "software", slug: "canva", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/canva.svg", hex: "00C4CC" },
  { id: "grammarly", name: "Grammarly", aliases: [], category: "software", slug: "grammarly" },
  { id: "jetbrains", name: "JetBrains", aliases: ["intellij", "webstorm", "pycharm"], category: "software", slug: "jetbrains" },
  { id: "evernote", name: "Evernote", aliases: [], category: "software", slug: "evernote" },
  { id: "todoist", name: "Todoist", aliases: [], category: "software", slug: "todoist" },
  { id: "obsidian", name: "Obsidian", aliases: [], category: "software", slug: "obsidian" },
  { id: "setapp", name: "Setapp", aliases: [], category: "software", slug: "setapp" },
  { id: "nordvpn", name: "NordVPN", aliases: ["nord vpn", "nord"], category: "software", slug: "nordvpn" },
  { id: "expressvpn", name: "ExpressVPN", aliases: ["express vpn"], category: "software", slug: "expressvpn" },
  { id: "surfshark", name: "Surfshark", aliases: [], category: "software", slug: "surfshark" },
  { id: "mullvad", name: "Mullvad", aliases: ["mullvad vpn"], category: "software", slug: "mullvad" },
  { id: "discord", name: "Discord", aliases: ["discord nitro"], category: "software", slug: "discord" },
  { id: "patreon", name: "Patreon", aliases: [], category: "other", slug: "patreon" },
  { id: "linkedin", name: "LinkedIn", aliases: ["linkedin premium"], category: "other", slug: "linkedin", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/linkedin.svg", hex: "0A66C2" },
  { id: "duolingo", name: "Duolingo", aliases: ["duolingo plus", "duolingo super"], category: "other", slug: "duolingo" },
  { id: "coursera", name: "Coursera", aliases: [], category: "other", slug: "coursera" },
  { id: "skillshare", name: "Skillshare", aliases: ["skill share"], category: "other", slug: "skillshare" },
  { id: "headspace", name: "Headspace", aliases: [], category: "other", slug: "headspace" },
  { id: "protonmail", name: "Proton", aliases: ["proton mail", "protonmail", "proton vpn"], category: "software", slug: "protonmail" },
  { id: "hetzner", name: "Hetzner", aliases: ["hetzner cloud", "hetzner vps"], category: "hosting", slug: "hetzner" },
  { id: "digitalocean", name: "DigitalOcean", aliases: ["digital ocean", "do droplets"], category: "hosting", slug: "digitalocean" },
  { id: "vercel", name: "Vercel", aliases: ["vercel pro"], category: "hosting", slug: "vercel" },
  { id: "cloudflare", name: "Cloudflare", aliases: ["cf"], category: "hosting", slug: "cloudflare" },
  { id: "namecheap", name: "Namecheap", aliases: ["name cheap"], category: "hosting", slug: "namecheap" },
  { id: "googlecloud", name: "Google Cloud", aliases: ["gcp", "google cloud platform"], category: "hosting", slug: "googlecloud" },
  { id: "netlify", name: "Netlify", aliases: [], category: "hosting", slug: "netlify" },
  { id: "ovh", name: "OVH", aliases: ["ovhcloud", "ovh cloud"], category: "hosting", slug: "ovh" },
  { id: "hostinger", name: "Hostinger", aliases: [], category: "hosting", slug: "hostinger" },
  { id: "godaddy", name: "GoDaddy", aliases: ["go daddy"], category: "hosting", slug: "godaddy" },
  { id: "ionos", name: "IONOS", aliases: ["1and1", "1&1"], category: "hosting", slug: "ionos" },
  { id: "aws", name: "AWS", aliases: ["amazon web services", "amazon aws", "amazonwebservices"], category: "hosting", slug: "amazonaws", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/amazonaws.svg", hex: "232F3E" },
  { id: "heroku", name: "Heroku", aliases: [], category: "hosting", slug: "heroku", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/heroku.svg", hex: "430098" },
  { id: "strava", name: "Strava", aliases: [], category: "fitness", slug: "strava" },
  { id: "peloton", name: "Peloton", aliases: [], category: "fitness", slug: "peloton" },
  { id: "nike", name: "Nike Training", aliases: ["nike", "ntc", "nike run club", "nrc"], category: "fitness", slug: "nike" },
  { id: "applearcade", name: "Apple Arcade", aliases: [], category: "other", slug: "applearcade" },
  { id: "newyorktimes", name: "New York Times", aliases: ["nyt", "ny times", "nytimes"], category: "news", slug: "newyorktimes" },
  { id: "theguardian", name: "The Guardian", aliases: ["guardian"], category: "news", slug: "theguardian" },
  { id: "washingtonpost", name: "Washington Post", aliases: ["wapo", "wa po"], category: "news", slug: "thewashingtonpost" },
  { id: "medium", name: "Medium", aliases: ["medium membership"], category: "news", slug: "medium" },
  { id: "substack", name: "Substack", aliases: [], category: "news", slug: "substack" },
  { id: "uber", name: "Uber One", aliases: ["uber", "uberone"], category: "other", slug: "uber" },
  { id: "ubereats", name: "Uber Eats", aliases: ["uber eats"], category: "other", slug: "ubereats" },
  { id: "deliveroo", name: "Deliveroo", aliases: [], category: "other", slug: "deliveroo" },
  { id: "glovo", name: "Glovo", aliases: [], category: "other", slug: "glovo" },
  { id: "playstation", name: "PlayStation Plus", aliases: ["ps plus", "psn", "playstation", "ps+"], category: "other", slug: "playstation" },
  { id: "xbox", name: "Xbox Game Pass", aliases: ["game pass", "xbox", "xgpu"], category: "other", slug: "xbox", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/xbox.svg", hex: "107C10" },
  { id: "nintendo", name: "Nintendo Switch Online", aliases: ["nso", "nintendo", "switch online"], category: "other", slug: "nintendo", fallback: "https://cdn.jsdelivr.net/npm/simple-icons@9.19.0/icons/nintendo.svg", hex: "E60012" },
  { id: "orange", name: "Orange", aliases: [], category: "utilities", slug: "orange" },
  { id: "vodafone", name: "Vodafone", aliases: [], category: "utilities", slug: "vodafone" },
  { id: "telekom", name: "Telekom", aliases: ["deutsche telekom", "t-mobile"], category: "utilities", slug: "deutschetelekom" },
];

const bySlug = Object.fromEntries(
  Object.values(simpleIcons)
    .filter((icon) => icon && typeof icon === "object" && "slug" in icon)
    .map((icon) => [icon.slug, icon]),
);

function pathsFromSvg(svg) {
  const paths = [...svg.matchAll(/\bd="([^"]+)"/g)].map((match) => match[1]);
  if (paths.length === 0) throw new Error("no path in svg");
  return paths;
}

async function loadIcon(meta) {
  const current = bySlug[meta.slug];
  if (current?.path) {
    return { hex: current.hex, paths: [current.path] };
  }
  if (meta.fallback) {
    const response = await fetch(meta.fallback);
    if (!response.ok) throw new Error(`fallback ${meta.id} ${response.status} ${meta.fallback}`);
    const svg = await response.text();
    return { hex: meta.hex ?? "221E22", paths: pathsFromSvg(svg) };
  }
  if (meta.hex) {
    return { hex: meta.hex, paths: [] };
  }
  throw new Error(`missing icon ${meta.id} (${meta.slug})`);
}

const brands = [];
const failed = [];
for (const meta of META) {
  try {
    const icon = await loadIcon(meta);
    brands.push({
      id: meta.id,
      name: meta.name,
      aliases: meta.aliases,
      category: meta.category,
      hex: icon.hex.replace(/^#/, ""),
      paths: icon.paths,
    });
  } catch (error) {
    failed.push(`${meta.id}: ${error.message}`);
  }
}

if (failed.length) {
  console.error(failed.join("\n"));
  process.exit(1);
}

const file = `import type { Category } from "~/lib/domain/types";

export type Brand = {
  id: string;
  name: string;
  aliases: readonly string[];
  category: Category;
  hex: string;
  paths: readonly string[];
};

export const BRANDS: readonly Brand[] = ${JSON.stringify(brands, null, 2)};
`;

const out = join(root, "src/lib/domain/brand-catalog.ts");
writeFileSync(out, file);
console.log(`wrote ${brands.length} brands to src/lib/domain/brand-catalog.ts`);
