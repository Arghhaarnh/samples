// ==UserScript==
// @name         Steamgift game filter
// @version      1.0
// @description  You can like\unlike the games on steamgift to mark them in the list
// @author       Blood_again
// @match        http://www.steamgifts.com/*
// @require		 https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// ==/UserScript==


SPS_SteamgiftLikes = function() {};
// site dependent settings
SPS_SteamgiftLikes._gameWrapperSelector = '.giveaway__row-outer-wrap';
SPS_SteamgiftLikes._iconClass = 'sps_sgld_button';
SPS_SteamgiftLikes._settingsUrlPattern = '';
SPS_SteamgiftLikes._gameListUrlPattern = '';

// Icons by Andy (http://steamcommunity.com/profiles/76561198063102286)
SPS_SteamgiftLikes._like_style = { 
    'icon' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAIAAADYhlU4AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAN5JREFUSEvtkUEWgyAQQ3u/3sazeh+b1gQhgtCW2Zn3V2TMX/h4Lms0t2OccMe2bbEOCGIduwCJcnD+kxAHt5X5Dg4reJns4LCyP850cFhJ79McHFbyao6Dw4q1ExwcVqwFbwfLWt2FXyrW7hQOJO+68BvF2oQ7kLy+gNeKtTn8HzxUUt2Cd4q1xvHPea6k9zO8UKw9czgAP1LyKsFOsbZK4QD8VPmqbeEOwAGl+96l4gCcacfur6k7AMdqscsuTQfgZBm7GeHKATisWDtIxwE4/6sA9B3/czvGiXcs6wvihol3l6PLqQAAAABJRU5ErkJggg==',
    'icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px;',
    'active_icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px; transform:rotate(45deg); -webkit-transform:rotate(45deg);',
    'wrapper_style' : 'background-color: white;border:1px solid blue;',
    'wrapper_class' : '',
};
SPS_SteamgiftLikes._dislike_style = { 
    'icon' : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAIAAADYhlU4AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPhJREFUSEvN1k0KwjAQQOHewa1HcKmn8LKCS8+jeIv6mgnG5nfSDMXhLUIK+ShtodPs5vl6n87Xw/FiFadxphzuDcaQ+QWYYDAmTAQw0+3+8Es3g0wKcP7EBSsmC7C/GDTOlADyBo0wFYCCQduYOkArg3qZJkCxQXpGA1DGIA2jBChvUJ3RA1Q0qMR0AVQzKMt0AdQwKGX8yk0ToLZBEfMdDUAqg1JGCdB/3EcE2D+PFDB+r7IA+2bfRwmQupi8UQckPZMxNICkZGJDD0gaZmX0AlKTCcY2QKoz3hgBpAqzGOOAVGJ2+U/0SzeDgJQyO/63GwJSYOb5A0nZHWu6sVhXAAAAAElFTkSuQmCC',
    'icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px;',
    'active_icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px; transform:rotate(45deg); -webkit-transform:rotate(45deg);',
    'wrapper_style' : 'background-color: #DDDDDD; color: #DDDDDD',
    'wrapper_class' : 'is-faded',
};

// list of liked/disliked games as [gameId+'_']=>[gameName]  (game name is used for list on the setting page)
SPS_SteamgiftLikes.__liked = {};
SPS_SteamgiftLikes.__disliked = {};

// settinga part
SPS_SteamgiftLikes._appendSettings = function() {
    var rows = [];
    this.__loadData();
    for (var key in this.__liked) {
        if (this.__liked.hasOwnProperty(key)) {
            rows.push('<li><a href="/giveaways/search?q='+this.__liked[key]+'"><span>'+this.__liked[key]+'</span></a></li>');
        }
    }
    $('div.page__heading').parent().append( '<h3>Liked</h3><ul>'+rows.join('')+'</ul>' );
};


// list part
SPS_SteamgiftLikes.addGameTo = function( type, button ) {
    var $wrapper = $(button).parents('.giveaway__row-outer-wrap');
    var gameName = $( '.giveaway__heading__name', $wrapper ).html();
    var $hideLink = $('i.giveaway__hide', $wrapper);
    if ( $hideLink.length ) {
        var gameId = ''+$hideLink.attr('data-game-id')+'_';
        if ( 'like' == type && !this.__liked[gameId] ) {
            this.__liked[gameId] = gameName;
            this.__saveData();
        }
        else if ( 'dislike' == type && !this.__disliked[gameId] ) {
            this.__disliked[gameId] = gameName;
            this.__saveData();
        }
    }
    this._clearIcons( $wrapper );
    this._addIcon( $wrapper, ('like'==type)?this._like_style:this._dislike_style, type, true );
};

SPS_SteamgiftLikes.removeGameFrom = function( type, button ) {
    var $wrapper = $(button).parents('.giveaway__row-outer-wrap');
    var $hideLink = $('i.giveaway__hide', $wrapper);
    if ( $hideLink.length ) {
        var gameId = ''+$hideLink.attr('data-game-id')+'_';
        if ( 'like' == type && this.__liked[gameId] ) {
            delete this.__liked[gameId];
            this.__saveData();
        }
        else if ( 'dislike' == type && this.__disliked[gameId] ) {
            delete this.__disliked[gameId];
            this.__saveData();
        }
    }
    this._clearIcons( $wrapper );
    this._addIcon( $wrapper, this._like_style, 'like', false );
    this._addIcon( $wrapper, this._dislike_style, 'dislike', false );
};

SPS_SteamgiftLikes._addIcon = function( $node, style, type, isSelected ) {
    var $imgNode = $('<img />')
    .addClass('sps_sgld_button')
    .attr('src', style.icon);
    if ( isSelected ) {
        $node.attr('style', style.wrapper_style );
        if ( style.wrapper_class ) {
            $node.addClass(style.wrapper_class);
        }
        $imgNode.attr('onclick','javascript:SPS_SteamgiftLikes.removeGameFrom(\''+type+'\', this)')
            .attr('style', style.active_icon_style);
    } else {
        $imgNode.attr('onclick','javascript:SPS_SteamgiftLikes.addGameTo(\''+type+'\', this)')
            .attr('style', style.icon_style);
    }
    $node.append( $imgNode );
};

SPS_SteamgiftLikes._clearIcons = function( $node ) {
    var $buttons = $node.find('.sps_sgld_button');
    $buttons.remove();
    $node.attr('style', '')
        .removeClass(this._dislike_style.wrapper_class)
        .removeClass(this._like_style.wrapper_class);
};

SPS_SteamgiftLikes._setLikesFor = function( $item ) {
    var $hideLink = $('i.giveaway__hide', $item);
    if ( $hideLink.length ) {
        var gameId = ''+$hideLink.attr('data-game-id')+'_';
        if ( this.__liked[gameId] ) {
            this._addIcon( $item, this._like_style, 'like', true );
            return;
        }
        if ( this.__disliked[gameId] ) {
            this._addIcon( $item, this._dislike_style, 'dislike', true );
            return;
        }
        this._addIcon( $item, this._like_style, 'like', false );
        this._addIcon( $item, this._dislike_style, 'dislike', false );
    }
};

SPS_SteamgiftLikes._findLikes = function() {
    $('.giveaway__row-outer-wrap').each(function() {
        SPS_SteamgiftLikes._setLikesFor( $(this) );
    });
};

// data part
SPS_SteamgiftLikes.__saveData = function() {
    localStorage['sps_sgld_disliked'] = JSON.stringify(this.__disliked);
    localStorage['sps_sgld_liked'] = JSON.stringify(this.__liked);
};

SPS_SteamgiftLikes.__loadData = function() {
    if (localStorage['sps_sgld_liked']) {
        this.__liked = JSON.parse(localStorage['sps_sgld_liked']);
    } else {
        this.__liked = {};
    }
    if (localStorage['sps_sgld_disliked']) {
        this.__disliked = JSON.parse(localStorage['sps_sgld_disliked']);
    } else {
        this.__disliked = {};
    }
};


// router
SPS_SteamgiftLikes.route = function() {
    if (window.location.pathname.match(/^\/account\/settings\/giveaways/)) { 
        this._appendSettings();
    }
    else if ( window.location.pathname.match(/^\/giveaway/) || window.location.pathname.length === 0 || window.location.pathname === "/" ) {
        this.__loadData();
        this._findLikes();
    }
};

SPS_SteamgiftLikes.route();
