define(['yshi.class'], function(Class) {
    var BaseModel = Class.create(Object, function(data) {
        this._data = data;
    });

    BaseModel.__new__ = function(Cls, data) {
        return new Cls(data);
    };

    BaseModel.prototype.get = function(attr_name) {
        if (this._data.hasOwnProperty(attr_name)) {
            return this._data[attr_name];
        } else {
            throw 'no such property ' + attr_name + ' on ' + this;
        }
    };

    var MangaChapter = YSHI.Class.create(BaseModel, function(data) {
        Class.fake_super(MangaChapter, this, 'constructor')(data);
    });

    MangaChapter.prototype.__defineGetter__('volume', function() {
        return this.get('volume');
    });

    MangaChapter.prototype.__defineGetter__('chapter', function() {
        return this.get('chapter');
    });

    return {
        'MangaChapter': MangaChapter
    };
});
