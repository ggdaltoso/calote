'use strict';

function FriendsCtrl($scope, $stateParams, $ionicLoading, $rootScope, $ionicFilterBar, $ionicPopup, $state, Friends, Payments, ContactsService){

    $scope.$on('bdPopulated', function () {
        console.log('rootScope bdPopulated')
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
                    var _contact = contact;
                    $rootScope.$broadcast('newFriend');
                    Friends.addFriend(contact).then(function(success){
                        console.log('sucesso!', success, _contact);
                        
                        $state.go('app.friend', { friendId : _contact.id } )
                        
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

    $scope.notify = function(friend){
        showAlert('Notificação', friend.name);
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

};

angular
	.module('calote.controllers')
		.controller('FriendsCtrl', FriendsCtrl);