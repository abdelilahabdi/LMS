const mongoose = require('mongoose')




const status_schema =  new mongoose.Schema(
    {
        status_name:
        {
            type:String,
            required:true,
            unique: true
        }
    },
    {
            timestamps: true,
            versionKey: false 
    }
    
)


const Staus = mongoose.model('staus', status_schema);
module.exports = status_schema;