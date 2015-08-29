var db = null;

angular.module('calote.services', ['ngResource']);
angular.module('calote.controllers', ['calote.services', 'ngOpenFB']);

angular.module('calote', ['ionic', 'calote.controllers', 'calote.services', 'jett.ionic.filter.bar', 'ion-fab-button', 'ui.utils.masks', 'ngOpenFB', 'ngCordova'])

.run(function ($ionicPlatform, ngFB, $cordovaSQLite) {

    ngFB.init({
        appId: '804333932968844'
    });

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

            tx.executeSql("CREATE TABLE IF NOT EXISTS friend (id text primary key, name text, picture text, debt long default 0, newFriend int default 1)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS payments (id text prymary key, friendId text, howMuch long default 0, creditOrDebit integer, description text default '', dataPayment datetime)");
            tx.executeSql("CREATE TABLE IF NOT EXISTS user (id text primary key, name text, picture text, email text, GCMID text)")
            /* test */
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?,?)", ["+55 16 8100 0342","Gabriel",".img/default.png", 10]);
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?,?)", ["+55 16 8100 0343","Jhonny",".img/default.png", 20]);
            tx.executeSql("INSERT INTO friend (id, name, picture, debt) VALUES (?,?,?,?)", ["+55 16 8100 0344","Marcela",".img/default.png", 35]);
            tx.executeSql("INSERT INTO payments (friendId, howMuch, creditOrDebit, description, dataPayment) VALUES (?,?,?,?,?)", ["+55 16 8100 0342",10,0,"Pastel","2015-08-16T13:58:56.588Z"]);
            tx.executeSql("INSERT INTO payments (friendId, howMuch, creditOrDebit, description, dataPayment) VALUES (?,?,?,?,?)", ["+55 16 8100 0342",20,1,"Viagem","2015-08-16T13:58:56.588Z"]);
            
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


function onNotificationGCM(e) {
    console.log('EVENT > RECEIVED:' + e.event + '');
    switch( e.event )
    {
        case 'registered':
            if ( e.regid.length > 0 )
            {
                console.log('REGISTERED with GCM Server > REGID:' + e.regid + ';');
 
                //call back to web service in Angular.
                //This works for me because in my code I have a factory called
                //      PushProcessingService with method registerID
                var elem = angular.element(document.querySelector('[ng-app]'));
                var injector = elem.injector();
                var myService = injector.get('PushProcessingService');
                myService.registerID(e.regid);
            }
            break;
 
        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground)
            {
                //we're using the app when a message is received.
                console.log('--INLINE NOTIFICATION--' + '');
 
                // if the notification contains a soundname, play it.
                //var my_media = new Media(&quot;/android_asset/www/&quot;+e.soundname);
                //my_media.play();
                alert(e.payload.message);
            }
            else
            {
                // otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart)
                    console.log('--COLDSTART NOTIFICATION--' + '');
                else
                    console.log('--BACKGROUND NOTIFICATION--' + '');
 
                // direct user here:
                window.location = 'app.friends';
            }
 
            console.log('MESSAGE > MSG: ' + e.payload.message + '');
            console.log('MESSAGE: '+ JSON.stringify(e.payload));
            break;
 
        case 'error':
            console.log('ERROR > MSG:' + e.msg + '');
            break;
 
        default:
            console.log('EVENT > Unknown, an event was received and we do not know what it is');
            break;
    }
};
