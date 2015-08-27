'use strict';

function ContactsService($q) {

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
                    console.log(JSON.stringify(contact), contact.phonesNumbers !== 'undefined')
                    if(contact)
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
    }

angular
	.module('calote.services')
		.service('ContactsService', ContactsService);