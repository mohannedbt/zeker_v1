const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;


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


async function getCategoryByPrayerTimes() {

   
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "أذكار الصباح";
    if (hour >= 17 && hour < 21) return "أذكار المساء";
    if (hour >= 22 || hour < 5) return "أذكار النوم";

    // Final fallback
    return "دعاء";
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
