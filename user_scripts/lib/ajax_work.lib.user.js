// ==UserScript==
// @name         Ajax work lib
// @version      1.0.0
// @description  Organize page and pagelist call with callbacks
// @author       Blood_again
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js
// ==/UserScript==


SPS_AjaxWorkLib = function() {
    return {
    // work semaphores
    __workInProgress : false,
    __stopWork : false,
    // pager data
    __pagerData: {},
    __pagerParam: {},
    __pagerCallback: {},

    // Run page request sequence.
    // param : { initUrl: first page url
    //           initParams : first page params
    //           format:  response format expected
    //           delay:   min delay value
    //           delayTreshold : increment delay value  (summary delay will be random from (delay) to (delay+delayTreshold)
    //         }
    // callback: { start() - call on start, return data,
    //             gotPage(data,response,pagenum) - call for each page, return data,
    //             isFinished(data) - call for each page, return bool,
    //             nextPageUrl(data, pagenum) - call before new page, return string,
    //             nextPageParams(data, pagenum) - call before new page, return object
    //             success(data, pagenum) - call after isFinished confirm,
    //             error(data, pagenum) - call on stopwork flag,
    //             stop(data) - call for both success or error
    //           }
    runPager : function( param, callback, asPost ) {
        if ( false === this._workStart() ) {
            this.__stopWork = true;
            return;
        }
        this.__pagerCallback = callback;
        this.__pagerParam = param;
        var initParams = {};
        if ( 'undefined' != typeof param.initParams ) {
            initParams = param.initParams;
        }
        // call .start and get the initial inner-data
        this.__pagerData = this.__callbackSafe(this.__pagerCallback.start, null);
        // run the first page request
        this.__actPage( param.initUrl, 1, initParams, asPost );
    },

    // iterate one page of pager process
    __actPage : function( url, pageNum, params, asPost ) {
        var that = this;
        $.ajax({type: (asPost?'POST':'GET'),
                url: url,
                data: params,
                    success: function( data ) {
                    // call .gotPage with response
                    that.__pagerData = that.__callbackSafe(that.__pagerCallback.gotPage, that.__pagerData, that.__pagerData, data, pageNum );
                    if ( that.__callbackSafe(that.__pagerCallback.isFinished, that.__pagerData, that.__pagerData ) ) {
                        // final page is reached, call .success and .stop
                        that.__callbackSafe(that.__pagerCallback.success, null, that.__pagerData, pageNum );
                        that.__callbackSafe(that.__pagerCallback.stop, null, that.__pagerData );
                        that._workStop();
                        return;
                    }
                    if ( that.__stopWork ) {
                        // stop work requested, call .error and .stop
                        that.__callbackSafe(that.__pagerCallback.error, null, that.__pagerData, pageNum );
                        that.__callbackSafe(that.__pagerCallback.stop, null, that.__pagerData );
                        that._workStop();
                        return;
                    }
                    // prepare data for next page request (.nextPageUrl and delays)
                    pageNum++;
                    url = that.__callbackSafe(that.__pagerCallback.nextPageUrl, url, that.__pagerData, pageNum );
                    params = that.__callbackSafe(that.__pagerCallback.nextPageParams, params, that.__pagerData, params, pageNum );
                    var delay = that.__pagerParam.delay + that.__pagerParam.delay * Math.random();
                    setTimeout( function(){ that.__actPage( url, pageNum, params, asPost ); }, delay);
                },
                dataType: that.__pagerParam.format
               });
    },

    // Call the function with param, if defined
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

    // Set work as started
    // return false, if already started
    _workStart : function() {
        if ( this.__workInProgress ) {
            return false;
        }
        this.__workInProgress = true;
        return true;
    },

    // Set work state as stopped
    _workStop : function() {
        this.__workInProgress = false;
        this.__stopWork = false;
    },
    };
};