const express = require('express');
const storedAccounts = require('./db');
const bodyParser = require('body-parser');
const moment = require('moment');
const stringSimilarity = require('string-similarity');
const app = express();
const port = 1984;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.get('/', function(req, res){
	// let newTransactions = req.body;
	// console.log(newTransactions);
	let user = 4;//will come from post /req.body
	let date = "2018-05-01T08:00:00.000Z"//will come from req.body
	let name = "netflix"//will come from req.body
	storedAccounts.selectAll(user, date, function(err, data) {
	    if(err) {
	    	res.sendStatus(500);
	    } else {
	    	let allRecurring = recurringTransactionList(data);
	    	let allNonRecurring = nonRecurringTransactionList(data);
	    	let rightPrice = filterByPrice(allRecurring, 10); //10 needs to be the price of the recurring transaction in question
	      	let rightDate = filterByDate(rightPrice, date)
	      	let rightName = filterByName(rightDate, name);
	      	let nextOccurance = getNextOccurance(rightName, {transID:6, name:'netflix6', amount: 10.97, date:"2018-05-01T08:00:00.000Z"})
	      	res.json(nextOccurance);
	    }
	})
})

app.listen(port, function(){
	console.log('listening on port ', port);
})
function recurringTransactionList(array) {
	/* input list of all transactions for a user:
	outputs all recurring transaction for the user as an array of objects
	*/
	let recurringTrans = [];
	recurringTrans = array.filter(function(ele) {
		if(ele.isRecurring){
			return true;
		}
	});
	return recurringTrans;

}

function nonRecurringTransactionList(array) {
	/* if after going through recurring transactions the status of the transaction is question
	is still unknown this function will return an array of the non recurring transactions to
	compare the tranasction against
	*/
	let nonRecurringTrans = [];
	nonRecurringTrans = array.filter(function(ele) {
		if(!ele.isRecurring){
			return true;
		}
	});
	return nonRecurringTrans;
}
function filterByPrice(array, price) {
	/* this function is going to receive an array of transactions and the price for the
	transaction whose recurrability is in question. any transactions inside the array
	whose value is within (+/-) 50% of the price will remain in the array all others will
	be filtered out and the array with the close prices will be send on to the date check
	function
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
	let start = moment(date);
	let dateMatch = [];
	let dayDiff = [0,1,2,3,7,14,27,28,29,30];
	let yearDiff = [363,364,365,366,367];
	dateMatch = array.filter(function(ele) {
		let transDate = moment(ele.date);
		if(dayDiff.indexOf(start.diff(transDate, 'days')) !== -1) {
			return true;
		} else if (dayDiff.indexOf(start.diff(transDate, 'days') % 30) !== -1) {
			return true;
		} else if(yearDiff.indexOf(start.diff(transDate, 'days')) !== -1) {
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
	nameMatch = array.filter(function(ele) {
		let value = stringSimilarity.compareTwoStrings(name, ele.name);
		if(value > 0.55) {
			return true;
		}
	});
	return nameMatch;

}

function getNextOccurance(array, transaction) {
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
	let transSum = 0;
	let len = array.length;
	let date = moment(transaction.date);
	console.log(array, 'ayyyyyy')
	for(let i = 0; i < len; i++) {
		amountSum += array[i].amount;
		transSum +=array[i].transID;
		let thisDate = moment(array[i].date);
		if(i !== len - 1) {
			let nextDate = moment(array[i + 1].date);
			dateSum += moment(nextDate.diff(thisDate, 'days'));
		} else {
			dateSum += moment(date.diff(thisDate, 'days'));
		}
	}
	let futureDate = moment(date).add(dateSum / len, 'days');
	return {transID: Math.round(transSum / len) + transaction.transID,
			name: transaction.name,
			amount: amountSum / len,
			date: futureDate,
			isRecurring: true
	}
}














