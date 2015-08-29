'use strict';

function FriendCtrl($scope, $stateParams, $rootScope, $ionicPopup, $timeout, Friends, Payments) {
    var friendId = $stateParams.friendId;

    Friends.getFriendByID(friendId).then(function (result) {
        $scope.friend = result;
        
        if(result.newFriend){
            $scope.incrementPopup();               
               
            $timeout(function() {
                cordova.plugins.Keyboard.show();
            }, 1000);
            
            Friends.setOldFriend(result);
        }

        Payments.getAllPaymentsFromFriend($scope.friend)
                        .then(function(payments){
                            $scope.friend.payments = payments;
                        });

    });    


    $scope.data = {};
    $scope.data.debt = 0;
    $scope.incrementPopup = function () {

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<h4>Valor</h4><input type="text" id="debit" autofocus="true" step="0.01" min="0" ng-model="data.debt" ui-money-mask>'+
                      '<h4>Descrição <small>opcional</small></h4><input type="text" maxlength="10" ng-model="data.description">',
            title: 'Aumentar a dívida',
            scope: $scope,
            focusFirstInput: true,
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
                            return $scope.data;
                        }
                    }
                },
            ]
        });
        myPopup.then(function (res) {
            console.log(res)
            if(res.debt){
                var newFriend = angular.copy($scope.friend);
                newFriend.debt = $scope.friend.debt + res.debt;            

                Friends.updateFriend($scope.friend, newFriend)
                    .then(function () {
                        Friends.getFriendByID(friendId)
                            .then(function (result) {
                                $scope.friend = result;
                            })
                    });

                Payments.addPayment($scope.friend, res.debt, 1, res.description)
                    .then(function(){
                        Payments.getAllPaymentsFromFriend($scope.friend)
                            .then(function(payments){
                                $scope.friend.payments = payments;
                                console.log('payments', JSON.stringify($scope.friend), payments)
                            });
                    });

                res.debt = 0;
                res.description = '';
            }else{
                cordova.plugins.Keyboard.close();
            }
        });
    };

    $scope.decrementPopup = function () {

        $scope.data = {};

        // An elaborate, custom popup
        var myPopup = $ionicPopup.show({
            template: '<h4>Valor</h4><input type="text" step="0.01" min="0" ng-model="data.credit" ui-money-mask>'+
                      '<h4>Descrição <small>optional</small></h4><input type="text" maxlength="10" ng-model="data.description">',
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
                            return $scope.data;
                        }
                    }
                },
            ]
        });
        myPopup.then(function (res) {
            if(res.credit){
                var newFriend = angular.copy($scope.friend);
                newFriend.debt = $scope.friend.debt - res;

                Friends.updateFriend($scope.friend, newFriend)
                    .then(function () {
                        Friends.getFriendByID(friendId)
                            .then(function (result) {
                                $scope.friend = result;
                            })
                    });

                Payments.addPayment($scope.friend, res.credit, 0, res.description)
                    .then(function(){
                        Payments.getAllPaymentsFromFriend($scope.friend)
                            .then(function(payments){
                                $scope.friend.payments = payments;                        
                            });
                    });         

                res.credit = 0;
                res.description = '';
            }else{
                cordova.plugins.Keyboard.close();
            }
        });
    };

    $scope.editMember = function (origFriend, editFriend) {
        Friends.update(origFriend, editFriend);
        $rootScope.$broadcast('bdPopulated');
    };
};

angular
	.module('calote.controllers')
		.controller('FriendCtrl', FriendCtrl);