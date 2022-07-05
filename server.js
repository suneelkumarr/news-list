const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nocache = require('nocache')
const compression = require('compression');
const helmet = require('helmet');
const news_list = require('./news_list.json');
const News = require('./news.model'); 




const app = express();
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(nocache());

const PORT = 3000;

mongoose
.connect("mongodb+srv://16eiacs080:16eiacs080@cluster0.1wbxw.mongodb.net/news?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Database connected"))
.catch(error => {
    if (error) console.log('Failed to connect DB')
})


function removeDuplicateObjectFromArray(array, key) {
    let check = {};
    let res = [];
    for(let i=0; i<array.length; i++) {
        if(!check[array[i][key]]){
            check[array[i][key]] = true;
            res.push(array[i]);
        }
    }
    return res;
}
//remove duplicate news
const data = removeDuplicateObjectFromArray(news_list ,'title')

const filterData = data.filter((data)=> data.titleEn !== null)
const filterDataObj = []
 filterData.forEach((data)=>{
    const dataIDs= {
        _id: mongoose.Types.ObjectId(data._id),
        pubDate:data.pubDate,
        url:data.url,
        source:data.source,
        nationality:data.nationality,
        language:data.language,
        title:data.title,
        titleEn:data.titleEn,
        description:data.description,
        summarization:data.summarization,
        countries:data.countries,
        cities:data.cities,
    }
    filterDataObj.push(dataIDs)
})

app.post('/insertMany',async (req, res)=>{
  const data = await News.insertMany(filterDataObj, function(error, docs) {
        if(error){
            console.log(error)
        }
        return docs
    });
    res.status(200).send({msg:"bulk data created successfully", error:false, res:data});
})

app.get('/search', async(req, res) => {
  const searchResult = await News.find({$text: {$search: req.body.search}}).sort({pubDate:-1})
  if(searchResult.length !== 0) {
    res.status(200).send({msg:"get search result",
    error:false,
    data:searchResult
})
  }else{
    res.status(200).send({msg:"data not found"})
  }
})

app.get('/searchbynationality', async(req, res) => {
  const searchResult = await News.find().select("-_id nationality")

  let national=[]
  searchResult.forEach((data)=>{
    national.push(data.nationality)
  })
  national=[...new Set(national)]
  
  let fullData=[]
 let newsData= Promise.all(national.map(async(element,i)=>{
    let data=await News.find({"nationality":element}).sort({pubDate:-1})

    let obj={
    id:i,
    nationality:element,
    news_count:data.length,
    news_grouped:data
   }
   
fullData.push(obj)
console.log(fullData)
  }))

  await newsData

fullData=fullData.sort((a,b)=>{
   return b.news_count - a.news_count
})

  res.send(fullData)

//   if(searchResult.length !== 0) {
//     res.status(200).send({msg:"get search result",
//     error:false,
//     data:searchResult
// })
//   }else{
//     res.status(200).send({msg:"data not found"})
//   }
})



app.get('/', async (req, res) => {
    res.send("Wow!😯 are you here🙃🙃 but you have no access!!! 😜😜😜")
})


app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`)
})