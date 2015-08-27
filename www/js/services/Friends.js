'use strict';

var Friends = function ($q, $timeout, $cordovaSQLite, DBA) {

    function addFriend(friend) {
        var parameters = [friend.id, friend.name, friend.picture];
        return DBA.query("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?,0)", parameters);
    }

    function addAllFriends(friends) {

        var defer = $q.defer();
        var promises = [];

        function f(friend) {
            addFriend(friend);
        }

        friends.forEach(function (friend) {
            promises.push(f(friend));
        });

        $q.all(promises).then(function () {
            defer.resolve();
        });

        return defer.promise;
    }

    function getFriendByID(id) {
        return DBA.query("SELECT * FROM friend WHERE id = (?)", [id])
            .then(function (result) {
                return DBA.getById(result);
            });
    }

    function getAllFriends() {
        return DBA.query("SELECT * FROM friend")
            .then(function (result) {
                return DBA.getAll(result);
            });
    }

    // change for most debts    
    function getTop10() {
        return DBA.query("SELECT * FROM friend order by case when debt <> 0 then 0 else 1 end, debt desc LIMIT 10")
            .then(function (result) {
                return DBA.getAll(result);
            });
    }

    function updateFriend(oldFriend, newFriend) {
        var parameters = [newFriend.debt, oldFriend.id];
        return DBA.query("UPDATE friend SET debt = (?) WHERE id = (?)", parameters);
    }

    function setOldFriend(friend) {
        var parameters = [friend.id];
        return DBA.query("UPDATE friend SET newFriend = 0 WHERE id = (?)", parameters);
    }

    var searchFriends = function (searchFilter) {

        var deferred = $q.defer();

        var param = ['%' + searchFilter + '%'];

        var matches = DBA.query("SELECT * FROM friend WHERE name like (?) LIMIT 20", param)
            .then(function (result) {
                return DBA.getAll(result);
            }, function (error) {
                alert(error)
            });

        $timeout(function () {
            deferred.resolve(matches);
        }, 500);

        return deferred.promise;

    };

    var removeFriend = function (friend){
        var params = [friend.id];
        return DBA.query("DELETE FROM friend WHERE id = (?)", params);
    }

    var clearDatabase = function () {
        return DBA.query("DELETE FROM friend");
    }

    return {
        getAllFriends: getAllFriends,
        searchFriends: searchFriends,
        updateFriend: updateFriend,
        getFriendByID: getFriendByID,
        clearDatabase: clearDatabase,
        getTop10: getTop10,
        addFriend: addFriend,
        addAllFriends: addAllFriends,
        removeFriend: removeFriend,
        setOldFriend: setOldFriend
    }

}

angular
	.module('calote.services')
		.factory('Friends', Friends);