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


// Keep the existing collection while matching Enrollment's model reference.
const Status = mongoose.model('Status', status_schema, 'staus');
module.exports = Status;
