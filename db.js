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
		isRecurring: Boolean,
		recurringTransactionGroup: Number,
	}]
});

const Account = mongoose.model('Account', accountSchema);

const selectAll = function(user, date, callback) {
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

const updateDB = function (user, transaction, callback) {
	let userID = user;
	Account.findOneAndUpdate({userID: userID}, { $push: { transactions: transaction } }, {upsert:true},
		function(err, account) {
			if(err) {
				callback(err, null);
			} else{
				callback(null, account);
			}
		});
};

const changeToRecurring = function (userID, array) {
	Account.findOneAndUpdate({userID: userID}, {transactions: array},
		function(err, account) {
			if(err) {
				callback(err, null);
			} else {
				console.log('DB updated!!');
			}
		});
};

module.exports.selectAll = selectAll;
module.exports.updateDB = updateDB;
module.exports.changeToRecurring = changeToRecurring;