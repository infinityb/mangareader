define([
    'yshi.class',
    'underscore'
], function(
    Class,
    _
) {
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

    var MangaCollection = YSHI.Class.create(BaseModel, function(data) {
        Class.fake_super(MangaCollection, this, 'constructor')(data);

    });

    var Manga = YSHI.Class.create(BaseModel, function(data, base_path) {
        Class.fake_super(Manga, this, 'constructor')(data);
        this._base_path = base_path;

        var chapter;
        this._inv_vols = Manga.invert_volume_dict(this.get('volumes'));
        this._chapters = [];

        for (var i = 0; i < this.get('chapters').length; i++) {
            chapter = _.clone(this.get('chapters')[i]);
            chapter['vol'] = this._inv_vols[chapter.ch];
            this._chapters.push(new MangaChapter(chapter, this));
        }
    });

    Manga.invert_volume_dict = function(vol_dict) {
        var out = {};
        _.each(_.pairs(vol_dict), function(stuff) {
            var volno = stuff[0], chapters = stuff[1];
            _.each(chapters, function(chno) {
                out[chno] = parseInt(volno);
            });
        });
        return out;
    };

    Manga.prototype.toString = function() {
        return '[new Manga()]';
    };

    Manga.prototype.__defineGetter__('chapters', function() {
        return this._chapters;
    });

    var MangaChapter = YSHI.Class.create(BaseModel, function(data, manga) {
        Class.fake_super(MangaChapter, this, 'constructor')(data);
        this._manga = manga;
        this._pages = [];
        for (var i = 0; i < this.get('pages').length; i++) {
            this._pages.push(new MangaPage(
                this._manga, this, this.get('pages')[i]));
        }
    });

    MangaChapter.prototype.__defineGetter__('volume', function() {
        return this.get('vol');
    });

    MangaChapter.prototype.__defineGetter__('chapter', function() {
        return this.get('ch');
    });

    MangaChapter.prototype.__defineGetter__('pages', function() {
        return this._pages;
    });

    var MangaPage = YSHI.Class.create(BaseModel, function(manga, chapter, filename) {
        Class.fake_super(MangaPage, this, 'constructor')();
        if (manga === null) {
            throw new 'Invalid Manga';
        }
        this._manga = manga;
        this._chapter = chapter;
        this._filename = filename;
    });

    MangaPage.prototype.__defineGetter__('image_url', function() {
        return (
            this._manga.get('base_path') + '/' +
            this._chapter.get('path') + '/' +
            this._filename);

    });

    MangaPage.prototype.__defineGetter__('filename', function() {
        return this._filename;
    });

    var MangaCursor = YSHI.Class.create(Object, function(
            manga_inst, chapter_idx, page_idx) {

        if (manga_inst === null) {
            throw 'Invalid Manga';
        }
        Class.fake_super(MangaCursor, this, 'constructor')();
        this._manga = manga_inst;
        this._chapter_idx = chapter_idx;
        this._page_idx = page_idx;
    });

    MangaCursor.prototype.nextCursor = function() {
        var chapters = this._manga.chapters;
        var pages = chapters[this._chapter_idx].pages;

        if (this._page_idx + 1 < pages.length) {
            return new MangaCursor(
                this._manga,
                this._chapter_idx,
                this._page_idx + 1);
        } else if (this._chapter_idx + 1 < chapters.length) {
            return new MangaCursor(
                this._manga,
                this._chapter_idx + 1,
                0);
        } else {
            return null;
        }
    };

    MangaCursor.prototype.prevCursor = function() {
        var chapters = this._manga.chapters;
        var pages = chapters[this._chapter_idx].pages;

        if (0 < this._page_idx) {
            return new MangaCursor(
                this._manga,
                this._chapter_idx,
                this._page_idx - 1);
        } else if (0 < this._chapter_idx) {
            return new MangaCursor(
                this._manga,
                this._chapter_idx - 1,
                chapters[this._chapter_idx - 1].pages.length - 1);
        } else {
            return null;
        }
    };

    MangaCursor.prototype.toUrlHash = function() {
        return ('#' + this._manga.get('base_path') + ',' +
            this._manga.chapters[this._chapter_idx].chapter + ',' +
            this._page_idx.toString());
    };

    MangaCursor.prototype.toString = function() {
        return "[new MangaCursor(..., "+this._chapter_idx+", "+this._page_idx+")]";
    };

    MangaCursor.prototype.getPage = function() {
        return (this._manga.
            chapters[this._chapter_idx].
            pages[this._page_idx]);
    };

    return {
        'Manga': Manga,
        'MangaChapter': MangaChapter,
        'MangaPage': MangaPage,
        'MangaCursor': MangaCursor
    };
});
