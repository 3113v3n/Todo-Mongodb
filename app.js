//jshint esversion:6
const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const app = express();
const config = require(__dirname + "/config.js");
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const Local_Port = 3000;
const Prod_Port = process.env.PORT;

/**
 * Create MongoDB database
 *
 */
const cloud_url = `mongodb+srv://${config.username}:${config.password}@${config.cluster}`;
const local_url = "mongodb://localhost:27017";
const dbName = "todolistDB";
const url = cloud_url;
mongoose.connect(`${url}/${dbName}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/**
 **
 * Create Items Schema
 */
const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Add a Name to your Todo List"],
  },
});

/**
 * Person Schema
 */
const personSchema = new mongoose.Schema({
  name: String,
  age: Number,
  //The line below was added to create relationship btn aperson and fruit
  todo: itemsSchema,
});

/**
 * routeListSchema
 */
const routeListSchema = {
  name: String,
  items: [itemsSchema],
};
/**
 * Models
 */
const Item = mongoose.model("item", itemsSchema);
const Person = mongoose.model("person", personSchema);
const List = mongoose.model("List", routeListSchema);
const newTodo = new Item({
  name: "Learn Power BI",
});
const sidney = new Person({
  name: "Sidney",
  age: 24,
  todo: newTodo,
});
//newTodo.save();
//sidney.save();
const step1 = new Item({
  name: "Welcome to your todolist !!",
});
const step2 = new Item({
  name: "Hit the + button to add a new Todo",
});
const step3 = new Item({
  name: "<-- Check the box to delete an Item ",
});
const defaultList = [step1, step2, step3];
//PUT Request
// Item.updateOne(
//   {
//     _id: "5ec68896773d250f156ea5d7",
//   },
//   { name: "Eat Food" },
//   (err) => {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log("Update Successfull");
//     }
//   }
// );
//GET Request
app.get("/", function (req, res) {
  Item.find({}, (err, items) => {
    if (err) {
      console.log(err);
    }
    if (items.length === 0) {
      //only insert default data if our list is empty
      Item.insertMany(defaultList, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Added the Items to the database");
        }
      });
      res.redirect("/");
    }
    res.render("list", { listTitle: "Today", newListItems: items });
  });
});

/**
 * DYNAMIC ROUTING
 */
app.get("/:route", (req, res) => {
  const customRouteName = _.capitalize(req.params.route); //capitalize first letter
  //To avoid constantly adding same item to list, we filter it out using the findOne() function that returns an object
  List.findOne({ name: customRouteName }, (err, foundItem) => {
    if (!err) {
      if (!foundItem) {
        //CREATE LIST BASED ON ROUTElISTSCHEMA
        const list = new List({
          name: customRouteName,
          items: defaultList, //our initial List
        });
        list.save();
        res.redirect(`/${customRouteName}`);
      } else {
        //Show Existing List
        res.render("list", {
          listTitle: foundItem.name,
          newListItems: foundItem.items,
        });
      }
    }
  });
});
//POST Request
app.post("/", function (req, res) {
  const list_title = req.body.list;
  const itemName = req.body.newItem;
  const newItem = new Item({
    name: itemName,
  });
  if (list_title === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: list_title }, (err, listObject) => {
      listObject.items.push(newItem);
      listObject.save();
      res.redirect(`/${list_title}`);
    });
  }

  /**
   * We need to dynamically render list items in the given route hence we
   * grab the list title from button and post the data there using conditional
   * statements
   */
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});
//DELETE Request

app.post("/delete", (req, res) => {
  const checkedId = req.body.checkbox_id;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted Successfully");
        res.redirect("/");
      }
    });
  } else {
    /**
     * findOneAndUpdate({condition},{updates},callback(err,result)}
     * { $pull: { items: { _id: checkedId } } },
     * we pull from items array and gets the item with the defined id
     */
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedId } } },
      (err, results) => {
        if (!err) {
          res.redirect(`/${listName}`);
        }
      }
    );
  }
});

app.listen(Prod_Port || Local_Port, function () {
  console.log("Server started on port 3000");
});
