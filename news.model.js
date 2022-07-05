const mongoose = require('mongoose')
const Schema = mongoose.Schema

const newsSchema = new Schema({
    _id:false,
    pubDate:String,
    url:String,
    source:String,
    nationality:String,
    language:String,
    title:String,
    titleEn:String,
    description:String,
    summarization:String,
    countries:[{type:String}],
    cities:[{
        "city_names":String,
        CityCoord:{
            coordinates:[Number]
        },
        "population":Number
    }],

},{
    timestamps:true,
})
// newsSchema.index({titleEn: 'text'});
const News = mongoose.model("city", newsSchema)
// News.createIndexes();
module.exports =News