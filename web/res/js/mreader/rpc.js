define([
    'deferred'
], function(
    deferred
) {
    'use strict';

    var call = function(req_obj) {
        var def = new deferred.Deferred();

        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (req.readyState == 4) {
                var RType = req_obj.constructor.Response;
                var data = JSON.parse(req.response);
                def.resolve(new RType(data));
            } else {

            }
        };
        console.info("call(", req_obj.method, req_obj.url, ")");
        req.open(req_obj.method, req_obj.url);
        req.send();

        return def;
    };

    return {
        'call': call
    };
});
