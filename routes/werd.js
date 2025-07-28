const express=require('express')
const router=express.Router()
const path=require('path')
router.get("/add-werd",(req,res)=>{
res.sendFile(path.join(process.cwd(), 'public', 'werdPages', 'werdCreation.html'))
})
router.get("/manip-werd",(req,res)=>{
res.sendFile(path.join(process.cwd(), 'public', 'werdPages', 'werdManagement.html'))  
})
router.get("/werd",(req,res)=>{

res.sendFile(path.join(process.cwd(), 'public', 'werdPages', 'werdHome.html'))  
})
router.post("/api/werd/save",(req,res)=>{
  console.log(req.body);
  res.json({"success":1});
})
module.exports=router;