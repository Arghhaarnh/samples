// ==UserScript==
// @name         Steamgift game filter
// @version      1.5
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

SPS_SteamgiftLikes._styles = {
    gameCounter : "/* SPS game filter counter styles */ \
.liked_games { border-spacing: 1px; } \
.liked_games thead th { height: 44px; vertical-align: middle; } \
.liked_games thead { background-image: -webkit-linear-gradient(#fff 0%, rgba(255,255,255,0.4) 100%); } \
.liked_games tbody tr:nth-child(odd) { background-color: #e0e3e5; } \
.liked_games tbody tr:nth-child(even) { background-color: #f5f7fa; } \
.liked_games th, .liked_games td { padding: 0 2px; } \
.liked_games .game_refresh { min-width: 10px } \
.liked_games .game_num { min-width: 32px } .liked_games td.game_num { min-width: 28px; padding-right: 6px; text-align: right; } \
.liked_games .game_name { min-width: 200px } \
.liked_games .game_count { min-width: 55 px } .liked_games td.game_count { min-width: 45px; padding-right: 12px; text-align: right; } \
.liked_games .game_links { min-width: 200px } \
.liked_games .sort_link { margin: 2px; }  \
.liked_games .sort_link.current { color: #13A7E4; }  \
.liked_games .sort_link.active { color: #08668E; }  \
.liked_games tr.to_count { color: #5D0E0E } \
.liked_games tr.no_links { color: grey; } \
.liked_games tr.has_links { color: blue; } \
.liked_games .refresh_row, .liked_games .sort_link { cursor: pointer; } \
.liked_games .refresh_row .fa { opacity: 0.7; font-size: 11px; padding-bottom: 1px; } \
.liked_games .ajax_progress { display: none; } \
.liked_games.in_progress { opacity: 0.7 } \
.liked_games.in_progress .ajax_progress { width: 100%; height: 100%; display: block; padding-top: 15px; } \
.liked_games.in_progress .sort_header, .in_progress .refresh_row { display: none; } \
",
    gameList : "/* SPS game filter list styles */ \
.sps_sgld_button { width: 17px; height: 17px; float: right; position: relative; margin: -6px 0px 1px 4px; border: solid 1px; border-radius: 3px; text-align: center; vertical-align: middle; cursor:pointer; padding: 1px 0 0 1px; } \
.sps_sgld_button.like { background-image: -webkit-linear-gradient(top, #7cbee6, #0076bf); border-color: #d7eefa #1770a3 #042940 #9ecfeb; color: white; text-shadow: -1px -1px 0px #06284d; } \
.sps_sgld_button.like:hover { background-image: -webkit-linear-gradient(top, #7cbee6, #2990cc); color: #9ecfeb } \
.sps_sgld_button.dislike { background-image: -webkit-linear-gradient(top, #b7c4cc, #344047); border-color: #dae0e3 #1e2326 #344047 #a3a8ad; color: white; text-shadow: -1px -1px 0px #02101f; } \
.sps_sgld_button.dislike:hover { background-image: -webkit-linear-gradient(top, #9aa2a6, #344047); color: #b8b8b8 } \
.liked .sps_sgld_button.like { background-image: -webkit-linear-gradient(top, #0076bf, #7cbee6); border-color: #042940 #9ecfeb #d7eefa #1770a3; color: #d7eefa; text-shadow: 1px 1px 0px #06284d; opacity: 0.5; padding: 0 1px 1px 0; } \
.disliked .sps_sgld_button.dislike { transform:rotate(180deg); -webkit-transform:rotate(180deg); color: #b8b8b8; opacity: 0.5; } \
.liked .sps_sgld_button.dislike, .disliked .sps_sgld_button.like { display: none; } \
.liked.fresh .sps_sgld_button.like { opacity: 1; margin-right: -1px } \
.giveaway__row-outer-wrap.liked.fresh { background-color: white; border: 1px solid; border-color: #a6a6ff #0000d9 #000070 #7575ff; border-radius: 3px; } \
.giveaway__row-outer-wrap.disliked.fresh { opacity: 0.3; } .giveaway__row-outer-wrap.disliked.fresh .global__image-outer-wrap {background-color: #f0f2f5;} \
",
    gameSettings : '',
};

SPS_SteamgiftLikes._text = {
    title: {
    },
    button : {
        like : '<i class="fa fa-check"></i>',
        dislike : '<i class="fa fa-ban"></i>',
        merge : 'Merge',
        import : 'Import full',
        refresh: 'Refresh',
        counter: 'Count',
        customLike : 'Like',
        customDislike : 'Dislike',
    },
    table : {
        number : 'N',
        name : 'Game name',
        links : 'Giveaway links',
        sortAsc : '<i class="fa fa-arrow-circle-down"></i>',
        sortDesc : '<i class="fa fa-arrow-circle-up"></i>',
        ajax : '<i class="fa fa-cog fa-spin"></i>',
        refresh : '<i class="fa fa-refresh"></i>',
    },
    description : {
        merge : 'New items will be added to settings.\nExisting items will be kept.\nItems missed in new list will be kept.',
        import : 'All the settings will be rewritten.\nItems missed in new list will be lost.',
        refresh : 'Reread current settings and show it in window.',
    },
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
    var ajaxRoll = '<span class="ajax_progress">'+this._text.table.ajax+'</span>';
    var heads = '<thead><th  class="game_refresh">&nbsp;</th>'+
                       '<th class="game_num">'+ajaxRoll+'<span class="sort_header">'+this._text.table.number+'<br/>'+this._getSortingLinks('added')+'</span></th>'+
                       '<th class="game_name">'+ajaxRoll+'<span class="sort_header">'+this._text.table.name+'<br/>'+this._getSortingLinks('name')+'</span></th>'+
                       '<th class="game_count"><span><input id="SPSCountButton" type="button" onclick="javascript:SPS_SteamgiftLikes.parseGameCount();" value="'+this._text.button.counter+'"></span><br/><span class="last_updated"></span></th>'+
                       '<th class="game_links">'+ajaxRoll+'<span class="sort_header">'+this._text.table.links+'<br/>'+this._getSortingLinks('time')+'</span></thead>';
    this.__loadData();
    for (var key in this.__liked) {
        if (this.__liked.hasOwnProperty(key)) {
            rows.push('<tr><td class="game_refresh"><span onclick="javascript:SPS_SteamgiftLikes.parseGameCount(this);" class="refresh_row">'+this._text.table.refresh+'</span></td>'+
                      '<td class="game_num">'+(i++)+'</td>'+
                      '<td class="game_name" '+SPS_SteamgiftLikes._gameIdAttribute+'="'+key+'"><a href="/giveaways/search?q='+this.__liked[key]+'" target="_blank">'+this.__liked[key]+'</a></td>'+
                      '<td class="game_count"></td>'+
                      '<td class="game_links"></td></tr>');
        }
    }
    this._appendStyles( this._styles.gameCounter );
    this._appendSettingsRow( 1, 'Monitor', '<table class="liked_games">'+heads+'<tbody>'+rows.join('')+'</tbody></table>' );
};

SPS_SteamgiftLikes._getSortingLinks = function( criteria ) {
    return '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.sortGameList(this, \''+criteria+'\',true);">'+this._text.table.sortAsc+'</span>'+
           '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.sortGameList(this, \''+criteria+'\',false);">'+this._text.table.sortDesc+'</span>';
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
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pullImportSettings();" title="'+this._text.description.refresh+'"><i class="fa fa-arrow-circle-right"></i> '+this._text.button.refresh+'</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(false);" title="'+this._text.description.import+'"><i class="fa fa-arrow-circle-right"></i> '+this._text.button.import+'</div>&nbsp;'+
               '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.pushImportSettings(true);" title="'+this._text.description.merge+'"><i class="fa fa-arrow-circle-right"></i> '+this._text.button.merge+'</div>&nbsp;';
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
                '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.addCustomLike(\'like\');"><i class="fa fa-arrow-circle-right"></i> '+this._text.button.customLike+'</div>&nbsp;'+
                '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.addCustomLike(\'dislike\');"><i class="fa fa-arrow-circle-right"></i> '+this._text.button.customDislike+'</div>&nbsp;';
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

SPS_SteamgiftLikes.sortGameList = function( button, sortBy, asc ) {
    if ( false === this._workStart() ) {
        return;
    }
    var copy = $('.liked_games').parent().html();
    var tableBody = $('tbody', copy)[0];
    var rows = tableBody.getElementsByTagName('tr');
    var i, j, rowCount = rows.length;
    setTimeout( function(){
        for(i = 0; i < rowCount-1; i++) {
            for(j = 0; j < rowCount - i - 1; j++) {
                if( SPS_SteamgiftLikes._shouldBeAfter(rows[j], rows[j+1], sortBy, asc ) ) {
                    tableBody.insertBefore(rows[j+1],rows[j]);
                }
            }
        }
        $('.liked_games tbody').html($(tableBody).html());
        SPS_SteamgiftLikes._updateSortButtons( button );
        SPS_SteamgiftLikes._workStop();
        }, 1000);
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

SPS_SteamgiftLikes._updateSortButtons = function( current ) {
    var $current = $(current);
    var $active = $('.liked_games .sort_link.current, .liked_games .sort_link.active');
    $('.liked_games .sort_link').removeClass('active').removeClass('current');
    $active.addClass('active');
    $current.parent().find('.sort_link').removeClass('active');
    $current.addClass('current');
};

SPS_SteamgiftLikes._workStart = function() {
    if ( null !== this.__countButton ) {
        return false;
    }
    $('.liked_games').addClass('in_progress');
    this.__countButton = $('#SPSCountButton');
    return true;
};

SPS_SteamgiftLikes._workStop = function() {
    this.__countButton = null;
    $('.liked_games').removeClass('in_progress');
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
        $('.liked_games tbody tr').removeClass('no_links').removeClass('has_links').addClass('to_count');
        // initiate parse for the first game in list
        $elem = $('.liked_games tbody tr').first();
        this.__parseOneGameCount( $elem );
    } else {
        $elem = $(row).parents('tr');
        $elem.removeClass('no_links').removeClass('has_links');
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
    if ( timePart.indexOf('pm') >= 0 ) {
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
                           $row.removeClass('to_count').addClass('has_links');
                           var linksStrict = [];
                           var gameCounterStrict = 0;
                           var linksOther = [];
                           var gameCounterOther = 0;
                           $gameRowsNotEntered.each(function(){
                                   var giveawayContainer = $(this).parent();
                                   var itemGameId = ''+$(giveawayContainer).attr( SPS_SteamgiftLikes._gameIdAttribute )+'_';
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
                           $row.removeClass('to_count').addClass('no_links');
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
    this._addIcon( $wrapper, type, true );
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
    this._addIcon( $wrapper, 'like', false );
    this._addIcon( $wrapper, 'dislike', false );
};

SPS_SteamgiftLikes._addIcon = function( $node, type, isSelected ) {
    var $icon = $('<div>'+this._text.button[type]+'</div>')
        .addClass( this._iconClass )
        .addClass( type );
    if ( isSelected ) {
        if ( !$node.find( '.giveaway__row-inner-wrap' ).hasClass('is-faded') ) {
            $node.addClass('fresh');
        }
        $icon.attr('onclick','SPS_SteamgiftLikes.removeGameFrom(\''+type+'\', this)');
        $node.addClass(type+'d');
    } else {
        $icon.attr('onclick','SPS_SteamgiftLikes.addGameTo(\''+type+'\', this)');
    }
    $node.append( $icon );
};

SPS_SteamgiftLikes._clearIcons = function( $node ) {
    var $buttons = $node.find('.'+this._iconClass);
    $buttons.remove();
    $node.removeClass('liked')
        .removeClass('disliked')
        .removeClass('fresh');
};

SPS_SteamgiftLikes._setLikesFor = function( $item ) {
    var gameId = ''+$item.attr( this._gameIdAttribute )+'_';
    if ( this.__liked[gameId] ) {
        this._addIcon( $item, 'like', true );
        return;
    }
    if ( this.__disliked[gameId] ) {
        this._addIcon( $item, 'dislike', true );
        return;
    }
    this._addIcon( $item, 'like', false );
    this._addIcon( $item, 'dislike', false );
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
