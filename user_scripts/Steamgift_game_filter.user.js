// ==UserScript==
// @name         Steamgift game filter
// @version      2.4.0
// @description  You can like\unlike the games on steamgift to fade\highlight them in the list
//               Liked games list available on the settings page. Is searches and highlights
//                giveaways, where you didn't entered yet.
//
//               It is NOT A BOT. It is data aggregation tool only.
//
//               How to use:
//                - game lists like search, frontpage etc. have like/dislike marks. Like will highlight the game in lists. Dislike - fade it.
//                - setting page https://www.steamgifts.com/account/settings/giveaways allow to scan giveaway list for liked games
//                - setting page https://www.steamgifts.com/account/profile/sync allow to import/export likes/dislikes as json
// @author       Blood_again
// @match        http://www.steamgifts.com/*
// @match        https://www.steamgifts.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require      https://github.com/Arghhaarnh/samples/raw/master/user_scripts/lib/ajax_work.lib.user.js
// ==/UserScript==


SPS_SteamgiftLikes = function() {

    // ======= Constants part =======

    const TIME__SOON_MS    = 5400*1000,       // short time (hour and half actually)
          TIME__ANIGHT_MS  = 8*3600*1000,     // about a night (8 hours)
          TIME__DAYHALF_MS = 12*3600*1000,    // half of the day
          TIME__DAY_MS     = 86400*1000,      // a strict day time
          TIME__ADAY_MS    = 36*3600*1000,    // about a day (day and half actually)
          TIME__MONTH_MS   = 30*86400*1000,   // month (more than any giveaway passes)
          TIME__LATER_MS   = 100*86400*1000,  // long but not the longest
          TIME__FARFAR_MS  = 1000*86400*1000; // long time in the future (1000 days is enough)


    var thut = {
    // ======= Settings part =======

    _settings : {
        // site dependent settings
        site: {
            _gameWrapperSelector :          '.giveaway__row-outer-wrap', // game item to add like/dislike buttons
            _gameInListSelector :           '.widget-container > div:not([class]) > div:not([class]) .giveaway__row-inner-wrap', // items in search list for count-parser
            _gameTitlePartSelector :        'a.giveaway__heading__name',
            _gameHidePartSelector :         'i.giveaway__hide',
            _gameIdAttribute :              'data-game-id',
            _steamIdAttribute :             'data-steam-id',
        },

        // filter internal settings
        filter: {
            _iconClass :         'sps_sgld_button',
            _gameAlertStyles :   [ { time: TIME__SOON_MS, class:'expires-soon'}, // 1.5 hour or less
                                        { time: TIME__ANIGHT_MS, class: 'expires-night'}, // 1.5-8h
                                        { time: TIME__ADAY_MS, class: 'expires-day'}, // 8h to 1.5day
                                        { time: TIME__FARFAR_MS, class: 'expires-later'} // more than 1 day
                                       ],
        },

        locale : 'eng-EN',
    },

    // ======= Texts part =======

    _text : {
        'eng-EN': {
            title: {
            },
            button : {
                like : '<i class="fa fa-check"></i>',
                dislike : '<i class="fa fa-ban"></i>',
                liked : '<i class="fa fa-check"></i>',
                disliked : '<i class="fa fa-ban"></i>',
                steam : '<i class="fa fa-steam"></i>',
                time : '<i class="fa fa-clock-o"></i>',
                merge : 'Merge',
                import : 'Import full',
                refresh: 'Refresh',
                scanRow: 'Scan by table rows',
                scanPlain: 'Scan by pages',
                customLike : 'Like',
                customDislike : 'Dislike',
                serviceToggle: 'Service',
                checkOwn: 'Check for own games',
                toggleDeleteOff: 'Deleting games is OFF',
                toggleDeleteOn: 'Deleting games is ON',
                toggleNostrictFCOff: '<i class="fa fa-eye-slash"></i>',
                toggleNostrictFCOn: '<i class="fa fa-eye"></i>',
            },
            table : {
                number : 'N',
                name : 'Game name',
                links : 'Giveaway links',
                delta : 'Time left',
                sortAsc : '<i class="fa fa-arrow-circle-down"></i>',
                sortDesc : '<i class="fa fa-arrow-circle-up"></i>',
                ajax : '<i class="fa fa-cog fa-spin"></i>',
                refresh : '<i class="fa fa-refresh"></i>',
                inProgress: 'updating...',
            },
            description : {
                merge : 'New items will be added to settings.\nExisting items will be kept.\nItems missed in new list will be kept.',
                import : 'All the settings will be rewritten.\nItems missed in new list will be lost.',
                refresh : 'Reread current settings and show it in window.',
                time : 'Update the timing for scanned rows .',
                toggleFCNostict: 'Show/hide nostrict matches in fast click list.'
            },
            alert : {
                settingsApply : 'Settings applied succesfully',
                settingsError: 'Invalid settings to import',
                rowRemove: 'This game will be removed from liked list:',
            },
        },
    },

    translate : function( text ) {
        var path = text.split('.'),
            base = this._text[this._settings.locale];
        for(var i in path) {
            if ( 'undefined' === typeof base ) {
                return text;
            }
            base = base[path[i]];
        }
        return base;
    },

    // ======= Styles part =======

    _styles : {
        likedTable : "/* SPS game filter liked table styles */ \
.liked_games { border-spacing: 1px; } \
.liked_games thead th { height: 44px; vertical-align: middle; } \
.liked_games thead { background-image: -webkit-linear-gradient(#fff 0%, rgba(255,255,255,0.4) 100%); } \
.liked_games tbody tr:nth-child(odd) { background-color: #e0e3e5; } \
.liked_games tbody tr:nth-child(even) { background-color: #f5f7fa; } \
.liked_games th, .liked_games td { padding: 0 2px; } \
.liked_games .game_refresh { min-width: 10px } \
.liked_games .game_num { min-width: 32px } .liked_games td.game_num { min-width: 28px; padding-right: 6px; text-align: right; } \
.liked_games .game_name { min-width: 200px } \
.liked_games .game_name .fa-steam { font-size: 10px; padding-right: 4px; padding-bottom: 2px; cursor: pointer; } \
.liked_games .game_count { min-width: 55 px } .liked_games td.game_count { min-width: 45px; padding-right: 12px; text-align: right; } \
.liked_games .game_delta { min-width: 70px } .liked_games td.game_delta { min-width: 65px; padding-right: 5px; text-align: right; }\
.liked_games .game_links { min-width: 200px } \
.liked_games .sort_link { margin: 2px; }  \
.liked_games .sort_link.current { color: #13A7E4; }  \
.liked_games .sort_link.active { color: #08668E; }  \
.liked_games tr.to_count { color: #5D0E0E } \
.liked_games tr.no_links { color: grey; } \
.liked_games tr.has_links { color: blue; } \
.liked_games .links-strict, .liked_games .links-nostrict { margin: 0 4px; } \
.liked_games a.link-item { margin: 0 1px; } \
.liked_games a.link-item.expires-soon, .fast_click a.link-item.expires-soon { color: red; } \
.liked_games a.link-item.expires-night, .fast_click a.link-item.expires-night { color: #0053F5; } \
.liked_games a.link-item.expires-day, .fast_click a.link-item.expires-day { color: #2D3748; } \
.liked_games a.link-item.expires-later, .fast_click a.link-item.expires-later { color: grey; } \
.liked_games .refresh_row, .liked_games .sort_link { cursor: pointer; } \
.liked_games .refresh_row .fa { opacity: 0.7; font-size: 11px; padding-bottom: 1px; } \
.liked_games .fa-remove { color: red; cursor: pointer; } \
.liked_games .ajax_progress { display: none; } \
.liked_games.in_progress { opacity: 0.7 } \
.liked_games.in_progress .ajax_progress { width: 100%; height: 100%; display: block; padding-top: 15px; } \
.liked_games.in_progress .sort_header, .in_progress .refresh_row { display: none; } \
.liked_games .game_links input, .service input { width: auto; margin: 0 2px; cursor: pointer; } \
.liked_games .game_links .comment__submit-button { display: inline-block; width: 20px; margin: 0 2px; padding: 2px; cursor: pointer; height: 25px; vertical-align: middle; } \
.liked_games .game_links .comment__submit-button i { margin-top: -10px; } \
.service .spoiler_button { cursor: pointer; width: auto; height: 20px; font-size: 10px; padding: 0 10px; } \
.service .spoiler { display: none; padding: 15px 5px 12px 4px; background-color: #DEDEDE; margin-top: -10px; } \
.fast_click_panel { width: 849px; padding: 10px 0px; margin: 5px; background-color: #f9ffda; border-radius: 4px; border-width: 1px; border-style: solid; border-color: #c5cad7 #dee0e8 #dee0e8 #d2d4e0; } \
.fast_click .links-nostrict { display: none; } \
.fast_click_panel .comment__submit-button { width: 20px; margin: -6px 4px; padding: 2px; cursor: point; float: left; line-height: 20px; font-size: 12px; } \
.fast_click_panel .comment__submit-button .fa { font-size: inherit; } \
",
        gameList : "/* SPS game filter list styles */ \
.sps_sgld_button { width: 17px; height: 17px; float: right; position: relative; margin: -6px 0px 1px 4px; border: solid 1px; border-radius: 3px; text-align: center; vertical-align: middle; cursor:pointer; padding: 1px 0 0 1px; } \
.sps_sgld_button.like { background-image: -webkit-linear-gradient(top, #7cbee6, #0076bf); border-color: #d7eefa #1770a3 #042940 #9ecfeb; color: white; text-shadow: -1px -1px 0px #06284d; } \
.sps_sgld_button.like:hover { background-image: -webkit-linear-gradient(top, #7cbee6, #2990cc); color: #9ecfeb } \
.sps_sgld_button.dislike { background-image: -webkit-linear-gradient(top, #b7c4cc, #344047); border-color: #dae0e3 #1e2326 #344047 #a3a8ad; color: white; text-shadow: -1px -1px 0px #02101f; } \
.sps_sgld_button.dislike:hover { background-image: -webkit-linear-gradient(top, #9aa2a6, #344047); color: #b8b8b8 } \
.liked .sps_sgld_button.liked { background-image: -webkit-linear-gradient(top, #0076bf, #7cbee6); border-color: #042940 #9ecfeb #d7eefa #1770a3; color: #d7eefa; text-shadow: 1px 1px 0px #06284d; opacity: 0.5; padding: 0 1px 1px 0; } \
.disliked .sps_sgld_button.disliked { transform:rotate(180deg); -webkit-transform:rotate(180deg); color: #b8b8b8; opacity: 0.5; } \
.liked .sps_sgld_button.dislike, .disliked .sps_sgld_button.like { display: none; } \
.liked.fresh .sps_sgld_button.liked { opacity: 1; margin-right: -1px } \
.giveaway__row-outer-wrap.liked.fresh { background-color: white; border: 1px solid; border-color: #a6a6ff #0000d9 #000070 #7575ff; border-radius: 3px; } \
.giveaway__row-outer-wrap.disliked.fresh { opacity: 0.3; } .giveaway__row-outer-wrap.disliked.fresh .global__image-outer-wrap {background-color: #f0f2f5;} \
",
        syncPage : '',
        singlePage : "/* SPS game filter single giveaway styles */ \
.sps_sgld_button { width: 17px; height: 17px; float: right; position: absolute; margin: -6px 0px 1px 4px; border: solid 1px; border-radius: 3px; text-align: center; vertical-align: middle; cursor:pointer; padding: 1px 0 0 1px; left:0; } \
.sps_sgld_button.like { background-image: -webkit-linear-gradient(top, #7cbee6, #0076bf); border-color: #d7eefa #1770a3 #042940 #9ecfeb; color: white; text-shadow: -1px -1px 0px #06284d; top: 70px; } \
.sps_sgld_button.like:hover { background-image: -webkit-linear-gradient(top, #7cbee6, #2990cc); color: #9ecfeb } \
.sps_sgld_button.dislike { background-image: -webkit-linear-gradient(top, #b7c4cc, #344047); border-color: #dae0e3 #1e2326 #344047 #a3a8ad; color: white; text-shadow: -1px -1px 0px #02101f; top: 92px; } \
.sps_sgld_button.dislike:hover { background-image: -webkit-linear-gradient(top, #9aa2a6, #344047); color: #b8b8b8 } \
.liked .sps_sgld_button.liked { background-image: -webkit-linear-gradient(top, #0076bf, #7cbee6); border-color: #042940 #9ecfeb #d7eefa #1770a3; color: #d7eefa; text-shadow: 1px 1px 0px #06284d; opacity: 0.5; padding: 0 1px 1px 0; top: 70px; } \
.disliked .sps_sgld_button.disliked { transform:rotate(180deg); -webkit-transform:rotate(180deg); color: #b8b8b8; opacity: 0.5; top: 92px; } \
.liked .sps_sgld_button.dislike, .disliked .sps_sgld_button.like { display: none; } \
.liked.fresh .sps_sgld_button.liked { opacity: 1; margin-right: -1px } \
.featured__inner-wrap.liked.fresh { background-color: #3F4A80; border: 1px solid; border-color: #a6a6ff #0000d9 #000070 #7575ff; border-radius: 3px; } \
.featured__inner-wrap.disliked.fresh { opacity: 0.3; } .giveaway__row-outer-wrap.disliked.fresh .global__image-outer-wrap {background-color: #f0f2f5;} \
",
    },


    // ======== Work block part =======

    _work : SPS_AjaxWorkLib(),


    // ======== Render block part =======

    _render : {
        // Table of games marked as liked
        likedTable : {
            tableHeader : function() {
                var ajaxRoll = '<span class="ajax_progress">'+__('table.ajax')+'</span>';
                var heads = '<thead><th  class="game_refresh">&nbsp;</th>'+
                       '<th class="game_num">'+ajaxRoll+'<span class="sort_header">'+__('table.number')+'<br/>'+this.sortingLinks('added')+'</span></th>'+
                       '<th class="game_name">'+ajaxRoll+'<span class="sort_header">'+__('table.name')+'<br/>'+this.sortingLinks('name')+'</span></th>'+
                       '<th class="game_count"><span class="last_updated"></span></th>'+
                       '<th class="game_delta">'+ajaxRoll+'<span class="sort_header">'+__('table.delta')+'<br/>'+this.sortingLinks('time')+'</span></th>'+
                       '<th class="game_links"><div class="comment__submit-button" onclick="javascript:SPS_SteamgiftLikes.action.updateTime();" title="'+__('description.time')+'">'+__('button.time')+'</div>'+
                                              '<input type="button" onclick="javascript:SPS_SteamgiftLikes.action.scanGames();" value="'+__('button.scanRow')+'">'+
                                              '<input type="button" onclick="javascript:SPS_SteamgiftLikes.action.scanGamesPlain();" value="'+__('button.scanPlain')+'"></th></thead>';
                return heads;
            },

            // pair of sorting links for table header
            sortingLinks : function( criteria ) {
                return '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.action.sortList(this);" data-criteria="'+criteria+'" data-order="1">'+__('table.sortAsc')+'</span>'+
                       '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.action.sortList(this);" data-criteria="'+criteria+'" data-order="0">'+__('table.sortDesc')+'</span>';
            },

            // panel of service action controls
            servicePanel : function() {
                return '<div class="service">'+
                       '<input type="button" class="spoiler_button" onclick="javascript:SPS_SteamgiftLikes.action.toggleSpoiler(this);" value="'+__('button.serviceToggle')+'">'+
                       '<div class="spoiler"><input id="checkOwnButton" type="button" onclick="javascript:SPS_SteamgiftLikes.action.checkOwnGames();" value="'+__('button.checkOwn')+'"></div>'+
                       '<div class="spoiler"><input id="toggleDeleteButton" type="button" onclick="javascript:SPS_SteamgiftLikes.action.toggleDeleteGames();" value="'+__('button.toggleDeleteOff')+'"></div>'+
                       '</div>';
            },

            // panel of fast click list
            fastClickPanel : function() {
                return '<div class="fast_click_panel">'+
                       '<div id="toggleNostrictFCButton" class="comment__submit-button pressed" onclick="javascript:SPS_SteamgiftLikes.action.toggleNostrictFastclick();" title="'+__('description.toggleFCNostict')+'">'+__('button.toggleNostrictFCOff')+'</div>'+
                       '<div class="fast_click"></div>'+
                       '</div>';
            },

            // table body content
            tableRows : function() {
                var rows = [],
                    i = 1,
                    that = this;
                thut._data.list.iterateLiked( function( key, item ) {
                    rows.push( that._tableRow(i, key, item) );
                    i++;
                    });
                return rows;
            },

            _tableRow : function( num, gameId, gameData ) {
                var name = gameData,
                    steamId = false;
                if ( !thut._data.list.isLikedOld(gameId) ) {
                    name = gameData.name;
                    steamId = ' '+thut._settings.site._steamIdAttribute+'="'+gameData.steamId+'"';
                }
                return '<tr '+thut._settings.site._gameIdAttribute+'="'+gameId+'">'+
                      '<td class="game_refresh">'+this.rowRefreshLink()+'</td>'+
                      '<td class="game_num">'+num+'</td>'+
                      '<td class="game_name" '+thut._settings.site._gameIdAttribute+'="'+gameId+'"'+(steamId?steamId:'')+'>'+
                      (steamId?'':'<i class="fa fa-steam" onclick="javascript:SPS_SteamgiftLikes.action.updateTableSteamId(this);"></i>')+
                      '<a href="'+thut._render.likedTable.searchUrl(name)+'" target="_blank">'+name+'</a></td>'+
                      '<td class="game_count"></td>'+
                      '<td class="game_delta"></td>'+
                      '<td class="game_links"></td></tr>';
            },

            // link to refresh the row on click
            rowRefreshLink : function() {
                return '<span onclick="javascript:SPS_SteamgiftLikes.action.scanOneRow(this);" class="refresh_row">'+__('table.refresh')+'</span>';
            },

            // link to remove the row on click
            rowRemoveLink : function() {
                return '<i class="fa fa-remove" onclick="javascript:SPS_SteamgiftLikes.action.removeTableRow(this);"></i>';
            },

            // list of numbered links to game giveaway for links cell
            linkListFull : function( strictList, nostrictList ) {
                var row = '',
                    strictRender = 'no scrict match';
                thut._logic.prepareNow();
                if ( strictList.length ) {
                    strictRender = thut._render.likedTable.linkList( strictList );
                }
                row += '<span class="links-strict">' + strictRender + '</span>';
                if ( nostrictList.length ) {
                    row += '((<span class="links-nostrict">' + thut._render.likedTable.linkList( nostrictList )+'</span>))';
                }
                return row;
            },

            linkList : function( list ) {
                var name, nostrict, out = '', counter = 1, i;
                for ( i in list ) {
                    name = '';
                    nostrict = false;
                    if ( typeof list[i].nostrict !== 'undefined' && list[i].nostrict ) {
                        nostrict = true;
                    };
                    if ( typeof list[i].name !=='undefined' ) {
                        name = list[i].name.replace('"', '&quote;');
                        if ( nostrict ) {
                            name = 'by ~~'+name+'~~';
                        }
                        name = ' data-game-name="'+name+'" ';
                    }
                    out += '<a href="'+list[i].link+'" '+
                              'class="link-item '+thut._logic.getTimeClass(list[i].time)+'" '+
                              'target="_blank" '+
                              'data-tick-time="'+list[i].time+'"'+
                              name+
                              '>['+(nostrict?'<strike>':'')+counter+(nostrict?'</i>':'')+']</strike>';
                    counter++;
                }
                return out;
            },

            // url to search page for certain game
            searchUrl : function( $row ) {
                if ( 'string' != typeof $row ) {
                    $row = thut._parse.likedTable.gameName($row);
                }
                return '/giveaways/search?q='+$row;
            },

            // url to common list page
            plainPageUrl : function( data, pageNum ) {
                return '/giveaways/search?page='+pageNum;
            },

            // fast click list content
            fastClickList : function() {
                thut._logic.prepareNow();
                var result = '', list = thut._data.fastClick.list();
                if ( list.length ) {
                    result += '<div class="links-strict">'+thut._render.likedTable.linkList( list )+'</div>';
                }
                list = thut._data.fastClick.list(true);
                if ( list.length ) {
                    result += '<div class="links-nostrict">'+thut._render.likedTable.linkList( list )+'</div>';
                }
                return result;
            },

            // time before giveavay ends
            // timestamp: giveaway end time  in ms
            // ignoreNostrict: don't add () for deltas non-strict
            // return time sting like '1d 10h' or '15:05:03'
            deltaTime : function( timestamp, ignoreNostrict ) {
                var out = '', isNostrict = false, i,
                    date = new Date();
                var delta = timestamp - thut._logic.getNow();
                if ( 'undefined' == typeof ignoreNostrict ) {
                    ignoreNostrict = false;
                }
                if ( delta <= 0 ) {
                    return "time's out";
                }
                if ( delta > TIME__MONTH_MS ) {
                    delta -= TIME__MONTH_MS;
                    isNostrict = true;
                }
                date.setTime(delta);
                var day = date.getUTCDate(true)-1;
                if ( day > 0 ) {
                    out += day+'d '+date.getUTCHours()+'h';
                } else {
                    var time = [date.getUTCHours(),
                                date.getUTCMinutes(),
                                date.getUTCSeconds()];
                    for ( i=1; i<3; i++ ) {
                        if ( time[i] < 10 ) {
                            time[i] = '0'+time[i];
                        }
                    }
                    if ( !time[0] ) {
                        time.shift();
                    }
                    out += time.join(':');
                }
                if ( isNostrict && !ignoreNostrict ) {
                    out = '( '+out+' )';
                }
                return out;
            },
        },

        // Page with settings import/export and custom like
        syncPage : {
            // form for settings import/export
            dataForm : function() {
               return '<textarea id="import_settings_text"></textarea>'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pullSettings();" title="'+__('description.refresh')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.refresh')+'</div>&nbsp;'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pushSettings(false);" title="'+__('description.import')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.import')+'</div>&nbsp;'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pushSettings(true);" title="'+__('description.merge')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.merge')+'</div>&nbsp;';
            },

            // form for like/dislike custom game
            customLikeForm : function() {
                return  '<input class="js__autocomplete-id" type="hidden" name="game_id" id="like_game_id" value="">'+
                    '<input data-autocomplete-do="autocomplete_game" class="js__autocomplete-name" type="text" placeholder="Start typing a game..." id="like_game_name" value="">'+
                    '<div class="js__autocomplete-data"></div>'+
                    '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.markCustomGameAs(\'like\');"><i class="fa fa-arrow-circle-right"></i> '+__('button.customLike')+'</div>&nbsp;'+
                    '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.markCustomGameAs(\'dislike\');"><i class="fa fa-arrow-circle-right"></i> '+__('button.customDislike')+'</div>&nbsp;';
            },
        },

        // Append operations for all pages
        append : {
            // add styles to page
            styles : function( styleContent ) {
                $('head').append('<style type="text/css">'+styleContent+'</style>');
            },

            // add heading title on steamgift settings page
            settingsHead : function( title ) {
                $('div.page__heading').parent().append(
                    '&nbsp;<div class="page__heading"><div class="page__heading__breadcrumbs"><a href="#">'+title+'</a></div></div><form onsubmit="return false;"></form>'
                );
            },

            // add content part on steamgift settings page
            settingsRow : function( number, title, body ) {
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
            },

            // add given icon-button for steamgift list item
            listIcon : function( $listItem, type, forSingle ) {
                var $icon = $('<div>'+__('button.'+type)+'</div>')
                              .addClass( thut._settings.filter._iconClass )
                              .addClass( type );
                if ( type == 'liked' || type == 'disliked' ) {
                    if ( forSingle && thut._parse.singlePage.isNotEntered() ||
                            ( !forSingle && thut._parse.gameList.isNotEntered($listItem) ) ) {
                        $listItem.addClass('fresh');
                    }
                    $icon.attr('onclick','SPS_SteamgiftLikes.action.unmarkGameAs(\''+type+'\', this)');
                    $listItem.addClass(type);
                } else if ( type == 'like' || type == 'dislike' ) {
                    $icon.attr('onclick','SPS_SteamgiftLikes.action.markGameAs(\''+type+'\', this)');
                } else {
                    // no-steam-id button will force relike the game
                    $icon.attr('onclick','SPS_SteamgiftLikes.action.markGameAs(\'like\', this)');
                }
                $listItem.append( $icon );
            },

            // choose and add the icon-buttons to usual steamgift list item
            likesForItem : function( $listItem ) {
                var iconList, forSingle = false;
                if ( 'undefined' == typeof $listItem || $listItem.length == 0 ) {
                    $listItem = $('.featured__inner-wrap');
                    iconList = thut._parse.singlePage.iconsRequired();
                    forSingle = true;
                } else {
                    iconList = thut._parse.gameList.iconsRequired($listItem);
                }
                for( i=0; i<iconList.length; i++ ) {
                    thut._render.append.listIcon($listItem, iconList[i], forSingle);
                }
            },
        },

        // Page update operations for all pages
        update : {
            // set 'work in progress' state for table
            // setMessage : set the 'updated' cell content, if defined; std message by default, if not string
            workStart : function( setMessage ) {
                $('.liked_games').addClass('in_progress');
                if ( 'undefined' != typeof setMessage && false !== setMessage ) {
                    if ( 'string' != typeof setMessage ) {
                        setMessage = __('table.inProgress');
                    }
                    thut._render.update.tableUpdateText(setMessage);
                }
            },

            // set 'in progress state' off for table
            // setTime : set the current time to 'updated' cell, if defined & true
            workStop : function( setTime ) {
                $('.liked_games').removeClass('in_progress');
                if ( 'undefined' != typeof setTime && setTime ) {
                    thut._data.counter.updated(true);
                    thut._render.update.tableUpdatedRestore();
                }
            },

            // removes the icon-buttons for usual steamgift list item
            clearIconsFor : function( $listItem ) {
                if ( 'undefined' == typeof $listItem || $listItem.length == 0 ) {
                    $listItem = $('.featured__inner-wrap');
                }
                $listItem.find('.'+thut._settings.filter._iconClass).remove();
                $listItem.removeClass('liked')
                    .removeClass('disliked')
                    .removeClass('fresh');
            },

            // fill the import textarea by current gamelist settings
            importSettings : function() {
                var settingsText = thut._data.list.export();
                $('#import_settings_text').val(settingsText);
            },

            // reset the custom-like form to empty
            resetCustom : function() {
                $('#like_game_id').val('');
                $('#like_game_name').val('');
            },

            // update the sorting controls state
            sortButtons : function( criteria, order ) {
                var $current = $('.liked_games [data-criteria='+criteria+'][data-order='+order+']');
                var $active = $('.liked_games .sort_link.current, .liked_games .sort_link.active');
                $('.liked_games .sort_link').removeClass('active').removeClass('current');
                $active.addClass('active');
                $current.parent().find('.sort_link').removeClass('active');
                $current.addClass('current');
            },

            // update one table row with game-list scan results
            // look the actions.scanGames and action.scanOneRow for whole process
            tableRowScanned : function( $row, response ) {
                thut._logic.prepareNow();
                thut._render.update.resetTable($row);
                var gameId = thut._parse.likedTable.gameId($row);
                var $gameRows = $(thut._settings.site._gameInListSelector, response);
                if ( $gameRows.length ) {
                    $gameRows.each(function(){
                        var giveawayContainer = $(this).parent();
                        var itemGameId = thut._parse.gameList.gameId(giveawayContainer);
                        if ( thut._data.list.isDisliked(itemGameId) ) {
                            return;
                        }
                        if ( itemGameId == gameId ) {
                            thut._logic.addCounter(gameId, giveawayContainer, true);
                            return;
                        }
                        thut._logic.addCounter(gameId, giveawayContainer, false);
                    });
                    thut._render.update.plainTable(gameId);
                }
                return $row.next();
            },

            // update counter data for one game-list page scanned
            // look the actions.scanGamesPlain for whole process
            plainPageScanned : function( exitFlag, response, pageNum ) {
                thut._logic.prepareNow();
                thut._render.update.tableUpdateText(pageNum);
                var $gameRows = $(thut._settings.site._gameInListSelector, response);
                $gameRows.each(function(){
                    var giveawayContainer = $(this).parent();
                    var itemGameId = thut._parse.gameList.gameId(giveawayContainer);
                    if ( thut._data.list.isDisliked(itemGameId) ) {
                        return;
                    }
                    if ( thut._data.list.isLiked(itemGameId) ) {
                        thut._logic.addCounter(itemGameId, giveawayContainer, true);
                        return;
                    }
                    var gameName = thut._parse.gameList.gameName(giveawayContainer);
                    var similarGameIdList = thut._data.list.isLikedByName(gameName);
                    if ( similarGameIdList.length ) {
                        thut._logic.addCounter(similarGameIdList, giveawayContainer, false);
                    }
                });
                return ($gameRows.length < 50);
            },

            // update liked table for one owned game-list page scanned
            // look the actions.scanOwnGames for whole process
            ownedGamePageScanned : function( exitFlag, response, pageNum ) {
                thut._render.update.tableUpdateText(pageNum);
                var $gameRows = $('.table__row-outer-wrap', response),
                    $tableRow;
                $gameRows.each(function(){
                    var steamId = thut._parse.customList.steamId(this);
                    if ( !steamId ) {
                        return;
                    }
                    $tableRow = thut._parse.likedTable.rowBySteamId(steamId);
                    if ( $tableRow.length == 0 ) {
                        return;
                    }
                    thut._render.update.tableRowAsRemovable($tableRow);
                    });
                return ($gameRows.length < 25);
            },

            // clean the scanned data view for liked games table
            resetTable : function($row) {
                thut._logic.prepareNow();
                if ( 'undefined' == typeof $row ) {
                    $row = $('.liked_games tbody tr');
                }
                $row.removeClass('to_count').removeClass('has_links').addClass('no_links');
                $('td.game_count', $row).html('0 / 0');
                $('td.game_links', $row).html('');
                $('td.game_delta', $row).html('').attr('data-tick-time', TIME__FARFAR_MS + thut._logic.getNow() );
            },

            // update the table rows by scanned counter data
            // gameId : if set, updates the row for given game; iterate all the counter data else
            // skipTimeUpdate : don't render time deltas for row (used to render it for whole table)
            plainTable : function( gameId, record, skipTimeUpdate ) {
                if ( typeof(gameId) !== 'undefined' && gameId ) {
                    if ( typeof(record) == 'undefined' || !record ) {
                        record = thut._data.counter.getRecord(gameId);
                    }
                    if ( ! record ) {
                        console.log('Game "'+gameId+'" not found in plain count');
                        return;
                    }
                    var row = $('td.game_name['+thut._settings.site._gameIdAttribute+'='+gameId+']').parent();
                    if ( !row ) {
                        return;
                    }
                    $('td.game_count', row).html( record.strict.length + (record.nostrict.length?(' ('+record.nostrict.length+')'):'')+' / '+record.totalCount);
                    $('td.game_delta', row).attr('data-tick-time', record.minTime);
                    if ( record.strict.length + record.nostrict.length > 0 ) {
                        $('td.game_links', row).html( thut._render.likedTable.linkListFull( record.strict, record.nostrict ) );
                        $(row).removeClass('to_count').removeClass('no_links').addClass('has_links');
                    }
                    if ( !skipTimeUpdate ) {
                        thut._render.update.tableTimeDelta(row);
                    }
                    return;
                }
                thut._render.update.resetTable();
                thut._data.counter.iterateWith( function(id,record){ thut._render.update.plainTable(id,record,true); } );
                thut._render.update.fastClick();
                thut._render.update.tableUpdatedRestore();
                thut._render.update.tableTimeDelta();
            },

            // updates the fasclick panel basing on current counter data
            fastClick : function() {
                thut._data.fastClick.scanCounter();
                var fastClickList = thut._render.likedTable.fastClickList();
                var $panel = thut._parse.likedTable.fastClickPanel();
                var $block = thut._parse.likedTable.fastClick();
                $block.html( fastClickList );
                if ( fastClickList ) {
                    $panel.show();
                } else {
                    $panel.hide();
                }
            },

            // set the 'updated' cell content
            tableUpdateText : function( text ) {
                $('.liked_games .last_updated').html(text);
            },

            // set the 'updated' cell as counter saved time
            tableUpdatedRestore : function() {
                var time = thut._data.counter.updated();
                var timeText = '';
                if ( time ) {
                    time = new Date(time);
                    timeText = time.toTimeString().split(' ')[0];
                }
                this.tableUpdateText(timeText);
            },

            // show/hide the spoiler panel by button
            toggleSpoiler : function( button ) {
                var $container = $(button).parent();
                $container.find('.spoiler').toggle();
            },

            // update game name cell after steam-id parsing
            tableNameCell : function( $row, gameId, gameData ) {
                var name = gameData;
                var $cell = $('.game_name', $row);
                $cell.html('');
                if ( !thut._data.list.isLikedOld(gameId) ) {
                    name = gameData.name;
                    $cell.attr(thut._settings.site._steamIdAttribute, gameData.steamId);
                } else {
                    $cell.append('<i class="fa fa-steam" onclick="javascript:SPS_SteamgiftLikes.action.updateTableSteamId(this);"></i>');
                }
                $cell.attr(thut._settings.site._gameIdAttribute, gameId);
                $cell.append('<a href="'+thut._render.likedTable.searchUrl(name)+'" target="_blank">'+name+'</a>');
            },

            // insert removing link to the refresh column
            tableRowAsRemovable : function( $row ) {
                var $cell = $('.game_refresh', $row);
                $cell.html(thut._render.likedTable.rowRemoveLink());
            },

            // insert refreshing link to the refresh column
            tableRowAsRefreshable : function( $row ) {
                var $cell = $('.game_refresh', $row);
                $cell.html(thut._render.likedTable.rowRefreshLink());
            },

            // set the delete-games mode on/off
            setDeleteGamesMode : function( switchOn ) {
                var $button = thut._parse.likedTable.deleteGamesButton();
                if ( switchOn ) {
                    $button.addClass('pressed');
                    $button.val(__('button.toggleDeleteOn'));
                    $('.liked_games tbody tr').each( function() {
                        thut._render.update.tableRowAsRemovable( $(this) );
                    });
                } else {
                    $button.removeClass('pressed');
                    $button.val(__('button.toggleDeleteOff'));
                    $('.liked_games tbody tr').each( function() {
                        thut._render.update.tableRowAsRefreshable( $(this) );
                    });
                }
            },

            // set the fastclick mode strict/nostrict
            setFastclickMode : function( strict ) {
                var $button = thut._parse.likedTable.toggleFastclickModeButton();
                if ( strict ) {
                    $button.removeClass('pressed');
                    $button.html(__('button.toggleNostrictFCOn'));
                    $('.fast_click .links-strict').hide();
                    $('.fast_click .links-nostrict').show();
                } else {
                    $button.addClass('pressed');
                    $button.html(__('button.toggleNostrictFCOff'));
                    $('.fast_click .links-nostrict').hide();
                    $('.fast_click .links-strict').show();
                }
            },

            // get gameId for current giveaway
            pageGameId : function( gameId ) {
                var $link = $('.global__image-outer-wrap--game-large:first');
                if ( $link.length ) {
                    $link.attr(thut._settings.site._gameIdAttribute, gameId);

                }
            },

            // update delta times for rows and lists
            tableTimeDelta : function(row) {
                thut._logic.prepareNow();
                if ( 'undefined' == typeof row ) {
                    row = $('tr.has_links');
                } else {
                    if ( !$(row).hasClass('has_links') ) {
                        return;
                    }
                }
                $('td.game_delta', row).each( function(){
                    var time = parseInt($(this).attr('data-tick-time'));
                    if ( isNaN(time) ) {
                        return;
                    }
                    $(this).html(thut._render.likedTable.deltaTime(time));
                });
                $('td.game_links a.link-item', row).each( function(){
                    var time = parseInt($(this).attr('data-tick-time'));
                    if ( isNaN(time) ) {
                        return;
                    }
                    $(this).attr('title', thut._render.likedTable.deltaTime(time, true));
                });
                $('.fast_click a.link-item').each( function(){
                    var time = parseInt($(this).attr('data-tick-time'));
                    var name = $(this).attr('data-game-name');
                    if ( isNaN(time) ) {
                        time = '';
                    } else {
                        time = thut._render.likedTable.deltaTime(time, true)
                    }
                    $(this).attr('title', time + "\n" + name );
                });
            },

        },
    },


    // ======== Parse block part =======

    _parse : {
        // Usual steamgift game list
        gameList : {
            // get gameId for list item
            gameId : function( $listItem ) {
                return ''+$listItem.attr( thut._settings.site._gameIdAttribute )+'_';
            },

            // detect the icons types needed for list item
            iconsRequired : function ( $listItem ) {
                var gameId = this.gameId($listItem);
                return thut._parse.util.iconsRequiredFor(gameId);
            },

            // get list item for control used
            listItemByButton : function( button ) {
                return $(button).parents( thut._settings.site._gameWrapperSelector );
            },

            // get game name from list item
            gameName : function( $listItem ) {
                var name = $( thut._settings.site._gameTitlePartSelector , $listItem ).html();
                return thut._parse.util.cutGameName(name);
            },

            // get giveaway url from list item
            giveawayUrl : function( $listItem ) {
                return $( thut._settings.site._gameTitlePartSelector , $listItem ).attr('href');
            },

            // get steamId from listitem
            steamId : function( $listItem ) {
                var $link = $listItem.find('.fa.fa-steam:first').parent();
                return thut._parse.util.steamIdByUrl( $link.attr('href') );
            },

            // get giveaway time end for list item
            // @deprecated see giveawayTimestamp instead
            giveawayTime : function( $listItem ) {
                return $('.fa-clock-o', $listItem).next().attr('title');
            },

            // get giveaway end timestamp for list item
            giveawayTimestamp : function( $listItem ) {
                var timeSeconds = $('.fa-clock-o', $listItem).next().attr('data-timestamp');
                timeSeconds = parseInt(timeSeconds);
                if ( NaN == typeof timeSeconds ) {
                    return 0;
                }
                return timeSeconds * 1000;
            },

            // check if giveaway is not entered yet
            isNotEntered : function( $listItem ) {
                return !$('.giveaway__row-inner-wrap', $listItem).hasClass('is-faded');
            },
        },

        // Table of games marked as liked
        likedTable : {
            // get a value of sorting parameter for table row
            sortKey : function( row, sortBy ) {
                var key = '';
                switch ( sortBy ) {
                    case 'name':
                        key = $('.game_name a',row).html();
                        break;
                    case 'time':
                        key = TIME__FARFAR_MS + thut._logic.getNow();
                        var value = $('.game_delta:first',row).attr('data-tick-time');
                        if ( value ) {
                            key = parseInt(value);
                            if ( isNaN(key) ) {
                                key = TIME__FARFAR_MS + thut._logic.getNow();
                            }
                        }
                        break;
                    case 'added':
                        key = parseInt($('.game_num',row).html());
                        break;
                }
                return key;
            },

            // get a sort criteria by sort button
            sortCriteria : function( button ) {
                return $(button).attr('data-criteria');
            },

            // get a sort order by sort button
            sortOrder : function( button ) {
                return $(button).attr('data-order');
            },

            // get game name from table row
            gameName : function( $row ) {
                return $row.find('td.game_name > a').html();
            },

            // get gameId from table row
            gameId : function( $row ) {
                return $row.find('td.game_name').attr( thut._settings.site._gameIdAttribute );
            },

            // get table row by steamId if exists
            rowBySteamId : function( steamId ) {
                var $cell = $('td.game_name['+thut._settings.site._steamIdAttribute+'='+steamId+']');
                if ( $cell.length ) {
                    return $cell.parent();
                }
                return [];
            },

            // get table row for control used inside
            rowByButton : function( button ) {
                return $(button).parents( 'tr' );
            },

            // get the toggle-delete-mode button from service panel
            deleteGamesButton : function () {
                var $button = $('.service #toggleDeleteButton');
                return $button;
            },

            // check if delete-mode is toggled on
            isDeleteGamesOn : function() {
                return this.deleteGamesButton().hasClass('pressed');
            },

            // fast click panel
            fastClickPanel : function() {
                return $('.fast_click_panel');
            },

            // fast click inner block
            fastClick : function() {
                return $('.fast_click');
            },

            // get the toggle-fastclick-mode button
            toggleFastclickModeButton : function () {
                var $button = $('.fast_click_panel #toggleNostrictFCButton');
                return $button;
            },

            // check if delete-mode is toggled on
            isStrictFastclickOff : function() {
                return this.toggleFastclickModeButton().hasClass('pressed');
            },
        },

        // Short giveaway game list as ajax-search or entered-list
        customList : {
            // get the numeric gameId from ajax-search result
            rawGameId : function() {
                return $('#like_game_id').val();
            },

            // get found game name from ajax-search result
            gameName : function( $listItem ) {
                var name;
                if ( 'undefined' == typeof $listItem ) {
                    name = $('#like_game_name').val();
                } else {
                    name = $('.table__column__heading', $listItem).html();
                }
                return thut._parse.util.cutGameName(name);
            },

            // get ajax-list item by numeric gameId
            listItemById : function( rawId, $container ) {
                if ( 'undefined' == typeof $container ) {
                    $container = $('.js__autocomplete-data');
                }
                return $('.table__row-outer-wrap[data-autocomplete-id='+rawId+']', $container);
            },

            // get ajax-list item by steamId
            listItemBySteamId : function( steamId, $container ) {
                if ( 'undefined' == typeof $container ) {
                    $container = $('.js__autocomplete-data');
                }
                var that = this,
                    checkSteamId,
                    listItem = [];
                $('.table__row-outer-wrap', $container).each(function(){
                    checkSteamId = that.steamId(this);
                    if ( checkSteamId == steamId ) {
                        listItem = $(this);
                    }
                });
                return listItem;
            },

            // get steamId from ajax-search list item
            steamId : function( $listItem ) {
                var $link = $('.table__column__secondary-link:first', $listItem);
                if ( $link.length == 0 ) {
                    return false;
                }
                return thut._parse.util.steamIdByUrl( $link.attr('href') );
            },

            // get gameId from ajax-search list item
            gameId : function( $listItem ) {
                var gameId = $listItem.attr('data-autocomplete-id');
                if ( gameId ) {
                    gameId = ''+gameId+'_';
                }
                return gameId;
            },
        },

        // single qiveaway page
        singlePage : {
            // get steamId for current giveaway
            steamId : function() {
                var $link = $('.global__image-outer-wrap--game-large:first');
                return thut._parse.util.steamIdByUrl( $link.attr('href') );
            },

            // get gameId for current giveaway
            gameId : function() {
                var $link = $('.global__image-outer-wrap--game-large:first');
                var gameId = $link.attr(thut._settings.site._gameIdAttribute);
                if ( !gameId ) {
                    gameId = thut._data.list.searchBySteamId(this.steamId());
                }
                return gameId;
            },

            // get gameName for current giveaway
            gameName : function() {
                var name = $('.featured__heading__medium:first').html();
                return thut._parse.util.cutGameName(name);
            },

            // detect the icons types needed for page
            iconsRequired : function () {
                var gameId = this.gameId();
                if ( gameId ) {
                    return thut._parse.util.iconsRequiredFor(gameId);
                }
                return ['like','dislike'];
            },

            // check is giveaway is not entered yet
            isNotEntered : function() {
                var $control = $('.sidebar__entry-insert');
                if ( $control.length == 0 ) {
                    return false;
                }
                return !$control.hasClass('is-hidden');
            },

        },

        // utility for various data parsing
        util : {
            // get steamId from steam application url
            // return false if not faound
            steamIdByUrl : function( url ) {
                var matches = url.match( /\/(\d+)\//i );
                if ( !matches ) {
                    return false;
                }
                return matches[1];
            },

            // get safe game name
            // cut the ... part in the end, if name was too long for listitem
            cutGameName : function( name ) {
                if ( name.substr(-3) === '...' ) {
                    name = name.substr(0,name.lastIndexOf(' '));
                }
                return name;
            },

            // get the giveaway end time in ms by text time description
            giveawayTime : function( timeString ) {
                var parts = timeString.split(',');
                var timePart = parts.pop();
                var timeBonus = 0;
                var today = new Date();
                if ( parts[0] == 'Today' ) {
                    parts[0] = today.toDateString();
                } else if ( parts[0] == 'Tomorrow' ) {
                    parts[0] = today.toDateString();
                    timeBonus += TIME__DAY_MS;
                }
                var tempString = parts.join('')+timePart.slice(0,-2)+':00'; // compose the datetime to parse
                var tempDate = new Date();
                tempDate.setTime(Date.parse(tempString));
                if ( timePart.indexOf('pm') >= 0 ) {
                    timeBonus += TIME__DAYHALF_MS;
                }
                if ( tempDate.getHours()%12 == 0 ) {
                    timeBonus -= TIME__DAYHALF_MS;
                }
                return tempDate.getTime()+timeBonus;
            },

            // detect the icons types needed for game by gameId
            iconsRequiredFor : function( gameId ) {
                var iconList = [];
                if ( thut._data.list.isLiked(gameId) ) {
                    if ( thut._data.list.isLikedOld(gameId) ) {
                        iconList.push('steam');
                    }
                    iconList.push('liked');
                    return iconList;
                }
                if ( thut._data.list.isDisliked(gameId) ) {
                    iconList.push('disliked');
                    return iconList;
                }
                iconList.push('like');
                iconList.push('dislike');
                return iconList;
            },
        },
    },


    // ======== Logic block part =======

    _logic : {
        // now timestamp
        __now : 0,

        // append the counter data for game ids
        // gameIdList : affected gameId or array of gameId
        // container : listItem from giveaway list
        // isStrict : if true, the strict list of counter item will be appended; nonStrict else
        addCounter : function( gameIdList, container, isStrict ) {
            var giveawayLink = thut._parse.gameList.giveawayUrl(container);
            var giveawayDeltaTime = thut._parse.gameList.giveawayTimestamp(container);
            var giveawayItem = {link: giveawayLink, time: giveawayDeltaTime};
            var isNotEntered = thut._parse.gameList.isNotEntered(container);
            if ( !Array.isArray( gameIdList ) ) {
                gameIdList = [gameIdList];
            }
            var i, gameId;
            for ( i=0; i<gameIdList.length; i++ ) {
                gameId = gameIdList[i];
                thut._data.counter.initRecord(gameId);
                if ( isNotEntered ) {
                    thut._data.counter.appendRecord(gameId, giveawayItem, isStrict);
                }
                thut._data.counter.totalInc(gameId);
            }
        },

        // fetch steamId by gameId and name, then operate with it
        actRemoteSteamId : function( gameId, name, action ) {
            var rawGameId = gameId.substr(0,gameId.length-1);
            thut._work.runPager({ initUrl: '/ajax.php',
                                  initParams: {search_query: name, page_number: 1, do: 'autocomplete_game'},
                                  format: 'json',
                                  delay: 1000,
                                  delayTreshold: 2000 },
                                { start: function() {
                                    thut._render.update.workStart();
                                  },
                                  gotPage: function( data, response, pageNum) {
                                      thut._render.update.tableUpdateText(pageNum);
                                      var $listItem = thut._parse.customList.listItemById(rawGameId, response.html);
                                      if ( $listItem.length > 0 ) {
                                          return thut._parse.customList.steamId($listItem);
                                      }
                                      return ($('.table__row-outer-wrap', response.html).length < 5);
                                  },
                                  nextPageParams: function( data, params, pageNum ) {
                                      params.page_number = pageNum;
                                      return params;
                                  },
                                  stop: function(steamId){
                                      if ( 'string' == typeof steamId ) {
                                          if ( 'function' == typeof action ) {
                                              action(gameId,name,steamId);
                                          }
                                      }
                                      thut._render.update.workStop();
                                      thut._render.update.tableUpdatedRestore();
                                  },
                                },
                               true);
        },

        // fetch gameId by steamId and name, then operate with it
        actRemoteBySteamId : function( steamId, name, action ) {
            thut._work.runPager({ initUrl: '/ajax.php',
                                  initParams: {search_query: name, page_number: 1, do: 'autocomplete_game'},
                                  format: 'json',
                                  delay: 1000,
                                  delayTreshold: 2000 },
                                { start: function() {
                                    thut._render.update.workStart();
                                  },
                                  gotPage: function( data, response, pageNum) {
                                      thut._render.update.tableUpdateText(pageNum);
                                      var $listItem = thut._parse.customList.listItemBySteamId(steamId, response.html);
                                      if ( $listItem.length > 0 ) {
                                          return thut._parse.customList.gameId($listItem);
                                      }
                                      return ($('.table__row-outer-wrap', response.html).length < 5);
                                  },
                                  nextPageParams: function( data, params, pageNum ) {
                                      params.page_number = pageNum;
                                      return params;
                                  },
                                  stop: function(gameId){
                                      if ( 'string' == typeof gameId ) {
                                          if ( 'function' == typeof action ) {
                                              action(gameId,name,steamId);
                                          }
                                      }
                                      thut._render.update.workStop();
                                      thut._render.update.tableUpdatedRestore();
                                  },
                                },
                               true);
        },

        getTimeClass : function( timestamp ) {
            var linkClass = '', j;
            var timeDelta = timestamp - this.getNow();
            for ( j in thut._settings.filter._gameAlertStyles ) {
                if ( timeDelta <= thut._settings.filter._gameAlertStyles[j].time ) {
                    linkClass = thut._settings.filter._gameAlertStyles[j].class;
                    break;
                }
            }
            return linkClass;
        },

        prepareNow : function() {
            var now = new Date();
            this.__now = now.getTime();
        },

        getNow : function() {
            return this.__now;
        },
    },


    // ======== Data block part =======

    _data : {
        // Liked/disliked game list data
        list : {
            // list of liked/disliked games as:
            //     [gameId+'_']=>[gameName]  for disliked and old-liked
            //     [gameId+'_']=> { name: [gameName], steamId: [steamId] }   for liked
            //  game name is used for list on the setting page
            //  steamId is used for utility part
            __liked : {},
            __disliked : {},

            // load lists from storage
            load : function() {
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
            },

            // save lists to storage
            save : function() {
                localStorage.sps_sgld_disliked = JSON.stringify(this.__disliked);
                localStorage.sps_sgld_liked = JSON.stringify(this.__liked);
            },

            // check if in liked list
            isLiked : function( gameId ) {
                return ('undefined' != typeof this.__liked[gameId]);
            },

            // check if liked record is old-style (has name only)
            isLikedOld : function( gameId ) {
                return ( 'string' == typeof this.__liked[gameId] ) ;
            },

            // check if in disliked list
            isDisliked : function( gameId ) {
                return ('undefined' != typeof this.__disliked[gameId]);
            },

            // check if name contains liked names
            isLikedByName : function( gameName ) {
                gameName = gameName.toLowerCase();
                var gameIdList = [], localName;
                this.iterateLiked( function( key, item ){
                    localName = ('string'===typeof item)?item:item.name;
                    if ( gameName.indexOf(localName.toLowerCase()) >= 0 ) {
                        gameIdList.push(key);
                    }
                });
                return gameIdList;
            },

            // mark game as liked/or disliked
            // type : string 'like' or 'dislike'
            markAs : function( type, gameId, steamId, gameName ) {
                thut._data.list.load();
                var needSave = false;
                if ( 'like' == type ) {
                    needSave = thut._data.list.markAsLiked(gameId, steamId, gameName);
                } else if ( 'dislike' == type ) {
                    needSave = thut._data.list.markAsDisliked(gameId, gameName);
                }
                if ( needSave ) {
                    thut._data.list.save();
                }
            },

            // add game to liked list
            markAsLiked : function( gameId, steamId, gameName ) {
                if ( this.isLiked(gameId) && !(steamId && this.isLikedOld(gameId)) ) {
                    return false;
                }
                if ( steamId ) {
                    this.__liked[gameId] = { name: gameName, steamId: steamId };
                } else {
                    this.__liked[gameId] = gameName;
                }
                return true;
            },

            // add game to disliked list
            markAsDisliked : function( gameId, gameName ) {
                if ( this.isDisliked(gameId) ) {
                    return false;
                }
                this.__disliked[gameId] = gameName;
                return true;
            },

            // remove from liked list
            unmarkAsLiked : function( gameId ) {
                if ( !this.isLiked(gameId) ) {
                    return false;
                }
                delete this.__liked[gameId];
                return true;
            },

            // remove from liked list
            unmarkAsDisliked : function( gameId ) {
                if ( !this.isDisliked(gameId) ) {
                    return false;
                }
                delete this.__disliked[gameId];
                return true;
            },

            // represent list data as string (json)
            export : function() {
                return JSON.stringify({liked:this.__liked, disliked:this.__disliked});
            },

            // import and save external data to lists
            // toImport : object with .liked and .disliked arrays
            // toMerge : if true, existing rows will be hold, new added; else just overwrites the lists
            import : function( toImport, toMerge ) {
                var key,
                    that = this;
                if ( toImport.liked instanceof Object ) {
                    if ( toMerge ) {
                        thut._data.util.iterate(toImport.liked, function( key, item ) {
                            if ( !that.isLiked(key) || that.isLikedOld(key) ) {
                                that.__liked[key] = item;
                            }
                        });
                    } else {
                        this.__liked = toImport.liked;
                    }
                }
                if ( toImport.disliked instanceof Object ) {
                    if ( toMerge ) {
                        thut._data.util.iterate(toImport.disliked, function( key, item ) {
                            if ( !that.isDisliked(key) ) {
                                that.__disliked[key] = item;
                            }
                        });
                    } else {
                        this.__disliked = toImport.disliked;
                    }
                }
                this.save();
            },

            // get liked data for game
            getLiked : function( gameId ) {
                return this.__liked[gameId];
            },

            // search for gameId by steamId
            searchBySteamId : function( steamId ) {
                var gameId = false;
                var checkId = function( key, item ) {
                    if ( 'string' == typeof item ) {
                        return false;
                    }
                    if ( item.steamId === steamId ) {
                        gameId = key;
                        return true;
                    }
                    return false;
                };
                thut._data.util.iterate( this.__liked, checkId );
                return gameId;
            },

            // operates each liked game record with given function
            iterateLiked : function( func ) {
                thut._data.util.iterate( this.__liked, func );
            },
        },

        // Game scanner-counter data
        counter : {
            // data for found liked games giveaway games as:
            // update: last update time
            // games:  game counter records list as:
            //     [gameId+'_']=> { strict: list of giveaways strictly for this game
            //                      nostrict: list of giveaways for games with same name or about
            //                      totalCount: common count of giveaways found, including entered
            //                      minTime: time to closest giveaway end
            //                      }
            __plainCount : {},

            // load counter data from storage
            load : function() {
                if (localStorage.sps_sgld_counter) {
                    this.__plainCount = JSON.parse(localStorage.sps_sgld_counter);
                } else {
                    this.reset();
                }
            },

            // save counter data to storage
            save : function() {
                localStorage.sps_sgld_counter = JSON.stringify(this.__plainCount);
            },

            // clear the record for game
            // if gameId not set, clear all counter data
            reset : function( gameId ) {
                if ( 'undefined' != typeof gameId ) {
                    if ( 'undefined' != typeof this.__plainCount.games[gameId] ) {
                        delete this.__plainCount.games[gameId];
                    }
                    return;
                }
                this.__plainCount.games = {};
                this.__plainCount.updated = false;
            },

            // set last updated value, if set; return the value
            updated : function( time ) {
                if ( 'undefined' != typeof time ) {
                    if ( true === time ) {
                        time = new Date();
                        time = time.getTime();
                    }
                    this.__plainCount.updated = time;
                }
                return this.__plainCount.updated;
            },

            // get counter data for game
            getRecord : function( gameId ) {
                return this.__plainCount.games[gameId];
            },

            // add new data for game, if not yet
            initRecord : function( gameId ) {
                if ( !this.__plainCount.games[gameId] ) {
                    // time__later used to diff the game with entries and no entries (which have time_farfar) when sorting
                    this.__plainCount.games[gameId] = { strict: [], nostrict: [], totalCount: 0, minTime: TIME__LATER_MS + thut._logic.getNow() };
                }
            },

            // add the giveaway data to counter list
            appendRecord : function( gameId, gameData, isStrict ) {
                var listType = 'strict';
                var timeBonus = 0;
                if ( !isStrict ) {
                    listType = 'nostrict';
                    timeBonus = TIME__MONTH_MS;
                }
                if ( this.__plainCount.games[gameId][listType].length < 15 ) {
                    this.__plainCount.games[gameId][listType].push(gameData);
                }
                this.proposeMinTime(gameId, gameData.time + timeBonus);
            },

            // set delta time for record, if it is less then already stored
            proposeMinTime : function( gameId, minTime ) {
                if ( 'undefined' == typeof this.__plainCount.games[gameId] ) {
                    return false;
                }
                if ( minTime >= this.__plainCount.games[gameId].minTime ) {
                    return false;
                }
                this.__plainCount.games[gameId].minTime = minTime;
                return true;
            },

            // increment total counter for game record
            totalInc : function( gameId ) {
                if ( 'undefined' == typeof this.__plainCount.games[gameId] ) {
                    return false;
                }
                this.__plainCount.games[gameId].totalCount++;
                return this.__plainCount.games[gameId].totalCount;
            },

            // operates each counter record with given function
            iterateWith : function( func ) {
                thut._data.util.iterate( this.__plainCount.games, func );
            },
        },

        // Fast click panel data
        fastClick : {
            // data list for selected game giveaway as:
            //                      {
            //                      time: timestamp of giveaway end
            //                      link: url of giveqway page
            //                      name: game name
            //                      }
            __list : [],
            __noStrictList : [],

            // return list of fastclick records
            list : function( noStrict ) {
                if ( typeof noStrict !== undefined && noStrict ) {
                    return this.__noStrictList;
                }
                return this.__list;
            },

            // scan the gamecounter data for new fastclick data
            scanCounter : function() {
                this.reset();
                thut._data.counter.iterateWith( thut._data.fastClick.scanCounterRow );
                this.sort();
            },

            scanCounterRow : function( gameId, record ) {
                var gameName = '', i;
                var likedRecord = thut._data.list.getLiked(gameId);
                if ( typeof likedRecord !== 'undefined' ) {
                    gameName = likedRecord.name;
                }
                for ( i in record.strict ) {
                    thut._data.fastClick.appendList(gameId, gameName, record.strict[i], false);
                }
                for ( i in record.nostrict ) {
                    thut._data.fastClick.appendList(gameId, gameName, record.nostrict[i], true);
                }
            },

            appendList : function( gameId, gameName, record, noStrict ) {
                var fastRecord = { name: gameName,
                                   time: record.time,
                                   link: record.link,
                                 };
                if ( !noStrict ) {
                    thut._data.fastClick.__list.push( fastRecord );
                } else {
                    fastRecord.nostrict = true;
                }
                thut._data.fastClick.__noStrictList.push( fastRecord );
            },

            // reset fastclick record list
            reset : function() {
                this.__list = [];
                this.__noStrictList = [];
            },

            // sort the fastclick list by keys (means by time)
            sort : function() {
                this.__list.sort( this.fastClickItemCompare );
                this.__noStrictList.sort( this.fastClickItemCompare );
            },

            fastClickItemCompare : function( a, b ) {
                if( a.time < b.time ) return -1;
                if( a.time > b.time ) return 1;
                return 0;
            }
        },

        // utility data operations
        util : {
            // operate each data-list record by function
            iterate : function( list, func ) {
                var stop;
                for( var key in list ) {
                    if ( list.hasOwnProperty(key) ) {
                        stop = func(key, list[key]);
                        if ( true === stop ) {
                            break;
                        }
                    }
                }
            },
        },
    },


    // ======== Actions for external use =======

    action : {
        // mark game as liked/disliked
        markGameAs : function( type, button ) {
            var $wrapper = thut._parse.gameList.listItemByButton(button),
                gameName, gameId, steamId;
            if ( $wrapper.length ) {
                // for list item
                gameName = thut._parse.gameList.gameName($wrapper);
                gameId = thut._parse.gameList.gameId($wrapper);
                steamId = thut._parse.gameList.steamId($wrapper);
            } else {
                // for single page
                gameName = thut._parse.singlePage.gameName();
                steamId = thut._parse.singlePage.steamId();
                gameId = thut._parse.singlePage.gameId();
            }
            if ( gameId ) {
                thut._data.list.markAs( type, gameId, steamId, gameName );
                thut._render.update.clearIconsFor($wrapper);
                thut._render.append.likesForItem($wrapper);
            } else {
                thut._logic.actRemoteBySteamId( steamId, gameName, function(gameId,name,steamId){
                    thut._render.update.pageGameId(gameId);
                    thut.action.markGameAs(type, button);
                });
            }
        },

        // unmark game
        unmarkGameAs : function( type, button ) {
            var $wrapper = thut._parse.gameList.listItemByButton(button),
                gameId;
            if ( $wrapper.length ) {
                gameId = thut._parse.gameList.gameId($wrapper);
            } else {
                gameId = thut._parse.singlePage.gameId();
            }
            if ( gameId ) {
                thut._data.list.load();
                var needSave = false;
                if ( 'liked' == type ) {
                    needSave = thut._data.list.unmarkAsLiked(gameId);
                } else if ( 'disliked' == type ) {
                    needSave = thut._data.list.unmarkAsDisliked(gameId);
                }
                if ( needSave ) {
                    thut._data.list.save();
                }
                thut._render.update.clearIconsFor($wrapper);
                thut._render.append.likesForItem($wrapper);
            } else {
                var steamId = thut._parse.singlePage.steamId();
                var gameName = thut._parse.singlePage.gameName();
                thut._logic.actRemoteBySteamId( steamId, gameName, function(gameId,name,steamId){
                    thut._render.update.pageGameId(gameId);
                    thut.action.unmarkGameAs(type, button);
                });
            }
        },

        // get likes/disliked data to import form
        pullSettings : function() {
            thut._data.list.load();
            thut._render.update.importSettings();
        },

        // import data from import form
        pushSettings : function( toMerge ) {
            try {
                var key;
                var toImport = JSON.parse( $('#import_settings_text').val() );
                thut._data.list.import( toImport, toMerge );
                alert( __('alert.settingsApply') );
            } catch(e) {
                alert( __('alert.settingsError')+"\n"+e.message );
            }
        },

        // like/dislike the custom selected game
        markCustomGameAs : function( type ) {
            var rawGameId = thut._parse.customList.rawGameId();
            if ( !rawGameId ) return false;
            var $listItem = thut._parse.customList.listItemById(rawGameId);
            var steamId = thut._parse.customList.steamId($listItem);
            var gameId = ''+rawGameId+'_';
            var gameName = thut._parse.customList.gameName();
            thut._data.list.markAs( type, gameId, steamId, gameName );
            thut._render.update.importSettings();
            thut._render.update.resetCustom();
            return false;
        },

        // sort table
        sortList : function( button ) {
            if ( false === thut._work._workStart() ) {
                return;
            }
            thut._render.update.workStart();
            var sortBy = thut._parse.likedTable.sortCriteria(button),
                asc = thut._parse.likedTable.sortOrder(button);
            var rows = $('.liked_games tbody tr');
            var tableBody = $('tbody')[0];
            var i, j, rowCount = rows.length,
                ascBool = (asc=='1')?true:false;
            thut._logic.prepareNow();
            var map = [];
            for(i = 0; i < rowCount; i++) {
                map.push({id: $(rows[i]).attr(thut._settings.site._gameIdAttribute),
                          key: thut._parse.likedTable.sortKey(rows[i], sortBy)});
            }
            map.sort(function(a,b){
                var res = 0;
                if ( a.key > b.key ) {
                    res = 1;
                } else if ( a.key < b.key ) {
                    res = -1;
                }
                if ( !ascBool ) {
                    res = -res;
                }
                return res;
               });
            var elem1, elem2;
            for(i = rowCount-1; i > 0; i--) {
                elem1 = $('.liked_games tbody tr['+thut._settings.site._gameIdAttribute+'="'+map[i-1].id+'"')[0];
                elem2 = $('.liked_games tbody tr['+thut._settings.site._gameIdAttribute+'="'+map[i].id+'"')[0];
                tableBody.insertBefore(elem1, elem2);
            }
            thut._render.update.sortButtons( sortBy, asc );
            thut._render.update.workStop();
            thut._work._workStop();
        },

        // scan steamgift search for one table row
        scanOneRow : function( link ) {
            var $row = $(link).parents('tr');
            var gameId = thut._parse.likedTable.gameId($row);
            thut._render.update.resetTable($row);
            thut._render.update.workStart();
            thut._data.counter.reset(gameId);
            thut._work.actSingle( thut._render.likedTable.searchUrl($row),
                                  'html',
                                 { success: function( data ) {
                                       thut._render.update.tableRowScanned( $row, data );
                                   },
                                   stop: function() {
                                       thut._render.update.workStop();
                                       thut._render.update.tableUpdatedRestore();
                                       thut._render.update.sortButtons();
                                       thut._render.update.fastClick();
                                       thut._data.counter.save();
                                   },
                                 });
        },

        // scan steamgift search for each liked game
        scanGames : function() {
            var $row = $('.liked_games tbody tr').first();
            thut._work.runPager({ initUrl: thut._render.likedTable.searchUrl($row),
                                  format: 'html',
                                  delay: 500,
                                  delayTreshold: 1000 },
                                { start: function() {
                                    thut._data.counter.reset();
                                    $('.liked_games tbody tr').removeClass('no_links').removeClass('has_links').addClass('to_count');
                                    thut._render.update.workStart(true);
                                    return $row;
                                  },
                                  gotPage: thut._render.update.tableRowScanned,
                                  isFinished: function( data ){ return !data.length; },
                                  nextPageUrl: thut._render.likedTable.searchUrl,
                                  stop: function(data){
                                      thut._render.update.workStop(true);
                                      thut._data.counter.save();
                                      thut._render.update.sortButtons();
                                      thut._render.update.fastClick();
                                  },
                                });
        },

        // scan steamgift main list page-by-page
        // (recommended to use if you have more than 20-25 liked games)
        scanGamesPlain : function() {
            thut._work.runPager({ initUrl: '/',
                                  format: 'html',
                                  delay: 1000,
                                  delayTreshold: 2000 },
                                { start: function() {
                                    thut._data.counter.reset();
                                    thut._render.update.workStart();
                                  },
                                  gotPage: thut._render.update.plainPageScanned,
                                  nextPageUrl: thut._render.likedTable.plainPageUrl,
                                  stop: function(data){
                                      thut._render.update.plainTable();
                                      thut._render.update.workStop(true);
                                      thut._render.update.sortButtons();
                                      thut._data.counter.save();
                                  },
                                });
        },

        // show/hide the spoilered panel
        toggleSpoiler : function( button ) {
            thut._render.update.toggleSpoiler(button);
        },

        // add missing steamId for old liked game
        updateTableSteamId : function(button) {
            var $row = thut._parse.likedTable.rowByButton(button);
            if ( $row.length ) {
                var gameId = thut._parse.likedTable.gameId($row);
                var gameName = thut._parse.likedTable.gameName($row);
                thut._logic.actRemoteSteamId(gameId, gameName, function(gameId, gameName, steamId) {
                    thut._data.list.markAsLiked(gameId, steamId, gameName);
                    thut._data.list.save();
                    thut._render.update.tableNameCell($row, gameId, thut._data.list.getLiked(gameId));
                });
            }
        },

        // scan the list of already owned games and mark them in a table, if found
        checkOwnGames : function() {
            thut._work.runPager({ initUrl: '/account/steam/games',
                                  format: 'html',
                                  delay: 1000,
                                  delayTreshold: 2000 },
                                { start: function() {
                                    thut._render.update.workStart();
                                  },
                                  gotPage: thut._render.update.ownedGamePageScanned,
                                  nextPageUrl: function( data, pageNum ) {
                                      return '/account/steam/games/search?page='+pageNum;
                                  },
                                  stop: function(){
                                      thut._render.update.workStop();
                                      thut._render.update.tableUpdatedRestore();
                                  },
                                });
        },

        // toggle liked games removing mode (remove-links in refresh column)
        toggleDeleteGames : function() {
            if ( thut._parse.likedTable.isDeleteGamesOn() ) {
                thut._render.update.setDeleteGamesMode( false );
            } else {
                thut._render.update.setDeleteGamesMode( true );
            }
        },

        // toggle fast click mode (strict/no-strict)
        toggleNostrictFastclick : function() {
            if ( thut._parse.likedTable.isStrictFastclickOff() ) {
                thut._render.update.setFastclickMode( true );
            } else {
                thut._render.update.setFastclickMode( false );
            }
        },

        // remove the game from liked list and delete it's row from table
        removeTableRow : function( button ) {
            var $row = thut._parse.likedTable.rowByButton(button);
            if ( $row.length ) {
                var gameId = thut._parse.likedTable.gameId($row);
                var gameName = thut._parse.likedTable.gameName($row);
                if ( confirm( __( 'alert.rowRemove' )+"\n \""+gameName+"\"" ) ) {
                    thut._data.list.load();
                    if ( thut._data.list.unmarkAsLiked(gameId) ) {
                        thut._data.list.save();
                    }
                    $row.remove();
                }
            }
        },

        // updates the timing for scanned table
        updateTime : function() {
            thut._render.update.tableTimeDelta();
        },
    },


    // ======== Settings Page part =======

    // append liked game list to page
    _appendSettings : function() {
        var heads = this._render.likedTable.tableHeader();
        var service = this._render.likedTable.servicePanel();
        var fastClick = this._render.likedTable.fastClickPanel();
        this._data.list.load();
        var rows = this._render.likedTable.tableRows();
        this._render.append.styles( this._styles.likedTable );
        this._render.append.settingsRow( 1, 'Monitor', service+fastClick+'<table class="liked_games">'+heads+'<tbody>'+rows.join('')+'</tbody>'+heads+'</table>'+fastClick );
        this._data.counter.load();
        this._render.update.plainTable();
    },

    // append likes import/export form to page
    _appendImportSettings : function() {
        var form = this._render.syncPage.dataForm();
        this._render.append.styles( this._styles.gameSettings );
        this._render.append.settingsRow( false, 'Like/dislike import', form );
        this._data.list.load();
        this._render.update.importSettings();
    },

    // append add custom like/dislike form to page
    _appendCustomLikeSettings : function() {
        var form = this._render.syncPage.customLikeForm();
        this._render.append.settingsRow( 1, 'Add custom like', form );
    },


    // ======== Game list part =======

    // add icon-buttons for each list-item in steagift game-list
    _appendLikes : function() {
        this._data.list.load();
        this._render.append.styles( this._styles.gameList );
        $( this._settings.site._gameWrapperSelector ).each(function() {
            thut._render.append.likesForItem( $(this) );
        });
    },

    // add icon-buttons for steagift giveaway page
    _appendLikesSingle : function() {
        this._data.list.load();
        this._render.append.styles( this._styles.singlePage );
        thut._render.append.likesForItem();
    },

        // router, append the script controls depending on page uri
        route : function() {
            if (window.location.pathname.match(/^\/account\/settings\/giveaways/)) {
                this._render.append.settingsHead( 'Likes' );
                this._appendSettings();
            } else if (window.location.pathname.match(/^\/account\/settings\/profile/)) {
                this._render.append.settingsHead( 'Likes' );
                this._appendCustomLikeSettings();
                this._appendImportSettings();
            } else if ( window.location.pathname.match(/^\/giveaways/) || window.location.pathname.length === 0 || window.location.pathname === "/" ) {
                this._appendLikes();
            }  else if ( window.location.pathname.match(/^\/giveaway/) ) {
                this._appendLikesSingle();
            }
        },
    };

    var __ = function(text) {
        return thut.translate(text);
    };

    SPS_SteamgiftLikes.action = thut.action;

    return thut;
};

SPS_SteamgiftLikes().route();
