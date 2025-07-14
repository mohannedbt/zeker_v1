const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const app = express();
const PORT = 3000;

app.use(express.static("public"));

const raw = JSON.parse(fs.readFileSync("./azkar.json", "utf8"));
const keys = ["category", "zekr", "description", "count", "reference", "search"];
const azkar = raw.rows.map(row => {
  const obj = {};
  keys.forEach((key, i) => {
    obj[key] = row[i];
  });
  return obj;
});

// Tunisia coordinates
const latitude = 36.8;
const longitude = 10.18;

function getRandomZekrByCategory(category) {
  const filtered = azkar.filter(z => z.category === category);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function parseTimeToDate(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(hour, minute, 0, 0);
  return now;
}

function isWithinMinutes(current, prayerTime, minutes = 15) {
  const diff = Math.abs(current - prayerTime) / 1000 / 60; // minutes difference
  return diff <= minutes;
}
async function getCategoryByPrayerTimes() {
  try {
    const now = new Date();

    const response = await axios.get(
      `http://api.aladhan.com/v1/timings/${Math.floor(now.getTime() / 1000)}?latitude=${latitude}&longitude=${longitude}&method=2`
    );

    const timings = response.data.data.timings;

    const fajr = parseTimeToDate(timings.Fajr);
    const dhuhr = parseTimeToDate(timings.Dhuhr);
    const asr = parseTimeToDate(timings.Asr);
    const maghrib = parseTimeToDate(timings.Maghrib);
    const isha = parseTimeToDate(timings.Isha);

    // Near Fajr (morning adhkar)
    if (isWithinMinutes(now, fajr, 30) || (now > fajr && now < dhuhr)) {
      return "أذكار الصباح";
    }

    // Evening (asr to maghrib or close to maghrib/isha)
    if (
      (now > asr && now < maghrib) ||
      isWithinMinutes(now, maghrib, 30) ||
      isWithinMinutes(now, isha, 30)
    ) {
      return "أذكار المساء";
    }

    // Night
    const hour = now.getHours();
    if (now > isha || hour >= 22 || hour < 5) {
      return "أذكار النوم";
    }

    // Fallback: use keyword "دعاء" (to be handled in the /api/zekr route)
    return "دعاء";
  } catch (error) {
    console.error("⚠️ Error fetching prayer times:", error.message);

    // Fallback using static time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "أذكار الصباح";
    if (hour >= 17 && hour < 21) return "أذكار المساء";
    if (hour >= 22 || hour < 5) return "أذكار النوم";

    // Final fallback
    return "دعاء";
  }
}

app.get("/api/zekr", async (req, res) => {
  const category = await getCategoryByPrayerTimes();
  let zekr;

  if (category === "دعاء") {
    const duaAzkar = azkar.filter(z => z.category.includes("دعاء"));
    if (duaAzkar.length > 0) {
      zekr = duaAzkar[Math.floor(Math.random() * duaAzkar.length)];
    }
  } else {
    zekr = getRandomZekrByCategory(category);
  }

  // Fallback to any zekr
  if (!zekr) {
    zekr = azkar[Math.floor(Math.random() * azkar.length)];
  }

  res.json(zekr);
});



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`📿 Server running at http://localhost:${PORT}`));
