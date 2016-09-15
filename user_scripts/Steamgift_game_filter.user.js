// ==UserScript==
// @name         Steamgift game filter
// @version      2.0
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


SPS_SteamgiftLikes = function() {

    var thut = {
    // ======= Settings part =======

    _settings : {
        // site dependent settings
        site: {
            _gameWrapperSelector :          '.giveaway__row-outer-wrap', // game item to add like/dislike buttons
            _gameInListSelector :           '.widget-container > div:not([class]) > div:not([class]) .giveaway__row-inner-wrap', // items in search list for count-parser
            _gameInListNotEnteredSelector : '.widget-container > div:not([class]) > div:not([class]) .giveaway__row-inner-wrap:not(".is-faded")', // non-entered items in search list for count-parser
            _gameTitlePartSelector :        'a.giveaway__heading__name',
            _gameHidePartSelector :         'i.giveaway__hide',
            _gameIdAttribute :              'data-game-id',
        },

        // filter internal settings
        filter: {
            _iconClass :         'sps_sgld_button',
            _gameAlertStyles :   [ { time: 5400*1000, class:'expires-soon'}, // 1.5 hour or less
                                        { time: 8*3600*1000, class: 'expires-night'}, // 1.5-8h
                                        { time: 86400*1500, class: 'expires-day'}, // 8h to 1.5day
                                        { time: 1000*86400*1000, class: 'expires-later'} // more than 1 day
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
                merge : 'Merge',
                import : 'Import full',
                refresh: 'Refresh',
                scanRow: 'Scan by table rows',
                scanPlain: 'Scan by pages',
                customLike : 'Like',
                customDislike : 'Dislike',
                serviceToggle: 'Service',
                checkOwn: 'Check for own games',
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
            },
            alert : {
                settingsApply : 'Settings applied succesfully',
                settingsError: 'Invalid settings to import',
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
.liked_games .game_name .no_steam_id { font-size: 10px; padding-right: 4px; padding-bottom: 2px; } \
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
.liked_games a.link-item.expires-soon { color: red; } \
.liked_games a.link-item.expires-night { color: #0053F5; } \
.liked_games a.link-item.expires-day { color: #2D3748; } \
.liked_games a.link-item.expires-later { color: grey; } \
.liked_games .refresh_row, .liked_games .sort_link { cursor: pointer; } \
.liked_games .refresh_row .fa { opacity: 0.7; font-size: 11px; padding-bottom: 1px; } \
.liked_games .ajax_progress { display: none; } \
.liked_games.in_progress { opacity: 0.7 } \
.liked_games.in_progress .ajax_progress { width: 100%; height: 100%; display: block; padding-top: 15px; } \
.liked_games.in_progress .sort_header, .in_progress .refresh_row { display: none; } \
.liked_games .game_links input, .service input { width: auto; margin: 0 2px; cursor: pointer; } \
.service .spoiler_button { cursor: pointer; width: auto; height: 20px; font-size: 10px; padding: 0 10px; } \
.service .spoiler { display: none; padding: 15px 5px 12px 4px; background-color: #DEDEDE; margin-top: -10px; } \
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
        gameSettings : '',
    },

    // ======= Var part =======

    // list of liked/disliked games as:
    //     [gameId+'_']=>[gameName]  for disliked
    //     [gameId+'_']=> { name: [gameName], steamId: [steamId] }   for liked
    //  game name is used for list on the setting page
    //  steamId is used for utility part
    __liked : {},
    __disliked : {},

    __plainCount : {},


    // ======== Work block part =======

    _work : {
        // work semaphores
        __workInProgress : false,
        __stopWork : false,
        // pager data
        __pagerData: {},
        __pagerParam: {},
        __pagerCallback: {},

        // Run page request sequence.
        // param : { initUrl: first page url
        //           format:  response format expected
        //           delay:   min delay value
        //           delayTreshold : increment delay value  (summary delay will be random from (delay) to (delay+delayTreshold)
        //         }
        // callback: { start() - call on start, return data,
        //             gotPage(data,response,pagenum) - call for each page, return data,
        //             isFinished(data) - call for each page, return bool,
        //             nextPageUrl(data, pagenum) - call before new page, return string,
        //             success(data, pagenum) - call after isFinished confirm,
        //             error(data, pagenum) - call on stopwork flag,
        //             stop(data) - call for both success or error
        //           }
        runPager : function( param, callback ) {
            if ( false === this._workStart() ) {
                this.__stopWork = true;
                return;
            }
            this.__pagerCallback = callback;
            this.__pagerParam = param;
            this.__pagerData = this.__callbackSafe(this.__pagerCallback.start, null);
            this.__actPage( param.initUrl, 1 );
        },

        __actPage : function( url, pageNum ) {
            var that = this;
            $.get( url,
               {},
               function( data ) {
                   that.__pagerData = that.__callbackSafe(that.__pagerCallback.gotPage, that.__pagerData, that.__pagerData, data, pageNum );
                   if ( that.__callbackSafe(that.__pagerCallback.isFinished, true, that.__pagerData ) ) {
                       // final page is reached
                       that.__callbackSafe(that.__pagerCallback.success, null, that.__pagerData, pageNum );
                       that.__callbackSafe(that.__pagerCallback.stop, null, that.__pagerData );
                       that._workStop();
                       return;
                   }
                   if ( that.__stopWork ) {
                       // stop work requested
                       that.__callbackSafe(that.__pagerCallback.error, null, that.__pagerData, pageNum );
                       that.__callbackSafe(that.__pagerCallback.stop, null, that.__pagerData );
                       that._workStop();
                       return;
                   }
                   pageNum++;
                   url = that.__callbackSafe(that.__pagerCallback.nextPageUrl, '/', that.__pagerData, pageNum );
                   var delay = that.__pagerParam.delay + that.__pagerParam.delay * Math.random();
                   setTimeout( function(){ that.__actPage( url, pageNum ); }, delay);
               },
               that.__pagerParam.format );
        },

        __callbackSafe : function( func, defaultResult, param1, param2, param3 ) {
            if ( 'function' != typeof func ) {
                return defaultResult;
            }
            return func(param1,param2,param3);
        },
        // Run single request action.
        // url :
        // callback: { success(response) - call after isFinished confirm,
        //             error(response) - call on stopwork flag,
        //             stop(response) - call for both success or error
        //           }
        actSingle : function( url, format, callback ) {
            if ( false === this._workStart() ) {
                return;
            }
            var that = this;
            $.get( url,
               {},
               function( data ) {
                   that.__callbackSafe(callback.success, null, data );
               },
               format
               ).fail( function() {
                   that.__callbackSafe(callback.error, null);
               }).always( function() {
                   that.__callbackSafe(callback.stop, null);
                   that._workStop();
               });
        },

        _workStart : function() {
            if ( this.__workInProgress ) {
                return false;
            }
            this.__workInProgress = true;
            return true;
        },

        _workStop : function() {
            this.__workInProgress = false;
            this.__stopWork = false;
        },
    },


    // ======== Render block part =======

    _render : {
        settingsPage : {
            tableHeader : function() {
                var ajaxRoll = '<span class="ajax_progress">'+__('table.ajax')+'</span>';
                var heads = '<thead><th  class="game_refresh">&nbsp;</th>'+
                       '<th class="game_num">'+ajaxRoll+'<span class="sort_header">'+__('table.number')+'<br/>'+this.sortingLinks('added')+'</span></th>'+
                       '<th class="game_name">'+ajaxRoll+'<span class="sort_header">'+__('table.name')+'<br/>'+this.sortingLinks('name')+'</span></th>'+
                       '<th class="game_count"><span class="last_updated"></span></th>'+
                       '<th class="game_delta">'+ajaxRoll+'<span class="sort_header">'+__('table.delta')+'<br/>'+this.sortingLinks('time')+'</span></th>'+
                       '<th class="game_links"><input id="SPSCountButton" type="button" onclick="javascript:SPS_SteamgiftLikes.action.scanGames();" value="'+__('button.scanRow')+'"><input id="SPSCountButtonPlain" type="button" onclick="javascript:SPS_SteamgiftLikes.action.scanGamesPlain();" value="'+__('button.scanPlain')+'"></span></th></thead>';
                return heads;
            },

            sortingLinks : function( criteria ) {
                return '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.action.sortList(this, \''+criteria+'\',true);">'+__('table.sortAsc')+'</span>'+
                       '<span class="sort_link" onclick="javascript:SPS_SteamgiftLikes.action.sortList(this, \''+criteria+'\',false);">'+__('table.sortDesc')+'</span>';
            },

            servicePanel : function() {
                return '<div class="service">'+
                       '<input type="button" class="spoiler_button" onclick="javascript:SPS_SteamgiftLikes.action.toggleSpoiler(this);" value="'+__('button.serviceToggle')+'">'+
                       '<div class="spoiler"><input type="button" onclick="javascript:SPS_SteamgiftLikes.action.checkOwnGames();" value="'+__('button.checkOwn')+'"></div>'+
                       '</div>';
            },

            tableRows : function() {
                var rows = [];
                var i = 1;
                thut._data.__loadData();
                for (var key in thut.__liked) {
                    if (thut.__liked.hasOwnProperty(key)) {
                        rows.push( this._tableRow( i, key, thut.__liked[key]) );
                        i++;
                    }
                }
                return rows;
            },

            _tableRow : function( num, gameId, gameData ) {
                var name = gameData,
                    steamId = false;
                if ( !thut._data.isGameLikedOld(gameId) ) {
                    name = gameData.name;
                    steamId = ' '+thut._settings.site._steamIdAttribute+'="'+gameData.steamId+'"';
                }
                return '<tr><td class="game_refresh"><span onclick="javascript:SPS_SteamgiftLikes.action.scanOneRow(this);" class="refresh_row">'+__('table.refresh')+'</span></td>'+
                      '<td class="game_num">'+num+'</td>'+
                      '<td class="game_name" '+thut._settings.site._gameIdAttribute+'="'+gameId+'"'+(steamId?steamId:'')+'>'+
                      (steamId?'':'<i class="fa fa-steam no_steam_id"></i>')+
                      '<a href="'+thut._render.settingsPage.searchLink(name)+'" target="_blank">'+name+'</a></td>'+
                      '<td class="game_count"></td>'+
                      '<td class="game_delta"></td>'+
                      '<td class="game_links"></td></tr>';
            },

            linkListFull : function( strictList, nostrictList ) {
                var row = '',
                    strictRender = 'no scrict match';
                if ( strictList.length ) {
                    strictRender = thut._render.settingsPage.linkList( strictList );
                }
                row += '<span class="links-strict">' + strictRender + '</span>';
                if ( nostrictList.length ) {
                    row += '((<span class="links-nostrict">' + thut._render.settingsPage.linkList( nostrictList )+'</span>))';
                }
                return row;
            },

            linkList : function( list ) {
                var out = '', counter = 1, i, j, linkClass;
                for ( i in list ) {
                    linkClass = '';
                    for ( j in thut._settings.filter._gameAlertStyles ) {
                        if ( list[i].delta <= thut._settings.filter._gameAlertStyles[j].time ) {
                            linkClass = thut._settings.filter._gameAlertStyles[j].class;
                            break;
                        }
                    }
                    out += '<a href="'+list[i].link+'" class="link-item '+linkClass+'" target="_blank" title="'+thut._render.settingsPage.deltaTime( list[i].delta )+'\n'+list[i].nativeDelta+'">['+(counter++)+']</a>';
                }
                return out;
            },

            searchLink : function( $row ) {
                if ( 'string' != typeof $row ) {
                    $row = thut._parse.likedTable.gameName($row);
                }
                return '/giveaways/search?q='+$row;
            },

            plainLink : function( data, pageNum ) {
                return '/giveaways/search?page='+pageNum;
            },

            deltaTime : function( delta ) {
                var out = '', isNostrict = false, i;
                if ( delta > 30*86400*1000 ) {
                    delta -= 30*86400*1000;
                    isNostrict = true;
                }
                var date = new Date();
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
                if ( isNostrict ) {
                    out = '( '+out+' )';
                }
                return out;
            },
        },

        syncPage : {
            dataForm : function() {
               return '<textarea id="import_settings_text"></textarea>'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pullSettings();" title="'+__('description.refresh')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.refresh')+'</div>&nbsp;'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pushSettings(false);" title="'+__('description.import')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.import')+'</div>&nbsp;'+
                   '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.pushSettings(true);" title="'+__('description.merge')+'"><i class="fa fa-arrow-circle-right"></i> '+__('button.merge')+'</div>&nbsp;';
            },

            customLikeForm : function() {
                return  '<input class="js__autocomplete-id" type="hidden" name="game_id" id="like_game_id" value="">'+
                    '<input data-autocomplete-do="autocomplete_game" class="js__autocomplete-name" type="text" placeholder="Start typing a game..." id="like_game_name" value="">'+
                    '<div class="js__autocomplete-data"></div>'+
                    '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.markCustomGameAs(\'like\');"><i class="fa fa-arrow-circle-right"></i> '+__('button.customLike')+'</div>&nbsp;'+
                    '<div class="form__submit-button js__submit-form" onclick="javascript:SPS_SteamgiftLikes.action.markCustomGameAs(\'dislike\');"><i class="fa fa-arrow-circle-right"></i> '+__('button.customDislike')+'</div>&nbsp;';
            },
        },

        append : {
            styles : function( styleContent ) {
                $('head').append('<style type="text/css">'+styleContent+'</style>');
            },

            settingsHead : function( title ) {
                $('div.page__heading').parent().append(
                    '&nbsp;<div class="page__heading"><div class="page__heading__breadcrumbs"><a href="#">'+title+'</a></div></div><form onsubmit="return false;"></form>'
                );
            },

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

            listIcon : function( $node, type ) {
                var $icon = $('<div>'+__('button.'+type)+'</div>')
                              .addClass( thut._settings.filter._iconClass )
                              .addClass( type );
                if ( type == 'liked' || type == 'disliked' ) {
                    if ( !$node.find( '.giveaway__row-inner-wrap' ).hasClass('is-faded') ) {
                        $node.addClass('fresh');
                    }
                    $icon.attr('onclick','SPS_SteamgiftLikes.action.unmarkGameAs(\''+type+'\', this)');
                    $node.addClass(type);
                } else if ( type == 'like' || type == 'dislike' ) {
                    $icon.attr('onclick','SPS_SteamgiftLikes.action.markGameAs(\''+type+'\', this)');
                }
                $node.append( $icon );
            },

            likesForItem : function( $listItem ) {
                var iconList = thut._parse.gameList.iconsRequired($listItem);
                for( i=0; i<iconList.length; i++ ) {
                    thut._render.append.listIcon($listItem, iconList[i]);
                }
            },
        },

        update : {
            workStart : function( setMessage ) {
                $('.liked_games').addClass('in_progress');
                if ( 'undefined' != typeof setMessage && false !== setMessage ) {
                    if ( 'string' != typeof setMessage ) {
                        setMessage = __('table.inProgress');
                    }
                    thut._render.update.tableUpdateText(setMessage);
                }
            },

            workStop : function( setTime ) {
                $('.liked_games').removeClass('in_progress');
                if ( 'undefined' != typeof setTime && setTime ) {
                    thut._render.update.tableUpdatedNow();
                }
            },

            clearIconsFor : function( $listItem ) {
                $listItem.find('.'+thut._settings.filter._iconClass).remove();
                $listItem.removeClass('liked')
                    .removeClass('disliked')
                    .removeClass('fresh');
            },

            importSettings : function() {
                var settingsText = JSON.stringify({liked:thut.__liked, disliked:thut.__disliked});
                $('#import_settings_text').val(settingsText);
            },

            resetCustom : function() {
                $('#like_game_id').val('');
                $('#like_game_name').val('');
            },

            sortButtons : function( current ) {
                var $current = $(current);
                var $active = $('.liked_games .sort_link.current, .liked_games .sort_link.active');
                $('.liked_games .sort_link').removeClass('active').removeClass('current');
                $active.addClass('active');
                $current.parent().find('.sort_link').removeClass('active')
                $current.addClass('current');
            },

            tableRowScanned : function( $row, response ) {
                thut._render.update.resetTable($row);
                var gameId = thut._parse.likedTable.gameId($row);
                var $gameRows = $(thut._settings.site._gameInListSelector, response);
                if ( $gameRows.length ) {
                    $gameRows.each(function(){
                        var giveawayContainer = $(this).parent();
                        var itemGameId = thut._parse.gameList.gameId(giveawayContainer);
                        if ( thut._data.isGameDisliked(itemGameId) ) {
                            return;
                        }
                        if ( itemGameId == gameId ) {
                            thut._logic.addCounter(gameId, giveawayContainer, false);
                            return;
                        }
                        thut._logic.addCounter(gameId, giveawayContainer, true);
                    });
                    thut._render.update.plainTable(gameId);
                }
                return $row.next();
            },

            plainPageScanned : function( lastCount, response, pageNum ) {
                thut._render.update.tableUpdateText(pageNum);
                var $gameRows = $(thut._settings.site._gameInListSelector, response);
                $gameRows.each(function(){
                    var giveawayContainer = $(this).parent();
                    var itemGameId = thut._parse.gameList.gameId(giveawayContainer);
                    if ( thut._data.isGameDisliked(itemGameId) ) {
                        return;
                    }
                    if ( thut._data.isGameLiked(itemGameId) ) {
                        thut._logic.addCounter(itemGameId, giveawayContainer, false);
                        return;
                    }
                    var gameName = $( thut._settings.site._gameTitlePartSelector , giveawayContainer ).html();
                    var similarGameIdList = thut._data.isNameLiked(gameName);
                    if ( similarGameIdList.length ) {
                        thut._logic.addCounter(similarGameIdList, giveawayContainer, true);
                    }
                });
                return $gameRows.length;
            },

            resetTable : function($row) {
                if ( 'undefined' == typeof $row ) {
                    $row = $('.liked_games tbody tr');
                }
                $row.removeClass('to_count').removeClass('has_links').addClass('no_links');
                $('td.game_count', $row).html('0 / 0');
                $('td.game_links', $row).html('');
                $('td.game_delta', $row).html('').attr('data-tick-time', 1000*864000*1000);
            },

            plainTable : function( gameId ) {
                if ( typeof(gameId) !== 'undefined' && gameId ) {
                    if ( ! thut.__plainCount.games[gameId] ) {
                        console.log('Game "'+gameId+'" not found in plain count');
                        return;
                    }
                    var record = thut.__plainCount.games[gameId];
                    var row = $('td.game_name['+thut._settings.site._gameIdAttribute+'='+gameId+']').parent();
                    if ( !row ) {
                        return;
                    }
                    $('td.game_count', row).html( record.strict.length + (record.nostrict.length?(' ('+record.nostrict.length+')'):'')+' / '+record.totalCount);
                    $('td.game_delta', row).attr('data-tick-time', record.delta);
                    if ( record.strict.length + record.nostrict.length > 0 ) {
                        $('td.game_links', row).html( thut._render.settingsPage.linkListFull( record.strict, record.nostrict ) );
                        $('td.game_delta', row).html( thut._render.settingsPage.deltaTime( record.delta ) );
                        $(row).removeClass('to_count').removeClass('no_links').addClass('has_links');
                    }
                    return;
                }
                thut._render.update.resetTable();
                for( var key in thut.__plainCount.games ) {
                    if (thut.__plainCount.games.hasOwnProperty(key)) {
                        this.plainTable(key);
                    }
                }
            },

            tableUpdateText : function( text ) {
                $('.liked_games .last_updated').html(text);
            },

            tableUpdatedNow : function( text ) {
                var today = new Date();
                this.tableUpdateText(today.toTimeString().split(' ')[0]);
            },
        },
    },


    // ======== Parse block part =======

    _parse : {
        gameList : {
            gameId : function( $listItem ) {
                return ''+$listItem.attr( thut._settings.site._gameIdAttribute )+'_';
            },

            iconsRequired : function ( $listItem ) {
                var gameId = this.gameId($listItem);
                var iconList = [];
                if ( thut._data.isGameLiked(gameId) ) {
                    if ( thut._data.isGameLikedOld(gameId) ) {
                        iconList.push('steam');
                    }
                    iconList.push('liked');
                    return iconList;
                }
                if ( thut._data.isGameDisliked(gameId) ) {
                    iconList.push('disliked');
                    return iconList;
                }
                iconList.push('like');
                iconList.push('dislike');
                return iconList;
            },

            listItemByButton : function( button ) {
                return $(button).parents( thut._settings.site._gameWrapperSelector );
            },

            gameName : function( $listItem ) {
                var name = $( thut._settings.site._gameTitlePartSelector , $listItem ).html();
                return thut._parse.util.cutGameName(name);
            },

            steamId : function( $listItem, type ) {
                var $link = $listItem.find('.fa.fa-steam:first').parent();
                return thut._parse.util.steamIdByUrl( $link.attr('href') );
            },
        },

        likedTable : {
            sortKey : function( row, sortBy ) {
                var key = '';
                switch ( sortBy ) {
                    case 'name':
                        key = $('.game_name a',row).html();
                        break;
                    case 'time':
                        key = 1000*86400*1000;
                        var value = $('.game_delta:first',row).attr('data-tick-time');
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
            },

            gameName : function( $row ) {
                return $row.find('td.game_name > a').html();
            },

            gameId : function( $row ) {
                return $row.find('td.game_name').attr( thut._settings.site._gameIdAttribute );
            },

            giveawayTime : function( timeString ) {
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
                var tempString = parts.join('')+timePart.slice(0,-2)+':00'; // compose the datetime to parse
                var tempDate = new Date();
                tempDate.setTime(Date.parse(tempString));
                if ( timePart.indexOf('pm') >= 0 ) {
                    timeBonus += 43200*1000; // half of the day
                }
                if ( tempDate.getHours()%12 == 0 ) {
                    timeBonus -= 43200*1000; // half of the day
                }
                return tempDate.getTime()+timeBonus-today.getTime();
            },
        },

        customList : {
            rawGameId : function() {
                return $('#like_game_id').val();
            },

            gameName : function() {
                var name = $('#like_game_name').val();
                return thut._parse.util.cutGameName(name);
            },

            listItemById : function( rawId ) {
                return $('.js__autocomplete-data .table__row-outer-wrap[data-autocomplete-id='+rawId+']');
            },

            steamId : function( $listItem ) {
                var $link = $listItem.find('.table__column__secondary-link:first');
                return thut._parse.util.steamIdByUrl( $link.attr('href') );
            },
        },

        util : {
            steamIdByUrl : function( url ) {
                var matches = url.match( /\/(\d+)\//i );
                if ( !matches ) {
                    return false;
                }
                return matches[1];
            },

            cutGameName : function( name ) {
                if ( name.substr(-3) === '...' ) {
                    name = name.substr(0,name.lastIndexOf(' '));
                }
                return name;
            },
        },
    },


    // ======== Logic block part =======

    _logic : {
        rowShouldBeAfter : function( row1, row2, sortBy, asc ) {
            var key1 = thut._parse.likedTable.sortKey(row1, sortBy);
            var key2 = thut._parse.likedTable.sortKey(row2, sortBy);
            if ( (key1 > key2 && asc) || (key1 < key2 && !asc) ) {
                return true;
            }
            return false;
        },

        addCounter : function( gameIdList, container, isSimilar ) {
            var giveawayLink = $(thut._settings.site._gameTitlePartSelector, container).attr('href');
            var giveawayTimeLeft = $('.fa-clock-o', container).next().html();
            var giveawayDeltaTime = thut._parse.likedTable.giveawayTime( $('.fa-clock-o', container).next().attr('title') );
            var giveawayItem = {link: giveawayLink, delta: giveawayDeltaTime, nativeDelta: giveawayTimeLeft};
            var isNotEntered = ($('.giveaway__row-inner-wrap.is-faded', container).length <= 0)
            if ( !Array.isArray( gameIdList ) ) {
                gameIdList = [gameIdList];
            }
            var i, gameId;
            for ( i=0; i<gameIdList.length; i++ ) {
                gameId = gameIdList[i];
                if ( !thut.__plainCount.games[gameId] ) {
                    thut.__plainCount.games[gameId] = { strict: [], nostrict: [], totalCount: 0, delta: 100*86400*1000 };
                }
                if ( isNotEntered ) {
                    if ( isSimilar ) {
                        if ( thut.__plainCount.games[gameId].nostrict.length < 15 ) {
                            thut.__plainCount.games[gameId].nostrict.push(giveawayItem);
                        }
                        giveawayDeltaTime += 30*86400*1000;
                    } else {
                        if ( thut.__plainCount.games[gameId].strict.length < 15 ) {
                            thut.__plainCount.games[gameId].strict.push(giveawayItem);
                        }
                    }
                    if ( giveawayDeltaTime < thut.__plainCount.games[gameId].delta ) {
                        thut.__plainCount.games[gameId].delta = giveawayDeltaTime;
                    }
                }
                thut.__plainCount.games[gameId].totalCount++;
            }
        },
    },


    // ======== Data block part =======

    _data : {
        __loadData : function() {
            if (localStorage.sps_sgld_liked) {
                thut.__liked = JSON.parse(localStorage.sps_sgld_liked);
            } else {
                thut.__liked = {};
            }
            if (localStorage.sps_sgld_disliked) {
                thut.__disliked = JSON.parse(localStorage.sps_sgld_disliked);
            } else {
                thut.__disliked = {};
            }
        },

        __saveData : function() {
            localStorage.sps_sgld_disliked = JSON.stringify(thut.__disliked);
            localStorage.sps_sgld_liked = JSON.stringify(thut.__liked);
        },

        isGameLiked( gameId ) {
            return ('undefined' != typeof thut.__liked[gameId]);
        },

        isGameLikedOld( gameId ) {
            return ( 'string' == typeof thut.__liked[gameId] ) ;
        },

        isGameDisliked( gameId ) {
            return ('undefined' != typeof thut.__disliked[gameId]);
        },

        isNameLiked : function( gameName ) {
            gameName = gameName.toLowerCase();
            var gameIdList = [], localName;
            for( var key in thut.__liked ) {
                if (thut.__liked.hasOwnProperty(key)) {
                    localName = ('string'===typeof thut.__liked[key])?thut.__liked[key]:thut.__liked[key].name;
                    if ( gameName.indexOf(localName.toLowerCase()) >= 0 ) {
                        gameIdList.push(key);
                    }
                }
            }
            return gameIdList;
        },

        markGameAs : function( type, gameId, steamId, gameName ) {
            thut._data.__loadData();
            var needSave = false;
            if ( 'like' == type ) {
                needSave = thut._data.markAsLiked(gameId, steamId, gameName);
            } else if ( 'dislike' == type ) {
                needSave = thut._data.markAsDisliked(gameId, gameName);
            }
            if ( needSave ) {
                thut._data.__saveData();
            }
        },

        markAsLiked : function( gameId, steamId, gameName ) {
            if ( this.isGameLiked(gameId) ) {
                return false;
            }
            if ( steamId ) {
                thut.__liked[gameId] = { name: gameName, steamId: steamId };
            } else {
                thut.__liked[gameId] = gameName;
            }
            return true;
        },

        markAsDisliked : function( gameId, gameName ) {
            if ( this.isGameDisiked(gameId) ) {
                return false;
            }
            thut.__disliked[gameId] = gameName;
            return true;
        },

        unmarkAsLiked : function( gameId ) {
            if ( !this.isGameLiked(gameId) ) {
                return false;
            }
            delete thut.__liked[gameId];
            return true;
        },

        unmarkAsDisliked : function( gameId ) {
            if ( !this.isGameDisliked(gameId) ) {
                return false;
            }
            delete thut.__disliked[gameId];
            return true;
        },

        importSetting : function( toImport, toMerge ) {
            var key;
            if ( toImport.liked instanceof Object ) {
                if ( toMerge ) {
                    for (key in toImport.liked) {
                        if (toImport.liked.hasOwnProperty(key) && (!this.__liked.hasOwnProperty(key) || 'string'===typeof this.__liked[key]) ) {
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
        }
    },


    // ======== Actions for external use =======

    action : {
        markGameAs : function( type, button ) {
            var $wrapper = thut._parse.gameList.listItemByButton(button);
            if ( $wrapper.length ) {
                var gameName = thut._parse.gameList.gameName($wrapper);
                var gameId = thut._parse.gameList.gameId($wrapper);
                var steamId = thut._parse.gameList.steamId($wrapper);
                thut._data.markGameAs( type, gameId, steamId, gameName );
            }
            thut._render.update.clearIconsFor($wrapper);
            thut._render.append.likesForItem($wrapper);
        },

        unmarkGameAs : function( type, button ) {
            var $wrapper = thut._parse.gameList.listItemByButton(button);
            if ( $wrapper.length ) {
                var gameId = thut._parse.gameList.gameId($wrapper);
                thut._data.__loadData();
                var needSave = false;
                if ( 'liked' == type ) {
                    needSave = thut._data.unmarkAsLiked(gameId);
                } else if ( 'disliked' == type ) {
                    needSave = thut._data.unmarkAsDisliked(gameId);
                }
                if ( needSave ) {
                    thut._data.__saveData();
                }
            }
            thut._render.update.clearIconsFor($wrapper);
            thut._render.append.likesForItem($wrapper);
        },

        pullSettings : function() {
            thut._data.__loadData();
            thut._render.update.importSettings();
        },

        pushSettings : function( toMerge ) {
            try {
                var key;
                var toImport = JSON.parse( $('#import_settings_text').val() );
                thut._data.importSettings( toImport, toMerge );
                alert( __('alert.settingsApply') );
            } catch(e) {
                alert( __('alert.settingsError') );
            }
        },

        markCustomGameAs : function( type ) {
            var rawGameId = thut._parse.customList.rawGameId();
            if ( !rawGameId ) return false;
            var $listItem = thut._parse.customList.listItemById(rawGameId);
            var steamId = thut._parse.customList.steamId($listItem);
            var gameId = ''+rawGameId+'_';
            var gameName = thut._parse.customList.gameName();
            thut._data.markGameAs( type, gameId, steamId, gameName );
            thut._render.update.importSettings();
            thut._render.update.resetCustom();
            return false;
        },

        sortList : function( button, sortBy, asc ) {
            if ( false === thut._work._workStart() ) {
                return;
            }
            thut._render.update.workStart();
            var copy = $('.liked_games').parent().html();
            var tableBody = $('tbody', copy)[0];
            var rows = tableBody.getElementsByTagName('tr');
            var i, j, rowCount = rows.length;
            setTimeout( function(){
                for(i = 0; i < rowCount-1; i++) {
                    for(j = 0; j < rowCount - i - 1; j++) {
                        if( thut._logic.rowShouldBeAfter(rows[j], rows[j+1], sortBy, asc ) ) {
                            tableBody.insertBefore(rows[j+1],rows[j]);
                        }
                    }
                }
                $('.liked_games tbody').html($(tableBody).html());
                thut._render.update.sortButtons( button );
                thut._render.update.workStop();
                thut._work._workStop();
                }, 1000);
        },

        scanOneRow : function( link ) {
            var $row = $(link).parents('tr');
            $row.removeClass('no_links').removeClass('has_links');
            thut._render.update.workStart();
            thut._work.actSingle( thut._render.settingsPage.searchLink($row),
                                  'html',
                                 { success: function( data ) {
                                     thut._render.update.tableRowScanned( $row, data );
                                   },
                                   stop: function() {console.log('stop');
                                      thut._render.update.workStop();
                                   },
                                 });
        },

        // start the scan-by-row process
        scanGames : function() {
            var $row = $('.liked_games tbody tr').first();
            thut._work.runPager({ initUrl: thut._render.settingsPage.searchLink($row),
                                  format: 'html',
                                  delay: 500,
                                  delayTreshold: 1000 },
                                { start: function() {
                                    thut.__plainCount.games = {};
                                    thut.__plainCount.updated = false;
                                    $('.liked_games tbody tr').removeClass('no_links').removeClass('has_links').addClass('to_count');
                                    thut._render.update.workStart(true);
                                    return $row; },
                                  gotPage: thut._render.update.tableRowScanned,
                                  isFinished: function( data ){ return !data.length; },
                                  nextPageUrl: thut._render.settingsPage.searchLink,
                                  stop: function(data){
                                      thut._render.update.workStop(true);
                                  },
                                });
        },

        scanGamesPlain : function() {
            thut._work.runPager({ initUrl: '/',
                                  format: 'html',
                                  delay: 1000,
                                  delayTreshold: 2000 },
                                { start: function() {
                                    thut.__plainCount.games = {};
                                    thut.__plainCount.updated = false;
                                    thut._render.update.workStart();
                                  },
                                  gotPage: thut._render.update.plainPageScanned,
                                  isFinished: function( data ){ return data<50; },
                                  nextPageUrl: thut._render.settingsPage.plainLink,
                                  stop: function(data){
                                      thut._render.update.plainTable();
                                      thut._render.update.workStop(true);
                                  },
                                });
        },
    },


    // ======== Settings Page part =======

    // append gamelist to page
    _appendSettings : function() {
        var heads = this._render.settingsPage.tableHeader();
        var service = this._render.settingsPage.servicePanel();
        var rows = this._render.settingsPage.tableRows();
        this._render.append.styles( this._styles.gameCounter );
        this._render.append.settingsRow( 1, 'Monitor', service+'<table class="liked_games">'+heads+'<tbody>'+rows.join('')+'</tbody>'+heads+'</table>' );
    },

    // append likes import/export form to page
    _appendImportSettings : function() {
        var form = this._render.syncPage.dataForm();
        this._render.append.styles( this._styles.gameSettings );
        this._render.append.settingsRow( false, 'Like/dislike import', form );
        this._data.__loadData();
        this._render.update.importSettings();
    },

    // append add custom like form to page
    _appendCustomLikeSettings : function() {
        var form = this._render.syncPage.customLikeForm();
        this._render.append.settingsRow( 1, 'Add custom like', form );
    },



    // ======== Game list part =======

    _appendLikes : function() {
        this._data.__loadData();
        this._render.append.styles( this._styles.gameList );
        $( this._settings.site._gameWrapperSelector ).each(function() {
            thut._render.append.likesForItem( $(this) );
        });
    },




/*


SPS_SteamgiftLikes.__actRemoteSteamId = function( gameId, name, action ) {
/* https://www.steamgifts.com/ajax.php
   POST
search_query:X3: Terran Conflict
page_number:1
do:autocomplete_game
*//*
};




/*
SPS_SteamgiftLikes.toggleSpoiler = function( button ) {
    var $container = $(button).parent();
    $container.find('.spoiler').toggle();
};

SPS_SteamgiftLikes.checkOwnGames = function() {
    if ( false === this._workStart() ) {
        this.__stopWork = true;
        return;
    }
    this.__ownGames.games = {};
    this.__checkOwnGamePage('/account/steam/games', 1);
};

SPS_SteamgiftLikes.__checkOwnGamePage = function( uri, pageNum ) {
    var that = this;
    $('.service_counter').html( pageNum );
    $.get( uri,
           {},
           function( data ) {
/*               var gameRowsCount = $( that._gameInListSelector , data ).length;
               var $notEnteredRows = $( that._gameInListNotEnteredSelector , data );
               if ( ! gameRowsCount ) {
                   // final page is reached
                   that.__renderPlainCount();
                   var today = new Date();
                   $('.liked_games .last_updated').html(today.toTimeString().split(' ')[0]);
                   that._workStop();
                   return;
               }
               $notEnteredRows.each(function(){
                   var giveawayContainer = $(this).parent();
                   var itemGameId = ''+$(giveawayContainer).attr( that._gameIdAttribute )+'_';
                   if ( that.__disliked[itemGameId] ) {
                       return;
                   }
                   if ( that.__liked[itemGameId] ) {
                       that.__addCounter(itemGameId, giveawayContainer, false);
                       return;
                   }
                   var gameName = $( that._gameTitlePartSelector , giveawayContainer ).html();
                   var similarGameIdList = that.__isNameLiked( gameName );
                   if ( similarGameIdList.length ) {
                       that.__addCounter( similarGameIdList, giveawayContainer, true );
                   }
               });
               if ( that.__stopWork ) {
                   that._workStop();
               } else {
                   pageNum++;
                   setTimeout( function(){ that.__parseOnePlainPage( '/account/steam/games/searh?page='+pageNum, pageNum ); }, 1000+2000*Math.random());
               }
*//*           });
};
*/
// data part

        // router
        route : function() {
            if (window.location.pathname.match(/^\/account\/settings\/giveaways/)) {
                this._render.append.settingsHead( 'Likes' );
                this._appendSettings();
            } else if (window.location.pathname.match(/^\/account\/profile\/sync/)) {
                this._render.append.settingsHead( 'Likes' );
                this._appendCustomLikeSettings();
                this._appendImportSettings();
            } else if ( window.location.pathname.match(/^\/giveaway/) || window.location.pathname.length === 0 || window.location.pathname === "/" ) {
                this._appendLikes();
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