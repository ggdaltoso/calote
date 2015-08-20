angular.module('starter.controllers', ['starter.services', 'ngOpenFB'])

.controller('AppCtrl', function ($http, $scope, $ionicModal, $timeout, $location, $q, $ionicLoading, Friends, Payments, ngFB, LoginService, $rootScope, $ionicSideMenuDelegate) {

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
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
    $scope.login = function() {
        LoginService.loginUser($scope.data.username, $scope.data.password).success(function(data) {
            
        }).error(function(data) {
            var alertPopup = $ionicPopup.alert({
                title: 'Login failed!',
                template: 'Please check your credentials!'
            });
        });
    }

    $scope.fbLogin = function () {
        ngFB.login({
            scope: 'email'
        }).then(
            function (response) {
                if (response.status === 'connected') {
                    window.localStorage.accessToken = response.authResponse.accessToken;
                    initUser();
                } else {
                    alert('Facebook login failed');
                }
            },
            function (err) {
                alert('Facebook login failed' + err);
            });
    };

    var changeModalText = function (text) {
        $ionicLoading
            .show({
                template: text
            });
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
                        
                        LoginService.loginUser(result.data)
                            .then(function(user){
                                $scope.user = user[0];
                                $scope.isLoggedUser = true;
                            }, function(error){
                                console.log(error)
                            });

                        $scope.user = result.data;
                    });

        } else {
            $scope.fbLogin();
            //alert('Not signed in!'); //href="#/app/profile"
        }
    }

    $scope.loggedUser = function () {

        console.log('Tem accessToken ', window.localStorage.hasOwnProperty("accessToken"))
        if (!window.localStorage.hasOwnProperty("accessToken")) {
            
        } else {
            LoginService.getUser()
                .then(function(user){
                    console.log(user)
                    $scope.user = user[0];
                }, function(error){
                    console.log(error)
                });
        }
    }

    $scope.loggedUser();

    $scope.logout = function () {
        ngFB.logout();
        console.log('logout')
        localStorage.clear();
        Friends.clearDatabase();
        Payments.clearDatabase();
        LoginService.clearDatabase();
        $rootScope.$broadcast('bdPopulated');
        $scope.user = null;
    }
})

.controller('FriendsCtrl', function ($scope, $stateParams, $ionicLoading, $rootScope, $ionicFilterBar, $ionicPopup, Friends, Payments, ContactsService){

    $scope.$on('bdPopulated', function () {
        Friends.getAllFriends()
            .then(function (fs) {
                $scope.friends = fs;
            });
    });

    $scope.searchKey = "";

    $scope.search = function () {
        console.log('search', $scope.searchKey)

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

    $scope.deleteFriend = function(friend){
        var confirmPopup = $ionicPopup.confirm({
            title: 'Deletar caloteiro',
            template: 'Tem certeza que deseja deletar '+ friend.name + ' da sua lista?'
        });

       confirmPopup.then(function(res) {
         if(res) {
           Friends.removeFriend(friend).then(function(){            
                $rootScope.$broadcast('bdPopulated');
           });  
         } else {            
         }
       });
    }

    $scope.pickContact = function() {
        ContactsService.pickContact().then(
                function(contact) {
                    console.log(contact);
                    Friends.addFriend(contact).then(function(success){
                        console.log('sucesso!');
                        $rootScope.$broadcast('bdPopulated');
                    }, function(error){
                        alert(error);
                    });
                },
                function(failure) {
                    alert("Escolha um contato com um número de telefone!");
                }
            );
    }

    $scope.showFilterBar = function () {
      filterBarInstance = $ionicFilterBar.show({
        items: $scope.friends,
        update: function(filteredFriends){
            $scope.friends = filteredFriends;
        }
      });
    };

    $scope.refreshItems = function () {
      if (filterBarInstance) {
        filterBarInstance();
        filterBarInstance = null;
      }
    }

    $scope.$on('$ionicView.enter', function (e) {
        if ($scope.searchKey.length == 0)
            Friends.getTop10().then(function (fs) {
                $scope.friends = fs
            });
    });

})

.controller('FriendCtrl', function ($scope, $stateParams, $rootScope, $ionicPopup, Friends, Payments) {
    var friendId = $stateParams.friendId;

    Friends.getFriendByID(friendId).then(function (result) {
        $scope.friend = result;
        Payments.getAllPaymentsFromFriend($scope.friend)
                        .then(function(payments){
                            $scope.friend.payments = payments;
                        });
    });

    $scope.data = {};

    $scope.listCanSwipe = true;

    $scope.notify = function(friend){
        alert('Marcelinha')
    }

    $scope.incrementPopup = function () {

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<input type="number" step="0.01" min="0" ng-model="data.debt">',
            title: 'Aumentar a dívida',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancelar',
                    onTap: function (e) {
                        return 0;
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

            Payments.addPayment($scope.friend, res, true)
                .then(function(){
                    Payments.getAllPaymentsFromFriend($scope.friend)
                        .then(function(payments){
                            $scope.friend.payments = payments;
                            console.log('payments', JSON.stringify($scope.friend), payments)
                        });
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
                    text: 'Cancelar',
                    onTap: function (e) {
                        return 0;
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

            Payments.addPayment($scope.friend, res, false)
            .then(function(){
                Payments.getAllPaymentsFromFriend($scope.friend)
                    .then(function(payments){
                        $scope.friend.payments = payments;                        
                    });
            });
        });
    };

    $scope.editMember = function (origFriend, editFriend) {
        Friends.update(origFriend, editFriend);
        $rootScope.$broadcast('bdPopulated');
    };
})

.controller('ProfileCtrl', function ($http, $scope, $location, $cordovaSQLite, ngFB, Friends) {});
