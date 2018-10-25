const mongoose = require('mongoose');
const moment = require('moment');

mongoose.connect('mongodb://localhost/interview_challenge');

const db = mongoose.connection;

db.on('error', function() {
  console.log('mongoose connection error');
});

db.once('open', function() {
  console.log('mongoose connected successfully');
});


const accountSchema = mongoose.Schema({
	userID: Number,
	transactions: [{
		transID: Number,
		name: String,
		amount: Number,
		date: Date,
		isRecurring: Boolean
	}]
});

const Account = mongoose.model('Account', accountSchema);

var selectAll = function(user, date, callback) {
  Account.findOne({userID:user}, function(err, accounts) {
  	let lastDate = moment(date).subtract(1, 'years');
  	let lastYearTransactions = accounts.transactions.filter(function(ele) {
  		if(ele.date > lastDate) {
  			return true;
  		}
  	});
    if(err) {
      callback(err, null);
    } else {
      callback(null, lastYearTransactions);
    }
  });
};

//going to export methods for selecting all transaction from a user for 1 year previous to a date
//a seperate method to save transactions to a model
//a way to change non recurring transactions to recurring transactions


module.exports.selectAll = selectAll;