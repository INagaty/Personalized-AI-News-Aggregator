const asyncHandler = require("express-async-handler");
const axios = require("axios");
const ApiError = require("../utils/apiError");
// const { generateSummary } = require("../utils/summarizer");
// const { analyzeSentiment } = require("../utils/sentiment");

// controllers/newsController.js
exports.getGeneralNews = asyncHandler(async (req, res, next) => {
  const { query } = req.query; // Optional search query

  try {
    const response = await axios.get("https://newsapi.org/v2/top-headlines", {
      params: {
        country: "us", // or any region you prefer
        q: query || "",
        pageSize: 10,
        apiKey: process.env.NEWS_API_KEY,
      },
    });
    console.log(process.env.NEWS_API_KEY);

    const articles = response.data.articles.map((article) => ({
      title: article.title,
      description: article.description,
      source: article.source.name,
      publishedAt: article.publishedAt,
      url: article.url,
      urlToImage: article.urlToImage,
    }));

    res.status(200).json({
      status: "success",
      count: articles.length,
      data: articles,
    });
  } catch (error) {
    next(error);
  }
});

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

      const articles = response.data.articles.map((article) => ({
        title: article.title,
        description: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url,
        urlToImage: article.urlToImage,
      }));

      allArticles.push(...articles);
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
