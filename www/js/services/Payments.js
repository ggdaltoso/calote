'use strict';

function Payments($q, $timeout, $cordovaSQLite, DBA) {

    function addPayment(friend, much, increase, description) {
        var parameters = [friend.id, much, increase, description, new Date().getTime()];
        console.log(JSON.stringify(parameters))
        return DBA.query("INSERT INTO payments (friendId, howMuch, creditOrDebit, description, dataPayment) VALUES (?,?,?,?,?)", parameters);
    }

    function getAllPaymentsFromFriend(friend) {
        var params = [friend.id]
        return DBA.query("SELECT * FROM payments WHERE friendId = (?) ORDER BY dataPayment DESC", params)
            .then(function (result) {
                return DBA.getAll(result);
            });
    }

    function getAll() {
        console.log('getAll')
        return DBA.query("SELECT * FROM payments")
            .then(function (result) {
                return DBA.getById(result);
            });
    }

    function getAmount() {
        console.log('getAmount')
        return DBA.query("SELECT SUM(debt) as 'amount' FROM friend")
            .then(function (result) {
                return DBA.getById(result);
            });
    }

    var clearDatabase = function () {
        return DBA.query("DELETE FROM payments");
    }

    return {
        addPayment: addPayment,
        clearDatabase: clearDatabase,
        getAllPaymentsFromFriend: getAllPaymentsFromFriend,
        getAll: getAll,
        getAmount: getAmount,
    }

}

angular
	.module('calote.services')
		.factory('Payments', Payments);