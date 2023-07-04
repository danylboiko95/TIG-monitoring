const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema
const visitSchema = new Schema({
  count: {
    type: Number,
    default: 5,
  },
});

// Create the model
const Visit = mongoose.model("Visit", visitSchema);

module.exports = { Visit };
