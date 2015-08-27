'use strict';

function LoginService($q, $http, DBA) {    

    var _user = null;

    function addFriend(friend) {
        var parameters = [friend.id, friend.name, friend.picture];
        return DBA.query("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", parameters);
    }

    var setUser = function(friend){
        var parameters = [friend.id, friend.name, friend.picture.data.url];
        return DBA.query("INSERT INTO user (id, name, picture) VALUES (?,?,?)", parameters);
    }

    var setGCMID = function(GCMID){
        _user.GCMID = GCMID;
        storeDeviceToken();
        var parameters = [GCMID, _user.id];
        return DBA.query("UPDATE user SET GCMID = (?) WHERE id = (?)", parameters);
    }    

    function storeDeviceToken() {
        // Create a random userid to store with it
        var user = { user: _user.id, type: 'android', token: _user.GCMID };
        console.log("Post token for registered device with data " + JSON.stringify(user));

        $http.post('http://192.168.1.11:8000/subscribe', user)
            .success(function (data, status) {
                console.log("Token stored, device is successfully subscribed to receive push notifications.");
            })
            .error(function (data, status) {
                console.log("Error storing device token." + data + " " + status)
            }
        );
    }

    var getUser = function(){
        return DBA.query("SELECT * FROM user")
                    .then(function (result) {                        
                        return DBA.getAll(result);
                    });
    }

    getUser().then(function(user){
        _user = user[0] ? user : null;
    })

    var clearDatabase = function () {
        _user = null;
        return DBA.query("DELETE FROM user ");
    }

    var isLoggedUser = function(){
        return _user ? true: false;
    }
    
    var loginUser =  function(user) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if(!isLoggedUser()){
                setUser(user).then(function(){  
                        getUser()
                            .then(function(user){     
                                _user = user[0];                           
                                deferred.resolve(user)
                            })
                }, function(){
                    deferred.reject('Aconteceu algo estranho com seu login :(');
                })
            }else{
                getUser().then(function(success){
                    deferred.resolve(success)
                }, function(error){
                    deferred.reject('Aconteceu algo estranho com seu login :(');
                })
            }            
                
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
        isLoggedUser: isLoggedUser,
        clearDatabase: clearDatabase,
        loginUser: loginUser,
        setUser: setUser,
        getUser: getUser,
        setGCMID: setGCMID     
    }
};

angular
	.module('calote.services')
		.service('LoginService', LoginService);