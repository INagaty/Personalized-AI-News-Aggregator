const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ApiError = require("../utils/apiError");
const fs = require("fs");
const cacheFile = "./notified.json";
const { notifyUsers } = require("./notificationService");
const { io } = require("../index");

// Helper function to handle summarization separately
const summarizeText = async (text) => {
  try {
    console.log("Starting summarization..."); // Log before summarization
    const summaryResponse = await axios.post(
      "http://localhost:5000/api/summarize",
      { text },
      { timeout: 180000 }
    );

    console.log("Summarization complete:", summaryResponse.data.summary); // Log summary result
    return summaryResponse.data.summary;
  } catch (err) {
    console.error("Error during summarization:", err.message);
    return text; // Fallback if summarization fails
  }
};

// Helper function to get sentiment of a text
const getSentiment = async (text) => {
  try {
    console.log("Starting sentiment analysis with text:", text);

    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new Error("Invalid or empty text provided for sentiment analysis");
    }

    const sentimentResponse = await axios.post(
      "http://localhost:5000/api/sentiment",
      { text },
      {
        timeout: 60000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Sentiment analysis complete:", sentimentResponse.data);

    // Assuming that the sentiment response includes probabilities for 'negative', 'neutral', and 'positive'
    return {
      negative: sentimentResponse.data.negative || 0.0,
      neutral: sentimentResponse.data.neutral || 0.0,
      positive: sentimentResponse.data.positive || 0.0,
    };
  } catch (err) {
    console.error("Error during sentiment analysis:", err.message);

    if (err.response) {
      console.error("Error Response:", err.response.data);
      console.error("Error Status:", err.response.status);
    }

    return { negative: 0.0, neutral: 1.0, positive: 0.0 }; // Default to neutral if there’s an error
  }
};

// Get general news with summarization (but not sentiment)
exports.getGeneralNews = asyncHandler(async (req, res, next) => {
  const { query } = req.query;

  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us",
        q: query || "",
        pageSize: 10,
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    if (!response.data.articles || response.data.articles.length === 0) {
      return res.status(200).json({
        status: "success",
        count: 0,
        data: [],
      });
    }

    // Process articles to only summarize
    const processedArticles = await Promise.all(
      response.data.articles.map(async (article) => {
        const originalText =
          article.description || article.content || article.title;

        // Summarize the text
        const summary = await summarizeText(originalText);

        return {
          title: article.title,
          description: summary,
          source: article.source.name,
          publishedAt: article.publishedAt,
          url: article.url,
          urlToImage: article.urlToImage,
          sentiment: "Not calculated", // Placeholder until sentiment is fetched separately
          sentimentConfidence: 0,
        };
      })
    );

    res.status(200).json({
      status: "success",
      count: processedArticles.length,
      data: processedArticles,
    });
  } catch (error) {
    console.error("Error in getGeneralNews:", error.message);
    next(error);
  }
});

// Endpoint to get sentiment for a specific article's summary
// Endpoint to get sentiment for a specific article's summary
exports.getSentimentForSummary = asyncHandler(async (req, res, next) => {
  const { summary } = req.body;

  try {
    const sentimentResult = await getSentiment(summary);

    res.status(200).json({
      status: "success",
      negative: sentimentResult.negative,
      neutral: sentimentResult.neutral,
      positive: sentimentResult.positive,
    });
  } catch (error) {
    console.error("Error in getSentimentForSummary:", error.message);
    next(error);
  }
});

// Get personalized news with summarization (but not sentiment)
exports.getPersonalizedNews = asyncHandler(async (req, res, next) => {
  const user = req.user;
  const preferences = user?.preferences || ["general"];
  const allArticles = [];

  for (const category of preferences) {
    try {
      const response = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          category,
          country: "us",
          pageSize: 5,
          apiKey: process.env.NEWS_API_KEY,
        },
      });

      const processed = await Promise.all(
        response.data.articles.map(async (article) => {
          const originalText =
            article.description || article.content || article.title;

          // First, summarize the text
          const summary = await summarizeText(originalText);

          return {
            title: article.title,
            description: summary,
            source: article.source.name,
            publishedAt: article.publishedAt,
            url: article.url,
            urlToImage: article.urlToImage,
            category: category,
            sentiment: "Not calculated", // Placeholder for sentiment
            sentimentConfidence: 0,
          };
        })
      );

      allArticles.push(...processed);
    } catch (error) {
      console.error(`Error fetching category ${category}:`, error.message);
    }
  }

  res.status(200).json({
    status: "success",
    count: allArticles.length,
    data: allArticles,
  });
});
