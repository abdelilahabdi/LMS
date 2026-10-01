const mongoose = require("mongoose");

const courseShema = new mongoose.Schema ( 
    {
        title : {
            type : String,
            required : true ,
            trim : true 
        },

        description : {
            type : String ,
            required : true ,
            trim : true 
        },

        category : {
            type : String ,
            required : true ,
            trim : true
        } ,


        level : {
            type : String ,
            enum : ["beginner" , "intermediate" , "advanced"] ,
            required : true 
        } ,

        status : {
            type : String ,
            enum : ["draft" , "published"],
            default: "draft"
        },




        publishedAt : {
            type : Date 
        }
        },


        {
        publishedAt : true
           
        } 
    );

    const Course = mongoose.model("Course",courseShema) ;
    module.exports = Course ;
    
    
