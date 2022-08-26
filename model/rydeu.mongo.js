const mongoose = require('mongoose')
const nschema = new mongoose.Schema({
    Country:{
        type:String
    },
    City:{
        type:String
    },
    Vehicle_type:{
        type:String
    },
    Amount_Airport_Fees:{
        type:Number
    },
    Amount_Per_Hour:{
        type:Number
    },
    Amount_Per_km:{
        type:Number
    },
    Base_Amount:{
        type:Number
    },
    Base_kms:{
        type:Number
    }
})
module.exports = mongoose.model('pricing',nschema)