const express = require('express');
const storedAccounts = require('./db');
const upsert = require('./db');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();
const port = 1984;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	// let newTransactions = req.body;
	// console.log(newTransactions);
	let user = 5;//will come from post /req.body
	let date = "2018-05-01T08:00:00.000Z"//will come from req.body
	let name = "netflix"//will come from req.body
	storedAccounts.selectAll(user, date, function(err, data) {
	    if(err) {
	    	res.sendStatus(500);
	    } else {
	    	let allRecurring = separateTransactionList(data)[0];
	    	let allNonRecurring = separateTransactionList(data)[1];
	    	console.log(allRecurring, allNonRecurring)
	    	let rightPrice = filterByPrice(allRecurring, 10); //10 needs to be the price of the recurring transaction in question
	      	let rightDate = filterByDate(rightPrice, date)
	      	let rightName = filterByName(rightDate, name);
	      	let nextOccurance = getNextOccurance(rightName, user, {transID:6, name:'netflix 6', amount: 10.97, date:"2018-05-01T08:00:00.000Z"})
	      	// TODO: this is weird. where do you add the new transaction to one of the recurring transactions?
	      	// they even talk about a "recurring transaction group" but you don't have that anywhere
	      	res.json(nextOccurance);
	    }
	})
})

app.post('/', function(req, res) {
	let tran = {"transID":14,"name":"bobs","amount":20.99,"date":"2018-11-01T08:00:00.000Z","isRecurring":true};
	let user = 7;
	upsert.updateDB(user, tran,
		function(err, data) {
			if(err) {
	    		res.sendStatus(500);
	    	} else {
	    		console.log('dbupdate')
	    	}
		})
})

app.listen(port, function(){
	console.log('listening on port ', port);
})

function separateTransactionList(array) {
	/* input list of all transactions for a user:
	outputs an array of all recurring transactions at index 0 and
	an array of all non recurring transactions at index 1
	*/
	let recurringTrans = [];
	let nonRecurringTrans = [];
	recurringTrans = array.filter(function(ele) {
		return (ele.isRecurring);
	});
	nonRecurringTrans = array.filter(function(ele) {
		return(!ele.isRecurring);
	});
	return [recurringTrans, nonRecurringTrans];

}

function filterByPrice(array, price) {
	/* input is an array of possible recurring transactions and a price
	to see if the transaction is part of the recurring transactions we will
	see if the price is similar if it the transaction is added to an array which is output
	*/
	let priceMatch = [];
	priceMatch = array.filter(function(ele) {
		if(price * 1.5 > ele.amount && ele.amount > price * .5) {
			return true;
		}
	});
	return priceMatch;

}

function filterByDate(array, date) {
	/* this function is going to receive an array of transactions and the date for the
	transaction whose recurrability is in question. if any transaction happened 7, 14, 30,
	120, 180, 365 days previously that transaction is kept all others will be filtered out
	*/
	let startDate = moment(date);
	let dateMatch = [];
	let dayDiff = [0,1,2,3,7,14,27,28,29,30];
	let yearDiff = [363,364,365,366,367];
	dateMatch = array.filter(function(ele) {
		let transDate = moment(ele.date);
		if(dayDiff.indexOf(startDate.diff(transDate, 'days')) !== -1) {
			return true;
		} else if (dayDiff.indexOf(startDate.diff(transDate, 'days') % 30) !== -1) {
			return true;
		} else if(yearDiff.indexOf(startDate.diff(transDate, 'days')) !== -1) {
			return true;
		}

	});
	return dateMatch
}

function filterByName(array, name) {
	/* this function is going to receive an array of transactions and the name for the
	transaction whose recurrability is in question. after removing all characters except for
	letters if the names match the transaction is saved all others are discarded
	*/
	let nameMatch = [];
	let nameSegements = name.toLowerCase().split(' ')
	nameMatch = array.filter(function(ele) {
		let elementSegements = ele.name.toLowerCase().split(' ');
		for(let i = 0; i < nameSegements.length; i++) {
			if(elementSegements.indexOf(nameSegements[i]) !== -1) {
				return true;
			}
		}
	});
	return nameMatch;

}

function getNextOccurance(array, user, transaction) {
	/*this function is going to receive a transaction and the transactions who appear to make it
	recurring. here we will calculate when the next occurance of the transaction will be and
	estimate the amount the transaction will be for this function will return an object shaped the
	following way [name,user_id, next_amt, next_date, [all previous instances of this recurring
	transaction]]
	*/
	if(array.length < 2) {
		return [];
	}
	let amountSum = 0;
	let dateSum = 0;
	let len = array.length;
	let date = moment(transaction.date);
	for(let i = 0; i < len; i++) {
		amountSum += array[i].amount;
		let thisDate = moment(array[i].date);
		if(i !== len - 1) {
			let nextDate = moment(array[i + 1].date);
			dateSum += moment(nextDate.diff(thisDate, 'days'));
		} else {
			dateSum += moment(date.diff(thisDate, 'days'));
		}
	}
	let futureDate = moment(date).add(dateSum / len, 'days');
	// TODO: these don't match the spec
	return {name: transaction.name,
			userID: user,
			next_amount: amountSum / len,
			next_date: futureDate,
			isRecurring: true,
			transactions: array,
	}
}














