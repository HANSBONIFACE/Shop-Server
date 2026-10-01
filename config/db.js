const mongoose = require('mongoose')

mongoose.connect(process.env.DBconnectionString).then(res=>{
    console.log('MongoDB Connected...');
    
}).catch(err=>{
    console.log('MongoDB Connection Error',err);
    
})