angular.module('starter.services', ['ngResource'])

.factory('Friends', function ($q, $timeout, $cordovaSQLite, DBA) {

    function addFriend(friend) {
        var parameters = [friend.id, friend.name, friend.picture];
        return DBA.query("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", parameters);
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
        removeFriend: removeFriend
    }

})

.factory('Payments', function ($q, $timeout, $cordovaSQLite, DBA) {

    function addPayment(friend, much, increase) {
        var parameters = [friend.id, much, increase, new Date().getTime()];
        console.log(JSON.stringify(parameters))
        return DBA.query("INSERT INTO payments (friendId, howMuch, creditOrDebit, dataPayment) VALUES (?,?,?,?)", parameters);
    }

    function getAllPaymentsFromFriend(friend) {
        var params = [friend.id]
        console.log('query for ' + friend.id)
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

    var clearDatabase = function () {
        return DBA.query("DELETE FROM payments");
    }

    return {
        addPayment: addPayment,
        clearDatabase: clearDatabase,
        getAllPaymentsFromFriend: getAllPaymentsFromFriend,
        getAll: getAll
    }

})

.factory('DBA', function ($cordovaSQLite, $q, $ionicPlatform) {
    var self = this;

    // Handle query's and potential errors
    self.query = function (query, parameters) {
        parameters = parameters || [];
        var q = $q.defer();

        $ionicPlatform.ready(function () {
            $cordovaSQLite.execute(db, query, parameters)
                .then(function (result) {
                    q.resolve(result);
                }, function (error) {
                    console.warn('I found an error');
                    console.warn(error);
                    q.reject(error);
                });
        });
        return q.promise;
    }

    // Proces a result set
    self.getAll = function (result) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }
        return output;
    }

    // Proces a single result
    self.getById = function (result) {
        var output = null;
        output = angular.copy(result.rows.item(0));
        return output;
    }

    return self;
})

.service("ContactsService", ['$q', function($q) {

        var formatContact = function(contact) {

            return {
                "name"      : contact.name.formatted || contact.name.givenName + " " + contact.name.familyName || "Mystery Person",
                //"emails"        : contact.emails || [],
                "id"        : contact.phoneNumbers[0].value || [],
                "picture"   : contact.photos ? contact.photos[0].value : "./img/default.png",
            };

        };

        var pickContact = function() {

            var deferred = $q.defer();

            if(navigator && navigator.contacts) {
                navigator.contacts.pickContact(function(contact){
                    console.log(JSON.stringify(contact.phoneNumbers), contact.phonesNumbers !== 'undefined')
                    if(contact.phonesNumbers && contact.phonesNumbers.length)
                        deferred.resolve( formatContact(contact) );
                    else
                        deferred.reject("Contato sem número de telefone");
                });

            } else {
                deferred.reject("Browser error");
            }

            return deferred.promise;
        };

        return {
            pickContact : pickContact
        };
    }])

.service('LoginService', function($q, DBA) {    

    function addFriend(friend) {
        var parameters = [friend.id, friend.name, friend.picture];
        return DBA.query("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", parameters);
    }

    var setUser = function(friend){
        var parameters = [friend.id, friend.name, friend.picture.data.url];
        return DBA.query("INSERT INTO user (id, name, picture) VALUES (?,?,?)", parameters);
    }

    var getUser = function(){
        return DBA.query("SELECT * FROM user")
                    .then(function (result) {
                        return DBA.getAll(result);
                    });
    }
    
    var loginUser =  function(user) {
            var deferred = $q.defer();
            var promise = deferred.promise;
 
            getUser().then(function(success){
                if(!success.length)
                    setUser(user).then(function(res ){
                            getUser()
                                .then(function(user){
                                    deferred.resolve(user)
                                })
                    }, function(){
                        console.log('Aconteceu algo estranho com seu login :)')
                        deferred.reject('Aconteceu algo estranho com seu login :(');
                    })
                else
                    deferred.resolve(success)
            }, function(error){
                deferred.reject('Aconteceu algo estranho com seu login :(');
            })
                
            promise.success = function(fn) {
                promise.then(fn);
                return promise;
            }
            promise.error = function(fn) {
                promise.then(null, fn);
                return promise;
            }
            return promise;
    }   
    return {           
        loginUser: loginUser,
        setUser: setUser,
        getUser: getUser     
    }
});
