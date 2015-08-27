'use strict';

function AppCtrl($http, $scope, $ionicModal, $timeout, $location, $q, $ionicLoading, Friends, Payments, ngFB, LoginService, $rootScope, $ionicSideMenuDelegate, PushProcessingService) {

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    $scope.$watch(function () {
        return $ionicSideMenuDelegate.getOpenRatio();
      },
        function (ratio) {
            console.log(ratio && LoginService.isLoggedUser())
          if (ratio && LoginService.isLoggedUser()){           
            $scope.getUserAmounts();
          }
    });

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    // $scope.$on('$ionicView.enter', function (e) {
    //   console.log('isLoggedUser ' + LoginService.isLoggedUser()); 
    //});

    // Form data for the login modal
    $scope.loginData = {};

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

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
                                $scope.getUserAmounts()
                                $scope.initNotificationService();
                            }, function(error){
                                console.log(error)
                            });
                    });

        } else {
            $scope.fbLogin();
            //alert('Not signed in!'); //href="#/app/profile"
        }
    }

    $scope.initNotificationService = function(){
        PushProcessingService.initialize();
    }

    $scope.loggedUser = function () {

        console.log('Tem accessToken ', window.localStorage.hasOwnProperty("accessToken"))
        if (!window.localStorage.hasOwnProperty("accessToken")) {
            
        } else {
            LoginService.getUser()
                .then(function(user){
                    $scope.user = user[0];
                }, function(error){
                    console.log(error)
                });
        }
    }

    $scope.getUserAmounts = function(){
        Payments.getAmount().then(function(result){
            console.log(result)
             $scope.user.amount = result.amount;
        });
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
}

angular
    .module('calote.controllers')
        .controller('AppCtrl', AppCtrl);