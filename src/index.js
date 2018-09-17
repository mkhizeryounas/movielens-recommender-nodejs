// https://www.kaggle.com/rounakbanik/the-movies-dataset/data
// Exercise: Content-based - Include credits data with crew and cast too
// Exercise: Content-based - Make features weighted based on popularity or actors
// Exercise: Collaborative Filtering - Model-based CF with SVD

import fs from "fs";
import csv from "fast-csv";

const apiKey = "ddf2b5b8";
const imdbApi = require("imdb-api");
const imdb = new imdbApi.Client({ apiKey: apiKey });

import prepareRatings from "./preparation/ratings";
import prepareMovies from "./preparation/movies";
import predictWithLinearRegression from "./strategies/linearRegression";
import predictWithContentBased from "./strategies/contentBased";
import {
  predictWithCfUserBased,
  predictWithCfItemBased
} from "./strategies/collaborativeFiltering";
import { getMovieIndexByTitle } from "./strategies/common";

let MOVIES_META_DATA = {};
let MOVIES_KEYWORDS = {};
let RATINGS = [];

let ME_USER_ID = 0;
if (process.argv[2] != "--demo") {
  console.log("----- SERVER RAN WITH ML ----- ");
  let moviesMetaDataPromise = new Promise(resolve =>
    fs
      .createReadStream("./src/data/movies_metadata.csv")
      .pipe(csv({ headers: true }))
      .on("data", fromMetaDataFile)
      .on("end", () => resolve(MOVIES_META_DATA))
  );

  let moviesKeywordsPromise = new Promise(resolve =>
    fs
      .createReadStream("./src/data/keywords.csv")
      .pipe(csv({ headers: true }))
      .on("data", fromKeywordsFile)
      .on("end", () => resolve(MOVIES_KEYWORDS))
  );

  let ratingsPromise = new Promise(resolve =>
    fs
      .createReadStream("./src/data/ratings_small.csv")
      .pipe(csv({ headers: true }))
      .on("data", fromRatingsFile)
      .on("end", () => resolve(RATINGS))
  );

  function fromMetaDataFile(row) {
    MOVIES_META_DATA[row.id] = {
      id: row.id,
      adult: row.adult,
      budget: row.budget,
      genres: softEval(row.genres, []),
      homepage: row.homepage,
      language: row.original_language,
      title: row.original_title,
      overview: row.overview,
      popularity: row.popularity,
      studio: softEval(row.production_companies, []),
      release: row.release_date,
      revenue: row.revenue,
      runtime: row.runtime,
      voteAverage: row.vote_average,
      voteCount: row.vote_count
    };
  }

  function fromKeywordsFile(row) {
    MOVIES_KEYWORDS[row.id] = {
      keywords: softEval(row.keywords, [])
    };
  }

  function fromRatingsFile(row) {
    RATINGS.push(row);
  }

  console.log("Unloading data from files ... \n");

  Promise.all([
    moviesMetaDataPromise,
    moviesKeywordsPromise,
    ratingsPromise
  ]).then(init);
} else {
  console.log("----- SERVER RAN WITH DEMO MODE ----- ");
}

const express = require("express");
var cors = require("cors");
const app = express();
app.use(cors());

function init([moviesMetaData, moviesKeywords, ratings]) {
  /* ------------ */
  //  Preparation //
  /* -------------*/
  const { MOVIES_BY_ID, MOVIES_IN_LIST, X } = prepareMovies(
    moviesMetaData,
    moviesKeywords
  );
  // console.log(MOVIES_IN_LIST);
  // fs.writeFile("movies.json", JSON.stringify(MOVIES_IN_LIST), function(err) {
  //   if (err) {
  //     return console.log("ERR", err);
  //   }
  //   console.log("The file was saved!");
  // });
  let ME_USER_RATINGS = [
    addUserRating(
      ME_USER_ID,
      "Terminator 3: Rise of the Machines",
      "5.0",
      MOVIES_IN_LIST
    ),
    addUserRating(ME_USER_ID, "Jarhead", "4.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "The Avengers", "4.0", MOVIES_IN_LIST),
    addUserRating(
      ME_USER_ID,
      "Back to the Future Part II",
      "3.0",
      MOVIES_IN_LIST
    ),
    addUserRating(ME_USER_ID, "Jurassic Park", "4.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "Reservoir Dogs", "3.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "Men in Black II", "3.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "Bad Boys II", "5.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "Sissi", "1.0", MOVIES_IN_LIST),
    addUserRating(ME_USER_ID, "Titanic", "1.0", MOVIES_IN_LIST)
  ];

  const { ratingsGroupedByUser, ratingsGroupedByMovie } = prepareRatings([
    ...ME_USER_RATINGS,
    ...ratings
  ]);

  /* ----------------------------- */
  //  Linear Regression Prediction //
  //        Gradient Descent       //
  /* ----------------------------- */

  // console.log("\n");
  // console.log("(A) Linear Regression Prediction ... \n");

  // console.log("(1) Training \n");
  // const meUserRatings = ratingsGroupedByUser[ME_USER_ID];
  // const linearRegressionBasedRecommendation = predictWithLinearRegression(
  //   X,
  //   MOVIES_IN_LIST,
  //   meUserRatings
  // );

  // console.log("(2) Prediction \n");

  /* ------------------------- */
  //  Content-Based Prediction //
  //  Cosine Similarity Matrix //
  /* ------------------------- */

  // console.log("\n");
  // console.log("(B) Content-Based Prediction ... \n");

  // console.log("(1) Computing Cosine Similarity \n");
  // const title = "Batman Begins";
  // const contentBasedRecommendation = predictWithContentBased(
  //   X,
  //   MOVIES_IN_LIST,
  //   title
  // );
  // console.log(MOVIES_IN_LIST);

  // console.log(`(2) Prediction based on "${title}" \n`);
  // console.log(sliceAndDice(contentBasedRecommendation, MOVIES_BY_ID, 10, true));

  /* ----------------------------------- */
  //  Collaborative-Filtering Prediction //
  //             User-Based              //
  /* ----------------------------------- */

  // console.log("\n");
  // console.log("(C) Collaborative-Filtering (User-Based) Prediction ... \n");

  // console.log("(1) Computing User-Based Cosine Similarity \n");

  // const cfUserBasedRecommendation = predictWithCfUserBased(
  //   ratingsGroupedByUser,
  //   ratingsGroupedByMovie,
  //   ME_USER_ID
  // );

  // console.log("(2) Prediction \n");
  // console.log(sliceAndDice(cfUserBasedRecommendation, MOVIES_BY_ID, 10, true));

  /* ----------------------------------- */
  //  Collaborative-Filtering Prediction //
  //             Item-Based              //
  /* ----------------------------------- */

  // console.log("\n");
  // console.log("(C) Collaborative-Filtering (Item-Based) Prediction ... \n");

  // console.log("(1) Computing Item-Based Cosine Similarity \n");

  // const cfItemBasedRecommendation = predictWithCfItemBased(
  //   ratingsGroupedByUser,
  //   ratingsGroupedByMovie,
  //   ME_USER_ID
  // );

  // console.log("(2) Prediction \n");
  // console.log(sliceAndDice(cfItemBasedRecommendation, MOVIES_BY_ID, 10, true));

  // console.log("\n");
  // console.log("End ...");

  // MAIN ROUTES
  console.log("(2) Computing User-Based Cosine Similarity \n");
  const cfUserBasedRecommendation = predictWithCfUserBased(
    ratingsGroupedByUser,
    ratingsGroupedByMovie,
    ME_USER_ID
  );

  console.log("(3) Computing Item-Based Cosine Similarity \n");
  const cfItemBasedRecommendation = predictWithCfItemBased(
    ratingsGroupedByUser,
    ratingsGroupedByMovie,
    ME_USER_ID
  );
  console.log("(#) Model Ready \n");
  app.get("/predict", async (req, res) => {
    try {
      let q = req.query.q;
      q = decodeURI(q);

      console.log("(1) Computing Cosine Similarity \n");
      const contentBasedRecommendation = predictWithContentBased(
        X,
        MOVIES_IN_LIST,
        q || "Batman Begins"
      );
      let resData = {
        search: !req.query.q
          ? []
          : sliceAndDice(contentBasedRecommendation, MOVIES_BY_ID, 10, true),
        people_liked: sliceAndDice(
          cfUserBasedRecommendation,
          MOVIES_BY_ID,
          10,
          true
        ),
        you_may_like: sliceAndDice(
          cfItemBasedRecommendation,
          MOVIES_BY_ID,
          10,
          true
        )
      };
      let toSend = Array();

      for (var i in resData.search) {
        try {
          let movie = await imdb.get({ name: resData.search[i].title });
          toSend.push(movie);
        } catch (err) {}
      }
      // res.json(toSend);
      res.json({
        status: true,
        data: toSend,
        message: `Prediction based on "${req.query.q}"`
      });
    } catch (err) {
      console.log("Err", err);
      res.json({
        status: false,
        error: err.details || "An error occoured"
      });
    }
  });
}
app.get("/demo", async (req, res) => {
  let resData = {
    search: [
      { title: "Hulk", score: 1.0000000000000004 },
      { title: "Final Voyage", score: 0.3951409204446796 },
      { title: "Shiner", score: 0.3934953842635981 },
      { title: "Parallels", score: 0.37363569569667926 },
      { title: "The Invisible Man Returns", score: 0.3718234671885087 },
      { title: "Zero", score: 0.35993894569704776 },
      { title: "Behemoth, the Sea Monster", score: 0.34946920014223065 },
      { title: "Captive Wild Woman", score: 0.34224960799957377 },
      { title: "Men Without Women", score: 0.3351876957726903 },
      {
        title: "Universal Soldier II: Brothers in Arms",
        score: 0.3161697098854824
      }
    ],
    people_liked: [
      { title: "The Thomas Crown Affair", score: 2.2550468624050857 },
      { title: "A River Runs Through It", score: 2.102978829666399 },
      { title: "The 39 Steps", score: 2.01025369403849 },
      { title: "The Million Dollar Hotel", score: 1.987185811927711 },
      { title: "Lili Marleen", score: 1.8645374972853241 },
      { title: "The Sixth Sense", score: 1.7956508724530549 },
      { title: "Les Vacances de Monsieur Hulot", score: 1.7806328275169867 },
      {
        title: "Terminator 3: Rise of the Machines",
        score: 1.7777777777777777
      },
      { title: "Bad Boys II", score: 1.7777777777777777 },
      { title: "Солярис", score: 1.775044251515773 }
    ],
    you_may_like: [
      { title: "Beetlejuice", score: 1.433565818081499 },
      { title: "Cousin, Cousine", score: 1.23566401103802 },
      { title: "Lili Marleen", score: 1.1818824319472296 },
      { title: "Bad Boys II", score: 1.12992125984252 },
      { title: "Der rote Elvis", score: 1.103525149677567 },
      { title: "The 39 Steps", score: 1.0193782842317336 },
      {
        title: "Confession of a Child of the Century",
        score: 1.013486996417949
      },
      { title: "Mere Brother Ki Dulhan", score: 0.977803732781572 },
      { title: "K-19: The Widowmaker", score: 0.9771470989578447 },
      { title: "The Great American Girl Robbery", score: 0.8072862274827155 }
    ]
  };
  let toSend = Array();
  try {
    for (var i in resData.search) {
      try {
        let movie = await imdb.get({ name: resData.search[i].title });
        toSend.push(movie);
      } catch (err) {}
    }
    res.json(toSend);
  } catch (err) {
    res.status(500).json(err);
  }
});
app.get("/search", async (req, res) => {
  try {
    let data = require("../movies.json");
    let toSend = data.map(e => e.title);
    res.json(toSend.splice(0, 2000));
  } catch (err) {
    res.status(500).json(err);
  }
});
app.get("/", (req, res) => res.send("MovieLens is running"));
app.listen(3000, () => console.log("MovieLens app listening on port 3000!"));
// Utility

export function addUserRating(userId, searchTitle, rating, MOVIES_IN_LIST) {
  const { id, title } = getMovieIndexByTitle(MOVIES_IN_LIST, searchTitle);

  return {
    userId,
    rating,
    movieId: id,
    title
  };
}

export function sliceAndDice(recommendations, MOVIES_BY_ID, count, onlyTitle) {
  recommendations = recommendations.filter(
    recommendation => MOVIES_BY_ID[recommendation.movieId]
  );

  recommendations = onlyTitle
    ? recommendations.map(mr => ({
        title: MOVIES_BY_ID[mr.movieId].title,
        score: mr.score
      }))
    : recommendations.map(mr => ({
        movie: MOVIES_BY_ID[mr.movieId],
        score: mr.score
      }));

  return recommendations.slice(0, count);
}

export function softEval(string, escape) {
  if (!string) {
    return escape;
  }

  try {
    return eval(string);
  } catch (e) {
    return escape;
  }
}
