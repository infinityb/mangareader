define(['yshi.template'], function(Template) {
    'use strict';
    return new YSHI.Template(function(data) {
        var $ = this.tags;
        return $.div(
            $.select({'class': 'manga'}),
            $.select({'class': 'volch'}),
            $.select({'class': 'page'})
        );
    });
});
