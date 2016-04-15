// ==UserScript==
// @name         Steamgift game filter
// @version      1.2
// @description  You can like\unlike the games on steamgift to fade\highlight them in the list
//               Liked games list available on the settings page. Is searches and highlights
//                giveaways, where you didn't entered yet.
// @author       Blood_again
// @match        http://www.steamgifts.com/*
// @match        https://www.steamgifts.com/*
// @require		 https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// ==/UserScript==


SPS_SteamgiftLikes = function() {};


// ======= Settings part =======

// site dependent settings
SPS_SteamgiftLikes._gameWrapperSelector = '.giveaway__row-outer-wrap'; // game item to add like/dislike buttons
SPS_SteamgiftLikes._gameInListSelector = '.widget-container > div:not([class]) > div:not([class]) .giveaway__row-inner-wrap'; // items in search list for count-parser
SPS_SteamgiftLikes._gameInListNotEnteredSelector = '.widget-container > div:not([class]) > div:not([class]) .giveaway__row-inner-wrap:not(".is-faded")'; // non-entered items in search list for count-parser
SPS_SteamgiftLikes._gameTitlePartSelector = 'a.giveaway__heading__name';
SPS_SteamgiftLikes._gameHidePartSelector = 'i.giveaway__hide';
SPS_SteamgiftLikes._gameIdAttribute = 'data-game-id';

// filter internal settings
SPS_SteamgiftLikes._iconClass = 'sps_sgld_button';
SPS_SteamgiftLikes._gameAlertColors = [ { time: 5400*1000, color:'red'}, // 1.5 hour or less
                                        { time: 8*3600*1000, color: 'blue'}, // 1.5-8h
                                        { time: 86400*1500, color: 'black'}, // 8h to 1.5day
                                        { time: 1000*86400*1000, color: 'gray'} // more than 1 day
                                       ];

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

// count button is used as semaphore on likes search process
SPS_SteamgiftLikes.__countButton = null;


// ======== Settings Page part =======

// append gamelist to page
SPS_SteamgiftLikes._appendSettings = function() {
    var rows = [];
    var i = 1;
    var heads = '<thead><th>N</th><th>Game</th><th><input type="button" onclick="javascript:SPS_SteamgiftLikes.parseGameCount(this);" value="count"></th><th class="last_updated">&nbsp;</th></thead>';
    this.__loadData();
    for (var key in this.__liked) {
        if (this.__liked.hasOwnProperty(key)) {
            rows.push('<tr><td>'+(i++)+'&nbsp;<td class="game_name" '+SPS_SteamgiftLikes._gameIdAttribute+'="'+key+'"><a href="/giveaways/search?q='+this.__liked[key]+'">'+this.__liked[key]+'</a></td>'+
                      '<td class="game_count">&nbsp;</td>'+
                      '<td class="game_links">&nbsp;</td></tr>');
        }
    }
    $('div.page__heading').parent().append( '&nbsp;<h3>Liked:</h3><table class="liked_games">'+heads+'<tbody>'+rows.join('')+'</tbody></table>' );
};

// append likes import/export form to page
SPS_SteamgiftLikes._appendImportSettings = function() {
    var form = '<form>'+
               '<textarea id="import_settings_text"></textarea>'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pullImportSettings();"><i class="fa fa-arrow-circle-right"></i> Refresh</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(false);"><i class="fa fa-arrow-circle-right"></i> Import full</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(true);"><i class="fa fa-arrow-circle-right"></i> Merge</div>&nbsp;'+
               '</form>';
    $('div.page__heading').parent().append( '&nbsp;<h3>Like/dislike import:</h3>'+form+'' );
    this.pullImportSettings();
};

SPS_SteamgiftLikes.pullImportSettings = function() {
    this.__loadData();
    var settingsText = JSON.stringify({liked:this.__liked, disliked:this.__disliked});
    $('#import_settings_text').val(settingsText);
};

SPS_SteamgiftLikes.pushImportSettings = function( toMerge ) {
    try {
        var key;
        var toImport = JSON.parse( $('#import_settings_text').val() );
        if ( toImport.liked instanceof Object ) {
            if ( toMerge ) {
                for (key in toImport.liked) {
                    if (toImport.liked.hasOwnProperty(key) && (!this.__liked.hasOwnProperty(key) || !this.__liked[key]) ) {
                        this.__liked[key] = toImport.liked[key];
                    }
                }
            } else {
                this.__liked = toImport.liked;
            }
        }
        if ( toImport.disliked instanceof Object ) {
            if ( toMerge ) {
                for (key in toImport.disliked) {
                    if (toImport.disliked.hasOwnProperty(key) && (!this.__disliked.hasOwnProperty(key) || !this.__disliked[key]) ) {
                        this.__disliked[key] = toImport.disliked[key];
                    }
                }
            } else {
                this.__disliked = toImport.disliked;
            }
        }
        this.__saveData();
    } catch(e) {
        alert('Invalid settings to import');
    }
};

// start the search-n-parse process
SPS_SteamgiftLikes.parseGameCount = function( button ) {
    if ( null !== this.__countButton ) {
        return;
    }
    this.__countButton = button;
    $( this.__countButton ).attr('disabled','1');
    $('.liked_games .last_updated').html('updating...');
    $('.liked_games tbody tr').css('color','red');
    // initiate parse for the first game in list
    var $elem = $('.liked_games tbody tr').first();
    this.__parseOneGameCount( $elem );
};

// decode the giveaway finish data
// @return time to finish in milliseconds
SPS_SteamgiftLikes.__parseGiveawayTime = function( timeString ) {
    var parts = timeString.split(',');
    var timePart = parts.pop();
    var timeBonus = 0;
    var today = new Date();
    if ( parts[0] == 'Today' ) {
        parts[0] = today.toDateString();
    } else if ( parts[0] == 'Tomorrow' ) {
        parts[0] = today.toDateString();
        timeBonus += 86400*1000;
    }
    if ( timePart.indexOf('pm') ) {
        timeBonus += 43200*1000; // half of the day
    }
    var tempString = parts.join('')+timePart.slice(0,-2)+':00'; // compose the datetime to parse
    var tempDate = new Date( tempString );
    return tempDate.getTime()+timeBonus-today.getTime();
};

SPS_SteamgiftLikes.__renderGameItemList = function( list) {
    var out = '', counter = 1, i, j;
    for ( i in list ) {
        out += '<span style="color:'+list[i].color+'">';
        for ( j in list[i].linkList ) {
            out += '&nbsp;<a href="'+list[i].linkList[j]+'">['+(counter++)+']</a>';
        }
        out += '</span>';
    }
    return out;
};

// search-n-parse one list item
SPS_SteamgiftLikes.__parseOneGameCount = function( $row ) {
    if ( !$row.length ) {
        // end of list is reached
        // set last update time
        var today = new Date();
        $('.liked_games .last_updated').html(today.toTimeString().split(' ')[0]);
        // enable start button
        $( this.__countButton ).removeAttr('disabled');
        this.__countButton = null;
    } else {
        var $countCell = $row.find('td.game_count');
        if ( $countCell.length ) {
            var gameName = $row.find('td.game_name > a').html();
            var gameId = $row.find('td.game_name').attr( this._gameIdAttribute );
            var $linksCell = $row.find('td.game_links');
            $linksCell.html('');
            $countCell.html('');
            $.get( '/giveaways/search?q='+gameName,
                   {},
                   function( data ) {
                       var gameRowsCount = $( SPS_SteamgiftLikes._gameInListSelector , data ).length;
                       var $gameRowsNotEntered = $( SPS_SteamgiftLikes._gameInListNotEnteredSelector , data );
                       var gameRowsNotEnteredCount = $gameRowsNotEntered.length;
                       $countCell.html( gameRowsNotEnteredCount + '/' + gameRowsCount );
                       if ( gameRowsNotEnteredCount ) {
                           $row.css('color', 'blue');
                           var linksStrict = [];
                           var gameCounterStrict = 0;
                           var linksOther = [];
                           var gameCounterOther = 0;
                           $gameRowsNotEntered.each(function(){
                               console.log('here');
                                   var giveawayContainer = $(this).parent();
                                   var itemGameId = ''+$(giveawayContainer).attr( SPS_SteamgiftLikes._gameIdAttribute )+'_';
                               console.log(itemGameId);
                                   if ( ( itemGameId == gameId && gameCounterStrict >= 15 ) ||
                                        ( itemGameId != gameId && gameCounterOther >= 15 ) ) return;
                                   var giveawayLink = $(this).find( SPS_SteamgiftLikes._gameTitlePartSelector ).attr('href');
                                   var giveawayDeltaTime = SPS_SteamgiftLikes.__parseGiveawayTime( $(this).find('.fa-clock-o').next().attr('title') );
                                   for(var i in SPS_SteamgiftLikes._gameAlertColors ) {
                                       if ( SPS_SteamgiftLikes._gameAlertColors[i].time > giveawayDeltaTime ) {
                                           if ( itemGameId == gameId ) {
                                               if ( !linksStrict[i] ) {
                                                   linksStrict[i] = { color: SPS_SteamgiftLikes._gameAlertColors[i].color,
                                                            linkList : []
                                                          };
                                               }
                                               linksStrict[i].linkList.push(giveawayLink);
                                               gameCounterStrict++;
                                               break;
                                           } else {
                                               if ( !linksOther[i] ) {
                                                   linksOther[i] = { color: SPS_SteamgiftLikes._gameAlertColors[i].color,
                                                            linkList : []
                                                          };
                                               }
                                               linksOther[i].linkList.push(giveawayLink);
                                               gameCounterOther++;
                                               break;
                                           }
                                       }
                                   }
                               });
                           if ( gameCounterStrict ) {
                               $linksCell.append( SPS_SteamgiftLikes.__renderGameItemList( linksStrict )+'&nbsp;' );
                           } else {
                               $linksCell.append( 'no strict match&nbsp;' );
                           }
                           if ( gameCounterOther ) {
                               $linksCell.append( '&nbsp;(('+SPS_SteamgiftLikes.__renderGameItemList( linksOther )+'&nbsp;))&nbsp;' );
                           }
                       } else {
                           $row.css('color', 'gray');
                       }
                       setTimeout( function(){ SPS_SteamgiftLikes.__parseOneGameCount( $row.next() ); }, 500+1000*Math.random());
                   },
                   'html');
        }
    }
};

// list part
SPS_SteamgiftLikes.addGameTo = function( type, button ) {
    var $wrapper = $(button).parents( this._gameWrapperSelector );
    var gameName = $( this._gameTitlePartSelector , $wrapper ).html();
    if ( $wrapper.length ) {
        var gameId = ''+$wrapper.attr( this._gameIdAttribute )+'_';
        this.__loadData();
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
    var $wrapper = $(button).parents( this._gameWrapperSelector );
    if ( $wrapper.length ) {
        var gameId = ''+$wrapper.attr( this._gameIdAttribute )+'_';
        this.__loadData();
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
    .addClass( this._iconClass )
    .attr('src', style.icon);
    if ( isSelected ) {
        if ( !$node.find( '.giveaway__row-inner-wrap' ).hasClass('is-faded') ) {
            $node.attr('style', style.wrapper_style );
            if ( style.wrapper_class ) {
                $node.addClass(style.wrapper_class);
            }
        }
        $imgNode.attr('onclick','SPS_SteamgiftLikes.removeGameFrom(\''+type+'\', this)')
            .attr('style', style.active_icon_style);
    } else {
        $imgNode.attr('onclick','SPS_SteamgiftLikes.addGameTo(\''+type+'\', this)')
            .attr('style', style.icon_style);
    }
    $node.append( $imgNode );
};

SPS_SteamgiftLikes._clearIcons = function( $node ) {
    var $buttons = $node.find('.'+this._iconClass);
    $buttons.remove();
    $node.attr('style', '')
        .removeClass(this._dislike_style.wrapper_class)
        .removeClass(this._like_style.wrapper_class);
};

SPS_SteamgiftLikes._setLikesFor = function( $item ) {
    var gameId = ''+$item.attr( this._gameIdAttribute )+'_';
    console.log(gameId);
    console.log(this.__liked[gameId]);
    if ( this.__liked[gameId] ) {
    console.log('set like');
        this._addIcon( $item, this._like_style, 'like', true );
        return;
    }
    console.log(this.__disliked[gameId]);
    if ( this.__disliked[gameId] ) {
    console.log('set dislike');
        this._addIcon( $item, this._dislike_style, 'dislike', true );
        return;
    }
    console.log('neutral');
    this._addIcon( $item, this._like_style, 'like', false );
    this._addIcon( $item, this._dislike_style, 'dislike', false );
};

SPS_SteamgiftLikes._findLikes = function() {
    $( this._gameWrapperSelector ).each(function() {
        SPS_SteamgiftLikes._setLikesFor( $(this) );
    });
};

// data part
SPS_SteamgiftLikes.__saveData = function() {
    localStorage.sps_sgld_disliked = JSON.stringify(this.__disliked);
    localStorage.sps_sgld_liked = JSON.stringify(this.__liked);
};

SPS_SteamgiftLikes.__loadData = function() {
    if (localStorage.sps_sgld_liked) {
        this.__liked = JSON.parse(localStorage.sps_sgld_liked);
    } else {
        this.__liked = {};
    }
    if (localStorage.sps_sgld_disliked) {
        this.__disliked = JSON.parse(localStorage.sps_sgld_disliked);
    } else {
        this.__disliked = {};
    }
};


// router
SPS_SteamgiftLikes.route = function() {
    if (window.location.pathname.match(/^\/account\/settings\/giveaways/)) {
        this._appendSettings();
    } else if (window.location.pathname.match(/^\/account\/profile\/sync/)) {
        this._appendImportSettings();
    } else if ( window.location.pathname.match(/^\/giveaway/) || window.location.pathname.length === 0 || window.location.pathname === "/" ) {
        this.__loadData();
        this._findLikes();
    }
};

SPS_SteamgiftLikes.route();
