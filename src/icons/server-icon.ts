// Factory patterns baby
import { type Client } from "discord.js";
import { config } from "dotenv";
import { Octokit } from "@octokit/rest";
import { Buffer } from "node:buffer";
import axios from "axios";
import { startOfTomorrow } from "date-fns";

export default function serverIcon(client: Client<boolean>): void {
  config({ path: ".env" });
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
    timeZone: "Australia/Sydney",
  });

  const recentIcons: string[] = [];

  const iconWeight = (icon: string): number => {
    if (recentIcons.includes(icon)) {
      return recentIcons.indexOf(icon) + 1;
    }
    return recentIcons.length;
  };

  async function setNewIcon(): Promise<void> {
    const newIcon = await getNewIcon();
    const cssa = await client.guilds.fetch("476382037620555776");
    await cssa.setIcon(newIcon);
  }

  async function getNewIcon(): Promise<Buffer> {
    // Fetch the list of icons
    const repoContents = await octokit.rest.repos.getContent({
      owner: "anucssa",
      repo: "cssa-pride-icons",
      path: "icons",
    });
    if (repoContents.status !== 200) {
      throw new Error("Could not get icons");
    } else if (!Array.isArray(repoContents.data)) {
      throw new TypeError("GitHub API returned unexpected data");
    }

    // Get a new icon randomly, weighted recent icons less
    const newIcon = weightedChoice(
      repoContents.data,
      repoContents.data.map((icon) => Math.max(1, iconWeight(icon.name))),
    );

    // Download the icon
    const downloadUrl = newIcon.download_url;
    if (downloadUrl === null || downloadUrl === undefined) {
      throw new Error("Could not get icon download url");
    }
    const image = await axios.get(downloadUrl, { responseType: "arraybuffer" });
    if (image.status !== 200) {
      throw new Error("Could not download icon");
    }
    const buffer = Buffer.from(image.data, "binary");
    recentIcons.unshift(newIcon.name);
    if (recentIcons.length > 15) {
      recentIcons.pop();
    }
    return buffer;
  }

  function timeout(): void {
    void setNewIcon();
    setTimeout(() => {
      const nextDay = startOfTomorrow();
      const millisecondsUntilNextDay = nextDay.getTime() - Date.now();
      setTimeout(() => {
        timeout();
      }, millisecondsUntilNextDay);
    }, 60_000);
  }

  timeout();
}

/**
 * Chooses a random item from a list, with (optional) weights. If weights are provided,
 * they must have the same length as the items array and cannot sum to 0. If no weights
 * are provided, all items are assumed to have an equal chance of being chosen. If the
 * random selection process fails due to a precision error, the last item in the list
 * is returned as a fallback.
 * @template T The type of items in the array.
 * @param {T[]} items The list of items to choose from.
 * @param {number[]} [initialWeights] The weights of each item. Defaults to equal weights if omitted.
 * @returns {T} The chosen item.
 * @throws {Error} If `items` and `initialWeights` have different lengths or if the total weight is not greater than 0.
 */
function weightedChoice<T>(items: T[], initialWeights?: number[]): T {
  // Default to equal weights
  let weights = initialWeights ?? items.map(() => 1);
  if (items.length !== weights.length) {
    throw new Error("Items and weights must be the same length");
  }
  // Normalise weights
  const totalWeight = weights.reduce((a, b) => a + b);
  if (totalWeight <= 0) throw new Error("Total weight must be greater than 0");
  weights = weights.map((weight) => weight / totalWeight);
  // Get a random number
  const roll = Math.random();
  // Get the item that corresponds to that number
  let cumulativeWeight = 0;
  for (const [index, item] of items.entries()) {
    cumulativeWeight += weights[index];
    if (roll <= cumulativeWeight) {
      return item;
    }
  }
  return items.at(-1) ?? items[0];
}
