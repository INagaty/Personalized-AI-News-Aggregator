const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ApiError = require("../utils/apiError");

// Helper function to handle summarization and sentiment analysis safely
const processTextWithAI = async (text) => {
  // Don't try to summarize if text is too short or null/undefined
  if (!text || text.length < 30) {
    console.log("Text too short for processing");
    return {
      summary: text,
      sentiment: "Neutral",
      confidence: 0.5,
    };
  }

  try {
    const response = await axios.post(
      "http://localhost:5000/api/summarize",
      { text },
      { timeout: 8000 } // 8 second timeout to prevent hanging
    );

    return {
      summary: response.data.summary,
      sentiment: response.data.sentiment,
      confidence: response.data.confidence,
    };
  } catch (err) {
    // Handle various error types
    if (err.code === "ECONNREFUSED") {
      console.error("Flask API server is not running or not accessible");
    } else if (err.response) {
      console.error(
        `AI Processing API error (${err.response.status}): ${
          err.response.data.error || err.message
        }`
      );
    } else if (err.request) {
      console.error(`No response received: ${err.message}`);
    } else {
      console.error(`AI processing failed: ${err.message}`);
    }

    // Fall back to original text with neutral sentiment
    return {
      summary: text,
      sentiment: "Neutral",
      confidence: 0.5,
    };
  }
};

// Get general news with AI processing
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

    // Check if we have articles
    if (!response.data.articles || response.data.articles.length === 0) {
      return res.status(200).json({
        status: "success",
        count: 0,
        data: [],
      });
    }

    // Process articles one by one
    const processedArticles = await Promise.all(
      response.data.articles.map(async (article) => {
        const originalText =
          article.description || article.content || article.title;

        const processed = await processTextWithAI(originalText);

        return {
          title: article.title,
          description: processed.summary,
          source: article.source.name,
          publishedAt: article.publishedAt,
          url: article.url,
          urlToImage: article.urlToImage,
          sentiment: processed.sentiment,
          sentimentConfidence: processed.confidence,
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

// Get personalized news with AI processing
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

      // Process articles for this category
      const processed = await Promise.all(
        response.data.articles.map(async (article) => {
          const originalText =
            article.description || article.content || article.title;

          const processedData = await processTextWithAI(originalText);

          return {
            title: article.title,
            description: processedData.summary,
            source: article.source.name,
            publishedAt: article.publishedAt,
            url: article.url,
            urlToImage: article.urlToImage,
            category: category,
            sentiment: processedData.sentiment,
            sentimentConfidence: processedData.confidence,
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
