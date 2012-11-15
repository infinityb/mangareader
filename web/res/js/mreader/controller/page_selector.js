define([
    'deferred',
    'yshi.class',
    'mreader/rpc',
    'mreader/reqtypes',
    'mreader/models',
    'yshi.template'
], function(
    deferred,
    Class,
    rpc,
    rt,
    Models,
    Template
) {
    'use strict';
    var selector_tpl = new Template(function(data) {
        var $ = this.tags;
        return $.div(
            $.select({'class': 'manga'}),
            $.select({'class': 'volch'}),
            $.select({'class': 'page'})
        );
    });

    var manga_option = new Template(function(manga) {
        var $ = this.tags;
        return $.option({'value': manga.dir},
            manga.name + ' [' + manga.scanlator + '][' + manga.language + ']');
    });

    var chapter_option = new Template(function(chapt) {
        var $ = this.tags;
        return $.option(
            {'value': chapt.chapter},
            'v' + chapt.volume + '. ' +
            'ch' + chapt.chapter.toString() + ' ' +
                chapt.get('title') + ' [' + chapt.get('scanlator') + ']');
    });

    var page_option = new Template(function(page) {
        return this.tags.option(
            {'value': page.filename}, page.filename);
    });

    var PageSelector = Class.create(Object, function() {
        var that = this;

        this._ready = new deferred.Deferred();
        this._cache = {'manga': {}};
        this._current_manga = null;
        this._current_chapter = null;

        this._event_listeners_changed = [];

        this._root = document.createElement('div');
        this._root.appendChild(selector_tpl.render());

        this._sel_manga = this._root.getElementsByClassName('manga')[0];
        this._sel_manga.addEventListener('change', function(evt) {
            if (evt.target.value !== '') {
                that._manga_selected(evt);
            } else {
                that._nomanga_selected();
            }
        });

        this._sel_volch = this._root.getElementsByClassName('volch')[0];
        this._sel_volch.addEventListener('change', function(evt) {
            that._chapter_selected(evt);
        });

        this._sel_page = this._root.getElementsByClassName('page')[0];
        this._sel_page.addEventListener('change', function(evt) {
            that._page_selected(evt);
        });

        rpc.call(new rt.RootList()).then(function(resp) {
            try {
                var mangay = resp.getManga();
                that._sel_manga.appendChild(document.createElement('option'));
                for (var i = 0; i < mangay.length; i++) {
                    var manga = mangay[i];
                    that._sel_manga.appendChild(manga_option.render(manga));
                }
                that._ready.resolve();
            } catch (e) {
                console.log(e.stack);
            }
        });
    });

    PageSelector.prototype.__defineGetter__('ready_deferred', function() {
        return this._ready;
    });

    PageSelector.prototype.goToPage = function(name, chap_num, page_idx) {
        var that = this;
        var i;
        var opts = this._sel_manga.options;
        for (i = 0; i < opts.length; i++) {
            if (opts[i].value === name) {
                this._sel_manga.selectedIndex = i;
                break;
            }
        }
        this._set_current_manga(name).then(function() {
            try {
                opts = that._sel_volch.options;
                for (i = 0; i < opts.length; i++) {
                    if (opts[i].value === chap_num) {
                        that._sel_volch.selectedIndex = i;
                        break;
                    }
                }
                that._sel_page.selectedIndex = page_idx;
                that._event_changed();
            } catch (e) {
                console.log(e.stack);
            }
        });
    };

    PageSelector.prototype.addEventListener = function(type, func) {
        if (type === 'change') {
            this._event_listeners_changed.push(func);
        } else {
            throw 'Unknown type ' + type;
        }
    };

    PageSelector.prototype._event_changed = function() {
        var event = {
            'type': 'change',
            'cursor': new Models.MangaCursor(this._current_manga,
                this._sel_volch.selectedIndex, this._sel_page.selectedIndex),
            'page': null,
            'target': this,
            'chapter_idx': this._sel_volch.selectedIndex,
            'page_idx': this._sel_page.selectedIndex
        };
        _.each(this._event_listeners_changed, function(f) {
            try {
                f(event);
            } catch (e) {
                console.log(e.stack);
            }
        });
    };

    PageSelector.prototype.setCursor = function(cur) {
        if (cur._manga === this._current_manga) {
            this._sel_volch.selectedIndex = cur._chapter_idx;
            this._sel_page.selectedIndex = cur._page_idx;
            this._event_changed();
        } else {
            throw 'Bad manga for cursor.';
        }
    };

    PageSelector.prototype._nomanga_selected = function() {
        this._sel_volch.innerHTML = '';
        this._sel_page.innerHTML = '';
    };

    PageSelector.prototype._manga_selected = function(evt) {
        this._set_current_manga(evt.target.value);
        this._event_changed();
    };

    PageSelector.prototype._set_current_manga = function(manga_key) {
        var that = this;
        var rpc_res;
        var retval = new deferred.Deferred();
        if (typeof this._cache['manga'][manga_key] === 'undefined') {
            rpc_res = rpc.call(new rt.MangaData(manga_key));
            rpc_res.then(function(resp) {
                try {
                    that._cache['manga'][manga_key] = resp;
                } catch (e) {
                    console.log(e.stack);
                }
                return resp;
            });
        } else {
            rpc_res = new deferred.Deferred();
            rpc_res.resolve(this._cache['manga'][manga_key]);
        }

        rpc_res.then(function(resp) {
            try {
                var i;
                var chapter;
                var manga = resp.getManga();
                that._current_manga = manga;
                that._sel_volch.innerHTML = '';

                for (i = 0; i < manga.chapters.length; i++) {
                    chapter = manga.chapters[i];
                    that._sel_volch.appendChild(chapter_option.render(chapter));
                }
                that._sel_page.innerHTML = '';
                _.each(manga.chapters[0].pages, function(page, index) {
                    that._sel_page.appendChild(
                        page_option.render(page));
                });
                retval.resolve();
            } catch (e) {
                console.log(e.stack);
            }
            return resp;
        });
        return retval;
    };

    PageSelector.prototype._chapter_selected = function(evt) {
        var that = this;
        if (this._current_manga === null) return;

        var chapters = this._current_manga.chapters;
        var chapter = chapters[evt.target.selectedIndex];
        that._sel_page.innerHTML = '';
        _.each(chapter.pages, function(page) {
            that._sel_page.appendChild(page_option.render(page));
        });
        that._event_changed();
    };

    PageSelector.prototype._page_selected = function(evt) {
        this._event_changed();
    };

    return PageSelector;
});
