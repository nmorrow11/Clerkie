const express = require('express');
const storedAccounts = require('./db');
const upsert = require('./db');
const changeToRecurringDB = require('./db');
const bodyParser = require('body-parser');
const moment = require('moment');
const app = express();
const port = 1984;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/', function(req, res) {
	let user = 6;//will come from req.url maybe
	let date = "2018-05-01T08:00:00.000Z"//will come from req.url
	let name = "netflix"//will come from req.url
	storedAccounts.selectAll(user, date, function(err, data) {
	    if(err) {
	    	res.sendStatus(500);
	    } else {
	    	let allRecurring = separateTransactionList(data)[0];
	    	let allNonRecurring = separateTransactionList(data)[1];
	    	let rightPrice = filterByPrice(allRecurring, 10); //10 needs to be the price of the recurring transaction in question
	      	let rightDate = filterByDate(rightPrice, date)
	      	let rightName = filterByName(rightDate, name);
	      	let nextOccurance = predictNextTransaction(rightName, user, {transID:6, name:'netflix 6', amount: 10.97, date:"2018-05-01T08:00:00.000Z"})
	      	// TODO: this is weird. need to add the new transaction to one of the recurring transactions
	      	// they even talk about a "recurring transaction group" but i don't have that anywhere
	      	res.json(nextOccurance);
	    }
	});
});

app.post('/', function(req, res) {

	let transactionsArray = req.body.transactions
	let user = req.body.userID;
	upsert.updateDB(user, transactionsArray,
		function(err, data) {
			if(err) {
	    		res.sendStatus(500);
	    	} else {
	    		console.log(data)
	    	}
		});
});

app.listen(port, function(){
	console.log('listening on port ', port);
});

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
	/* will check to see if any elements in the array are at the same price area
	as our transaction is. if they are they are stored in an array and passed on
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
	// will check to see if a transaction occured at a set interval against an array of transactions
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
	return dateMatch;
}

function filterByName(array, name) {
	/* breaks a name into substrings and checks to see if the array has any similar
	substrings inside and of its elements names
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

function predictNextTransaction(array, user, transaction) {
	/*takes in a transaction and an array of its recurring transaction group
	returns part of the output for the user
	*/
	console.log(array, user, transaction)
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
	let groupedRecurringTransaction =
		{name: transaction.name,
			userID: user,
			next_amount: (amountSum / len).toFixed(2),
			next_date: futureDate,
			isRecurring: true,
			transactions: array,
		};
		console.log(groupedRecurringTransaction)
	if(!array[0].isRecurring) {
		for(let i = 0; i < array.length; i++) {
			array[i].isRecurring = true;
		}
		changeToRecurring(groupedRecurringTransaction);
	}
	return groupedRecurringTransaction;
}

function changeToRecurring(obj) {
	//this function saves former non recurring transactions into recurring ones
	changeToRecurringDB.changeToRecurring(obj.userID, obj.transactions);
}






