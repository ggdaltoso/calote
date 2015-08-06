angular.module('starter.controllers', ['starter.services', 'ngOpenFB'])

.controller('AppCtrl', function ($http, $scope, $ionicModal, $timeout, $location, $q, $ionicLoading, Friends, ngFB, $rootScope, $ionicSideMenuDelegate) {

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
        $scope.loggedUser();
    });

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    // $scope.$on('$ionicView.enter', function (e) {
    // });

    // Form data for the login modal
    $scope.loginData = {};

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
        $scope.fbLogin();
        //// $scope.modal.show(); # not anymore
    };

    $scope.fbLogin = function () {
        ngFB.login({
            scope: 'email,user_friends'
        }).then(
            function (response) {
                if (response.status === 'connected') {
                    $ionicLoading.show({
                        template: '<p>Adicionando amigos<p><p>Isso pode levar alguns minutos<p><ion-spinner icon="android"></ion-spinner>'
                    });
                    window.localStorage.accessToken = response.authResponse.accessToken;
                    getFriendsList();
                    initUser();
                    $scope.modal.hide();
                } else {
                    alert('Facebook login failed');
                }
            });
    };
    
    var changeModalText = function(text){
        $ionicLoading
            .show({ template: '<p>Adicionando amigos<p><p>' + text + '<p><ion-spinner icon="android"></ion-spinner>' });
    }

    var getFriendsList = function () {

        var array = [];

        var f = function (next) {
            $http.get(next).then(function (nextResult) {

                array = array.concat(nextResult.data.data);

                if (nextResult.data.paging.next != null) {
                    f(nextResult.data.paging.next);
                    /*
                    Friends.addAllFriends(array)
                        .then(function () {
                            $rootScope.$broadcast('bdPopulated');
                            $scope.closeLogin();
                        });
                    */
                } else {

                    Friends.addAllFriends(array)
                        .then(function () {
                            $rootScope.$broadcast('bdPopulated');
                            console.log("finish");
                        });
                    
                    array.forEach(function(f){                        
                        $timeout(function(){
                            changeModalText(f.name);
                        }, 500);
                    })

                }
            });
        }

        ngFB.api({
                path: '/me/taggable_friends'
            })
            .then(function (result) {
                array = result.data;
                f(result.paging.next);
            }, function (error) {});
    }

    var initUser = function () {

        if (window.localStorage.hasOwnProperty("accessToken")) {
            $http.get("https://graph.facebook.com/v2.4/me", {
                    params: {
                        access_token: window.localStorage.accessToken,
                        fields: "id,name,gender,location,website,picture,relationship_status",
                        format: "json"
                    }
                })
                .then(
                    function (result) {
                        console.log(result.data);
                        $scope.user = result.data;
                    });

        } else {
            alert('Not signed in!'); //href="#/app/profile"
        }
    }

    $scope.loggedUser = function () {
        if (!window.localStorage.hasOwnProperty("accessToken")) {
            $scope.modal.show();
        }
    }

    $scope.logout = function () {
        $rootScope.$broadcast('logout');
        $ionicSideMenuDelegate.toggleLeft();
    }

    $scope.$on('logout', function () {
        ngFB.logout();
        console.log('logout')
        localStorage.clear();
        Friends.clearDatabase();
        $rootScope.$broadcast('bdPopulated');

        $scope.user = null;
        $scope.modal.show();
    });


})

.controller('FriendsCtrl', function ($scope, $stateParams, $ionicLoading, $rootScope, Friends, sharedService) {

    $scope.$on('bdPopulated', function () {
        Friends.getTop10()
            .then(function (fs) {
                $scope.friends = fs;
                $ionicLoading.hide();
            });
    });

    $scope.searchKey = "";

    $scope.clearSearch = function () {
        $scope.searchKey = "";
        $rootScope.$broadcast('bdPopulated');
    }

    $scope.friendsBkp;

    $scope.search = function () {
        if ($scope.searchKey.length > 2) {
            Friends.searchFriends($scope.searchKey)
                .then(function (fs) {
                    $scope.friends = fs
                });
        } else {
            Friends.getTop10()
                .then(function (fs) {
                    $scope.friends = fs;
                });
        }
    };

    $scope.$on('$ionicView.enter', function (e) {
        if ($scope.searchKey.length == 0)
            Friends.getTop10().then(function (fs) {
                $scope.friends = fs
            });
    });

})

.controller('FriendCtrl', function ($scope, $stateParams, $rootScope, $ionicPopup, Friends) {
    var friendId = $stateParams.friendId;

    Friends.getFriendByID(friendId).then(function (result) {
        $scope.friend = result;
    });

    $scope.data = {};

    $scope.incrementPopup = function () {

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="number" step="0.01" min="0" ng-model="data.debt">',
            title: 'Aumentar a dívida',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    onTap: function () {
                        myPopup.close();
                    }
                },
                {
                    text: '<b>Salvar</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        if (!$scope.data.debt) {
                            e.preventDefault();
                            myPopup.close();
                        } else {
                            return $scope.data.debt;
                        }
                    }
                },
            ]
        });
        myPopup.then(function (res) {
            var newFriend = angular.copy($scope.friend);
            newFriend.debt = $scope.friend.debt + res;

            Friends.updateFriend($scope.friend, newFriend)
                .then(function () {
                    Friends.getFriendByID(friendId)
                        .then(function (result) {
                            $scope.friend = result;
                        })
                });
        });
    };

    $scope.decrementPopup = function () {

        $scope.data = {};

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="number" step="0.01" min="0" ng-model="data.credit">',
            title: 'Diminuir a dívida',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    onTap: function () {
                        myPopup.close();
                    }
                },
                {
                    text: '<b>Salvar</b>',
                    type: 'button-positive',
                    onTap: function (e) {
                        if (!$scope.data.credit) {
                            e.preventDefault();
                            myPopup.close();
                        } else {
                            return $scope.data.credit;
                        }
                    }
                },
            ]
        });
        myPopup.then(function (res) {
            var newFriend = angular.copy($scope.friend);
            newFriend.debt = $scope.friend.debt - res;

            Friends.updateFriend($scope.friend, newFriend)
                .then(function () {
                    Friends.getFriendByID(friendId)
                        .then(function (result) {
                            $scope.friend = result;
                        })
                });
        });
    };

    $scope.editMember = function (origFriend, editFriend) {
        Friends.update(origFriend, editFriend);
        $rootScope.$broadcast('bdPopulated');
    };
})

.controller('ProfileCtrl', function ($http, $scope, $location, $cordovaSQLite, ngFB, Friends) {});
