const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
const date=require(__dirname+"/date.js");

const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine","ejs");

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser:true});

//items schema for main todo list
const itemsSchema={
	name:String
};

const Item=new mongoose.model("Item",itemsSchema);

const eat=new Item({
	name:"Eat"
});
const code=new Item({
	name:"Code"
});
const repeat=new Item({
	name:"Repeat"
});

const defaultitems=[eat,code,repeat];

//schema for custom todo list
const listSchema={
	name:String,
	items:[itemsSchema]
};

const List=new mongoose.model("List",listSchema);

const day=date.getDate();

app.get("/",function(req,res){


	Item.find({},function(err,founditems){

		if(founditems.length===0){
			Item.insertMany(defaultitems,function(err){
				if(err){
					console.log(err);
				} else{
					console.log ("Successfully inserted defaultitems.");
				}
			});
			res.redirect("/");
		} else{
			List.find({},function(err,founditems2){
				if(!err){
					res.render("list",{date:day,title:"Today",items:founditems,totalList:founditems2});
				}
			});
			// res.render("list",{date:day,title:"Today",items:founditems,totalList:totalList});
		}
	});


});

app.get("/:customList",function(req,res){

	const customListName=_.capitalize(req.params.customList);

	List.findOne({name:customListName},function(err,foundlist){
		if(!err){
			if(!foundlist){    //create a new list

				const list=new List({
					name:customListName,
					items:defaultitems
				});

				list.save(function(){
					res.redirect("/"+customListName)
				});

			} else{    //show an existing list

				List.find({},function(err,foundlist2){
					if(!err){
						res.render("list",{date:day,title:foundlist.name,items:foundlist.items,totalList:foundlist2});
					}
				})

			}
		}
	});

});

app.post("/",function(req,res){

	const item=req.body.newItem;
	const list=req.body.list;

	const newitem=new Item({
		name:item
	});

	if(list==="Today"){
		newitem.save();
		res.redirect("/");
	} else{

		List.findOne({name:list},function(err,foundList){
			if(!err){
				foundList.items.push(newitem);
				foundList.save();
				res.redirect("/"+list);
			}
		});
	}
});

app.post("/delete",function(req,res){

	const checkedItem=req.body.checkbox;
	const checkedList=req.body.listname;

	if(checkedList==="Today"){

		Item.findByIdAndRemove(checkedItem,function(err){
			if(err){
				console.log(err);
			} else{
				console.log("Successfully deleted checked item.");
				res.redirect("/");
			}
		});	

	} else{

		List.findOneAndUpdate({name:checkedList},{$pull: {items: {_id: checkedItem}}},function(err,foundList){
			if(!err){
				res.redirect("/"+checkedList);			}
		});

	}

	
});

app.listen(3000,function(){
	// console.log(__dirname)
	console.log("Server is running on port 3000.");
});