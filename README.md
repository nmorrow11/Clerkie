# Clerkie

This project is 2 api routes which upsert some transactions into a mongo db and returns all of that users recurring transactions. It is identifying recurring transactions based off of three factors: 1) If the price is within 50% of any transaction you have made in the last year all of those transactions are added to an array to see if they are part of a pattern. 2) If any of those transactions were made exactly 7 or 14 days prevously, or approximately 1 month, 1 quarter, 1/2 a year or 1 year ago they are moved on and the rest are filtered out since they would not be at a set interval. 3) If there are similar substrings in the name of this transaction and the remaining transactions then it would appear that we have a recurring transaction. We assume that if there at least 2 other transactions like this one this is a recurring transaction, because it looks like it is from the same entity for the same amount at approximately the same interval.

Currently this program has the functions completed for filtering by name, price, and date, methods to upsert to a mongo database, methods to mark a transaction as a recurring transaction, and the ability to pull a users transactions from the database.

Things I would have liked to add:

It would have been nice to add a field to the db which kept track of a users exsisting recurring transactions. It would have made returning an object back to the consumer of this api, much easier since once you identified if the transaction was recurring you could just add it to this group and return that group. This would also be a great place to start checking transactions against (known recurring transactions) instead of the way that I was headed (which was to pull all the transactions from the last year and split them into a group of recurring transactions and nonrecurring transactions and then check them against both groups.)

There were a couple requirments that were not completed as in this just returns the recurring transactions that are associated with the one new tranasction that I am checking, instead of returning all the recurring transactions. There was no timeout feature if the app took longer than 10 seconds to complete the transaction. Also I should have asked for some clarification on what recurring transactions were going to be returned on a get request.