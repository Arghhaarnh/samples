// ==UserScript==
// @name         Steam Market cards tool
// @version      1.0.1
// @description  Check up the steam game cards value on the game comunity page
// @author       Blood_again
// @match        http://steamcommunity.com/*
// @match        https://steamcommunity.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// @require      https://github.com/Arghhaarnh/samples/raw/master/user_scripts/lib/ajax_work.lib.user.js
// ==/UserScript==


SPS_SteamCardTool = function() {

    // ======= Constants part =======

//    const TIME__SOON_MS    = 5400*1000,       // short time (hour and half actually)

    var thut = {
    // ======= Settings part =======

    _settings : {
        // site dependent settings
        site : {
            _cardListPageSize : 10,
            _namePlaceholder :  '%NAME%',
            _pricePlaceholder : '%PRICE%',
            _steamCommision : [ {price: 0.21, comm: 0.02},
                         {price: 0.32, comm: 0.03},
                         {price: 0.43, comm: 0.04},
                         {price: 0.44, comm: 0.05},
                         {price: 0.55, comm: 0.06},
                        ],
        },
        gamePage : {
            _storeButtonContainerSelector : '.apphub_HeaderTop .apphub_OtherSiteInfo', // container to add card counter controls
            _storeButtonSelector :          '.apphub_HeaderTop .apphub_OtherSiteInfo a.btn_medium', // store button to get game id
            _gameNameSelector :             '.apphub_AppName',
            _priceSelector :                '.apphub_StorePrice .price',
            _cardControlDataSelector :      '#cardCounter',
        },
        cardList : {
            _cardInListSelector :           '.market_listing_row_link',
            _cardUrlSelector :              '.market_listing_row_link',
            _cardNameSelector :             '.market_listing_game_name',
            _cardPriceSelector :            '.market_table_value .normal_price',
            _cardCountSelector :            '.market_listing_num_listings_qty',
            _cardTextTemplate :             '%NAME% Trading Card',
            _cardTextTemplateFoil :         '%NAME% Foil Trading Card',
        },

        locale : 'eng-EN',
    },

    // ======= Texts part =======

    _text : {
        'eng-EN': {
            button : {
                refresh : '<i class="fa fa-refresh" title="Refresh"></i>',
                save :    '<i class="fa fa-bookmark-o" title="Remember price"></i>',
                saved :   '<i class="fa fa-bookmark" title="Switch off remember"></i>',
            },
            counter: {
                cards: '<i class="fa fa-clone" title="Cards count"></i>',
                price: '<i class="fa fa-money" title="Money income"></i>',
                value: '<i class="fa fa-long-arrow-right" title="Cards price total"></i>',
                normal: 'Normal:',
                foil:  'Foil:',
                use_refresh: 'Click refresh to get info',
            },
        },
    },

    translate : function( text ) {
        var path = text.split('.'),
            base = this._text[thut._settings.locale];
        for(var i=0; i<path.length; i++) {
            if ( 'undefined' === typeof base ) {
                return text;
            }
            base = base[path[i]];
        }
        return base;
    },


    // ======= Styles part =======

    _styles : {
        common : [
            'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css',
            ],
        gamePage : "/* SPS Steam Cards tool liked table styles */ \
#cardCounter .fa { padding: 0 2px 0 5px; font-size: 14px; } \
#cardCounter .fa.fa-clone { font-size: 12px; } \
#cardCounter .counter_main { display: inline; } \
#cardCounter .counter_details /*{ display: none; } \
#cardCounter:hover .counter_details*/ { display: block; position: absolute; border-radius: 4px; background-color: rgba(42, 43, 62, 0.8); padding: 5px 15px; left: 0;} \
#cardCounter .counter_details .detail_row_name {display:inline-block; width:60px;} \
.cc_refresh, .cc_save { padding-left: 8px; } \
",
    },


    // ======== Work block part =======

    _work : SPS_AjaxWorkLib(),

    // ======== Render block part =======

    _render : {
        // Steam Community game page
        gamePage : {
            cardControl : function( gameId, gameName ) {
                var initContent = __('counter.use_refresh');
                return '<div style="position: relative; z-index: 1;" class="btnv6_blue_hoverfade btn_medium">'+
				    '<span><div style="display:inline" id="cardCounter">'+initContent+'</div>'+
                    '<a class="cc_save" href="javascript:SPS_SteamCardTool.action.saveCardCountForPage('+gameId+')">'+__('button.save')+'</a>'+
                    '<a class="cc_refresh" href="javascript:SPS_SteamCardTool.action.refreshCardCountForPage('+gameId+',\''+gameName+'\')">'+__('button.refresh')+'</a></span>'+
				    '</div>';
            },
        },

        // Steam Comunity market pages
        cardList : {
            // url of cards and items list on market
            cardListUrl : function( gameName, pageNum ) {
                if ( 'undefined' === typeof pageNum ) {
                    pageNum = 1;
                }
                var pageSize = thut._settings.site._cardListPageSize;
                var start = (pageNum-1) * pageSize;
                return '/market/search/render/?query=%22'+gameName+'%22&start='+start+'&count='+pageSize+'&search_descriptions=0&sort_column=default&sort_dir=desc';
            },

            price : function( price, currencyTpl ) {
                return currencyTpl.replace( thut._settings.site._pricePlaceholder, ''+thut._render.util.floorPrice(price) );
            },
        },

        // Append operations for all pages
        append : {
            // add common style and script includes
            commons : function() {
                var head = $('head');
                for(var i=0; i<thut._styles.common.length; i++) {
                    head.append('<link rel="stylesheet" href="'+thut._styles.common[i]+'">');
                }
            },

            // add styles to page
            styles : function( styleContent ) {
                $('head').append('<style type="text/css">'+styleContent+'</style>');
            },

            // control elements for game page
            cardControlForGame : function() {
                var gameId = thut._parse.gamePage.gameId();
                var gameName = thut._parse.gamePage.gameName();
                var cardControl = thut._render.gamePage.cardControl(gameId, gameName);
                thut._parse.gamePage.storeButtonContainer().append(cardControl);
            },
        },

        update : {
            countWorkStart : function() {
                thut._parse.gamePage.refreshButton().find('i').addClass('fa-spin');
            },
            countWorkStop : function() {
                thut._parse.gamePage.refreshButton().find('i').removeClass('fa-spin');
            },

            cardListPageScanned : function( data, response, pageNum ) {
                thut._render.update.pageControlText(pageNum);
                if ( !response || !response.success ) {
                    data.done = 'Bad response';
                    return data;
                }
                var $cardRows = $(thut._settings.cardList._cardInListSelector, '<div>'+response.results_html+'</div>');
                $cardRows.each(function(){
                    var $this = $(this);
                    var isFoil = false;
                    var isAffected = false;
                    if ( thut._logic.isCardForGame($this, data.gameId, data.gameName) ) {
                        isAffected = true;
                    } else if ( thut._logic.isCardForGame($this, data.gameId, data.gameName, true) ) {
                        isAffected = true;
                        isFoil = true;
                    }
                    if ( !isAffected ) {
                        return;
                    }
                    var cardCount = thut._parse.cardList.cardCount($this);
                    var cardPrice = thut._parse.cardList.cardPrice($this);
                    var cardPriceParts = thut._parse.cardList.priceParts(cardPrice);
                    thut._data.counter.recordCard(cardCount, cardPriceParts, isFoil);
                });
                if ( $cardRows.length < thut._settings.site._cardListPageSize ) {
                    data.done = true;
                }
                return data;
            },

            cardCounterOnPage : function() {
                var gameRecord = thut._data.counter.getRecord();
                var cardsNormal = this.cardCountNPrice(gameRecord.normal);
                var mainText = '<span class="card_outcome">'+__('counter.price')+thut._render.cardList.price(gameRecord.normal.priceGot,gameRecord.normal.currencyTpl)+'</span>'+cardsNormal;
                var detailedText = '<span class="detail_row_name">'+__('counter.normal')+'</span>'+cardsNormal+'<br/><span class="detail_row_name">'+__('counter.foil')+'</span>'+this.cardCountNPrice(gameRecord.foil)+'<br/>...';
                var text = '<div class="counter_main">'+mainText+'<div class="counter_details">'+detailedText+'</div></div>';
                thut._render.update.pageControlText(text);
            },

            cardCountNPrice : function( cardsRecord ) {
                return '<span class="card_count">'+__('counter.cards')+cardsRecord.cardCount+__('counter.value')+thut._render.cardList.price(cardsRecord.priceSum,cardsRecord.currencyTpl)+'</span>';
            },

            pageControlText : function( text ) {
                $( thut._settings.gamePage._cardControlDataSelector ).html(text);
            },
        },

        util : {
            // floor float price to cents
            floorPrice : function( price ) {
                return Math.round(100.0*price)/100.0;
            },
        },
    },


    // ======== Parse block part =======

    _parse : {
        // Usual SteamCommunity game page
        gamePage : {
            // get game Id
            gameId : function() {
                var storeButton = $( thut._settings.gamePage._storeButtonSelector );
                return thut._parse.util.steamIdByUrl( storeButton.attr('href') );
            },

            // get game name
            gameName : function() {
                return $( thut._settings.gamePage._gameNameSelector ).html();
            },

            // get game price
            gamePrice : function() {
                return $( thut._settings.gamePage._gamePriceSelector ).html();
            },

            // get container of store button
            storeButtonContainer : function() {
                return $( thut._settings.gamePage._storeButtonContainerSelector );
            },

            refreshButton : function() {
                return $('.cc_refresh');
            },
        },

        cardList : {
            cardCount : function( $item ) {
                var $countElement = $( thut._settings.cardList._cardCountSelector, $item );
                if ( !$countElement.length ) {
                    return false;
                }
                return parseInt($countElement.html());
            },

            cardPrice : function ( $item ) {
                var $priceElement = $( thut._settings.cardList._cardPriceSelector, $item );
                if ( !$priceElement.length ) {
                    return false;
                }
                return $priceElement.html();
            },

            priceParts : function( priceString ) {
                var result = {price: 0, currencyTpl: ''};
                var matches = priceString.match( /\d+\.\d+/i );
                if ( !matches ) {
                    result.currencyTpl = priceString;
                    return result;
                }
                result.price = parseFloat(matches[0]);
                result.gotPrice = thut._logic.gotPrice(result.price);
                result.currencyTpl = priceString.replace( matches[0], thut._settings.site._pricePlaceholder );
                return result;
            },
        },

        // utility for various data parsing
        util : {
            // get steamId from steam application url
            // return false if not found
            steamIdByUrl : function( url ) {
                var matches = url.match( /\/(\d+)\//i );
                if ( matches ) {
                    return matches[1];
                }
                matches = url.match( /\/(\d+)$/i );
                if ( !matches ) {
                    return false;
                }
                return matches[1];
            },

        },

    },


    // ======== Logic block part =======

    _logic : {
        // check if card belongs to game
        isCardForGame : function( $item, gameId, gameName, checkFoil ) {
            var cardLink = $item;
            if ( !cardLink.length || cardLink.attr('href').indexOf(''+gameId) == -1 ) {
                return false;
            }
            var cardName = $( thut._settings.cardList._cardNameSelector, $item ).html();
            var synthCardName = thut._settings.cardList._cardTextTemplate;
            if ( 'undefined' != typeof checkFoil && checkFoil ) {
                synthCardName = thut._settings.cardList._cardTextTemplateFoil;
            }
            synthCardName = synthCardName.replace(thut._settings.site._namePlaceholder, gameName);
            return ( synthCardName == cardName );
        },

        gotPrice : function( price ) {
            var comm = this.steamCommision( price );
            return price - comm;
        },

        steamCommision : function( price ) {
            var comm = 0.01*(Math.floor(price/0.11)+2.0);
            for ( var i in thut._settings.site._steamCommision ) {
                if ( price <= thut._settings.site._steamCommision[i].price ) {
                            comm = thut._settings.site._steamCommision[i].comm;
                            break;
                        }
                    }
            return comm;
        },
    },


    // ======== Data block part =======

    _data : {
        counter : {
            // data for scanned game cards as:
            // games:  game counter records list as:
            //     [gameId+'_']=> { updated: last time updated timestamp
            //                      name: game name for summary table
            //                      normal: { cardCount: how many various card available for game
            //                                marketCount: how many cards summary on market
            //                                priceSum: summary price of full card set
            //                                priceGot: summary price of even cards
            //                                currencyTpl: template for currency
            //                                }
            //                      foil: { the same for the foil cards
            //                                }
            //                      }
            __count : {},
            __current : {},

            // load counter data from storage
            load : function() {
                if (localStorage.sps_smct_counter) {
                    this.__count = JSON.parse(localStorage.sps_smct_counter);
                } else {
                    this.reset();
                }
            },

            // save counter data to storage
            save : function() {
                localStorage.sps_smct_counter = JSON.stringify(this.__count);
            },

            __emptyRecord : function() {
                return { cardCount: 0,
                         marketCount: 0,
                         priceSum: 0.0,
                         priceGot: 0.0,
                         currencyTpl: false,
                         };
            },

            // clear the current record
            // set initial id and name
            resetCurrent : function( gameId, gameName ) {
                this.__current.gameId = gameId;
                this.__current.gameName = gameName;
                this.__current.normal = this.__emptyRecord();
                this.__current.foil = this.__emptyRecord();
                this.__current.toSave = false;
                gameId = ''+gameId+'_';
                if ( 'undefined' != typeof this.__count.games[gameId] &&
                      this.__count.games[gameId].toSave ) {
                    this.__current.toSave = true;
                }
            },

            loadCurrent : function( gameId ) {
                if ( 'undefined' == typeof gameId ) {
                    if ( 'undefined' != typeof this.__current.gameId ) {
                        gameId = this.__current.gameId;
                    } else {
                        return false;
                    }
                }
                this.load();
                if ( 'undefined' == typeof this.__count.games[gameId] ) {
                    return false;
                }
                this._cloneRecord( this.__count.games[gameId], this.__current );
                return true;
            },

            saveCurrent : function() {
                if ( !this.__current.toSave ) {
                    return false;
                }
                if ( 'undefined' == typeof this.__current.gameId ) {
                    return false;
                }
                var gameId = ''+this.__current.gameId+'_';
                if ( 'undefined' == typeof this.__count.games[gameId] ) {
                    this.__count.games[gameId] = {};
                }
                this._cloneRecord( this.__current, this.__count.games[gameId] );
                this.save();
                return true;
            },

            // clear the record for game
            // if gameId not set, clear all counter data
            reset : function( gameId ) {
                if ( 'undefined' != typeof gameId ) {
                    if ( 'undefined' != typeof this.__count.games[gameId] ) {
                        delete this.__count.games[gameId];
                        return true;
                    } else {
                        return false;
                    }
                }
                this.__count.games = {};
            },

            // get counter data for game
            getRecord : function( gameId ) {
                if ( 'undefined' != typeof gameId ) {
                    return this.__count.games[''+gameId+'_'];
                } else {
                    return this.__current;
                }
            },

            // add the card data to current counter record
            // priceParts is awaited as {price:, currencyTpl:}
            recordCard : function( count, priceParts, isFoil ) {
                if ( 'undefined' == typeof isFoil ) {
                    isFoil = false;
                }
                var record = (isFoil)?this.__current.foil:this.__current.normal;
                var time = new Date();
                record.updated = time.getTime();
                record.cardCount++;
                record.marketCount += count;
                record.priceSum += priceParts.price;
                if ( !record.currencyTpl ) {
                    record.currencyTpl = priceParts.currencyTpl;
                }
                if ( record.cardCount%2 ) {
                    record.priceGot += priceParts.gotPrice;
                }
                if ( isFoil ) {
                    this.__current.foil = record;
                } else {
                    this.__current.normal = record;
                }
            },

            _cloneRecord : function( src, dst ) {
                dst.gameId = src.gameId;
                dst.gameName = src.gameName;
                dst.normal = this.__emptyRecord();
                dst.foil = this.__emptyRecord();
                this._cloneCardList(src.normal, dst.normal);
                this._cloneCardList(src.foil, dst.foil);
                dst.toSave = src.toSave;
            },

            _cloneCardList : function( src, dst ) {
                dst.cardCount   = src.cardCount;
                dst.marketCount = src.marketCount;
                dst.priceSum    = src.priceSum;
                dst.priceGot    = src.priceGot;
                dst.currencyTpl = src.currencyTpl;
            },
        },
    },


    // ======== Actions for external use =======

    action : {
        // Refresh cards count and cost for game
        refreshCardCountForPage : function( gameId, gameName ) {
            thut._work.runPager({ initUrl: thut._render.cardList.cardListUrl( gameName ),
                                  format: 'json',
                                  delay: 3000,
                                  delayTreshold: 3000 },
                                { start: function() {
                                    thut._data.counter.loadCurrent(gameId);
                                    thut._data.counter.resetCurrent(gameId, gameName);
                                    thut._render.update.countWorkStart();
                                    return {gameId: gameId, gameName: gameName, done: false};
                                  },
                                  gotPage: thut._render.update.cardListPageScanned,
                                  isFinished: function( data ) {
                                      return data.done;
                                  },
                                  nextPageUrl: function( data, pageNum ) {
                                      return thut._render.cardList.cardListUrl( gameName, pageNum );
                                  },
                                  stop: function(data){
                                      thut._render.update.cardCounterOnPage();
                                      thut._render.update.countWorkStop();
                                      thut._data.counter.saveCurrent();
                                  },
                                });

        },

        saveCardCountForPage : function( gameId ) {
        },
    },



    // ======== Game page part =======

    // add icon-buttons for each list-item in steagift game-list
    _appendCardControl : function() {
//        this._data.list.load();
        this._render.append.commons();
        this._render.append.styles( this._styles.gamePage );
        this._render.append.cardControlForGame();
    },


    // router, append the script controls depending on page uri
    route : function() {
        if (window.location.pathname.match(/^\/app/)) {
            this._appendCardControl();
        }
    },

    };
    // === END thut ===

    var __ = function(text) {
        return thut.translate(text);
    };

    SPS_SteamCardTool.action = thut.action;

    return thut;
};

SPS_SteamCardTool().route();
