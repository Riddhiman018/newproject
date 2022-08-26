const express = require('express')
const router = express.Router()
const pricing = require('../model/rydeu.mongo')
const axios = require('axios')
const positionStackKey = "380e2efbf598700b489c7894ad7ef12c"
const radarKey = "prj_test_sk_e9d2c783da23be116d68ffb2b5f2587e69b3dfbf"
const validCities = ["Amsterdam","Barcelona","Paris","London","Berlin"]
router.get('/',async(req,res)=>{
    res.render('form')
})

router.get('/uploadSampleData',async (req,res)=>{
    pricing.insertMany([
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Luxury',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:135,
        Amount_Per_km:2.5,
        Base_Amount:89,
        Base_kms:10
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Comfort',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:55,
        Amount_Per_km:1.25,
        Base_Amount:43,
        Base_kms:10
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Business Van',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:75,
        Amount_Per_km:1.7,
        Base_Amount:70,
        Base_kms:10
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Mini Van',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:60,
        Amount_Per_km:1.35,
        Base_Amount:55,
        Base_kms:10
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Business',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:65,
        Amount_Per_km:1.5,
        Base_Amount:58,
        Base_kms:10
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Coach',
        Amount_Airport_Fees:0,
        Amount_Per_Hour:0,
        Amount_Per_km:0,
        Base_Amount:0,
        Base_kms:0
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Minibus',
        Amount_Airport_Fees:0,
        Amount_Per_Hour:0,
        Amount_Per_km:0,
        Base_Amount:0,
        Base_kms:0
      },
      {
        Country:'GB',
        City:'London',
        Vehicle_type:'Economy',
        Amount_Airport_Fees:0.1,
        Amount_Per_Hour:50,
        Amount_Per_km:1.15,
        Base_Amount:39,
        Base_kms:10
      }
    ],function(error,result){
        if(error){
            res.status(404).send({
                Message:'Error'
            })
        }
        else{
            res.status(200).send({
                Message:'Uploaded'
            })
        }
    })
})
//Main functionality
router.post('/sendData',async (req,res)=>{
    const result = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${positionStackKey}&query=${req.body.DestinationCity}`)
    const result2 = await axios.get(`http://api.positionstack.com/v1/forward?access_key=${positionStackKey}&query=${req.body.SourceCity}`)
    const data = result.data
    const data2 = result2.data
    console.log(data)
    console.log(data2)
    // 0 for berlin
    // 0 for London
    // 0 for Amsterdam
    // 0 for Paris
    // 0 for Barcelona
    if(data&&data2){
        const destination = data.data[0].locality
        const src = data2.data[0].locality
        console.log(typeof(destination))
        console.log(destination)
        console.log(src)
        if((destination=='Paris'||destination=='London')&&(src=='Paris'||src=='London')){
            const dest_lat = data.data[0].latitude
            const dest_long = data.data[0].longitude
            const src_lat = data2.data[0].latitude
            const src_long = data2.data[0].longitude
            const distanceres = await axios.get(`https://api.radar.io/v1/route/distance?origin=${src_lat},${src_long}&destination=${dest_lat},${dest_long}&modes=car&units=metric`,{
                headers:{'Authorization':radarKey}
            })
            const distanceRes = distanceres.data
            if(distanceRes){
                console.log(distanceRes.routes.car)
                if(distanceRes.routes.car.distance.value>=1000000){
                    res.status(404).send({
                        Message:'Too far to offer ride'
                    })
                }
                else{
                    try {
                        const destinationData = await pricing.findOne({
                            City:destination,
                            Vehicle_type:req.body.VehicleType
                        })
                        if(destinationData){
                            //do pricing
                            const baseprice = destinationData.Base_Amount
                            const otherPrices = ((distanceRes.routes.car.distance.value - destinationData.Base_kms*1000)/1000)*destinationData.Amount_Per_km
                            const hourlyPrice = (Math.floor(distanceRes.routes.car.duration.value/60) + Math.ceil((distanceRes.routes.car.duration.value%60)/60))*destinationData.Amount_Per_Hour
                            const totalPrice = baseprice+otherPrices+hourlyPrice+destinationData.Amount_Airport_Fees
                            if(totalPrice<50){
                                res.status(200).send({
                                    EMAIL_NEEDED:true
                                })
                            }
                            else{
                                res.status(200).send({
                                    EMAIL_NEEDED:false,
                                    totalprice:totalPrice
                                })
                            }
                        }
                    } catch (error) {
                        console.log(error)
                        res.status(404).send({
                            Message:'Unknown Error has occurred'
                        })
                    }
                }
            }
        }
        else if((validCities.indexOf(src)!=-1)&&(validCities.indexOf(destination)!=-1)){
            res.status(200).send({
                EMAIL_NEEDED:true
            })
        }
        else{
            res.status(404).send({
                Message:'Incorrect Data Entered'
            })
        }
    }
})

module.exports = router 