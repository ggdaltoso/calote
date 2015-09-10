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
          if (ratio && LoginService.isLoggedUser()){           
            $scope.getUserAmounts();
          }
    });

    $scope.user = {};    
    $scope.countrycode = "BR";
    $scope.phoneNumber = null;

    $scope.$watch('phoneNumber', function(newValue, oldValue) {
      console.log(newValue, oldValue);
    });

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
     $scope.$on('$ionicView.enter', function (e) {

       var deviceInfo = cordova.require("cordova/plugin/DeviceInformation");
        deviceInfo.get(function(result) {
                var result = JSON.parse(result);
                $scope.user.email = result.account0Name || '';
                $scope.device = result;
                console.log($scope.user, $scope.device)
            }, function() {
                console.log("error");
            });
    });

     
function success(phonenumber) {
    console.log("My number is " + phonenumber);
}

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
                    $scope.loginData.fbAccessToken = response.authResponse.accessToken;

                    initUser();
                } else {
                    alert('Facebook login failed');
                }
            },
            function (err) {
                //alert('Facebook login failed');
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
                        fields: "id,name,picture,email",
                        format: "json"
                    }
                })
                .then(
                    function (result) {
                        var user = result.data;

                        $scope.loginData.email = user.email;
                        $scope.loginData.id = user.id;
                        $scope.loginData.name = user.name;  

                        var imageUrl = "http://graph.facebook.com/"
                                        + user.id
                                        + "/picture?width=270&height=270";


                        convertImgToBase64(imageUrl, function(base64Img){
                            $scope.loginData.picture = base64Img;

                            LoginService.loginUser($scope.loginData)
                            .then(function(user){
                                $scope.user = user[0];
                                $scope.isLoggedUser = true;
                                $scope.getUserAmounts();                                
                            }, function(error){
                                showAlert('Login', error)
                            });

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

    function convertImgToBase64(url, callback, outputFormat){
        var img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function(){
            var canvas = document.createElement('CANVAS');
            var ctx = canvas.getContext('2d');
            canvas.height = this.height;
            canvas.width = this.width;
            ctx.drawImage(this,0,0);
            var dataURL = canvas.toDataURL(outputFormat || 'image/png');
            callback(dataURL);
            canvas = null; 
        };
        img.src = url;
    }

    $scope.loggedUser = function () {
        $scope.initNotificationService(); 

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

    var showAlert = function(titleMsg, msg) {
     var alertPopup = $ionicPopup.alert({
       title: titleMsg,
       template: msg
     });
     alertPopup.then(function(res) {
       console.log('Thank you for not eating my delicious ice cream cone');
     });
   };
}

angular
    .module('calote.controllers')
        .controller('AppCtrl', AppCtrl);