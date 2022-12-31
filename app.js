const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));


mongoose.set('strictQuery', false);

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);                           //connection to database
}

const itemsSchema = new mongoose.Schema({                                               //database schema
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

//default items

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//home page

app.get("/", function (req, res) {

  Item.find({}, function (error, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (error) { });                                      //insert default items
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });                    //shows list of items
    }

  });

});

//add new items

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {                                                            //home page new items added
    item.save();
    res.redirect("/");
  }
  else {                                                                                //other than home page new items added
    List.findOne({ name: listName }, function (error, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

//delete items from list

app.post("/delete", function (req, res) {

  const removeItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(removeItem, function (error) { });
    res.redirect("/");
  }
  else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: removeItem } } }, function (error, foundList) {
      if (!error) {
        res.redirect("/" + listName);
      }
    });
  }

});

//other than Home page

app.get("/:heading", function (req, res) {

  const heading = _.capitalize(req.params.heading);

  List.findOne({ name: heading }, function (error, foundList) {

    if (!foundList) {
      const list = new List({
        name: heading,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + heading);
    }
    else {
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }

  });

});

//start server

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
