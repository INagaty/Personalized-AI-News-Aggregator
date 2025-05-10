const axios = require("axios");
const fs = require("fs");

const cacheFile = "./notified.json";
const breakingKeywords = [/breaking/i, /urgent/i, /alert/i, /exclusive/i]; // Updated with regex

let notifiedArticles = new Set();
let connectedSockets = new Set(); // To track active users
let notificationQueue = []; // To queue notifications if no users are connected

if (fs.existsSync(cacheFile)) {
  const data = JSON.parse(fs.readFileSync(cacheFile));
  notifiedArticles = new Set(data);
} else {
  fs.writeFileSync(cacheFile, JSON.stringify([]));
}

function isBreakingNews(article) {
  const titleMatches = breakingKeywords.some((regex) =>
    regex.test(article.title)
  );
  const descriptionMatches = breakingKeywords.some((regex) =>
    regex.test(article.description)
  );
  //   const currentTime = new Date();
  //   const publishTime = new Date(article.publishedAt);
  //   const timeDiff = (currentTime - publishTime) / 60000; // Difference in minutes
  // console.log(
  //   `Checking "${article.title}" for breaking news in title: ${titleMatches}`
  // );
  // console.log(
  //   `Checking "${article.description}" for breaking news in description: ${descriptionMatches}`
  // );
  // //   console.log(
  // //     `Checking "${article.publishedAt}" time difference: ${timeDiff < 1440}`
  //   );
  return titleMatches || descriptionMatches;
}

function alreadyNotified(url) {
  return notifiedArticles.has(url);
}

function saveAsNotified(url) {
  notifiedArticles.add(url);
  fs.writeFileSync(cacheFile, JSON.stringify([...notifiedArticles]));
}

function notifyUsers(io, article) {
  if (article && article.title && article.url) {
    if (connectedSockets.size > 0) {
      console.log("🔔 BREAKING NEWS:", article.title);
      io.emit("breaking-news", {
        title: article.title,
        url: article.url,
      });
    } else {
      console.log("No active users. Notification not sent.");
      queueNotification(article);
    }
  } else {
    console.error("Received invalid article:", { article });
  }
}

function queueNotification(article) {
  notificationQueue.push(article);
}

function sendQueuedNotifications(io) {
  while (notificationQueue.length > 0) {
    const article = notificationQueue.shift();
    notifyUsers(io, article);
  }
}

function setupSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);
    connectedSockets.add(socket.id);

    sendQueuedNotifications(io); // send any queued articles now

    socket.on("disconnect", () => {
      connectedSockets.delete(socket.id);
      console.log(`User disconnected: ${socket.id}`);
    });
  });
}

async function checkForBreakingNews(io) {
  try {
    const res = await axios.get(
      `https://newsapi.org/v2/everything?q=breaking&apiKey=${process.env.NEWS_API_KEY}`
    );
    const articles = res.data.articles;

    // Log the API response to see if we're getting data
    console.log("Received articles:", articles);

    if (!articles || articles.length === 0) {
      console.error("No articles found in the response.");
      return;
    }

    for (const article of articles) {
      if (
        article &&
        article.title &&
        isBreakingNews(article) &&
        !alreadyNotified(article.url)
      ) {
        // if (article.title && article.description) {
        notifyUsers(io, article);
        console.log("Sending Breaking News:", article.title);
        saveAsNotified(article.url);
      }
    }
  } catch (err) {
    console.error("Error fetching news:", err);
  }
}

module.exports = {
  checkForBreakingNews,
  setupSocketHandlers,
};
