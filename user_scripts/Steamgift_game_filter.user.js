// ==UserScript==
// @name         Steamgift game filter
// @version      1.4
// @description  You can like\unlike the games on steamgift to fade\highlight them in the list
//               Liked games list available on the settings page. Is searches and highlights
//                giveaways, where you didn't entered yet.
//               How to use:
//                - game lists like search, frontpage etc. have like/dislike marks. Like will highlight the game in lists. Dislike - fade it.
//                - setting page https://www.steamgifts.com/account/settings/giveaways allow to scan giveaway list for liked games
//                - setting page https://www.steamgifts.com/account/profile/sync allow to import/export likes/dislikes as json
// @author       Blood_again
// @match        http://www.steamgifts.com/*
// @match        https://www.steamgifts.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
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
SPS_SteamgiftLikes._icons = {
    like: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAElBMVEX///85abHN2euctNjz9vqovd3WpoAuAAAAO0lEQVQImZWP0QoAIAgDt7n+/5crIhJ7qXvymKADJkEGEhy4uN48mIgVHXx53YclzblJ/rmf/6194J12TkwAqgm9KQcAAAAASUVORK5CYII=',
    dislike: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAhCAIAAADYhlU4AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPhJREFUSEvN1k0KwjAQQOHewa1HcKmn8LKCS8+jeIv6mgnG5nfSDMXhLUIK+ShtodPs5vl6n87Xw/FiFadxphzuDcaQ+QWYYDAmTAQw0+3+8Es3g0wKcP7EBSsmC7C/GDTOlADyBo0wFYCCQduYOkArg3qZJkCxQXpGA1DGIA2jBChvUJ3RA1Q0qMR0AVQzKMt0AdQwKGX8yk0ToLZBEfMdDUAqg1JGCdB/3EcE2D+PFDB+r7IA+2bfRwmQupi8UQckPZMxNICkZGJDD0gaZmX0AlKTCcY2QKoz3hgBpAqzGOOAVGJ2+U/0SzeDgJQyO/63GwJSYOb5A0nZHWu6sVhXAAAAAElFTkSuQmCC',
    refresh: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAAqElEQVR4AX3LsUpCYRzG4QcEl3ZB6kbKIbqAlgIpqFtoagohTMhRr0MUHNzFK3BQvA7RMziofw+CnA9Bn9/48pYAtxq6Ohrq7ixk+AU+ZSJp5V3LFj7shZ4H5byagTi2pWotfEmNT2Nb6Eu1iudcuFdoimLcCGUXXB1nQs0F/8LAuWclqFoJ31I/wgR4sxeGHt3kPRkJOy8AdUuRtPQqUfFnKsubaqoABz2aTKtk4DjHAAAAAElFTkSuQmCC'
};

SPS_SteamgiftLikes._styles = {
    gameCounter : '',
    gameList : ".sps_sgld_button { width: 17px; height: 17px; float: right; position: relative; margin: -6px 3px 1px 3px;text-shadow: 1px 1px 1px rgba(255,255,255,0.3);border-radius:2px;text-align:center;vertical-align:middle; font-size:120% }\
                .sps_sgld_button.like { background-image: -webkit-linear-gradient(#C9E7FF 0%, #48ADFF 100%);border-color: #48ADFF #1374C4 #1374C4 #48ADFF;color: white;}\
                .sps_sgld_button.dislike { background-image: -webkit-linear-gradient(#363A3D 0%, #0A131A 100%);border-color: #48ADFF #1374C4 #1374C4 #48ADFF;color: white;}\
                .liked .sps_sgld_button.like, .disliked .sps_sgld_button.dislike { transform:rotate(45deg); -webkit-transform:rotate(45deg); }\
                .liked .sps_sgld_button.dislike, .disliked .sps_sgld_button.like { display: none; }\
",
    gameSettings : '',
};

SPS_SteamgiftLikes._like_style = {
    'icon' : SPS_SteamgiftLikes._icons.like,
    'icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px;',
    'active_icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px; transform:rotate(45deg); -webkit-transform:rotate(45deg);',
    'wrapper_style' : 'background-color: white;border:1px solid blue;',
    'wrapper_class' : '',
    'icon_text' : '+',
};
SPS_SteamgiftLikes._dislike_style = {
    'icon' : SPS_SteamgiftLikes._icons.dislike,
    'icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px;',
    'active_icon_style' : 'padding: 1px 3px; width: 15px; height: 15px; float: right; position: relative; margin-top: -6px; transform:rotate(45deg); -webkit-transform:rotate(45deg);',
    'wrapper_style' : 'background-color: #DDDDDD; color: #DDDDDD',
    'wrapper_class' : 'is-faded',
    'icon_text' : 'x',
};

// list of liked/disliked games as [gameId+'_']=>[gameName]  (game name is used for list on the setting page)
SPS_SteamgiftLikes.__liked = {};
SPS_SteamgiftLikes.__disliked = {};

// count button is used as semaphore on likes search process
SPS_SteamgiftLikes.__countButton = null;
SPS_SteamgiftLikes.__stopWork = false;

// ======== Settings Page part =======

// append gamelist to page
SPS_SteamgiftLikes._appendSettings = function() {
    var rows = [];
    var i = 1;
    var heads = '<thead><th width="20">&nbsp;</th>'+
                       '<th>N&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'added\',true);">+</a>&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'added\',false);">--</a></th>'+
                       '<th>Game&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'name\',true)">+</a>&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'name\',false);">--</a></th>'+
                       '<th><input id="SPSCountButton" type="button" onclick="javascript:SPS_SteamgiftLikes.parseGameCount();" value="count"><br/><span class="last_updated">&nbsp;</span></th>'+
                       '<th>&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'time\',true)">+</a>&nbsp;<a href="javascript:SPS_SteamgiftLikes.sortGameList(\'time\',false);">--</a></th></thead>';
    this.__loadData();
    for (var key in this.__liked) {
        if (this.__liked.hasOwnProperty(key)) {
            rows.push('<tr><td><img onclick="javascript:SPS_SteamgiftLikes.parseGameCount(this);" class="refresh_row" src="'+this._icons.refresh+'" width="8" height="8" border="0" style="opacity: 30"></td>'+
                      '<td class="game_num">'+(i++)+'&nbsp;<td class="game_name" '+SPS_SteamgiftLikes._gameIdAttribute+'="'+key+'"><a href="/giveaways/search?q='+this.__liked[key]+'" target="_blank">'+this.__liked[key]+'</a></td>'+
                      '<td class="game_count">&nbsp;</td>'+
                      '<td class="game_links">&nbsp;</td></tr>');
        }
    }
    this._appendStyles( this._styles.gameCount );
    this._appendSettingsRow( 1, 'Monitor', '<table class="liked_games">'+heads+'<tbody>'+rows.join('')+'</tbody></table>' );
};

SPS_SteamgiftLikes._appendSettingsRow = function( number, title, body ) {
    if ( false === number ) {
        var numberElem = $('.form__heading__number:last').html();
        number = parseInt(numberElem);
        number++;
    }
    $('div.widget-container form:last').append(
        '<div class="form__row"><div class="form__heading">'+
        '<div class="form__heading__number">'+number+'.</div>'+
        '<div class="form__heading__text">'+title+'</div>'+
        '</div><div class="form__row__indent">'+body+'</div></div>'
        );
};

SPS_SteamgiftLikes._appendSettingsHead = function( title ) {
    $('div.page__heading').parent().append(
        '&nbsp;<div class="page__heading"><div class="page__heading__breadcrumbs"><a href="#">'+title+'</a></div></div><form onsubmit="return false;"></form>'
        );
};

SPS_SteamgiftLikes._appendStyles = function( styleContent ) {
    $('head').append('<style type="text/css">'+styleContent+'</style>');
};

// append likes import/export form to page
SPS_SteamgiftLikes._appendImportSettings = function() {
    var form = '<textarea id="import_settings_text"></textarea>'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pullImportSettings();"><i class="fa fa-arrow-circle-right"></i> Refresh</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(false);"><i class="fa fa-arrow-circle-right"></i> Import full</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(true);"><i class="fa fa-arrow-circle-right"></i> Merge</div>&nbsp;';
    this._appendStyles( this._styles.gameSettings );
    this._appendSettingsRow( false, 'Like/dislike import', form );
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

// append add custom like form to page
SPS_SteamgiftLikes._appendCustomLikeSettings = function() {
    var panel = '<input class="js__autocomplete-id" type="hidden" name="game_id" id="like_game_id" value="">'+
                '<input data-autocomplete-do="autocomplete_game" class="js__autocomplete-name" type="text" placeholder="Start typing a game..." id="like_game_name" value="">'+
				'<div class="js__autocomplete-data"></div>'+
                '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.addCustomLike(\'like\');"><i class="fa fa-arrow-circle-right"></i> Like</div>&nbsp;'+
                '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.addCustomLike(\'dislike\');"><i class="fa fa-arrow-circle-right"></i> Dislike</div>&nbsp;';
    this._appendSettingsRow( 1, 'Add custom like', panel );
};

SPS_SteamgiftLikes.addCustomLike = function( type ) {
    var gameId = $('#like_game_id').val();
    if ( !gameId ) return false;
    gameId = ''+gameId+'_';
    var gameName = $('#like_game_name').val();
    this.__loadData();
    if ( 'like' == type && !this.__liked[gameId] ) {
        this.__liked[gameId] = gameName;
        this.__saveData();
    }
    else if ( 'dislike' == type && !this.__disliked[gameId] ) {
        this.__disliked[gameId] = gameName;
        this.__saveData();
    }
    this.pullImportSettings();
    $('#like_game_id').val('');
    $('#like_game_name').val('');
    return false;
};

SPS_SteamgiftLikes.sortGameList = function( sortBy, asc ) {
    if ( false === this._workStart() ) {
        return;
    }
console.log('start sort');
    var tableBody = $('.liked_games tbody')[0];
    var rows = tableBody.getElementsByTagName('tr');
    var i, j, rowCount = rows.length;
console.log(rowCount);
    for(i = 0; i < rowCount-1; i++) {
        for(j = 0; j < rowCount - i - 1; j++) {
            if( this._shouldBeAfter(rows[j], rows[j+1], sortBy, asc ) ) {
                tableBody.insertBefore(rows[j+1],rows[j]);
            }
        }
    }
console.log('end sort');
    this._workStop();
};

SPS_SteamgiftLikes._shouldBeAfter = function( row1, row2, sortBy, asc ) {
    var key1 = this._getRowSortKey(row1, sortBy);
    var key2 = this._getRowSortKey(row2, sortBy);
    if ( (key1 > key2 && asc) || (key1 < key2 && !asc) ) {
        return true;
    }
    return false;
};

SPS_SteamgiftLikes._getRowSortKey = function( row, sortBy ) {
    var key = '';
    switch ( sortBy ) {
        case 'name':
            key = $('.game_name a',row).html();
            break;
        case 'time':
            key = 1000*86400*1000;
            var value = $('.game_links:first',row).attr('data-tick-time');
            if ( value ) {
                key = parseInt(value);
                if ( isNaN(key) ) {
                    key = 1000*86400*1000;
                }
            }
            break;
        case 'added':
            key = parseInt($('.game_num',row).html());
            break;
    }
    return key;
};

SPS_SteamgiftLikes._workStart = function() {
console.log('work start');
    if ( null !== this.__countButton ) {
console.log('false');
        return false;
    }
    this.__countButton = $('#SPSCountButton');
    this.__countButton.css('color', 'gray');
//    $( this.__countButton ).attr('disabled','1');
    $('.liked_games .refresh_row').hide();
console.log('true');
    return true;
};

SPS_SteamgiftLikes._workStop = function() {
console.log('work stop');
//    $( this.__countButton ).removeAttr('disabled');
    this.__countButton.removeAttr('style');
    this.__countButton = null;
    $('.liked_games .refresh_row').show();
    this.__stopWork = false;
};

// start the search-n-parse process
SPS_SteamgiftLikes.parseGameCount = function( row ) {
    if ( false === this._workStart() ) {
        this.__stopWork = true;
        return;
    }
    var $elem;
    if ( typeof(row) === 'undefined' ) {
        $('.liked_games .last_updated').html('updating...');
        $('.liked_games tbody tr').css('color','red');
        // initiate parse for the first game in list
        $elem = $('.liked_games tbody tr').first();
        this.__parseOneGameCount( $elem );
    } else {
        $elem = $(row).parents('tr');
        this.__parseOneGameCount( $elem, true );
    }
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
            out += '&nbsp;<a href="'+list[i].linkList[j]+'" target="_blank">['+(counter++)+']</a>';
        }
        out += '</span>';
    }
    return out;
};

// search-n-parse one list item
SPS_SteamgiftLikes.__parseOneGameCount = function( $row, singleRowOnly ) {
    if ( !$row.length ) {
        // end of list is reached
        if ( typeof(singleRowOnly) === 'undefined' || !singleRowOnly ) {
            // set last update time
            var today = new Date();
            $('.liked_games .last_updated').html(today.toTimeString().split(' ')[0]);
        }
        // enable start button
        this._workStop();
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
                       var tickTime = null;
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
                                   if ( null === tickTime ) {
                                       tickTime = giveawayDeltaTime;
                                   }
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
                               $linksCell.attr('data-tick-time', tickTime);
                           } else {
                               $linksCell.append( 'no strict match&nbsp;' );
                               $linksCell.attr('data-tick-time', 30*86400*1000+tickTime);
                           }
                           if ( gameCounterOther ) {
                               $linksCell.append( '&nbsp;(('+SPS_SteamgiftLikes.__renderGameItemList( linksOther )+'&nbsp;))&nbsp;' );
                           }
                       } else {
                           $linksCell.attr('data-tick-time', '');
                           $row.css('color', 'gray');
                       }
                       if ( SPS_SteamgiftLikes.__stopWork ) {
                           SPS_SteamgiftLikes.__parseOneGameCount( [] );
                       } else if ( typeof(singleRowOnly) === 'undefined' || !singleRowOnly ) {
                           setTimeout( function(){ SPS_SteamgiftLikes.__parseOneGameCount( $row.next() ); }, 500+1000*Math.random());
                       } else {
                           SPS_SteamgiftLikes.__parseOneGameCount( [], true );
                       }
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
    var $icon = $('<div>'+style.icon_text+'</div>')
        .addClass( this._iconClass )
        .addClass( type );
    if ( isSelected ) {
        if ( !$node.find( '.giveaway__row-inner-wrap' ).hasClass('is-faded') ) {
            $node.attr('style', style.wrapper_style );
        }
        $node.addClass(type+'d');
        $icon.attr('onclick','SPS_SteamgiftLikes.removeGameFrom(\''+type+'\', this)');
    } else {
        $icon.attr('onclick','SPS_SteamgiftLikes.addGameTo(\''+type+'\', this)');
    }
    $node.append( $icon );
};

SPS_SteamgiftLikes._clearIcons = function( $node ) {
    var $buttons = $node.find('.'+this._iconClass);
    $buttons.remove();
    $node.attr('style', '')
        .removeClass(this._dislike_style.wrapper_class)
        .removeClass(this._like_style.wrapper_class)
        .removeClass('liked')
        .removeClass('disliked');
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
    this._appendStyles( this._styles.gameList );
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
        this._appendSettingsHead( 'Likes' );
        this._appendSettings();
    } else if (window.location.pathname.match(/^\/account\/profile\/sync/)) {
        this._appendSettingsHead( 'Likes' );
        this._appendCustomLikeSettings();
        this._appendImportSettings();
    } else if ( window.location.pathname.match(/^\/giveaway/) || window.location.pathname.length === 0 || window.location.pathname === "/" ) {
        this.__loadData();
        this._findLikes();
    }
};

SPS_SteamgiftLikes.route();
