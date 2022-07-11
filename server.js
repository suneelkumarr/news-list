const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nocache = require("nocache");
const compression = require("compression");
const helmet = require("helmet");
const news_list = require("./news_list.json");
const News = require("./news.model");

const app = express();
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());

const PORT = 3000;

mongoose
  .connect(
    "mongodb+srv://16eiacs080:16eiacs080@cluster0.1wbxw.mongodb.net/news?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("Database connected"))
  .catch((error) => {
    if (error) console.log("Failed to connect DB");
  });

function removeDuplicateObjectFromArray(array, key) {
  let check = {};
  let res = [];
  for (let i = 0; i < array.length; i++) {
    if (!check[array[i][key]]) {
      check[array[i][key]] = true;
      res.push(array[i]);
    }
  }
  return res;
}
//remove duplicate news
const data = removeDuplicateObjectFromArray(news_list, "title");
//filter data with titleEn not null
const filterData = data.filter((data) => data.titleEn !== null);
const filterDataObj = [];

//this for object id not give error
filterData.forEach((data) => {
  const dataIDs = {
    _id: mongoose.Types.ObjectId(data._id),
    pubDate: data.pubDate,
    url: data.url,
    source: data.source,
    nationality: data.nationality,
    language: data.language,
    title: data.title,
    titleEn: data.titleEn,
    description: data.description,
    summarization: data.summarization,
    countries: data.countries,
    cities: data.cities,
  };
  filterDataObj.push(dataIDs);
});

// insert Array of object in mongodb
app.post("/insertMany", async (req, res) => {
  const data = await News.insertMany(filterDataObj, function (error, docs) {
    if (error) {
      console.log(error);
    }
    return docs;
  });
  res
    .status(200)
    .send({ msg: "bulk data created successfully", error: false, res: data });
});

//serach api with string
app.get("/search", async (req, res) => {
  const searchResult = await News.find({
    $text: { $search: req.body.search },
  }).sort({ pubDate: -1 });
  if (searchResult.length !== 0) {
    res
      .status(200)
      .send({ msg: "get search result", error: false, data: searchResult });
  } else {
    res.status(200).send({ msg: "data not found" });
  }
});

app.get("/searchbynationality", async (req, res) => {
  const searchResult = await News.find().select("-_id nationality");

  let national = [];
  searchResult.forEach((data) => {
    national.push(data.nationality);
  });
  national = [...new Set(national)];

  let fullData = [];
  let newsData = Promise.all(
    national.map(async (element, i) => {
      let data = await News.find({ nationality: element }).sort({
        pubDate: -1,
      });

      let obj = {
        id: i,
        nationality: element,
        news_count: data.length,
        news_grouped: data,
      };

      fullData.push(obj);
    })
  );

  await newsData;

  fullData = fullData.sort((a, b) => {
    return b.news_count - a.news_count;
  });

  if (fullData.length !== 0) {
    res
      .status(200)
      .send({ msg: "get search result", error: false, data: fullData });
  } else {
    res.status(200).send({ msg: "data not found" });
  }
});

app.get("/aggregation", async (req, res) => {
  try {
    const groupCountriesWithnationality = await News.aggregate([
      {
        $group: {
          _id: "$nationality",
          count: { $sum: 1 },
          news_grouped: {
            $push: {
              _id: "$_id",
              pubDate: "$pubDate",
              url: "$url",
              source: "$source",
              nationality: "$nationality",
              language: "$language",
              title: "$title",
              titleEn: "$titleEn",
              description: "$description",
              summarization: "$summarization",
              countries: "$countries",
              country: "$country",
              cities: "$cities",
            },
          },
        },
      },{
        $sort:{
          count:-1
        }
      }
    ]);

    res.send(groupCountriesWithnationality)
  } catch (error) {
    console.log(error);
  }
});

app.get("/", async (req, res) => {
  res.send("Wow!😯 are you here🙃🙃 but you have no access!!! 😜😜😜");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
