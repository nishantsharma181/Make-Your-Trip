const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");

const MONGO_URL=process.env.MONGO_URL;

main()
.then(()=>{
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(MONGO_URL);
}
app.get("/",(req,res)=>{
    res.send("hi i am root");
});
app.get("/testListing",async (req,res)=>{
let samplelisting=new Listing({
    title: "my house",
    description: "by the beach",
    price:1200,
    location: "bareilly",
    country: "india",
});
await samplelisting.save();
res.send("succesful testing");
});
app.listen(process.env.PORT||8000,()=>{
});
