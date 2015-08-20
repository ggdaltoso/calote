var db = null;

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'jett.ionic.filter.bar', 'ion-fab-button', 'ngOpenFB', 'ngCordova'])

.run(function ($ionicPlatform, ngFB, $cordovaSQLite) {

    ngFB.init({
        appId: '804333932968844'
    })

    $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleDefault();
        }

        if (window.cordova) {
            // App syntax        
            db = $cordovaSQLite.openDB("mepague.db");
        } else {
            // Ionic serve syntax
            db = window.openDatabase('mepague.db', '1.0', "Me Pague",  2 * 1024 * 1024);
        }
   
        db.transaction(function (tx) {

            console.log('transaction init');

            tx.executeSql("DROP TABLE IF EXISTS friend");
            tx.executeSql("DROP TABLE IF EXISTS payments");
            //tx.executeSql("DROP TABLE IF EXISTS user");

            tx.executeSql("CREATE TABLE IF NOT EXISTS friend (id text primary key, name text, picture text, debt long default 0)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS payments (id text prymary key, friendId text, howMuch long default 0, creditOrDebit integer, dataPayment datetime)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS user (id text primary key, name text, picture text)")
            /* test */
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", ["+55 16 8100 0342","Gabriel",".img/default.png"]);
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", ["+55 16 8100 0343","Jhonny",".img/default.png"]);
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?, 0)", ["+55 16 8100 0344","Marcela",".img/default.png"]);
            tx.executeSql("INSERT INTO payments (friendId, howMuch, creditOrDebit, dataPayment) VALUES (?,?,?,?)", ["+55 16 8100 0342",10,false,"2015-08-16T13:58:56.588Z"]);
            tx.executeSql("INSERT INTO payments (friendId, howMuch, creditOrDebit, dataPayment) VALUES (?,?,?,?)", ["+55 16 8100 0342",10,true,"2015-08-16T13:58:56.588Z"]);
            
            console.log('transaction ends');
        });
    });

})

.config(function ($stateProvider, $urlRouterProvider, $ionicFilterBarConfigProvider, $compileProvider) {

    $ionicFilterBarConfigProvider.placeholder('Nome');

    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file|blob|content):|data:image\//);

    $stateProvider
        .state('app', {
        url: "/app",
        abstract: true,
        templateUrl: "templates/menu.html",
        controller: 'AppCtrl'
    })

    .state('app.friends', {
        url: "/friends",
        views: {
            'menuContent': {
                templateUrl: "templates/friends.html",
                controller: 'FriendsCtrl'
            }
        }
    })

    .state('app.friend', {
        url: "/friend/:friendId",
        views: {
            'menuContent': {
                templateUrl: "templates/friend.html",
                controller: 'FriendCtrl'
            }
        }
    })

    .state('app.profile', {
        url: "/profile",
        views: {
            'menuContent': {
                templateUrl: "templates/profile.html",
                controller: "ProfileCtrl"
            }
        }
    });


    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/friends');
});
