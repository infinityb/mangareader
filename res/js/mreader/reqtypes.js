define([
    'yshi.class',
    'underscore',
    'mreader/models'
], function(
    Class,
    _,
    Models
) {
    'use strict';

    var exports = {};

    var BaseReq = Class.create(Object, function() {});

    BaseReq.prototype.__defineGetter__('url', function() {
        return this.constructor.url;
    });

    BaseReq.prototype.__defineGetter__('method', function() {
        return this.constructor.method;
    });

    var BaseResp = Class.create(Object, function(data) {
        this._data = data;
    });

    BaseResp.prototype.get_data = function() {
        return this._data;
    };

    var RootList = (function() {
        var Response = Class.create(BaseResp, function(data) {
            Class.fake_super(Response, this, 'constructor')(data);
        });

        Response.prototype.getManga = function() {
            return _.map(this._data.manga, function(manga) {
                return manga;
            });
        };

        var Request = Class.create(BaseReq, function() {
            //
        });

        Request['url'] = 'data/meta.json';
        Request['method'] = 'GET';
        Request['Response'] = Response;

        return Request;
    }());
    exports['RootList'] = RootList;

    var MangaData = (function() {
        var Response = Class.create(BaseResp, function(data) {
            Class.fake_super(Response, this, 'constructor')(data);
        });

        Response.prototype.getManga = function() {
            return new Models.Manga(this._data);
        };

        var Request = Class.create(BaseReq, function(dir_name) {
            this._dir_name = dir_name;
        });

        Request.prototype.__defineGetter__('url', function() {
            return 'data/' + this._dir_name + '/meta.json';
        });
        Request['method'] = 'GET';
        Request['Response'] = Response;

        return Request;
    }());
    exports['MangaData'] = MangaData;

    return exports;
});
